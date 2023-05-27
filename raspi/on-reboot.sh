#!/bin/bash
/usr/bin/raspivid -n -ih -t 0 -rot 270 -w 1280 -h 720 -fps 30 -b 1000000 -o - | /usr/bin/ncat -lkv4 2222
