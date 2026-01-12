
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/server/db";
import { isEnvConfigured } from "@/lib/env.server";

// NodeJS runtime required for Prisma performance timing
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
    // 1. Auth Guard (Session Cookie)
    const session = await getSession();
    if (!session.isLoggedIn) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Environment Check (Safe Boolean)
    const envOk = isEnvConfigured();

    // 3. Database Check (Latency)
    let dbOk = false;
    let latencyMs = -1;

    try {
        const start = performance.now();
        // Lightweight check (count is cheap, raw query is better if available but count is safe)
        // Using count for simplicity and broad compatibility
        await prisma.analyticsEvent.count({ take: 1 });
        const end = performance.now();

        dbOk = true;
        latencyMs = Math.round(end - start);
    } catch (e) {
        console.error("[Diagnostics] DB Check Failed:", e);
        dbOk = false;
    }

    // 4. Response
    return NextResponse.json({
        ok: envOk && dbOk,
        env_ok: envOk,
        db_ok: dbOk,
        latency_ms: latencyMs,
        timestamp: new Date().toISOString()
    }, {
        headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache"
        }
    });
}
