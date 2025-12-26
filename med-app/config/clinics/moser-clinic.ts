import { ClinicConfig, ProtocolDefinition } from "./types";
import { ProtocolAction } from "../../types/prescription";

const headacheProtocol: ProtocolDefinition = {
    id: "HEADACHE",
    kind: "SCHEDULED",
    actions: [
        {
            id: "acamol-headache",
            name: "אקמול ×2",
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 1,
                    timesPerDay: 0, // Using interval logic
                    intervalHours: 6,
                },
            ],
            notes: "לקחת 2 כדורים כל 6 שעות"
        },
        {
            id: "ibuprofen-headache",
            name: "איבופן ×1",
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 1,
                    timesPerDay: 0, // Using interval logic
                    intervalHours: 6,
                },
            ],
            notes: "לקחת כדור אחד כל 6 שעות"
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
            name: "איבופן ×1",
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 3, // Assuming 3 days for sore throat
                    timesPerDay: 0,
                    intervalHours: 6,
                }
            ],
            notes: "נגד דלקת וכאב"
        },
        {
            id: "acamol-throat",
            name: "אקמול ×2",
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 3,
                    timesPerDay: 0,
                    intervalHours: 6,
                }
            ],
            notes: "להורדת חום וכאב"
        },
        {
            id: "strepsils",
            name: "סטרפסילס",
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 3,
                    timesPerDay: 0,
                    intervalHours: 4,
                }
            ],
            notes: "למציצה כל 4 שעות"
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
            name: "טיפות סיכה",
            minDurationMinutes: 0,
            phases: [
                {
                    dayStart: 1,
                    dayEnd: 7,
                    timesPerDay: 0, // As needed
                }
            ],
            notes: "להשתמש לפי הצורך, ללא הגבלה. מומלץ כל שעתיים-שלוש אם יש יובש."
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
};
