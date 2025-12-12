import { buildLaserSchedule } from "../lib/domain/schedule-builder";
import { LaserPrescriptionInput, SurgeryType } from "../types/prescription";

console.log("\n--- Verifying generateSchedule ---");
const input: LaserPrescriptionInput = {
    surgeryType: "INTERLASIK" as SurgeryType,
    surgeryDate: "2025-01-01",
    wakeTime: "08:00",
    sleepTime: "22:00",
    medications: [
        {
            id: "med1",
            name: "Test Med",
            phases: [
                { dayStart: 1, dayEnd: 2, timesPerDay: 2 },
                { dayStart: 3, dayEnd: 3, timesPerDay: 1 }
            ]
        }
    ]
};

const schedule = buildLaserSchedule(input);
schedule.forEach(slot => {
    console.log(`[Day ${slot.dayIndex}] ${slot.date} ${slot.time} - ${slot.medicationName} `);
});
