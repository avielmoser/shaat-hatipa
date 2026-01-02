
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/db";
import { getDashboardMetrics } from "@/lib/server/analytics-dashboard";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);

        // --- Auth Check ---
        const authHeader = req.headers.get("x-admin-key");
        // Support both keys to fix environment mismatch without breaking potential existing integrations
        const adminKey = process.env.ADMIN_ACCESS_KEY || process.env.ADMIN_DASHBOARD_KEY;

        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!adminKey || authHeader !== adminKey) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

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

        const metrics = await getDashboardMetrics(prisma, {
            clinicSlug: clinicSlug === "all" ? undefined : clinicSlug,
            protocol: protocol === "all" ? undefined : protocol,
            startDate: start,
            endDate: end,
            locale,
            device,
            view // Pass the view filter
        });

        return NextResponse.json(metrics);

    } catch (error) {
        console.error("[Analytics Dashboard API] Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
