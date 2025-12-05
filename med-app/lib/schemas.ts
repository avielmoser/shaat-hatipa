import { z } from "zod";

export const phaseSchema = z.object({
    dayStart: z.number().int().min(1),
    dayEnd: z.number().int().min(1),
    timesPerDay: z.number().int().min(1).max(24),
}).refine((data) => data.dayEnd >= data.dayStart, {
    message: "dayEnd must be greater than or equal to dayStart",
    path: ["dayEnd"],
}).refine((data) => data.dayEnd <= 365, {
    message: "dayEnd cannot exceed 365 days",
    path: ["dayEnd"],
});

export const medicationSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    notes: z.string().optional(),
    phases: z.array(phaseSchema).min(1),
});

export const laserPrescriptionInputSchema = z.object({
    surgeryType: z.enum(["INTERLASIK", "PRK", "CUSTOM"]),
    surgeryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    wakeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
    sleepTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
    medications: z.array(medicationSchema).min(1),
}).refine((data) => data.wakeTime !== data.sleepTime, {
    message: "Wake time and sleep time cannot be the same",
    path: ["sleepTime"],
});

// Schema to detect impossible schedules (e.g., too many drops for the awake window)
export const impossibleScheduleSchema = z.object({
    totalDrops: z.number(),
    awakeMinutes: z.number(),
}).refine((data) => {
    // If average time between drops is less than 5 minutes, it's likely impossible/unsafe
    // This is a heuristic; real logic is in the builder, but this catches extreme cases early.
    if (data.totalDrops === 0) return true;
    return (data.awakeMinutes / data.totalDrops) >= 5;
}, {
    message: "Schedule is too dense (less than 5 minutes between drops on average). Please extend awake window or reduce drops.",
    path: ["totalDrops"],
});
