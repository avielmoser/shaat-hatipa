"use client";

import React from "react";
import { useTranslations } from 'next-intl';
import { SurgeryType } from "../types/prescription";

interface SurgeryFormProps {
    surgeryType: SurgeryType;
    setSurgeryType: (type: SurgeryType) => void;
    surgeryDate: string;
    setSurgeryDate: (date: string) => void;
    wakeTime: string;
    setWakeTime: (time: string) => void;
    sleepTime: string;
    setSleepTime: (time: string) => void;
    invalidTime: boolean;
    error: string | null;
    onNext: () => void;
}

export default function SurgeryForm({
    surgeryType,
    setSurgeryType,
    surgeryDate,
    setSurgeryDate,
    wakeTime,
    setWakeTime,
    sleepTime,
    setSleepTime,
    invalidTime,
    error,
    onNext,
}: SurgeryFormProps) {
    const t = useTranslations('Wizard.step1');

    return (
        <div
            className="relative space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:space-y-6 sm:p-6"
            aria-labelledby="step1-title"
        >
            <div className="space-y-1">
                <h2
                    id="step1-title"
                    className="text-lg font-semibold text-slate-900 sm:text-2xl"
                >
                    {t('title')}
                </h2>
                <p className="text-base text-slate-700 sm:text-lg">
                    {t('description')}
                </p>
            </div>

            <div className="space-y-4 text-base sm:space-y-6">
                <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                    <div className="space-y-1">
                        <label
                            htmlFor="surgery-type"
                            className="block text-base font-bold text-slate-900"
                        >
                            {t('surgeryType')}
                        </label>
                        <select
                            id="surgery-type"
                            value={surgeryType}
                            onChange={(e) => setSurgeryType(e.target.value as SurgeryType)}
                            className="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-500/30"
                            dir="ltr"
                        >
                            <option value="INTERLASIK">INTERLASIK</option>
                            <option value="PRK">PRK</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor="surgery-date"
                            className="block text-base font-bold text-slate-900"
                        >
                            {t('surgeryDate')}
                        </label>
                        <input
                            id="surgery-date"
                            type="date"
                            value={surgeryDate}
                            onChange={(e) => setSurgeryDate(e.target.value)}
                            className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-lg text-slate-900 shadow-sm focus:border-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-500/30"
                            dir="ltr"
                        />
                    </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 sm:gap-6">
                    <div className="space-y-1">
                        <label
                            htmlFor="wake-time"
                            className="block text-base font-bold text-slate-900"
                        >
                            {t('wakeTime')}
                        </label>
                        <input
                            id="wake-time"
                            type="time"
                            value={wakeTime}
                            onChange={(e) => setWakeTime(e.target.value)}
                            className={`block w-full rounded-lg border px-4 py-3 text-lg text-slate-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-sky-500/30 ${invalidTime
                                ? "border-red-500"
                                : "border-slate-300 focus:border-sky-600"
                                }`}
                            aria-invalid={invalidTime || undefined}
                            aria-describedby={invalidTime ? "time-error" : undefined}
                            dir="ltr"
                        />
                    </div>

                    <div className="space-y-1">
                        <label
                            htmlFor="sleep-time"
                            className="block text-base font-bold text-slate-900"
                        >
                            {t('bedtime')}
                        </label>
                        <input
                            id="sleep-time"
                            type="time"
                            value={sleepTime}
                            onChange={(e) => setSleepTime(e.target.value)}
                            className={`block w-full rounded-lg border px-4 py-3 text-lg text-slate-900 shadow-sm focus:outline-none focus:ring-4 focus:ring-sky-500/30 ${invalidTime
                                ? "border-red-500"
                                : "border-slate-300 focus:border-sky-600"
                                }`}
                            aria-invalid={invalidTime || undefined}
                            aria-describedby={invalidTime ? "time-error" : undefined}
                            dir="ltr"
                        />
                    </div>
                </div>

                {error && (
                    <div
                        id="time-error"
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base font-bold text-red-800"
                    >
                        {error}
                    </div>
                )}
            </div>

            {/* Spacer */}
            <div className="h-12 sm:h-14" />

            {/* Floating Button Step 2 */}
            <div className="pointer-events-none sticky bottom-4 z-30">
                <div className="pointer-events-auto mx-auto max-w-xs rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/15">
                    <button
                        type="button"
                        onClick={onNext}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-6 py-4 text-lg font-bold text-white shadow-sm hover:bg-sky-700"
                    >
                        {t('nextButton')}
                    </button>
                </div>
            </div>
        </div>
    );
}

