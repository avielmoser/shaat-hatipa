
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";

// Force Node runtime to avoid Edge limitations with Prisma
export const runtime = "nodejs";
// Ensure no caching so we get real-time results
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    const start = performance.now();

    // 1. Check Auth Header
    // 1. Check Auth Header OR Cookie
    const authHeader = req.headers.get("x-admin-key") || "";
    const sessionCookie = req.cookies.get("admin_session");

    // Support both env var names
    const envKey1 = process.env.ADMIN_ACCESS_KEY;
    const envKey2 = process.env.ADMIN_DASHBOARD_KEY;

    // Check if valid
    const isKeyValid = (!!envKey1 && authHeader === envKey1) || (!!envKey2 && authHeader === envKey2);
    const isCookieValid = sessionCookie?.value === "authenticated";
    const isAuthValid = isKeyValid || isCookieValid;

    // 2. DB Query Test
    let dbStatus = {
        connected: false,
        rowCount: -1,
        durationMs: 0,
        error: null as string | null
    };

    try {
        const dbStart = performance.now();
        // Run the exact count query
        const count = await prisma.analyticsEvent.count();
        const dbEnd = performance.now();

        dbStatus.connected = true;
        dbStatus.rowCount = count;
        dbStatus.durationMs = Math.round(dbEnd - dbStart);
    } catch (e: any) {
        dbStatus.error = e.message || "Unknown DB Error";
    }

    // 3. Env Status (No secrets)
    const envStatus = {
        DATABASE_URL: !!process.env.DATABASE_URL ? "set" : "unset",
        ADMIN_ACCESS_KEY: !!process.env.ADMIN_ACCESS_KEY ? "set" : "unset",
        ADMIN_DASHBOARD_KEY: !!process.env.ADMIN_DASHBOARD_KEY ? "set" : "unset",
        APP_URL: !!process.env.NEXT_PUBLIC_APP_URL ? "set" : "unset",
        NODE_ENV: process.env.NODE_ENV || "unset"
    };

    const responseData = {
        ok: isAuthValid && dbStatus.connected,
        runtime: process.env.NEXT_RUNTIME || "nodejs",
        env: envStatus,
        request: {
            hasKeyHeader: !!authHeader,
            hasCookie: !!sessionCookie,
            authValid: isAuthValid
        },
        db: dbStatus
    };

    // Return with Cache-Control: no-store
    return NextResponse.json(responseData, {
        headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
        }
    });
}
