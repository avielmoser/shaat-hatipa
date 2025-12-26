import { getClinicConfig, ClinicConfig, defaultClinic, ProtocolDefinition } from "../../config/clinics";
import { DEFAULT_PROTOCOLS } from "../../constants/protocols";
import { ProtocolAction, ProcedureType } from "../../types/prescription";
import { assignActionColors } from "./action-colors";

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
    protocolKey: string
): ProtocolDefinition {
    if (!clinicConfig) {
        throw new Error("Clinic configuration is missing");
    }

    const protocol = clinicConfig.protocols[protocolKey];

    // Strict lookup: No fallback to defaults blindly.
    if (!protocol) {
        // We log detailed error but return readable message
        console.warn(`Protocol '${protocolKey}' not found in clinic '${clinicConfig.slug}'. Available: ${Object.keys(clinicConfig.protocols).join(", ")}`);
        throw new Error(`Protocol not found: ${protocolKey}`);
    }

    // Inject default duration if needed
    const defaultDuration = clinicConfig.defaultActionDuration ?? 0;

    let actions = protocol.actions.map(action => ({
        ...action,
        minDurationMinutes: action.minDurationMinutes ?? defaultDuration
    }));

    // Assign colors to all actions (deterministic, consistent across all clinics)
    actions = assignActionColors(actions, clinicConfig);

    return {
        ...protocol,
        actions
    };
}
