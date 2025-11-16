// app/lib/time-utils.ts
// Utility functions for parsing and normalizing wake/sleep times.

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge multiple Tailwind class values into a single string. This helper
 * uses clsx and tailwind-merge to de-duplicate and merge classes in a
 * predictable way. It is intended for UI components to compose class
 * names cleanly.
 *
 * @param inputs - Any number of class values (strings, arrays, objects)
 * @returns A space-separated string of classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Convert a time string (HH:mm) into a number of minutes from midnight.
 *
 * @param time - A string in the format "HH:mm".
 * @returns The number of minutes since 00:00. Throws an error for invalid input.
 */
export function parseTimeToMinutes(time: string): number {
  const [hourStr, minuteStr] = time.split(":");
  const hours = Number.parseInt(hourStr, 10);
  const minutes = Number.parseInt(minuteStr, 10);

  // Validate hours and minutes
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    throw new Error(`Invalid time string: ${time}`);
  }

  return hours * 60 + minutes;
}

/**
 * Normalize an awake window that may span across midnight.
 *
 * The wake time and sleep time are interpreted as offsets in minutes from
 * midnight. If the sleep time is earlier than or equal to the wake time
 * (for example "00:30" vs "07:00"), it is assumed to occur on the following
 * day and 24 hours (1440 minutes) are added to the sleep time. The
 * resulting window length will always be positive.
 *
 * @param wakeTime - The time the user wakes up (HH:mm).
 * @param sleepTime - The time the user goes to sleep (HH:mm). May be after midnight.
 * @returns An object containing the wake minute, normalized sleep minute, and window length.
 */
export function normalizeAwakeWindow(
  wakeTime: string,
  sleepTime: string
): { wakeMinutes: number; normalizedSleepMinutes: number; awakeMinutes: number } {
  const wakeMinutes = parseTimeToMinutes(wakeTime);
  const rawSleepMinutes = parseTimeToMinutes(sleepTime);

  let normalizedSleepMinutes = rawSleepMinutes;
  // If sleep occurs on or before wake in the same day, treat it as the next day.
  if (rawSleepMinutes <= wakeMinutes) {
    normalizedSleepMinutes += 24 * 60;
  }

  const awakeMinutes = normalizedSleepMinutes - wakeMinutes;
  return { wakeMinutes, normalizedSleepMinutes, awakeMinutes };
}

/**
 * Determine whether a given wake and sleep combination is logically impossible.
 *
 * An impossible combination would indicate that, after normalization,
 * the awake window length is zero or negative. Under the current logic
 * (adding 24 hours to sleep times that are earlier than wake times),
 * this should never happen; however, this function exists to guard
 * against future changes or invalid inputs.
 *
 * @param wakeTime - The wake time string (HH:mm).
 * @param sleepTime - The sleep time string (HH:mm).
 * @returns True if the combination is impossible.
 */
export function isImpossibleAwakeWindow(wakeTime: string, sleepTime: string): boolean {
  try {
    const { awakeMinutes } = normalizeAwakeWindow(wakeTime, sleepTime);
    return awakeMinutes <= 0;
  } catch (error) {
    return true;
  }
}
