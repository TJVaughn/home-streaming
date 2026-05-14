# home-streaming

Live home security camera system with object detection, clip recording, and push notifications.

## Architecture

```
Raspberry Pi
  rpicam-vid → TCP:2222 (ncat)
                    ↓
              Go server
  ffmpeg pulls TCP stream → mediamtx (RTSP/WebRTC)
                                ↓              ↓
                        Browser (WHEP)   Python processor
                        live stream      YOLOv8 detection
                                              ↓
                                    clips + frames + SQLite + ntfy
                                              ↓
                                      Next.js events viewer
```

- **Cameras**: Raspberry Pi cameras streaming raw H.264 over TCP via `rpicam-vid`
- **Go server**: pulls streams via ffmpeg, serves through [mediamtx](https://github.com/bluenviron/mediamtx) as RTSP/WebRTC
- **Client**: Next.js app — live streams via WebRTC, detection events viewer, access log
- **Python processor**: reads RTSP, runs YOLOv8n detection at 1fps, saves H.264 clips, sends push notifications via [ntfy](https://ntfy.sh)

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
CAM1_IP=192.168.x.x        # IP of first Raspberry Pi
CAM2_IP=192.168.x.x        # IP of second Raspberry Pi
NTFY_URL=https://ntfy.sh/your-topic-here

# Required only when exposing port 3000 outside your network
APP_PASSWORD=choose-a-strong-password
APP_SECRET=                 # generate with: openssl rand -hex 32
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

To run on boot, add to crontab:

```bash
@reboot /bin/bash /path/to/raspi/on-reboot.sh
```

The Pi must be running Raspberry Pi OS Bookworm. `rpicam-vid` must be available at `/usr/bin/rpicam-vid`.

## Detection

YOLOv8n detects the following by default:

`person` `car` `truck` `motorcycle` `bicycle` `dog` `cat` `bear` `bird`

Edit `DETECT_CLASSES` in `python-processor/main.py` to add or remove classes. The full list is the [COCO dataset](https://github.com/ultralytics/ultralytics/blob/main/ultralytics/cfg/datasets/coco.yaml) (80 classes).

Each detection event records the camera, timestamp, detected classes, confidence, and a clip of the event. Clips include 5 seconds before and after the detection window.

## Output

```
outputs/
  frames/
    cam-1/
      YYYY-MM-DD/
        HH-MM-SS.jpg          # continuous 1fps snapshots
  clips/
    cam-1/
      YYYY-MM-DD_HH-MM-SS.mp4 # detection clips (H.264, browser-playable)
  detections.db               # SQLite: detections + access log
```

Frames older than 7 days and clips older than 30 days are pruned automatically. Clips can be marked as protected from the UI to exempt them from pruning.

## Client pages

| Page | Path |
|---|---|
| Live streams | `/` |
| Detection events | `/events` |
| Access log | `/access-log` |

## Remote access

To access the app outside your local network, port-forward **3000** on your router and set `APP_PASSWORD` and `APP_SECRET` in `.env`.

Requests from local IPs (192.168.x.x, 10.x.x.x, etc.) bypass authentication automatically. Remote requests require a password and receive a 7-day session cookie. All remote access attempts and login events are logged and viewable at `/access-log`.

To log out remotely, visit `/api/logout`.

Note: live video streams (port 8889, WebRTC) are separate from the Next.js app. Port-forwarding 3000 gives access to the events viewer and clips but not the live stream.

## Notifications

Push notifications are sent via [ntfy](https://ntfy.sh). Install the ntfy app on your phone and subscribe to your topic.
