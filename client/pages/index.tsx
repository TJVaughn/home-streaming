import { useEffect, useState } from "react";
import Link from "next/link";
import WHEPClient from "../utils/WHEPClient";

export default function Home() {
    const [show, setShow] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            new WHEPClient("1");
            new WHEPClient("2");
            setShow(true);
        }, 200);
    });

    if (!show) {
        return null;
    }

    const vidArr = ["1", "2"];
    const vidMap = vidArr.map((vid) => (
        <video
            key={vid}
            width={"100%"}
            autoPlay
            id={`video-${vid}`}
            muted
            controls
        />
    ));

    return (
        <div className="min-h-screen bg-black">
            <nav className="flex items-center gap-6 px-6 py-4 bg-gray-900 border-b border-gray-800">
                <span className="text-white font-medium">● Live</span>
                <Link href="/events" className="text-gray-400 hover:text-white transition-colors">
                    Detection Events
                </Link>
            </nav>
            <div className={`video-container`}>
                {vidMap}
            </div>
        </div>
    );
}
