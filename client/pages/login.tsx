import { useState } from "react";
import { useRouter } from "next/router";

export default function Login() {
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });
        setLoading(false);
        if (res.ok) {
            router.push("/");
        } else {
            setError("Incorrect password");
            setPassword("");
        }
    };

    return (
        <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <h1 className="text-white text-2xl font-semibold text-center mb-8">Home Cameras</h1>
                <form
                    onSubmit={submit}
                    className="bg-gray-900 rounded-xl p-6 border border-gray-800"
                >
                    <label className="block text-sm text-gray-400 mb-1">Password</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500 mb-4"
                        autoFocus
                        autoComplete="current-password"
                    />
                    {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded font-medium transition-colors"
                    >
                        {loading ? "Signing in…" : "Sign in"}
                    </button>
                </form>
            </div>
        </div>
    );
}
