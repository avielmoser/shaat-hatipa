// components/HeroSection.tsx
"use client";

import React, { useEffect } from "react";
import { useTranslations, useLocale } from 'next-intl';
import type { ClinicConfig } from "../config/clinics";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
      className="w-full bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-50/50 via-white to-white px-4 pt-4 pb-8 shadow-[inset_0_-1px_0_0_rgb(226_232_240/0.9)] sm:pt-20 sm:pb-24 sm:px-6 sm:shadow-none lg:px-8"
    >
      <div className="mx-auto flex w-full min-w-0 max-w-6xl flex-col gap-5 sm:gap-12 md:flex-row md:items-center md:justify-between">
        {/* Text + CTA – Right side on desktop (now first in DOM for natural flow) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex w-full min-w-0 flex-1 flex-col items-stretch text-start sm:items-start"
        >
          {/* Clinic Logo (if exists) */}
          <div className="flex w-full min-w-0 flex-col items-start gap-2 sm:gap-3">
            {/* Always show the label, maybe with logo if available */}
            <div className="flex flex-col items-start gap-1.5 sm:gap-2">
              {clinicConfig && clinicConfig.logoUrl && clinicConfig.id !== 'default' ? (
                <img
                  src={clinicConfig.logoUrl}
                  alt={clinicConfig.name}
                  className="max-h-10 sm:max-h-14 w-auto object-contain"
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

          <div className="mt-3 w-full min-w-0 sm:mb-8 sm:mt-6">
            <h1 className={cn(
              "mb-1.5 max-w-lg font-extrabold leading-tight tracking-tight text-slate-900 rtl:tracking-normal sm:mb-4",
              "text-2xl sm:text-4xl lg:text-5xl"
            )}>
              {heroTitle}
            </h1>
            <h2 className="max-w-lg text-pretty text-base font-medium leading-snug text-slate-600 sm:text-2xl lg:text-3xl">
              {heroSubtitle}
            </h2>
          </div>

          <p className="mt-2.5 max-w-xl text-sm font-normal leading-snug text-slate-500 sm:mb-10 sm:mt-0 sm:text-lg sm:leading-relaxed">
            <span dangerouslySetInnerHTML={{ __html: t.raw('description') }} />
          </p>

          <ul className={cn(
            "mt-3 flex w-full max-w-md flex-col items-start gap-2 text-start sm:mb-10 sm:mt-0 sm:gap-4"
          )}>
            {[t('feature1'), t('feature2'), t('feature3')].map((feature, i) => (
              <li key={i} className={cn(
                "flex items-center gap-2 sm:gap-3 text-slate-700 font-medium",
                isRtl ? "flex-row-reverse text-start justify-end w-full" : ""
              )}>
                <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 shrink-0">
                  <Check size={14} strokeWidth={3} className="sm:w-3 sm:h-3" />
                </div>
                <span className="text-sm sm:text-base leading-snug flex-1">{feature}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex w-full min-w-0 flex-col items-center gap-2 sm:mt-1 sm:items-start sm:gap-4">
            <button
              type="button"
              onClick={handleScrollToWorkArea}
              className="
                inline-flex h-12 w-full max-w-xs transform items-center justify-center rounded-full
                bg-sky-600 px-8 py-0 text-lg font-bold text-white shadow-lg shadow-sky-200/80
                transition-all hover:scale-[1.02] hover:bg-sky-700
                active:scale-[0.98] focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-offset-2
                rtl:tracking-normal sm:h-auto sm:w-auto sm:px-10 sm:py-5 sm:text-xl
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

            <span className="block max-w-xs text-pretty text-center text-xs font-normal text-slate-400/80 sm:mt-1 sm:text-start">
              {t('medicalAdviceDisclaimer')}
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="hidden sm:flex sm:flex-1 sm:justify-start w-full px-2 sm:px-0 mt-8 sm:mt-0"
        >
          <div className="w-full max-w-[320px] sm:max-w-sm rounded-3xl border border-sky-50 bg-white p-4 sm:p-6 shadow-[0_12px_30px_rgba(15,23,42,0.1)] sm:shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <div className="mb-3 sm:mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-900">
                  {t('sampleSchedule')}
                </p>
                <p className="text-xs sm:text-sm font-medium text-slate-700">{t('day1PostOp')}</p>
              </div>
              <span className="rounded-full border border-sky-100 bg-sky-50 px-2 py-0.5 sm:px-3 sm:py-1 text-xs sm:text-sm font-medium text-sky-800">
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

            <p className="mt-3 sm:mt-4 text-xs sm:text-sm leading-relaxed text-slate-500 text-start">
              {t('exampleDisclaimer')}
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

