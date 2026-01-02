import { PrismaClient } from "@prisma/client";

/**
 * Calculates production-grade KPI metrics for the analytics dashboard
 * Strictly scoped to the provided date range (or default) and specific funnel events.
 */
export async function getFunnelKPIs(prisma: PrismaClient, dateWhereCondition: any) {
    // 1. Fetch relevant events (minimal query)
    // We only need eventName, sessionId, createdAt for the specific funnel step events
    const events = await prisma.analyticsEvent.findMany({
        where: {
            ...dateWhereCondition, // Apply dynamic date range e.g. { createdAt: { gte: ... } }
            eventName: { in: ["wizard_viewed", "schedule_generated"] },
            sessionId: { not: null }, // Ignore anonymous/invalid sessions
        },
        select: {
            eventName: true,
            sessionId: true,
            createdAt: true,
        },
        orderBy: { createdAt: "asc" }, // Ascending for easier time-diff calculation
    });

    // 2. Process in Memory
    const wizardSessions = new Set<string>();
    const convertedSessions = new Set<string>();

    // Map sessionId -> { wizard: firstTime, schedule: firstTime }
    const sessionTimings = new Map<
        string,
        { wizard?: Date; schedule?: Date }
    >();

    for (const evt of events) {
        if (!evt.sessionId) continue;

        const sid = evt.sessionId;

        // -- Cohort / Conversion Tracking --
        if (evt.eventName === "wizard_viewed") {
            wizardSessions.add(sid);
        }
        if (evt.eventName === "schedule_generated") {
            // Only count as conversion if they also viewed wizard (funnel strictness)
            // Although the prompt implies "numerator: have both", checking set logic later is safer
            // We'll track presence here
        }

        // -- Timing Tracking --
        let timing = sessionTimings.get(sid);
        if (!timing) {
            timing = {};
            sessionTimings.set(sid, timing);
        }

        if (evt.eventName === "wizard_viewed" && !timing.wizard) {
            timing.wizard = evt.createdAt;
        }
        if (evt.eventName === "schedule_generated" && !timing.schedule) {
            timing.schedule = evt.createdAt;
        }
    }

    // 3. Compute Metrics

    // -- Conversion Rate --
    let numerator = 0;
    for (const sid of wizardSessions) {
        // Check if this session ALSO has a schedule_generated event
        // We can check our sessionTimings map or do a separate pass.
        // Easiest is to check if we found a schedule time for it (or any schedule event).
        // Let's rely on sessionTimings as it captures presence of both effectively.
        const t = sessionTimings.get(sid);
        if (t?.schedule) {
            numerator++;
        }
    }
    const denominator = wizardSessions.size;
    const conversionRate = denominator > 0 ? (numerator / denominator) * 100 : 0;
    const conversionDisplay = conversionRate.toFixed(1) + "%";


    // -- Avg Time to Schedule --
    let totalDeltaMs = 0;
    let validDeltasCount = 0;

    for (const [sid, times] of sessionTimings.entries()) {
        if (times.wizard && times.schedule) {
            const delta = times.schedule.getTime() - times.wizard.getTime();

            // Filter outliers: 2 seconds to 30 minutes
            const minMs = 2 * 1000;
            const maxMs = 30 * 60 * 1000;

            if (delta >= minMs && delta <= maxMs) {
                totalDeltaMs += delta;
                validDeltasCount++;
            }
        }
    }

    let avgTimeDisplay = "—";
    if (validDeltasCount > 0) {
        const avgMs = totalDeltaMs / validDeltasCount;

        // Format mm:ss
        const totalSeconds = Math.floor(avgMs / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        const mm = minutes.toString().padStart(2, "0");
        const ss = seconds.toString().padStart(2, "0");

        // Optional hh if > 60m (though we filter max 30m, so unlikely needed unless logic changes)
        avgTimeDisplay = `${mm}:${ss}`;
    }

    return {
        conversionRate: conversionDisplay,
        avgTimeToSchedule: avgTimeDisplay,
    };
}
