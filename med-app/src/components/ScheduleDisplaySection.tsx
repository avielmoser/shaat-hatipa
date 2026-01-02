// components/ScheduleDisplaySection.tsx
"use client";

import { useLocale } from "next-intl";
import type { DoseSlot } from "../types/prescription";
import { resolveLocalizedString } from "@/domain/utils/i18n";
import { Card, CardContent } from "./ui/card";

interface ScheduleDisplaySectionProps {
  schedule: DoseSlot[];
}

export default function ScheduleDisplaySection({
  schedule,
}: ScheduleDisplaySectionProps) {
  const locale = useLocale();

  if (!schedule || schedule.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <Card className="border-slate-200 bg-white/90 shadow-lg">
        <CardContent className="p-4">
          <h2 className="mb-2 text-sm font-semibold text-slate-900">
            לוח זמנים לטיפות (תצוגה כללית)
          </h2>

          <div className="max-h-64 space-y-1 overflow-y-auto text-xs text-slate-700">
            {schedule.map((slot) => (
              <div
                key={slot.id}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5"
              >
                <span className="font-medium">
                  {slot.date} • {slot.time}
                </span>
                <span>{resolveLocalizedString(slot.medicationName, locale)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
