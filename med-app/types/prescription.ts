// app/types/prescription.ts
//
// Domain types used throughout the ShaatHaTipa application.  These define
// medications, protocol phases, prescription inputs, and the resulting
// schedule slots.  Keeping these in a shared module ensures consistent
// typing between client and server code.

/**
 * Types of supported surgeries.  Additional types may be added in the future.
 */
/**
 * Types of supported medical procedures. 
 * Previously "SurgeryType".
 * Now just an alias for string as we decouple from hardcoded enums.
 * Kept as a type for documentation clarity.
 */
export type ProcedureType = string;

/**
 * Legacy alias for backward compatibility with existing UI components.
 */
export type SurgeryType = ProcedureType;

/**
 * A single phase within a protocol action (medication/exercise).
 * Phases are defined by inclusive day ranges and frequency.
 */
export interface Phase {
  dayStart: number;
  dayEnd: number;
  timesPerDay: number;
  /**
   * Optional fixed interval in hours (e.g., 4, 6, 8).
   * If present, overrides timesPerDay distribution logic to enforce specific spacing.
   */
  intervalHours?: number;
}

/**
 * Represents a medical action (medication, exercise, check).
 * Contains an identifier, readable name, optional notes, and
 * dosage phases.
 */
export type ActionInstruction =
  /**
   * Applies based on appliesToActionIds:
   * - If undefined or empty array []: applies to ALL actions in the slot.
   * - If it contains IDs: applies ONLY to those actions.
   */
  | { type: "wait_between_actions"; minutes: number; appliesToActionIds?: string[]; messageKey?: string; params?: Record<string, string | number> }
  | { type: "avoid_food"; appliesToActionIds?: string[] }
  | { type: "separate_medications"; appliesToActionIds?: string[] }
  // Future-proof generic text instruction (localized via translation keys)
  | { type: "note"; messageKey: string; params?: Record<string, string | number>; appliesToActionIds?: string[] };

/**
 * Support for bilingual content (Hebrew/English).
 * If a string is provided, it is treated as a single-language value.
 * If an object { he, en } is provided, the correct value is picked based on locale.
 */
export type LocalizedString = string | { he: string; en: string };

/**
 * Represents a medical action (medication, exercise, check).
 * Contains an identifier, readable name, optional notes, and
 * dosage phases.
 * Renamed from Medication to ProtocolAction to be domain-agnostic.
 */
export interface ProtocolAction {
  id: string;
  name: LocalizedString;
  notes?: LocalizedString;
  phases: Phase[];
  /**
   * Minimum time in minutes this action takes or requires spacing.
   * Used for capacity planning and collision resolution.
   * Default for existing laser protocols is 5.
   */
  minDurationMinutes?: number;
  /**
   * Hex color code for UI display (e.g., "#0ea5e9").
   * Assigned deterministically by the color resolver to ensure consistency
   * across schedule cards, chips, PDF export, and legends.
   */
  color?: string;
  /**
   * The delivery route of the action. Used for spacing policies.
   * missing/undefined => treat as "other"
   */
  route?: "eye_drop" | "oral" | "other";
  instructions?: ActionInstruction[];
}

/**
 * Alias for backward compatibility.
 */
export type Medication = ProtocolAction;

/**
 * The input required to generate a medical schedule.
 * Renamed from LaserPrescriptionInput to be generic.
 */
export interface ProtocolScheduleInput {
  clinicSlug: string; // New field for API resolution context
  protocolKey: string; // The primary identifier for the protocol
  surgeryType?: ProcedureType; // Legacy / Fallback
  surgeryDate: string;
  wakeTime: string;
  sleepTime: string;
  medications: ProtocolAction[];
}

/**
 * Alias for backward compatibility.
 */
export type LaserPrescriptionInput = ProtocolScheduleInput;

/**
 * A single scheduled action slot.
 */
export interface DoseSlot {
  id: string;
  medicationId: string;
  medicationName: LocalizedString;
  medicationColor: string;
  date: string;
  time: string;
  dayIndex: number;
  notes?: LocalizedString;
  instructions?: ActionInstruction[];
  /**
   * List of actions in this slot.
   * Usually contains one action, but supports multi-action slots.
   */
  actions: ProtocolAction[];
}
