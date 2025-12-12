export type AnalyticsEventType = "page_view" | "action" | "conversion";

// Central Source of Truth for allowed events and their types
export const EVENT_TAXONOMY: Record<string, AnalyticsEventType> = {
    // Page Views
    page_view: "page_view",
    wizard_viewed: "page_view",

    // High-Value Actions (Allowlisted)
    generate_schedule_clicked: "action",
    schedule_generation_failed: "action",
    export_failed: "action",

    // Conversions (Always Tracked)
    schedule_generated: "conversion",
    export_clicked: "conversion",

    // Legacy/Other mappings (if we want to keep them but reclassify)
    // For now, we only allow what is explicitly here.
};

/**
 * Returns the event type for a given event name.
 * If the event is not in the taxonomy, returns undefined (implicitly blocked).
 */
export function getEventType(eventName: string): AnalyticsEventType | undefined {
    return EVENT_TAXONOMY[eventName];
}

/**
 * Determines if an event should be tracked based on its type and name.
 * @param eventName The name of the event
 * @returns { shouldTrack: boolean, eventType?: AnalyticsEventType }
 */
export function getTrackingPolicy(eventName: string): { shouldTrack: boolean; eventType?: AnalyticsEventType } {
    const eventType = getEventType(eventName);

    if (!eventType) {
        // Block unknown events (Default Deny)
        return { shouldTrack: false };
    }

    // Always track conversions and page views (subject to dedupe later)
    if (eventType === "conversion" || eventType === "page_view") {
        return { shouldTrack: true, eventType };
    }

    // For actions, they must be explicitly in our taxonomy map to be returned at all,
    // so if we got here, it's allowlisted.
    if (eventType === "action") {
        return { shouldTrack: true, eventType };
    }

    return { shouldTrack: false };
}
