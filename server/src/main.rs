use std::{fs, io::Read};

use actix_cors::Cors;
use actix_http::{
    error::PayloadError,
    ws::{Codec, Message, ProtocolError},
};
use actix_web::{
    dev::WebService,
    http,
    rt::net::TcpStream,
    web::{self, Bytes},
    App, HttpRequest, HttpResponse, HttpServer, Responder,
};
use actix_web_actors::ws::WebsocketContext;
use futures::{io, stream::once};

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        let cors = Cors::default()
            .allowed_origin("http://localhost:3000")
            .allowed_origin_fn(|origin, _req_head| origin.as_bytes().ends_with(b".rust-lang.org"))
            .allowed_methods(vec!["GET", "POST", "PUT", "DELETE"])
            .allowed_headers(vec![http::header::AUTHORIZATION, http::header::ACCEPT])
            .allowed_header(http::header::CONTENT_TYPE)
            .max_age(3600);

        return App::new()
            .wrap(cors)
            .route("/stream", web::get().to(send_stream));
    })
    .bind(("127.0.0.1", 8082))?
    .run()
    .await
}

// GET stream
async fn send_stream(// session: web::Path<(String, String)>,
    // req: HttpRequest,
    // stream: web::Payload,
    // state: web::Data<AppState>,
) -> impl Responder {
    let data = fs::read("./assets/new-stream.mp4").unwrap();
    let bytes = Bytes::from(data);

    // let stream = TcpStream::connect("192.168.0.50:2222").await.unwrap();
    // let mut msg = vec![0; 1024];
    // let codec = Codec::new().max_size(1_000_000);
    // let chat = state.chat.clone();
    // let actor = WsChatSession::new(chat, room, email);
    return HttpResponse::Ok()
        // .streaming(stream.bytes());
        // .streaming(WebsocketContext::with_codec(actor, msg, codec));
        .streaming(once(async move { Ok::<_, std::io::Error>(bytes) }));
    // loop {
    //     // Wait for the socket to be readable

    //     // stream.readable().await.unwrap();

    //     // Try to read data, this may still fail with `WouldBlock`
    //     // if the readiness event is a false positive.

    //     match data.try_read(&mut msg) {
    //         Ok(n) => {
    //             msg.truncate(n);
    //             let bytes = Bytes::from(msg);
    //             println!("{} bytes read", n);

    //             return HttpResponse::Ok()
    //                 // .streaming(WebsocketContext::with_codec(actor, msg, codec));
    //                 // .streaming(once(async move { Ok::<_, std::io::Error>(bytes) }));
    //                 .streaming(data);

    //             // break;
    //         }
    //         Err(ref e) if e.kind() == io::ErrorKind::WouldBlock => {
    //             continue;
    //         }
    //         Err(_e) => {
    //             println!("error");
    //             return HttpResponse::ServiceUnavailable().json("error");
    //         }
    //     }
    // }
}
