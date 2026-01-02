
import { buildProtocolSchedule } from '@/domain/scheduling/schedule-builder';
import type { ProtocolScheduleInput, ProtocolAction } from '@/types/prescription';
import { defaultClinic } from '@/config/clinics/default';

describe('Cross-Medication Collision Repro', () => {
    const baseInput: ProtocolScheduleInput = {
        clinicSlug: 'default',
        protocolKey: 'TEST',
        surgeryType: 'TEST',
        surgeryDate: '2025-01-01',
        wakeTime: '08:00',
        sleepTime: '22:00', // 14 hours
        medications: [],
    };

    it('should NOT overlap two different medications with duration', () => {
        const medA: ProtocolAction = {
            id: 'med-a',
            name: 'Med A',
            minDurationMinutes: 30,
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 1 }], // Should be at 08:00
        };
        const medB: ProtocolAction = {
            id: 'med-b',
            name: 'Med B',
            minDurationMinutes: 30,
            phases: [{ dayStart: 1, dayEnd: 1, timesPerDay: 1 }], // Should be at 08:00
        };

        // Both are "distributed" 1/day, so both default to start at wakeTime (08:00)
        // If engine handles cross-medication collision, one should shift to 08:30.

        const result = buildProtocolSchedule(
            { ...baseInput, medications: [medA, medB] },
            defaultClinic
        );

        const slotA = result.find(s => s.medicationId === 'med-a');
        const slotB = result.find(s => s.medicationId === 'med-b');

        // Expect times to be different
        expect(slotA?.time).not.toBe(slotB?.time);
    });
});
