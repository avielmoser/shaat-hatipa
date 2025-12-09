import type { Medication } from "../types/prescription";
import { DEFAULT_PROTOCOLS, getInterlasikMedications } from "../constants/protocols";

/**
 * Protocol Definition:
 * A function that takes awakeMinutes and returns a list of medications.
 * Some protocols (like INTERLASIK) need awakeMinutes to calculate dosage.
 * Static protocols can ignore the argument.
 */
export type ProtocolDefinition = (awakeMinutes: number) => Medication[];

export type ClinicConfig = {
    id: string;
    name: string;
    logoUrl: string;
    primary: string; // Primary brand color
    secondary: string; // Secondary brand color
    button: string; // Button color
    protocols?: {
        [key: string]: ProtocolDefinition;
    };
};

export type ClinicBrand = ClinicConfig;

/**
 * CLINIC CONFIGURATION
 * 
 * To add a new clinic:
 * 1. Add a key to the CLINICS object (e.g., "my-clinic").
 * 2. Define branding (name, logo, colors).
 * 3. (Optional) Override protocols in the `protocols` object.
 *    - Keys must match SurgeryType enum (INTERLASIK, PRK).
 *    - Values must be functions returning Medication[].
 */
export const CLINICS: Record<string, ClinicConfig> = {
    default: {
        id: "default",
        name: "ShaatHaTipa",
        logoUrl: "/logo.png",
        primary: "#0F172A", // Slate-900
        secondary: "#F8FAFC", // Slate-50
        button: "#0EA5E9", // Sky-500
    },
    "ein-tal": {
        id: "ein-tal",
        name: "Ein Tal", // Or Hebrew "עין טל"
        logoUrl: "/clinics/eintal-logo.png",
        primary: "#0EA5E9",
        secondary: "#E0F2FE",
        button: "#0284C7",
    },
    "ein-tal-hadassah": {
        id: "ein-tal-hadassah",
        name: "Ein Tal Hadassah", // Translation key: Clinics.ein-tal-hadassah
        logoUrl: "/clinics/ein-tal-hadassah-logo.png",
        primary: "#0EA5E9", // Using same blue theme as Ein Tal for now, similar medical theme
        secondary: "#E0F2FE",
        button: "#0284C7",
    },
    "demo-clinic": {
        id: "demo-clinic",
        name: "Demo Clinic",
        logoUrl: "", // Check if nice placeholder exists or leave empty
        primary: "#7C3AED", // Violet-600
        secondary: "#F5F3FF", // Violet-50
        button: "#6D28D9", // Violet-700
        protocols: {
            // Example override: INTERLASIK with double dosage for demo
            INTERLASIK: (awakeMinutes) => {
                // Just wrapping default but adding a note to first med to prove override
                const defaultMeds = getInterlasikMedications(awakeMinutes);
                if (defaultMeds.length > 0) {
                    defaultMeds[0].notes = "DEMO OVERRIDE: Extra Note";
                }
                return defaultMeds;
            }
        }
    },
};

export const DEFAULT_BRAND = CLINICS["default"];
