// components/PrescriptionView.tsx
"use client";

import type React from "react";
import type { LaserPrescriptionInput } from "../types/prescription";
import { getMedicationColor } from "../lib/medicationColors";

interface Props {
  prescription: LaserPrescriptionInput | null;
}

/**
 * מציג סיכום של הפרוטוקול שנבחר, כולל תאריך ניתוח, שעות ערות ורשימת תרופות.
 * קומפקטי ונוח יותר במובייל, תוך שמירה על קריאות בדסקטופ.
 */
export default function PrescriptionView({ prescription }: Props) {
  if (!prescription) return null;
  const { surgeryType, surgeryDate, wakeTime, sleepTime, medications } =
    prescription;

  const surgeryTypeText =
    surgeryType === "INTERLASIK"
      ? "פרוטוקול טיפות לאחר ניתוח INTERLASIK."
      : surgeryType === "PRK"
      ? "פרוטוקול טיפות לאחר ניתוח PRK."
      : "פרוטוקול מותאם אישית.";

  return (
    <div className="space-y-3 sm:space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-4 sm:p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      {/* כותרת + באדג' סוג ניתוח */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 sm:space-y-1">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            סיכום הוראות אחרי ניתוח
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">{surgeryTypeText}</p>
        </div>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-medium text-sky-700 sm:px-3 sm:py-1 sm:text-sm">
          {surgeryType}
        </span>
      </div>

      {/* פרטי בסיס: תאריך, שעות ערות, כמות תרופות */}
      <div className="grid gap-2.5 rounded-2xl bg-slate-50/80 p-3 text-[13px] text-slate-700 sm:grid-cols-2 sm:gap-3 sm:p-4 sm:text-sm">
        <div>
          <span className="font-semibold">תאריך ניתוח: </span>
          {surgeryDate}
        </div>
        <div>
          <span className="font-semibold">שעות ערות: </span>
          {wakeTime}–{sleepTime}
        </div>
        <div>
          <span className="font-semibold">מספר סוגי טיפות: </span>
          {medications.length}
        </div>
      </div>

      {/* רשימת תרופות + שלבים */}
      <div className="max-h-80 space-y-3 overflow-y-auto sm:max-h-96 sm:space-y-4 md:max-h-[28rem]">
        {medications.map((m) => {
          const color = getMedicationColor(m.name, m.id);
          const chipStyle = {
            backgroundColor: `${color}22`,
            color: color,
            borderColor: color,
          } as React.CSSProperties;

          return (
            <div
              key={m.id}
              className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm sm:p-4"
            >
              <div className="flex items-center justify-between gap-2">
                {/* באדג' תרופה – קומפקטי במובייל */}
                <span
                  className="inline-flex max-w-full items-center gap-1.5 rounded-full border px-1.5 py-0.5 text-[11px] font-semibold sm:px-2 sm:py-0.5 sm:text-xs"
                  style={chipStyle}
                >
                  <span
                    className="inline-block h-4 w-4 shrink-0 rounded-full border border-current md:h-5 md:w-5"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate max-w-[9rem] sm:max-w-none">
                    {m.name}
                  </span>
                </span>

                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] text-slate-600 sm:text-xs">
                  {m.phases.length} שלבי טיפול
                </span>
              </div>

              <ul className="list-inside list-disc space-y-1 pr-3 text-[13px] text-slate-700 sm:text-sm">
                {m.phases.map((p, idx) => {
                  const range =
                    p.dayStart === p.dayEnd
                      ? `יום ${p.dayStart}`
                      : `ימים ${p.dayStart}–${p.dayEnd}`;

                  // Sterodex ביום 1 → תמיד "כל שעה"
                  const isSurgeryDaySterodex =
                    m.name.toLowerCase() === "sterodex" &&
                    p.dayStart === 1 &&
                    p.dayEnd === 1;

                  const freq = isSurgeryDaySterodex
                    ? "כל שעה"
                    : p.timesPerDay === 1
                    ? "פעם אחת ביום"
                    : `${p.timesPerDay} פעמים ביום`;

                  return (
                    <li key={idx}>
                      <span className="font-medium">{range}:</span> {freq}
                    </li>
                  );
                })}

                {m.notes && (
                  <li className="text-[13px] font-medium text-slate-700 sm:text-sm">
                    {m.notes}
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
