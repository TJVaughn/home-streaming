import { useEffect, useState } from "react";
import ReactPlayer from "react-player/lazy";

export default function Home() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setShow(true);
    }, 500);
  });

  if (!show) {
    return null;
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-between p-24">
      {/* <div>Hello</div> */}
      <ReactPlayer
        playing={false}
        controls={true}
        url="http://localhost:8082/stream"
      />

      {/* <ReactPlayer
        playing={true}
        controls={true}
        url="https://www.youtube.com/watch?v=XoP7rzXNigg"
      /> */}
    </div>
  );
}
