// components/ClinicBrandProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CLINICS, DEFAULT_BRAND, type ClinicBrand } from "../lib/clinics";

type ClinicBrandContextValue = {
  brand: ClinicBrand;
  clinicId: string | null;
};

const ClinicBrandContext = createContext<ClinicBrandContextValue>({
  brand: DEFAULT_BRAND,
  clinicId: null,
});

export function ClinicBrandProvider({ children }: { children: React.ReactNode }) {
  const [clinicId, setClinicId] = useState<string | null>(null);

  // קורא את clinic מה-URL (יציב תמיד)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("clinic");
    setClinicId(id);
  }, []);

  const brand = useMemo(() => {
    if (!clinicId) return DEFAULT_BRAND;
    return CLINICS[clinicId] ?? DEFAULT_BRAND;
  }, [clinicId]);

  // CSS variables למיתוג
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--clinic-primary", brand.primary);
    root.style.setProperty("--clinic-secondary", brand.secondary);
    root.style.setProperty("--clinic-button", brand.button);
  }, [brand]);

  const value = useMemo(() => ({ brand, clinicId }), [brand, clinicId]);

  return (
    <ClinicBrandContext.Provider value={value}>
      {children}
    </ClinicBrandContext.Provider>
  );
}

export function useClinicBrand() {
  return useContext(ClinicBrandContext);
}
