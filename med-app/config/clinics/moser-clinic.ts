import { ClinicConfig, ProtocolDefinition } from "./types";
import { ProtocolAction } from "../../types/prescription";

const headacheProtocol: ProtocolDefinition = {
    id: "HEADACHE",
    kind: "SCHEDULED",
    actions: [
        {
            id: "acamol-headache",
            name: { he: "אקמול ×2", en: "Acamol ×2" },
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 1,
                    timesPerDay: 0, // Using interval logic
                    intervalHours: 6,
                },
            ],
            notes: { he: "לקחת 2 כדורים כל 6 שעות", en: "Take 2 pills every 6 hours" },
            instructions: [{ type: "avoid_food" }],
            route: "oral"
        },
        {
            id: "ibuprofen-headache",
            name: { he: "איבופן ×1", en: "Ibuprofen ×1" },
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 1,
                    timesPerDay: 0, // Using interval logic
                    intervalHours: 6,
                },
            ],
            notes: { he: "לקחת כדור אחד כל 6 שעות", en: "Take one pill every 6 hours" },
            route: "oral"
        }
    ],
    label: {
        he: "כאב ראש",
        en: "Headache"
    },
    description: {
        he: "פרוטוקול לטיפול בכאבי ראש",
        en: "Protocol for headache relief"
    }
};

const soreThroatProtocol: ProtocolDefinition = {
    id: "SORE_THROAT",
    kind: "SCHEDULED",
    actions: [
        {
            id: "ibuprofen-throat",
            name: { he: "איבופן ×1", en: "Ibuprofen ×1" },
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 3, // Assuming 3 days for sore throat
                    timesPerDay: 0,
                    intervalHours: 6,
                }
            ],
            notes: { he: "נגד דלקת וכאב", en: "Anti-inflammatory and pain relief" },
            route: "oral"
        },
        {
            id: "acamol-throat",
            name: { he: "אקמול ×2", en: "Acamol ×2" },
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 3,
                    timesPerDay: 0,
                    intervalHours: 6,
                }
            ],
            notes: { he: "להורדת חום וכאב", en: "Fever and pain relief" },
            route: "oral"
        },
        {
            id: "strepsils",
            name: { he: "סטרפסילס", en: "Strepsils" },
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 3,
                    timesPerDay: 0,
                    intervalHours: 4,
                }
            ],
            notes: { he: "למציצה כל 4 שעות", en: "Suck one every 4 hours" },
            route: "oral"
        }
    ],
    label: {
        he: "כאב גרון",
        en: "Sore Throat"
    },
    description: {
        he: "טיפול משולב בכאב גרון וחום",
        en: "Treatment for sore throat"
    }
};

const eyePainProtocol: ProtocolDefinition = {
    id: "EYE_PAIN",
    kind: "AS_NEEDED",
    actions: [
        {
            id: "lubricating-drops",
            name: { he: "טיפות סיכה", en: "Lubricating drops" },
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 7,
                    timesPerDay: 0, // As needed
                }
            ],
            notes: {
                he: "להשתמש לפי הצורך, ללא הגבלה. מומלץ כל שעתיים-שלוש אם יש יובש.",
                en: "Use as needed, no limit. Recommended every 2-3 hours if dry."
            },
            instructions: [
                { type: "note", messageKey: "schedule.slotNote_generic", params: { text: "May cause drowsiness" } }
            ],
            route: "eye_drop"
        }
    ],
    label: {
        he: "כאב עיניים",
        en: "Eye Pain"
    },
    description: {
        he: "טיפול ביובש וכאב עיניים",
        en: "Relief for dry eyes and pain"
    }
};

export const moserClinic: ClinicConfig = {
    id: "moser-clinic",
    slug: "moser-clinic",
    name: "Moser Clinic",
    logoUrl: "/logo.png", // Using default placeholder as requested
    colors: {
        primary: "#3B82F6", // Blue-500
        secondary: "#EFF6FF", // Blue-50
        button: "#2563EB", // Blue-600
        text: "#1E3A8A", // Blue-900
    },
    copy: {
        he: {
            heroTitle: "הנחיות טיפול אישיות",
            heroSubtitle: "בחרו את סוג הטיפול וקבלו לוח זמנים מותאם",
            actionLabel: "טיפול",
        },
        en: {
            heroTitle: "Treatment Guidelines",
            heroSubtitle: "Select your treatment to get a personalized schedule",
            actionLabel: "Action",
        },
    },
    supportedProtocols: ["HEADACHE", "SORE_THROAT", "EYE_PAIN"],
    protocols: {
        "HEADACHE": headacheProtocol,
        "SORE_THROAT": soreThroatProtocol,
        "EYE_PAIN": eyePainProtocol,
    },
    defaultActionDuration: 0,
    // Optional: Brand-consistent colors for Moser Clinic actions
    // If not provided, hash-based deterministic colors will be used
    actionColorMap: {
        "acamol-headache": "#ef4444",      // red-500 - Acamol
        "acamol-throat": "#ef4444",        // red-500 - Acamol
        "ibuprofen-headache": "#3b82f6",   // blue-500 - Ibuprofen
        "ibuprofen-throat": "#3b82f6",     // blue-500 - Ibuprofen
        "strepsils": "#f59e0b",            // amber-500 - Strepsils
        "lubricating-drops": "#06b6d4",    // cyan-500 - Lubricating drops
    },
    slotRules: {
        spacing: {
            minutes: 0,
            routes: []
        }
    }
};
