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

function Pagination({
    page,
    totalPages,
    total,
    onPrev,
    onNext,
}: {
    page: number;
    totalPages: number;
    total: number;
    onPrev: () => void;
    onNext: () => void;
}) {
    return (
        <div className="flex items-center gap-3 text-sm text-gray-400">
            <button
                onClick={onPrev}
                disabled={page <= 1}
                className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                ← Prev
            </button>
            <span>
                Page {page} of {totalPages}
                <span className="ml-2 text-gray-500">({total} events)</span>
            </span>
            <button
                onClick={onNext}
                disabled={page >= totalPages}
                className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
                Next →
            </button>
        </div>
    );
}

export default function Events() {
    const [events, setEvents] = useState<DetectionEvent[]>([]);
    const [cameras, setCameras] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<DetectionEvent | null>(null);
    const [camera, setCamera] = useState("all");
    const [date, setDate] = useState("");
    const [savedOnly, setSavedOnly] = useState(false);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    useEffect(() => {
        setLoading(true);
        const params = new URLSearchParams();
        params.set("page", String(page));
        if (camera !== "all") params.set("camera", camera);
        if (date) params.set("date", date);
        if (savedOnly) params.set("saved", "true");

        fetch(`/api/events?${params}`)
            .then((r) => r.json())
            .then((data) => {
                setEvents(data.events ?? []);
                setCameras(data.cameras ?? []);
                setTotalPages(data.totalPages ?? 1);
                setTotal(data.total ?? 0);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [page, camera, date, savedOnly]);

    const handleCameraChange = (c: string) => {
        setCamera(c);
        setPage(1);
    };
    const handleDateChange = (d: string) => {
        setDate(d);
        setPage(1);
    };
    const handleSavedToggle = () => {
        setSavedOnly((s) => !s);
        setPage(1);
    };

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

    const allCameras = ["all", ...cameras];

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
            </nav>

            <div className="flex flex-wrap items-center gap-3 px-6 py-3 bg-gray-900 border-b border-gray-800">
                <div className="flex gap-2">
                    {allCameras.map((cam) => (
                        <button
                            key={cam}
                            onClick={() => handleCameraChange(cam)}
                            className={`px-3 py-1 rounded text-sm transition-colors ${
                                camera === cam
                                    ? "bg-blue-600"
                                    : "bg-gray-800 hover:bg-gray-700"
                            }`}
                        >
                            {cam}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => handleDateChange(e.target.value)}
                        className="bg-gray-800 text-white text-sm px-3 py-1 rounded border border-gray-700 focus:outline-none focus:border-gray-500"
                    />
                    {date && (
                        <button
                            onClick={() => handleDateChange("")}
                            className="text-gray-400 hover:text-white text-sm"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <button
                    onClick={handleSavedToggle}
                    className={`px-3 py-1 rounded text-sm transition-colors ${
                        savedOnly ? "bg-green-700 hover:bg-green-600" : "bg-gray-800 hover:bg-gray-700"
                    }`}
                >
                    ★ Saved only
                </button>
            </div>

            <div className="p-6">
                {total > 0 && (
                    <div className="mb-4">
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            onPrev={() => setPage((p) => p - 1)}
                            onNext={() => setPage((p) => p + 1)}
                        />
                    </div>
                )}

                {loading && (
                    <p className="text-gray-500 text-center mt-20">Loading...</p>
                )}
                {!loading && events.length === 0 && (
                    <p className="text-gray-500 text-center mt-20">No detection events found.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {events.map((event) => (
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

                {total > 0 && (
                    <div className="mt-6">
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            onPrev={() => setPage((p) => p - 1)}
                            onNext={() => setPage((p) => p + 1)}
                        />
                    </div>
                )}
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
