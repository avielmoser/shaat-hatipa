// components/HeroSection.tsx
"use client";

import React from "react";
import { useClinicBrand } from "./ClinicBrandProvider";

export default function HeroSection() {
  const { brand, clinicId } = useClinicBrand();

  const handleScrollToWorkArea = () => {
    const section = document.getElementById("work-area");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      dir="rtl"
      className="w-full bg-gradient-to-b from-sky-50 to-white px-4 pt-16 pb-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 md:flex-row md:items-center md:justify-between">
        {/* כרטיס דוגמה – בצד שמאל בדסקטופ */}
        <div className="flex-1 flex justify-center md:justify-start order-2 md:order-1">
          <div className="w-full max-w-sm rounded-3xl border border-sky-50 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  דוגמה ללוח זמנים יומי
                </p>
                <p className="text-xs text-slate-500">יום 1 לאחר הניתוח</p>
              </div>
              <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs font-medium text-sky-700">
                יום אחרי ניתוח
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                  <span className="font-medium text-slate-800">Vigamox</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  08:00
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="font-medium text-slate-800">Dicloftil</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  09:00
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="font-medium text-slate-800">Vitapos</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  09:15
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-slate-500">
              זו רק דוגמה. המערכת תתאם עבורך את הטיפות לאורך שעות הערות שלך,
              לפי הפרוטוקול הרפואי המתאים.
            </p>
          </div>
        </div>

        {/* טקסט + CTA – בצד ימין בדסקטופ */}
        <div className="flex-1 flex flex-col items-center space-y-6 text-center">
         {/* לוגו מרפאה (אם יש) + תגית */}
<div className="flex flex-col items-center gap-3">
  {clinicId && (
    <div className="flex flex-col items-center gap-2">
      <img
        src={brand.logoUrl}
        alt=""
        className="max-h-14 w-auto object-contain"
        loading="eager"
        onError={(e) => {
          // אם הלוגו לא נטען – מסתירים אותו לגמרי (בלי alt שחוזר)
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
     
    </div>
  )}

  <span
    className="inline-flex items-center rounded-full px-4 py-1 text-xs font-medium"
    style={{
      backgroundColor: clinicId ? "var(--clinic-secondary)" : undefined,
      color: clinicId ? "var(--clinic-primary)" : undefined,
    }}
  >
    כל הטיפות שלך במקום אחד מסודר
  </span>
</div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] xl:text-[2.8rem] font-bold leading-snug tracking-tight text-slate-900">

            לוח זמנים אישי לטיפות
            <br />
            עיניים אחרי ניתוח לייזר
          </h1>

          <p className="mx-auto max-w-md md:mx-0 text-base sm:text-lg leading-relaxed text-slate-600">
            המערכת יוצרת עבורך לוח זמנים רפואי מדויק ומובנה, בהתאם לסוג
            הניתוח שביצעת ולשעות הערות האישיות שלך.
          </p>

          <div className="flex flex-col items-center gap-3">
            <button
  type="button"
  onClick={handleScrollToWorkArea}
  className="
    inline-flex items-center justify-center rounded-full
    px-6 py-3 text-base font-semibold text-white
    shadow-md transition
    bg-sky-600 hover:bg-sky-700
    focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2
  "
  style={
    clinicId
      ? { backgroundColor: "var(--clinic-button)" } // צבע מרפאה
      : undefined // נשאר הדיפולט של Tailwind
  }
  onMouseEnter={(e) => {
    if (!clinicId) return;
    (e.currentTarget as HTMLButtonElement).style.filter = "brightness(0.95)";
  }}
  onMouseLeave={(e) => {
    if (!clinicId) return;
    (e.currentTarget as HTMLButtonElement).style.filter = "none";
  }}
>

              התחל בבניית לוח זמנים אישי
            </button>

            <span className="max-w-xs text-xs text-slate-500">
              כלי עזר לניהול לוח זמנים. אין לראות במידע המוצג תחליף לייעוץ
              רפואי.
            </span>
          </div>

          {/* תגיות הדגשה */}
          <div className="mt-2 flex flex-wrap justify-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
              מותאם ל-INTERLASIK / PRK
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-700">
              ייצוא ליומן ו-PDF
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-medium text-slate-700">
              הפרוטוקול מחושב לפי שעות הערות האישיות שלך
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
