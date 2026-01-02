"use client";

import React from "react";
import { useTranslations } from "next-intl";

export default function FullDisclaimer() {
    const t = useTranslations("disclaimer");

    return (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 space-y-4">
            <h2 className="text-xl font-bold text-amber-900 flex items-center gap-2">
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-6 h-6 text-amber-700"
                    aria-hidden="true"
                >
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {t("title")}
            </h2>

            <div className="prose prose-sm prose-amber max-w-none text-slate-800">
                <p className="whitespace-pre-wrap leading-relaxed font-medium">
                    {t("medical_disclaimer_full")}
                </p>
            </div>
        </div>
    );
}
