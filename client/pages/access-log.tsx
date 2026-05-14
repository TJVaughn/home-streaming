import { useEffect, useState } from "react";
import Link from "next/link";

type AccessEntry = {
    id: number;
    ts: string;
    ip: string;
    path: string;
    outcome: "denied" | "login_ok" | "login_fail";
};

const OUTCOME_STYLES: Record<string, string> = {
    login_ok: "bg-green-900 text-green-300",
    login_fail: "bg-red-900 text-red-300",
    denied: "bg-yellow-900 text-yellow-300",
};

const OUTCOME_LABELS: Record<string, string> = {
    login_ok: "Login OK",
    login_fail: "Login failed",
    denied: "Denied",
};

function formatTime(iso: string) {
    return new Date(iso).toLocaleString();
}

export default function AccessLog() {
    const [entries, setEntries] = useState<AccessEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/access-log")
            .then((r) => r.json())
            .then((data) => {
                setEntries(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    return (
        <div className="min-h-screen bg-gray-950 text-white">
            <nav className="flex items-center gap-6 px-6 py-4 bg-gray-900 border-b border-gray-800">
                <Link href="/" className="text-gray-400 hover:text-white transition-colors">
                    ● Live
                </Link>
                <Link href="/events" className="text-gray-400 hover:text-white transition-colors">
                    Detection Events
                </Link>
                <span className="font-medium">Access Log</span>
            </nav>

            <div className="p-6">
                {loading && (
                    <p className="text-gray-500 text-center mt-20">Loading…</p>
                )}
                {!loading && entries.length === 0 && (
                    <p className="text-gray-500 text-center mt-20">No remote access events yet.</p>
                )}
                {entries.length > 0 && (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 border-b border-gray-800">
                                    <th className="pb-3 pr-6">Time</th>
                                    <th className="pb-3 pr-6">IP</th>
                                    <th className="pb-3 pr-6">Path</th>
                                    <th className="pb-3">Outcome</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((e) => (
                                    <tr
                                        key={e.id}
                                        className="border-b border-gray-900 hover:bg-gray-900 transition-colors"
                                    >
                                        <td className="py-2.5 pr-6 text-gray-400 whitespace-nowrap">
                                            {formatTime(e.ts)}
                                        </td>
                                        <td className="py-2.5 pr-6 font-mono">{e.ip}</td>
                                        <td className="py-2.5 pr-6 text-gray-400 font-mono truncate max-w-xs">
                                            {e.path}
                                        </td>
                                        <td className="py-2.5">
                                            <span
                                                className={`text-xs px-2 py-0.5 rounded font-medium ${
                                                    OUTCOME_STYLES[e.outcome] ?? "bg-gray-700 text-gray-300"
                                                }`}
                                            >
                                                {OUTCOME_LABELS[e.outcome] ?? e.outcome}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
