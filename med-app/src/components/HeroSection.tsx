// components/HeroSection.tsx
"use client";

import React, { useEffect } from "react";
import { useTranslations, useLocale } from 'next-intl';
import type { ClinicConfig } from "../config/clinics";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface HeroSectionProps {
  clinicConfig?: ClinicConfig | null;
}

export default function HeroSection({ clinicConfig }: HeroSectionProps) {
  const t = useTranslations('Hero');
  // We still use these for fallbacks or common strings
  const tClinics = useTranslations('Clinics');
  const locale = useLocale() as 'he' | 'en';
  const isRtl = locale === 'he';

  const brand = clinicConfig || {
    id: 'default',
    name: 'ShaatHaTipa',
    logoUrl: '/logo.png',
    // ... minimal fallback if needed, but page.tsx usually passes a full default object
    copy: null,
    colors: null
  };

  // Sync colors if config is present (Client-side override)
  useEffect(() => {
    if (clinicConfig?.colors) {
      const root = document.documentElement;
      root.style.setProperty("--clinic-primary", clinicConfig.colors.primary);
      root.style.setProperty("--clinic-secondary", clinicConfig.colors.secondary);
      root.style.setProperty("--clinic-button", clinicConfig.colors.button);
    }
  }, [clinicConfig]);

  const handleScrollToWorkArea = () => {
    const section = document.getElementById("work-area");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Resolve strings: Clinic Specific -> Translation Key Fallback
  const heroTitle = clinicConfig?.copy?.[locale]?.heroTitle || t('title');
  const heroSubtitle = clinicConfig?.copy?.[locale]?.heroSubtitle || t('subtitle');

  // Clinic Label Logic
  let clinicLabel = "";
  if (clinicConfig?.id === 'ein-tal') {
    clinicLabel = isRtl ? "מותאם למטופלי עין טל" : "Tailored for Ein Tal patients";
  } else {
    // Generic / Default
    clinicLabel = isRtl ? "מותאם לפרוטוקול הקליניקה שלך" : "Tailored to your clinic’s protocol";
  }

  return (
    <section
      className="w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50/50 via-white to-white px-4 pt-4 pb-8 sm:pt-20 sm:pb-24 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:gap-12 md:flex-row md:items-center md:justify-between">
        {/* Text + CTA – Right side on desktop (now first in DOM for natural flow) */}
        <div className="flex-1 flex flex-col items-start text-start">
          {/* Clinic Logo (if exists) */}
          <div className="flex flex-col items-start gap-3 w-full">
            {/* Always show the label, maybe with logo if available */}
            <div className="flex flex-col items-start gap-2">
              {clinicConfig && clinicConfig.logoUrl && clinicConfig.id !== 'default' ? (
                <img
                  src={clinicConfig.logoUrl}
                  alt={clinicConfig.name}
                  className="max-h-12 sm:max-h-14 w-auto object-contain"
                  loading="eager"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : null}
              <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {clinicLabel}
              </span>
            </div>
          </div>

          <div className="mb-4 sm:mb-8 w-full mt-4 sm:mt-6">
            <h1 className={cn(
              "font-extrabold leading-tight tracking-tight rtl:tracking-normal text-slate-900 mb-2 sm:mb-4 max-w-lg",
              "text-3xl sm:text-4xl lg:text-5xl"
            )}>
              {heroTitle}
            </h1>
            <h2 className="text-lg sm:text-2xl lg:text-3xl font-medium leading-snug text-slate-600 max-w-lg text-balance">
              {heroSubtitle}
            </h2>
          </div>

          {/* Description hidden on mobile to save space if needed? Prompt said 'Reduce vertical margins', keep content readable but compact. 
              I'll keep it but ensure margins are small. */}
          <p className="text-sm sm:text-lg text-slate-500 mb-6 sm:mb-10 max-w-xl font-normal leading-relaxed px-1 sm:px-0">
            <span dangerouslySetInnerHTML={{ __html: t.raw('description') }} />
          </p>

          <ul className={cn(
            "flex flex-col gap-3 sm:gap-4 mb-6 sm:mb-10 items-start w-full max-w-md text-start"
          )}>
            {[t('feature1'), t('feature2'), t('feature3')].map((feature, i) => (
              <li key={i} className={cn(
                "flex items-center gap-2 sm:gap-3 text-slate-700 font-medium",
                isRtl ? "flex-row-reverse text-right justify-end w-full" : ""
              )}>
                <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                  <Check size={14} strokeWidth={3} className="sm:w-3 sm:h-3" />
                </div>
                <span className="text-sm sm:text-base leading-snug flex-1">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-col items-start gap-4 mt-2 w-full">
            <button
              type="button"
              onClick={handleScrollToWorkArea}
              className="
    inline-flex items-center justify-center rounded-full
    h-12 sm:h-auto px-8 py-0 sm:px-10 sm:py-5 
    text-lg sm:text-xl font-bold text-white rtl:tracking-normal
    shadow-lg shadow-sky-200/80 transition-all transform
    bg-sky-600 hover:bg-sky-700 hover:scale-[1.02] active:scale-[0.98]
    focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-offset-2
    w-full max-w-xs sm:w-auto
  "
              style={
                clinicConfig && clinicConfig.id !== 'default'
                  ? { backgroundColor: "var(--clinic-button)" } // Clinic color
                  : undefined // Tailwind default
              }
              onMouseEnter={(e) => {
                if (!clinicConfig || clinicConfig.id === 'default') return;
                (e.currentTarget as HTMLButtonElement).style.filter = "brightness(0.95)";
              }}
              onMouseLeave={(e) => {
                if (!clinicConfig || clinicConfig.id === 'default') return;
                (e.currentTarget as HTMLButtonElement).style.filter = "none";
              }}
            >
              {t('startNow')}
            </button>

            <span className="block max-w-xs text-[10px] sm:text-xs font-normal text-slate-400/80 mt-1 text-start">
              {t('medicalAdviceDisclaimer')}
            </span>
          </div>
        </div>

        {/* Example Card – Downgraded on mobile (HIDDEN to focus on CTA) */}
        <div className="hidden sm:flex sm:flex-1 sm:justify-start w-full px-2 sm:px-0 mt-8 sm:mt-0">
          <div className="w-full max-w-[320px] sm:max-w-sm rounded-3xl border border-sky-50 bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.1)] sm:shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {t('sampleSchedule')}
                </p>
                <p className="text-xs sm:text-sm font-medium text-slate-700">{t('day1PostOp')}</p>
              </div>
              <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-sm font-medium text-sky-800">
                {t('postOpDay1')}
              </span>
            </div>

            <div className="space-y-2 sm:space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-xl sm:rounded-2xl bg-slate-50 px-3 py-2 sm:px-4 sm:py-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-pink-500" />
                  <span className="font-medium text-slate-800 text-xs sm:text-base">Vigamox</span>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right w-10 sm:w-auto">
                  08:00
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl sm:rounded-2xl bg-slate-50 px-3 py-2 sm:px-4 sm:py-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-purple-500" />
                  <span className="font-medium text-slate-800 text-xs sm:text-base">Dicloftil</span>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right w-10 sm:w-auto">
                  09:00
                </span>
              </div>
              <div className="flex items-center justify-between rounded-xl sm:rounded-2xl bg-slate-50 px-3 py-2 sm:px-4 sm:py-3">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-amber-400" />
                  <span className="font-medium text-slate-800 text-xs sm:text-base">Vitapos</span>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 text-right w-10 sm:w-auto">
                  09:15
                </span>
              </div>
            </div>

            <p className="mt-3 sm:mt-4 text-[10px] sm:text-sm leading-relaxed text-slate-500 text-start">
              {t('exampleDisclaimer')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

