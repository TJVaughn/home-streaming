import type { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";

const OUTPUTS_DIR = path.resolve(process.cwd(), "../outputs");

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { file } = req.query;
    if (!file || typeof file !== "string") return res.status(400).end();

    const filePath = path.resolve(OUTPUTS_DIR, file);
    if (!filePath.startsWith(OUTPUTS_DIR + path.sep)) return res.status(403).end();
    if (!fs.existsSync(filePath)) return res.status(404).end();

    const isVideo = path.extname(filePath).toLowerCase() === ".mp4";
    const stat = fs.statSync(filePath);
    const { range } = req.headers;

    if (isVideo && range) {
        const [startStr, endStr] = range.replace(/bytes=/, "").split("-");
        const start = parseInt(startStr, 10);
        const end = endStr ? parseInt(endStr, 10) : stat.size - 1;
        res.writeHead(206, {
            "Content-Range": `bytes ${start}-${end}/${stat.size}`,
            "Accept-Ranges": "bytes",
            "Content-Length": end - start + 1,
            "Content-Type": "video/mp4",
        });
        fs.createReadStream(filePath, { start, end }).pipe(res);
    } else {
        res.writeHead(200, {
            "Content-Length": stat.size,
            "Content-Type": isVideo ? "video/mp4" : "image/jpeg",
            "Accept-Ranges": "bytes",
        });
        fs.createReadStream(filePath).pipe(res);
    }
}
