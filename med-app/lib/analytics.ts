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

export function trackEvent(eventName: string, data?: AnalyticsEventData & { deduplicate?: boolean }) {
    // 1. Centralized Guard: completely disable analytics on /admin/**
    if (typeof window !== "undefined") {
        if (window.location.pathname.startsWith("/admin")) return;
    }

    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

    // 2. Deduplication Logic (Session-Based)
    if (data?.deduplicate && typeof window !== "undefined") {
        const dedupKey = `analytics_deduplicated:${eventName}:${currentPath}`;
        if (sessionStorage.getItem(dedupKey)) {
            if (process.env.NODE_ENV === "development") {
                console.log(`[Analytics] Skipped duplicate session event: ${eventName} at ${currentPath}`);
            }
            return;
        }
        sessionStorage.setItem(dedupKey, "true");
    }

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
                path: currentPath,
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
