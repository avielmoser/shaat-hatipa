import { ClinicConfig } from "@/config/clinics/types";

export interface IClinicRepository {
    /**
     * Resolves a clinic configuration by its slug.
     */
    getClinicConfig(slug?: string | null): ClinicConfig;
}
