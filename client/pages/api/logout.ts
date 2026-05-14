import type { NextApiRequest, NextApiResponse } from "next";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    res.setHeader("Set-Cookie", "auth=; Path=/; HttpOnly; Max-Age=0");
    res.redirect(302, "/login");
}
