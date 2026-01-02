import { buildProtocolSchedule, ImpossibleScheduleError } from "@/domain/scheduling/schedule-builder";
import { resolveProtocol } from "@/domain/protocols/protocol-resolver";
import type { ProtocolScheduleInput, DoseSlot } from "@/types/prescription";
import { IClinicRepository } from "@/domain/contracts/clinic-repository";
import { ILogger } from "@/domain/contracts/logging";

export interface GenerateScheduleResult {
    prescription: ProtocolScheduleInput;
    schedule: DoseSlot[];
}

export class ScheduleService {
    constructor(
        private clinicRepository: IClinicRepository,
        private logger: ILogger
    ) { }

    /**
     * Generates a protocol schedule based on the input.
     * Resolves protocol and medications if they are not pre-provided.
     */
    async generate(input: ProtocolScheduleInput): Promise<GenerateScheduleResult> {
        let medications = input.medications;
        let isAsNeeded = false;

        // Resolve medications from config if not provided in the request
        if (!medications || medications.length === 0) {
            const clinicConfig = this.clinicRepository.getClinicConfig(input.clinicSlug);
            const protocol = resolveProtocol(clinicConfig, input.protocolKey);

            if (protocol.kind === "AS_NEEDED") {
                isAsNeeded = true;
            }
            medications = protocol.actions;
        }

        const prescription: ProtocolScheduleInput = {
            ...input,
            medications: medications!,
        };

        if (isAsNeeded) {
            return {
                prescription,
                schedule: [],
            };
        }

        const clinicConfig = this.clinicRepository.getClinicConfig(input.clinicSlug);
        const schedule = buildProtocolSchedule(prescription, clinicConfig, this.logger);

        return {
            prescription,
            schedule,
        };
    }
}

export { ImpossibleScheduleError };
