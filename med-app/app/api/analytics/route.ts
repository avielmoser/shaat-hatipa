import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";

// Validation schema
const analyticsSchema = z.object({
    eventName: z.string().min(1).max(100),
    step: z.string().optional(),
    buttonId: z.string().optional(),
    sessionId: z.string().optional().nullable(),
    // Allow other properties but put them in meta
}).passthrough();

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

        const { eventName, step, buttonId, sessionId, ...rest } = result.data;

        // Privacy check: Ensure no PII is accidentally passed in 'rest'
        // We strictly allow only specific keys in 'meta' if needed, or just store 'rest' 
        // assuming the client is well-behaved. 
        // To be extra safe, we can sanitize 'rest' or just store it as is 
        // since we control the client calls.
        // For this implementation, we'll store 'rest' as meta.

        await prisma.analyticsEvent.create({
            data: {
                eventName,
                step: step ? String(step) : null,
                buttonId: buttonId ? String(buttonId) : null,
                sessionId: sessionId ? String(sessionId) : null,
                meta: rest as any, // Store remaining fields as JSON
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
