import { LocalizedString } from "@/domain/contracts/localized-types";
import { Phase } from "./prescription";

/**
 * Represents a medical protocol (regimen) for a specific procedure or condition.
 * Defines the set of actions (medications) to be taken.
 */
export interface Protocol {
  id: string; 
  kind: 'SCHEDULED' | 'AS_NEEDED';
  actions: ProtocolAction[];
  label?: LocalizedString;
  description?: LocalizedString;
}

/**
 * A single action within a protocol (e.g., taking a medication).
 */
export interface ProtocolAction {
  id: string;
  name: LocalizedString;
  notes?: LocalizedString;
  phases: Phase[];
  minDurationMinutes?: number;
  color?: string;
  route?: "eye_drop" | "oral" | "other";
  // instructions?: ActionInstruction[]; 
}

/**
 * A scheduled instance of an action.
 */
export interface Dose {
  id: string;
  medicationId: string;
  medicationName: LocalizedString;
  medicationColor: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  dayIndex: number; // 1-based day index relative to surgery
  notes?: LocalizedString;
  actions?: ProtocolAction[]; // Optional to match DoseSlot if needed
}
