// components/HeroSection.tsx
"use client";

import React from "react";
import { useClinicBrand } from "./ClinicBrandProvider";

export default function HeroSection() {
  const { brand, clinicId } = useClinicBrand();

  const handleScrollToWorkArea = () => {
    const section = document.getElementById("work-area");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      className="w-full bg-gradient-to-b from-sky-50 to-white px-4 pt-16 pb-16 sm:px-6 lg:px-8"
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-12 md:flex-row md:items-center md:justify-between">
        {/* Example Card – Left side on desktop */}
        <div className="flex-1 flex justify-center md:justify-start order-2 md:order-1">
          <div className="w-full max-w-sm rounded-3xl border border-sky-50 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.12)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Sample Daily Schedule
                </p>
                <p className="text-sm font-medium text-slate-700">Day 1 Post-Op</p>
              </div>
              <span className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1 text-sm font-medium text-sky-800">
                Post-Op Day 1
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
                  <span className="font-medium text-slate-800">Vigamox</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  08:00
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-purple-500" />
                  <span className="font-medium text-slate-800">Dicloftil</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  09:00
                </span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                  <span className="font-medium text-slate-800">Vitapos</span>
                </div>
                <span className="text-sm font-semibold text-slate-900">
                  09:15
                </span>
              </div>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              This is just an example. The system will coordinate your drops throughout your waking hours, according to the appropriate medical protocol.
            </p>
          </div>
        </div>

        {/* Text + CTA – Right side on desktop */}
        <div className="flex-1 flex flex-col items-center space-y-6 text-center">
          {/* Clinic Logo (if exists) + Tag */}
          <div className="flex flex-col items-center gap-3">
            {clinicId && (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={brand.logoUrl}
                  alt={brand.name || "Clinic Logo"}
                  className="max-h-14 w-auto object-contain"
                  loading="eager"
                  onError={(e) => {
                    // Hide logo if it fails to load
                    (e.currentTarget as HTMLImageElement).style.display = "none";
                  }}
                />

              </div>
            )}

            <span
              className="inline-flex items-center rounded-full border border-sky-100 bg-white px-5 py-2 text-sm font-medium text-sky-900 shadow-sm"
              style={{
                backgroundColor: clinicId ? "var(--clinic-secondary)" : undefined,
                color: clinicId ? "var(--clinic-primary)" : undefined,
                borderColor: clinicId ? "transparent" : undefined,
              }}
            >
              All your drops in one organized place
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] xl:text-[2.8rem] font-bold leading-snug tracking-tight text-slate-900">

            Personal Eye Drop Schedule
            <br />
            After Laser Surgery
          </h1>

          <p className="mx-auto max-w-md md:mx-0 text-lg sm:text-xl leading-relaxed text-slate-700">
            The system generates a precise and structured medical schedule for you, based on your surgery type and personal waking hours.
          </p>

          <div className="flex flex-col items-center gap-3">
            <button
              type="button"
              onClick={handleScrollToWorkArea}
              className="
    inline-flex items-center justify-center rounded-full
    px-8 py-4 text-lg font-bold text-white
    shadow-lg transition
    bg-sky-600 hover:bg-sky-700
    focus:outline-none focus:ring-4 focus:ring-sky-500 focus:ring-offset-2
  "
              style={
                clinicId
                  ? { backgroundColor: "var(--clinic-button)" } // Clinic color
                  : undefined // Tailwind default
              }
              onMouseEnter={(e) => {
                if (!clinicId) return;
                (e.currentTarget as HTMLButtonElement).style.filter = "brightness(0.95)";
              }}
              onMouseLeave={(e) => {
                if (!clinicId) return;
                (e.currentTarget as HTMLButtonElement).style.filter = "none";
              }}
            >

              Start Now
            </button>

            <span className="max-w-xs text-sm text-slate-600">
              Schedule management tool. The information presented does not replace medical advice.
            </span>
          </div>

          {/* Highlight Tags */}
          <div className="mt-2 flex flex-wrap justify-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 font-medium text-emerald-800">
              Optimized for INTERLASIK / PRK
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 font-medium text-sky-800">
              Export to Calendar & PDF
            </span>
            <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white/80 px-3 py-1 font-medium text-slate-800">
              Protocol calculated by your personal waking hours
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
