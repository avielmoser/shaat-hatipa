// lib/ics.ts
import type { DoseSlot } from "../types/prescription";

// המרה מתאריך "2025-11-13" ושעה "07:00" לפורמט ICS: 20251113T070000
function toIcsDateTime(date: string, time: string): string {
  const [year, month, day] = date.split("-");
  const [hour, minute] = time.split(":");
  return `${year}${month}${day}T${hour}${minute}00`;
}

// -----------------------------------------------------
// גרופינג לפי תאריך + שעה
// -----------------------------------------------------
function groupSlotsByDateTime(schedule: DoseSlot[]) {
  const groups: Record<string, DoseSlot[]> = {};

  schedule.forEach((slot) => {
    const key = `${slot.date} ${slot.time}`;
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(slot);
  });

  return groups;
}

// -----------------------------------------------------
// בניית ICS — אירוע אחד לכל שעה
// -----------------------------------------------------
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

  const grouped = groupSlotsByDateTime(schedule);

  Object.entries(grouped).forEach(([key, slots], i) => {
    const [date, time] = key.split(" ");
    const dt = toIcsDateTime(date, time);

    // 📝 כותרת — כל התרופות של אותה שעה
    const summary = `טיפות בשעה ${time}`;

    // 📝 תיאור — רשימת כל התרופות + הערות אם יש
    const description = slots
      .map((s) => {
        const note = s.notes ? ` (${s.notes})` : "";
        return `• ${s.medicationName}${note}`;
      })
      .join("\\n");

    const uid = `drops-${date}-${time}-${i}@shaattahtipa`;

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

// -----------------------------------------------------
// הורדת ICS
// -----------------------------------------------------
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
