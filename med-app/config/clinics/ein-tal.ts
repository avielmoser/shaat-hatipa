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
            heroTitle: "ברוכים הבאים לעין טל",
            heroSubtitle: "המרכז הרפואי לרפואת עיניים ומיקרוכירורגיה. אנו כאן ללוות אתכם בתהליך ההחלמה."
        },
        en: {
            heroTitle: "Welcome to Ein Tal",
            heroSubtitle: "Medical Center for Ophthalmology and Microsurgery. We are here to guide you through recovery."
        }
    },
    supportedSurgeries: ["INTERLASIK", "PRK"],
};
