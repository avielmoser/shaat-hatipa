import { PrismaClient, Prisma } from "@prisma/client";


/**
 * PRODUCTION ANALYTICS DASHBOARD - AGGREGATION LOGIC
 * =================================================
 * 
 * Rules:
 * 1. Output MUST be stable and deterministic.
 * 2. All time ranges are inclusive.
 * 3. Fallback to 0 if no data.
 */

// Types matched to Dashboard UI needs
export type DashboardMetrics = {
    kpis: {
        totalVisits: number;
        avgDailyVisits: number;
        timeModificationRate: string; // "XX.X%"
        avgProtocolReviewTime: { avg: string; median: string; buckets: Record<string, number> };
        scheduleCreationRate: string; // "XX.X%"
        calendarAddRate: string; // "XX.X%"
        pdfExportRate: string; // "XX.X%"
    };
    graphs: {
        monthly: { date: string; visits: number; movingAvg: number }[];
        yearly: { month: string; avgDaily: number }[];
    };
    funnel: {
        started: number;
        step2: number;
        generated: number;
    };
    filters: {
        clinics: string[];
        protocols: string[];
    };
    debug?: {
        totalDbEvents: number;
    };
};

type FilterParams = {
    clinicSlug?: string;
    protocol?: string; // stored in meta->surgeryType usually
    startDate: Date;
    endDate: Date;
    locale?: string;
    device?: string; // meta->device
    view?: string; // "meaningful" | "all"
};

export async function getDashboardMetrics(prisma: PrismaClient, filters: FilterParams): Promise<DashboardMetrics> {
    const { startDate, endDate, clinicSlug, protocol, view } = filters;

    // 0. Fallback "Zero" metrics
    const ZERO_METRICS: DashboardMetrics = {
        kpis: {
            totalVisits: 0,
            avgDailyVisits: 0,
            timeModificationRate: "0.0%",
            avgProtocolReviewTime: { avg: "—", median: "—", buckets: { "<5s": 0, "5–15s": 0, "15–30s": 0, "30s+": 0 } },
            scheduleCreationRate: "0.0%",
            calendarAddRate: "0.0%",
            pdfExportRate: "0.0%"
        },
        graphs: { monthly: [], yearly: [] },
        funnel: { started: 0, step2: 0, generated: 0 },
        filters: { clinics: [], protocols: [] },
        debug: { totalDbEvents: 0 }
    };

    // 1. Build Where Clause Defensively
    // explicit type ensures we don't mess up Prisma inputs
    const where: Prisma.AnalyticsEventWhereInput = {};

    // A) Date Range (Always required)
    // ensure end date covers the full day
    const adjustedEndDate = new Date(endDate);
    if (adjustedEndDate.getHours() === 0 && adjustedEndDate.getMinutes() === 0 && adjustedEndDate.getSeconds() === 0) {
        adjustedEndDate.setHours(23, 59, 59, 999);
    }

    where.createdAt = {
        gte: startDate,
        lte: adjustedEndDate
    };

    if (process.env.NODE_ENV === "development") {
        console.log(`[Analytics] Fetching range: ${startDate.toISOString()} -> ${adjustedEndDate.toISOString()}`);
    }

    // B) Clinic Filter (Optional & Safe)
    // Only apply if clinicSlug is a valid non-empty string and NOT "all"
    if (clinicSlug && clinicSlug !== "all") {
        where.clinicSlug = clinicSlug;
    }

    // C) Protocol Filter (Optional)
    if (protocol && protocol !== "all") {
        where.meta = {
            path: ['surgeryType'],
            equals: protocol
        };
    }

    // D) Meaningful Filter (Optional)
    // If view=meaningful, we want to exclude strictly noise (page_view) OR include only action/conversion.
    if (view === "meaningful") {
        // We check both the top-level column and the meta field for robustness
        where.OR = [
            { eventType: { in: ["action", "conversion"] } },
            { meta: { path: ["eventType"], not: "page_view" } }
        ];
    }

    // Optimization: limit to relevant event names
    const RELEVANT_EVENTS = [
        "wizard_viewed",
        "time_modified",
        "step_viewed",
        "generate_schedule_clicked",
        "schedule_generated",
        "export_clicked"
    ];

    // Ensure eventName is one of relevant events
    where.eventName = { in: RELEVANT_EVENTS };

    // Ensure sessionId exists
    where.sessionId = { not: null };

    // 2. Execute Query
    const events = await prisma.analyticsEvent.findMany({
        where,
        select: {
            eventName: true,
            sessionId: true,
            createdAt: true,
            step: true,
            meta: true,
            clinicSlug: true
        },
        orderBy: { createdAt: "asc" }
    });

    // --- AGGREGATION IN MEMORY ---

    const sessions = new Map<string, any>();
    // Structure: sessionId -> { 
    //   wizardViewed: boolean, 
    //   timeModified: boolean, 
    //   step2Viewed: Date[], 
    //   step3Viewed: Date[], 
    //   scheduleGenerated: boolean,
    //   calendarExport: boolean,
    //   pdfExport: boolean
    // }

    let totalSessions = 0; // count of unique sessions in window (approx, based on wizard_viewed or any activity?)
    // "Visits" usually means session starts. Let's use 'wizard_viewed' as session start indicator for this app context.

    events.forEach(e => {
        const sid = e.sessionId!;
        if (!sessions.has(sid)) {
            sessions.set(sid, {
                wizardViewed: false,
                timeModified: false,
                step2Viewed: [] as Date[],
                step3Viewed: [] as Date[],
                scheduleGenerated: false,
                calendarExport: false,
                pdfExport: false
            });
        }
        const s = sessions.get(sid);

        if (e.eventName === "wizard_viewed") s.wizardViewed = true;

        // Time Mod: check event name OR explicit flag if we tracked it differently before
        if (e.eventName === "time_modified") s.timeModified = true;

        if (e.eventName === "step_viewed") {
            const stepVal = String(e.step);
            if (stepVal === "2") s.step2Viewed.push(e.createdAt);
            if (stepVal === "3") s.step3Viewed.push(e.createdAt);
        }

        if (e.eventName === "schedule_generated" || e.eventName === "generate_schedule_clicked") {
            s.scheduleGenerated = true;
        }

        if (e.eventName === "export_clicked") {
            // Check meta for type
            const type = (e.meta as any)?.exportType;
            if (type === "ics") s.calendarExport = true;
            if (type === "pdf") s.pdfExport = true;
        }
    });

    // --- CALC METRICS ---

    let countWizardStarted = 0;
    let countTimeMod = 0;
    let countGenerated = 0;
    let countCalendar = 0;
    let countPdf = 0;
    let timeOnStep2Samples: number[] = [];

    // Funnel Steps (Strict)
    let funnelStarted = 0;
    let funnelStep2 = 0;
    let funnelGenerated = 0;

    for (const [sid, data] of sessions.entries()) {
        if (data.wizardViewed) {
            countWizardStarted++;
            funnelStarted++;

            if (data.timeModified) countTimeMod++;
            if (data.scheduleGenerated) {
                countGenerated++;
                funnelGenerated++;
            }
            if (data.step2Viewed.length > 0) funnelStep2++;

            // For export rates, denominator is schedule_generated
            if (data.scheduleGenerated) {
                if (data.calendarExport) countCalendar++;
                if (data.pdfExport) countPdf++;
            }
        }

        // Time on Step 2
        // Logic: Time between entering Step 2 and entering Step 3 (Conversion)
        // Limitation: If they drop off, we don't have end time (unless we used beacon/unload).
        // Only count successful transitions to Step 3 for precise "Time to Review".
        // Or check next event?
        // Requirement: "Average time on step 2 (Protocol Review)"
        // Robust way: matched pairs of Step2 -> Step3 in same session.
        if (data.step2Viewed.length > 0 && data.step3Viewed.length > 0) {
            // Find first Step 2 and first Step 3 AFTER that Step 2
            // Simple approach: min(Step2) vs min(Step3) provided Step3 > Step2
            const start = data.step2Viewed[0]; // Earliest entry to Step 2
            // Find first Step 3 after start
            const end = data.step3Viewed.find((d: Date) => d > start);

            if (end) {
                const diffSeconds = (end.getTime() - start.getTime()) / 1000;
                // Outlier filtering: < 2s (accidental) or > 10m (left open)
                if (diffSeconds > 1 && diffSeconds < 600) {
                    timeOnStep2Samples.push(diffSeconds);
                }
            }
        }
    }

    // 1. Time Modification Rate
    const timeModRate = countWizardStarted > 0
        ? ((countTimeMod / countWizardStarted) * 100).toFixed(1)
        : "0.0";

    // 2. Avg Time on Step 2
    let avgStep2 = "—";
    let medianStep2 = "—";
    const buckets = { "<5s": 0, "5–15s": 0, "15–30s": 0, "30s+": 0 };

    if (timeOnStep2Samples.length > 0) {
        // Avg
        const total = timeOnStep2Samples.reduce((a, b) => a + b, 0);
        avgStep2 = (total / timeOnStep2Samples.length).toFixed(1) + "s";

        // Median
        timeOnStep2Samples.sort((a, b) => a - b);
        const mid = Math.floor(timeOnStep2Samples.length / 2);
        medianStep2 = timeOnStep2Samples.length % 2 !== 0
            ? timeOnStep2Samples[mid].toFixed(1) + "s"
            : ((timeOnStep2Samples[mid - 1] + timeOnStep2Samples[mid]) / 2).toFixed(1) + "s";

        // Buckets
        timeOnStep2Samples.forEach(t => {
            if (t < 5) buckets["<5s"]++;
            else if (t < 15) buckets["5–15s"]++;
            else if (t < 30) buckets["15–30s"]++;
            else buckets["30s+"]++;
        });
    }

    // 3. Schedule Creation Rate
    const scheduleRate = countWizardStarted > 0
        ? ((countGenerated / countWizardStarted) * 100).toFixed(1)
        : "0.0";

    // 4. Calendar Add Rate (of those generated)
    const calRate = countGenerated > 0
        ? ((countCalendar / countGenerated) * 100).toFixed(1)
        : "0.0";

    // 5. PDF Export Rate (of those generated)
    const pdfRate = countGenerated > 0
        ? ((countPdf / countGenerated) * 100).toFixed(1)
        : "0.0";

    // 6. Avg Daily Visits
    // We count "Unique Sessions per Day"
    // Map date string -> Set(sessionIds)
    const sessionsPerDay = new Map<string, Set<string>>();

    // We loop events again to populate this? Or use the sessions map if we tracked start date?
    // Let's loop relevant events (wizard_viewed) to place sessions in days.
    // Actually, one session can span days? Usually not in this app.
    // Use first event of session to bucket it.

    // Quick helper: valid events for "Visit" = anything? Or just wizard_viewed?
    // "Visits" usually means sessions.
    const allSessionIds = new Set<string>();

    // Re-iterate events or use optimization.
    // Since we queried 'wizard_viewed', let's use that for "Visits" to keep it clean.
    // Or use any interaction? Req says "Avg Daily Visits".
    // Let's use ANY event to bucket a session into a day, or just wizard_viewed (New Visit).
    // Sticking to "wizard_viewed" matches the funnel start.

    events.forEach(e => {
        if (e.eventName === "wizard_viewed") {
            const day = e.createdAt.toISOString().split('T')[0];
            if (!sessionsPerDay.has(day)) sessionsPerDay.set(day, new Set());
            sessionsPerDay.get(day)!.add(e.sessionId!);

            allSessionIds.add(e.sessionId!);
        }
    });

    const totalUniqueSessions = allSessionIds.size;
    const numDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const avgDailyVisits = totalUniqueSessions / numDays;


    // --- GRAPHS ---

    // A) Monthly Traffic (Last X days in view, grouped by day)
    // We will fill gaps with 0
    const monthlyData: { date: string; visits: number; movingAvg: number }[] = [];

    // Generate all dates in range
    const d = new Date(startDate);
    const dayMap = new Map<string, number>();

    // Pre-fill from sessionsPerDay
    sessionsPerDay.forEach((set, day) => {
        dayMap.set(day, set.size);
    });

    while (d <= adjustedEndDate) {
        const dateStr = d.toISOString().split('T')[0];
        const visits = dayMap.get(dateStr) || 0;

        // Moving Avg (7-day)
        // Inefficient to look back every time, but fine for N=30 or 365
        let sum7 = 0;
        let count7 = 0;
        for (let i = 0; i < 7; i++) {
            const lookBack = new Date(d);
            lookBack.setDate(lookBack.getDate() - i);
            const lbs = lookBack.toISOString().split('T')[0];
            // Note: This looks outside the startDate if we are near the start.
            // Ideally we should have fetched extra data for MA, but 0 assumption is acceptable for now or simple cumulative.
            // We will check dayMap (which only has data in range).
            // If we want strict MA, we need data before startDate. 
            // Simplification: only average available data or assume 0.
            if (dayMap.has(lbs)) {
                sum7 += dayMap.get(lbs)!;
                count7++;
            }
        }
        const ma = count7 > 0 ? sum7 / count7 : 0;

        monthlyData.push({
            date: dateStr,
            visits,
            movingAvg: parseFloat(ma.toFixed(1))
        });
        d.setDate(d.getDate() + 1);
    }

    // B) Yearly Traffic (Avg daily visits per month)
    // We need 12 months data? Or just the data in the range grouped by month?
    // "Yearly Traffic Graph: X: Months, Y: Average daily visits per month"
    // We use the same dataset passed (which might be 30 days or 1 year).
    // If the user selected "Last 30 Days", yearly graph is just 1 bar?
    // Usually "Yearly Traffic" implies a fixed view of the last year?
    // Req says "REQUIRED GRAPHS... B) Yearly Traffic".
    // If the filter is restricted, we show what is in filter.
    // If we want to show strict Yearly regardless of filter, we need a separate query.
    // Filter requirement: "All metrics MUST support filtering by... Time range".
    // So if I select "Last 7 days", the yearly graph shows 1 month with small average.
    // Correct.

    const monthMap = new Map<string, { totalVisits: number, daysCount: Set<string> }>();

    monthlyData.forEach(item => {
        const monthKey = item.date.substring(0, 7); // YYYY-MM
        if (!monthMap.has(monthKey)) monthMap.set(monthKey, { totalVisits: 0, daysCount: new Set() });
        const m = monthMap.get(monthKey)!;
        m.totalVisits += item.visits;
        m.daysCount.add(item.date);
    });

    const yearlyData = Array.from(monthMap.entries()).map(([month, data]) => ({
        month,
        avgDaily: parseFloat((data.totalVisits / data.daysCount.size).toFixed(1))
    })).sort((a, b) => a.month.localeCompare(b.month));


    // --- Available Filters ---

    // Extract unique clinics/protocols from events for filter dropdowns?
    // Or ideally, these come from Config.
    // But we can return what we saw in the data.
    const uniqueClinics = Array.from(new Set(events.map(e => e.clinicSlug).filter(Boolean))) as string[];
    // Protocols are inside meta, harder to extract distinct efficiently without DB support.
    // We'll leave protocols empty here, UI can use static config or hardcoded list if needed.
    const uniqueProtocols: string[] = []; // Populate if feasible or use predefined

    // Diagnostic: Count total events in DB to distinguish "No Data" vs "Filter too strict"
    const totalDbEvents = await prisma.analyticsEvent.count();

    return {
        kpis: {
            totalVisits: totalUniqueSessions,
            avgDailyVisits: parseFloat(avgDailyVisits.toFixed(1)),
            timeModificationRate: `${timeModRate}%`,
            avgProtocolReviewTime: {
                avg: avgStep2,
                median: medianStep2,
                buckets
            },
            scheduleCreationRate: `${scheduleRate}%`,
            calendarAddRate: `${calRate}%`,
            pdfExportRate: `${pdfRate}%`
        },
        graphs: {
            monthly: monthlyData,
            yearly: yearlyData
        },
        funnel: {
            started: funnelStarted,
            step2: funnelStep2,
            generated: funnelGenerated
        },
        filters: {
            clinics: uniqueClinics,
            protocols: uniqueProtocols
        },
        debug: {
            totalDbEvents
        }
    };
}
