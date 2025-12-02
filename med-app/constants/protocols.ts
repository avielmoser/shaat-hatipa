import { Medication } from "../types/prescription";

/**
 * Returns the medication protocol for Interlasik surgery.
 * The Sterodex dosage on Day 1 depends on the awake window (hourly doses).
 */
export function getInterlasikMedications(awakeWindowMinutes: number): Medication[] {
    const hourlyDoses = Math.max(1, Math.floor(awakeWindowMinutes / 60));

    return [
        {
            id: "sterodex",
            name: "Sterodex",
            notes: "",
            phases: [
                // Day 1 – Every hour while awake
                { dayStart: 1, dayEnd: 1, timesPerDay: hourlyDoses },

                // Days 2–4 – 6 times a day
                { dayStart: 2, dayEnd: 4, timesPerDay: 6 },

                // Days 5–7 – 4 times a day
                { dayStart: 5, dayEnd: 7, timesPerDay: 4 },
            ],
        },

        {
            id: "vigamox",
            name: "Vigamox",
            notes: "",
            phases: [
                // Days 1–7 – 4 times a day
                { dayStart: 1, dayEnd: 7, timesPerDay: 4 },
            ],
        },

        {
            id: "systane-balance",
            name: "Systane Balance",
            notes: "",
            phases: [
                // Days 1–7 – 6 times a day
                { dayStart: 1, dayEnd: 7, timesPerDay: 6 },

                // Days 8–32 – 4 times a day
                { dayStart: 8, dayEnd: 32, timesPerDay: 4 },
            ],
        },
    ];
}

/**
 * Returns the medication protocol for PRK surgery.
 * This protocol is static and does not depend on the awake window.
 */
export function getPrkMedications(): Medication[] {
    return [
        {
            id: "sterodex",
            name: "Sterodex (Dexamethasone)",
            notes: "",
            phases: [
                { dayStart: 1, dayEnd: 7, timesPerDay: 4 },
                { dayStart: 8, dayEnd: 14, timesPerDay: 3 },
                { dayStart: 15, dayEnd: 21, timesPerDay: 2 },
                { dayStart: 22, dayEnd: 28, timesPerDay: 1 },
            ],
        },
        {
            id: "vigamox",
            name: "Vigamox (Moxifloxacin 0.5%)",
            notes: "",
            phases: [{ dayStart: 1, dayEnd: 7, timesPerDay: 4 }],
        },
        {
            id: "dicloftil",
            name: "Dicloftil 0.1%",
            notes: "",
            phases: [{ dayStart: 1, dayEnd: 3, timesPerDay: 3 }],
        },
        {
            id: "systane-balance",
            name: "Systane Balance",
            notes: "",
            phases: [{ dayStart: 1, dayEnd: 30, timesPerDay: 6 }],
        },
        {
            id: "vitapos",
            name: "Vitapos (Eye Ointment)",
            notes: "",
            phases: [
                { dayStart: 8, dayEnd: 14, timesPerDay: 2 },
                { dayStart: 15, dayEnd: 21, timesPerDay: 2 },
            ],
        },
    ];
}
