import collections
import json
import os
import shutil
import sqlite3
import subprocess
import threading
import time
from datetime import datetime, timedelta
from pathlib import Path

import cv2
import numpy as np
import requests
from ultralytics import YOLO

CAMERAS = {
    "cam-1": "rtsp://localhost:8554/cam-1",
    "cam-2": "rtsp://localhost:8554/cam-2",
}
OUTPUT_DIR = Path("../outputs")
NTFY_URL = os.getenv("NTFY_URL", "https://ntfy.sh/your-home-cam-topic")
DETECT_CLASSES = {"person", "car", "dog", "cat", "bicycle", "motorcycle", "truck", "bear", "bird"}
SILENT_CLASSES = {"car", "truck"}
FRAME_RETAIN_DAYS = 1
CLIP_RETAIN_DAYS = 7
CONTINUOUS_RETAIN_HOURS = 12
DETECT_FPS = 1
PRE_BUFFER_SECS = 5
POST_DETECT_SECS = 5
CONFIDENCE_THRESHOLD = 0.65


class DB:
    def __init__(self, path: Path):
        path.parent.mkdir(parents=True, exist_ok=True)
        self._path = str(path)
        with sqlite3.connect(self._path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS detections (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    camera TEXT NOT NULL,
                    started_at TEXT NOT NULL,
                    classes TEXT NOT NULL,
                    max_confidence REAL NOT NULL,
                    clip_path TEXT,
                    protected INTEGER DEFAULT 0
                )
            """)
            try:
                conn.execute("ALTER TABLE detections ADD COLUMN protected INTEGER DEFAULT 0")
            except sqlite3.OperationalError:
                pass  # column already exists

    def log(self, camera: str, started_at: datetime, classes: list, confidence: float, clip_path: str | None):
        with sqlite3.connect(self._path) as conn:
            conn.execute(
                "INSERT INTO detections (camera, started_at, classes, max_confidence, clip_path) "
                "VALUES (?, ?, ?, ?, ?)",
                (camera, started_at.isoformat(), json.dumps(sorted(classes)), confidence, clip_path),
            )

    def is_protected(self, clip_filename: str) -> bool:
        with sqlite3.connect(self._path) as conn:
            row = conn.execute(
                "SELECT 1 FROM detections WHERE clip_path LIKE ? AND protected = 1",
                (f"%{clip_filename}%",),
            ).fetchone()
        return row is not None


class CameraProcessor:
    def __init__(self, name: str, url: str, db: DB):
        self.name = name
        self.url = url
        self.db = db
        self.model = YOLO("yolov8n.pt")
        (OUTPUT_DIR / "frames" / name).mkdir(parents=True, exist_ok=True)
        (OUTPUT_DIR / "clips" / name).mkdir(parents=True, exist_ok=True)

    def run(self):
        while True:
            try:
                self._stream()
            except Exception as e:
                print(f"[{self.name}] {e}, retrying in 5s")
                time.sleep(5)

    def _stream(self):
        cap = cv2.VideoCapture(self.url)
        if not cap.isOpened():
            raise RuntimeError(f"cannot open {self.url}")

        stream_fps = cap.get(cv2.CAP_PROP_FPS) or 30
        detect_every = max(1, int(stream_fps / DETECT_FPS))
        pre_buf: collections.deque = collections.deque(maxlen=int(stream_fps * PRE_BUFFER_SECS))

        frame_n = 0
        last_frame_write = 0.0
        h = w = 0

        detecting = False
        last_det_time = 0.0
        det_classes: list = []
        det_confidence = 0.0
        det_started: datetime | None = None
        writer: cv2.VideoWriter | None = None
        clip_path: str | None = None

        print(f"[{self.name}] connected")

        while True:
            ret, frame = cap.read()
            if not ret:
                break

            now = time.time()
            frame_n += 1

            if h == 0:
                h, w = frame.shape[:2]

            # write 1fps frames to disk continuously
            if now - last_frame_write >= 1.0:
                day_dir = OUTPUT_DIR / "frames" / self.name / datetime.now().strftime("%Y-%m-%d")
                day_dir.mkdir(exist_ok=True)
                cv2.imwrite(str(day_dir / f"{datetime.now().strftime('%H-%M-%S')}.jpg"), frame)
                last_frame_write = now

            # keep ring buffer as JPEG bytes to avoid holding ~400MB of raw frames
            _, enc = cv2.imencode(".jpg", frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
            pre_buf.append(enc.tobytes())

            if detecting and writer:
                writer.write(frame)

            if frame_n % detect_every != 0:
                continue

            detections = self._detect(frame)

            if detections:
                classes = [d["class"] for d in detections]
                conf = max(d["conf"] for d in detections)
                last_det_time = now
                det_confidence = max(det_confidence, conf)
                for c in classes:
                    if c not in det_classes:
                        det_classes.append(c)

                if not detecting:
                    detecting = True
                    det_started = datetime.now()
                    clip_path = str(
                        OUTPUT_DIR / "clips" / self.name
                        / f"{det_started.strftime('%Y-%m-%d_%H-%M-%S')}.mp4"
                    )
                    writer = cv2.VideoWriter(
                        clip_path, cv2.VideoWriter_fourcc(*"mp4v"), stream_fps, (w, h)
                    )
                    for jpeg in pre_buf:
                        writer.write(cv2.imdecode(np.frombuffer(jpeg, np.uint8), cv2.IMREAD_COLOR))

            elif detecting and (now - last_det_time) >= POST_DETECT_SECS:
                if writer:
                    writer.release()
                    writer = None
                    self._reencode(clip_path)

                self.db.log(self.name, det_started, det_classes, det_confidence, clip_path)
                if not all(c in SILENT_CLASSES for c in det_classes):
                    self._notify(det_classes, det_confidence)
                print(f"[{self.name}] saved: {det_classes} conf={det_confidence:.2f} -> {clip_path}")

                detecting = False
                det_classes = []
                det_confidence = 0.0
                det_started = None
                clip_path = None

        cap.release()
        if writer:
            writer.release()

    def _reencode(self, clip_path: str | None):
        if not clip_path:
            return
        tmp = clip_path + ".tmp"
        try:
            os.rename(clip_path, tmp)
            result = subprocess.run(
                ["ffmpeg", "-i", tmp, "-c:v", "libx264", "-crf", "23",
                 "-preset", "fast", "-movflags", "+faststart", "-y", clip_path],
                capture_output=True, text=True,
            )
            if result.returncode != 0:
                raise RuntimeError(result.stderr[-500:])
            os.unlink(tmp)
        except Exception as e:
            print(f"[{self.name}] re-encode failed: {e}")
            if os.path.exists(tmp):
                os.rename(tmp, clip_path)

    def _detect(self, frame) -> list:
        results = self.model(frame, verbose=False, device="cpu")[0]
        out = []
        for box in results.boxes:
            cls = results.names[int(box.cls)]
            conf = float(box.conf)
            if cls in DETECT_CLASSES and conf >= CONFIDENCE_THRESHOLD:
                out.append({"class": cls, "conf": conf})
        return out

    def _notify(self, classes: list, confidence: float):
        try:
            requests.post(
                NTFY_URL,
                data=f"Detected {', '.join(classes)} ({confidence:.0%})",
                headers={"Title": f"Motion - {self.name}"},
                timeout=5,
            )
        except Exception as e:
            print(f"[{self.name}] notify failed: {e}")


def prune(output_dir: Path, db: DB):
    frame_cutoff = datetime.now() - timedelta(days=FRAME_RETAIN_DAYS)
    clip_cutoff = datetime.now() - timedelta(days=CLIP_RETAIN_DAYS)
    cont_cutoff = datetime.now() - timedelta(hours=CONTINUOUS_RETAIN_HOURS)

    for day_dir in (output_dir / "frames").glob("*/????-??-??"):
        try:
            if datetime.strptime(day_dir.name, "%Y-%m-%d") < frame_cutoff:
                shutil.rmtree(day_dir)
                print(f"pruned frames {day_dir}")
        except ValueError:
            pass

    for clip in (output_dir / "clips").glob("**/*.mp4"):
        try:
            if datetime.strptime(clip.stem[:10], "%Y-%m-%d") < clip_cutoff:
                if db.is_protected(clip.name):
                    print(f"skipped protected clip {clip}")
                else:
                    clip.unlink()
                    print(f"pruned clip {clip}")
        except ValueError:
            pass

    for seg in (output_dir / "continuous").glob("*/*.mp4"):
        try:
            if datetime.strptime(seg.stem, "%Y-%m-%d_%H-%M-%S") < cont_cutoff:
                seg.unlink()
                print(f"pruned continuous {seg}")
        except ValueError:
            pass


def pruner_loop(output_dir: Path, db: DB):
    while True:
        prune(output_dir, db)
        time.sleep(24 * 60 * 60)


def main():
    OUTPUT_DIR.mkdir(exist_ok=True)
    db = DB(OUTPUT_DIR / "detections.db")

    threads = [
        threading.Thread(target=CameraProcessor(name, url, db).run, name=name, daemon=True)
        for name, url in CAMERAS.items()
    ]
    threads.append(
        threading.Thread(target=pruner_loop, args=(OUTPUT_DIR, db), name="pruner", daemon=True)
    )
    for t in threads:
        t.start()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("shutting down")


if __name__ == "__main__":
    main()
