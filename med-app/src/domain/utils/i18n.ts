import { LocalizedString, Locale, DEFAULT_LOCALE } from "@/domain/contracts/localized-types";

/**
 * Resolves a LocalizedString based on the provided locale.
 * Fallback to English if the specific locale is missing in the object.
 * If the value is a string, it is returned as is.
 */
export function resolveLocalizedString(value: LocalizedString | undefined | null, locale: string = DEFAULT_LOCALE): string {
    if (!value) return "";
    if (typeof value === 'string') return value;

    const safeLocale: Locale = (locale === 'he' || locale === 'en') ? (locale as Locale) : 'en';
    return value[safeLocale] || value.en || "";
}
