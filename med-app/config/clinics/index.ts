import { ClinicConfig } from "./types";
import { defaultClinic } from "./default";
import { einTalClinic } from "./ein-tal";
import { moserClinic } from "./moser-clinic";

export const CLINICS: Record<string, ClinicConfig> = {
    [defaultClinic.slug]: defaultClinic,
    [einTalClinic.slug]: einTalClinic,
    [moserClinic.slug]: moserClinic,
    // Add more clinics here
};

export function getClinicConfig(slug?: string | null): ClinicConfig {
    if (!slug) return defaultClinic;
    return CLINICS[slug] || defaultClinic;
}

export { defaultClinic };
export * from "./types";
