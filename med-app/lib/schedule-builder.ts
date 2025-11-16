import type { LaserPrescriptionInput, DoseSlot, Medication } from "../types/prescription";

/**
 * Convert a time string in HH:mm format into the number of minutes
 * since midnight. This helper will throw if the input is malformed.
 */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  if (Number.isNaN(h) || Number.isNaN(m) || h < 0 || h > 23 || m < 0 || m > 59) {
    throw new Error(`Invalid time string: ${time}`);
  }
  return h * 60 + m;
}

/**
 * Round a number of minutes to the nearest 30-minute increment. This helper
 * takes an absolute number of minutes from 00:00 and returns the closest
 * multiple of 30.
 */
function roundToHalfHour(minutes: number): number {
  return Math.round(minutes / 30) * 30;
}

/**
 * Convert a number of minutes since midnight into an "HH:mm" string.
 * Values greater than or equal to 24 hours are normalised back into
 * the 0–23 hour range.
 */
function minutesToTimeStr(totalMinutes: number): string {
  const minutesInDay = 24 * 60;
  const normalised = ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;
  const h = Math.floor(normalised / 60);
  const m = normalised % 60;
  const hh = h.toString().padStart(2, "0");
  const mm = m.toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Add a number of days to an ISO date string (yyyy-mm-dd). Returns a
 * new ISO date string. This helper does not mutate the original date.
 */
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
 * Determine whether a candidate minute value (0–1439) falls within the user's awake window.
 * If the normalized sleep time is greater than 24 hours (1440 minutes), the awake window spans
 * two segments: from wakeMinutes to midnight, and from midnight to (normalizedSleepMinutes - 1440).
 */
function isWithinAwakeWindow(
  candidateMinutes: number,
  wakeMinutes: number,
  normalizedSleepMinutes: number,
): boolean {
  const minutesInDay = 24 * 60;
  if (normalizedSleepMinutes <= minutesInDay) {
    // same-day sleep
    return candidateMinutes >= wakeMinutes && candidateMinutes <= normalizedSleepMinutes;
  } else {
    // sleep crosses midnight
    const minutesPastMidnight = normalizedSleepMinutes - minutesInDay;
    return (
      (candidateMinutes >= wakeMinutes && candidateMinutes < minutesInDay) ||
      (candidateMinutes >= 0 && candidateMinutes <= minutesPastMidnight)
    );
  }
}

/**
 * Resolve collisions for the same medication on a per-day basis. Two or more doses of the
 * same medication should not occupy the exact same time on the same date. It iterates through
 * each date/medication group, detects conflicts and adjusts times using small offsets (±15,
 * ±30, ±45, …) while keeping doses inside the awake window and on 15-minute increments.
 * Different medications are allowed to overlap in time.
 */
function resolveMedicationCollisions(
  slots: DoseSlot[],
  wakeMinutes: number,
  normalizedSleepMinutes: number,
): void {
  // Group slots by date and medication
  const groupMap = new Map<string, DoseSlot[]>();
  for (const slot of slots) {
    const key = `${slot.date}|${(slot as any).medicationId}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(slot);
  }

  // Resolve collisions within each group
  for (const group of groupMap.values()) {
    // Sort by current time to preserve ordering
    group.sort((a, b) => parseTimeToMinutes((a as any).time) - parseTimeToMinutes((b as any).time));
    const occupied = new Set<number>();
    for (const slot of group) {
      const origMinutes = parseTimeToMinutes((slot as any).time);
      let candidate = origMinutes;
      if (occupied.has(candidate)) {
        // Try offsets in 15-minute increments until a free slot is found
        const maxSteps = 10; // up to ±150 minutes
        outer: for (let step = 1; step <= maxSteps; step++) {
          const offsets = [step * 15, -step * 15];
          for (const offset of offsets) {
            const newMin = origMinutes + offset;
            if (newMin < 0 || newMin >= 24 * 60) continue;
            if (newMin % 15 !== 0) continue;
            if (!isWithinAwakeWindow(newMin, wakeMinutes, normalizedSleepMinutes)) continue;
            if (occupied.has(newMin)) continue;
            candidate = newMin;
            break outer;
          }
        }
        // אם לא נמצא מקום פנוי, נשאר בזמן המקורי (נדיר מאוד)
      }
      occupied.add(candidate);
      (slot as any).time = minutesToTimeStr(candidate);
    }
  }
}

/**
 * Build a schedule for all medications defined in the prescription. Handles sleep times
 * after midnight, distributes doses evenly within the awake window, rounds times to the
 * nearest half-hour, and finally resolves collisions per medication.
 */
export function buildLaserSchedule(prescription: LaserPrescriptionInput): DoseSlot[] {
  const { surgeryDate, wakeTime, sleepTime, medications } = prescription;

  // Normalize times and validate window
  const wakeMinutes = parseTimeToMinutes(wakeTime);
  const rawSleepMinutes = parseTimeToMinutes(sleepTime);
  let normalizedSleepMinutes = rawSleepMinutes;
  if (rawSleepMinutes <= wakeMinutes) normalizedSleepMinutes += 24 * 60;
  const awakeWindow = normalizedSleepMinutes - wakeMinutes;
  if (awakeWindow <= 0) {
    throw new Error("Sleep time must be after wake time");
  }

  const slots: DoseSlot[] = [];
  let slotCounter = 0;

  medications.forEach((med: Medication, medIndex) => {
    const color = getMedicationColor(medIndex);
    med.phases.forEach((phase) => {
      const { dayStart, dayEnd, timesPerDay } = phase;
      if (timesPerDay <= 0 || dayEnd < dayStart) return;
      const daysCount = dayEnd - dayStart + 1;
      const intervalMinutes = awakeWindow / timesPerDay;

      for (let dayOffset = 0; dayOffset < daysCount; dayOffset++) {
        const absoluteDayIndex = dayStart - 1 + dayOffset;
        for (let doseIndex = 0; doseIndex < timesPerDay; doseIndex++) {
          // Compute raw time and round to nearest half hour
          const rawRelativeMinutes = wakeMinutes + intervalMinutes * doseIndex;
          const roundedMinutes = roundToHalfHour(rawRelativeMinutes);
          // Compute date and time accounting for crossing midnight
          const dayCarry = Math.floor(roundedMinutes / (24 * 60));
          const minutesWithinDay = roundedMinutes % (24 * 60);
          const date = addDays(surgeryDate, absoluteDayIndex + dayCarry);
          const time = minutesToTimeStr(minutesWithinDay);
          slots.push({
            id: `slot-${slotCounter++}`,
            medicationId: med.id,
            medicationName: med.name,
            medicationColor: color,
            date,
            time,
            dayIndex: absoluteDayIndex + dayCarry,
            notes: med.notes,
          });
        }
      }
    });
  });

  // Sort the initial schedule
  slots.sort((a, b) => {
    if (a.date === b.date) return a.time.localeCompare(b.time);
    return a.date.localeCompare(b.date);
  });

  // Resolve per-medication collisions
  resolveMedicationCollisions(slots, wakeMinutes, normalizedSleepMinutes);

  // Sort again to reflect adjusted times
  slots.sort((a, b) => {
    if (a.date === b.date) return a.time.localeCompare(b.time);
    return a.date.localeCompare(b.date);
  });

  return slots;
}
