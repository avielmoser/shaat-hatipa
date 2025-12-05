"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "../i18n/navigation";
import { useTransition } from "react";

export default function LanguageSwitcher() {
    const t = useTranslations("Navbar");
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();

    const switchLanguage = (nextLocale: "en" | "he") => {
        if (locale === nextLocale) return;
        startTransition(() => {
            router.replace(pathname, { locale: nextLocale });
        });
    };

    return (
        <div className="relative inline-flex h-9 items-center rounded-full bg-slate-100 p-1" role="group" aria-label={t('languageSwitcherLabel')}>
            <button
                onClick={() => switchLanguage("en")}
                disabled={isPending}
                className={`relative z-10 flex h-full items-center rounded-full px-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 ${locale === "en"
                    ? "bg-white text-sky-700 shadow-sm ring-1 ring-black/5"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                aria-label="Switch to English"
                aria-pressed={locale === "en"}
            >
                EN
            </button>
            <button
                onClick={() => switchLanguage("he")}
                disabled={isPending}
                className={`relative z-10 flex h-full items-center rounded-full px-3 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-1 ${locale === "he"
                    ? "bg-white text-sky-700 shadow-sm ring-1 ring-black/5"
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
                    }`}
                aria-label="החלף לעברית"
                aria-pressed={locale === "he"}
            >
                עברית
            </button>
        </div>
    );
}
