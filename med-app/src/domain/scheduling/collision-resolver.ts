import type { DoseSlot, ProtocolAction } from "@/types/prescription";
import { ILogger } from "@/domain/contracts/logging";
import { parseTimeToMinutes, minutesToTimeStr } from "@/domain/utils/time";

/**
 * Determine whether a candidate minute value (0–1439) falls within the user's awake window.
 */
export function isWithinAwakeWindow(
    candidateMinutes: number,
    wakeMinutes: number,
    normalizedSleepMinutes: number,
    duration: number = 0
): boolean {
    const minutesInDay = 24 * 60;
    const start = candidateMinutes;
    const end = start + duration;

    const checkPoint = (pt: number) => {
        const ptNorm = ((pt % minutesInDay) + minutesInDay) % minutesInDay;
        if (normalizedSleepMinutes > minutesInDay) {
            const sleepMod = normalizedSleepMinutes % minutesInDay;
            return (ptNorm >= wakeMinutes) || (ptNorm <= sleepMod);
        } else {
            return ptNorm >= wakeMinutes && ptNorm <= normalizedSleepMinutes;
        }
    };

    return checkPoint(start) && checkPoint(end - 1);
}

/**
 * Helper to check if a range [start, end) overlaps with any occupied range.
 */
export function isRangeOccupied(
    start: number,
    duration: number,
    occupiedIntervals: { start: number, end: number }[]
): boolean {
    const minutesInDay = 24 * 60;
    const s1 = ((start % minutesInDay) + minutesInDay) % minutesInDay;
    const e1 = s1 + duration;

    const rangesToCheck: { s: number, e: number }[] = [];
    if (e1 > minutesInDay) {
        rangesToCheck.push({ s: s1, e: minutesInDay });
        rangesToCheck.push({ s: 0, e: e1 % minutesInDay });
    } else {
        rangesToCheck.push({ s: s1, e: e1 });
    }

    for (const check of rangesToCheck) {
        for (const occ of occupiedIntervals) {
            if (Math.max(check.s, occ.start) < Math.min(check.e, occ.end)) {
                return true;
            }
        }
    }
    return false;
}

export function markRangeOccupied(
    start: number,
    duration: number,
    occupiedIntervals: { start: number, end: number }[]
) {
    const minutesInDay = 24 * 60;
    const s1 = ((start % minutesInDay) + minutesInDay) % minutesInDay;
    const e1 = s1 + duration;

    if (e1 > minutesInDay) {
        occupiedIntervals.push({ start: s1, end: minutesInDay });
        occupiedIntervals.push({ start: 0, end: e1 % minutesInDay });
    } else {
        occupiedIntervals.push({ start: s1, end: e1 });
    }
}

/**
 * Resolve collisions for the same action on a per-day basis. 
 */
export function resolveActionCollisions(
    slots: DoseSlot[],
    wakeMinutes: number,
    normalizedSleepMinutes: number,
    actionsById: Map<string, ProtocolAction>,
    logger?: ILogger
): void {
    const groupMap = new Map<string, DoseSlot[]>();
    for (const slot of slots) {
        const key = `${slot.date}|${slot.medicationId}`;
        if (!groupMap.has(key)) groupMap.set(key, []);
        groupMap.get(key)!.push(slot);
    }

    for (const group of groupMap.values()) {
        group.sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));
        const occupiedIntervals: { start: number, end: number }[] = [];
        const actionId = group[0].medicationId;
        const action = actionsById.get(actionId);

        const duration = action?.minDurationMinutes ?? 0;
        const effectiveDuration = Math.max(duration, 1);

        for (const slot of group) {
            const origMinutes = parseTimeToMinutes(slot.time);
            let candidate = origMinutes;
            let found = false;

            if (!isRangeOccupied(candidate, effectiveDuration, occupiedIntervals)) {
                found = true;
            } else {
                const maxSteps = 12; // up to ±180 minutes
                for (let step = 1; step <= maxSteps; step++) {
                    const offsets = [step * 15, -step * 15];
                    for (const offset of offsets) {
                        const newMin = origMinutes + offset;
                        const minutesInDay = 24 * 60;
                        const normalizedNewMin = ((newMin % minutesInDay) + minutesInDay) % minutesInDay;

                        if (!isWithinAwakeWindow(normalizedNewMin, wakeMinutes, normalizedSleepMinutes, effectiveDuration)) continue;
                        if (isRangeOccupied(normalizedNewMin, effectiveDuration, occupiedIntervals)) continue;

                        candidate = normalizedNewMin;
                        found = true;
                        break;
                    }
                    if (found) break;
                }
            }

            if (!found) {
                if (logger) logger.warn("Could not resolve collision for slot", "COLLISION_RESOLVER", { slot });
            }

            markRangeOccupied(candidate, effectiveDuration, occupiedIntervals);
            slot.time = minutesToTimeStr(candidate);
        }
    }
}
