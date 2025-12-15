import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/server/db";
import { getEventType } from "@/lib/client/analytics.taxonomy";

// Validation schema
export const runtime = "nodejs";

const analyticsSchema = z.object({
    eventName: z.string().min(1).max(100),
    eventType: z.enum(["page_view", "action", "conversion"]),
    step: z.string().max(100).optional(),
    buttonId: z.string().max(100).optional(),
    sessionId: z.string().optional().nullable(),
    // Allow predefined meta but also flexible enough for our needs
    // We store eventType in meta if we can't add columns, but the requirements said "Update analytics schema / payload to include eventType"
    // The user also said "Do NOT change database provider or Prisma structure beyond what’s required"
    // So we will store it in the JSON meta field for now to be safe and minimal.
    meta: z.record(
        z.string().max(50),
        z.union([z.string().max(500), z.number(), z.boolean(), z.null()])
    ).optional(),
    clinicSlug: z.string().max(50).optional(),
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

        const { eventName, eventType, step, buttonId, sessionId, meta, path, clinicSlug } = result.data;

        // Server-Side Safety: Block events from admin routes based on payload path
        if (path.startsWith("/admin")) {
            if (process.env.NODE_ENV === "development") {
                console.log("[Analytics] Blocked event from admin route (payload):", path);
            }
            // Return 200 OK but do NOT write to DB
            return NextResponse.json({ success: true });
        }

        // Strict Taxonomy Check
        const expectedType = getEventType(eventName);
        if (expectedType !== eventType) {
            if (process.env.NODE_ENV === "development") {
                console.warn(`[Analytics] Event mismatch or not allowlisted: ${eventName} (sent: ${eventType}, expected: ${expectedType})`);
            }
            // We reject this as 400 because it's a client implementation error or malicious/noise
            return NextResponse.json(
                { error: "Event not allowlisted or type mismatch" },
                { status: 400 }
            );
        }

        // Dev Logging
        if (process.env.NODE_ENV === "development") {
            try {
                const dbUrl = process.env.DATABASE_URL;
                if (dbUrl) {
                    const host = new URL(dbUrl).hostname;
                    console.log(`[Analytics] Writing event '${eventName}' (${eventType}) to DB host: ${host}`);
                }
            } catch (e) {
                // Ignore URL parsing errors in generic logging
            }
        }

        // We combine eventType into meta for storage without schema migration
        const dbMeta = {
            ...meta,
            eventType, // Store validation-checked eventType here
        };

        await prisma.analyticsEvent.create({
            data: {
                eventName,
                step: step ?? null,
                buttonId: buttonId ?? null,
                sessionId: sessionId ? String(sessionId) : null,
                clinicSlug: clinicSlug ?? null,
                meta: dbMeta,
            } as any,
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
