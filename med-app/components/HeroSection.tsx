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
      className="w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50/50 via-white to-white px-4 pt-20 pb-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 md:flex-row md:items-center md:justify-between">
        {/* Text + CTA – Right side on desktop (now first in DOM for natural flow) */}
        <div className="flex-1 flex flex-col items-center rtl:items-start md:items-start text-center rtl:text-start md:text-start">
          {/* Clinic Logo (if exists) */}
          <div className="flex flex-col items-center gap-3">
            {clinicId && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={brand.logoUrl}
                  alt={brand.name || "Clinic Logo"}
                  className="max-h-14 w-auto object-contain"
                  loading="eager"
                  onError={(e) => {
                    // Hide logo if it fails to load
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />

              </div>
            )}
          </div>

          <div className="mb-8 w-full">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight rtl:tracking-normal text-slate-900 mb-2">
              {t('title')}
            </h1>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-medium leading-snug text-slate-600">
              {t('subtitle')}
            </h2>
          </div>

          <p className="text-lg text-slate-500 mb-12 max-w-2xl font-normal leading-relaxed mx-auto md:mx-0">
            <span dangerouslySetInnerHTML={{ __html: t.raw('description') }} />
          </p>

          <ul className={cn(
            "flex flex-col gap-3 mb-10 items-start w-full max-w-md mx-auto md:mx-0 text-start"
          )}>
            {[t('feature1'), t('feature2'), t('feature3')].map((feature, i) => (
              <li key={i} className="flex items-center gap-2 text-slate-700 font-medium">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
                <span className="text-sm sm:text-base">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-center md:items-start gap-4 mt-2 w-full">
            <button
              type="button"
              onClick={handleScrollToWorkArea}
              className="
    inline-flex items-center justify-center rounded-full
    px-10 py-5 text-xl font-bold text-white rtl:tracking-normal
    shadow-xl shadow-sky-200 transition-all transform
    bg-sky-600 hover:bg-sky-700 hover:scale-[1.02] active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-offset-2
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

            <span className="block max-w-xs text-xs font-normal text-slate-400/80 mt-1 text-center rtl:text-start md:text-start">
              {t('medicalAdviceDisclaimer')}
            </span>
          </div>

          {/* Highlight Tags */}
          <div className="mt-2 flex flex-wrap justify-center rtl:justify-start md:justify-start gap-2 text-sm">

            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-800">
              {t('tagExport')}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-medium text-slate-800">
              {t('tagProtocol')}
            </span>
          </div>
        </div>

        {/* Example Card – Left side on desktop (now second in DOM) */}
        <div className="flex-1 flex justify-center md:justify-start">
          <div className="w-full max-w-sm rounded-3xl border border-sky-50 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t('sampleSchedule')}
                </p>
                <p className="text-sm font-medium text-slate-700">{t('day1PostOp')}</p>
              </div>
              <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">
                {t('postOpDay1')}
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

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {t('exampleDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

