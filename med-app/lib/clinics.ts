// lib/clinics.ts
export type ClinicBrand = {
  id: string;
  name: string;
  logoUrl: string;
  primary: string;
  secondary: string;
  button: string;
};

export const CLINICS: Record<string, ClinicBrand> = {
  eintal: {
    id: "eintal",
    name: "מרפאת עין טל",
    logoUrl: "/clinics/eintal-logo.png",
    primary: "#0EA5E9",
    secondary: "#E0F2FE",
    button: "#0284C7",
  },
  // תוסיף פה מרפאות נוספות
};

export const DEFAULT_BRAND: ClinicBrand = {
  id: "default",
  name: "שעת הטיפה",
  logoUrl: "/logo.png", // אם אין לך logo.png תשים נתיב קיים
  primary: "#0F172A",
  secondary: "#F8FAFC",
  button: "#0EA5E9",
};
