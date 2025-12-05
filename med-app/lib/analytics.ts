"use client";

type AnalyticsEventData = {
    step?: string;
    buttonId?: string;
    [key: string]: unknown;
};

/**
 * Tracks an analytics event by sending it to the server.
 * This function is fire-and-forget and will not throw errors to the caller.
 *
 * @param eventName The name of the event (e.g., 'wizard_step_1_completed')
 * @param data Optional additional data (step, buttonId, etc.)
 */
import { getSessionId } from "@/utils/analyticsSession";

export function trackEvent(eventName: string, data?: AnalyticsEventData) {
    const sessionId = getSessionId();
    try {
        // Fire and forget - don't await
        fetch("/api/analytics", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                eventName,
                sessionId,
                ...data,
            }),
        }).catch((err) => {
            // Silent failure in production, log in dev if needed
            if (process.env.NODE_ENV === "development") {
                console.error("Analytics tracking failed:", err);
            }
        });
    } catch (err) {
        // Safety net for synchronous errors
        if (process.env.NODE_ENV === "development") {
            console.error("Analytics tracking error:", err);
        }
    }
}
