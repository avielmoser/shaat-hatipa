import { startOfDay, endOfDay, subDays } from "date-fns";

export type TimeRangeKey = "7d" | "30d" | "all" | "custom";

export interface ParsedRange {
    rangeKey: TimeRangeKey;
    from?: Date;
    to?: Date;
}

/**
 * Parses query parameters to determine the selected time range.
 * Fallback to '7d' if invalid or missing.
 */
export function parseRange(searchParams: { [key: string]: string | string[] | undefined }): ParsedRange {
    const rawRange = (Array.isArray(searchParams.range) ? searchParams.range[0] : searchParams.range) || "7d";

    // Normalize to known key
    let rangeKey: TimeRangeKey = "7d";
    if (["7d", "30d", "all", "custom"].includes(rawRange)) {
        rangeKey = rawRange as TimeRangeKey;
    }

    // Handle Custom Dates
    if (rangeKey === "custom") {
        const fromStr = Array.isArray(searchParams.from) ? searchParams.from[0] : searchParams.from;
        const toStr = Array.isArray(searchParams.to) ? searchParams.to[0] : searchParams.to;

        const fromDate = fromStr ? new Date(fromStr) : undefined;
        const toDate = toStr ? new Date(toStr) : undefined;

        // Validate
        const isValid =
            fromDate && !isNaN(fromDate.getTime()) &&
            toDate && !isNaN(toDate.getTime());

        if (isValid) {
            // For 'to' date, we want the end of that day
            // e.g. User selects 2025-12-01. We want 2025-12-01T23:59:59.999
            return {
                rangeKey: "custom",
                from: startOfDay(fromDate!),
                to: endOfDay(toDate!)
            };
        } else {
            console.warn(`[AnalyticsRange] Invalid custom dates provided: from=${fromStr}, to=${toStr}. Falling back to 7d.`);
            return { rangeKey: "7d" };
        }
    }

    return { rangeKey };
}

/**
 * Generates a human-readable label for the UI
 */
export function formatRangeLabel(parsed: ParsedRange): string {
    switch (parsed.rangeKey) {
        case "7d": return "Last 7 Days";
        case "30d": return "Last 30 Days";
        case "all": return "All Time";
        case "custom":
            if (parsed.from && parsed.to) {
                return `${parsed.from.toLocaleDateString()} -> ${parsed.to.toLocaleDateString()}`;
            }
            return "Custom Range";
    }
}

/**
 * Returns the Prisma 'where' clause for the 'createdAt' field.
 * Returns empty object if 'all'.
 */
export function getRangeWhereClause(parsed: ParsedRange): { createdAt?: { gte?: Date; lte?: Date } } {
    const now = new Date();

    switch (parsed.rangeKey) {
        case "7d":
            return {
                createdAt: {
                    gte: subDays(now, 7)
                }
            };
        case "30d":
            return {
                createdAt: {
                    gte: subDays(now, 30)
                }
            };
        case "custom":
            if (parsed.from && parsed.to) {
                return {
                    createdAt: {
                        gte: parsed.from,
                        lte: parsed.to
                    }
                };
            }
            // Fallback (safe)
            return {
                createdAt: {
                    gte: subDays(now, 7)
                }
            };
        case "all":
        default:
            return {};
    }
}
