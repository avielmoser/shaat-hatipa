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
 * הותאם להיות קומפקטי ונוח יותר במובייל, תוך שמירה על קריאות בדסקטופ.
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
    <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 sm:p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)] space-y-3 sm:space-y-4">
      {/* כותרת + באדג' סוג ניתוח */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 sm:space-y-1">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            סיכום הוראות אחרי ניתוח
          </h3>
          <p className="text-xs sm:text-sm text-slate-600">
            {surgeryTypeText}
          </p>
        </div>
        <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium text-sky-700">
          {surgeryType}
        </span>
      </div>

      {/* פרטי בסיס: תאריך, שעות ערות, כמות תרופות */}
      <div className="grid gap-2.5 sm:gap-3 rounded-2xl bg-slate-50/80 p-3 sm:p-4 text-[13px] sm:text-sm text-slate-700 sm:grid-cols-2">
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
      <div className="space-y-3 sm:space-y-4 overflow-y-auto max-h-80 sm:max-h-96 md:max-h-[28rem]">
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
              className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm space-y-2"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-semibold"
                  style={chipStyle}
                >
                  {m.name}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] sm:text-xs text-slate-600">
                  {m.phases.length} שלבי טיפול
                </span>
              </div>

              <ul className="list-disc list-inside pr-3 space-y-1 text-[13px] sm:text-sm text-slate-700">
                {m.phases.map((p, idx) => {
                  const range =
                    p.dayStart === p.dayEnd
                      ? `יום ${p.dayStart}`
                      : `ימים ${p.dayStart}–${p.dayEnd}`;

                  // Sterodex ביום הראשון → תמיד "כל שעה"
                  const freq =
                    m.name.toLowerCase() === "sterodex" && p.dayStart === 1
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
                  <li className="font-medium text-[13px] sm:text-sm text-slate-700">
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
