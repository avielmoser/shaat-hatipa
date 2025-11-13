// types/prescription.ts

// סוגי ניתוחים (כרגע בפועל תומכים ב-INTERLASIK)
export type SurgeryType = "INTERLASIK" | "PRK" | "LASIK" | "LASEK" | "OTHER";

export interface MedicationPhase {
  /** יום התחלה יחסית ליום הניתוח (1 = יום הניתוח) */
  dayStart: number;
  /** יום סיום כולל */
  dayEnd: number;
  /** כמה פעמים ביום בתקופה הזו */
  timesPerDay: number;
}

export interface Medication {
  id: string;
  name: string;
  phases: MedicationPhase[];
  notes?: string;
}

export interface LaserPrescriptionInput {
  surgeryType: SurgeryType;
  surgeryDate: string; // YYYY-MM-DD
  wakeTime: string; // "07:00"
  sleepTime: string; // "23:00"
  medications: Medication[];
}

export interface DoseSlot {
  id: string;
  medicationId: string;
  medicationName: string;
  medicationColor?: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  dayIndex: number; // 0 = יום הניתוח
  notes?: string;
}

export interface LaserScheduleResponse {
  prescription: LaserPrescriptionInput;
  schedule: DoseSlot[];
}
