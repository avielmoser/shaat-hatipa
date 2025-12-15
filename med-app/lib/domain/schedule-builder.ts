import type { ProtocolScheduleInput, DoseSlot, ProtocolAction } from "../../types/prescription";
import { getMedicationColor } from "../theme/medicationColors";
import { logger } from "../utils/logger";

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
  duration: number = 0
): boolean {
  const minutesInDay = 24 * 60;

  // We need to check if the ENTIRE duration [start, start + duration) is within the window.
  // Ideally, we just check start and end. But treating wrap-around is tricky with ranges.
  // For simplicity, we check if start is in window, and (start + duration) is in window.
  // Note: This simplifies "duration" checks near the sleep edge.

  const start = candidateMinutes;
  const end = start + duration; // Exclusive end

  // Helper to check a single point
  const checkPoint = (pt: number) => {
    const ptNorm = ((pt % minutesInDay) + minutesInDay) % minutesInDay;
    if (normalizedSleepMinutes > minutesInDay) {
      const sleepMod = normalizedSleepMinutes % minutesInDay;
      return (ptNorm >= wakeMinutes) || (ptNorm <= sleepMod);
    } else {
      return ptNorm >= wakeMinutes && ptNorm <= normalizedSleepMinutes;
    }
  };

  // Check start and end-1 (inclusive last minute)
  return checkPoint(start) && checkPoint(end - 1);
}

/**
 * Helper to check if a range [start, end) overlaps with any occupied range.
 * Occupied ranges are stored as absolute minutes (possibly > 1440 if dealing with same day logic),
 * but simpler to just Normalize everything to 0-1439 for the daily check.
 */
function isRangeOccupied(
  start: number,
  duration: number,
  occupiedIntervals: { start: number, end: number }[]
): boolean {
  const minutesInDay = 24 * 60;
  // Normalize range to 0-1439. 
  // Handle wrap around? 
  // If a range wraps (e.g. 23:55 to 00:05), it becomes [1435, 1445].
  // Normalized comparison is tricky. 
  // Strategy: treating everything in normalized 0-1439 space.
  // If a range crosses midnight, we split it into [start, 1440) and [0, end%1440).

  // BUT, the 'occupiedIntervals' build up for a single "logical day". 
  // The scheduler processes slots per logical day.
  // So we can work in logical minutes (wakeMinutes ... normalizedSleepMinutes).
  // Let's stick to normalizing to 0-1439 for storage to avoid infinite growth, 
  // effectively "placing it on the clock face".

  const s1 = ((start % minutesInDay) + minutesInDay) % minutesInDay;
  const e1 = s1 + duration;

  const rangesToCheck: { s: number, e: number }[] = [];
  if (e1 > minutesInDay) {
    rangesToCheck.push({ s: s1, e: minutesInDay });
    rangesToCheck.push({ s: 0, e: e1 % minutesInDay });
  } else {
    rangesToCheck.push({ s: s1, e: e1 });
  }

  for (const check of rangesToCheck) {
    for (const occ of occupiedIntervals) {
      // Check intersection: start < occ.end && end > occ.start
      // occupied intervals are also stored normalized 0-1439, possibly split?
      // Actually, let's keep occupiedIntervals simple: [s, e) where s, e are 0-1439.
      // If an action wraps, we store two intervals.

      if (Math.max(check.s, occ.start) < Math.min(check.e, occ.end)) {
        return true;
      }
    }
  }
  return false;
}

function markRangeOccupied(
  start: number,
  duration: number,
  occupiedIntervals: { start: number, end: number }[]
) {
  const minutesInDay = 24 * 60;
  const s1 = ((start % minutesInDay) + minutesInDay) % minutesInDay;
  const e1 = s1 + duration;

  if (e1 > minutesInDay) {
    occupiedIntervals.push({ start: s1, end: minutesInDay });
    occupiedIntervals.push({ start: 0, end: e1 % minutesInDay });
  } else {
    occupiedIntervals.push({ start: s1, end: e1 });
  }
}

/**
 * Resolve collisions for the same action on a per-day basis. 
 */
function resolveActionCollisions(
  slots: DoseSlot[],
  wakeMinutes: number,
  normalizedSleepMinutes: number,
  actionsById: Map<string, ProtocolAction>
): void {
  // Group slots by date and action ID
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

    // Track occupied intervals for this group (this specific action on this specific day)
    // Wait, the requirement says: "Collision resolver respects spacing".
    // Does it mean collisions between DIFFERENT actions? 
    // "Mixed: actions with 0/5/20 minutes, ensure collision resolver respects spacing"
    // Usually, different meds CAN overlap.
    // "Different medications are allowed to overlap in time." (Existing comment).
    // BUT, if I have "Physio" (20 mins), can I take a Pill during it? Maybe.
    // Can I do TWO Physio sessions at the same time? No.
    // The existing logic groups by medicationId. So it prevents SELF-collision.
    // It says "Different medications are allowed to overlap in time."
    // I will preserve this behavior: Only resolve collisions for the SAME action ID.

    const occupiedIntervals: { start: number, end: number }[] = [];
    const actionId = group[0].medicationId;
    const action = actionsById.get(actionId);

    // Use configured duration or default to 0 (agnostic)
    // NOTE: For backward compatibility, if this is truly generic, 0 is right.
    // But for Drops, we want 5. The input action should have it.
    // If it doesn't, we default to 0. 
    // If logic breaks for drops, we know we missed the config update.
    const duration = action?.minDurationMinutes ?? 0;
    // Ensure at least 1 minute is occupied to prevent identity collisions?
    // If duration is 0, start=end. isRangeOccupied might fail. 
    // Let's assume duration 0 means "instant". 
    // But if we have 2 instant actions at 10:00, they colide?
    // "Pills: minDurationMinutes=0, high frequency, should be feasible" -> allows multiple at same time?
    // If strict 0, they can be at same time.
    // But usually we want some display separation? 
    // Existing logic with Set<number> implicitly enforced 1 minute separation.
    // I will enforce min 1 minute "slot" for occupation if duration is 0, to avoid perfect overlap in UI.
    const effectiveDuration = Math.max(duration, 1);

    for (const slot of group) {
      const origMinutes = parseTimeToMinutes(slot.time);
      let candidate = origMinutes;
      let found = false;

      // Check if candidate spot is free
      if (!isRangeOccupied(candidate, effectiveDuration, occupiedIntervals)) {
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
            if (!isWithinAwakeWindow(normalizedNewMin, wakeMinutes, normalizedSleepMinutes, effectiveDuration)) continue;

            // Must be free
            if (isRangeOccupied(normalizedNewMin, effectiveDuration, occupiedIntervals)) continue;

            candidate = normalizedNewMin;
            found = true;
            break;
          }
          if (found) break;
        }
      }

      if (!found) {
        logger.warn("Could not resolve collision for slot", "SCHEDULE_BUILDER", { slot });
      }

      markRangeOccupied(candidate, effectiveDuration, occupiedIntervals);
      slot.time = minutesToTimeStr(candidate);
    }
  }
}

/**
 * Build a schedule for all actions defined in the protocol. Handles sleep times
 * after midnight, distributes doses evenly within the awake window, rounds times to the
 * nearest half-hour, and finally resolves collisions per action.
 */
export function buildProtocolSchedule(prescription: ProtocolScheduleInput): DoseSlot[] {
  const { surgeryDate, wakeTime, sleepTime, medications } = prescription;

  // actionsById map for quick lookup
  const actionsById = new Map<string, ProtocolAction>();
  medications.forEach(m => actionsById.set(m.id, m));

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
  // Calculate total time required across all actions
  let totalRequiredMinutes = 0;
  let totalActions = 0;

  medications.forEach(med => {
    const duration = med.minDurationMinutes ?? 0; // Removed hardcoded default 5
    med.phases.forEach(phase => {
      totalRequiredMinutes += phase.timesPerDay * duration;
      totalActions += phase.timesPerDay;
    });
  });

  // If total required time exceeds awake window, it's strictly impossible.
  if (totalRequiredMinutes > awakeWindow) {
    throw new ImpossibleScheduleError(`Schedule is too dense: Requires ${totalRequiredMinutes} minutes within ${awakeWindow} available minutes.`);
  }

  const slots: DoseSlot[] = [];
  let slotCounter = 0;

  medications.forEach((med: ProtocolAction, medIndex) => {
    const color = getMedicationColor(med.name, med.id);
    // Removed hardcoded default 5
    // Note: We don't use duration here for distribution, only collision resolution uses it.
    // Distribution assumes points.

    med.phases.forEach((phase) => {
      const { dayStart, dayEnd, timesPerDay, intervalHours } = phase; // Added intervalHours
      if (dayEnd < dayStart) return;
      const daysCount = dayEnd - dayStart + 1;

      // Distribution Strategy
      let effectiveInterval = 0;
      let iterations = timesPerDay;

      // If intervalHours is specified, we calculate iterations based on wake window
      if (intervalHours && intervalHours > 0) {
        // qXh logic: Start at Wake, then Wake + X, Wake + 2X...
        // We need to fit them into awakeWindow.
        // Actually, usually q6h means: 8:00, 14:00, 20:00.
        // So effective interval is intervalHours * 60.
        effectiveInterval = intervalHours * 60;

        // Calculate how many fit
        // First dose at 0 (wake time), last dose must be <= awakeWindow.
        // 0, I, 2I ... kI <= Window
        // k <= Window / I
        // Count = k + 1 (because of the 0th dose)
        const possibleDoses = Math.floor(awakeWindow / effectiveInterval) + 1;

        // If timesPerDay is provided (e.g. 4), we normally clamp?
        // But usually for qXh we just run until sleep.
        // Let's use the smaller of calculated feasible vs timesPerDay (if timesPerDay > 0).
        // If timesPerDay is 0 (unlimited/as-needed), we might treat it differently,
        // but here we are scheduling fixed actions.
        if (timesPerDay > 0) {
          iterations = Math.min(possibleDoses, timesPerDay);
        } else {
          iterations = possibleDoses;
        }
      } else if (timesPerDay > 0) {
        // Standard distribution (divide window evenly)
        effectiveInterval = awakeWindow / timesPerDay;
      } else {
        // timesPerDay is 0 and no interval? Skip (As Needed).
        return;
      }

      for (let dayOffset = 0; dayOffset < daysCount; dayOffset++) {
        const absoluteDayIndex = dayStart - 1 + dayOffset;
        for (let doseIndex = 0; doseIndex < iterations; doseIndex++) {
          // Compute raw time
          const rawRelativeMinutes = wakeMinutes + (effectiveInterval * doseIndex);

          // Rounding (Standard 30 min rounding for UX)
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

  // Resolve per-action collisions
  resolveActionCollisions(slots, wakeMinutes, normalizedSleepMinutes, actionsById);

  // Sort again to reflect adjusted times
  slots.sort((a, b) => {
    if (a.date === b.date) return a.time.localeCompare(b.time);
    return a.date.localeCompare(b.date);
  });

  return slots;
}

/**
 * Legacy alias for backward compatibility.
 */
export const buildLaserSchedule = buildProtocolSchedule;
