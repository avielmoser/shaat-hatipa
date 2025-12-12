// lib/medicationColors.ts
// מרכז צבעים לכל תרופה לפי מזהה קבוע. אם אין התאמה, מוחזר צבע ניטרלי.

export const MEDICATION_COLORS: Record<string, string> = {
  sterodex: "#0ea5e9",        // blue – Sterodex
  vigamox: "#a855f7",         // purple – Vigamox
  dicloftil: "#f97316",       // orange – Dicloftil
  "systane-balance": "#22c55e", // green – Systane Balance
  vitapos: "#eab308",         // yellow – Vitapos
};

/**
 * מחזיר צבע עבור תרופה לפי ה־id או לפי השם.
 * עושה נרמול פשוט (מוריד רווחים, מקפים וסוגריים) כדי למנוע הבדלים בין
 * "Systane Balance" ל-"systane-balance" וכדומה.
 *
 * @param name – שם התרופה (למשל "Systane Balance" או "Vigamox (Moxifloxacin 0.5%)")
 * @param id – מזהה התרופה אם יש (למשל "systane-balance", "sterodex")
 */
export function getMedicationColor(name: string, id?: string): string {
  // קודם נסה לפי id כפי שהוא (מתאים ל־medication.id ה"קנוני")
  if (id) {
    const key = id.toLowerCase();
    if (MEDICATION_COLORS[key]) {
      return MEDICATION_COLORS[key];
    }
  }

  // פונקציה לעקביות: מורידה רווחים, מקפים, וסוגריים
  const normalize = (value: string) =>
    value.toLowerCase().replace(/[\s\-()]/g, "");

  const normalizedName = normalize(name);

  // אם אין התאמה לפי id – מנסים לפי השם (מנורמל)
  for (const [key, color] of Object.entries(MEDICATION_COLORS)) {
    const normalizedKey = normalize(key);
    if (normalizedName.includes(normalizedKey)) {
      return color;
    }
  }

  // צבע fallback אפור-כחול
  return "#94a3b8";
}
