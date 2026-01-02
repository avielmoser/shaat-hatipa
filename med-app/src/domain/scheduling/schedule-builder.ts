import type { ProtocolScheduleInput, DoseSlot, ProtocolAction } from "@/types/prescription";
import { getActionColor } from "@/domain/scheduling/action-colors";
import { ClinicConfig } from "@/config/clinics/types";
import { ILogger } from "@/domain/contracts/logging";
import { parseTimeToMinutes } from "@/domain/utils/time";
import { resolveActionCollisions } from "./collision-resolver";
import { distributeDoses } from "./distribution-engine";

export class ImpossibleScheduleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImpossibleScheduleError";
  }
}

/**
 * Build a schedule for all actions defined in the protocol. Handles sleep times
 * after midnight, distributes doses evenly within the awake window, rounds times to the
 * nearest half-hour, and finally resolves collisions per action.
 */
export function buildProtocolSchedule(
  prescription: ProtocolScheduleInput,
  clinicConfig: ClinicConfig,
  logger?: ILogger
): DoseSlot[] {
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
  let totalRequiredMinutes = 0;
  medications.forEach(med => {
    const duration = med.minDurationMinutes ?? 0;
    med.phases.forEach(phase => {
      totalRequiredMinutes += phase.timesPerDay * duration;
    });
  });

  if (totalRequiredMinutes > awakeWindow) {
    const errorMsg = `Schedule is too dense: Requires ${totalRequiredMinutes} minutes within ${awakeWindow} available minutes.`;
    if (logger) logger.warn(errorMsg, "ScheduleBuilder", { totalRequiredMinutes, awakeWindow });
    throw new ImpossibleScheduleError(errorMsg);
  }

  let slots: DoseSlot[] = [];
  let slotCounter = 0;

  medications.forEach((med: ProtocolAction) => {
    const color = med.color || getActionColor(med, clinicConfig);
    const result = distributeDoses(med, surgeryDate, wakeMinutes, awakeWindow, color, slotCounter);
    slots = [...slots, ...result.slots];
    slotCounter = result.nextCounter;
  });

  // Initial sort
  slots.sort((a, b) => {
    if (a.date === b.date) return a.time.localeCompare(b.time);
    return a.date.localeCompare(b.date);
  });

  // Resolve per-action collisions
  resolveActionCollisions(slots, wakeMinutes, normalizedSleepMinutes, actionsById, logger);

  // Final sort
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
