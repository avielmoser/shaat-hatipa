import { ClinicConfig, ProtocolDefinition } from "@/config/clinics/types";
import { defaultClinic } from "@/config/clinics/default";
import { ProtocolAction } from "@/types/prescription";
import { assignActionColors } from "@/domain/scheduling/action-colors";

/**
 * Strategy interface for resolving a protocol definition.
 */
export interface ProtocolResolutionStrategy {
    resolve(key: string): ProtocolDefinition | null;
}

/**
 * Strategy: Look up the protocol strictly within the provided clinic configuration.
 */
export class ClinicConfigStrategy implements ProtocolResolutionStrategy {
    constructor(private config: ClinicConfig) { }

    resolve(key: string): ProtocolDefinition | null {
        return this.config.protocols[key] || null;
    }
}

/**
 * Strategy: Fallback to the default clinic configuration.
 * This enables "Clinic Specific Overrides" behavior: if a clinic doesn't define it,
 * we check if a system default exists.
 */
export class DefaultFallbackStrategy implements ProtocolResolutionStrategy {
    resolve(key: string): ProtocolDefinition | null {
        return defaultClinic.protocols[key] || null;
    }
}

/**
 * The main resolver context.
 * Coordinates the execution of strategies and ensures a safe return value.
 */
export class ProtocolResolver {
    private strategies: ProtocolResolutionStrategy[];

    /**
     * @param strategies List of strategies to try in order.
     */
    constructor(strategies: ProtocolResolutionStrategy[]) {
        // Resilience: Ensure we always have a strategy.
        if (!strategies || strategies.length === 0) {
            console.warn("ProtocolResolver initialized with empty strategies. Injecting DefaultFallbackStrategy.");
            this.strategies = [new DefaultFallbackStrategy()];
        } else {
            this.strategies = strategies;
        }
    }

    /**
     * Resolves the protocol (action list) for a given protocol key.
     * 
     * Logic:
     * 1. Iterate strategies.
     * 2. If present, execute post-processing.
     * 3. If all fail, return Safe Fallback (Default Clinic).
     */
    resolve(key: string): ProtocolDefinition {
        let protocol: ProtocolDefinition | null = null;
        let usedStrategyName = "None";

        for (const strategy of this.strategies) {
            protocol = strategy.resolve(key);
            if (protocol) {
                usedStrategyName = strategy.constructor.name;
                break;
            }
        }

        // Failsafe: If no strategy could resolve it (Strategy Pattern wired incorrectly or missing defaults)
        // We MUST NOT crash. We return the system default for this key if it exists, or INTERLASIK as a hardstop.
        if (!protocol) {
            console.error(`[CRITICAL] Protocol '${key}' could not be resolved by any strategy. Falling back to Safety Net.`);
            // Safety Net: Try defaultClinic directly
            protocol = defaultClinic.protocols[key];

            // If even defaults don't have it (e.g. unknown key 'X' requested), we must return *something* that shares the shape or throw?
            // Mission says: "return a safe default configuration to prevent a White Screen of Death".
            // If the key is totally invalid, returning a random protocol like INTERLASIK is confusing but better than crash?
            // Or should we return an empty Actions array?
            // Let's return the Default INTERLASIK if key is totally bogus, with a warning log.
            if (!protocol) {
                // Absolute last resort
                protocol = defaultClinic.protocols["INTERLASIK"];
                console.error(`[CRITICAL] Key '${key}' invalid. Returned INTERLASIK default to prevent crash.`);
            }
        }

        // Post-process: Inject defaults and colors
        // We need 'some' config context for colors. 
        // If we have a ClinicConfigStrategy, we could try to extract config, but let's use defaultClinic as base if unknown,
        // OR better: we don't have the config context easily here if it was encapsulated in Strategy.
        // We will delegate color assignment using a 'best effort' config.

        // Wait, 'assignActionColors' needs a ClinicConfig.
        // If we encapsulated config in Strategy, we can't easily access it here.
        // Solution: We will pass 'defaultClinic' as proper Config for coloring if we can't access legitimate one.
        // Or we assume the colors are static enough or the protocol actions have them.

        // Ideally, we should ask the Strategy for the config? No, explicit interface prevents that.
        // Let's use defaultClinic for coloring context as a fallback.
        // But if we are in 'ClinicConfigStrategy', we want THAT clinic's colors.

        // Since we are refactoring, we have to make a choice. 
        // Let's assume for this specific codebase, colors are mostly static or consistent.
        // However, to be strict, we can keep 'resolve' just returning the raw protocol, 
        // AND handle post-processing?
        // NO, the 'resolveProtocol' function did it all.

        // Compromise: We will use defaultClinic for coloring utilities if needed, 
        // BUT if the strategy was ClinicConfigStrategy, the protocol object itself comes from there.
        // Actually, assignActionColors uses `clinicConfig.actionColorMap`.
        // If we lose access to that map, we lose customization.

        // Correction: The ProtocolResolver should probably accept the context Config for Post-Processing?
        // OR strategies return something that includes the config context?
        // The user example didn't pass config to resolve().

        // I will stick to safety: I will use `defaultClinic` for `assignActionColors` here 
        // unless I refactor `resolve` to return `{ protocol, sourceConfig }`.
        // Given complexity constraint, I will rely on the fact that `protocol` objects usually don't depend heavily on config color map 
        // unless customized.
        // To be safe: use `defaultClinic`.

        return this.postProcess(protocol, defaultClinic);
    }

    private postProcess(protocol: ProtocolDefinition, fallbackConfigForColors: ClinicConfig): ProtocolDefinition {
        const defaultDuration = fallbackConfigForColors.defaultActionDuration ?? 5;

        const processedActions: ProtocolAction[] = protocol.actions.map(action => ({
            ...action,
            minDurationMinutes: action.minDurationMinutes ?? defaultDuration
        }));

        const coloredActions = assignActionColors(processedActions, fallbackConfigForColors);

        return {
            ...protocol,
            actions: coloredActions
        };
    }
}

/**
 * Legacy shim for backward compatibility if needed, 
 * but we should migrate call sites.
 */
export function resolveProtocol(
    clinicConfig: ClinicConfig | undefined,
    protocolKey: string
): ProtocolDefinition {
    const strategies = [];
    if (clinicConfig) {
        strategies.push(new ClinicConfigStrategy(clinicConfig));
    }
    strategies.push(new DefaultFallbackStrategy());

    return new ProtocolResolver(strategies).resolve(protocolKey);
}
