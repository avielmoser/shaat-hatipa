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
 */
export type ProcedureType = "INTERLASIK" | "PRK" | "CUSTOM";

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
  surgeryType: ProcedureType; // Kept property name 'surgeryType' for now to minimize ripple, but type is generic.
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
