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
            heroTitle: "טיפות עיניים בקלות",
            heroSubtitle: "הצטרפו לאלפי מטופלים שמנהלים את הטיפול שלהם בחוכמה ובפשטות."
        },
        en: {
            heroTitle: "Eye Drops Made Easy",
            heroSubtitle: "Join thousands of patients managing their treatment smartly and simply."
        }
    },
    supportedSurgeries: ["INTERLASIK", "PRK"],
};
