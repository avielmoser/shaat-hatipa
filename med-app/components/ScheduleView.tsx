// components/ScheduleView.tsx
"use client";

// מציג את לוח הזמנים לקבוצות של ימים ושעות, עם אפשרות סינון והוספת בועה
// "המתן 5 דקות בין טיפות". משתמש במפת הצבעים החדשה כדי לצבוע את התרופות.

import { useMemo, useState } from "react";
import type { DoseSlot } from "../types/prescription";
import { getMedicationColor } from "../lib/medicationColors";
import { downloadScheduleIcs } from "../lib/ics";
import { openSchedulePdf } from "../lib/pdf";

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
      map.set(slot.date, {
        date: slot.date,
        dayIndex: slot.dayIndex,
        slots: [],
      });
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
    if (!map.has(slot.time)) {
      map.set(slot.time, []);
    }
    map.get(slot.time)!.push(slot);
  });

  const groups: TimeGroup[] = Array.from(map.entries()).map(
    ([time, s]) => ({ time, slots: s })
  );

  groups.sort((a, b) => a.time.localeCompare(b.time));
  return groups;
}

function filterByMode(
  schedule: DoseSlot[],
  mode: FilterMode
): { filtered: DoseSlot[]; todayStr: string } {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const year = today.getFullYear();
  const month = (today.getMonth() + 1).toString().padStart(2, "0");
  const day = today.getDate().toString().padStart(2, "0");
  const todayStr = `${year}-${month}-${day}`;

  if (mode === "allMonth") {
    return { filtered: schedule, todayStr };
  }

  let maxDaysAhead: number | null = null;
  if (mode === "today") maxDaysAhead = 0;
  if (mode === "7days") maxDaysAhead = 6;

  const filtered = schedule.filter((slot) => {
    const diffFromToday = diffInDays(todayStr, slot.date);
    if (diffFromToday < 0) return false;
    if (maxDaysAhead === null) return true;
    return diffFromToday <= maxDaysAhead;
  });

  return { filtered, todayStr };
}

export default function ScheduleView({ schedule }: Props) {
  const [mode, setMode] = useState<FilterMode>("today");

  const { filtered, todayStr } = useMemo(
    () => filterByMode(schedule ?? [], mode),
    [schedule, mode]
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

  let rangeLabel = "היום בלבד";
  if (mode === "7days") rangeLabel = "7 הימים הקרובים";
  if (mode === "allMonth") rangeLabel = "כל החודש";

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportIcs = () => {
    if (!filtered || filtered.length === 0) return;
    downloadScheduleIcs(filtered, "laser-drops-schedule");
  };

  const handleExportPdf = async () => {
    if (!schedule || schedule.length === 0 || pdfLoading) return;
    setPdfLoading(true);
    try {
      const fileName = `לו״ז טיפות - ${surgeryDateStr || todayStr}.pdf`;
      openSchedulePdf(schedule, fileName);
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            לוח זמנים לטיפות – {rangeLabel}
          </h3>
          {surgeryDateStr &&
            daysSinceSurgery != null &&
            daysSinceSurgery >= 0 &&
            mode !== "allMonth" && (
              <p className="mt-0.5 text-[11px] text-slate-500">
                היום הוא{" "}
                <span className="font-semibold">
                  יום {daysSinceSurgery + 1} אחרי הניתוח
                </span>{" "}
                ({todayStr}).
              </p>
            )}
        </div>

        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
            <button
              type="button"
              onClick={() => setMode("today")}
              className={`rounded-full px-3 py-1 transition ${
                mode === "today"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              היום
            </button>
            <button
              type="button"
              onClick={() => setMode("7days")}
              className={`rounded-full px-3 py-1 transition ${
                mode === "7days"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              7 ימים קרובים
            </button>
            <button
              type="button"
              onClick={() => setMode("allMonth")}
              className={`rounded-full px-3 py-1 transition ${
                mode === "allMonth"
                  ? "bg-sky-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-white"
              }`}
            >
              כל החודש
            </button>
          </div>

          <div className="flex flex-wrap justify-end gap-2 text-[11px]">
            <button
              type="button"
              onClick={handleExportIcs}
              className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-700 hover:bg-sky-100"
            >
              הוסף ליומן
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={pdfLoading}
              className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium ${
                pdfLoading
                  ? "cursor-not-allowed text-slate-400"
                  : "text-slate-700 hover:bg-white"
              }`}
            >
              {pdfLoading ? "מייצא..." : "ייצוא ל-PDF"}
            </button>
          </div>
        </div>
      </div>

      {/* בועת המתנה בין טיפות */}
      <div className="mt-3 mb-4 rounded-lg bg-yellow-50 px-3 py-2 text-[11px] text-yellow-800 border border-yellow-100">
        המתן 5 דקות בין טיפות
      </div>

      {dayGroups.length === 0 ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-500">
          אין טיפות בטווח התאריכים שנבחר.
        </div>
      ) : (
        <div className="mt-3 space-y-3 pr-0 md:pr-1">
          {dayGroups.map((day) => {
            const timeGroups = groupByTime(day.slots);
            const displayDayIndex = day.dayIndex + 1; // יום 1 = יום הניתוח

            return (
              <div
                key={day.date}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3"
              >
                <div className="mb-2 flex items-center justify-between">
                  <div className="text-xs font-semibold text-slate-800">
                    יום {displayDayIndex} • {day.date}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {day.slots.length} מנות ביום זה
                  </div>
                </div>

                <div className="space-y-1 text-xs overflow-y-auto max-h-72 md:max-h-80">
                  {timeGroups.map((tg) => {
                    const notesSet = new Set(
                      tg.slots
                        .map((s) => s.notes?.trim())
                        .filter((n): n is string => !!n)
                    );
                    const combinedNotes =
                      notesSet.size > 0
                        ? Array.from(notesSet).join(" • ")
                        : null;

                    return (
                      <div
                        key={day.date + "-" + tg.time}
                        className="flex flex-col gap-0.5 rounded-lg bg-white px-2.5 py-1 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-800">
                              {tg.time}
                            </span>

                            <div className="flex flex-wrap items-center gap-1.5">
                              {tg.slots.map((slot) => {
                                const color = getMedicationColor(
                                  slot.medicationName,
                                  slot.id
                                );
                                return (
                                  <span
                                    key={slot.id}
                                    className="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium"
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
                        </div>

                        {combinedNotes && (
                          <div className="text-[11px] text-slate-500">
                            {combinedNotes}
                          </div>
                        )}
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
