"use client";

import React from "react";
import { useTranslations } from 'next-intl';
import { LaserPrescriptionInput } from "../types/prescription";
import PrescriptionView from "./PrescriptionView";
import { trackEvent } from "../lib/client/analytics";
import ShortDisclaimer from "./legal/ShortDisclaimer";

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
    const [showDisclaimerError, setShowDisclaimerError] = React.useState(false);

    const handleGenerateClick = () => {
        if (!isAgreed) {
            setShowDisclaimerError(true);
            return;
        }
        onGenerate();
    };

    const handleAgreeChange = (checked: boolean) => {
        setIsAgreed(checked);
        if (checked) {
            setShowDisclaimerError(false);

        }
    };

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
            <ShortDisclaimer
                isAccepted={isAgreed}
                onAcceptChange={handleAgreeChange}
                showError={showDisclaimerError}
            />

            {/* Spacer */}
            <div className="h-8 sm:h-10" />

            {/* Floating Buttons */}
            <div className="pointer-events-none sticky bottom-4 z-30">
                <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/15">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={handleGenerateClick}
                            disabled={loading || !isAgreed}
                            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 px-6 py-4 text-lg font-bold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                            {loading ? t('generatingButton') : t('generateButton')}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                onBack();

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

