import { buildProtocolSchedule, ImpossibleScheduleError } from '../lib/domain/schedule-builder';
import type { ProtocolScheduleInput, ProtocolAction } from '../types/prescription';

describe('buildProtocolSchedule', () => {
    const baseInput: ProtocolScheduleInput = {
        clinicSlug: 'default',
        protocolKey: 'INTERLASIK',
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

    it('should schedule interval-based actions (q6h)', () => {
        const headache: ProtocolAction = {
            id: 'headache',
            name: 'Acamol',
            minDurationMinutes: 0,
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 0, intervalHours: 6 }],
        };

        // Window 08:00 - 22:00 (14h = 840m)
        // q6h = 08:00, 14:00, 20:00 (next 26:00 out of window)
        const result = buildProtocolSchedule({ ...baseInput, medications: [headache] });
        expect(result.length).toBe(3);
        const times = result.map(s => s.time).sort();
        expect(times).toEqual(['08:00', '14:00', '20:00']);
    });

    it('should handle as-needed actions (timesPerDay: 0, no interval)', () => {
        const eyePain: ProtocolAction = {
            id: 'eye-pain',
            name: 'Drops',
            minDurationMinutes: 0,
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 0 }],
        };

        const result = buildProtocolSchedule({ ...baseInput, medications: [eyePain] });
        expect(result.length).toBe(0);
    });

    it('should mix interval and distributed actions', () => {
        const q6h: ProtocolAction = {
            id: 'q6h',
            name: 'Fixed',
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 0, intervalHours: 6 }],
        };
        const dist: ProtocolAction = {
            id: 'dist',
            name: 'Distributed',
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 2 }], // 08:00, 15:00 (approx)
        };

        const result = buildProtocolSchedule({ ...baseInput, medications: [q6h, dist] });
        const q6hSlots = result.filter(s => s.medicationId === 'q6h');
        const distSlots = result.filter(s => s.medicationId === 'dist');

        expect(q6hSlots.length).toBe(3);
        expect(distSlots.length).toBe(2);
    });
});
