"use client";

import React from "react";
import { useTranslations } from 'next-intl';
import { LaserPrescriptionInput } from "../types/prescription";
import PrescriptionView from "./PrescriptionView";
import { trackEvent } from "../lib/analytics";

interface ProtocolReviewProps {
    prescription: LaserPrescriptionInput;
    error: string | null;
    loading: boolean;
    onBack: () => void;
    onGenerate: () => void;
}

export default function ProtocolReview({
    prescription,
    error,
    loading,
    onBack,
    onGenerate,
}: ProtocolReviewProps) {
    const t = useTranslations('Wizard.step2');
    const [isAgreed, setIsAgreed] = React.useState(false);

    return (
        <div className="relative space-y-4" aria-labelledby="step2-title">
            <div className="flex items-center justify-between">
                <h2
                    id="step2-title"
                    className="text-lg font-semibold text-slate-900 sm:text-2xl"
                >
                    {t('title')}
                </h2>
                <button
                    type="button"
                    onClick={() => {
                        onBack();
                        trackEvent("back_to_step_1_clicked");
                    }}
                    className="text-base text-slate-700 underline-offset-2 hover:text-slate-900 hover:underline"
                >
                    {t('backToStep1')}
                </button>
            </div>

            <PrescriptionView prescription={prescription} />

            {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-base font-bold text-red-800">
                    {error}
                </div>
            )}

            {/* Disclaimer */}
            <div className="rounded-lg bg-amber-50 border border-amber-100 p-4 text-sm text-amber-900">
                <div className="flex items-start gap-3">
                    <div className="flex h-6 items-center">
                        <input
                            id="disclaimer-agree"
                            name="disclaimer-agree"
                            type="checkbox"
                            checked={isAgreed}
                            onChange={(e) => {
                                setIsAgreed(e.target.checked);
                                if (e.target.checked) {
                                    trackEvent("disclaimer_agreed");
                                }
                            }}
                            className="h-5 w-5 rounded border-amber-300 text-amber-600 focus:ring-amber-600 cursor-pointer"
                        />
                    </div>
                    <div className="text-sm leading-6">
                        <label htmlFor="disclaimer-agree" className="font-medium text-amber-900 cursor-pointer select-none">
                            {t('disclaimerAgree')}
                        </label>
                        <p className="text-amber-800 opacity-90">
                            {t('disclaimerText')}
                        </p>
                    </div>
                </div>
            </div>

            {/* Spacer */}
            <div className="h-8 sm:h-10" />

            {/* Floating Buttons */}
            <div className="pointer-events-none sticky bottom-4 z-30">
                <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/15">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={onGenerate}
                            disabled={loading || !isAgreed}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 px-6 py-4 text-lg font-bold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                            {loading ? t('generatingButton') : t('generateButton')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onBack();
                                trackEvent("back_to_step_1_clicked");
                            }}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-6 py-4 text-lg font-bold text-slate-700 hover:bg-slate-50"
                        >
                            {t('backButton')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

