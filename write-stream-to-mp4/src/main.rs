use actix_web::{
    http,
    rt::net::TcpStream,
    web::{self, Bytes},
    App, HttpResponse, HttpServer, Responder,
};
use futures::{future::PollFn, io, stream::once, FutureExt};
use std::{
    fs::{self, File},
    io::Write,
    task::Poll,
    thread,
};

struct VideoFrame {
    timestamp: u64,
}

struct AudioFrame {
    timestamp: u64,
}

struct Video {
    frames: Vec<VideoFrame>,
}

struct Audio {
    frames: Vec<AudioFrame>,
}

impl Video {
    pub fn fps(&self) -> f64 {
        return match (self.frames.len(), self.frames.first(), self.frames.last()) {
            (n, Some(first), Some(last)) if n > 1 => {
                let duration = last.timestamp - first.timestamp;
                let duration_sec = duration as f64 / 1000.0;
                n as f64 / duration_sec
            }
            _ => 0.0,
        };
    }
}

#[tokio::main]
async fn main() {
    let stream = TcpStream::connect("192.168.0.50:2222").await.unwrap();
    let mut msg = vec![0; 4096];
    let mut vid_file = File::create("./assets/video.mp4").expect("error opening vid file");

    loop {
        // Wait for the socket to be readable

        stream.readable().await.unwrap();

        // Try to read data, this may still fail with `WouldBlock`
        // if the readiness event is a false positive.

        match stream.try_read(&mut msg) {
            Ok(n) => {
                msg.truncate(n);
                let bytes = Bytes::from(msg.to_owned());
                println!("{} bytes read", n);
                vid_file.write_all(&bytes).expect("Error writing");
            }
            Err(ref e) if e.kind() == io::ErrorKind::WouldBlock => {
                continue;
            }
            Err(_e) => {
                println!("error");
            }
        }
    }
}
