import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getServerEnv } from "@/lib/env";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        const env = getServerEnv();
        // Fingerprint DB (Safe)
        const dbUrl = env.DATABASE_URL;
        const host = new URL(dbUrl).hostname;

        // Count events
        const count = await prisma.analyticsEvent.count();
        const lastEvent = await prisma.analyticsEvent.findFirst({
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        });

        return NextResponse.json({
            ok: true,
            dbFingerprint: host,
            eventsCount: count,
            lastEventAt: lastEvent?.createdAt || null,
            env: env.NODE_ENV
        });
    } catch (error) {
        return NextResponse.json({
            ok: false,
            error: (error as Error).message
        }, { status: 500 });
    }
}
