"use client";

import React from "react";
import Link from "next/link";
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
    // Note: We are hardcoding the text here as per legal requirements to ensure exact wording compliance,
    // rather than using i18n JSONs which might be edited by non-developers.
    
  return (
    <div className={`rounded-xl border p-4 transition-colors ${
        showError ? "border-red-300 bg-red-50" : "border-amber-200 bg-amber-50"
    }`}>
      <div className="space-y-4">
        {/* English Section */}
        <div className="text-sm text-slate-800" dir="ltr">
          <p className="font-bold text-amber-900 mb-1">Important Medical Notice:</p>
          <p className="mb-2">
            This tool is for organizational purposes only and does not provide medical advice, diagnosis, or personalized treatment. The schedule is generated based on general protocols and may not match your specific needs. Your surgeon’s instructions always override this application. This app does not store any personal medical data.
          </p>
          <p className="font-medium text-amber-900">
            By proceeding, you confirm that you will follow your surgeon's specific instructions above all else.
          </p>
        </div>

        <div className="h-px bg-amber-200/60" />

        {/* Hebrew Section */}
        <div className="text-sm text-slate-800 text-right" dir="rtl">
          <p className="font-bold text-amber-900 mb-1">הודעה רפואית חשובה:</p>
          <p className="mb-2">
            כלי זה נועד למטרות ארגון וסדר בלבד ואינו מספק ייעוץ רפואי, אבחון או טיפול מותאם אישית. הלו"ז נוצר על בסיס פרוטוקולים כלליים ועשוי שלא להתאים למצבך הספציפי. הנחיות המנתח/ת שלך גוברות תמיד על המופיע באפליקציה. האפליקציה אינה שומרת מידע רפואי אישי.
          </p>
          <p className="font-medium text-amber-900">
            המשך השימוש מהווה אישור לכך שתפעל/י לפי הנחיות המנתח/ת שלך מעל לכל.
          </p>
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
                    <label htmlFor="legal-agree-checkbox" className="block text-sm font-semibold text-slate-900 cursor-pointer select-none">
                        I have read and agree to the medical notice above.
                    </label>
                    {showError && (
                        <p className="mt-1 text-sm text-red-600 font-bold animate-pulse">
                            Please accept the medical disclaimer to generate your schedule.
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
                    View full Terms of Use / לצפייה בתנאי השימוש המלאים
                </Link>
            </div>
        </div>
      </div>
    </div>
  );
}
