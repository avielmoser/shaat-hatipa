// lib/schedule-builder.ts
import type { LaserPrescriptionInput, DoseSlot, Medication } from "../types/prescription";

function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return h * 60 + m;
}

function minutesToTimeStr(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const hh = h.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

function addDays(dateStr: string, daysToAdd: number): string {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + daysToAdd);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const MED_COLORS = [
  "#0ea5e9", // sky-500
  "#a855f7", // purple-500
  "#22c55e", // green-500
  "#f97316", // orange-500
  "#ec4899", // pink-500
  "#eab308", // yellow-500
];

function getMedicationColor(medIndex: number): string {
  return MED_COLORS[medIndex % MED_COLORS.length];
}

/**
 * בונה לוח זמנים על בסיס:
 * - תאריך ניתוח
 * - שעות ערות (wakeTime / sleepTime)
 * - תרופות + תקופות (phases)
 */
export function buildLaserSchedule(prescription: LaserPrescriptionInput): DoseSlot[] {
  const { surgeryDate, wakeTime, sleepTime, medications } = prescription;

  const wakeMinutes = parseTimeToMinutes(wakeTime);
  const sleepMinutes = parseTimeToMinutes(sleepTime);
  const awakeWindow = sleepMinutes - wakeMinutes;

  if (awakeWindow <= 0) {
    throw new Error("Sleep time must be after wake time");
  }

  const slots: DoseSlot[] = [];
  let slotCounter = 0;

  medications.forEach((med: Medication, medIndex) => {
    const color = getMedicationColor(medIndex);

    med.phases.forEach((phase) => {
      const { dayStart, dayEnd, timesPerDay } = phase;
      if (timesPerDay <= 0) return;
      if (dayEnd < dayStart) return;

      const daysCount = dayEnd - dayStart + 1;
      const intervalMinutes = awakeWindow / timesPerDay; // מרווחים קבועים בין מנות

      for (let dayOffset = 0; dayOffset < daysCount; dayOffset++) {
        const absoluteDayIndex = (dayStart - 1) + dayOffset;
        const date = addDays(surgeryDate, absoluteDayIndex);

        for (let doseIndex = 0; doseIndex < timesPerDay; doseIndex++) {
          const doseMinutes = Math.round(wakeMinutes + intervalMinutes * doseIndex);
          const time = minutesToTimeStr(doseMinutes);

          slots.push({
            id: `slot-${slotCounter++}`,
            medicationId: med.id,
            medicationName: med.name,
            medicationColor: color,
            date,
            time,
            dayIndex: absoluteDayIndex,
            notes: med.notes,
          });
        }
      }
    });
  });

  // למיין לפי תאריך ואז לפי שעה
  slots.sort((a, b) => {
    if (a.date === b.date) {
      return a.time.localeCompare(b.time);
    }
    return a.date.localeCompare(b.date);
  });

  return slots;
}
