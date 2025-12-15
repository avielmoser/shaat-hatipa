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
    supportedSurgeries: ["INTERLASIK", "PRK"],
    defaultActionDuration: 5,
};
