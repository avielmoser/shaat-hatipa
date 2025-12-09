// components/HeroSection.tsx
"use client";

import React from "react";
import { useTranslations, useLocale } from 'next-intl';
import { useClinicBrand } from "./ClinicBrandProvider";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export default function HeroSection() {
  const { brand, clinicId } = useClinicBrand();
  const t = useTranslations('Hero');
  const tClinics = useTranslations('Clinics');
  const locale = useLocale();
  const isRtl = locale === 'he';

  const handleScrollToWorkArea = () => {
    const section = document.getElementById("work-area");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50/50 via-white to-white px-4 pt-12 pb-16 sm:pt-20 sm:pb-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:gap-12 md:flex-row md:items-center md:justify-between">
        {/* Text + CTA – Right side on desktop (now first in DOM for natural flow) */}
        <div className="flex-1 flex flex-col items-center md:items-start text-center rtl:text-start md:text-start">
          {/* Clinic Logo (if exists) */}
          <div className="flex flex-col items-center gap-3">
            {clinicId && (
              <div className="flex flex-col items-center gap-2">
                {brand.logoUrl ? (
                  <img
                    src={brand.logoUrl}
                    alt={tClinics(brand.id)}
                    className="max-h-14 w-auto object-contain"
                    loading="eager"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = "none";
                    }}
                  />
                ) : null}
                {clinicId !== "default" && (
                  <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                    {isRtl ? `מופעל עבור ${tClinics(brand.id)}` : `Powered for ${tClinics(brand.id)}`}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mb-6 sm:mb-8 w-full">
            <h1 className={cn(
              "font-bold leading-tight tracking-tight rtl:tracking-normal text-slate-900 mb-3 sm:mb-4 max-w-lg mx-auto md:mx-0",
              isRtl ? "text-2xl sm:text-4xl lg:text-5xl" : "text-3xl sm:text-4xl lg:text-5xl"
            )}>
              {t('title')}
            </h1>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-medium leading-normal text-slate-600 max-w-lg mx-auto md:mx-0 text-balance">
              {t('subtitle')}
            </h2>
          </div>

          <p className="text-base sm:text-lg text-slate-500 mb-8 sm:mb-10 max-w-xl font-normal leading-relaxed mx-auto md:mx-0 px-2 sm:px-0">
            <span dangerouslySetInnerHTML={{ __html: t.raw('description') }} />
          </p>

          <ul className={cn(
            "flex flex-col gap-4 mb-8 sm:mb-10 items-start w-full max-w-md mx-auto md:mx-0 text-start"
          )}>
            {[t('feature1'), t('feature2'), t('feature3')].map((feature, i) => (
              <li key={i} className={cn(
                "flex items-center gap-3 text-slate-700 font-medium",
                isRtl ? "flex-row-reverse text-right justify-end w-full" : ""
              )}>
                <div className="flex h-6 w-6 sm:h-5 sm:w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                  <Check size={14} strokeWidth={3} className="sm:w-3 sm:h-3" />
                </div>
                <span className="text-sm sm:text-base leading-snug flex-1">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center md:items-start gap-4 mt-2 w-full">
            <button
              type="button"
              onClick={handleScrollToWorkArea}
              className="
    inline-flex items-center justify-center rounded-full
    h-14 sm:h-auto px-8 py-0 sm:px-10 sm:py-5 
    text-lg sm:text-xl font-bold text-white rtl:tracking-normal
    shadow-lg shadow-sky-200/80 transition-all transform
    bg-sky-600 hover:bg-sky-700 hover:scale-[1.02] active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-offset-2
    w-full max-w-xs sm:w-auto
  "
              style={
                clinicId
                  ? { backgroundColor: "var(--clinic-button)" } // Clinic color
                  : undefined // Tailwind default
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

              {t('startNow')}
            </button>

            <span className="block max-w-xs text-xs font-normal text-slate-400/80 mt-1 text-center rtl:text-start md:text-start mx-auto md:mx-0">
              {t('medicalAdviceDisclaimer')}
            </span>
          </div>
        </div>

        {/* Example Card – Left side on desktop (now second in DOM) */}
        {/* Example Card – Left side on desktop (now second in DOM) */}
        <div className="flex-1 flex justify-center md:justify-start w-full px-2 sm:px-0">
          <div className="w-full max-w-[340px] sm:max-w-sm rounded-3xl border border-sky-50 bg-white p-5 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.1)] sm:shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t('sampleSchedule')}
                </p>
                <p className="text-sm font-medium text-slate-700">{t('day1PostOp')}</p>
              </div>
              <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-xs sm:text-sm font-medium text-sky-800">
                {t('postOpDay1')}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                  <span className="font-medium text-slate-800">Vigamox</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 text-right w-12 sm:w-auto">
                  08:00
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="font-medium text-slate-800">Dicloftil</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 text-right w-12 sm:w-auto">
                  09:00
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="font-medium text-slate-800">Vitapos</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 text-right w-12 sm:w-auto">
                  09:15
                </span>
              </div>
            </div>

            <p className="mt-4 text-xs sm:text-sm leading-relaxed text-slate-500 text-center">
              {t('exampleDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

