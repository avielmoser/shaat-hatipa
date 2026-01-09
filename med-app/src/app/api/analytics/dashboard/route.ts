
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getDashboardMetrics } from "@/lib/server/analytics-dashboard";
import { safeDbQuery } from "@/lib/db-safe-wrapper";
import { logger } from "@/lib/logger";


export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);

    // --- Auth Check ---
    // Handled by Middleware (Cookie-based).
    // The request only reaches here if authenticated.

    // --- Parse Filters ---
    const clinicSlug = searchParams.get("clinic") || undefined;
    const protocol = searchParams.get("protocol") || undefined;
    const locale = searchParams.get("locale") || undefined;
    const device = searchParams.get("device") || undefined;
    const view = searchParams.get("view") || undefined; // "meaningful" | "all" | undefined

    // Dates: Default to last 30 days
    const end = searchParams.get("endDate")
        ? new Date(searchParams.get("endDate")!)
        : new Date();

    const start = searchParams.get("startDate")
        ? new Date(searchParams.get("startDate")!)
        : new Date(new Date().setDate(end.getDate() - 30));

    // Validate Dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ error: "Invalid date range" }, { status: 400 });
    }

    // --- Safe Execution ---
    // Wrap the Prisma call in our safe handler
    const result = await safeDbQuery(async () => {
        return await getDashboardMetrics(prisma, {
            clinicSlug: clinicSlug === "all" ? undefined : clinicSlug,
            protocol: protocol === "all" ? undefined : protocol,
            startDate: start,
            endDate: end,
            locale,
            device,
            view // Pass the view filter
        });
    }, "getDashboardMetrics");

    if (!result.success) {
        // Safe wrapper already logged the server error.
        // We just return the sanitized error code to the client.
        return NextResponse.json(
            {
                error: result.error.code, // e.g. "DB_CONNECTION_FAILED"
                details: result.error.message // "Database connection unavailable."
            },
            { status: 500 }
        );
    }

    return NextResponse.json(result.data);
}
