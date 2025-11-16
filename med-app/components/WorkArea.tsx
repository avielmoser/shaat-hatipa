// components/WorkArea.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import type {
  LaserPrescriptionInput,
  DoseSlot,
  SurgeryType,
  Medication,
} from "../types/prescription";
import PrescriptionView from "./PrescriptionView";
import ScheduleView from "./ScheduleView";
import {
  normalizeAwakeWindow,
  isImpossibleAwakeWindow,
} from "../lib/utils";
import { getMedicationColor } from "../lib/med-colors";

/**
 * Build the Interlasik prescription based on wake/sleep times. Adjusts
 * the number of hourly doses on day 1 according to the awake window length.
 */
function buildInterlasikPrescription(
  surgeryDate: string,
  wakeTime: string,
  sleepTime: string,
): LaserPrescriptionInput {
  const { wakeMinutes, normalizedSleepMinutes } = normalizeAwakeWindow(
    wakeTime,
    sleepTime,
  );
  const awakeWindow = normalizedSleepMinutes - wakeMinutes;
  const hourlyDoses = Math.max(1, Math.floor(awakeWindow / 60));
  const medications: Medication[] = [
    {
      id: "sterodex",
      name: "Sterodex",
      notes: "טיפות סטרואידים אחרי ניתוח",
      phases: [
        { dayStart: 1, dayEnd: 1, timesPerDay: hourlyDoses },
        { dayStart: 2, dayEnd: 4, timesPerDay: 6 },
        { dayStart: 5, dayEnd: 8, timesPerDay: 4 },
      ],
    },
    {
      id: "vigamox",
      name: "Vigamox",
      notes: "טיפות אנטיביוטיקה",
      phases: [{ dayStart: 1, dayEnd: 8, timesPerDay: 4 }],
    },
    {
      id: "systane-balance",
      name: "Systane Balance",
      notes: "דמעות מלאכותיות",
      phases: [
        { dayStart: 1, dayEnd: 8, timesPerDay: 6 },
        { dayStart: 9, dayEnd: 31, timesPerDay: 4 },
      ],
    },
  ];
  return {
    surgeryType: "INTERLASIK",
    surgeryDate,
    wakeTime,
    sleepTime,
    medications,
  };
}

/**
 * Build the PRK prescription. This configuration is fixed and does not
 * depend on the awake window.
 */
function buildPrkPrescription(
  surgeryDate: string,
  wakeTime: string,
  sleepTime: string,
): LaserPrescriptionInput {
  const medications: Medication[] = [
    {
      id: "sterodex",
      name: "Sterodex (Dexamethasone)",
      notes: "סטרואידים לפי פרוטוקול PRK",
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
      notes: "אנטיביוטיקה – רק שבוע ראשון",
      phases: [{ dayStart: 1, dayEnd: 7, timesPerDay: 4 }],
    },
    {
      id: "dicloftil",
      name: "Dicloftil 0.1%",
      notes: "NSAID – 3 ימים ראשונים בלבד",
      phases: [{ dayStart: 1, dayEnd: 3, timesPerDay: 3 }],
    },
    {
      id: "systane-balance",
      name: "Systane Balance",
      notes: "דמעות מלאכותיות – חודש שלם",
      phases: [{ dayStart: 1, dayEnd: 30, timesPerDay: 6 }],
    },
    {
      id: "vitapos",
      name: "Vitapos (Eye Ointment)",
      notes: "משחה – שבוע 2–3 בוקר ולילה",
      phases: [
        { dayStart: 8, dayEnd: 14, timesPerDay: 2 },
        { dayStart: 15, dayEnd: 21, timesPerDay: 2 },
      ],
    },
  ];
  return {
    surgeryType: "PRK",
    surgeryDate,
    wakeTime,
    sleepTime,
    medications,
  };
}

export default function WorkArea() {
  const [surgeryType, setSurgeryType] = useState<SurgeryType>("INTERLASIK");
  const [surgeryDate, setSurgeryDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [wakeTime, setWakeTime] = useState<string>("07:00");
  const [sleepTime, setSleepTime] = useState<string>("23:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidTime, setInvalidTime] = useState<boolean>(false);
  const [prescription, setPrescription] =
    useState<LaserPrescriptionInput | null>(null);
  const [schedule, setSchedule] = useState<DoseSlot[]>([]);
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (schedule.length > 0 && resultRef.current) {
      resultRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [schedule.length]);

  const currentStep = schedule.length > 0 ? 3 : prescription ? 2 : 1;

  const handleGenerate = async () => {
    setError(null);
    setInvalidTime(false);
    if (isImpossibleAwakeWindow(wakeTime, sleepTime)) {
      setError("טעות – אינך יכול לקום לפני שהלכת לישון");
      setInvalidTime(true);
      return;
    }

    let body: LaserPrescriptionInput;
    if (surgeryType === "INTERLASIK") {
      body = buildInterlasikPrescription(surgeryDate, wakeTime, sleepTime);
    } else {
      body = buildPrkPrescription(surgeryDate, wakeTime, sleepTime);
    }

    setLoading(true);
    try {
      const res = await fetch("/api/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "שגיאה ביצירת לוח זמנים");
      }

      const json = await res.json();
      setPrescription(json.prescription);
      setSchedule(json.schedule);
    } catch (e: any) {
      console.error(e);
      setPrescription(body);
      setError(e.message || "משהו השתבש, נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="work-area" className="px-4 pb-24 pt-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-12">
      {/* Stepper */}
        <ol className="flex items-center justify-center md:justify-end gap-4 text-sm">
          {[
            { idx: 1, label: "פרטי הניתוח" },
            { idx: 2, label: "סקירת פרוטוקול" },
            { idx: 3, label: "לוח זמנים" },
          ].map((step) => {
            const isActive = currentStep === step.idx;
            const isDone = currentStep > step.idx;
            return (
              <li key={step.idx} className="flex items-center gap-2">
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition ${
                    isDone
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                      ? "bg-sky-600 border-sky-600 text-white"
                      : "bg-slate-200 border-slate-300 text-slate-600"
                  }`}
                >
                  {step.idx}
                </span>
                <span
                  className={`text-xs sm:text-sm font-medium ${
                    isActive
                      ? "text-sky-700"
                      : isDone
                      ? "text-emerald-600"
                      : "text-slate-600"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
        {/* Main grid layout */}
        <div className="grid gap-10 lg:grid-cols-[minmax(0,3.5fr)_minmax(0,3fr)] lg:items-start">
          {/* Form card */}
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900">
                לוח טיפות אחרי ניתוח לייזר
              </h2>
              <p className="text-base text-slate-600">
                בחר סוג ניתוח, תאריך ושעות ערות – והמערכת תיצור עבורך לוח
                זמנים אוטומטי לפי הפרוטוקול הרפואי.
              </p>
            </div>
            {/* Fields */}
            <div className="space-y-4 text-sm">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    סוג הניתוח
                  </label>
                  <select
                    value={surgeryType}
                    onChange={(e) =>
                      setSurgeryType(e.target.value as SurgeryType)
                    }
                    className="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="INTERLASIK">INTERLASIK</option>
                    <option value="PRK">PRK</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    תאריך הניתוח
                  </label>
                  <input
                    type="date"
                    value={surgeryDate}
                    onChange={(e) => setSurgeryDate(e.target.value)}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    שעה שאתה קם בבוקר
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className={`block w-full rounded-lg border px-3 py-2 text-base text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                      invalidTime
                        ? "border-red-500"
                        : "border-slate-300 focus:border-sky-400"
                    }`}
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">
                    שעה שאתה הולך לישון
                  </label>
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className={`block w-full rounded-lg border px-3 py-2 text-base text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 ${
                      invalidTime
                        ? "border-red-500"
                        : "border-slate-300 focus:border-sky-400"
                    }`}
                  />
                </div>
              </div>
              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>
            {/* Protocol description preview */}
            <div className="space-y-4 text-sm rounded-2xl border border-sky-100 bg-sky-50/60 p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 gap-2">
                <span className="font-semibold text-slate-800">
                  הפרוטוקול האוטומטי ({surgeryType})
                </span>
                <span className="text-sm text-slate-500">
                  דוגמה לסדר טיפות – תמיד לעקוב אחרי הנחיות הרופא.
                </span>
              </div>
              {surgeryType === "INTERLASIK" ? (
                <ul className="space-y-1 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor("Sterodex", "sterodex")}22`,
                        color: getMedicationColor("Sterodex", "sterodex"),
                        borderColor: getMedicationColor("Sterodex", "sterodex"),
                      }}
                    >
                      Sterodex
                    </span>
                    <span>
                      יום הניתוח – טיפות כל שעה בזמן הערות; ימים 1–3 – 6 פעמים ביום; ימים 4–7 – 4 פעמים ביום.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor("Vigamox", "vigamox")}22`,
                        color: getMedicationColor("Vigamox", "vigamox"),
                        borderColor: getMedicationColor("Vigamox", "vigamox"),
                      }}
                    >
                      Vigamox
                    </span>
                    <span>ימים 1–8 – 4 פעמים ביום.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor("Systane Balance", "systane-balance")}22`,
                        color: getMedicationColor("Systane Balance", "systane-balance"),
                        borderColor: getMedicationColor("Systane Balance", "systane-balance"),
                      }}
                    >
                      Systane Balance
                    </span>
                    <span>
                      ימים 1–8 – 6 פעמים ביום; ימים 9–31 – 4 פעמים ביום.
                    </span>
                  </li>
                </ul>
              ) : (
                <ul className="space-y-1 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor("Sterodex", "sterodex")}22`,
                        color: getMedicationColor("Sterodex", "sterodex"),
                        borderColor: getMedicationColor("Sterodex", "sterodex"),
                      }}
                    >
                      Sterodex
                    </span>
                    <span>
                      שבוע 1 – 4 פעמים ביום; שבוע 2 – 3 פעמים ביום; שבוע 3 – בוקר וערב; שבוע 4 – פעם ביום.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor("Vigamox", "vigamox")}22`,
                        color: getMedicationColor("Vigamox", "vigamox"),
                        borderColor: getMedicationColor("Vigamox", "vigamox"),
                      }}
                    >
                      Vigamox
                    </span>
                    <span>שבוע ראשון – 4 פעמים ביום.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor("Dicloftil", "dicloftil")}22`,
                        color: getMedicationColor("Dicloftil", "dicloftil"),
                        borderColor: getMedicationColor("Dicloftil", "dicloftil"),
                      }}
                    >
                      Dicloftil
                    </span>
                    <span>3 הימים הראשונים – 3 פעמים ביום.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor("Systane Balance", "systane-balance")}22`,
                        color: getMedicationColor("Systane Balance", "systane-balance"),
                        borderColor: getMedicationColor("Systane Balance", "systane-balance"),
                      }}
                    >
                      Systane Balance
                    </span>
                    <span>חודש שלם – 6 פעמים ביום.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor("Vitapos", "vitapos")}22`,
                        color: getMedicationColor("Vitapos", "vitapos"),
                        borderColor: getMedicationColor("Vitapos", "vitapos"),
                      }}
                    >
                      Vitapos
                    </span>
                    <span>שבוע 2–3 – בוקר ולפני השינה.</span>
                  </li>
                </ul>
              )}
            </div>
            {/* Generate button */}
            <div className="pt-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/40 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
              >
                {loading
                  ? "יוצר לוח זמנים..."
                  : "צור לוח זמנים לפי הפרוטוקול"}
              </button>
            </div>
          </div>
          {/* Results area */}
          <div ref={resultRef} className="space-y-6">
            <PrescriptionView prescription={prescription} />
            <ScheduleView schedule={schedule} />
          </div>
        </div>
      </div>
    </section>
  );
}
