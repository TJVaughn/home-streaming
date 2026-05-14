import { useEffect, useState } from "react";
import Link from "next/link";

type DetectionEvent = {
    id: number;
    camera: string;
    started_at: string;
    classes: string[];
    max_confidence: number;
    clip_path: string | null;
    thumbnail_path: string | null;
    protected: boolean;
};

const CLASS_COLORS: Record<string, string> = {
    person: "bg-blue-600",
    car: "bg-yellow-600",
    truck: "bg-orange-600",
    bear: "bg-red-700",
    bird: "bg-green-600",
    dog: "bg-purple-600",
    cat: "bg-pink-600",
    motorcycle: "bg-cyan-600",
    bicycle: "bg-teal-600",
};

function formatTime(iso: string) {
    return new Date(iso).toLocaleString();
}

export default function Events() {
    const [events, setEvents] = useState<DetectionEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<DetectionEvent | null>(null);
    const [cameraFilter, setCameraFilter] = useState("all");

    useEffect(() => {
        fetch("/api/events")
            .then((r) => r.json())
            .then((data) => {
                setEvents(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleProtect = async (event: DetectionEvent) => {
        const newVal = !event.protected;
        await fetch("/api/protect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: event.id, protected: newVal }),
        });
        const updated = { ...event, protected: newVal };
        setEvents((prev) => prev.map((e) => (e.id === event.id ? updated : e)));
        setSelected(updated);
    };

    const cameras = ["all", ...Array.from(new Set(events.map((e) => e.camera)))];
    const filtered =
        cameraFilter === "all" ? events : events.filter((e) => e.camera === cameraFilter);

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="flex items-center gap-6 px-6 py-4 bg-gray-900 border-b border-gray-800">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    ● Live
                </Link>
                <span className="font-medium">Detection Events</span>
                <Link href="/access-log" className="text-gray-400 hover:text-white transition-colors">
                    Access Log
                </Link>
                <div className="ml-auto flex gap-2">
                    {cameras.map((cam) => (
                        <button
                            key={cam}
                            onClick={() => setCameraFilter(cam)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                cameraFilter === cam
                                    ? "bg-blue-600"
                                    : "bg-gray-800 hover:bg-gray-700"
                            }`}
                        >
                            {cam}
                        </button>
                    ))}
                </div>
            </nav>

            <div className="p-6">
                {loading && (
                    <p className="text-gray-500 text-center mt-20">Loading...</p>
                )}
                {!loading && filtered.length === 0 && (
                    <p className="text-gray-500 text-center mt-20">No detection events yet.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((event) => (
                        <div
                            key={event.id}
                            className="bg-gray-900 rounded-lg overflow-hidden border border-gray-800 hover:border-gray-600 transition-colors cursor-pointer"
                            onClick={() => setSelected(event)}
                        >
                            <div className="aspect-video bg-gray-800 relative">
                                {event.thumbnail_path && (
                                    <img
                                        src={`/api/media?file=${encodeURIComponent(event.thumbnail_path)}`}
                                        className="w-full h-full object-cover"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = "none";
                                        }}
                                    />
                                )}
                                <span className="absolute top-2 left-2 bg-black/70 text-xs px-2 py-0.5 rounded">
                                    {event.camera}
                                </span>
                                {event.protected && (
                                    <span className="absolute top-2 right-2 bg-green-700/90 text-xs px-2 py-0.5 rounded">
                                        ★ Saved
                                    </span>
                                )}
                                {event.clip_path && (
                                    <span className="absolute bottom-2 right-2 bg-black/70 text-xs px-2 py-0.5 rounded">
                                        ▶ Play
                                    </span>
                                )}
                            </div>
                            <div className="p-3">
                                <p className="text-sm text-gray-400">{formatTime(event.started_at)}</p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {event.classes.map((cls) => (
                                        <span
                                            key={cls}
                                            className={`text-xs px-2 py-0.5 rounded ${
                                                CLASS_COLORS[cls] ?? "bg-gray-600"
                                            }`}
                                        >
                                            {cls}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {Math.round(event.max_confidence * 100)}% confidence
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {selected && (
                <div
                    className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
                    onClick={() => setSelected(null)}
                >
                    <div
                        className="bg-gray-900 rounded-xl overflow-hidden max-w-3xl w-full"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {selected.clip_path ? (
                            <video
                                src={`/api/media?file=${encodeURIComponent(selected.clip_path)}`}
                                controls
                                autoPlay
                                className="w-full aspect-video bg-black"
                            />
                        ) : (
                            <div className="aspect-video bg-gray-800 flex items-center justify-center text-gray-500">
                                No clip saved
                            </div>
                        )}
                        <div className="p-4 flex items-start justify-between">
                            <div>
                                <p className="font-medium">{selected.camera}</p>
                                <p className="text-sm text-gray-400">
                                    {formatTime(selected.started_at)}
                                </p>
                                <div className="flex flex-wrap gap-1 mt-2">
                                    {selected.classes.map((cls) => (
                                        <span
                                            key={cls}
                                            className={`text-xs px-2 py-0.5 rounded ${
                                                CLASS_COLORS[cls] ?? "bg-gray-600"
                                            }`}
                                        >
                                            {cls}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-4">
                                {selected.clip_path && (
                                    <button
                                        onClick={() => handleProtect(selected)}
                                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                                            selected.protected
                                                ? "bg-green-700 hover:bg-green-600 text-white"
                                                : "bg-gray-700 hover:bg-gray-600 text-gray-200"
                                        }`}
                                    >
                                        {selected.protected ? "★ Saved" : "☆ Save clip"}
                                    </button>
                                )}
                                <button
                                    onClick={() => setSelected(null)}
                                    className="text-gray-400 hover:text-white text-2xl leading-none"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
