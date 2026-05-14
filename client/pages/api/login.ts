import type { NextApiRequest, NextApiResponse } from "next";

function getIP(req: NextApiRequest): string {
    const forwarded = req.headers["x-forwarded-for"];
    if (typeof forwarded === "string") return forwarded.split(",")[0].trim();
    return req.socket.remoteAddress ?? "unknown";
}

async function logAccess(req: NextApiRequest, outcome: string) {
    const ip = getIP(req);
    const host = req.headers.host ?? `localhost:3000`;
    const protocol = req.headers["x-forwarded-proto"] ?? "http";
    try {
        await fetch(`${protocol}://${host}/api/access-log`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ip, path: "/api/login", outcome }),
        });
    } catch {}
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).end();

    const { password } = req.body;
    const appPassword = process.env.APP_PASSWORD;
    const appSecret = process.env.APP_SECRET;

    if (!appPassword || !appSecret) {
        return res.status(500).json({ error: "Server not configured for remote access" });
    }

    if (!password || password !== appPassword) {
        await logAccess(req, "login_fail");
        return res.status(401).json({ error: "Incorrect password" });
    }

    await logAccess(req, "login_ok");
    const sevenDays = 7 * 24 * 60 * 60;
    res.setHeader(
        "Set-Cookie",
        `auth=${appSecret}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${sevenDays}`
    );
    res.json({ ok: true });
}
