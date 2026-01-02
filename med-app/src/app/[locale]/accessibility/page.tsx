import React from "react";
import { Link } from "@/i18n/routing";
import { ArrowLeft } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";

export const metadata = {
    title: "Accessibility Statement | ShaatHaTipa",
    description: "Accessibility Statement for ShaatHaTipa application.",
};

export default function AccessibilityPage() {
    const t = useTranslations("accessibility");
    const common = useTranslations("terms"); // for backToHome if needed
    const locale = useLocale();
    const isRtl = locale === "he";

    return (
        <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                {/* Back Link */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-sky-600 transition-colors"
                    >
                        {isRtl ? (
                            <ArrowLeft className="w-4 h-4 ml-1 rotate-180" />
                        ) : (
                            <ArrowLeft className="w-4 h-4 mr-1" />
                        )}
                        {common("backToHome")}
                    </Link>
                </div>

                <div className="space-y-8 text-slate-900" dir={isRtl ? "rtl" : "ltr"}>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                        {t("title")}
                    </h1>

                    <div className="prose prose-slate max-w-none">
                        <p className="text-lg leading-relaxed">{t("statement")}</p>

                        <h2 className="text-xl font-bold mt-8 mb-4">{t("standards")}</h2>

                        <h3 className="text-lg font-semibold mt-6 mb-2">{isRtl ? "אמצעים שננקטו" : "Measures Taken"}</h3>
                        <p className="leading-relaxed">{t("measures")}</p>

                        <h3 className="text-lg font-semibold mt-6 mb-2">{isRtl ? "משוב וצור קשר" : "Feedback & Contact"}</h3>
                        <p className="leading-relaxed">{t("feedback")}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
