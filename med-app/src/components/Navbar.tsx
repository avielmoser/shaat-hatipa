"use client";

import React, { useState } from "react";
import { useTranslations } from 'next-intl';
import LanguageSwitcher from "./LanguageSwitcher";
import { Building2 } from "lucide-react";

import { useClinicBrand } from "./ClinicBrandProvider";

export default function Navbar() {
  const t = useTranslations('Navbar');
  const tLayout = useTranslations('layout');
  const tClinics = useTranslations('Clinics');
  const tCommon = useTranslations('common');
  const { brand } = useClinicBrand();
  const [imgError, setImgError] = useState(false);

  return (
    <header className="relative lg:sticky lg:top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          {brand.id !== 'default' && (
            <div className="flex items-center justify-center h-8 w-auto min-w-[2rem] me-2">
              {!imgError && brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={tCommon('clinic_logo_alt', { name: brand.name })}
                  className="h-full w-auto object-contain"
                  onError={() => setImgError(true)}
                  loading="eager"
                  // @ts-ignore - fetchPriority is valid in modern browsers but styled-jsx or older React types might complain
                  fetchPriority="high"
                />
              ) : (
                <Building2 className="h-6 w-6 text-slate-400" aria-label={tClinics(brand.id)} />
              )}
            </div>
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
