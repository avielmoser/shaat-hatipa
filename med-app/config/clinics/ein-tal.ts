import { ClinicConfig, ProtocolDefinition } from "./types";

// Ein Tal uses standard protocols (copying for independence)
const interlasikProtocol: ProtocolDefinition = {
    id: "INTERLASIK",
    kind: "SCHEDULED",
    actions: [
        {
            id: "sterodex",
            name: "Sterodex",
            notes: "",
            phases: [
                { dayStart: 1, dayEnd: 1, timesPerDay: 0, intervalHours: 1 },
                { dayStart: 2, dayEnd: 4, timesPerDay: 6 },
                { dayStart: 5, dayEnd: 7, timesPerDay: 4 },
            ],
            route: "eye_drop",
        },
        {
            id: "vigamox",
            name: "Vigamox",
            notes: "",
            phases: [
                { dayStart: 1, dayEnd: 7, timesPerDay: 4 },
            ],
            route: "eye_drop",
        },
        {
            id: "systane-balance",
            name: "Systane Balance",
            notes: "",
            phases: [
                { dayStart: 1, dayEnd: 7, timesPerDay: 6 },
                { dayStart: 8, dayEnd: 32, timesPerDay: 4 },
            ],
            route: "eye_drop",
        },
    ],
    label: { he: "אינטרלאסיק", en: "INTERLASIK" }
};

const prkProtocol: ProtocolDefinition = {
    id: "PRK",
    kind: "SCHEDULED",
    actions: [
        {
            id: "sterodex",
            name: "Sterodex (Dexamethasone)",
            notes: "",
            phases: [
                { dayStart: 1, dayEnd: 7, timesPerDay: 4 },
                { dayStart: 8, dayEnd: 14, timesPerDay: 3 },
                { dayStart: 15, dayEnd: 21, timesPerDay: 2 },
                { dayStart: 22, dayEnd: 28, timesPerDay: 1 },
            ],
            route: "eye_drop",
        },
        {
            id: "vigamox",
            name: "Vigamox (Moxifloxacin 0.5%)",
            notes: "",
            phases: [{ dayStart: 1, dayEnd: 7, timesPerDay: 4 }],
            route: "eye_drop",
        },
        {
            id: "dicloftil",
            name: "Dicloftil 0.1%",
            notes: "",
            phases: [{ dayStart: 1, dayEnd: 3, timesPerDay: 3 }],
            route: "eye_drop",
        },
        {
            id: "systane-balance",
            name: "Systane Balance",
            notes: "",
            phases: [{ dayStart: 1, dayEnd: 30, timesPerDay: 6 }],
            route: "eye_drop",
        },
        {
            id: "vitapos",
            name: "Vitapos (Eye Ointment)",
            notes: "",
            phases: [
                { dayStart: 8, dayEnd: 14, timesPerDay: 2 },
                { dayStart: 15, dayEnd: 21, timesPerDay: 2 },
            ],
            route: "eye_drop",
        },
    ],
    label: { he: "PRK", en: "PRK" }
};

export const einTalClinic: ClinicConfig = {
    id: "ein-tal",
    slug: "ein-tal",
    name: "Ein Tal",
    logoUrl: "/clinics/eintal-logo.png",
    colors: {
        primary: "#0EA5E9",
        secondary: "#E0F2FE",
        button: "#0284C7",
        text: "#0F172A"
    },
    copy: {
        he: {
            heroTitle: "לוח זמנים אישי לאחרי ניתוח",
            heroSubtitle: "הלוח מותאם לסוג הניתוח, לפרוטוקול של הקליניקה ולשעות הערות שלך — בצורה ברורה ונוחה."
        },
        en: {
            heroTitle: "Your post-surgery schedule",
            heroSubtitle: "Based on your clinic’s protocol and your waking hours — clear and easy to follow."
        }
    },
    supportedProtocols: ["INTERLASIK", "PRK"],
    protocols: {
        "INTERLASIK": interlasikProtocol,
        "PRK": prkProtocol,
    },
    defaultSlotInstructions: [],
    slotRules: {
        spacing: {
            minutes: 5,
            routes: ["eye_drop"]
        }
    }
};
