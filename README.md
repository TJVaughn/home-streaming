# home-streaming

Live home security camera system with object detection and push notifications.

## Architecture

```
Raspberry Pi
  rpicam-vid → TCP:2222 (ncat)
                    ↓
              Go server
  ffmpeg pulls TCP stream → mediamtx (RTSP/WebRTC)
  Python processor reads RTSP → YOLOv8 detection
                    ↓                    ↓
           Next.js browser         clips + ntfy
```

- **Cameras**: Raspberry Pi cameras streaming raw H264 over TCP via `rpicam-vid`
- **Go server**: pulls camera streams via ffmpeg, serves them through [mediamtx](https://github.com/bluenviron/mediamtx) as WebRTC/WHEP
- **Client**: Next.js app that displays live streams via WebRTC in the browser
- **Python processor**: reads RTSP streams, runs YOLOv8n detection at 1fps, saves detection clips and 1fps continuous frames to disk, sends push notifications via [ntfy](https://ntfy.sh)

## Requirements

- Go 1.21+
- Node.js 18+
- Python 3.10+
- ffmpeg
- ncat (on Raspberry Pi)

## Setup

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

```
CAM1_IP=192.168.x.x     # IP of first Raspberry Pi
CAM2_IP=192.168.x.x     # IP of second Raspberry Pi
NTFY_URL=https://ntfy.sh/your-topic-here
```

Install Python dependencies:

```bash
cd python-processor
pip install -r requirements.txt
```

## Running

Source your `.env` and start the Go server (which starts everything):

```bash
cd go-server
source ../.env && go run main.go
```

This starts:
- mediamtx (RTSP/WebRTC server)
- ffmpeg instances pulling from each camera
- Next.js client at `http://localhost:3000`
- Python processor for detection and recording

## Raspberry Pi setup

On each Pi, run `raspi/on-reboot.sh` on boot. It streams the camera over TCP with auto-restart:

```bash
bash raspi/on-reboot.sh
```

To run on boot, add it to crontab:

```bash
@reboot /bin/bash /path/to/raspi/on-reboot.sh
```

The Pi must be running the latest Raspberry Pi OS (Bookworm). `rpicam-vid` must be available at `/usr/bin/rpicam-vid`.

## Detection

YOLOv8n detects the following by default:

`person` `car` `truck` `motorcycle` `bicycle` `dog` `cat` `bear` `bird`

Edit `DETECT_CLASSES` in `python-processor/main.py` to add or remove classes. The full list of detectable objects is the [COCO dataset](https://github.com/ultralytics/ultralytics/blob/main/ultralytics/cfg/datasets/coco.yaml) (80 classes).

## Output

```
outputs/
  frames/
    cam-1/
      YYYY-MM-DD/
        HH-MM-SS.jpg    # continuous 1fps snapshots
  clips/
    cam-1/
      YYYY-MM-DD_HH-MM-SS.mp4   # detection clips (5s pre + event + 5s post)
  detections.db         # SQLite log of all detection events
```

Frames older than 7 days and clips older than 30 days are pruned automatically.

## Notifications

Push notifications are sent via [ntfy](https://ntfy.sh). Install the ntfy app on your phone and subscribe to your topic.
