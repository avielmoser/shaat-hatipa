import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Validation schema
export const runtime = "nodejs";

const analyticsSchema = z.object({
    eventName: z.string().min(1).max(100),
    step: z.string().max(100).optional(),
    buttonId: z.string().max(100).optional(),
    sessionId: z.string().optional().nullable(),
    // Strictly predefined meta or limited generic object
    meta: z.record(
        z.string().max(50),
        z.union([z.string().max(500), z.number(), z.boolean(), z.null()])
    ).optional(),
    path: z.string(),
});

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Validate input
        const result = analyticsSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid analytics data" },
                { status: 400 }
            );
        }

        // Server-Side Safety: Block events from admin routes based on payload path
        // We removed unreliable Referer check in favor of explicit path from client
        if (result.data.path.startsWith("/admin")) {
            if (process.env.NODE_ENV === "development") {
                console.log("[Analytics] Blocked event from admin route (payload):", result.data.path);
            }
            // Return 200 OK but do NOT write to DB
            return NextResponse.json({ success: true });
        }

        const { eventName, step, buttonId, sessionId, meta } = result.data;

        // Dev Logging
        if (process.env.NODE_ENV === "development") {
            try {
                const dbUrl = process.env.DATABASE_URL;
                if (dbUrl) {
                    const host = new URL(dbUrl).hostname;
                    console.log(`[Analytics] Writing event '${eventName}' to DB host: ${host}`);
                }
            } catch (e) {
                // Ignore URL parsing errors in generic logging
            }
        }

        await prisma.analyticsEvent.create({
            data: {
                eventName,
                step: step ?? null,
                buttonId: buttonId ?? null,
                sessionId: sessionId ? String(sessionId) : null,
                meta: meta ?? {},
            },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        // Log error on server but return 200 to client to not break UX
        console.error("Analytics API Error:", error);

        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 200 } // Return 200 to avoid client-side errors
        );
    }
}
