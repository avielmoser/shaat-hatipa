"use client";

import React from "react";
import { useTranslations } from 'next-intl';
import { DoseSlot } from "../types/prescription";
import ScheduleView from "./ScheduleView";
import { trackEvent } from "../lib/client/analytics";
import type { ClinicBrand } from "../config/clinics";

interface ScheduleDisplayProps {
    schedule: DoseSlot[];
    onBack: () => void;
    onHome: () => void;
    clinicConfig?: ClinicBrand;
}

export default function ScheduleDisplay({
    schedule,
    onBack,
    onHome,
    clinicConfig,
}: ScheduleDisplayProps) {
    const t = useTranslations('Wizard.step3');

    return (
        <div className="relative space-y-4" aria-labelledby="step3-title">
            <div className="flex items-center justify-between">
                <h2
                    id="step3-title"
                    className="text-lg font-semibold text-slate-900 sm:text-2xl"
                >
                    {t('title')}
                </h2>
            </div>

            <div>
                <ScheduleView schedule={schedule} clinicConfig={clinicConfig} />
            </div>

            {/* Spacer */}
            <div className="h-14 sm:h-16" />

            {/* Floating Buttons */}
            <div className="pointer-events-none sticky bottom-4 z-30">
                <div className="pointer-events-auto mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-900/15">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                onBack();

                            }}
                            className="h-16 md:h-20 w-full rounded-xl border border-slate-300 bg-white px-3 text-lg font-bold text-slate-700 leading-snug hover:bg-slate-50"
                        >
                            <span dangerouslySetInnerHTML={{ __html: t.raw('backToStep2') }} />
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                onHome();

                            }}
                            className="h-16 md:h-20 w-full rounded-xl bg-slate-100 px-3 text-lg font-bold text-slate-900 hover:bg-slate-200"
                        >
                            {t('backToHome')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

