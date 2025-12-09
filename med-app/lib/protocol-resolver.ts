import { CLINICS, DEFAULT_BRAND, ClinicConfig } from "../config/clinics";
import { DEFAULT_PROTOCOLS } from "../constants/protocols";
import { Medication, SurgeryType } from "../types/prescription";

/**
 * Resolves the clinic configuration by ID.
 * Falls back to DEFAULT_BRAND if ID is invalid or not found.
 */
export function resolveClinicConfig(clinicId?: string | null): ClinicConfig {
    if (!clinicId) return DEFAULT_BRAND;
    return CLINICS[clinicId] ?? DEFAULT_BRAND;
}

/**
 * Resolves the protocol (medication list) for a given clinic and surgery type.
 * 
 * Logic:
 * 1. Check if clinic defines an override in `protocols[surgeryType]`.
 * 2. If present, execute it.
 * 3. If not, use the default protocol from DEFAULT_PROTOCOLS.
 */
export function resolveProtocol(
    clinicConfig: ClinicConfig | undefined,
    surgeryType: SurgeryType,
    awakeMinutes: number
): Medication[] {
    // 1. Try clinic override
    if (clinicConfig?.protocols) {
        const override = clinicConfig.protocols[surgeryType];
        if (override) {
            return override(awakeMinutes);
        }
    }

    // 2. Fallback to default
    const defaultFn = DEFAULT_PROTOCOLS[surgeryType as keyof typeof DEFAULT_PROTOCOLS];
    if (defaultFn) {
        return defaultFn(awakeMinutes);
    }

    // 3. Safety fallback (should rarely happen if types are aligned)
    console.warn(`No protocol found for ${surgeryType}, returning empty.`);
    return [];
}
