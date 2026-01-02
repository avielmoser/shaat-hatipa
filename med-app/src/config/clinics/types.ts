import { ActionInstruction, Medication, ProcedureType } from "../../types/prescription";

export type ProtocolKey = string;
export type ProtocolKind = 'SCHEDULED' | 'AS_NEEDED';

/**
 * Protocol Definition:
 * Data-only definition of a medical protocol.
 */
export interface ProtocolDefinition {
    id: ProtocolKey;
    kind: ProtocolKind;
    actions: Medication[];
    /**
     * Optional metadata for UI rendering (e.g. cards)
     * If missing, UI might try to fallback to translation keys, but explicit is better for new protocols.
     */
    label?: {
        he: string;
        en: string;
    };
    description?: {
        he: string;
        en: string;
    };
}

export interface ClinicConfig {
    id: string;
    slug: string; // URL param value
    name: string; // Fallback display name
    logoUrl: string;

    // Branding Colors
    colors: {
        primary: string;   // Main brand color
        secondary: string; // Background accents
        button: string;    // CTA buttons
        text: string;      // Primary text color (usually slate-900)
    };

    // Copy - Bilingual
    copy: {
        he: {
            heroTitle: string;
            heroSubtitle: string;
            actionLabel?: string; // e.g. "טיפות" (Defaults to generic if missing)
        };
        en: {
            heroTitle: string;
            heroSubtitle: string;
            actionLabel?: string; // e.g. "Drops"
        };
    };

    /**
     * List of protocol keys to show in the UI, and in what order.
     * Replaces `supportedSurgeries`.
     */
    supportedProtocols: ProtocolKey[];

    // Legacy support (optional) - to be removed or mapped
    supportedSurgeries?: ProcedureType[];

    // Logic Overrides
    protocols: Record<ProtocolKey, ProtocolDefinition>;

    /**
     * Default duration per action in minutes.
     * Used if the action itself doesn't specify minDurationMinutes.
     * Legacy laser protocols use 5.
     */
    defaultActionDuration?: number;

    /**
     * Optional map of action IDs to hex color codes.
     * If provided, these colors take precedence over hash-based assignment.
     * Useful for brand-consistent colors across clinics.
     */
    actionColorMap?: Record<string, string>;

    /**
     * Default instructions for every schedule slot.
     * DEPRECATED: Use slotRules.spacing for generated spacing notes.
     */
    defaultSlotInstructions?: ActionInstruction[];
    /**
     * Rules applied to dose slots during rendering.
     */
    slotRules?: {
        spacing?: {
            minutes: number;
            routes: Array<"eye_drop" | "oral" | "other">;
        };
    };
}
