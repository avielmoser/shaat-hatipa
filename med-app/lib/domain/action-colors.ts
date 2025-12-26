// lib/domain/action-colors.ts
// Canonical color assignment for treatment/protocol actions across all clinics.
// Ensures deterministic, consistent colors across schedule cards, chips, PDF export, and legends.

import { ProtocolAction } from "../../types/prescription";
import { ClinicConfig } from "../../config/clinics/types";

/**
 * Fixed palette of accessible colors (8-12 colors with good contrast).
 * These are Tailwind-friendly hex colors that work well for backgrounds, borders, and text.
 */
const COLOR_PALETTE = [
  "#0ea5e9", // sky-500 (blue)
  "#a855f7", // purple-500
  "#f97316", // orange-500
  "#22c55e", // green-500
  "#eab308", // yellow-500
  "#ef4444", // red-500
  "#06b6d4", // cyan-500
  "#8b5cf6", // violet-500
  "#f59e0b", // amber-500
  "#10b981", // emerald-500
  "#ec4899", // pink-500
  "#6366f1", // indigo-500
];

/**
 * Legacy medication colors for backward compatibility with Ein-Tal.
 * These are preserved to maintain existing color assignments.
 */
const LEGACY_MEDICATION_COLORS: Record<string, string> = {
  sterodex: "#0ea5e9",        // blue – Sterodex
  vigamox: "#a855f7",         // purple – Vigamox
  dicloftil: "#f97316",       // orange – Dicloftil
  "systane-balance": "#22c55e", // green – Systane Balance
  vitapos: "#eab308",         // yellow – Vitapos
};

/**
 * Simple hash function for deterministic color assignment.
 * Converts a string to a number and uses modulo to pick from palette.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Normalizes a string for consistent matching (removes spaces, hyphens, parentheses).
 */
function normalizeString(value: string): string {
  return value.toLowerCase().replace(/[\s\-()]/g, "");
}

/**
 * Gets a color for an action using the canonical resolution logic:
 * 1. If action.color exists -> use it (preserve explicit assignments)
 * 2. Else if clinic has actionColorMap by action.id -> use it
 * 3. Else check legacy medication colors (for backward compatibility)
 * 4. Else hash(action.id || action.name) -> pick from fixed palette
 *
 * @param action - The protocol action (must have id, may have name and color)
 * @param clinic - Optional clinic config (may have actionColorMap)
 * @returns A hex color string (e.g., "#0ea5e9")
 */
export function getActionColor(
  action: { id: string; name?: string; color?: string },
  clinic?: ClinicConfig
): string {
  // Priority 1: Explicit color on action
  if (action.color) {
    return action.color;
  }

  // Priority 2: Clinic-specific actionColorMap
  if (clinic?.actionColorMap && clinic.actionColorMap[action.id]) {
    return clinic.actionColorMap[action.id];
  }

  // Priority 3: Legacy medication colors (for backward compatibility with Ein-Tal)
  const actionIdLower = action.id.toLowerCase();
  if (LEGACY_MEDICATION_COLORS[actionIdLower]) {
    return LEGACY_MEDICATION_COLORS[actionIdLower];
  }

  // Also check normalized name matching for legacy support
  if (action.name) {
    const normalizedName = normalizeString(action.name);
    for (const [key, color] of Object.entries(LEGACY_MEDICATION_COLORS)) {
      const normalizedKey = normalizeString(key);
      if (normalizedName.includes(normalizedKey)) {
        return color;
      }
    }
  }

  // Priority 4: Deterministic hash-based assignment
  const hashInput = action.id || action.name || "unknown";
  const hash = hashString(hashInput);
  const paletteIndex = hash % COLOR_PALETTE.length;
  return COLOR_PALETTE[paletteIndex];
}

/**
 * Assigns colors to all actions in a protocol that don't already have colors.
 * This is the main entry point for color assignment during protocol resolution.
 *
 * @param actions - Array of protocol actions
 * @param clinic - Optional clinic config
 * @returns New array with all actions having a color property set
 */
export function assignActionColors(
  actions: ProtocolAction[],
  clinic?: ClinicConfig
): ProtocolAction[] {
  return actions.map(action => {
    // If action already has a color, preserve it
    if (action.color) {
      return action;
    }

    // Assign color using canonical resolver
    const color = getActionColor(action, clinic);
    return {
      ...action,
      color,
    };
  });
}

