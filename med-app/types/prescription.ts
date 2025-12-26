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
/**
 * Represents a medical action (medication, exercise, check).
 * Contains an identifier, readable name, optional notes, and
 * dosage phases.
 * Renamed from Medication to ProtocolAction to be domain-agnostic.
 */
export interface ProtocolAction {
  id: string;
  name: string;
  notes?: string;
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
  medicationName: string;
  medicationColor: string;
  date: string;
  time: string;
  dayIndex: number;
  notes?: string;
}
