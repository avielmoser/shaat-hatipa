import { getClinicConfig, ClinicConfig, defaultClinic } from "../../config/clinics";
import { DEFAULT_PROTOCOLS } from "../../constants/protocols";
import { ProtocolAction, ProcedureType } from "../../types/prescription";

/**
 * Resolves the clinic configuration by ID.
 * Falls back to defaultClinic if ID is invalid or not found.
 */
export function resolveClinicConfig(clinicId?: string | null): ClinicConfig {
    return getClinicConfig(clinicId);
}

/**
 * Resolves the protocol (action list) for a given clinic and procedure type.
 * 
 * Logic:
 * 1. Check if clinic defines an override in `protocols[surgeryType]`.
 * 2. If present, execute it.
 * 3. If not, use the default protocol from DEFAULT_PROTOCOLS.
 * 4. Post-process: Inject defaultActionDuration if minDurationMinutes is missing.
 */
export function resolveProtocol(
    clinicConfig: ClinicConfig | undefined,
    surgeryType: ProcedureType,
    awakeMinutes: number
): ProtocolAction[] {
    let actions: ProtocolAction[] = [];

    // 1. Try clinic override
    if (clinicConfig?.protocols) {
        const override = clinicConfig.protocols[surgeryType];
        if (override) {
            actions = override(awakeMinutes);
        }
    }

    // 2. Fallback to default
    if (actions.length === 0) {
        // Cast to avoid implicit any if keys mismatch slightly, but ProcedureType should match
        // We use 'as any' for safety if mapping is partial, but ideally types match.
        const defaultFn = DEFAULT_PROTOCOLS[surgeryType as keyof typeof DEFAULT_PROTOCOLS];
        if (defaultFn) {
            actions = defaultFn(awakeMinutes);
        }
    }

    if (actions.length === 0) {
        console.warn(`No protocol found for ${surgeryType}, returning empty.`);
        return [];
    }

    // 4. Inject default duration
    // This allows the config to control the default (e.g. 5 mins for Laser)
    // while the engine remains agnostic (defaults to 0 if not set here).
    const defaultDuration = clinicConfig?.defaultActionDuration ?? 0;

    return actions.map(action => ({
        ...action,
        minDurationMinutes: action.minDurationMinutes ?? defaultDuration
    }));
}
