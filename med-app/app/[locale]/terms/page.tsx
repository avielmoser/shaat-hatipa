import React from "react";
// import Link from "next/link"; // Remove standard next/link
import { Link } from "@/i18n/routing"; // Use localized Link
import { ArrowLeft } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export const metadata = {
    title: "Terms of Use | ShaatHaTipa",
    description: "Legal Disclaimer and Terms of Use for ShaatHaTipa application.",
};

export default function TermsPage() {
    const t = useTranslations("terms");
    const locale = useLocale();

    const sections = [1, 2, 3, 4, 5, 6];

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200">

                {/* Back Link */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-sky-600 transition-colors"
                    >
                        {locale === 'en' ? <ArrowLeft className="w-4 h-4 mr-1" /> : <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />}
                        {t("backToHome")}
                    </Link>
                </div>

                {/* Localized Section */}
                <div className="space-y-6 text-slate-900" dir={locale === 'he' ? 'rtl' : 'ltr'}>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl mb-6">
                        {t("title")}
                    </h1>

                    {sections.map((num) => (
                        <section key={num}>
                            <h2 className="text-lg font-bold mb-2">{t(`sections.${num}.title`)}</h2>
                            <p className="text-slate-700 leading-relaxed">
                                {t(`sections.${num}.content`)}
                            </p>
                        </section>
                    ))}
                </div>

                <div className="mt-12 text-center text-sm text-slate-400">
                    {t("lastUpdated")} {new Date().toLocaleDateString(locale === 'he' ? 'he-IL' : 'en-GB')}
                </div>

            </div>
        </div>
    );
}

