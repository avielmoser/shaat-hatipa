// app/types/prescription.ts
//
// Domain types used throughout the ShaatHaTipa application.  These define
// medications, protocol phases, prescription inputs, and the resulting
// schedule slots.  Keeping these in a shared module ensures consistent
// typing between client and server code.

/**
 * Types of supported surgeries.  Additional types may be added in the future.
 */
export type SurgeryType = "INTERLASIK" | "PRK" | "CUSTOM";

/**
 * A single phase within a medication protocol.  Phases are defined by
 * inclusive day ranges and the number of doses per day during that range.
 */
export interface Phase {
  dayStart: number;
  dayEnd: number;
  timesPerDay: number;
}

/**
 * Represents a medication and its associated protocol.  A medication
 * contains an identifier, a human‑readable name, optional notes, and
 * one or more phases defining dosage frequency over time.
 */
export interface Medication {
  id: string;
  name: string;
  notes?: string;
  phases: Phase[];
}

/**
 * The input required to generate a laser surgery prescription.  It
 * includes the surgery type, date, wake and sleep times, and the
 * list of medications to schedule.  Additional optional fields (e.g.
 * clinic or user ID) can be added later without breaking existing code.
 */
export interface LaserPrescriptionInput {
  surgeryType: SurgeryType;
  surgeryDate: string;
  wakeTime: string;
  sleepTime: string;
  medications: Medication[];
}

/**
 * A single scheduled dose of a medication at a specific date and time.
 * Schedules are returned as arrays of these objects.  The `time` field
 * is a HH:mm string rounded to 15‑minute increments; `date` is an ISO
 * date string (yyyy‑mm‑dd) corresponding to the day of the dose.
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
