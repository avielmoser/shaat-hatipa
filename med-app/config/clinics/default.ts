import { ClinicConfig, ProtocolDefinition } from "./types";

const interlasikProtocol: ProtocolDefinition = {
    id: "INTERLASIK",
    kind: "SCHEDULED",
    actions: [
        {
            id: "sterodex",
            name: "Sterodex",
            notes: "",
            phases: [
                // Day 1 – Every hour while awake (replaced dynamic calc with intervalHours: 1)
                { dayStart: 1, dayEnd: 1, timesPerDay: 0, intervalHours: 1 },
                // Days 2–4 – 6 times a day
                { dayStart: 2, dayEnd: 4, timesPerDay: 6 },
                // Days 5–7 – 4 times a day
                { dayStart: 5, dayEnd: 7, timesPerDay: 4 },
            ],
        },
        {
            id: "vigamox",
            name: "Vigamox",
            notes: "",
            phases: [
                // Days 1–7 – 4 times a day
                { dayStart: 1, dayEnd: 7, timesPerDay: 4 },
            ],
        },
        {
            id: "systane-balance",
            name: "Systane Balance",
            notes: "",
            phases: [
                // Days 1–7 – 6 times a day
                { dayStart: 1, dayEnd: 7, timesPerDay: 6 },
                // Days 8–32 – 4 times a day
                { dayStart: 8, dayEnd: 32, timesPerDay: 4 },
            ],
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
        },
        {
            id: "vigamox",
            name: "Vigamox (Moxifloxacin 0.5%)",
            notes: "",
            phases: [{ dayStart: 1, dayEnd: 7, timesPerDay: 4 }],
        },
        {
            id: "dicloftil",
            name: "Dicloftil 0.1%",
            notes: "",
            phases: [{ dayStart: 1, dayEnd: 3, timesPerDay: 3 }],
        },
        {
            id: "systane-balance",
            name: "Systane Balance",
            notes: "",
            phases: [{ dayStart: 1, dayEnd: 30, timesPerDay: 6 }],
        },
        {
            id: "vitapos",
            name: "Vitapos (Eye Ointment)",
            notes: "",
            phases: [
                { dayStart: 8, dayEnd: 14, timesPerDay: 2 },
                { dayStart: 15, dayEnd: 21, timesPerDay: 2 },
            ],
        },
    ],
    label: { he: "PRK", en: "PRK" }
};

export const defaultClinic: ClinicConfig = {
    id: "default",
    slug: "default",
    name: "ShaatHaTipa",
    logoUrl: "/logo.png",
    colors: {
        primary: "#0F172A", // Slate-900
        secondary: "#F8FAFC", // Slate-50
        button: "#0EA5E9", // Sky-500
        text: "#0F172A"
    },
    copy: {
        he: {
            heroTitle: "הוראות החלמה אישיות",
            heroSubtitle: "הזינו את פרטי הניתוח וקבלו לו\"ז טיפות מותאם אישית",
            actionLabel: "טיפות",
        },
        en: {
            heroTitle: "Recovery Schedule",
            heroSubtitle: "Enter surgery details to get your personalized drop schedule",
            actionLabel: "Drops",
        },
    },
    supportedProtocols: ["INTERLASIK", "PRK"],
    protocols: {
        "INTERLASIK": interlasikProtocol,
        "PRK": prkProtocol,
    },
    defaultActionDuration: 5,
};
