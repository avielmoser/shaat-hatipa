import { ClinicConfig } from "./types";

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
    supportedSurgeries: ["INTERLASIK", "PRK"],
};
