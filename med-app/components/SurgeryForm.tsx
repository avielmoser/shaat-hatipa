"use client";

import React from "react";
import { useTranslations } from 'next-intl';
import { Calendar, Sun, Moon, Check, Eye, Activity } from "lucide-react";
import { SurgeryType } from "../types/prescription";
import type { ClinicConfig } from "../config/clinics";

interface SurgeryFormProps {
    surgeryType: SurgeryType | null;
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
    clinicConfig?: ClinicConfig | null;
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
    clinicConfig
}: SurgeryFormProps) {
    const t = useTranslations('Wizard.step1');

    // Default to common surgeries if no clinic config
    const surgeries: SurgeryType[] = clinicConfig?.supportedSurgeries?.length
        ? clinicConfig.supportedSurgeries
        : ["INTERLASIK", "PRK"];

    return (
        <div
            className="relative space-y-8"
            aria-labelledby="step1-title"
        >
            {/* Header */}
            <div className="space-y-3 text-center sm:text-start">
                <h2
                    id="step1-title"
                    className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl"
                >
                    {t('title')}
                </h2>
                <p className="max-w-xl text-base text-slate-500 sm:text-lg">
                    {t('description')}
                </p>
            </div>

            {/* Main Form Area */}
            <div className="space-y-8">

                {/* Surgery Selection - Segmented Cards */}
                <div role="group" aria-labelledby="surgery-type-label" className="space-y-3">
                    <label id="surgery-type-label" className="block text-sm font-semibold uppercase tracking-wider text-slate-500">
                        {t('surgeryType')}
                    </label>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {surgeries.map((type) => {
                            const isSelected = surgeryType === type;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const labelKey = `surgeryTypes.${type}.label` as any;
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const descKey = `surgeryTypes.${type}.description` as any;

                            // Fallback if keys missing
                            const label = t.has(labelKey) ? t(labelKey) : type;
                            const description = t.has(descKey) ? t(descKey) : "";

                            return (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSurgeryType(type)}
                                    className={`
                                        relative flex items-center gap-4 rounded-2xl border-2 p-4 transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-sky-500/30
                                        ${isSelected
                                            ? "border-sky-600 bg-sky-50 shadow-sm"
                                            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                        }
                                    `}
                                    aria-pressed={isSelected}
                                >
                                    {/* Icon Box */}
                                    <div className={`
                                        flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition-colors
                                        ${isSelected ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}
                                    `}>
                                        {type === 'PRK' ? <Activity className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
                                    </div>

                                    {/* Text Content */}
                                    <div className="flex-1 text-center">
                                        <div className="flex items-center justify-center">
                                            <span className={`text-xl font-bold ${isSelected ? "text-sky-900" : "text-slate-900"}`}>
                                                {label}
                                            </span>
                                        </div>
                                        {description && (
                                            <p className={`mt-1 text-sm ${isSelected ? "text-sky-700" : "text-slate-500"}`}>
                                                {description}
                                            </p>
                                        )}
                                    </div>

                                    {/* Checkmark Absolute for selected */}
                                    {isSelected && (
                                        <div className="absolute top-4 end-4 flex h-6 w-6 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm">
                                            <Check className="h-4 w-4" />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Date & Time Details Card */}
                <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {/* Header */}
                    <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
                        <h3 className="text-base font-semibold text-slate-700">
                            {t('scheduleSettings')}
                        </h3>
                    </div>

                    <div className="space-y-6 p-6">
                        {/* Date Input */}
                        <div className="space-y-2">
                            <label htmlFor="surgery-date" className="block text-sm font-semibold uppercase tracking-wider text-slate-500">
                                {t('surgeryDate')}
                            </label>
                            <div className="relative">
                                <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                                    <Calendar className="h-5 w-5 text-slate-400" />
                                </div>
                                <input
                                    id="surgery-date"
                                    type="date"
                                    value={surgeryDate}
                                    onChange={(e) => setSurgeryDate(e.target.value)}
                                    className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 ps-12 text-lg text-slate-900 shadow-sm transition-colors focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/20"
                                    // 'start' instead of 'left' for RTL support
                                    style={{ paddingInlineStart: '3rem' }}
                                />
                            </div>
                        </div>

                        {/* Divider */}
                        <hr className="border-slate-100" />

                        {/* Time Inputs */}
                        <div className="grid gap-6 sm:grid-cols-2">
                            <div className="space-y-2">
                                <label htmlFor="wake-time" className="block text-sm font-semibold uppercase tracking-wider text-slate-500">
                                    {t('wakeTime')}
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                                        <Sun className="h-5 w-5 text-amber-500" />
                                    </div>
                                    <input
                                        id="wake-time"
                                        type="time"
                                        value={wakeTime}
                                        onChange={(e) => setWakeTime(e.target.value)}
                                        className={`
                                            block w-full rounded-xl border bg-slate-50 px-4 py-3 ps-12 text-lg text-slate-900 shadow-sm transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/20
                                            ${invalidTime ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-sky-500"}
                                        `}
                                        style={{ paddingInlineStart: '3rem' }}
                                        dir="ltr" // Time inputs usually LTR even in RTL
                                        aria-invalid={invalidTime}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="sleep-time" className="block text-sm font-semibold uppercase tracking-wider text-slate-500">
                                    {t('bedtime')}
                                </label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center ps-4">
                                        <Moon className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <input
                                        id="sleep-time"
                                        type="time"
                                        value={sleepTime}
                                        onChange={(e) => setSleepTime(e.target.value)}
                                        className={`
                                            block w-full rounded-xl border bg-slate-50 px-4 py-3 ps-12 text-lg text-slate-900 shadow-sm transition-all focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/20
                                            ${invalidTime ? "border-red-300 focus:border-red-500 focus:ring-red-200" : "border-slate-200 focus:border-sky-500"}
                                        `}
                                        style={{ paddingInlineStart: '3rem' }}
                                        dir="ltr"
                                        aria-invalid={invalidTime}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Helper / Error Text */}
                        <div className="flex items-start gap-2 pt-2">
                            {error ? (
                                <p className="text-sm font-bold text-red-600" role="alert">
                                    {error}
                                </p>
                            ) : (
                                <p className="text-sm text-slate-500">
                                    <span className="me-2 text-sky-500">ℹ</span>
                                    {t('helperText')}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Floating Action Button area (sticky bottom) */}
                <div className="sticky bottom-6 z-20 flex justify-center pt-4">
                    <div className="w-full max-w-md rounded-2xl bg-white/80 p-2 shadow-2xl backdrop-blur-xl ring-1 ring-slate-900/5">
                        <button
                            type="button"
                            onClick={onNext}
                            disabled={!surgeryType}
                            className={`
                                flex w-full items-center justify-center gap-2 rounded-xl py-4 text-lg font-bold shadow-sm transition-all
                                ${surgeryType
                                    ? "bg-sky-600 text-white hover:bg-sky-500 hover:shadow-md hover:shadow-sky-500/20 active:scale-[0.98]"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                }
                            `}
                        >
                            {t('nextButton')}
                        </button>
                    </div>
                </div>
            </div>

            {/* Medical Disclaimer */}
            <p className="text-center text-xs text-slate-400">
                {t('medicalDisclaimer')}
            </p>
        </div>
    );
}
