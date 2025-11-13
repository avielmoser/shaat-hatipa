// app/components/HeroSection.tsx
"use client";

export default function HeroSection() {
  const handleScrollToWorkArea = () => {
    const section = document.getElementById("work-area");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="px-3 pt-6 pb-4 sm:px-4 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* טוקטק עליון קטן */}
        <div className="mb-3 flex justify-center md:justify-start">
          <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-medium text-sky-700">
            אחרי ניתוח לייזר? כל הטיפות שלך במקום אחד מסודר
          </span>
        </div>

        {/* אזור ראשי – שתי עמודות בדסקטופ, טור אחד במובייל */}
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          {/* צד טקסט / CTA */}
          <div className="md:max-w-md text-center md:text-right space-y-4">
            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
              לוח טיפות חכם אחרי ניתוח לייזר
            </h1>

            <p className="text-[13px] sm:text-sm leading-relaxed text-slate-600">
              הזן פעם אחת את סוג הניתוח{" "}
              <span className="font-semibold">INTERLASIK / PRK</span>, תאריך
              הניתוח ושעות הערות שלך – והמערכת תחשב עבורך אוטומטית לוח טיפות
              יומי מסודר לפי ה־פרוטוקול הרפואי, עם אפשרות {" "}
              <span className="font-semibold">הוספה ליומן</span> ו־<span className="font-semibold">  ייצוא ל- PDF</span>.
            </p>

            {/* כפתורי פעולה */}
            <div className="flex flex-col items-center justify-center gap-2 sm:flex-row sm:justify-start">
              <button 
                type="button"
                onClick={handleScrollToWorkArea}
                className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-sky-500/30 hover:bg-sky-700 transition"
              >
                התחל כאן
              </button>

              <span className="text-[11px] text-slate-500">
                שימוש אישי בלבד – לא מחליף רופא
              </span>
            </div>

            {/* תגיות מידע קצרות */}
            <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] md:justify-start">
              <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-700">
                מותאם ל־INTERLASIK / PRK
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-sky-700">
                ייצוא ליומן ו- PDF
              </span>
              <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1 text-slate-700">
                פרוטוקול מחושב לפי שעות הערות שלך
              </span>
            </div>
          </div>

          {/* כרטיס דוגמא – ממלא יפה את הצד השני בדסקטופ */}
          <div className="mx-auto w-full max-w-sm md:max-w-xs">
            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
              <div className="mb-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>דוגמת לוח זמנים</span>
                <span className="rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-medium text-sky-700">
                  יום אחרי ניתוח
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-sky-50 px-3 py-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-800">
                    08:00
                  </span>
                  <span className="text-sky-800 font-medium">Sterodex</span>
                  <span className="text-[11px] text-slate-500">
                    טיפות סטרואידים
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-fuchsia-50 px-3 py-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-800">
                    12:00
                  </span>
                  <span className="text-fuchsia-700 font-medium">Vigamox</span>
                  <span className="text-[11px] text-slate-500">
                    טיפות אנטיביוטיקה
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2">
                  <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-800">
                    16:00
                  </span>
                  <span className="text-emerald-700 font-medium">
                    Systane Balance
                  </span>
                  <span className="text-[11px] text-slate-500">
                    דמעות מלאכותיות
                  </span>
                </div>
              </div>

              <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                המערכת מחלקת את הטיפות לאורך שעות הערות שלך, לפי הפרוטוקול
                הרפואי שנבחר – כדי שלא תפספס אף מנה חשובה.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
