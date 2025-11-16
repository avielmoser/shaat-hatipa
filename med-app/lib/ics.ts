// app/lib/ics.ts
//
// Simple helper to export a schedule as an iCalendar (.ics) file.  This
// implementation creates a basic VCALENDAR with one VEVENT per dose slot.
// It does not require any external dependencies and is intended only for
// personal use.  The resulting file includes start and end times at the
// exact minute of the dose; end times match start times to represent a
// momentary reminder.

import type { DoseSlot } from "../types/prescription";

/**
 * Convert a date (yyyy‑mm‑dd) and time (HH:mm) into a compact
 * YYYYMMDDTHHMMSSZ format.  The date/time is interpreted as local and
 * converted to UTC for the calendar (indicated by the trailing 'Z').
 */
function toICalDateTime(date: string, time: string): string {
  const [year, month, day] = date.split("-").map((v) => parseInt(v, 10));
  const [hour, minute] = time.split(":").map((v) => parseInt(v, 10));
  // Create a Date object in local time
  const local = new Date(year, month - 1, day, hour, minute);
  // Convert to UTC and format as YYYYMMDDTHHMMSSZ
  const yyyy = local.getUTCFullYear().toString().padStart(4, "0");
  const mm = (local.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = local.getUTCDate().toString().padStart(2, "0");
  const hh = local.getUTCHours().toString().padStart(2, "0");
  const min = local.getUTCMinutes().toString().padStart(2, "0");
  const sec = local.getUTCSeconds().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${min}${sec}Z`;
}

/**
 * Download the given schedule as an iCalendar file.  Each dose becomes
 * its own event lasting zero minutes with the medication name as the
 * summary and any notes in the description.
 *
 * @param schedule - An array of scheduled dose slots
 * @param fileName - The desired file name without extension
 */
export function downloadScheduleIcs(schedule: DoseSlot[], fileName: string): void {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("CALSCALE:GREGORIAN");
  schedule.forEach((slot) => {
    const dtStart = toICalDateTime(slot.date, slot.time);
    // Use same time for DTEND (zero‑duration event)
    const dtEnd = dtStart;
    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${slot.id}@shaathtipa`);
    lines.push(`DTSTAMP:${dtStart}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${slot.medicationName}`);
    if (slot.notes) {
      lines.push(`DESCRIPTION:${slot.notes}`);
    }
    lines.push("END:VEVENT");
  });
  lines.push("END:VCALENDAR");
  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
