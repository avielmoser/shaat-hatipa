// scripts/test-schedule-logic.ts
import { buildLaserSchedule, ImpossibleScheduleError } from "../lib/domain/schedule-builder";
import { LaserPrescriptionInput } from "../types/prescription";

const mockMeds = [
    {
        id: "vigamox",
        name: "Vigamox",
        phases: [{ dayStart: 1, dayEnd: 7, timesPerDay: 3 }]
    }
];

function runTest(name: string, input: LaserPrescriptionInput, shouldFail: boolean = false) {
    console.log(`\n--- Running Test: ${name} ---`);
    try {
        const schedule = buildLaserSchedule(input);
        if (shouldFail) {
            console.error("❌ FAILED: Expected error but got schedule");
        } else {
            console.log(`✅ PASSED: Generated ${schedule.length} slots`);
            // Basic validation
            if (schedule.length > 0) {
                console.log(`   First slot: ${schedule[0].date} ${schedule[0].time}`);
                console.log(`   Last slot:  ${schedule[schedule.length - 1].date} ${schedule[schedule.length - 1].time}`);
            }
        }
    } catch (e: any) {
        if (shouldFail) {
            console.log(`✅ PASSED: Caught expected error: ${e.message}`);
        } else {
            console.error(`❌ FAILED: Unexpected error: ${e.message}`);
            console.error(e);
        }
    }
}

// Test 1: Standard Flow
runTest("Standard Flow", {
    surgeryType: "INTERLASIK",
    surgeryDate: "2025-01-01",
    wakeTime: "08:00",
    sleepTime: "22:00",
    medications: mockMeds
});

// Test 2: Wake > Sleep (Next Day)
runTest("Wake > Sleep (Next Day)", {
    surgeryType: "INTERLASIK",
    surgeryDate: "2025-01-01",
    wakeTime: "08:00",
    sleepTime: "01:00", // 25:00
    medications: mockMeds
});

// Test 3: Tight Schedule
runTest("Tight Schedule (Late surgery)", {
    surgeryType: "INTERLASIK",
    surgeryDate: "2025-01-01",
    wakeTime: "08:00",
    sleepTime: "22:00",
    medications: [
        {
            id: "heavy",
            name: "Heavy Meds",
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 12 }] // 12 drops in 14 hours = ~1 per hour
        }
    ]
});

// Test 4: Impossible Schedule
runTest("Impossible Schedule", {
    surgeryType: "INTERLASIK",
    surgeryDate: "2025-01-01",
    wakeTime: "08:00",
    sleepTime: "09:00", // 1 hour window
    medications: [
        {
            id: "impossible",
            name: "Impossible",
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 20 }] // 20 drops in 60 mins = 3 mins/drop
        }
    ]
}, true);

// Test 5: Collisions
runTest("Collisions", {
    surgeryType: "INTERLASIK",
    surgeryDate: "2025-01-01",
    wakeTime: "08:00",
    sleepTime: "22:00",
    medications: [
        {
            id: "med1",
            name: "Med 1",
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 4 }]
        },
        {
            id: "med2",
            name: "Med 2",
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 4 }]
        }
    ]
});
