import { ClinicConfig } from "./types";

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
            heroTitle: "לוח זמנים אישי לאחרי ניתוח",
            heroSubtitle: "הלוח מותאם לסוג הניתוח, לפרוטוקול של הקליניקה ולשעות הערות שלך — בצורה ברורה ונוחה."
        },
        en: {
            heroTitle: "Your post-surgery schedule",
            heroSubtitle: "Based on your clinic’s protocol and your waking hours — clear and easy to follow."
        }
    },
    supportedSurgeries: ["INTERLASIK", "PRK"],
};
