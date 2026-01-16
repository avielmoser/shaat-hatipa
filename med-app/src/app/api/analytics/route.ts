import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getEventType } from "@/domain/analytics/taxonomy";
import { analyticsRepository } from "@/infrastructure/db/analytics-repository";

// Validation schema
import { prisma } from "@/lib/server/db";

// Validation schema
export const runtime = "nodejs";

// --- STARTUP GUARDRAIL ---
let isSchemaChecked = false;
let isSchemaValid = true;

async function checkSchemaSync() {
    if (isSchemaChecked) return;
    try {
        // Lightweight check: does the column exist?
        // Note: prisma.$queryRaw is rigid. Using a safe SELECT.
        await prisma.$queryRaw`SELECT clinic_slug FROM analytics_events LIMIT 1`;
        isSchemaValid = true;
    } catch (e: any) {
        // P2022 = Column not found
        if (e.code === 'P2022' || e.message?.includes("does not exist")) {
            console.error("[GUARDRAIL] Analytics schema out of sync — run 'npx prisma migrate deploy' in PROD. Analytics writes DISABLED.");
            isSchemaValid = false;
        }
    } finally {
        isSchemaChecked = true;
    }
}
// -------------------------

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
    // 1. Guardrail Check (Once per instance)
    if (!isSchemaChecked) await checkSchemaSync();

    try {
        const body = await req.json();

        // Validate input
        const result = analyticsSchema.safeParse(body);

        if (process.env.ANALYTICS_DEBUG === "1") {
            const { eventName, eventType } = body;
            console.log(`[Analytics Debug] POST received: ${eventName} (${eventType})`);

            if (!result.success) {
                console.warn("[Analytics Debug] Validation failed:", result.error.format());
            }
        }

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

        if (!isSchemaValid) {
            if (process.env.NODE_ENV === "development") console.warn("[Analytics] Dropping event due to schema mismatch (Guardrail active)");
            return NextResponse.json({ success: true, queued: false, status: "dropped_schema_mismatch" });
        }

        await analyticsRepository.createEvent({
            eventName,
            eventType,
            step,
            buttonId,
            sessionId: sessionId ? String(sessionId) : null,
            clinicSlug,
            meta: {
                ...meta,
                eventType, // preserve explicit eventType in meta as per existing logic
            }
        });

        if (process.env.ANALYTICS_DEBUG === "1") {
            console.log(`[Analytics Debug] Successfully wrote event '${eventName}' to DB via repository`);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        // RESILIENCE: Never crash the client analytics loop
        // If DB write fails (schema mismatch, connection), just log and ignore.
        console.error(`[ANALYTICS_WRITE_FAILED] Code: ${error.code || 'UNKNOWN'} | Message: ${error.message}`);

        // Return 200 to keep the client happy
        return NextResponse.json({ success: true, queued: false, error: "Ingestion failed safely" });
    }
}
