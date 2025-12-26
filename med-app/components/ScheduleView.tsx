// components/ScheduleView.tsx
"use client";

// מציג את לוח הזמנים לקבוצות של ימים ושעות, עם אפשרות סינון והוספת בועה
// "המתן 5 דקות בין טיפות". משתמש במפת הצבעים החדשה כדי לצבוע את התרופות.

import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useTranslations, useLocale } from 'next-intl';
import { ActionInstruction, DoseSlot, ProtocolScheduleInput, ProtocolAction } from "../types/prescription";
import { resolveLocalizedString } from "../lib/utils/i18n";
import { getMedicationColor } from "../lib/theme/medicationColors";
import { getSlotInstructions, buildInstructionIndex, toSuperscript, ProcessedInstruction } from "../lib/utils/instructions";
import { downloadScheduleIcs } from "../lib/utils/ics";
import { openSchedulePdf } from "../lib/utils/pdf";
import { trackEvent } from "../lib/client/analytics";

import type { ClinicConfig } from "../config/clinics";
import { ScrollIndicator } from "./ui/ScrollIndicator";

interface ScheduleViewProps {
  schedule: DoseSlot[];
  prescription?: ProtocolScheduleInput;
  clinicConfig?: ClinicConfig;
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

interface DaySlotsListProps {
  children: React.ReactNode;
  locale: string;
}

function DaySlotsList({ children, locale }: DaySlotsListProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="space-y-2 text-base overflow-y-auto max-h-96 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
        style={{ direction: locale === 'he' ? 'rtl' : 'ltr' }}
      >
        <div style={{ direction: locale === 'he' ? 'rtl' : 'ltr' }}>
          {children}
        </div>
      </div>
      <ScrollIndicator
        containerRef={containerRef}
        isRtl={locale === 'he'}
      />
    </div>
  );
}

export default function ScheduleView({ schedule, prescription, clinicConfig }: ScheduleViewProps) {
  const t = useTranslations('Schedule');
  const st = t; // Scoped translator for schedule notes
  const locale = useLocale();
  const [mode, setMode] = useState<FilterMode>("today");

  // Resolve action label safely
  const currentLocale = (locale === 'he' || locale === 'en') ? locale : 'en';
  const actionLabel = clinicConfig?.copy?.[currentLocale]?.actionLabel || (currentLocale === 'he' ? 'טיפות' : 'Drops');

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

  let rangeLabel = t('ranges.today');
  if (mode === "7days") rangeLabel = t('ranges.next7Days');
  if (mode === "allMonth") rangeLabel = t('ranges.allMonth');

  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportIcs = () => {
    if (!filtered || filtered.length === 0) return;
    trackEvent("export_clicked", {
      eventType: "conversion",
      exportType: "ics",
      slots: filtered.length,
      mode,
      surgeryDate: surgeryDateStr
    });
    try {
      downloadScheduleIcs(filtered, "laser-drops-schedule", clinicConfig?.name, actionLabel);
    } catch (e) {
      console.error("Failed to export ICS", e);
      alert("Failed to generate calendar file. Please try again.");
      trackEvent("export_failed", { eventType: "action", exportType: "ics", error: String(e) });
    }
  };

  const handleExportPdf = async () => {
    const hasItems = (schedule && schedule.length > 0) || (prescription && prescription.medications.length > 0);
    if (!hasItems || pdfLoading) return;
    setPdfLoading(true);
    trackEvent("export_clicked", {
      eventType: "conversion",
      exportType: "pdf",
      slots: filtered.length,
      mode,
      surgeryDate: surgeryDateStr
    });
    try {
      const fileName = `Drops-Schedule-${surgeryDateStr || todayStr}.pdf`;
      // If schedule is empty, we might still want to print instructions if prescription exists
      await openSchedulePdf(filtered, fileName, clinicConfig, currentLocale, actionLabel, prescription?.medications);
    } catch (e) {
      console.error("Failed to export PDF", e);
      alert("Failed to generate PDF. Please try again.");
      trackEvent("export_failed", { eventType: "action", exportType: "pdf", error: String(e) });
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            {t('title', { range: rangeLabel })}
          </h3>
          {surgeryDateStr &&
            daysSinceSurgery != null &&
            daysSinceSurgery >= 0 && (
              <p className="mt-1 text-sm text-slate-700">
                {t.rich('todayIs', {
                  day: daysSinceSurgery + 1,
                  date: todayStr,
                  bold: (chunks) => <span className="font-bold">{chunks}</span>
                })}
              </p>
            )}
        </div>

        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 p-1 text-sm">
            <button
              type="button"
              onClick={() => {
                setMode("today");

              }}
              className={`rounded-full px-3 py-1 transition ${mode === "today"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-white"
                }`}
            >
              {t('filters.today')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("7days");

              }}
              className={`rounded-full px-3 py-1 transition ${mode === "7days"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-white"
                }`}
            >
              {t('filters.next7Days')}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("allMonth");

              }}
              className={`rounded-full px-3 py-1 transition ${mode === "allMonth"
                ? "bg-sky-600 text-white shadow-sm"
                : "text-slate-600 hover:bg-white"
                }`}
            >
              {t('filters.allMonth')}
            </button>
          </div>

          <div className="flex flex-wrap justify-end gap-3 text-sm">
            <button
              type="button"
              onClick={handleExportIcs}
              disabled={!filtered || filtered.length === 0}
              title={(!filtered || filtered.length === 0) ? "No timed events to export" : ""}
              className={`inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium ${(!filtered || filtered.length === 0)
                ? "cursor-not-allowed text-slate-400 bg-slate-50 border-slate-200"
                : "text-sky-700 hover:bg-sky-100"}`}
            >
              {t('export.calendar')}
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={pdfLoading}
              className={`inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 font-medium ${pdfLoading
                ? "cursor-not-allowed text-slate-400"
                : "text-slate-700 hover:bg-white"
                }`}
            >
              {pdfLoading ? t('export.exporting') : t('export.pdf')}
            </button>
          </div>
        </div>
      </div>

      {dayGroups.length === 0 ? (
        <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-base text-slate-700">
          {prescription && prescription.medications.length > 0 ? (
            <div className="space-y-4">
              <p className="font-semibold">{t('empty')}</p>
              <div className="space-y-2">
                {prescription.medications.map((med: ProtocolAction) => (
                  <div key={med.id} className="p-3 bg-white rounded-lg border border-slate-200">
                    <div className="font-bold text-slate-900">{resolveLocalizedString(med.name, currentLocale)}</div>
                    {med.notes && <div className="text-sm text-slate-600">{resolveLocalizedString(med.notes, currentLocale)}</div>}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            t('empty')
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3 pe-0 md:pe-1">
          {dayGroups.map((day) => {
            const timeGroups = groupByTime(day.slots);
            const displayDayIndex = day.dayIndex + 1; // Day 1 = Surgery Day

            return (
              <div
                key={day.date}
                className="rounded-2xl border border-slate-100 bg-slate-50/80 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-lg font-bold text-slate-900">
                    {t('dayHeader', { day: displayDayIndex, date: day.date })}
                  </div>
                  <div className="text-sm font-medium text-slate-700">
                    {t('dosesCount', { count: day.slots.length })}
                  </div>
                </div>

                <DaySlotsList locale={locale}>
                  {timeGroups.map((tg) => {
                    const { numbersByActionId, numberedInstructions } = buildInstructionIndex(tg.slots, clinicConfig?.defaultSlotInstructions, clinicConfig?.slotRules);

                    return (
                      <div
                        key={day.date + "-" + tg.time}
                        className="flex flex-col gap-1.5 rounded-xl bg-white px-3 py-2 shadow-sm border border-slate-100"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-sm font-bold text-slate-900 min-w-[3.5rem] text-center">
                              {tg.time}
                            </span>

                            <div className="flex flex-wrap items-center gap-2">
                              {tg.slots.map((slot) => {
                                const color = slot.medicationColor || getMedicationColor(
                                  resolveLocalizedString(slot.medicationName, currentLocale),
                                  slot.medicationId
                                );

                                const applicableInstNumbers = numbersByActionId[slot.medicationId] || [];

                                return (
                                  <span
                                    key={slot.id}
                                    className="relative inline-flex items-center rounded-full border-2 px-3 py-1 text-sm font-bold gap-0.5"
                                    style={{
                                      backgroundColor: `${color ?? "#e5e7eb"}22`,
                                      color: color ?? "#0f172a",
                                      borderColor: color ?? "rgba(15,23,42,0.16)",
                                    }}
                                  >
                                    {resolveLocalizedString(slot.medicationName, currentLocale)}
                                    {applicableInstNumbers.length > 0 && (
                                      <sup className="text-[10px] ms-0.5 mb-1.5 font-bold tracking-tighter">
                                        {applicableInstNumbers.map(toSuperscript).join("")}
                                      </sup>
                                    )}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {numberedInstructions.length > 0 && (
                          <div className="mt-1 space-y-1.5 ps-1 border-t border-slate-50 pt-2">
                            {numberedInstructions.map((inst: ProcessedInstruction) => {
                              const icon = {
                                "wait_between_actions": "⏱",
                                "avoid_food": "🥪",
                                "separate_medications": "⚠️",
                                "note": "📝",
                              }[inst.type as string] || "•";

                              return (
                                <div
                                  key={inst.id}
                                  className="text-sm text-slate-600 flex items-start gap-1.5"
                                >
                                  <span className="font-bold text-slate-400 min-w-[1.25rem]">
                                    {inst.number}
                                  </span>
                                  <span className="flex-shrink-0">{icon}</span>
                                  <span>
                                    {inst.type === "wait_between_actions" &&
                                      inst.minutes > 0 &&
                                      (inst.messageKey ?
                                        st(inst.messageKey as any, inst.params) :
                                        st("slotNote_waitBetween", {
                                          minutes: inst.minutes,
                                        }))
                                    }
                                    {inst.type === "avoid_food" &&
                                      st("slotNote_avoidFood")}
                                    {inst.type === "separate_medications" &&
                                      st("slotNote_separateMeds")}
                                    {inst.type === "note" &&
                                      st((inst as any).messageKey as any, (inst as any).params)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </DaySlotsList>
              </div>
            );
          })}
        </div>
      )
      }
    </div>
  );
}

