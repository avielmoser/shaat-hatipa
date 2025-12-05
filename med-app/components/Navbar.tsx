"use client";

import React from "react";
import { useTranslations } from 'next-intl';
import LanguageSwitcher from "./LanguageSwitcher";

export default function Navbar() {
  const t = useTranslations('Navbar');

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold tracking-tight text-slate-900">
            {t('title')}
          </span>

        </div>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
        </div>
      </div>

      {/* Mobile Disclaimer Strip */}
      <div className="bg-amber-50 px-4 py-1.5 text-center text-[10px] font-medium text-amber-800 sm:hidden">
        {t('disclaimer')}
      </div>
    </header>
  );
}
