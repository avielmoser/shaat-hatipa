
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
/**
 * Fetch Funnel Metrics: Wizard -> Generate Click -> Generated -> Export
 */
export async function getAdminFunnel(rangeDays: number): Promise<QueryResult<FunnelStep[]>> {
    try {
        const { currentStart } = getDateRanges(rangeDays);
        const currentEnd = new Date();

        // Single Round-Trip aggregation for Funnel Steps using Robust Actor Logic
        const countsRaw = await prisma.$queryRaw<{ step: string, count: bigint }[]>`
                SELECT 
                    event_name as step,
                    COUNT(DISTINCT COALESCE(session_id, meta->>'userId', meta->>'deviceId')) as count
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
}

/**
 * Fetch Breakdown Stats: Top Clinics & Protocols
 */
/**
 * Fetch Breakdown Stats: Top Clinics & Protocols
 */
export async function getAdminBreakdown(rangeDays: number): Promise<QueryResult<BreakdownResult>> {
    try {
        const { currentStart } = getDateRanges(rangeDays);
        const currentEnd = new Date();

        // --- Clinics ---
        // Get all stats aggregated by clinic_slug
        const clinicStatsRaw = await prisma.$queryRaw<any[]>`
            SELECT 
                COALESCE(e.clinic_slug, 'unknown') as id,
                COUNT(DISTINCT CASE WHEN e.event_name = 'wizard_viewed' THEN COALESCE(e.session_id, e.meta->>'userId', e.meta->>'deviceId') END) as views,
                COUNT(DISTINCT CASE WHEN e.event_name = 'schedule_generated' THEN COALESCE(e.session_id, e.meta->>'userId', e.meta->>'deviceId') END) as gens,
                COUNT(DISTINCT CASE WHEN e.event_name = 'export_clicked' THEN COALESCE(e.session_id, e.meta->>'userId', e.meta->>'deviceId') END) as exports
            FROM "analytics_events" e
            WHERE e.created_at >= ${currentStart} AND e.created_at < ${currentEnd}
            GROUP BY 1
        `;

        const byClinic: BreakdownItem[] = clinicStatsRaw.map((row: any) => {
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
        }).sort((a, b) => b.schedulesGenerated - a.schedulesGenerated);

        // --- Protocols ---
        // Group by meta->>'protocol' (or protocolKey)
        const protocolStatsRaw = await prisma.$queryRaw<any[]>`
            SELECT 
                COALESCE(e.meta->>'protocol', e.meta->>'protocolKey', 'unknown') as id,
                COUNT(DISTINCT CASE WHEN e.event_name = 'wizard_viewed' THEN COALESCE(e.session_id, e.meta->>'userId', e.meta->>'deviceId') END) as views,
                COUNT(DISTINCT CASE WHEN e.event_name = 'schedule_generated' THEN COALESCE(e.session_id, e.meta->>'userId', e.meta->>'deviceId') END) as gens,
                COUNT(DISTINCT CASE WHEN e.event_name = 'export_clicked' THEN COALESCE(e.session_id, e.meta->>'userId', e.meta->>'deviceId') END) as exports
            FROM "analytics_events" e
            WHERE e.created_at >= ${currentStart} AND e.created_at < ${currentEnd}
            GROUP BY 1
        `;

        const byProtocol: BreakdownItem[] = protocolStatsRaw.map((row: any) => {
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
        }).sort((a, b) => b.schedulesGenerated - a.schedulesGenerated);

        return {
            success: true,
            data: {
                byClinic,
                byProtocol
            }
        };

    } catch (error) {
        console.error("[AdminQueries] getAdminBreakdown failed:", error);
        return { success: false, error: "Failed to fetch Breakdown" };
    }
}

/**
 * Fetch new Business/Product KPIs.
 * Calculates metrics for the current range and the previous range to provide deltas.
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
    // 1. Schedules Generated (North Star) - Count Events
    const schedulesGeneratedCount = await prisma.analyticsEvent.count({
        where: {
            eventName: "schedule_generated",
            createdAt: { gte: start, lt: end }
        }
    });

    // 2. Activation Rate (Generated / Wizard Views)
    // We must count DISTINCT ACTORS (coalesce session_id, user_id, device_id)
    // Prisma groupBy cannot do COALESCE. We use queryRaw.
    const activationRaw = await prisma.$queryRaw<{ views: bigint, gens: bigint }[]>`
        SELECT 
            COUNT(DISTINCT COALESCE(session_id, meta->>'userId', meta->>'deviceId')) as views,
            COUNT(DISTINCT CASE WHEN event_name = 'schedule_generated' THEN COALESCE(session_id, meta->>'userId', meta->>'deviceId') END) as gens
        FROM "analytics_events"
        WHERE created_at >= ${start} AND created_at < ${end}
        AND event_name IN ('wizard_viewed', 'schedule_generated')
    `;
    const views = Number(activationRaw[0]?.views || 0);
    const gensForRate = Number(activationRaw[0]?.gens || 0);
    const activationRate = views > 0 ? (gensForRate / views) * 100 : 0;

    // 3. Export Rate (Export Clicked / Generated)
    const exportRaw = await prisma.$queryRaw<{ gens: bigint, exports: bigint }[]>`
        SELECT 
            COUNT(DISTINCT CASE WHEN event_name = 'schedule_generated' THEN COALESCE(session_id, meta->>'userId', meta->>'deviceId') END) as gens,
            COUNT(DISTINCT CASE WHEN event_name = 'export_clicked' THEN COALESCE(session_id, meta->>'userId', meta->>'deviceId') END) as exports
        FROM "analytics_events"
        WHERE created_at >= ${start} AND created_at < ${end}
        AND event_name IN ('schedule_generated', 'export_clicked')
    `;
    const gensForExport = Number(exportRaw[0]?.gens || 0);
    const exports = Number(exportRaw[0]?.exports || 0);
    const exportRate = gensForExport > 0 ? (exports / gensForExport) * 100 : 0;

    // 4. Returning Users
    const returningUsersCountRaw = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT COALESCE(current.session_id, current.meta->>'userId', current.meta->>'deviceId')) as count
        FROM "analytics_events" as current
        WHERE current.created_at >= ${start} AND current.created_at < ${end}
        AND EXISTS (
            SELECT 1 FROM "analytics_events" as past
            WHERE COALESCE(past.session_id, past.meta->>'userId', past.meta->>'deviceId') = COALESCE(current.session_id, current.meta->>'userId', current.meta->>'deviceId')
            AND past.created_at < ${start}
        )
    `;
    const returningUsers = Number(returningUsersCountRaw[0]?.count || 0);

    // 5. Biggest Drop-off Step
    // Logic: Fetch step_viewed events, group by stepId in JS (usually small enough for step stats).
    // If volume is huge, filtering by eventName still keeps it manageable per range.
    const stepEvents = await prisma.analyticsEvent.findMany({
        where: {
            eventName: "step_viewed",
            createdAt: { gte: start, lt: end },
        },
        select: {
            meta: true,
            sessionId: true,
            eventName: true // needed for select? no
        }
    });

    const stepCounts: Record<string, Set<string>> = {};
    stepEvents.forEach(e => {
        const meta = e.meta as any;
        const actorId = e.sessionId || meta?.userId || meta?.deviceId || "anonymous";
        const stepId = meta?.stepId ? String(meta.stepId) : "unknown";
        if (!stepCounts[stepId]) stepCounts[stepId] = new Set();
        stepCounts[stepId].add(actorId);
    });

    const sortedSteps = Object.keys(stepCounts).filter(k => !isNaN(Number(k))).sort((a, b) => Number(a) - Number(b));
    let maxDrop = 0;
    let biggestDropStep = "N/A";

    for (let i = 0; i < sortedSteps.length - 1; i++) {
        const currStep = sortedSteps[i];
        const nextStep = sortedSteps[i + 1];
        const currCount = stepCounts[currStep].size;
        const nextCount = stepCounts[nextStep].size;
        const drop = currCount - nextCount;
        if (drop > maxDrop) {
            maxDrop = drop;
            biggestDropStep = `Step ${currStep} → ${nextStep}`;
        }
    }

    return {
        schedulesGenerated: schedulesGeneratedCount,
        activationRate,
        exportRate,
        returningUsers,
        biggestDropoffStep: biggestDropStep === "N/A" && sortedSteps.length > 0 ? "None" : biggestDropStep
    };
}

function calculateDelta(current: number, previous: number): number {
    if (previous === 0) return 0; // Or specific indicator? UI will handle 0 as "--" or similar if we want.
    return ((current - previous) / previous) * 100;
}

/**
 * Fetch KPI counts for the given date range.
 * Best-effort: catches DB errors and returns success=false.
 * @deprecated Use getAdminKpis instead
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

        // Histogram of ALL event names in range
        const histogram = await prisma.analyticsEvent.groupBy({
            by: ['eventName'],
            where: {
                createdAt: { gte: currentStart, lt: currentEnd }
            },
            _count: {
                id: true
            }
        });

        // Check for actorId presence
        const totalEvents = await prisma.analyticsEvent.count({
            where: { createdAt: { gte: currentStart, lt: currentEnd } }
        });

        const withSession = await prisma.analyticsEvent.count({
            where: {
                createdAt: { gte: currentStart, lt: currentEnd },
                sessionId: { not: null }
            }
        });

        // Get sample of 5 recent events raw (to check timezones/names)
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
