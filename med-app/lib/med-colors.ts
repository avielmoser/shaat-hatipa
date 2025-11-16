// lib/med-colors.ts

// Backwards-compatibility shim:
// Re-export getMedicationColor from the new central mapping file.
// This way any existing imports from "../lib/med-colors" still work,
// but there is only ONE implementation of getMedicationColor.

export { getMedicationColor } from "./medicationColors";
