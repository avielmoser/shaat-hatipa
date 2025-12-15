"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations, useLocale } from 'next-intl';
import { Calendar, Check, Eye, Activity } from "lucide-react";
import { SurgeryType } from "../types/prescription";
import type { ClinicConfig } from "../config/clinics";
import TimeInput from "./ui/TimeInput";

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
    const locale = useLocale();
    const isRtl = locale === 'he';

    // Scroll Observer for Floating Button
    const [showFloatingBtn, setShowFloatingBtn] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                setShowFloatingBtn(entry.isIntersecting);
            },
            { threshold: 0.1 } // Show when 10% of form is visible
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    // Use supportedProtocols if available, fallback to legacy supportedSurgeries, then hardcoded default
    const protocols: string[] = clinicConfig?.supportedProtocols?.length
        ? clinicConfig.supportedProtocols
        : (clinicConfig?.supportedSurgeries?.length ? clinicConfig.supportedSurgeries : ["INTERLASIK", "PRK"]);

    return (
        <div ref={containerRef} className="relative pb-24 sm:pb-0"> {/* Padding bottom for fixed CTA on mobile */}
            <div
                className="space-y-6 sm:space-y-8"
                aria-labelledby="step1-title"
            >
                {/* Header */}
                <div className="space-y-2 text-start">
                    <h2
                        id="step1-title"
                        className="text-xl sm:text-3xl font-bold tracking-tight text-slate-900"
                    >
                        {t('title')}
                    </h2>
                    <p className="max-w-xl text-sm sm:text-base text-slate-500 sm:mx-0">
                        {t('description')}
                    </p>
                </div>

                {/* Main Form Area */}
                <div className="space-y-6">

                    {/* Protocol Selection - Compact Grid */}
                    <div role="group" aria-labelledby="surgery-type-label" className="space-y-2">
                        <label id="surgery-type-label" className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500">
                            {t('surgeryType')}
                        </label>
                        <div className="grid grid-cols-2 gap-3 sm:gap-4">
                            {protocols.map((key) => {
                                const isSelected = surgeryType === key;
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const labelKey = `surgeryTypes.${key}.label` as any;
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                const descKey = `surgeryTypes.${key}.description` as any;

                                // Try to get config-defined label first (if I added label to ProtocolDefinition)
                                // But ProtocolDefinition is inside clinicConfig.protocols[key]
                                const protocolDef = clinicConfig?.protocols?.[key];
                                const configLabel = isRtl ? protocolDef?.label?.he : protocolDef?.label?.en;
                                const configDesc = isRtl ? protocolDef?.description?.he : protocolDef?.description?.en;

                                // Fallback to translations if keys missing
                                const label = configLabel || (t.has(labelKey) ? t(labelKey) : key);
                                const description = configDesc || (t.has(descKey) ? t(descKey) : "");

                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => setSurgeryType(key)}
                                        className={`
                                            relative flex flex-col sm:flex-row items-center sm:gap-4 p-3 sm:p-4 rounded-xl border-2 transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-sky-500/30
                                            ${isSelected
                                                ? "border-sky-600 bg-sky-50 shadow-sm"
                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                            }
                                        `}
                                        aria-pressed={isSelected}
                                    >
                                        {/* Icon Box */}
                                        <div className={`
                                            flex h-8 w-8 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-lg sm:rounded-xl transition-colors mb-2 sm:mb-0
                                            ${isSelected ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}
                                        `}>
                                            {/* Icon Logic: Eye for eye procedures, Activity for general/pain */}
                                            {(key === 'INTERLASIK' || key === 'EYE_PAIN' || key === 'CUSTOM' || key === 'PRK') ? (
                                                <Eye className="h-5 w-5 sm:h-6 sm:w-6" />
                                            ) : (
                                                <Activity className="h-5 w-5 sm:h-6 sm:w-6" />
                                            )}
                                        </div>

                                        {/* Text Content */}
                                        <div className="flex-1 text-start">
                                            <div className="flex items-center justify-start">
                                                <span className={`text-sm sm:text-xl font-bold ${isSelected ? "text-sky-900" : "text-slate-900"}`}>
                                                    {label}
                                                </span>
                                            </div>
                                            {description && (
                                                <p className={`mt-0.5 text-xs ${isSelected ? "text-sky-700" : "text-slate-500"}`}>
                                                    {description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Checkmark Absolute for selected - simplified on mobile */}
                                        {isSelected && (
                                            <div className="absolute top-2 right-2 sm:top-4 sm:end-4 flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm">
                                                <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date & Time Details Card - Adjusted Spacing */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        {/* Header */}
                        <div className="border-b border-slate-100 bg-slate-50/50 px-4 py-3 sm:px-6 sm:py-4">
                            <h3 className="text-sm sm:text-base font-semibold text-slate-700">
                                {t('scheduleSettings')}
                            </h3>
                        </div>

                        <div className="space-y-4 p-4 sm:p-6 sm:space-y-6">
                            {/* Date Input */}
                            <div className="space-y-1.5">
                                <label htmlFor="surgery-date" className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500">
                                    {t('surgeryDate')}
                                </label>
                                <div className="flex flex-col gap-2">
                                    {/* Icon moved outside input for better mobile RTL support */}
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
                                            <Calendar className="h-5 w-5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="relative flex-1">
                                            <input
                                                id="surgery-date"
                                                type="date"
                                                value={surgeryDate}
                                                onChange={(e) => setSurgeryDate(e.target.value)}
                                                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base sm:text-lg text-slate-900 shadow-sm transition-colors focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-4 focus:ring-sky-500/20"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Divider */}
                            <hr className="border-slate-100" />

                            {/* Time Inputs */}
                            <div className="grid grid-cols-2 gap-4 sm:gap-6">
                                <TimeInput
                                    id="wake-time"
                                    label={t('wakeTime')}
                                    value={wakeTime}
                                    onChange={setWakeTime}
                                    dir={isRtl ? 'rtl' : 'ltr'}
                                // If invalidTime is true, we want to show the error state.
                                // Since we only have 'error' string prop, we pass a space if we want red border but no text on this one,
                                // OR we rely on the second input to carry the error message.
                                // Let's keep it clean: no error on first, error message on second.
                                />

                                <TimeInput
                                    id="sleep-time"
                                    label={t('bedtime')}
                                    value={sleepTime}
                                    onChange={setSleepTime}
                                    dir={isRtl ? 'rtl' : 'ltr'}
                                    error={invalidTime && error ? error : undefined}
                                />
                            </div>

                            {/* Dedicated Helper Text Section - calm, bottom, professional placement */}
                            <p className="text-sm text-slate-500 text-start leading-relaxed bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                                {t('helperText')}
                            </p>
                        </div>
                    </div>

                    {/* Fixed Bottom CTA for Mobile / Sticky for Desktop */}
                    <div className={`
                        fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] backdrop-blur-xl sm:static sm:border-none sm:bg-transparent sm:p-0 sm:shadow-none sm:backdrop-blur-none transition-transform duration-300 ease-in-out
                        ${showFloatingBtn ? 'translate-y-0' : 'translate-y-full sm:translate-y-0'}
                    `}>
                        <div className="mx-auto w-full max-w-md sm:max-w-md sm:rounded-2xl sm:bg-white/80 sm:p-2 sm:shadow-2xl sm:ring-1 sm:ring-slate-900/5">
                            <button
                                type="button"
                                onClick={onNext}
                                disabled={!surgeryType}
                                className={`
                                    flex w-full items-center justify-center gap-2 rounded-xl py-3.5 sm:py-4 text-base sm:text-lg font-bold shadow-sm transition-all
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

                {/* Medical Disclaimer - Shown below form on desktop, maybe hidden behind fixed CTA on mobile? 
                    I'll add it here but it might need padding on mobile.
                */}
                <p className="text-center text-[10px] sm:text-xs text-slate-400 px-4">
                    {t('medicalDisclaimer')}
                </p>
            </div>
        </div>
    );
}
