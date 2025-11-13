// lib/ics.ts
import type { DoseSlot } from "../types/prescription";

// המרה מתאריך "2025-11-13" ושעה "07:00" לפורמט ICS: 20251113T070000
function toIcsDateTime(date: string, time: string): string {
  // נניח שהפורמט הוא YYYY-MM-DD ו-HH:MM
  const [year, month, day] = date.split("-");
  const [hour, minute] = time.split(":");
  return `${year}${month}${day}T${hour}${minute}00`;
}

// בניית תוכן ה-ICS עם תזכורת 5 דקות לפני כל אירוע
export function buildScheduleIcs(
  schedule: DoseSlot[],
  calendarName = "לוח טיפות אחרי ניתוח"
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//ShaatHaTipa//LaserDrops//HE",
    "CALSCALE:GREGORIAN",
    `X-WR-CALNAME:${calendarName}`,
    "METHOD:PUBLISH",
  ];

  schedule.forEach((slot, index) => {
    const dt = toIcsDateTime(slot.date, slot.time);
    const uid = slot.id ? `drop-${slot.id}@shaattahtipa` : `drop-${index}@shaattahtipa`;
    const summary = `טיפות - ${slot.medicationName}`;
    const description = slot.notes
      ? slot.notes
      : "תזכורת לטיפות לפי הפרוטוקול לאחר ניתוח לייזר";

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `SUMMARY:${summary}`,
      `DESCRIPTION:${description}`,
      `DTSTART:${dt}`,
      `DTEND:${dt}`,
      // 🔔 תזכורת 5 דקות לפני
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "DESCRIPTION:תזכורת לטיפות",
      "TRIGGER:-PT5M",
      "END:VALARM",
      "END:VEVENT"
    );
  });

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

// הורדת קובץ ICS בפועל
export function downloadScheduleIcs(
  schedule: DoseSlot[],
  fileName = "laser-drops-schedule"
) {
  const icsContent = buildScheduleIcs(schedule);
  const blob = new Blob([icsContent], {
    type: "text/calendar;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
