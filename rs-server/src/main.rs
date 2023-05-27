// use actix_cors::Cors;
use actix_web::{
    // dev::WebService,
    // http,
    rt::net::TcpStream,
    web::{self, Bytes},
    App,
    Error,
    HttpRequest,
    HttpResponse,
    HttpServer,
    // Responder,
};
// use actix_web_actors::ws::WebsocketContext;
use futures::{io, stream::once};

struct VideoStream {
    data: Vec<Bytes>,
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    HttpServer::new(|| {
        App::new()
            .route("/stream", web::get().to(send_stream))
            .app_data(VideoStream {
                data: Default::default(),
            })
    })
    .bind(("127.0.0.1", 8083))?
    .run()
    .await
}

// impl VideoStream {
//     fn push_b(&mut self, d: Bytes) {
//         self.push(d);
//     }
// }

async fn start_stream(req: HttpRequest, state: &mut web::Data<VideoStream>) -> bool {
    let mut msg = vec![0; 1024];
    let raw_stream = TcpStream::connect("192.168.0.50:2222").await.unwrap();

    loop {
        raw_stream.readable().await.unwrap();
        match raw_stream.try_read(&mut msg) {
            Ok(n) => {
                msg.truncate(n);
                let bytes = Bytes::from(msg.to_owned());

                state.data.push(bytes);
                // let bytes_res = Ok::<_, std::io::Error>(bytes);
                // let stream = once(async move { bytes_res.map_err(PayloadError::from) });
                // let resp = ws::start(MyWs {}, &req, stream);
                // return resp;
            }
            Err(ref e) if e.kind() == io::ErrorKind::WouldBlock => {
                continue;
            }
            Err(e) => {
                println!("error: {e}");
                // return HttpResponse::ServiceUnavailable().json("error");
            }
        }
    }
}

// GET stream
async fn send_stream(
    // session: web::Path<(String, String)>,
    req: HttpRequest,
    // stream: web::Payload,
    // state: web::Data<AppState>,
) -> Result<HttpResponse, Error> {
    // let data = fs::read("./assets/new-stream.mp4").unwrap();
    // let bytes = Bytes::from(data);
    let mut msg = vec![0; 1024];
    let raw_stream = TcpStream::connect("192.168.0.50:2222").await.unwrap();

    loop {
        raw_stream.readable().await.unwrap();
        match raw_stream.try_read(&mut msg) {
            Ok(n) => {
                msg.truncate(n);
                let bytes = Bytes::from(msg.to_owned());

                // let bytes_res = Ok::<_, std::io::Error>(bytes);
                // let stream = once(async move { bytes_res.map_err(PayloadError::from) });
                // let resp = ws::start(MyWs {}, &req, stream);
                // return resp;
                HttpResponse::Ok().streaming(once(async move { Ok::<_, std::io::Error>(bytes) }));
            }
            Err(ref e) if e.kind() == io::ErrorKind::WouldBlock => {
                continue;
            }
            Err(e) => {
                println!("error: {e}");
                // return HttpResponse::ServiceUnavailable().json("error");
            }
        }
    }
}
