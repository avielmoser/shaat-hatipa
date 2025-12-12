import { ClinicConfig } from "./types";
import { defaultClinic } from "./default";
import { einTalClinic } from "./ein-tal";

const CLINICS: Record<string, ClinicConfig> = {
    [defaultClinic.slug]: defaultClinic,
    [einTalClinic.slug]: einTalClinic,
    // Add more clinics here
};

export function getClinicConfig(slug?: string | null): ClinicConfig {
    if (!slug) return defaultClinic;
    return CLINICS[slug] || defaultClinic;
}

export { defaultClinic };
export * from "./types";
