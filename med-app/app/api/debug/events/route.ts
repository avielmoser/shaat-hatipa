import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const events = await prisma.analyticsEvent.findMany({
            take: 10,
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ success: true, events });
    } catch (error) {
        console.error("[DEBUG_EVENTS_GET_ERROR]", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch events" },
            { status: 500 }
        );
    }
}
