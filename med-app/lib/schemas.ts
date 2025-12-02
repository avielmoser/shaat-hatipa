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
});
