import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

const DB_PATH = path.resolve(process.cwd(), "../outputs/detections.db");

function getDb() {
    const Database = require("better-sqlite3");
    const db = new Database(DB_PATH);
    db.exec(`
        CREATE TABLE IF NOT EXISTS access_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            ts TEXT NOT NULL,
            ip TEXT NOT NULL,
            path TEXT NOT NULL,
            outcome TEXT NOT NULL
        )
    `);
    return db;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!fs.existsSync(DB_PATH)) return res.json([]);

    if (req.method === "POST") {
        const { ip, path: reqPath, outcome } = req.body;
        if (!ip || !outcome) return res.status(400).end();
        try {
            const db = getDb();
            db.prepare(
                "INSERT INTO access_log (ts, ip, path, outcome) VALUES (?, ?, ?, ?)"
            ).run(new Date().toISOString(), ip, reqPath ?? "", outcome);
            db.close();
            return res.json({ ok: true });
        } catch (e) {
            return res.status(500).json({ error: String(e) });
        }
    }

    if (req.method === "GET") {
        try {
            const db = getDb();
            const rows = db
                .prepare(
                    "SELECT id, ts, ip, path, outcome FROM access_log ORDER BY ts DESC LIMIT 200"
                )
                .all();
            db.close();
            return res.json(rows);
        } catch (e) {
            return res.status(500).json({ error: String(e) });
        }
    }

    res.status(405).end();
}
