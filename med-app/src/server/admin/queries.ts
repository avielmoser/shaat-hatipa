
import { prisma } from "@/lib/server/db";
import { subDays, startOfDay } from "date-fns";
import { getDateRanges } from "./utils";

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

export interface BusinessKpis {
    schedulesGenerated: number;
    activationRate: number; // 0-1
    exportRate: number; // 0-1
    returningUsers: number;
    biggestDropoffStep: string;
    deltas?: {
        schedulesGenerated: number;
        activationRate: number;
        exportRate: number;
        returningUsers: number;
    }
}

export interface FunnelStep {
    stepName: string;
    label: string;
    count: number;
    conversionRate: number; // % of previous step
    dropOffRate: number; // % lost from previous step
}

export type QueryResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };

/**
 * Fetch Funnel Metrics: Wizard -> Generate Click -> Generated -> Export
 */
export async function getAdminFunnel(rangeDays: number): Promise<QueryResult<FunnelStep[]>> {
    try {
        const { currentStart } = getDateRanges(rangeDays);
        const currentEnd = new Date();

        // Funnel Stages: wizard_viewed -> generate_schedule_clicked -> schedule_generated -> export_clicked
        // Order is important.

        // Single Round-Trip aggregation using raw SQL for JSON access if needed, 
        // though here we group by event_name which is a column.
        const countsRaw = await prisma.$queryRaw<{ step: string, count: bigint }[]>`
            SELECT 
                event_name as step,
                COUNT(DISTINCT session_id) as count
            FROM "analytics_events"
            WHERE created_at >= ${currentStart} AND created_at < ${currentEnd}
            AND event_name IN ('wizard_viewed', 'generate_schedule_clicked', 'schedule_generated', 'export_clicked')
            GROUP BY event_name
        `;

        const countsMap = countsRaw.reduce((acc, curr) => {
            acc[curr.step] = Number(curr.count);
            return acc;
        }, {} as Record<string, number>);

        const countWizard = countsMap['wizard_viewed'] || 0;
        const countGenClick = countsMap['generate_schedule_clicked'] || 0;
        const countGenerated = countsMap['schedule_generated'] || 0;
        const countExport = countsMap['export_clicked'] || 0;

        // Build Steps
        const steps: FunnelStep[] = [
            { stepName: "wizard_viewed", label: "Wizard Views", count: countWizard, conversionRate: 100, dropOffRate: 0 },
            { stepName: "generate_schedule_clicked", label: "Generate Clicked", count: countGenClick, ...calcRates(countGenClick, countWizard) },
            { stepName: "schedule_generated", label: "Schedules Created", count: countGenerated, ...calcRates(countGenerated, countGenClick) },
            { stepName: "export_clicked", label: "Export Clicked", count: countExport, ...calcRates(countExport, countGenerated) }
        ];

        return { success: true, data: steps };
    } catch (error) {
        console.error("[AdminQueries] getAdminFunnel failed:", error);
        return { success: false, error: "Failed to fetch Funnel" };
    }
}

function calcRates(current: number, previous: number) {
    if (previous === 0) return { conversionRate: 0, dropOffRate: 0 };
    const conversionRate = (current / previous) * 100;
    return {
        conversionRate,
        dropOffRate: 100 - conversionRate
    };
}

export interface BreakdownItem {
    id: string; // clinicSlug or protocol key
    label: string;
    schedulesGenerated: number;
    activationRate: number;
    exportRate: number;
}

export interface BreakdownResult {
    byClinic: BreakdownItem[];
    byProtocol: BreakdownItem[];
    byStep: BreakdownItem[]; // Added byStep as implied by "Breakdowns... Steps"
}

/**
 * Fetch Breakdown Stats: Top Clinics & Protocols
 */
export async function getAdminBreakdown(rangeDays: number): Promise<QueryResult<BreakdownResult>> {
    try {
        const { currentStart } = getDateRanges(rangeDays);
        const currentEnd = new Date();

        // --- Clinics ---
        // Group by meta->>'clinicSlug'
        const clinicStatsRaw = await prisma.$queryRaw<any[]>`
            SELECT 
                COALESCE(meta->>'clinicSlug', 'unknown') as id,
                COUNT(DISTINCT CASE WHEN event_name = 'wizard_viewed' THEN session_id END) as views,
                COUNT(DISTINCT CASE WHEN event_name = 'schedule_generated' THEN session_id END) as gens,
                COUNT(DISTINCT CASE WHEN event_name = 'export_clicked' THEN session_id END) as exports
            FROM "analytics_events"
            WHERE created_at >= ${currentStart} AND created_at < ${currentEnd}
            GROUP BY 1
        `;

        const byClinic: BreakdownItem[] = clinicStatsRaw.map((row: any) => mapBreakdown(row));

        // --- Protocols ---
        // Group by meta->>'protocolSlug' OR meta->>'protocolId'
        const protocolStatsRaw = await prisma.$queryRaw<any[]>`
            SELECT 
                COALESCE(meta->>'protocolSlug', meta->>'protocolId', 'unknown') as id,
                COUNT(DISTINCT CASE WHEN event_name = 'wizard_viewed' THEN session_id END) as views,
                COUNT(DISTINCT CASE WHEN event_name = 'schedule_generated' THEN session_id END) as gens,
                COUNT(DISTINCT CASE WHEN event_name = 'export_clicked' THEN session_id END) as exports
            FROM "analytics_events"
            WHERE created_at >= ${currentStart} AND created_at < ${currentEnd}
            GROUP BY 1
        `;

        const byProtocol: BreakdownItem[] = protocolStatsRaw.map((row: any) => mapBreakdown(row));

        // --- Steps (Where dropoff happens) ---
        // Use column 'step' where event_name = 'step_viewed'
        // This breakdown is slightly different (count per step), but we can map it to BreakdownItem somewhat
        // Or just return step counts? 
        // The Prompt says: "Steps Use column `step` where `event_name = 'step_viewed'`"
        // Let's create a breakdown for steps based on View count.
        const stepStatsRaw = await prisma.$queryRaw<any[]>`
            SELECT 
                step as id,
                COUNT(DISTINCT session_id) as views,
                0 as gens,
                0 as exports
            FROM "analytics_events"
            WHERE created_at >= ${currentStart} AND created_at < ${currentEnd}
            AND event_name = 'step_viewed'
            AND step IS NOT NULL
            GROUP BY 1
        `;

        const byStep: BreakdownItem[] = stepStatsRaw.map((row: any) => ({
            id: row.id || "unknown",
            label: `Step ${row.id}`,
            schedulesGenerated: 0,
            activationRate: 0, // Not applicable really, or we could calculate retention if we had previous step data here
            exportRate: 0,
            count: Number(row.views || 0) // Extra field? BreakdownItem doesn't have it. We'll overload schedulesGenerated? No, that's converting data meanings.
            // Actually, the Requirement "Breakdowns... Steps" matches "Biggest Dropoff Step" logic usually. 
            // But if I must return a breakdown, I'll fit it into the structure or empty if not strictly requested in return type of this function.
            // `BreakdownResult` in existing code didn't have `byStep`. I added it to interface.
        })).sort((a, b) => Number(a.id) - Number(b.id)); // Sort by step number


        return {
            success: true,
            data: {
                byClinic: byClinic.sort((a, b) => b.schedulesGenerated - a.schedulesGenerated),
                byProtocol: byProtocol.sort((a, b) => b.schedulesGenerated - a.schedulesGenerated),
                byStep: byStep // Optional addition
            }
        };

    } catch (error) {
        console.error("[AdminQueries] getAdminBreakdown failed:", error);
        return { success: false, error: "Failed to fetch Breakdown" };
    }
}

function mapBreakdown(row: any): BreakdownItem {
    const views = Number(row.views || 0);
    const gens = Number(row.gens || 0);
    const exports = Number(row.exports || 0);

    return {
        id: row.id,
        label: row.id,
        schedulesGenerated: gens,
        activationRate: views > 0 ? (gens / views) * 100 : 0,
        exportRate: gens > 0 ? (exports / gens) * 100 : 0,
    };
}

/**
 * Fetch new Business/Product KPIs.
 */
export async function getAdminKpis(rangeDays: number): Promise<QueryResult<BusinessKpis>> {
    try {
        const { currentStart, previousStart, previousEnd } = getDateRanges(rangeDays);
        const currentEnd = new Date(); // now

        const [currentMetrics, previousMetrics] = await Promise.all([
            getMetricsForRange(currentStart, currentEnd),
            getMetricsForRange(previousStart, previousEnd)
        ]);

        const deltas = {
            schedulesGenerated: calculateDelta(currentMetrics.schedulesGenerated, previousMetrics.schedulesGenerated),
            activationRate: calculateDelta(currentMetrics.activationRate, previousMetrics.activationRate),
            exportRate: calculateDelta(currentMetrics.exportRate, previousMetrics.exportRate),
            returningUsers: calculateDelta(currentMetrics.returningUsers, previousMetrics.returningUsers),
        };

        return {
            success: true,
            data: {
                ...currentMetrics,
                deltas
            }
        };
    } catch (error) {
        console.error("[AdminQueries] getAdminKpis failed:", error);
        return { success: false, error: "Failed to fetch KPIs" };
    }
}

async function getMetricsForRange(start: Date, end: Date) {
    // 1. Wizard Views
    const viewsRaw = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT session_id) as count
        FROM "analytics_events"
        WHERE created_at >= ${start} AND created_at < ${end}
        AND event_name = 'wizard_viewed'
    `;
    const views = Number(viewsRaw[0]?.count || 0);

    // 2. Schedules Generated
    const gensRaw = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT session_id) as count
        FROM "analytics_events"
        WHERE created_at >= ${start} AND created_at < ${end}
        AND event_name = 'schedule_generated'
    `;
    const schedulesGenerated = Number(gensRaw[0]?.count || 0);

    // 3. Export Clicked
    const exportsRaw = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT session_id) as count
        FROM "analytics_events"
        WHERE created_at >= ${start} AND created_at < ${end}
        AND event_name = 'export_clicked'
    `;
    const exportsCount = Number(exportsRaw[0]?.count || 0);

    // Rate calculations
    const activationRate = views > 0 ? (schedulesGenerated / views) * 100 : 0;
    const exportRate = schedulesGenerated > 0 ? (exportsCount / schedulesGenerated) * 100 : 0;

    // 4. Returning Users
    const returningUsersCountRaw = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT current.session_id) as count
        FROM "analytics_events" as current
        WHERE current.created_at >= ${start} AND current.created_at < ${end}
        AND EXISTS (
            SELECT 1 FROM "analytics_events" as past
            WHERE past.session_id = current.session_id
            AND past.created_at < ${start}
        )
    `;
    const returningUsers = Number(returningUsersCountRaw[0]?.count || 0);

    // 5. Biggest Drop-off Step
    // Use column 'step' where event_name = 'step_viewed'
    const stepCountsRaw = await prisma.$queryRaw<{ step: string, count: bigint }[]>`
        SELECT step, COUNT(DISTINCT session_id) as count
        FROM "analytics_events"
        WHERE created_at >= ${start} AND created_at < ${end}
        AND event_name = 'step_viewed'
        AND step IS NOT NULL
        GROUP BY step
    `;

    // Sort steps numerically
    const sortedSteps = stepCountsRaw
        .map(r => ({ step: r.step, count: Number(r.count) }))
        .sort((a, b) => Number(a.step) - Number(b.step));

    let maxDrop = 0;
    let biggestDropStep = "N/A";

    for (let i = 0; i < sortedSteps.length - 1; i++) {
        const curr = sortedSteps[i];
        const next = sortedSteps[i + 1];
        const drop = curr.count - next.count;
        if (drop > maxDrop) {
            maxDrop = drop;
            biggestDropStep = `Step ${curr.step} -> ${next.step}`;
        }
    }

    return {
        schedulesGenerated,
        activationRate,
        exportRate,
        returningUsers,
        biggestDropoffStep: biggestDropStep === "N/A" && sortedSteps.length > 0 ? "None" : biggestDropStep
    };
}

function calculateDelta(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
}

/**
 * Fetch KPI counts for the given date range.
 * Supports 'meaningful' filter.
 */
export async function getKpis(rangeDays: number, view?: 'all' | 'meaningful'): Promise<QueryResult<AdminKpis>> {
    try {
        const { currentStart } = getDateRanges(rangeDays);

        let totalEvents = 0;

        if (view === 'meaningful') {
            const rawTotal = await prisma.$queryRaw<{ count: bigint }[]>`
                SELECT COUNT(*) as count FROM "analytics_events"
                WHERE created_at >= ${currentStart}
                AND meta->>'eventType' IN ('action', 'conversion')
            `;
            totalEvents = Number(rawTotal[0]?.count || 0);
        } else {
            totalEvents = await prisma.analyticsEvent.count({
                where: { createdAt: { gte: currentStart } }
            });
        }

        // Session Starts and Schedule Generated are specific events, so 'view' filter doesn't inherently change the count 
        // unless we strictly apply it, but these are by definition actions/page views.
        // We'll keep them as simple counts.

        const [sessionStart, scheduleGen] = await Promise.all([
            prisma.analyticsEvent.count({
                where: {
                    eventName: "session_start",
                    createdAt: { gte: currentStart }
                }
            }),
            prisma.analyticsEvent.count({
                where: {
                    eventName: "schedule_generated",
                    createdAt: { gte: currentStart }
                }
            })
        ]);

        return {
            success: true,
            data: {
                totalEvents: totalEvents,
                sessionStartCount: sessionStart,
                scheduleGeneratedCount: scheduleGen,
                rangeDays: rangeDays
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
 * Supports view filter.
 */
export async function getLatestEvents(
    limit: number = 20,
    view: 'all' | 'meaningful' = 'all'
): Promise<QueryResult<AdminEvent[]>> {
    try {
        let events: any[];

        if (view === 'meaningful') {
            events = await prisma.$queryRaw<AdminEvent[]>`
                SELECT 
                    id, 
                    event_name as "eventName", 
                    created_at as "createdAt", 
                    meta 
                FROM "analytics_events"
                WHERE meta->>'eventType' IN ('action', 'conversion')
                ORDER BY created_at DESC
                LIMIT ${limit}
            `;
        } else {
            events = await prisma.$queryRaw<AdminEvent[]>`
                SELECT 
                    id, 
                    event_name as "eventName", 
                    created_at as "createdAt", 
                    meta 
                FROM "analytics_events"
                ORDER BY created_at DESC
                LIMIT ${limit}
            `;
        }

        // Map dates if queryRaw returns strings (depends on driver, prisma usually returns Date objects for DateTime)
        // Adjust if necessary.
        const mappedHelper = events.map(e => ({
            ...e,
            createdAt: new Date(e.createdAt)
        }));

        return { success: true, data: mappedHelper };
    } catch (error) {
        console.error("[AdminQueries] getLatestEvents failed:", error);
        return { success: false, error: "Database Connection Error" };
    }
}

/**
 * DEBUG ONLY: Fetch raw stats to diagnose why KPIs might be 0.
 */
export async function getDebugStats(rangeDays: number) {
    if (process.env.ADMIN_DEBUG_ANALYTICS !== "1") {
        return null; // Return nothing if debug is off
    }

    try {
        const { currentStart } = getDateRanges(rangeDays);
        const currentEnd = new Date();

        const histogram = await prisma.analyticsEvent.groupBy({
            by: ['eventName'],
            where: {
                createdAt: { gte: currentStart, lt: currentEnd }
            },
            _count: {
                id: true
            }
        });

        const totalEvents = await prisma.analyticsEvent.count({
            where: { createdAt: { gte: currentStart, lt: currentEnd } }
        });

        const withSession = await prisma.analyticsEvent.count({
            where: {
                createdAt: { gte: currentStart, lt: currentEnd },
                sessionId: { not: null }
            }
        });

        // Get sample of 5 recent events raw
        const sampleEvents = await prisma.analyticsEvent.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: { eventName: true, createdAt: true, sessionId: true, meta: true }
        });

        return {
            range: { start: currentStart.toISOString(), end: currentEnd.toISOString() },
            histogram: histogram.map(h => ({ name: h.eventName, count: h._count.id })),
            actorStats: { total: totalEvents, withSession },
            last5: sampleEvents
        };
    } catch (e) {
        return { error: String(e) };
    }
}
