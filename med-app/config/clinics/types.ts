import { Medication, ProcedureType, SurgeryType } from "../../types/prescription";

/**
 * Protocol Definition:
 * A function that takes awakeMinutes and returns a list of medications.
 */
export type ProtocolDefinition = (awakeMinutes: number) => Medication[];

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

    // Functional
    supportedSurgeries: ProcedureType[]; // Using generic type

    // Logic Overrides
    protocols?: {
        [key in ProcedureType]?: ProtocolDefinition;
    };

    /**
     * Default duration per action in minutes.
     * Used if the action itself doesn't specify minDurationMinutes.
     * Legacy laser protocols use 5.
     */
    defaultActionDuration?: number;
}
