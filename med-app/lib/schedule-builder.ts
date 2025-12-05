import type { LaserPrescriptionInput, DoseSlot, Medication } from "../types/prescription";
import { getMedicationColor } from "../constants/theme";
import { logger } from "./logger";

export class ImpossibleScheduleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImpossibleScheduleError";
  }
}

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
  // Normalize candidate to 0-1439 for comparison if needed, but here we deal with absolute minutes from wake time perspective usually.
  // Actually, the candidateMinutes passed here are usually 0-1439 (time of day).

  // If sleep is next day (e.g. wake 08:00, sleep 26:00 (02:00 next day))
  if (normalizedSleepMinutes > minutesInDay) {
    // Awake window is split across midnight: [wakeMinutes, 1440) AND [0, sleepMinutes % 1440]
    const sleepMod = normalizedSleepMinutes % minutesInDay;
    return (candidateMinutes >= wakeMinutes) || (candidateMinutes <= sleepMod);
  } else {
    // Same day window
    return candidateMinutes >= wakeMinutes && candidateMinutes <= normalizedSleepMinutes;
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
    const key = `${slot.date}|${slot.medicationId}`;
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(slot);
  }

  // Resolve collisions within each group
  for (const group of groupMap.values()) {
    // Sort by current time to preserve ordering
    group.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
    const occupied = new Set<number>();

    for (const slot of group) {
      const origMinutes = parseTimeToMinutes(slot.time);
      let candidate = origMinutes;
      let found = false;

      // If original time is free, take it
      if (!occupied.has(candidate)) {
        found = true;
      } else {
        // Try offsets in 15-minute increments until a free slot is found
        const maxSteps = 12; // up to ±180 minutes
        for (let step = 1; step <= maxSteps; step++) {
          const offsets = [step * 15, -step * 15];
          for (const offset of offsets) {
            const newMin = origMinutes + offset;

            // Normalize to 0-1439 for window check
            const minutesInDay = 24 * 60;
            const normalizedNewMin = ((newMin % minutesInDay) + minutesInDay) % minutesInDay;

            // Must be within awake window
            if (!isWithinAwakeWindow(normalizedNewMin, wakeMinutes, normalizedSleepMinutes)) continue;

            // Must be free (check against occupied set which stores 0-1439 values)
            if (occupied.has(normalizedNewMin)) continue;

            candidate = normalizedNewMin;
            found = true;
            break;
          }
          if (found) break;
        }
      }

      if (!found) {
        logger.warn("Could not resolve collision for slot", "SCHEDULE_BUILDER", { slot });
        // If still not found, we force it (overlap) but log a warning.
      }

      occupied.add(candidate);
      slot.time = minutesToTimeStr(candidate);
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

  // If sleep time is earlier than wake time, assume it's the next day
  if (rawSleepMinutes <= wakeMinutes) normalizedSleepMinutes += 24 * 60;

  const awakeWindow = normalizedSleepMinutes - wakeMinutes;
  if (awakeWindow <= 0) {
    throw new Error("Sleep time must be after wake time");
  }

  // Pre-check for impossible schedules
  // Calculate max drops per day across all meds
  let maxDropsPerDay = 0;
  medications.forEach(med => {
    med.phases.forEach(phase => {
      maxDropsPerDay += phase.timesPerDay;
    });
  });

  // If we have more drops than 5-minute slots, it's physically impossible
  // (Heuristic: 5 mins per drop is very tight but possible. Less is dangerous.)
  if (maxDropsPerDay * 5 > awakeWindow) {
    throw new ImpossibleScheduleError(`Schedule is too dense: ${maxDropsPerDay} drops in ${awakeWindow} minutes.`);
  }

  const slots: DoseSlot[] = [];
  let slotCounter = 0;

  medications.forEach((med: Medication, medIndex) => {
    const color = getMedicationColor(medIndex);
    med.phases.forEach((phase) => {
      const { dayStart, dayEnd, timesPerDay } = phase;
      if (timesPerDay <= 0 || dayEnd < dayStart) return;
      const daysCount = dayEnd - dayStart + 1;

      // Distribute evenly
      const intervalMinutes = awakeWindow / (timesPerDay + 1); // +1 to avoid start/end exactly? No, usually / timesPerDay or / (timesPerDay + 1) depending on strategy.
      // Standard strategy: Start at wake + interval, or spread evenly.
      // Let's stick to previous logic: wake + interval * i, but maybe adjust to center it better?
      // Previous: wake + interval * doseIndex. 
      // If timesPerDay=4, window=12h (720m). interval=180. 0, 180, 360, 540.
      // That puts first drop AT wake time. That's usually fine.

      const effectiveInterval = awakeWindow / timesPerDay;

      for (let dayOffset = 0; dayOffset < daysCount; dayOffset++) {
        const absoluteDayIndex = dayStart - 1 + dayOffset;
        for (let doseIndex = 0; doseIndex < timesPerDay; doseIndex++) {
          // Compute raw time and round to nearest half hour
          // Add a small buffer to start time so we don't drop EXACTLY at wake up every time?
          // Actually, patients usually want drops upon waking.
          const rawRelativeMinutes = wakeMinutes + (effectiveInterval * doseIndex);

          // Rounding
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
