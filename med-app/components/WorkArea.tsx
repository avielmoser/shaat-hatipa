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
import { normalizeAwakeWindow, isImpossibleAwakeWindow } from "../lib/utils";
import { getMedicationColor } from "../lib/medicationColors";

function buildInterlasikPrescription(
  surgeryDate: string,
  wakeTime: string,
  sleepTime: string
): LaserPrescriptionInput {
  const { wakeMinutes, normalizedSleepMinutes } = normalizeAwakeWindow(
    wakeTime,
    sleepTime
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

function buildPrkPrescription(
  surgeryDate: string,
  wakeTime: string,
  sleepTime: string
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

type Step = 1 | 2 | 3;

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
  const [invalidTime, setInvalidTime] = useState(false);

  const [prescription, setPrescription] =
    useState<LaserPrescriptionInput | null>(null);
  const [schedule, setSchedule] = useState<DoseSlot[]>([]);

  const [activeStep, setActiveStep] = useState<Step>(1);

  const summaryRef = useRef<HTMLDivElement | null>(null);
  const scheduleRef = useRef<HTMLDivElement | null>(null);

  // גלילה אוטומטית כשעוברים שלב
  useEffect(() => {
    if (activeStep === 2 && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    if (activeStep === 3 && scheduleRef.current) {
      scheduleRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeStep]);

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
      setActiveStep(2);
    } catch (e: any) {
      console.error(e);
      setPrescription(body);
      setError(e.message || "משהו השתבש, נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  const goToStep2 = () => {
    setActiveStep(2);
  };

  const goToStep3 = () => {
    setActiveStep(3);
    // ביטוח לגלילה גם אם ה-useEffect מתעכב
    setTimeout(() => {
      if (scheduleRef.current) {
        scheduleRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }
    }, 0);
  };

  return (
    <section
      id="work-area"
      className="px-4 pb-24 pt-10 sm:px-6 lg:px-8 sm:pt-16"
    >
      <div className="mx-auto max-w-6xl space-y-8 sm:space-y-10">
        {/* Stepper */}
        <ol className="flex items-center justify-center md:justify-end gap-4 text-sm">
          {[
            { idx: 1 as Step, label: "פרטי הניתוח" },
            { idx: 2 as Step, label: "סקירת פרוטוקול" },
            { idx: 3 as Step, label: "לוח זמנים" },
          ].map((step) => {
            const isActive = activeStep === step.idx;
            const isDone = activeStep > step.idx;
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

        {/* שלב 1 – טופס קלט */}
        {activeStep === 1 && (
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-4 sm:p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] space-y-4 sm:space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-2xl font-semibold text-slate-900">
                  לוח טיפות אחרי ניתוח לייזר
                </h2>
                <p className="text-xs sm:text-base text-slate-600">
                  בחר סוג ניתוח, תאריך ושעות ערות – והמערכת תיצור עבורך לוח
                  זמנים אוטומטי לפי הפרוטוקול הרפואי.
                </p>
              </div>
            </div>

            <div className="space-y-3 sm:space-y-4 text-sm">
              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
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

              <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
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
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
                  {error}
                </div>
              )}
            </div>

            {/* תקציר פרוטוקול */}
            <div className="space-y-3 sm:space-y-4 text-xs sm:text-sm rounded-2xl border border-sky-100 bg-sky-50/60 p-3 sm:p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-1.5 sm:mb-2 gap-2">
                <span className="font-semibold text-slate-800">
                  הפרוטוקול האוטומטי ({surgeryType})
                </span>
                <span className="text-[11px] sm:text-sm text-slate-500">
                  דוגמה כללית – תמיד לפעול לפי הנחיות הרופא.
                </span>
              </div>

              {surgeryType === "INTERLASIK" ? (
                <ul className="space-y-1 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor(
                          "Sterodex",
                          "sterodex"
                        )}22`,
                        color: getMedicationColor("Sterodex", "sterodex"),
                        borderColor: getMedicationColor("Sterodex", "sterodex"),
                      }}
                    >
                      Sterodex
                    </span>
                    <span>
                      יום הניתוח – טיפות כל שעה בזמן הערות; ימים 1–3 – 6 פעמים
                      ביום; ימים 4–7 – 4 פעמים ביום.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor(
                          "Vigamox",
                          "vigamox"
                        )}22`,
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
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor(
                          "Systane Balance",
                          "systane-balance"
                        )}22`,
                        color: getMedicationColor(
                          "Systane Balance",
                          "systane-balance"
                        ),
                        borderColor: getMedicationColor(
                          "Systane Balance",
                          "systane-balance"
                        ),
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
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor(
                          "Sterodex",
                          "sterodex"
                        )}22`,
                        color: getMedicationColor("Sterodex", "sterodex"),
                        borderColor: getMedicationColor("Sterodex", "sterodex"),
                      }}
                    >
                      Sterodex
                    </span>
                    <span>
                      שבוע 1 – 4 פעמים ביום; שבוע 2 – 3 פעמים ביום; שבוע 3 – בוקר
                      וערב; שבוע 4 – פעם ביום.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor(
                          "Vigamox",
                          "vigamox"
                        )}22`,
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
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor(
                          "Dicloftil",
                          "dicloftil"
                        )}22`,
                        color: getMedicationColor("Dicloftil", "dicloftil"),
                        borderColor: getMedicationColor(
                          "Dicloftil",
                          "dicloftil"
                        ),
                      }}
                    >
                      Dicloftil
                    </span>
                    <span>3 הימים הראשונים – 3 פעמים ביום.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor(
                          "Systane Balance",
                          "systane-balance"
                        )}22`,
                        color: getMedicationColor(
                          "Systane Balance",
                          "systane-balance"
                        ),
                        borderColor: getMedicationColor(
                          "Systane Balance",
                          "systane-balance"
                        ),
                      }}
                    >
                      Systane Balance
                    </span>
                    <span>חודש שלם – 6 פעמים ביום.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium"
                      style={{
                        backgroundColor: `${getMedicationColor(
                          "Vitapos",
                          "vitapos"
                        )}22`,
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

              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-medium text-amber-800 border border-amber-200">
                <span>💧</span>
                <span>מומלץ להמתין לפחות 5 דקות בין כל סוג טיפות.</span>
              </div>
            </div>

            <div className="pt-2 sm:pt-4">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-sky-500/40 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
              >
                {loading ? "יוצר לוח זמנים..." : "המשך לשלב 2 – סקירת הוראות"}
              </button>
            </div>
          </div>
        )}

        {/* שלב 2 – סיכום הוראות */}
        {activeStep === 2 && (
          <div className="space-y-4 sm:space-y-6">
            <div ref={summaryRef}>
              <PrescriptionView prescription={prescription} />
            </div>

            {/* כפתור דביק למובייל – מעבר לשלב 3 */}
            <div className="sm:hidden fixed inset-x-0 bottom-0 z-20 bg-white/95 border-t border-slate-200 px-4 py-3">
              <button
                type="button"
                onClick={goToStep3}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:bg-sky-700"
              >
                לשלב 3 – לוח זמנים
              </button>
            </div>

            {/* כפתור לשלב 3 בדסקטופ / טאבלט */}
            <div className="hidden sm:flex justify-end">
              <button
                type="button"
                onClick={goToStep3}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-500/30 transition hover:bg-sky-700"
              >
                לשלב 3 – לוח זמנים
              </button>
            </div>
          </div>
        )}

        {/* שלב 3 – לוח זמנים */}
        {activeStep === 3 && (
          <div ref={scheduleRef} className="space-y-4 sm:space-y-6">
            <ScheduleView schedule={schedule} />
          </div>
        )}
      </div>
    </section>
  );
}
