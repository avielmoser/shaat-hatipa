import { useState } from 'react';
import { DoseSlot, LaserPrescriptionInput } from '../types/prescription';
import { buildLaserSchedule } from '../lib/domain/schedule-builder';

export function useSchedule() {
    const [schedule, setSchedule] = useState<DoseSlot[]>([]);

    const generate = (input: LaserPrescriptionInput) => {
        const newSchedule = buildLaserSchedule(input);
        setSchedule(newSchedule);
    };

    return {
        schedule,
        generate,
    };
}
