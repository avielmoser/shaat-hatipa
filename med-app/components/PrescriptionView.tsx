// components/PrescriptionView.tsx
"use client";

import type { LaserPrescriptionInput } from "../types/prescription";
import { getMedicationColor } from "../lib/med-colors";

interface Props {
  prescription: LaserPrescriptionInput | null;
}

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
    <div className="rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">
            סיכום הוראות אחרי ניתוח
          </h3>
          <p className="mt-1 text-[11px] text-slate-500">{surgeryTypeText}</p>
        </div>

        <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-medium text-sky-700 border border-sky-100">
          {surgeryType}
        </span>
      </div>

      <div className="mt-3 grid gap-2 rounded-2xl bg-slate-50/80 p-3 text-[11px] text-slate-700 sm:grid-cols-2">
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

      <div className="mt-4 space-y-3 text-xs">
        {medications.map((m) => {
          const color = getMedicationColor(m.name, m.id);
          const chipStyle = color
            ? {
                backgroundColor: `${color}22`,
                color: color,
                borderColor: color,
              }
            : undefined;

          return (
            <div
              key={m.id}
              className="rounded-2xl border border-slate-200 px-3 py-3 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span
                  className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                  style={chipStyle}
                >
                  {m.name}
                </span>

                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-600">
                  {m.phases.length} שלבי טיפול
                </span>
              </div>

              {/* 🔽🔽 שינוי פה 🔽🔽 */}
              <ul className="mt-1 list-disc list-inside pr-3 space-y-1 text-[11px] leading-relaxed text-slate-600">
                {m.phases.map((p, idx) => {
                  const range =
                    p.dayStart === p.dayEnd
                      ? `יום ${p.dayStart}`
                      : `ימים ${p.dayStart}–${p.dayEnd}`;
                  const freq =
                    p.timesPerDay === 1
                      ? "פעם אחת ביום"
                      : `${p.timesPerDay} פעמים ביום`;

                  return (
                    <li key={idx}>
                      <span className="font-medium">{range}:</span> {freq}
                    </li>
                  );
                })}

                {m.notes && (
                  <li className="font-medium text-slate-700">{m.notes}</li>
                )}
              </ul>
              {/* 🔼🔼 עד כאן 🔼🔼 */}
            </div>
          );
        })}
      </div>
    </div>
  );
}
