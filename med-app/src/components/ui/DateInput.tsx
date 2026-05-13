"use client";

import React, { useState, useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

interface DateInputProps {
    id: string;
    label?: string;
    value: string; // YYYY-MM-DD
    onChange: (value: string) => void;
    locale?: string;
    dir?: "rtl" | "ltr";
    className?: string;
    required?: boolean;
    disabled?: boolean;
}

/** Returns an array of Date objects (or null for empty cells) for a 6-row calendar grid. */
function getCalendarDays(year: number, month: number): (Date | null)[] {
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    return cells;
}

function formatDisplayDate(date: Date, locale: string): string {
    return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
    }).format(date);
}

function formatMonthYear(year: number, month: number, locale: string): string {
    return new Intl.DateTimeFormat(locale === "he" ? "he-IL" : "en-US", {
        year: "numeric",
        month: "long",
    }).format(new Date(year, month, 1));
}

// Hebrew short day names (Sunday first, as JS Date uses 0=Sunday)
const DAY_NAMES_HE = ["א׳", "ב׳", "ג׳", "ד׳", "ה׳", "ו׳", "ש׳"];
const DAY_NAMES_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function DateInput({
    id,
    label,
    value,
    onChange,
    locale = "en",
    dir,
    className = "",
    required,
    disabled,
}: DateInputProps) {
    const isRtl = dir === "rtl" || locale === "he";
    const effectiveDir = isRtl ? "rtl" : "ltr";

    const parsedDate = useMemo<Date | null>(() => {
        if (!value) return null;
        const [y, m, d] = value.split("-").map(Number);
        if (!y || !m || !d) return null;
        return new Date(y, m - 1, d);
    }, [value]);

    const [open, setOpen] = useState(false);
    const [viewYear, setViewYear] = useState<number>(() => parsedDate?.getFullYear() ?? new Date().getFullYear());
    const [viewMonth, setViewMonth] = useState<number>(() => parsedDate?.getMonth() ?? new Date().getMonth());

    // Sync view when popover opens
    const handleOpenChange = (isOpen: boolean) => {
        if (isOpen && parsedDate) {
            setViewYear(parsedDate.getFullYear());
            setViewMonth(parsedDate.getMonth());
        }
        setOpen(isOpen);
    };

    const calendarDays = useMemo(() => getCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);
    const dayNames = locale === "he" ? DAY_NAMES_HE : DAY_NAMES_EN;
    const monthYearLabel = formatMonthYear(viewYear, viewMonth, locale);
    const displayValue = parsedDate ? formatDisplayDate(parsedDate, locale) : "";

    const handleDayClick = (date: Date) => {
        const y = date.getFullYear();
        const m = (date.getMonth() + 1).toString().padStart(2, "0");
        const d = date.getDate().toString().padStart(2, "0");
        onChange(`${y}-${m}-${d}`);
        setOpen(false);
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear((y) => y - 1); setViewMonth(11); }
        else setViewMonth((m) => m - 1);
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewYear((y) => y + 1); setViewMonth(0); }
        else setViewMonth((m) => m + 1);
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (
        <div className={`min-w-0 space-y-1 sm:space-y-1.5 ${className}`} dir={effectiveDir}>
            {label && (
                <label
                    htmlFor={id}
                    className="block text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-sm"
                >
                    {label}
                    {required && <span className="text-red-500 ms-1">*</span>}
                </label>
            )}

            <Popover.Root open={open} onOpenChange={handleOpenChange}>
                <Popover.Trigger asChild>
                    <button
                        id={id}
                        type="button"
                        disabled={disabled}
                        className={`
                            flex min-h-11 w-full items-center gap-2 rounded-lg border bg-slate-50 px-3 py-2
                            text-base shadow-sm transition-colors
                            hover:border-slate-300 hover:bg-white
                            focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/20
                            disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400
                            sm:min-h-12 sm:rounded-xl sm:px-4 sm:py-3 sm:text-lg
                            border-slate-200 text-slate-900
                        `}
                    >
                        {/* Icon on inline-start — never overlaps text */}
                        <Calendar className="h-5 w-5 shrink-0 text-slate-400 sm:h-6 sm:w-6" />
                        <span className="flex-1 truncate text-start">{displayValue}</span>
                    </button>
                </Popover.Trigger>

                <Popover.Portal>
                    <Popover.Content
                        dir={effectiveDir}
                        sideOffset={8}
                        collisionPadding={16}
                        className="
                            z-[100] w-[calc(100vw-2rem)] max-w-[320px] rounded-2xl border border-slate-100
                            bg-white p-4 shadow-xl sm:w-[320px]
                            data-[state=open]:animate-in data-[state=closed]:animate-out
                            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
                            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
                            data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2
                        "
                    >
                        {/* ── Month Navigation ── */}
                        <div className="mb-3 flex items-center gap-1">
                            <button
                                type="button"
                                onClick={prevMonth}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                aria-label={locale === "he" ? "חודש קודם" : "Previous month"}
                            >
                                {/* Logical: in RTL, "previous" visually = ChevronRight */}
                                {isRtl
                                    ? <ChevronRight className="h-4 w-4" />
                                    : <ChevronLeft className="h-4 w-4" />
                                }
                            </button>
                            <span className="flex-1 text-center text-sm font-semibold text-slate-900">
                                {monthYearLabel}
                            </span>
                            <button
                                type="button"
                                onClick={nextMonth}
                                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
                                aria-label={locale === "he" ? "חודש הבא" : "Next month"}
                            >
                                {isRtl
                                    ? <ChevronLeft className="h-4 w-4" />
                                    : <ChevronRight className="h-4 w-4" />
                                }
                            </button>
                        </div>

                        {/* ── Day-Name Headers ── */}
                        <div className="mb-1 grid grid-cols-7 gap-0.5">
                            {dayNames.map((name) => (
                                <div
                                    key={name}
                                    className="flex h-8 items-center justify-center text-xs font-semibold text-slate-400"
                                >
                                    {name}
                                </div>
                            ))}
                        </div>

                        {/* ── Calendar Grid ── */}
                        <div className="grid grid-cols-7 gap-0.5">
                            {calendarDays.map((date, i) => {
                                if (!date) return <div key={`empty-${i}`} aria-hidden="true" />;

                                const isSelected =
                                    parsedDate !== null &&
                                    date.getFullYear() === parsedDate.getFullYear() &&
                                    date.getMonth() === parsedDate.getMonth() &&
                                    date.getDate() === parsedDate.getDate();

                                const isToday = date.getTime() === today.getTime();

                                return (
                                    <button
                                        key={date.toISOString()}
                                        type="button"
                                        onClick={() => handleDayClick(date)}
                                        aria-label={date.toLocaleDateString(locale === "he" ? "he-IL" : "en-US")}
                                        aria-pressed={isSelected}
                                        className={`
                                            flex h-8 w-full items-center justify-center rounded-lg text-sm
                                            transition-colors font-medium
                                            ${isSelected
                                                ? "bg-sky-600 text-white font-bold"
                                                : isToday
                                                    ? "border border-sky-300 text-sky-700 font-semibold hover:bg-sky-50"
                                                    : "text-slate-700 hover:bg-slate-100"
                                            }
                                        `}
                                    >
                                        {date.getDate()}
                                    </button>
                                );
                            })}
                        </div>
                        {/* No footer — no Reset button */}
                    </Popover.Content>
                </Popover.Portal>
            </Popover.Root>
        </div>
    );
}
