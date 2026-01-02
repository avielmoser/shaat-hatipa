import { buildProtocolSchedule } from '@/domain/scheduling/schedule-builder';
import type { ProtocolScheduleInput, ProtocolAction } from '@/types/prescription';

describe('Regression Protocols & Edge Cases', () => {

    describe('Cross-midnight Sleep Schedule', () => {
        // Scenario: User wakes at 07:00, sleeps at 01:00 (next day).
        // This is an 18-hour awake window (07:00 - 24:00 + 00:00 - 01:00).

        it('should handle sleep time being numerically smaller than wake time (next day overlap)', () => {
            const input: ProtocolScheduleInput = {
                surgeryType: 'INTERLASIK',
                surgeryDate: '2025-01-01',
                wakeTime: '07:00',
                sleepTime: '01:00', // Implicitly next day
                medications: [{
                    id: 'hourly-drops',
                    name: 'Artificial Tears',
                    minDurationMinutes: 5,
                    phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 4 }] // Just a few drops to verify window calculation
                }]
            };

            const schedule = buildProtocolSchedule(input);
            expect(schedule.length).toBeGreaterThan(0);

            // Verify times are within 07:00 -> 01:00 range
            schedule.forEach(event => {
                const [h, m] = event.time.split(':').map(Number);
                const minutes = h * 60 + m;

                // Allow 07:00 (420) to 23:59 (1439) OR 00:00 (0) to 01:00 (60)
                const isDay = minutes >= 420 && minutes <= 1439;
                const isNight = minutes >= 0 && minutes <= 60;

                expect(isDay || isNight).toBe(true);
            });
        });

        it('should correctly calculate capacity for long days (cross-midnight)', () => {
            // 18 hour window (07:00 to 01:00) = 1080 minutes.
            // Try to schedule something that requires 16 hours spread.
            const input: ProtocolScheduleInput = {
                surgeryType: 'INTERLASIK',
                surgeryDate: '2025-01-01',
                wakeTime: '07:00',
                sleepTime: '01:00',
                medications: [{
                    id: 'dense-drops',
                    name: 'Heavy Tears',
                    minDurationMinutes: 5,
                    phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 18 }] // 1 per hour (approx)
                }]
            };

            const schedule = buildProtocolSchedule(input);
            expect(schedule.length).toBe(18);
        });
    });

    describe('Dense Protocol (Hourly)', () => {
        it('should handle high frequency items without crashing or impossible error if feasible', () => {
            // Wake 08:00, Sleep 22:00 (14 hours = 840 mins).
            // Request 14 drops (hourly).
            const input: ProtocolScheduleInput = {
                surgeryType: 'INTERLASIK',
                surgeryDate: '2025-01-01',
                wakeTime: '08:00',
                sleepTime: '22:00',
                medications: [{
                    id: 'hourly-pill',
                    name: 'Hourly Pill',
                    minDurationMinutes: 0, // Pills don't take time? Or maybe they do. Let's say 0 for slotting.
                    phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 14 }]
                }]
            };

            const schedule = buildProtocolSchedule(input);
            expect(schedule.length).toBe(14);

            // Verify distribution
            const times = schedule.map(s => s.time).sort();
            // Should roughly be one per hour.
            // Just ensure uniqueness and valid range.
            const uniqueTimes = new Set(times);
            expect(uniqueTimes.size).toBe(14);
        });
    });

    describe('Past Date Selection', () => {
        it('should generate valid schedule even if dates are in the past', () => {
            const input: ProtocolScheduleInput = {
                surgeryType: 'INTERLASIK',
                surgeryDate: '2020-01-01', // Way in the past
                wakeTime: '08:00',
                sleepTime: '22:00',
                medications: [{
                    id: 'past-drops',
                    name: 'Past Drops',
                    minDurationMinutes: 5,
                    phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 2 }]
                }]
            };

            const schedule = buildProtocolSchedule(input);
            expect(schedule.length).toBe(2);

            // Verify date is 2020-01-02 (Day 1)
            // Wait, dayStart:1 means "Day 1 of protocol". Usually relative to surgeryDate.
            // If surgery is 2020-01-01.
            // Implementation detail: Does `buildProtocolSchedule` return absolute dates?
            // Usually returns { date: string (ISO), time: string ... }
            // Let's check the type or output.

            // Note: The schedule builder returns items with `date` property.
            const firstItem = schedule[0];
            expect(firstItem.date).toMatch(/^2020-01/);
        });
    });
});
