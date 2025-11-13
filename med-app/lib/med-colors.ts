// lib/med-colors.ts

// צבעי ברירת מחדל לכל תרופה
// אחיד בכל המערכת – Prescription, Schedule, Forms ועוד.

export const MEDICATION_COLORS: Record<string, string> = {
  "sterodex": "#0284c7", // כחול
  "sterodex (dexamethasone)": "#0284c7",

  "vigamox": "#a855f7", // סגול
  "vigamox (moxifloxacin 0.5%)": "#a855f7",

  "systane balance": "#16a34a", // ירוק

  "dicloftil": "#f97316", // כתום
  "dicloftil 0.1%": "#f97316",

  "vitapos": "#f97373", // ורוד-אדמדם
  "vitapos (eye ointment)": "#f97373",
};

// פונקציה שמחזירה צבע לפי שם/ID של תרופה
export function getMedicationColor(name: string, id?: string): string | undefined {
  const keyId = id?.toLowerCase() ?? "";
  const keyName = name.toLowerCase();

  // עדיפות ל־ID אם קיים
  if (keyId && MEDICATION_COLORS[keyId]) return MEDICATION_COLORS[keyId];
  if (MEDICATION_COLORS[keyName]) return MEDICATION_COLORS[keyName];

  return undefined;
}
