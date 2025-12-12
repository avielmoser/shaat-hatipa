"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";

type TimeRangeKey = "7d" | "30d" | "all" | "custom";

export function TimeRangeSelector() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Parse current state from URL
    const currentRange = (searchParams.get("range") as TimeRangeKey) || "7d";
    const currentFrom = searchParams.get("from") || "";
    const currentTo = searchParams.get("to") || "";

    // Local state for custom date inputs
    const [isCustomOpen, setIsCustomOpen] = useState(currentRange === "custom");
    const [customFrom, setCustomFrom] = useState(currentFrom);
    const [customTo, setCustomTo] = useState(currentTo);

    // Sync custom open state if URL changes externally
    useEffect(() => {
        if (currentRange === "custom") {
            setIsCustomOpen(true);
        } else {
            setIsCustomOpen(false);
        }
    }, [currentRange]);

    const handleRangeChange = (range: TimeRangeKey) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("range", range);

        // Clear custom dates if not custom (to keep URL clean)
        if (range !== "custom") {
            params.delete("from");
            params.delete("to");
            setIsCustomOpen(false);
        } else {
            setIsCustomOpen(true);
            // If we don't have dates yet, don't set them (wait for apply)
            // Or if we want to default to today, we could do it here.
            // Let's just switch mode and let user input dates.
        }

        router.push(`?${params.toString()}`);
    };

    const handleApplyCustom = useCallback(() => {
        if (!customFrom || !customTo) return;

        const params = new URLSearchParams(searchParams.toString());
        params.set("range", "custom");
        params.set("from", customFrom);
        params.set("to", customTo);

        router.push(`?${params.toString()}`);
    }, [customFrom, customTo, router, searchParams]);

    return (
        <div className="flex flex-col items-end gap-2">

            {/* Range Buttons */}
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1">
                {(["7d", "30d", "all", "custom"] as const).map((key) => {
                    const isActive = currentRange === key;
                    const labels: Record<string, string> = {
                        "7d": "7D",
                        "30d": "30D",
                        "all": "ALL",
                        "custom": "Custom"
                    };

                    return (
                        <button
                            key={key}
                            onClick={() => handleRangeChange(key)}
                            className={`
                                text-xs font-semibold px-3 py-1.5 rounded-md transition-all
                                ${isActive
                                    ? "bg-indigo-600 text-white shadow-sm"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                                }
                            `}
                        >
                            {labels[key]}
                        </button>
                    );
                })}
            </div>

            {/* Custom Date Inputs (Collapsible) */}
            {isCustomOpen && (
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">From</label>
                        <input
                            type="date"
                            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                            value={customFrom}
                            onChange={(e) => setCustomFrom(e.target.value)}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">To</label>
                        <input
                            type="date"
                            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-indigo-500 outline-none"
                            value={customTo}
                            onChange={(e) => setCustomTo(e.target.value)}
                        />
                    </div>
                    <div className="h-full flex items-end">
                        <button
                            onClick={handleApplyCustom}
                            disabled={!customFrom || !customTo}
                            className="mb-[1px] bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded transition-colors"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
