// lib/pdf.ts
// Utility for generating and printing a PDF schedule. Groups dose slots
// by day and time, builds an HTML document, and opens a new window to
// print or save as PDF. Also includes helpers for safe HTML and date formatting.

import { getMedicationColor } from "../theme/medicationColors";
import type { DoseSlot } from "../../types/prescription";

// Escape HTML special characters to prevent injection.
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Group dose slots by date.
function groupByDate(schedule: DoseSlot[]): { date: string; slots: DoseSlot[] }[] {
  const map = new Map<string, DoseSlot[]>();
  schedule.forEach((slot) => {
    if (!map.has(slot.date)) {
      map.set(slot.date, []);
    }
    map.get(slot.date)!.push(slot);
  });
  return Array.from(map.entries()).map(([date, slots]) => ({ date, slots }));
}

// Group dose slots by time within a date.
function groupByTime(slots: DoseSlot[]): { time: string; slots: DoseSlot[] }[] {
  const map = new Map<string, DoseSlot[]>();
  slots.forEach((slot) => {
    if (!map.has(slot.time)) {
      map.set(slot.time, []);
    }
    map.get(slot.time)!.push(slot);
  });
  return Array.from(map.entries()).map(([time, s]) => ({ time, slots: s }));
}

// Format a date string (yyyy-mm-dd) as dd/mm/yy.
function formatDateShort(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year.slice(-2)}`;
}

// Build the printable HTML document for the schedule.
function buildPrintableHtml(schedule: DoseSlot[], fileName: string, clinicName?: string): string {
  const dayGroups = groupByDate(schedule);
  const parts: string[] = [];
  const title = clinicName
    ? `${clinicName} – Post-surgery schedule`
    : `ShaatHaTipa – Post-surgery schedule`;

  parts.push(
    `<!DOCTYPE html><html dir="ltr" lang="en"><head><meta charSet="utf-8"><title>${escapeHtml(
      title,
    )}</title><style>
    body{font-family:Arial,sans-serif;margin:24px;background:#fafafa;color:#0f172a;}
    h1{font-size:20px;margin-bottom:12px;}
    h2{font-size:16px;margin:18px 0 8px;}
    table{width:100%;border-collapse:collapse;margin-bottom:16px;font-size:12px;}
    th,td{border:1px solid #e2e8f0;padding:6px 8px;text-align:left;}
    th{background:#e5f2ff;}
    .chip{display:inline-block;margin:2px;padding:2px 6px;border-radius:999px;border:1px solid;line-height:1;}
    </style></head><body>`,
  );
  parts.push(`<h1>${escapeHtml(title)}</h1>`);
  if (dayGroups.length === 0) {
    parts.push(`<p style="text-align:center;color:#64748b;margin-top:40px;">No doses scheduled for this period.</p>`);
  } else {
    dayGroups.forEach((day) => {
      const timeGroups = groupByTime(day.slots);
      parts.push(`<h2>Day ${day.slots[0].dayIndex} • ${escapeHtml(day.date)}</h2>`);
      parts.push(`<table><thead><tr><th>Time</th><th>Drops</th><th>Notes</th></tr></thead><tbody>`);
      timeGroups.forEach((tg) => {
        const medsHtml = tg.slots
          .map((s) => {
            const color = getMedicationColor(s.medicationName, s.id) ?? "#0f172a";
            return `<span class="chip" style="color:${color};border-color:${color};background-color:${color}22;">${escapeHtml(
              s.medicationName,
            )}</span>`;
          })
          .join(" ");
        const notesSet = new Set(
          tg.slots
            .map((s) => s.notes?.trim())
            .filter((n): n is string => !!n),
        );
        const notes = notesSet.size > 0 ? Array.from(notesSet).join(" • ") : "";
        parts.push(
          `<tr><td>${escapeHtml(tg.time)}</td><td>${medsHtml}</td><td>${escapeHtml(
            notes,
          )}</td></tr>`,
        );
      });
      parts.push("</tbody></table>");
    });
  }
  parts.push("</body></html>");
  return parts.join("");
}

/**
 * Open a new window and print the schedule as a PDF.
 * @param schedule - Array of dose slots to export
 * @param fileName - The desired filename (without extension)
 * @param clinicName - Optional clinic name for branding
 */
export function openSchedulePdf(schedule: DoseSlot[], fileName: string, clinicName?: string): void {
  if (typeof window === "undefined") return;
  // Append .pdf to file name for printing.
  const html = buildPrintableHtml(schedule, fileName, clinicName);
  const newWindow = window.open("", "_blank");
  if (!newWindow) return;
  newWindow.document.write(html);
  newWindow.document.close();
  // Delay printing slightly to allow the document to render.
  setTimeout(() => {
    newWindow.print();
    newWindow.close();
  }, 500);
}
