"use client";

import { getSessionId } from "@/utils/analyticsSession";
import { getTrackingPolicy, AnalyticsEventType } from "./analytics.taxonomy";

import { getClinicConfig } from "@/config/clinics";

type AnalyticsEventData = {
    eventType?: AnalyticsEventType; // Optional now as we derive it
    step?: string;
    buttonId?: string;
    clinicSlug?: string;
    [key: string]: unknown;
};

/**
 * Tracks an analytics event by sending it to the server.
 * This function is fire-and-forget and will not throw errors to the caller.
 *
 * @param eventName The name of the event (e.g., 'wizard_viewed')
 * @param data Event data
 */
export function trackEvent(eventName: string, data: AnalyticsEventData) {
    // 1. Centralized Guard: completely disable analytics on /admin/**
    if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (path.startsWith("/admin")) return;
    }

    const currentPath = typeof window !== "undefined" ? window.location.pathname : "";

    // 2. Strict Taxonomy & Policy Check
    const policy = getTrackingPolicy(eventName);
    if (!policy.shouldTrack || !policy.eventType) {
        if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1") {
            console.log(`[Analytics Debug] Blocked event not in allowlist: ${eventName}`);
        }
        return;
    }

    const finalEventType = policy.eventType;

    // 3. Smart Sampling & Deduplication
    if (typeof window !== "undefined") {
        if (finalEventType === "page_view") {
            // Deduplicate per session + path
            // Only 1 write per session per page
            const dedupKey = `analytics_deduplicated:${eventName}:${currentPath}`;
            if (sessionStorage.getItem(dedupKey)) {
                if (process.env.NODE_ENV === "development") {
                    console.log(`[Analytics] Skipped duplicate page_view: ${eventName} at ${currentPath}`);
                }
                return;
            }
            sessionStorage.setItem(dedupKey, "true");
        }
        // actions & conversions: always allow (subject to allowlist above)
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
                eventType: finalEventType, // Enforce derived type
                sessionId,
                path: currentPath,
                clinicSlug: data.clinicSlug || getClinicConfig().slug, // Auto-inject clinic context
                ...data,
            }),
        }).then(res => {
            if (process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1") {
                console.log(`[Analytics Debug] Event '${eventName}' status: ${res.status}`);
            }
        }).catch((err) => {
            // Silent failure in production, log in dev if needed
            if (process.env.NODE_ENV === "development" || process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === "1") {
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
