#!/bin/bash
while true; do
    /usr/bin/rpicam-vid --nopreview --inline --timeout 0 --codec h264 \
        --width 1280 --height 720 --framerate 30 --bitrate 1000000 \
        -o - | /usr/bin/ncat -lkv4 2222
    echo "Stream exited, restarting in 2s..."
    sleep 2
done
