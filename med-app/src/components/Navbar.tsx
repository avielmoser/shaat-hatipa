"use client";

import React from "react";
import { useTranslations } from 'next-intl';
import LanguageSwitcher from "./LanguageSwitcher";

import { useClinicBrand } from "./ClinicBrandProvider";

export default function Navbar() {
  const t = useTranslations('Navbar');
  const tLayout = useTranslations('layout');
  const tClinics = useTranslations('Clinics');
  const { brand } = useClinicBrand();

  return (
    <header className="relative lg:sticky lg:top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {brand.logoUrl && brand.id !== 'default' && (
            <img
              src={brand.logoUrl}
              alt={tClinics(brand.id)}
              className="h-8 w-auto object-contain ltr:mr-2 rtl:ml-2"
            />
          )}
          <span className="text-xl font-bold tracking-tight text-slate-900">
            {t('title')}
          </span>

        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Trial Banner */}
      <div className="bg-[#FFF9E5] px-4 py-1.5 flex items-center justify-center text-center text-[11px] sm:text-xs font-medium text-[#374151]">
        {tLayout('trialBanner')}
      </div>
    </header>
  );
}
