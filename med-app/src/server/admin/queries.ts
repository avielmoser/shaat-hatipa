
import { prisma } from "@/lib/server/db";
import { subDays, startOfDay } from "date-fns";

export interface AdminKpis {
    totalEvents: number;
    sessionStartCount: number;
    scheduleGeneratedCount: number;
    rangeDays: number;
}

export interface AdminEvent {
    id: string;
    eventName: string;
    createdAt: Date;
    meta: any; // Json type
}

export type QueryResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * Fetch KPI counts for the given date range.
 * Best-effort: catches DB errors and returns success=false.
 */
export async function getKpis(rangeDays: number): Promise<QueryResult<AdminKpis>> {
    try {
        // Validate range
        const validRanges = [7, 30, 90];
        const safeRange = validRanges.includes(rangeDays) ? rangeDays : 30;

        // Calculate start date (rangeDays inclusive of today)
        const startDate = startOfDay(subDays(new Date(), safeRange - 1));

        // Parallel queries for efficiency
        const [total, sessionStart, scheduleGen] = await Promise.all([
            prisma.analyticsEvent.count({
                where: { createdAt: { gte: startDate } }
            }),
            prisma.analyticsEvent.count({
                where: {
                    eventName: "session_start",
                    createdAt: { gte: startDate }
                }
            }),
            prisma.analyticsEvent.count({
                where: {
                    eventName: "schedule_generated",
                    createdAt: { gte: startDate }
                }
            })
        ]);

        return {
            success: true,
            data: {
                totalEvents: total,
                sessionStartCount: sessionStart,
                scheduleGeneratedCount: scheduleGen,
                rangeDays: safeRange
            }
        };
    } catch (error) {
        console.error("[AdminQueries] getKpis failed:", error);
        return { success: false, error: "Database Connection Error" };
    }
}

/**
 * Fetch latest raw events for the table.
 * Restricted to stable columns only.
 */
export async function getLatestEvents(limit: number = 20): Promise<QueryResult<AdminEvent[]>> {
    try {
        const events = await prisma.analyticsEvent.findMany({
            take: limit,
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                eventName: true,
                createdAt: true,
                meta: true,
                // Excluding unstable/schema-mismatched columns like clinic_slug for now
            }
        });

        return { success: true, data: events };
    } catch (error) {
        console.error("[AdminQueries] getLatestEvents failed:", error);
        return { success: false, error: "Database Connection Error" };
    }
}
