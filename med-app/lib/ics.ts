// app/lib/ics.ts

import type { DoseSlot } from "../types/prescription";

function toICalDateTime(date: string, time: string): string {
  const [year, month, day] = date.split("-").map((v) => parseInt(v, 10));
  const [hour, minute] = time.split(":").map((v) => parseInt(v, 10));
  const local = new Date(year, month - 1, day, hour, minute);

  const yyyy = local.getUTCFullYear().toString().padStart(4, "0");
  const mm = (local.getUTCMonth() + 1).toString().padStart(2, "0");
  const dd = local.getUTCDate().toString().padStart(2, "0");
  const hh = local.getUTCHours().toString().padStart(2, "0");
  const min = local.getUTCMinutes().toString().padStart(2, "0");
  const sec = local.getUTCSeconds().toString().padStart(2, "0");
  return `${yyyy}${mm}${dd}T${hh}${min}${sec}Z`;
}

export function downloadScheduleIcs(schedule: DoseSlot[], fileName: string): void {
  const lines: string[] = [];
  lines.push("BEGIN:VCALENDAR");
  lines.push("VERSION:2.0");
  lines.push("CALSCALE:GREGORIAN");

  schedule.forEach((slot) => {
    const dtStart = toICalDateTime(slot.date, slot.time);
    const dtEnd = dtStart;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${slot.id}@shaathtipa`);
    lines.push(`DTSTAMP:${dtStart}`);
    lines.push(`DTSTART:${dtStart}`);
    lines.push(`DTEND:${dtEnd}`);
    lines.push(`SUMMARY:${slot.medicationName}`);

    // תיאור קיים (אם יש)
    if (slot.notes) {
      lines.push(`DESCRIPTION:${slot.notes}`);
    }

    // ✅ ההתראה 5 דקות לפני
    lines.push("BEGIN:VALARM");
    lines.push("TRIGGER:-PT5M");
    lines.push("ACTION:DISPLAY");
    lines.push(`DESCRIPTION:תזכורת לטיפה: ${slot.medicationName}`);
    lines.push("END:VALARM");

    lines.push("END:VEVENT");
  });

  lines.push("END:VCALENDAR");

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
