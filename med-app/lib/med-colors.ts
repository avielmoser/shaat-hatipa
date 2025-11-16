// app/lib/med-colors.ts
//
// Provide a deterministic mapping of medication names to accessible colors.  We avoid
// reds and pinks for non‑error states to ensure the UI remains calm and
// professional.  Colors are chosen from the Tailwind palette with sufficient
// contrast and differentiation.

/**
 * Map a medication name or identifier to a hex color.  This helper ensures
 * consistent color assignment across the application.  If a name is not
 * explicitly mapped, a color is chosen based on a hash of the name.
 */
export function getMedicationColor(name: string, id?: string): string {
  // Explicit mappings for known medications.  Add more as needed.
  const explicit: Record<string, string> = {
    Sterodex: "#0ea5e9", // sky-500
    Vigamox: "#a855f7", // purple-500
    "Systane Balance": "#22c55e", // green-500
    Dicloftil: "#f97316", // orange-500
    Vitapos: "#eab308", // yellow-500
  };
  if (name in explicit) {
    return explicit[name];
  }
  // Fallback: simple hash based on name or id to pick a color
  const palette = [
    "#0ea5e9", // sky-500
    "#22c55e", // green-500
    "#a855f7", // purple-500
    "#f59e0b", // amber-500
    "#38bdf8", // sky-400
    "#10b981", // emerald-500
    "#8b5cf6", // violet-500
  ];
  const key = id ?? name;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash + key.charCodeAt(i) * 7) % palette.length;
  }
  return palette[hash];
}
