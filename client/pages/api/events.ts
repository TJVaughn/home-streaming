import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

const OUTPUTS_DIR = path.resolve(process.cwd(), "../outputs");
const DB_PATH = path.join(OUTPUTS_DIR, "detections.db");
const PAGE_SIZE = 200;

function parseClipPath(clipPath: string | null): string | null {
    if (!clipPath) return null;
    const match = clipPath.match(/outputs[/\\](.+)/);
    return match ? match[1] : null;
}

function findNearestThumbnail(camera: string, startedAt: string): string | null {
    const dt = new Date(startedAt);
    const dayStr = dt.toISOString().split("T")[0];
    const dayDir = path.join(OUTPUTS_DIR, "frames", camera, dayStr);
    if (!fs.existsSync(dayDir)) return null;

    const baseS = dt.getHours() * 3600 + dt.getMinutes() * 60 + dt.getSeconds();
    for (let delta = 0; delta <= 5; delta++) {
        for (const sign of [1, -1]) {
            if (delta === 0 && sign === -1) continue;
            const s = baseS + delta * sign;
            if (s < 0 || s >= 86400) continue;
            const hh = String(Math.floor(s / 3600)).padStart(2, "0");
            const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
            const ss = String(s % 60).padStart(2, "0");
            const rel = `frames/${camera}/${dayStr}/${hh}-${mm}-${ss}.jpg`;
            if (fs.existsSync(path.join(OUTPUTS_DIR, rel))) return rel;
        }
    }
    return null;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    if (!fs.existsSync(DB_PATH))
        return res.json({ events: [], total: 0, page: 1, totalPages: 0, cameras: [] });

    try {
        const Database = require("better-sqlite3");
        const db = new Database(DB_PATH, { readonly: true });

        const page = Math.max(1, parseInt((req.query.page as string) || "1", 10));
        const date = typeof req.query.date === "string" && req.query.date ? req.query.date : null;
        const savedOnly = req.query.saved === "true";
        const camera =
            typeof req.query.camera === "string" && req.query.camera !== "all"
                ? req.query.camera
                : null;

        const conditions: string[] = [];
        const params: unknown[] = [];

        if (date) {
            conditions.push("DATE(started_at) = ?");
            params.push(date);
        }
        if (savedOnly) {
            conditions.push("protected = 1");
        }
        if (camera) {
            conditions.push("camera = ?");
            params.push(camera);
        }

        const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

        const { total } = db
            .prepare(`SELECT COUNT(*) as total FROM detections ${where}`)
            .get(...params) as { total: number };
        const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
        const offset = (page - 1) * PAGE_SIZE;

        const rows = db
            .prepare(
                `SELECT id, camera, started_at, classes, max_confidence, clip_path, protected
                 FROM detections ${where} ORDER BY started_at DESC LIMIT ? OFFSET ?`
            )
            .all(...params, PAGE_SIZE, offset);

        const cameras = (
            db
                .prepare("SELECT DISTINCT camera FROM detections ORDER BY camera")
                .all() as { camera: string }[]
        ).map((r) => r.camera);

        db.close();

        res.json({
            events: rows.map((row: any) => ({
                id: row.id,
                camera: row.camera,
                started_at: row.started_at,
                classes: JSON.parse(row.classes),
                max_confidence: row.max_confidence,
                clip_path: parseClipPath(row.clip_path),
                thumbnail_path: findNearestThumbnail(row.camera, row.started_at),
                protected: row.protected === 1,
            })),
            total,
            page,
            totalPages,
            cameras,
        });
    } catch (e) {
        res.status(500).json({ error: String(e) });
    }
}
