const net = require("net");
const fs = require("fs");
const path = require("path");
const exec = require("child_process").exec;


const handleStdOut = (error, stdout, stderr) => {
    if (error) console.log(error);

    if (stderr) console.log('stderr: ', stderr);

    var filename = /from \'(.*)\'/.exec(stdout) || []
        , title = /(INAM|title)\s+:\s(.+)/.exec(stdout) || []
        , artist = /artist\s+:\s(.+)/.exec(stdout) || []
        , album = /album\s+:\s(.+)/.exec(stdout) || []
        , track = /track\s+:\s(.+)/.exec(stdout) || []
        , date = /date\s+:\s(.+)/.exec(stdout) || []
        , is_synched = (/start: 0.000000/.exec(stdout) !== null)
        , duration = /Duration: (([0-9]+):([0-9]{2}):([0-9]{2}).([0-9]+))/.exec(stdout) || []

        , container = /Input #0, ([a-zA-Z0-9]+),/.exec(stdout) || []
        , video_bitrate = /bitrate: ([0-9]+) kb\/s/.exec(stdout) || []
        , video_stream = /Stream #([0-9\.]+)([a-z0-9\(\)\[\]]*)[:] Video/.exec(stdout) || []
        , video_codec = /Video: ([\w]+)/.exec(stdout) || []
        , resolution = /(([0-9]{2,5})x([0-9]{2,5}))/.exec(stdout) || []
        , pixel = /[SP]AR ([0-9\:]+)/.exec(stdout) || []
        , aspect = /DAR ([0-9\:]+)/.exec(stdout) || []
        , fps = /([0-9\.]+) (fps|tb\(r\))/.exec(stdout) || []

        , audio_stream = /Stream #([0-9\.]+)([a-z0-9\(\)\[\]]*)[:] Audio/.exec(stdout) || []
        , audio_codec = /Audio: ([\w]+)/.exec(stdout) || []
        , sample_rate = /([0-9]+) Hz/i.exec(stdout) || []
        , channels = /Audio:.* (stereo|mono)/.exec(stdout) || []
        , audio_bitrate = /Audio:.* ([0-9]+) kb\/s/.exec(stdout) || []
        , rotate = /rotate[\s]+:[\s]([\d]{2,3})/.exec(stdout) || [];
    // Build return object
    var ret = {
        filename: filename[1] || ''
        , title: title[2] || ''
        , artist: artist[1] || ''
        , album: album[1] || ''
        , track: track[1] || ''
        , date: date[1] || ''
        , synched: is_synched
        , duration: {
            raw: duration[1] || ''
            , seconds: duration[1] ? utils.durationToSeconds(duration[1]) : 0
        }
        , video: {
            container: container[1] || ''
            , bitrate: (video_bitrate.length > 1) ? parseInt(video_bitrate[1], 10) : 0
            , stream: video_stream.length > 1 ? parseFloat(video_stream[1]) : 0.0
            , codec: video_codec[1] || ''
            , resolution: {
                w: resolution.length > 2 ? parseInt(resolution[2], 10) : 0
                , h: resolution.length > 3 ? parseInt(resolution[3], 10) : 0
            }
            , resolutionSquare: {}
            , aspect: {}
            , rotate: rotate.length > 1 ? parseInt(rotate[1], 10) : 0
            , fps: fps.length > 1 ? parseFloat(fps[1]) : 0.0
        }
        , audio: {
            codec: audio_codec[1] || ''
            , bitrate: audio_bitrate[1] || ''
            , sample_rate: sample_rate.length > 1 ? parseInt(sample_rate[1], 10) : 0
            , stream: audio_stream.length > 1 ? parseFloat(audio_stream[1]) : 0.0
            , channels: {
                raw: channels[1] || ''
                , value: (channels.length > 0) ? ({ stereo: 2, mono: 1 }[channels[1]] || 0) : ''
            }
        }
    };

    console.log(ret);
}
const http = require("http");

const readTcpStream = () => {
    let packets = 0;
    console.log("reading");
    exec(`ffmpeg -i tcp://192.168.0.184:2222 -f rtsp -c copy rtsp://localhost:8554/cam`, handleStdOut);
    return;

    const host = "192.168.0.184";
    const tcpClient = new net.Socket();

    tcpClient.connect(2222, host, () => {
        console.log("connected to tcp port 2222 on 184");
    });

    tcpClient.on('data', (d) => {
        packets++;
        // console.log("received data", packets);
        if (packets == 50) {
            let bytes = 0;
            for (const byte of d) {
                bytes++;
                // console.log(byte);
            }
            console.log(bytes);
            console.log(d[0])
            console.log(d.values().next());
        }
        // fs.appendFileSync(path.join(__dirname, "/video-dump.mp4"), d);

    });

    tcpClient.on('close', () => {
        console.log("closed connection");
    });

    setTimeout(() => {
        console.log(packets);
        process.exit();
    }, 1000);
}

readTcpStream();



