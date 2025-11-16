// lib/medicationColors.ts
// מרכז צבעים לכל תרופה לפי ה־id שלה. אם ה־id אינו נמצא, מוחזר צבע ניטרלי.

export const MEDICATION_COLORS: Record<string, string> = {
  "sterodex": "#0ea5e9",        // blue – Sterodex
  "vigamox": "#a855f7",         // purple – Vigamox
  "dicloftil": "#f97316",       // orange – Dicloftil
  "systane-balance": "#22c55e", // green – Systane Balance
  "vitapos": "#eab308",         // yellow – Vitapos
};

/**
 * מחזיר צבע עבור תרופה לפי ה־id או לפי חלק מהשם. אם לא נמצא, מחזיר צבע ניטרלי.
 * @param name – שם התרופה (למשל "Sterodex (Dexamethasone)")
 * @param id – מזהה התרופה (למשל "sterodex")
 */
export function getMedicationColor(name: string, id?: string): string {
  if (id) {
    const key = id.toLowerCase();
    if (MEDICATION_COLORS[key]) {
      return MEDICATION_COLORS[key];
    }
  }
  const lower = name.toLowerCase();
  // התאמה חלקית אם אין id
  for (const key of Object.keys(MEDICATION_COLORS)) {
    if (lower.includes(key)) {
      return MEDICATION_COLORS[key];
    }
  }
  // צבע fallback אפור‑כחול
  return "#94a3b8";
}
