import { z } from "zod";

export const phaseSchema = z.object({
    dayStart: z.number().int().min(1),
    dayEnd: z.number().int().min(1),
    timesPerDay: z.number().int().min(0).max(24), // Relaxed to 0 for As-Needed or Interval-based
    intervalHours: z.number().min(0).optional(),
}).refine((data) => data.dayEnd >= data.dayStart, {
    message: "dayEnd must be greater than or equal to dayStart",
    path: ["dayEnd"],
}).refine((data) => data.dayEnd <= 365, {
    message: "dayEnd cannot exceed 365 days",
    path: ["dayEnd"],
});

export const actionInstructionSchema = z.union([
    z.object({ type: z.literal("wait_between_actions"), minutes: z.number(), appliesToActionIds: z.array(z.string()).optional() }),
    z.object({ type: z.literal("avoid_food"), appliesToActionIds: z.array(z.string()).optional() }),
    z.object({ type: z.literal("separate_medications"), appliesToActionIds: z.array(z.string()).optional() }),
    z.object({
        type: z.literal("note"),
        messageKey: z.string(),
        params: z.record(z.string(), z.string().or(z.number())).optional(),
        appliesToActionIds: z.array(z.string()).optional()
    }),
]);

export const protocolActionSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    notes: z.string().optional(),
    phases: z.array(phaseSchema).min(1),
    minDurationMinutes: z.number().min(0).optional(),
    color: z.string().optional(),
    route: z.enum(["eye_drop", "oral", "other"]).optional(),
    instructions: z.array(actionInstructionSchema).optional(),
});

export const medicationSchema = protocolActionSchema;

export const protocolScheduleInputSchema = z.object({
    clinicSlug: z.string().min(1).default('default'), // New required field for resolution
    protocolKey: z.string().min(1), // New required field
    surgeryType: z.string().optional(), // Legacy compat
    surgeryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
    wakeTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
    sleepTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid time format (HH:mm)"),
    medications: z.array(protocolActionSchema).optional(), // Now optional, resolved server-side if missing
}).refine((data) => data.wakeTime !== data.sleepTime, {
    message: "Wake time and sleep time cannot be the same",
    path: ["sleepTime"],
});

export const laserPrescriptionInputSchema = protocolScheduleInputSchema;

// Schema to detect impossible schedules
export const impossibleScheduleSchema = z.object({
    totalDrops: z.number(),
    awakeMinutes: z.number(),
    minDurationPerAction: z.number().default(5), // Default to 5 if not provided
}).refine((data) => {
    if (data.totalDrops === 0) return true;
    // Use the dynamic duration instead of hardcoded 5
    // However, this schema is often used with a single aggregate "totalDrops". 
    // Ideally we validate per-medication, but this is a rough heuristic schema.
    // We will keep the heuristic logic simple but allow the threshold to be passed in.
    return (data.awakeMinutes / data.totalDrops) >= data.minDurationPerAction;
}, {
    message: "Schedule is too dense for the required action duration. Please extend awake window or reduce actions.",
    path: ["totalDrops"],
});
