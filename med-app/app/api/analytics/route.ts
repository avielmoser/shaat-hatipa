import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Validation schema
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

        const { eventName, step, buttonId, sessionId, meta } = result.data;

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
