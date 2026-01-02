import type { DoseSlot } from "../../types/prescription";
import { resolveLocalizedString } from "@/domain/utils/i18n";

const ICS_CONSTANTS = {
  BEGIN_CALENDAR: "BEGIN:VCALENDAR",
  VERSION: "VERSION:2.0",
  CALSCALE: "CALSCALE:GREGORIAN",
  BEGIN_EVENT: "BEGIN:VEVENT",
  END_EVENT: "END:VEVENT",
  BEGIN_ALARM: "BEGIN:VALARM",
  END_ALARM: "END:VALARM",
  END_CALENDAR: "END:VCALENDAR",
  ALARM_TRIGGER: "TRIGGER:-PT5M",
  ALARM_ACTION: "ACTION:DISPLAY",
} as const;

/**
 * Converts a date and time string into an iCalendar compliant floating date-time string.
 * Format: YYYYMMDDTHHmmSS (Floating Time - no Z, no timezone specific)
 *
 * This ensures that if the user sees 08:00 in the app, the calendar event is 08:00
 * in their current local time, wherever they are.
 *
 * @param date - Date string in "YYYY-MM-DD" format.
 * @param time - Time string in "HH:mm" format.
 * @returns The formatted iCalendar date-time string.
 */
export function toICalDateTime(date: string, time: string): string {
  const [year, month, day] = date.split("-").map((v) => parseInt(v, 10));
  const [hour, minute] = time.split(":").map((v) => parseInt(v, 10));

  const pad = (n: number) => n.toString().padStart(2, "0");

  const yyyy = year.toString().padStart(4, "0");
  const mm = pad(month);
  const dd = pad(day);
  const hh = pad(hour);
  const min = pad(minute);
  const sec = "00";

  return `${yyyy}${mm}${dd}T${hh}${min}${sec}`;
}

/**
 * Generates and triggers a download of an ICS file for the given medication schedule.
 *
 * @param schedule - Array of dose slots to include in the calendar.
 * @param fileName - The desired name for the downloaded file (without extension).
 * @param clinicName - Optional clinic name for customization.
 * @param clinicName - Optional clinic name for customization.
 * @param actionLabel - Label for the action (e.g. "Drop", "Pill").
 */
export function downloadScheduleIcs(schedule: DoseSlot[], fileName: string, clinicName?: string, actionLabel: string = "Action", locale: string = "he"): void {
  if (!schedule || schedule.length === 0) {
    console.warn("downloadScheduleIcs: Empty schedule provided.");
    return;
  }

  const lines: string[] = [
    ICS_CONSTANTS.BEGIN_CALENDAR,
    ICS_CONSTANTS.VERSION,
    ICS_CONSTANTS.CALSCALE,
  ];

  // Group slots by date and time
  const groupedSlots = new Map<string, DoseSlot[]>();

  schedule.forEach((slot) => {
    const key = `${slot.date}|${slot.time}`;
    if (!groupedSlots.has(key)) {
      groupedSlots.set(key, []);
    }
    groupedSlots.get(key)!.push(slot);
  });

  groupedSlots.forEach((slots, key) => {
    const [date, time] = key.split("|");
    const dtStart = toICalDateTime(date, time);
    const dtEnd = dtStart;

    // Combine medication names
    const medNames = slots.map((s) => resolveLocalizedString(s.medicationName, locale)).join(", ");

    // Combine notes (if any)
    const notes = slots
      .map((s) => (s.notes ? `${resolveLocalizedString(s.medicationName, locale)}: ${resolveLocalizedString(s.notes, locale)}` : null))
      .filter(Boolean)
      .join("\\n");

    const eventSummary = clinicName
      ? `${medNames} - ${clinicName}`
      : medNames;

    lines.push(ICS_CONSTANTS.BEGIN_EVENT);
    lines.push(`UID:${date}-${time.replace(":", "")}@shaathtipa`);
    lines.push(`DTSTAMP:${dtStart}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${eventSummary}`);

    if (notes) {
      lines.push(`DESCRIPTION:${notes}`);
    }

    // Alarm configuration: 5 minutes before the event
    lines.push(ICS_CONSTANTS.BEGIN_ALARM);
    lines.push(ICS_CONSTANTS.ALARM_TRIGGER);
    lines.push(ICS_CONSTANTS.ALARM_ACTION);
    lines.push(`DESCRIPTION:${actionLabel} Reminder: ${medNames}`);
    lines.push(ICS_CONSTANTS.END_ALARM);

    lines.push(ICS_CONSTANTS.END_EVENT);
  });

  lines.push(ICS_CONSTANTS.END_CALENDAR);

  const blob = new Blob([lines.join("\r\n")], {
    type: "text/calendar;charset=utf-8",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
