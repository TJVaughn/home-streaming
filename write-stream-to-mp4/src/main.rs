use std::fs::File;
use std::io::Write;

use futures::io;
// use av_format::demuxer;
use tokio::net::TcpStream;

// #[tokio::main]
// async fn main() {
// let raw_stream = TcpStream::connect("192.168.0.50:2222").await.expect("error connecting to tcp port");

// let mut buf = vec![0, 1024];

// let stream_buffer = raw_stream.try_read_buf(&mut buf).expect("couldn't read stream");

//     let demuxer_ctx = demuxer::Context::new();

//     let stream_demuxer = demuxer::Demuxer::read_headers(&mut buf, buf, info)
// }

// use av_codec::decoder::{Context as DecoderContext, Decoder};
// use av_data::packet::Packet;
// use av_format::demuxer::{Context as DemuxerContext, Demuxer};
use openh264::decoder::Decoder;
use openh264::nal_units;

#[tokio::main]

async fn main() {
    let raw_stream = TcpStream::connect("192.168.0.50:2222")
        .await
        .expect("error connecting to tcp port");

    let mut buf = vec![0; 1024];
    let mut decoder = Decoder::new().expect("unable to make decoder");
    let mut output_file =
        File::create("./assets/test.yuv").expect("what is yuv? baby don't hurt me");
    // let mut demuxer = DemuxerContext::new(demuxer, reader)

    loop {
        raw_stream.readable().await.expect("stream not readable");

        match raw_stream.try_read_buf(&mut buf) {
            Ok(0) => break,
            Ok(n) => {
                buf.truncate(n);
                for packet in nal_units(&buf) {
                    let dec_packet = decoder.decode(packet);
                    // println!("packet: {:?}", Some(&dec_packet));

                    if Some(&dec_packet).is_some() {
                        let mut o_buf: Vec<u8> = Vec::new();
                        match dec_packet {
                            Ok(Some(d)) => {
                                d.write_rgb8(&mut o_buf);
                                let (x, y) = d.dimension_rgb();
                                println!("{}, {}", x, y);
                                output_file.write(&o_buf).expect("error writing output");
                            }
                            Ok(None) => {
                                println!("none")
                            }
                            Err(e) => {
                                println!("err: {e}");
                            }
                        }
                        // pckt
                    }
                }
                // println!("bytes read: {}", n);
                // let mut demuxer = <dyn Demuxer>::read_event(&mut buf)?;
            }
            Err(ref e) if e.kind() == io::ErrorKind::WouldBlock => {
                continue;
            }
            Err(e) => {
                println!("err: {}", e);
            }
        }
    }
    // let video_stream = demuxer.streams().best_video().unwrap();

    // let mut decoder = <dyn Decoder>::find_decoder(video_stream.codec().id())?;
    // let mut decoder_context = DecoderContext::new(&decoder);
    // decoder_context.set_params(video_stream.codecpar())?;

    // let mut frame_count = 0;
    // let mut packet = Packet::empty();

    // while demuxer.read(&mut packet)? >= 0 {
    //     if packet.stream_index() == video_stream.index() {
    //         let mut frame = decoder_context.decode(&packet)?;
    //         if frame.is_some() {
    //             frame_count += 1;
    //             println!(
    //                 "Decoded frame {}: {:?}",
    //                 frame_count,
    //                 frame.unwrap().format()
    //             );
    //         }
    //     }
    // }

    // Ok(())
}
