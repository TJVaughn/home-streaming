import { useEffect, useState } from "react";
import WHEPClient from "../utils/WHEPClient";
import axios, { AxiosResponse } from "axios";

const getOptions = async (url: string) => {
    const res = await axios({
        url,
        method: "OPTIONS",
    });
    // console.log(res);
    return res;
};
const createPeerConnection = async (options: any) => {
    if (options && options.headers) {
        console.log(options.headers.get("Link"));
    }
};
const createVideoElement = async (url: string) => {
    const options = await getOptions(url);

    const peerConn = await createPeerConnection(options);
};

export default function Home() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            new WHEPClient("1");
            new WHEPClient("2");
            // new WHEPClient("3");
            setShow(true);
        }, 200);
    });

    if (!show) {
        return null;
    }

    const screenRatioHW = screen.height / screen.width;

    // const vidHeight = screenRatioHW < 1.0 ? screen.height / 2.5 + 90 : screen.height / 2 - 250;
    // const vidWidth = screenRatioHW < 1.0 ? screen.width - 150 : screen.width - 20;

    // const vidArr = ["1", "2", "3"];
    const vidArr = ["1", "2"];
    const vidMap = vidArr.map((vid) => {
        if (screenRatioHW < 1) {
            return (
                <video
                    key={vid}
                    width={"100%"}
                    autoPlay={screenRatioHW > 1 ? false : true}
                    id={`video-${vid}`}
                    muted
                    controls={true}
                ></video>
            );
        }
        if (vid == "2") {
            return (
                <video
                    key={vid}
                    width={"100%"}
                    autoPlay={false}
                    id={`video-2`}
                    muted
                    controls={true}
                ></video>
            );
        }

        return null;
    });

    return (
        <div>
            <div className={`video-container`}>
                {vidMap}
                {screenRatioHW}
            </div>
        </div>
    );
}
