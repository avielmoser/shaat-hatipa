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
      ? "Post-INTERLASIK drop protocol."
      : surgeryType === "PRK"
        ? "Post-PRK drop protocol."
        : "Custom protocol.";

  return (
    <div className="space-y-3 sm:space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-4 sm:p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      {/* Header + Surgery Type Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 sm:space-y-1">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Post-Op Instructions Summary
          </h3>
          <p className="text-sm sm:text-base text-slate-800">{surgeryTypeText}</p>
        </div>
        <span className="rounded-full border-2 border-sky-200 bg-sky-50 px-3 py-1 text-sm font-bold text-sky-800 sm:px-4 sm:py-1.5 sm:text-base">
          {surgeryType}
        </span>
      </div>

      {/* Basic Details: Date, Waking Hours, Med Count */}
      <div className="grid gap-3 rounded-2xl bg-slate-50/80 p-4 text-base text-slate-800 sm:grid-cols-2 sm:gap-4 sm:p-5 sm:text-lg">
        <div>
          <span className="font-semibold">Surgery Date: </span>
          {surgeryDate}
        </div>
        <div>
          <span className="font-semibold">Waking Hours: </span>
          {wakeTime}–{sleepTime}
        </div>
        <div>
          <span className="font-semibold">Number of Medications: </span>
          {medications.length}
        </div>
      </div>

      {/* Medication List + Phases */}
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
                {/* Medication Badge */}
                <span
                  className="inline-flex max-w-full items-center gap-2 rounded-full border-2 px-3 py-1 text-sm font-bold sm:px-4 sm:py-1.5 sm:text-base"
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

                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800 font-medium sm:text-base">
                  {m.phases.length} Treatment Phases
                </span>
              </div>

              <ul className="list-inside list-disc space-y-2 pr-3 text-base text-slate-900 sm:text-lg">
                {m.phases.map((p, idx) => {
                  const range =
                    p.dayStart === p.dayEnd
                      ? `Day ${p.dayStart}`
                      : `Days ${p.dayStart}–${p.dayEnd}`;

                  // Sterodex on Day 1 → always "Every hour"
                  const isSurgeryDaySterodex =
                    m.name.toLowerCase() === "sterodex" &&
                    p.dayStart === 1 &&
                    p.dayEnd === 1;

                  const freq = isSurgeryDaySterodex
                    ? "Every hour"
                    : p.timesPerDay === 1
                      ? "Once a day"
                      : `${p.timesPerDay} times a day`;

                  return (
                    <li key={idx}>
                      <span className="font-medium">{range}:</span> {freq}
                    </li>
                  );
                })}

                {m.notes && (
                  <li className="text-base font-bold text-slate-900 sm:text-lg">
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
