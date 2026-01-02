import { IClinicRepository } from "@/domain/contracts/clinic-repository";
import { ClinicConfig, getClinicConfig } from "@/config/clinics";

export class ConfigClinicRepository implements IClinicRepository {
    getClinicConfig(slug?: string | null): ClinicConfig {
        return getClinicConfig(slug);
    }
}
