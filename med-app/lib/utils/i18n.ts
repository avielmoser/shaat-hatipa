import { LocalizedString } from "../../types/prescription";

/**
 * Resolves a LocalizedString based on the provided locale.
 * Fallback to English if the specific locale is missing in the object.
 * If the value is a string, it is returned as is.
 */
export function resolveLocalizedString(value: LocalizedString | undefined | null, locale: string = 'he'): string {
    if (!value) return "";
    if (typeof value === 'string') return value;

    const safeLocale = (locale === 'he' || locale === 'en') ? locale : 'en';
    return value[safeLocale as 'he' | 'en'] || value.en || "";
}
