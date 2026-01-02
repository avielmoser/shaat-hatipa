// components/PrescriptionView.tsx
"use client";

import type React from "react";
import { useTranslations, useLocale } from 'next-intl';
import type { LaserPrescriptionInput } from "../types/prescription";
import { resolveLocalizedString } from "@/domain/utils/i18n";
import { getMedicationColor } from "../lib/theme/medicationColors";

interface Props {
  prescription: LaserPrescriptionInput | null;
}

/**
 * מציג סיכום של הפרוטוקול שנבחר, כולל תאריך ניתוח, שעות ערות ורשימת תרופות.
 * קומפקטי ונוח יותר במובייל, תוך שמירה על קריאות בדסקטופ.
 */
export default function PrescriptionView({ prescription }: Props) {
  const t = useTranslations('Prescription');
  const locale = useLocale();
  if (!prescription) return null;
  const { surgeryType, surgeryDate, wakeTime, sleepTime, medications } =
    prescription;

  const surgeryTypeText =
    surgeryType === "INTERLASIK"
      ? t('protocols.INTERLASIK')
      : surgeryType === "PRK"
        ? t('protocols.PRK')
        : t('protocols.custom');

  return (
    <div className="space-y-3 sm:space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-3 sm:p-6 shadow-[0_16px_40px_rgba(15,23,42,0.08)]">
      {/* Header + Surgery Type Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 sm:space-y-1">
          <h3 className="text-sm sm:text-lg font-semibold text-slate-900">
            {t('title')}
          </h3>
          <p className="text-xs sm:text-base text-slate-800">{surgeryTypeText}</p>
        </div>
        <span className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-0.5 text-xs font-bold text-sky-800 sm:border-2 sm:px-4 sm:py-1.5 sm:text-base">
          {surgeryType}
        </span>
      </div>

      {/* Basic Details: Date, Waking Hours, Med Count */}
      <div className="grid gap-2 rounded-2xl bg-slate-50/50 p-3 text-xs text-slate-700 sm:grid-cols-2 sm:gap-4 sm:p-5 sm:text-lg">
        <div>
          <span className="font-semibold text-slate-900">{t('labels.surgeryDate')} </span>
          {surgeryDate}
        </div>
        <div>
          <span className="font-semibold text-slate-900">{t('labels.wakingHours')} </span>
          {wakeTime}–{sleepTime}
        </div>
        <div>
          <span className="font-semibold text-slate-900">{t('labels.medCount')} </span>
          {medications.length}
        </div>
      </div>

      <div className="max-h-80 space-y-3 overflow-y-auto sm:max-h-96 sm:space-y-4 md:max-h-[28rem]">
        {medications.map((m) => {
          const resolvedName = resolveLocalizedString(m.name, locale);
          // Use action.color if available (assigned by protocol resolver), otherwise fallback
          const color = m.color || getMedicationColor(resolvedName, m.id);
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
                    {resolvedName}
                  </span>
                </span>

                <span className="rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-800 font-medium sm:text-base">
                  {t('phases.treatmentPhases', { count: m.phases.length })}
                </span>
              </div>

              <ul className="list-inside list-disc space-y-2 pe-3 text-base text-slate-900 sm:text-lg">
                {m.phases.map((p, idx) => {
                  const range =
                    p.dayStart === p.dayEnd
                      ? t('phases.day', { day: p.dayStart })
                      : t('phases.days', { start: p.dayStart, end: p.dayEnd });

                  // Sterodex on Day 1 → always "Every hour"
                  const isSurgeryDaySterodex =
                    resolveLocalizedString(m.name, 'en').toLowerCase() === "sterodex" &&
                    p.dayStart === 1 &&
                    p.dayEnd === 1;

                  const freq = isSurgeryDaySterodex
                    ? t('phases.everyHour')
                    : p.timesPerDay === 1
                      ? t('phases.onceADay')
                      : t('phases.timesADay', { count: p.timesPerDay });

                  return (
                    <li key={idx}>
                      <span className="font-medium">{range}:</span> {freq}
                    </li>
                  );
                })}

                {m.notes && (
                  <li className="text-base font-bold text-slate-900 sm:text-lg">
                    {resolveLocalizedString(m.notes, locale)}
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

