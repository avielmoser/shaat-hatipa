import { AnalyticsEvent } from "@prisma/client";
import { subDays, startOfDay, endOfDay } from "date-fns";

export interface NormalizedEvent {
    id: string;
    eventName: string;
    createdAt: Date;
    meta: Record<string, any>;
    actorId: string;
}

/**
 * Normalizes a raw DB event into a consistent shape for analytics.
 * Resolves actorId from sessionId > userId (not in schema but just in case) > deviceId (via meta) > 'anonymous'.
 */
export function normalizeEvent(event: AnalyticsEvent): NormalizedEvent {
    const meta = (event.meta as Record<string, any>) || {};

    // Resolve Actor ID hierarchy
    let actorId = "anonymous";
    if (event.sessionId) {
        actorId = event.sessionId;
    } else if (meta.userId) {
        actorId = meta.userId;
    } else if (meta.deviceId) {
        actorId = meta.deviceId;
    }

    return {
        id: event.id,
        eventName: event.eventName,
        createdAt: event.createdAt,
        meta,
        actorId,
    };
}

/**
 * Returns the date range for the current period and the previous period (for comparisons).
 * @param rangeDays e.g. 30
 */
export function getDateRanges(rangeDays: number) {
    const today = new Date();
    const currentStart = startOfDay(subDays(today, rangeDays - 1)); // Inclusive of today

    // Previous period: [currentStart - rangeDays, currentStart)
    // actually, let's just do easy math: 
    // current: [now - X, now]
    // prev: [now - 2X, now - X]

    const previousStart = startOfDay(subDays(currentStart, rangeDays));

    return {
        currentStart,
        previousStart,
        previousEnd: currentStart, // The previous period ends where the current begins
    }
}
