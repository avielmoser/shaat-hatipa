import { buildProtocolSchedule, ImpossibleScheduleError } from '../lib/domain/schedule-builder';
import type { ProtocolScheduleInput, ProtocolAction } from '../types/prescription';

describe('buildProtocolSchedule', () => {
    const baseInput: ProtocolScheduleInput = {
        surgeryType: 'INTERLASIK',
        surgeryDate: '2025-01-01',
        wakeTime: '08:00',
        sleepTime: '22:00', // 14 hour window (840 mins)
        medications: [],
    };

    it('should schedule pills (0 min duration) correctly', () => {
        const pills: ProtocolAction = {
            id: 'pill-1',
            name: 'Painkiller',
            minDurationMinutes: 0,
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 4 }],
        };

        const result = buildProtocolSchedule({ ...baseInput, medications: [pills] });
        expect(result.length).toBe(4);
        // Check that schedule is created. 
        // Times should be distributed.
    });

    it('should schedule physio (20 min duration) without overlap', () => {
        const physio: ProtocolAction = {
            id: 'physio-1',
            name: 'Knee Bend',
            minDurationMinutes: 20,
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 5 }],
        };

        // 5 times * 20 min = 100 min required. Window is 840 min. Feasible.
        const result = buildProtocolSchedule({ ...baseInput, medications: [physio] });
        expect(result.length).toBe(5);

        // Verify no overlap
        // Convert times to minutes
        const times = result.map(s => {
            const [h, m] = s.time.split(':').map(Number);
            return h * 60 + m;
        }).sort((a, b) => a - b);

        for (let i = 0; i < times.length - 1; i++) {
            // Next start must be >= current start + 20
            expect(times[i + 1]).toBeGreaterThanOrEqual(times[i] + 20);
        }
    });

    it('should handle mixed durations (0 and 20 min)', () => {
        const pill: ProtocolAction = {
            id: 'pill-1',
            name: 'Pill',
            minDurationMinutes: 0,
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 2 }],
        };
        const physio: ProtocolAction = {
            id: 'physio-1',
            name: 'Physio',
            minDurationMinutes: 20,
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 2 }],
        };

        // This should just work without collision if distributed well.
        const result = buildProtocolSchedule({ ...baseInput, medications: [pill, physio] });
        expect(result.length).toBe(4);
    });

    it('should throw ImpossibleScheduleError if too dense', () => {
        const physio: ProtocolAction = {
            id: 'physio-heavy',
            name: 'Intense Rehab',
            minDurationMinutes: 60,
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 20 }], // 1200 mins needed, window 840
        };

        expect(() => {
            buildProtocolSchedule({ ...baseInput, medications: [physio] });
        }).toThrow(ImpossibleScheduleError);
    });

    it('should respect laser default 5 min spacing if explicitly set', () => {
        // Simulate backward compatibility input where we manually set 5
        const drops: ProtocolAction = {
            id: 'drop-1',
            name: 'Tears',
            minDurationMinutes: 5,
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 10 }],
        };
        const result = buildProtocolSchedule({ ...baseInput, medications: [drops] });
        expect(result.length).toBe(10);

        const times = result.map(s => {
            const [h, m] = s.time.split(':').map(Number);
            return h * 60 + m;
        }).sort((a, b) => a - b);

        for (let i = 0; i < times.length - 1; i++) {
            expect(times[i + 1]).toBeGreaterThanOrEqual(times[i] + 5);
        }
    });
});
