// components/ScheduleView.tsx
"use client";

// This component groups dose slots by day, applies filters
// (today, 7 days, whole month), and displays each day in its own
// scrollable container.  Day 0 includes the surgery date in
// parentheses.  All labels are localised to Hebrew.

import { useMemo, useState } from "react";
import type { DoseSlot } from "../types/prescription";
import { getMedicationColor } from "../lib/med-colors";
import { downloadScheduleIcs } from "../lib/ics";

interface Props {
  schedule: DoseSlot[];
}

type DayGroup = {
  date: string;
  dayIndex: number;
  slots: DoseSlot[];
};

type TimeGroup = {
  time: string;
  slots: DoseSlot[];
};

// Filter modes available in the segmented control.  We unify the
// previous 30‑day and full‑month options into a single "allMonth"
// mode.  This ensures there is only one "כל החודש" filter and
// prevents duplicate active states.
type FilterMode = "today" | "7days" | "allMonth";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDateOnly(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map((v) => parseInt(v, 10));
  return new Date(year, month - 1, day);
}

function diffInDays(startDateStr: string, targetDateStr: string): number {
  const start = parseDateOnly(startDateStr);
  const target = parseDateOnly(targetDateStr);
  const diffMs = target.getTime() - start.getTime();
  return Math.floor(diffMs / MS_PER_DAY);
}

function groupByDate(schedule: DoseSlot[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  schedule.forEach((slot) => {
    if (!map.has(slot.date)) {
      map.set(slot.date, { date: slot.date, dayIndex: slot.dayIndex, slots: [] });
    }
    map.get(slot.date)!.slots.push(slot);
  });
  const groups = Array.from(map.values());
  groups.sort((a, b) => a.date.localeCompare(b.date));
  return groups;
}

function groupByTime(slots: DoseSlot[]): TimeGroup[] {
  const map = new Map<string, DoseSlot[]>();
  slots.forEach((slot) => {
    if (!map.has(slot.time)) map.set(slot.time, []);
    map.get(slot.time)!.push(slot);
  });
  const groups: TimeGroup[] = Array.from(map.entries()).map(([time, s]) => ({
    time,
    slots: s,
  }));
  groups.sort((a, b) => a.time.localeCompare(b.time));
  return groups;
}

function filterByMode(
  schedule: DoseSlot[],
  mode: FilterMode,
): { filtered: DoseSlot[]; todayStr: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;
  // Determine the range of days to include.  "allMonth" and the
  // former 30‑day filter both include days 0 through 30 (inclusive),
  // while "today" and "7days" have shorter windows.  We only
  // support these three modes now.
  let maxDaysAhead: number | null = null;
  if (mode === "today") maxDaysAhead = 0;
  if (mode === "7days") maxDaysAhead = 6;
  if (mode === "allMonth") maxDaysAhead = 30;
  const filtered = schedule.filter((slot) => {
    const diffFromToday = diffInDays(todayStr, slot.date);
    if (diffFromToday < 0) return false;
    if (maxDaysAhead === null) return true;
    return diffFromToday <= maxDaysAhead;
  });
  return { filtered, todayStr };
}

// Format a YYYY-MM-DD date string into DD/MM/YY for display.
function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  const twoDigitYear = year.slice(-2);
  return `${day}/${month}/${twoDigitYear}`;
}

export default function ScheduleView({ schedule }: Props) {
  const [mode, setMode] = useState<FilterMode>("today");
  const { filtered, todayStr } = useMemo(
    () => filterByMode(schedule ?? [], mode),
    [schedule, mode],
  );
  const surgeryDateStr = useMemo(() => {
    if (!schedule || schedule.length === 0) return null;
    const minDayIndex = Math.min(...schedule.map((s) => s.dayIndex));
    const candidate = schedule.find((s) => s.dayIndex === minDayIndex);
    return candidate?.date ?? null;
  }, [schedule]);
  const daysSinceSurgery =
    surgeryDateStr != null ? diffInDays(surgeryDateStr, todayStr) : null;
  const dayGroups = groupByDate(filtered);
  let rangeLabel = "היום";
  if (mode === "7days") rangeLabel = "7 ימים קרובים";
  if (mode === "allMonth") rangeLabel = "כל החודש";

  const handleExportIcs = () => {
    if (!filtered || filtered.length === 0) return;
    downloadScheduleIcs(filtered, "laser-drops-schedule");
  };
  const handleExportPdf = () => {
    // Future enhancement: implement PDF export if needed.
  };

  if (!schedule || schedule.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-white/80 p-6 text-sm text-slate-500 shadow-sm mt-8">
        לוח הזמנים המלא לטיפות יופיע כאן לאחר יצירה.
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] space-y-6">
      {/* Header with filter controls */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-slate-900">
            לוח זמנים לטיפות – {rangeLabel}
          </h3>
          {surgeryDateStr &&
            daysSinceSurgery != null &&
            daysSinceSurgery >= 0 &&
            mode !== "allMonth" && (
              <p className="text-sm text-slate-600">
                היום הוא{" "}
                <span className="font-semibold">
                  יום {daysSinceSurgery + 1} אחרי הניתוח
                </span>{" "}
                ({todayStr}).
              </p>
            )}
        </div>
        <div className="flex flex-col sm:items-end gap-3">
          {/* Segmented control for date range filters */}
          <div className="flex overflow-hidden rounded-full border border-slate-300 bg-slate-100 shadow-sm">
            {(["today", "7days", "allMonth"] as FilterMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMode(m)}
                className={`px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                  mode === m
                    ? "bg-sky-600 text-white shadow-inner"
                    : "bg-transparent text-slate-700 hover:bg-white/50"
                }`}
                style={{ minWidth: "72px" }}
              >
                {m === "today" && "היום"}
                {m === "7days" && "7 ימים"}
                {m === "allMonth" && "כל החודש"}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap justify-end gap-2 text-sm">
            <button
              type="button"
              onClick={handleExportIcs}
              className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 font-medium text-sky-700 hover:bg-sky-100 focus:ring-2 focus:ring-sky-300"
            >
              הוסף ליומן
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 font-medium text-slate-700 hover:bg-white focus:ring-2 focus:ring-slate-300"
            >
              ייצוא ל‑PDF
            </button>
          </div>
        </div>
      </div>
      {/* Content: each day gets its own scrollable section */}
      {dayGroups.length === 0 ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
          אין טיפות בטווח התאריכים שנבחר.
        </div>
      ) : (
        <div className="space-y-5">
          {dayGroups.map((day) => {
            const timeGroups = groupByTime(day.slots);
            return (
              <div
                key={day.date}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 shadow-sm space-y-0"
              >
                {/* Day header */}
                <div className="px-4 py-2 border-b border-slate-200 flex items-center justify-between">
                  <div className="text-base font-semibold text-slate-800">
                    יום {day.dayIndex}
                    {day.dayIndex === 0 ? (
                      <span> ({formatDateShort(day.date)})</span>
                    ) : (
                      <span> • {day.date}</span>
                    )}
                  </div>
                  <div className="text-sm text-slate-600">
                    {day.slots.length} מנות ביום זה
                  </div>
                </div>
                {/* Time groups: individual scroll area per day. Adjusted heights to
                   ensure at least four rows of times are visible before scrolling. */}
                <div className="divide-y divide-slate-100 overflow-y-auto max-h-72 sm:max-h-80 lg:max-h-96">
                  {timeGroups.map((tg) => {
                    const notesSet = new Set(
                      tg.slots
                        .map((s) => s.notes?.trim())
                        .filter((n): n is string => !!n),
                    );
                    const combinedNotes =
                      notesSet.size > 0
                        ? Array.from(notesSet).join(" • ")
                        : null;
                    return (
                      <div key={day.date + "-" + tg.time} className="px-4 py-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex items-center gap-3">
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800">
                              {tg.time}
                            </span>
                            <div className="flex flex-wrap items-center gap-2">
                              {tg.slots.map((slot) => {
                                const color = getMedicationColor(
                                  slot.medicationName,
                                  slot.id,
                                );
                                return (
                                  <span
                                    key={slot.id}
                                    className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium"
                                    style={{
                                      backgroundColor: `${color ?? "#e5e7eb"}22`,
                                      color: color ?? "#0f172a",
                                      borderColor:
                                        color ?? "rgba(15,23,42,0.16)",
                                    }}
                                  >
                                    {slot.medicationName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          {combinedNotes && (
                            <div className="text-sm text-slate-600 mt-1 sm:mt-0">
                              {combinedNotes}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
