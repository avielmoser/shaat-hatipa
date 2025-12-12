// components/ClinicBrandProvider.tsx
"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { resolveClinicConfig } from "../lib/domain/protocol-resolver";
import { defaultClinic as DEFAULT_BRAND, type ClinicConfig as ClinicBrand } from "../config/clinics";

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
    return resolveClinicConfig(clinicId);
  }, [clinicId]);

  // CSS variables למיתוג
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--clinic-primary", brand.colors.primary);
    root.style.setProperty("--clinic-secondary", brand.colors.secondary);
    root.style.setProperty("--clinic-button", brand.colors.button);
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
