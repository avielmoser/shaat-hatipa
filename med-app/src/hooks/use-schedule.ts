import { useState } from 'react';
import { DoseSlot, LaserPrescriptionInput } from '../types/prescription';
import { buildLaserSchedule } from '@/domain/scheduling/schedule-builder';
import { getClinicConfig } from '@/config/clinics';

export function useSchedule() {
    const [schedule, setSchedule] = useState<DoseSlot[]>([]);

    const generate = (input: LaserPrescriptionInput) => {
        const clinicConfig = getClinicConfig(input.clinicSlug);
        const newSchedule = buildLaserSchedule(input, clinicConfig);
        setSchedule(newSchedule);
    };

    return {
        schedule,
        generate,
    };
}
