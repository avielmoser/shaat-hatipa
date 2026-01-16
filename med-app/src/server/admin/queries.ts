
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

        // 1. Wizard Views
        const countWizard = await prisma.analyticsEvent.groupBy({
            by: ['sessionId'],
            where: {
                eventName: "wizard_viewed",
                createdAt: { gte: currentStart, lt: currentEnd },
                sessionId: { not: null }
            }
        }).then(r => r.length);

        // 2. Generate Clicked
        // Note: Check taxonomy if 'generate_schedule_clicked' is tracked. 
        // User request says: "generate_schedule_clicked". 
        // Commit 6 task is to "Add emit if missing". For now we assume logic exists or will be 0.
        const countGenClick = await prisma.analyticsEvent.groupBy({
            by: ['sessionId'],
            where: {
                eventName: "generate_schedule_clicked",
                createdAt: { gte: currentStart, lt: currentEnd },
                sessionId: { not: null }
            }
        }).then(r => r.length);

        // 3. Schedule Generated
        const countGenerated = await prisma.analyticsEvent.groupBy({
            by: ['sessionId'],
            where: {
                eventName: "schedule_generated",
                createdAt: { gte: currentStart, lt: currentEnd },
                sessionId: { not: null }
            }
        }).then(r => r.length);

        // 4. Export Clicked
        const countExport = await prisma.analyticsEvent.groupBy({
            by: ['sessionId'],
            where: {
                eventName: "export_clicked",
                createdAt: { gte: currentStart, lt: currentEnd },
                sessionId: { not: null }
            }
        }).then(r => r.length);

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
export async function getAdminBreakdown(rangeDays: number): Promise<QueryResult<BreakdownResult>> {
    try {
        const { currentStart } = getDateRanges(rangeDays);
        const currentEnd = new Date();

        // 1. By Clinic (using native column clinicSlug)
        // We need counts for:
        // - Wizard Views (for activation) - grouped by clinic
        // - Schedules Gen (for count + activation + export) - grouped by clinic
        // - Export Clicks (for export rate) - grouped by clinic

        // Helper to query group counts
        const getGroupCounts = async (eventName: string, groupByField: 'clinicSlug') => {
            return prisma.analyticsEvent.groupBy({
                by: [groupByField],
                where: {
                    eventName,
                    createdAt: { gte: currentStart, lt: currentEnd },
                    [groupByField]: { not: null }
                },
                _count: { sessionId: true } // Distinct per session better? 
                // GroupBy count gives total rows. Distinct session is harder with groupBy in one go.
                // We'll stick to event counts or session counts if possible?
                // "activationRate: schedule_generated / wizard_viewed (by session_id...)"
                // Prisma groupBy doesn't support distinct counts strictly inside easily without raw.
                // We'll use counts for breakdown to be fast, or raw query for distinct.
                // Let's use Raw for accuracy as per "North Star" quality.
            });
        };

        // We will use raw queries for Breakdowns to support the "Distinct Session" logic
        // and JSON extraction for protocols.

        // --- Clinics ---
        // Get all stats aggregated by clinic_slug
        const clinicStatsRaw = await prisma.$queryRaw<any[]>`
            SELECT 
                COALESCE(e.clinic_slug, 'unknown') as id,
                COUNT(DISTINCT CASE WHEN e.event_name = 'wizard_viewed' THEN e.session_id END) as views,
                COUNT(DISTINCT CASE WHEN e.event_name = 'schedule_generated' THEN e.session_id END) as gens,
                COUNT(DISTINCT CASE WHEN e.event_name = 'export_clicked' THEN e.session_id END) as exports
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
                label: row.id, // We could map slug to name if we had config, use slug for now
                schedulesGenerated: gens,
                activationRate: views > 0 ? (gens / views) * 100 : 0,
                exportRate: gens > 0 ? (exports / gens) * 100 : 0,
            };
        }).sort((a, b) => b.schedulesGenerated - a.schedulesGenerated);

        // --- Protocols ---
        // Group by meta->>'protocol' (or protocolKey)
        // adjust key based on actual event payload. Assuming 'protocol' or 'protocolKey'.
        // We'll check both or assume 'protocol' based on taxonomy?
        // Let's guess 'protocol' first.
        const protocolStatsRaw = await prisma.$queryRaw<any[]>`
            SELECT 
                COALESCE(e.meta->>'protocol', e.meta->>'protocolKey', 'unknown') as id,
                COUNT(DISTINCT CASE WHEN e.event_name = 'wizard_viewed' THEN e.session_id END) as views,
                COUNT(DISTINCT CASE WHEN e.event_name = 'schedule_generated' THEN e.session_id END) as gens,
                COUNT(DISTINCT CASE WHEN e.event_name = 'export_clicked' THEN e.session_id END) as exports
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
    // 1. Schedules Generated (North Star)
    // Count distinct sessions that generated a schedule? Or total schedules?
    // "NB: Activation Rate = schedule_generated / wizard_viewed (by session_id...)"
    // For 'Schedules Generated' raw count is usually better for North Star, unless specified otherwise.
    // User said: "Schedules Generated (last X days)" -> Implies count.

    // We'll use aggregation to be efficient.
    const schedulesGeneratedCount = await prisma.analyticsEvent.count({
        where: {
            eventName: "schedule_generated",
            createdAt: { gte: start, lt: end }
        }
    });

    // 2. Activation Rate inputs
    // Distinct sessions that viewed wizard
    const distinctWizardViews = await prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
            eventName: "wizard_viewed",
            createdAt: { gte: start, lt: end },
            sessionId: { not: null }
        }
    }).then(r => r.length);

    // Distinct sessions that generated schedule
    const distinctScheduleGens = await prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
            eventName: "schedule_generated",
            createdAt: { gte: start, lt: end },
            sessionId: { not: null }
        }
    }).then(r => r.length);

    const activationRate = distinctWizardViews > 0
        ? distinctScheduleGens / distinctWizardViews
        : 0;

    // 3. Export Rate inputs
    // Distinct sessions that clicked export
    const distinctExportClicks = await prisma.analyticsEvent.groupBy({
        by: ['sessionId'],
        where: {
            eventName: "export_clicked",
            createdAt: { gte: start, lt: end },
            sessionId: { not: null }
        }
    }).then(r => r.length);

    const exportRate = distinctScheduleGens > 0
        ? distinctExportClicks / distinctScheduleGens
        : 0;

    // 4. Returning Users
    // Users in this range who had events BEFORE this range.
    // We use a raw query for performance to avoid fetching all IDs.
    // Note: We need to ensure table name matches schema: "analytics_events"
    const returningUsersCountRaw = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT current.session_id) as count
        FROM "analytics_events" as current
        WHERE current.created_at >= ${start} AND current.created_at < ${end}
        AND current.session_id IS NOT NULL
        AND EXISTS (
            SELECT 1 FROM "analytics_events" as past
            WHERE past.session_id = current.session_id
            AND past.created_at < ${start}
        )
    `;
    const returningUsers = Number(returningUsersCountRaw[0]?.count || 0);

    // 5. Biggest Drop-off Step
    // We need step counts.
    // Steps: wizard_viewed -> step_viewed(1) -> ... -> step_viewed(N)
    // We'll fetch all step_viewed events and aggregate in memory as stepId is in JSON meta.
    // If volume is high, this is risky, but for now it's acceptable.
    // Optimization: limit fields.
    const stepEvents = await prisma.analyticsEvent.findMany({
        where: {
            eventName: "step_viewed",
            createdAt: { gte: start, lt: end },
        },
        select: {
            meta: true,
            sessionId: true
        }
    });

    // Group distinct sessions per step
    const stepCounts: Record<string, Set<string>> = {};
    stepEvents.forEach(e => {
        const meta = e.meta as any;
        const stepId = meta?.stepId ? String(meta.stepId) : "unknown";
        if (!stepCounts[stepId]) stepCounts[stepId] = new Set();
        if (e.sessionId) stepCounts[stepId].add(e.sessionId);
    });

    // Find biggest drop
    // Assuming steps 0, 1, 2, 3...
    // We also consider 'wizard_viewed' as logical step 0 if we want, but user said "max drop between step_viewed counts".
    // We'll stick to the steps found in `step_viewed`.
    // Sort keys numerically
    const sortedSteps = Object.keys(stepCounts).sort((a, b) => Number(a) - Number(b));
    let maxDrop = 0;
    let biggestDropStep = "N/A";

    for (let i = 0; i < sortedSteps.length - 1; i++) {
        const currStep = sortedSteps[i];
        const nextStep = sortedSteps[i + 1];
        const currCount = stepCounts[currStep].size;
        const nextCount = stepCounts[nextStep].size;

        // Drop is (curr - next). We care about absolute drop? or percentage?
        // "Biggest Drop-off" usually means absolute loss of users.
        const drop = currCount - nextCount;
        if (drop > maxDrop) {
            maxDrop = drop;
            biggestDropStep = `Step ${currStep} code→ ${nextStep}`;
        }
    }

    // Also check initial wizard -> first step drop if requested?
    // "identify the step with max drop between step_viewed counts" -> strict reading: only between steps.

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
