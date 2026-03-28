"use client";

import React, { useEffect } from "react";
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

    // Analytics: Track wizard entry
    useEffect(() => {
        // Fire wizard_viewed on mount
        import("../lib/client/analytics").then(({ trackEvent }) => {
            trackEvent("wizard_viewed", { step: "1" });
        });
    }, []);

    // Analytics: Track time modifications
    useEffect(() => {
        const defaultWake = "08:00";

        const defaultSleep = "22:00";

        // We use a timeout to avoid firing on initial render if defaults are different (though they shouldn't be)
        // and to debounce slightly. But simpler: check if current !== default.
        // We only want to fire ONCE per session per type ideally, but firing multiple times is fine
        // as the metric is "sessions with time change".

        const isWakeChanged = wakeTime !== defaultWake;
        const isSleepChanged = sleepTime !== defaultSleep;

        if (isWakeChanged || isSleepChanged) {
            // Debounce this heavily or just fire?
            // To prevent spamming while scrolling/typing, we can verify this later.
            // But for now, let's just fire when it changes. 
            // Better: fire on blur? The TimeInput doesn't expose onBlur.
            // Let's use a meaningful timeout (e.g. 2s after change)
            const timer = setTimeout(() => {
                import("../lib/client/analytics").then(({ trackEvent }) => {
                    trackEvent("time_modified", {
                        eventType: "action",
                        wakeModified: isWakeChanged,
                        sleepModified: isSleepChanged,
                        wakeTime,
                        sleepTime
                    });
                });
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [wakeTime, sleepTime]);

    // Use supportedProtocols if available, fallback to legacy supportedSurgeries, then hardcoded default
    const protocols: string[] = clinicConfig?.supportedProtocols?.length
        ? clinicConfig.supportedProtocols
        : (clinicConfig?.supportedSurgeries?.length ? clinicConfig.supportedSurgeries : ["INTERLASIK", "PRK"]);

    return (
        <div className="relative min-w-0 pb-2 sm:pb-0">
            <div
                className="min-w-0 space-y-3 sm:space-y-8"
                aria-labelledby="step1-title"
            >
                {/* Header */}
                <div className="space-y-0.5 text-start">
                    <h2
                        id="step1-title"
                        className="text-base sm:text-3xl font-bold tracking-tight text-slate-900"
                    >
                        {t('title')}
                    </h2>
                    <p className="max-w-xl text-xs sm:text-base text-slate-500 leading-snug sm:leading-relaxed">
                        {t('description')}
                    </p>
                </div>

                {/* Dev Only: Smoke Test Button */}
                {process.env.NODE_ENV === "development" && (
                    <div className="text-center">
                        <button
                            type="button"
                            className="text-xs text-slate-400 underline hover:text-slate-600"
                            onClick={() => {
                                import("../lib/client/analytics").then(({ trackEvent }) => {
                                    trackEvent("time_modified", { eventType: "action", smokeTest: true });
                                    alert("Sent: time_modified");
                                });
                            }}
                        >
                            [DEV] Test Analytics Event
                        </button>
                    </div>
                )}

                {/* Main Form Area */}
                <div className="min-w-0 space-y-3 sm:space-y-6">

                    {/* Protocol Selection - Compact Grid */}
                    <div role="group" aria-labelledby="surgery-type-label" className="min-w-0 space-y-1.5 sm:space-y-2">
                        <label id="surgery-type-label" className="block text-xs sm:text-sm font-semibold uppercase tracking-wider text-slate-500">
                            {t('surgeryType')}
                        </label>
                        <div className="grid min-w-0 grid-cols-2 gap-2 sm:gap-4">
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
                                            relative flex min-h-11 min-w-0 items-center gap-2 sm:gap-4 p-2 sm:p-5 rounded-lg sm:rounded-2xl border-2 transition-all duration-200 outline-none focus-visible:ring-4 focus-visible:ring-sky-500/30
                                            ${isSelected
                                                ? "border-sky-600 bg-sky-50 shadow-sm ring-1 ring-sky-600/10"
                                                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                                            }
                                        `}
                                        aria-pressed={isSelected}
                                    >
                                        {/* Icon Box */}
                                        <div className={`
                                            hidden xs:flex sm:flex h-7 w-7 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-md sm:rounded-xl transition-colors
                                            ${isSelected ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"}
                                        `}>
                                            {(key === 'INTERLASIK' || key === 'EYE_PAIN' || key === 'CUSTOM' || key === 'PRK') ? (
                                                <Eye className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                                            ) : (
                                                <Activity className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                                            )}
                                        </div>

                                        {/* Text Content */}
                                        <div className="flex-1 text-start overflow-hidden">
                                            <div className="flex items-center justify-start">
                                                <span className={`text-sm sm:text-xl font-bold truncate ${isSelected ? "text-sky-900" : "text-slate-900"}`}>
                                                    {label}
                                                </span>
                                            </div>
                                            {description && (
                                                <p className={`hidden sm:block mt-0.5 text-xs sm:text-sm leading-tight ${isSelected ? "text-sky-700/80" : "text-slate-500"}`}>
                                                    {description}
                                                </p>
                                            )}
                                        </div>

                                        {/* Checkmark - Better placement for mobile */}
                                        {isSelected && (
                                            <div className="absolute top-1.5 end-1.5 sm:top-3 sm:end-3 flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-white shadow-sm ring-2 ring-white">
                                                <Check className="h-3 w-3" />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Date & Time Details Card - Adjusted Spacing */}
                    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:rounded-2xl">
                        {/* Header */}
                        <div className="border-b border-slate-100 bg-slate-50/50 px-2.5 py-1.5 sm:px-6 sm:py-4">
                            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 sm:text-base">
                                {t('scheduleSettings')}
                            </h3>
                        </div>

                        <div className="min-w-0 space-y-2.5 p-2.5 sm:space-y-6 sm:p-6">
                            {/* Date Input */}
                            <div className="space-y-1">
                                <label htmlFor="surgery-date" className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                                    {t('surgeryDate')}
                                </label>
                                <div className="flex min-w-0 flex-col gap-1.5">
                                    {/* Icon + date: min-w-0 chain so iOS date control cannot overflow the card */}
                                    <div className="flex min-w-0 items-stretch gap-2 sm:items-center sm:gap-3">
                                        <div className="flex h-8 w-8 shrink-0 items-center justify-center self-center rounded-md bg-slate-100 text-slate-500 sm:h-12 sm:w-12 sm:rounded-xl">
                                            <Calendar className="h-3.5 w-3.5 sm:h-6 sm:w-6" />
                                        </div>
                                        <div className="relative min-w-0 flex-1 overflow-hidden">
                                            <input
                                                id="surgery-date"
                                                type="date"
                                                value={surgeryDate}
                                                onChange={(e) => setSurgeryDate(e.target.value)}
                                                className="box-border block min-h-11 w-full min-w-0 max-w-full rounded-lg border border-slate-200 bg-slate-50 px-2 py-2 text-base text-slate-900 shadow-sm transition-colors focus:border-sky-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 sm:min-h-0 sm:rounded-xl sm:px-4 sm:py-3 sm:text-lg sm:focus:ring-4"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Time Inputs */}
                            <div className="grid min-w-0 grid-cols-1 gap-3 border-t border-slate-100 pt-2.5 sm:grid-cols-2 sm:gap-6 sm:border-0 sm:pt-0">
                                <TimeInput
                                    id="wake-time"
                                    className="min-w-0"
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
                                    className="min-w-0"
                                    label={t('bedtime')}
                                    value={sleepTime}
                                    onChange={setSleepTime}
                                    dir={isRtl ? 'rtl' : 'ltr'}
                                    error={invalidTime && error ? error : undefined}
                                />
                            </div>

                            {/* Helper Text - compact inline style */}
                            <p className="text-start text-xs leading-tight text-slate-400 sm:leading-snug">
                                {t('helperText')}
                            </p>
                        </div>
                    </div>

                    {/* Primary CTA — inline on mobile so it reads as the next step in the form; elevated card on desktop */}
                    <div className="mt-3 min-w-0 sm:mt-6">
                        <div className="mx-auto w-full min-w-0 max-w-md space-y-2 sm:space-y-0 sm:rounded-2xl sm:bg-white/80 sm:p-2 sm:shadow-2xl sm:ring-1 sm:ring-slate-900/5">
                            <p className="px-1 text-center text-xs leading-snug text-slate-400 sm:hidden">
                                {t('medicalDisclaimer')}
                            </p>
                            <button
                                type="button"
                                onClick={onNext}
                                disabled={!surgeryType}
                                className={`
                                    flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold shadow-sm transition-all sm:min-h-0 sm:py-4 sm:text-lg sm:font-bold
                                    ${surgeryType
                                        ? "bg-sky-600 text-white hover:bg-sky-500 hover:shadow-md hover:shadow-sky-500/20 active:scale-[0.98]"
                                        : "cursor-not-allowed bg-slate-100 text-slate-400"
                                    }
                                `}
                            >
                                {t('nextButton')}
                            </button>
                        </div>
                    </div>
                </div>

                <p className="mt-3 hidden text-center text-xs text-slate-400 sm:block sm:px-4">
                    {t('medicalDisclaimer')}
                </p>
            </div>
        </div>
    );
}
