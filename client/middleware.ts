import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PRIVATE_172 = /^172\.(1[6-9]|2\d|3[01])\./;

function isLocal(ip: string): boolean {
    const addr = ip.replace(/^::ffff:/, "");
    return (
        addr === "::1" ||
        addr.startsWith("127.") ||
        addr.startsWith("10.") ||
        addr.startsWith("192.168.") ||
        PRIVATE_172.test(addr)
    );
}

function logAccess(req: NextRequest, ip: string, outcome: string) {
    const base = `http://localhost:${req.nextUrl.port || "3000"}`;
    fetch(`${base}/api/access-log`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ip, path: req.nextUrl.pathname, outcome }),
    }).catch(() => {});
}

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;

    // Always allow the login flow and internal log endpoint
    if (
        pathname === "/login" ||
        pathname === "/api/login" ||
        pathname === "/api/logout" ||
        pathname === "/api/access-log"
    ) {
        return NextResponse.next();
    }

    // Local network: no auth required
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : (req.ip ?? "");
    if (isLocal(ip)) return NextResponse.next();

    // Remote: check session cookie
    const secret = process.env.APP_SECRET;
    if (secret && req.cookies.get("auth")?.value === secret) {
        return NextResponse.next();
    }

    // Not configured for remote access — block rather than expose
    if (!secret) {
        return new NextResponse("Remote access not configured (APP_SECRET not set)", { status: 403 });
    }

    logAccess(req, ip, "denied");
    return NextResponse.redirect(new URL("/login", req.url));
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
