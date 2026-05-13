import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "../outputs/detections.db");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") return res.status(405).end();

    const { id, protected: prot } = req.body;
    if (!id) return res.status(400).end();

    try {
        const Database = require("better-sqlite3");
        const db = new Database(DB_PATH);
        db.prepare("UPDATE detections SET protected = ? WHERE id = ?").run(prot ? 1 : 0, Number(id));
        db.close();
        res.json({ ok: true });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
}
