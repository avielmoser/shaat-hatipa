"use client";

import React from "react";
import { useTranslations } from 'next-intl';

export default function FaqSection() {
  const t = useTranslations('FAQ');
  const faqs = [
    {
      q: t('items.1.q'),
      a: t('items.1.a'),
    },
    {
      q: t('items.2.q'),
      a: t('items.2.a'),
    },
    {
      q: t('items.3.q'),
      a: t('items.3.a'),
    },
  ];

  return (
    <section className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 space-y-3">
      <h2 className="text-xl font-semibold text-slate-800">
        {t('title')}
      </h2>
      <div className="space-y-2">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2 text-sm"
          >
            <summary className="cursor-pointer font-semibold text-slate-800">
              {item.q}
            </summary>
            <p className="mt-1 text-slate-600 text-xs">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

