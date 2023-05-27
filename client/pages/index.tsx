import { useCallback, useEffect, useState } from "react";
import ReactPlayer from "react-player/lazy";
import useWebSocket, { ReadyState } from "react-use-websocket";

export default function Home() {
    const [show, setShow] = useState(false);
    const stream1Url = "http://192.168.0.140:8889/cam";
    const stream2Url = "http://192.168.0.140:8889/cam-2";

    useEffect(() => {
        // const canPlay = ReactPlayer.canPlay(stream1Url);
        // console.log(canPlay);
        setTimeout(() => {
            setShow(true);
        }, 500);
    });
    //
    if (!show) {
        return null;
    }

    const vidHeight = screen.height / 2.5;
    const vidWidth = screen.width - 150;

    return (
        <div>
            <h1>Videos</h1>
            <div className="flex flex-row items-center ">
                <iframe height={vidHeight} width={vidWidth} src={stream2Url} ></iframe>
                <iframe height={vidHeight} width={vidWidth} src={stream1Url} ></iframe>
            </div>
        </div>
    );
}

export const WebSocketDemo = () => {
    //Public API that will echo messages sent to it back to the client
    // const [socketUrl, setSocketUrl] = useState("ws://localhost:8083/ws/");
    const [socketUrl, setSocketUrl] = useState("ws://localhost:8083/ws");

    const [messageHistory, setMessageHistory] = useState<any[]>([]);

    const { sendMessage, lastMessage, readyState } = useWebSocket(socketUrl);

    useEffect(() => {
        if (lastMessage !== null) {
            setMessageHistory((prev) => {
                prev.push(lastMessage);

                return [...prev];
            });
        }
    }, [lastMessage, setMessageHistory]);

    const handleClickChangeSocketUrl = useCallback(
        () => setSocketUrl("wss://demos.kaazing.com/echo"),
        []
    );

    const handleClickSendMessage = useCallback(() => sendMessage("Hello"), []);

    const connectionStatus = {
        [ReadyState.CONNECTING]: "Connecting",
        [ReadyState.OPEN]: "Open",
        [ReadyState.CLOSING]: "Closing",
        [ReadyState.CLOSED]: "Closed",
        [ReadyState.UNINSTANTIATED]: "Uninstantiated",
    }[readyState];

    const handleGetStream = async () => {
        try {
            const response = await fetch("http://localhost:8083/stream");
            console.log(response);
        } catch (error) {
            console.log(error);
        }
    };
    return (
        <div>
            <button onClick={handleGetStream}>get stream</button>
            <br />
            <br />

            <button onClick={handleClickChangeSocketUrl}>
                Click Me to change Socket Url
            </button>
            <br />
            <br />

            <button
                onClick={handleClickSendMessage}
                disabled={readyState !== ReadyState.OPEN}
            >
                Click Me to send {'Hello'}
            </button>
            <br />
            <br />

            <span>The WebSocket is currently {connectionStatus}</span>
            {lastMessage ? <span>Last message: {lastMessage.data}</span> : null}
            <br />
            <br />

            <ul>
                {messageHistory.map((message, idx) => (
                    <span key={idx}>{message ? message.data : null}</span>
                ))}
            </ul>
        </div>
    );
};
