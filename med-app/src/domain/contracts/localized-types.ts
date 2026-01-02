/**
 * Support for bilingual content (Hebrew/English).
 * If a string is provided, it is treated as a single-language value.
 * If an object { he, en } is provided, the correct value is picked based on locale.
 */
export type LocalizedString = string | { he: string; en: string };

/**
 * Valid application locales.
 */
export type Locale = "he" | "en";

export const DEFAULT_LOCALE: Locale = "he";
