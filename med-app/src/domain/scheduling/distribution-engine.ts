import type { DoseSlot, ProtocolAction } from "@/types/prescription";
import { parseTimeToMinutes, roundToHalfHour, minutesToTimeStr, addDays } from "@/domain/utils/time";

/**
 * Distributes doses for a specific action and phase across the awake window.
 */
export function distributeDoses(
    med: ProtocolAction,
    surgeryDate: string,
    wakeMinutes: number,
    awakeWindow: number,
    color: string,
    startCounter: number
): { slots: DoseSlot[]; nextCounter: number } {
    const slots: DoseSlot[] = [];
    let currentCounter = startCounter;

    med.phases.forEach((phase) => {
        const { dayStart, dayEnd, timesPerDay, intervalHours } = phase;
        if (dayEnd < dayStart) return;
        const daysCount = dayEnd - dayStart + 1;

        let effectiveInterval = 0;
        let iterations = timesPerDay;

        if (intervalHours && intervalHours > 0) {
            effectiveInterval = intervalHours * 60;
            const possibleDoses = Math.floor(awakeWindow / effectiveInterval) + 1;
            if (timesPerDay > 0) {
                iterations = Math.min(possibleDoses, timesPerDay);
            } else {
                iterations = possibleDoses;
            }
        } else if (timesPerDay > 0) {
            effectiveInterval = awakeWindow / timesPerDay;
        } else {
            return;
        }

        for (let dayOffset = 0; dayOffset < daysCount; dayOffset++) {
            const absoluteDayIndex = dayStart - 1 + dayOffset;
            for (let doseIndex = 0; doseIndex < iterations; doseIndex++) {
                const rawRelativeMinutes = wakeMinutes + (effectiveInterval * doseIndex);
                const roundedMinutes = roundToHalfHour(rawRelativeMinutes);

                const dayCarry = Math.floor(roundedMinutes / (24 * 60));
                const minutesWithinDay = roundedMinutes % (24 * 60);
                const date = addDays(surgeryDate, absoluteDayIndex + dayCarry);
                const time = minutesToTimeStr(minutesWithinDay);

                slots.push({
                    id: `slot-${currentCounter++}`,
                    medicationId: med.id,
                    medicationName: med.name,
                    medicationColor: color,
                    date,
                    time,
                    dayIndex: absoluteDayIndex + dayCarry,
                    notes: med.notes,
                    instructions: med.instructions,
                    actions: [med],
                });
            }
        }
    });

    return { slots, nextCounter: currentCounter };
}
