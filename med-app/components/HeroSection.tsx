// components/HeroSection.tsx
"use client";

import React from "react";

export default function HeroSection() {
  const handleScrollToWorkArea = () => {
    const section = document.getElementById("work-area");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="px-4 pt-16 pb-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl flex flex-col md:flex-row md:items-center md:justify-between gap-12">
        {/* Left column: headline and CTA */}
        <div className="flex-1 space-y-6 text-center md:text-right">
          {/* Small tag line */}
          <div className="flex justify-center md:justify-start">
            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-4 py-1 text-xs font-medium text-sky-700">
               כל הטיפות שלך במקום אחד מסודר
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
            לוח טיפות חכם אחרי ניתוח לייזר
          </h1>
          <p className="max-w-md mx-auto md:mx-0 text-base sm:text-lg leading-relaxed text-slate-600">
            ההמערכת יוצרת עבורך לוח זמנים רפואי מדויק ומובנה, בהתאם לסוג הניתוח שביצעת
          </p>
          <div className="flex flex-col sm:flex-row items-center md:items-start md:justify-start gap-4">
            <button
              type="button"
              onClick={handleScrollToWorkArea}
              className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-6 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/30 transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2"
            >
              התחל כאן
            </button>
            <span className="text-sm text-slate-500">
              כלי עזר לניהול לוח זמנים. אין לראות במידע המוצג תחליף לייעוץ
            רפואי. 
            </span>
          </div>
          {/* Highlight tags */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs mt-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              מותאם ל‑INTERLASIK / PRK
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-700">
              ייצוא ליומן ו‑PDF
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-medium text-slate-700">
              הפרוטוקול מותאם ומחושב בהתאם לשעות הערות האישיות שלך
            </span>
          </div>
        </div>
        {/* Right column: sample schedule card */}
        <div className="flex-1 flex justify-center md:justify-end">
          <div className="w-full max-w-sm rounded-3xl border border-slate-200/70 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.10)]">
            <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
              <span>דוגמת לוח זמנים</span>
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700 border border-sky-100">
                יום אחרי ניתוח
              </span>
            </div>
            {/* Example rows */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                  08:00
                </span>
                <span className="font-semibold text-sky-800">Sterodex</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-purple-50 px-3 py-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                  12:00
                </span>
                <span className="font-semibold text-purple-700">Vigamox</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-800">
                  16:00
                </span>
                <span className="font-semibold text-emerald-700">
                  Systane Balance
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              זו רק דוגמה. המערכת תתאם עבורך את הטיפות לאורך שעות הערות שלך,
              לפי הפרוטוקול המתאים.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
