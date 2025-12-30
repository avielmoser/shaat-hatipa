"use client";

import React from "react";
// import Link from "next/link"; // Remove standard next/link
import { Link } from "@/i18n/routing"; // Use localized Link
import { useTranslations } from "next-intl";

interface ShortDisclaimerProps {
  isAccepted: boolean;
  onAcceptChange: (accepted: boolean) => void;
  showError?: boolean;
}

export default function ShortDisclaimer({
  isAccepted,
  onAcceptChange,
  showError = false,
}: ShortDisclaimerProps) {
  const t = useTranslations("disclaimer");

  return (
    <div
      className={`rounded-2xl border p-4 transition-colors ${showError ? "border-red-200 bg-red-50" : "border-slate-200 bg-slate-50"
        }`}
    >
      <div className="space-y-4">
        <div className="text-sm text-slate-700">
          <p className="font-bold text-slate-900 mb-1">{t("title")}</p>
          <p className="mb-2 leading-relaxed">{t("content")}</p>
          <p className="font-semibold text-sky-800">{t("confirmation")}</p>
        </div>

        {/* Checkbox and Link Area */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-start gap-3">
            <div className="flex h-6 items-center">
              <input
                id="legal-agree-checkbox"
                type="checkbox"
                checked={isAccepted}
                onChange={(e) => onAcceptChange(e.target.checked)}
                className="h-5 w-5 rounded border-amber-400 text-amber-700 focus:ring-amber-700 cursor-pointer"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="legal-agree-checkbox"
                className="block text-sm font-semibold text-slate-900 cursor-pointer select-none"
              >
                {t("checkboxLabel")}
              </label>
              {showError && (
                <p className="mt-1 text-sm text-red-600 font-bold animate-pulse">
                  {t("error")}
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-start sm:justify-end">
            <Link
              href="/terms"
              target="_blank"
              className="text-xs text-slate-500 hover:text-sky-600 underline underline-offset-2 transition-colors"
            >
              {t("fullTermsLink")}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

