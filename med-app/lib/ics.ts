import type { DoseSlot } from "../types/prescription";

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
 * Converts a date and time string into an iCalendar compliant date-time string.
 * Format: YYYYMMDDTHHmmSSZ (UTC)
 *
 * @param date - Date string in "YYYY-MM-DD" format.
 * @param time - Time string in "HH:mm" format.
 * @returns The formatted iCalendar date-time string.
 */
function toICalDateTime(date: string, time: string): string {
  const [year, month, day] = date.split("-").map((v) => parseInt(v, 10));
  const [hour, minute] = time.split(":").map((v) => parseInt(v, 10));

  // Create date object (month is 0-indexed)
  const local = new Date(year, month - 1, day, hour, minute);

  const pad = (n: number) => n.toString().padStart(2, "0");

  const yyyy = local.getUTCFullYear().toString().padStart(4, "0");
  const mm = pad(local.getUTCMonth() + 1);
  const dd = pad(local.getUTCDate());
  const hh = pad(local.getUTCHours());
  const min = pad(local.getUTCMinutes());
  const sec = pad(local.getUTCSeconds());

  return `${yyyy}${mm}${dd}T${hh}${min}${sec}`;
}

/**
 * Generates and triggers a download of an ICS file for the given medication schedule.
 *
 * @param schedule - Array of dose slots to include in the calendar.
 * @param fileName - The desired name for the downloaded file (without extension).
 * @param clinicName - Optional clinic name for customization.
 */
export function downloadScheduleIcs(schedule: DoseSlot[], fileName: string, clinicName?: string): void {
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
    const medNames = slots.map((s) => s.medicationName).join(", ");

    // Combine notes (if any)
    const notes = slots
      .map((s) => (s.notes ? `${s.medicationName}: ${s.notes}` : null))
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
    lines.push(`DESCRIPTION:Drop Reminder: ${medNames}`);
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
