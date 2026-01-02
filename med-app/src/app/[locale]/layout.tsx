import type { Metadata } from "next";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import "../globals.css";
import { ClinicBrandProvider } from "../../components/ClinicBrandProvider";
import Navbar from "../../components/Navbar";
import AccessibilityWidget from "../../components/accessibility/AccessibilityWidget";

export const metadata: Metadata = {
    title: "ShaatHaTipa",
    description: "Personal eye drop schedule generator after laser surgery",
};

export default async function LocaleLayout({
    children,
    params
}: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}) {
    const { locale } = await params;
    // Ensure that the incoming `locale` is valid
    if (!routing.locales.includes(locale as any)) {
        notFound();
    }

    // Providing all messages to the client
    // side is the easiest way to get started
    const messages = await getMessages();

    // Set direction based on locale
    const dir = locale === 'he' ? 'rtl' : 'ltr';

    return (
        <html lang={locale} dir={dir}>
            <body className="min-h-screen bg-slate-50 text-slate-900 antialiased relative overflow-x-hidden font-sans">
                <NextIntlClientProvider messages={messages}>
                    <ClinicBrandProvider>
                        <Navbar />
                        {children}
                    </ClinicBrandProvider>
                </NextIntlClientProvider>
                <AccessibilityWidget />
            </body>
        </html >
    );
}
