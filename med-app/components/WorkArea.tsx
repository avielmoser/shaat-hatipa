// app/components/WorkArea.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import type {
  LaserPrescriptionInput,
  DoseSlot,
  SurgeryType,
} from "../types/prescription";

import PrescriptionView from "./PrescriptionView";
import ScheduleView from "./ScheduleView";
import { getMedicationColor } from "../lib/med-colors";

// המרת שעה (HH:MM) לדקות
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map((v) => parseInt(v, 10));
  return h * 60 + m;
}

/* ================== פרוטוקול INTERLASIK ================== */

function buildInterlasikPrescription(
  surgeryDate: string,
  wakeTime: string,
  sleepTime: string
): LaserPrescriptionInput {
  const wakeMinutes = parseTimeToMinutes(wakeTime);
  const sleepMinutes = parseTimeToMinutes(sleepTime);
  const awakeWindow = Math.max(sleepMinutes - wakeMinutes, 60);
  const hourlyDoses = Math.max(1, Math.floor(awakeWindow / 60));

  const medications = [
    {
      id: "sterodex",
      name: "Sterodex",
      notes: "טיפות סטרואידים אחרי ניתוח",
      phases: [
        { dayStart: 1, dayEnd: 1, timesPerDay: hourlyDoses }, // יום הניתוח – כל שעה
        { dayStart: 2, dayEnd: 4, timesPerDay: 6 }, // ימים 1–3
        { dayStart: 5, dayEnd: 8, timesPerDay: 4 }, // ימים 4–7
      ],
    },
    {
      id: "vigamox",
      name: "Vigamox",
      notes: "טיפות אנטיביוטיקה",
      phases: [{ dayStart: 1, dayEnd: 8, timesPerDay: 4 }], // ימים 0–7
    },
    {
      id: "systane-balance",
      name: "Systane Balance",
      notes: "דמעות מלאכותיות",
      phases: [
        { dayStart: 1, dayEnd: 8, timesPerDay: 6 }, // ימים 0–7
        { dayStart: 9, dayEnd: 31, timesPerDay: 4 }, // ימים 8–30
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

/* ================== פרוטוקול PRK ================== */

function buildPrkPrescription(
  surgeryDate: string,
  wakeTime: string,
  sleepTime: string
): LaserPrescriptionInput {
  const medications = [
    {
      id: "sterodex",
      name: "Sterodex (Dexamethasone)",
      notes: "סטרואידים לפי פרוטוקול PRK",
      phases: [
        { dayStart: 1, dayEnd: 7, timesPerDay: 4 }, // שבוע ראשון
        { dayStart: 8, dayEnd: 14, timesPerDay: 3 }, // שבוע שני
        { dayStart: 15, dayEnd: 21, timesPerDay: 2 }, // שבוע שלישי (בוקר+ערב)
        { dayStart: 22, dayEnd: 28, timesPerDay: 1 }, // שבוע רביעי
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

/* ================== קומפוננטת העבודה ================== */

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

  const [prescription, setPrescription] =
    useState<LaserPrescriptionInput | null>(null);
  const [schedule, setSchedule] = useState<DoseSlot[]>([]);

  // גלילה לאזור התוצאות לאחר יצירת לוח זמנים
  const resultRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (schedule.length > 0 && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [schedule.length]);

  const handleGenerate = async () => {
    setError(null);

    let body: LaserPrescriptionInput;
    if (surgeryType === "INTERLASIK") {
      body = buildInterlasikPrescription(surgeryDate, wakeTime, sleepTime);
    } else if (surgeryType === "PRK") {
      body = buildPrkPrescription(surgeryDate, wakeTime, sleepTime);
    } else {
      setError("כרגע נתמכים רק ניתוחי INTERLASIK ו-PRK.");
      return;
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
      setError(e.message || "משהו השתבש, נסה שוב.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section id="work-area" className="px-3 pb-16 pt-6 sm:px-4 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-4">
        {/* כותרת משנה + סטפר קטן */}
        <div className="flex flex-col items-end justify-between gap-3 sm:flex-row sm:items-center">
          <div className="text-right">
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-sky-700">
              לוח טיפות מותאם אישית
            </div>
            <p className="mt-1 text-xs text-slate-500">
              שלושה צעדים פשוטים: הזנת פרטי הניתוח, בדיקת הפרוטוקול, ויצירת לוח
              זמנים עם תזכורות ליומן.
            </p>
          </div>

          <ol className="flex items-center gap-2 text-[11px] text-slate-500">
            <li className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-600 text-[11px] font-semibold text-white">
                1
              </span>
              <span>פרטי הניתוח</span>
            </li>
            <span className="text-slate-300">—</span>
            <li className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700">
                2
              </span>
              <span>סקירת פרוטוקול</span>
            </li>
            <span className="text-slate-300">—</span>
            <li className="flex items-center gap-1">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sky-100 text-[11px] font-semibold text-sky-700">
                3
              </span>
              <span>לוח זמנים + ייצוא</span>
            </li>
          </ol>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,3.3fr)_minmax(0,3fr)] lg:items-stretch">
          {/* כרטיס הטופס */}
          <div className="relative rounded-3xl border border-slate-200/70 bg-gradient-to-br from-sky-50 via-white to-slate-50 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.12)] sm:p-6">
            <div className="pointer-events-none absolute inset-x-10 -top-6 h-10 rounded-full bg-sky-500/10 blur-2xl" />

            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  לוח טיפות אחרי ניתוח לייזר
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  בחר סוג ניתוח, תאריך ושעות ערות – והמערכת תיצור עבורך לוח זמנים
                  אוטומטי לפי הפרוטוקול הרפואי.
                </p>
              </div>
              <div className="hidden sm:inline-flex items-center rounded-full border border-sky-200 bg-white/80 px-3 py-1 text-[10px] font-medium text-sky-700 shadow-sm">
                <span className="ml-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                מתאים לניתוחי INTERLASIK / PRK
              </div>
            </div>

            <div className="mt-5 space-y-4 text-sm">
              {/* סוג ניתוח + תאריך */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    סוג הניתוח
                  </label>
                  <div className="relative">
                    <select
                      value={surgeryType}
                      onChange={(e) =>
                        setSurgeryType(e.target.value as SurgeryType)
                      }
                      className="block w-full appearance-none rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5 pr-8 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                    >
                      <option value="INTERLASIK">INTERLASIK</option>
                      <option value="PRK">PRK</option>
                    </select>
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
                      ▾
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    תאריך הניתוח
                  </label>
                  <input
                    type="date"
                    value={surgeryDate}
                    onChange={(e) => setSurgeryDate(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  />
                </div>
              </div>

              {/* שעות ערות */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    שעה שאתה קם בבוקר
                  </label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-700">
                    שעה שאתה הולך לישון
                  </label>
                  <input
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className="block w-full rounded-2xl border border-slate-200 bg-white/80 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-200"
                  />
                </div>
              </div>

              {/* תיאור הפרוטוקול עם צ'יפים בצבעים */}
                            {/* תיאור הפרוטוקול עם צ'יפים בצבעים */}
              <div className="mt-3 rounded-2xl border border-sky-100 bg-sky-50/70 p-3 text-[11px] text-slate-700">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="font-semibold text-slate-800">
                    הפרוטוקול האוטומטי ({surgeryType})
                  </span>
                  <span className="text-[10px] text-slate-500">
                    דוגמה לסדר טיפות – תמיד לעקוב אחרי הנחיות הרופא.
                  </span>
                </div>

                {surgeryType === "INTERLASIK" ? (
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${
                            getMedicationColor("Sterodex") ?? "#e5e7eb"
                          }22`,
                          color: getMedicationColor("Sterodex") ?? "#0f172a",
                          borderColor:
                            getMedicationColor("Sterodex") ??
                            "rgba(15,23,42,0.16)",
                        }}
                      >
                        Sterodex
                      </span>
                      <span>
                        יום הניתוח – טיפות כל שעה בזמן הערות;
                        ימים 1–3 – 6 פעמים ביום;
                        ימים 4–7 – 4 פעמים ביום.
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${
                            getMedicationColor("Vigamox") ?? "#e5e7eb"
                          }22`,
                          color: getMedicationColor("Vigamox") ?? "#0f172a",
                          borderColor:
                            getMedicationColor("Vigamox") ??
                            "rgba(15,23,42,0.16)",
                        }}
                      >
                        Vigamox
                      </span>
                      <span>ימים 1–8 – 4 פעמים ביום.</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${
                            getMedicationColor("Systane Balance") ??
                            "#e5e7eb"
                          }22`,
                          color:
                            getMedicationColor("Systane Balance") ??
                            "#0f172a",
                          borderColor:
                            getMedicationColor("Systane Balance") ??
                            "rgba(15,23,42,0.16)",
                        }}
                      >
                        Systane Balance
                      </span>
                      <span>
                        ימים 1–8 – 6 פעמים ביום;
                        ימים 9–31 – 4 פעמים ביום.
                      </span>
                    </li>
                  </ul>
                ) : (
                  <ul className="space-y-1.5">
                    <li className="flex items-start gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${
                            getMedicationColor("Sterodex") ?? "#e5e7eb"
                          }22`,
                          color: getMedicationColor("Sterodex") ?? "#0f172a",
                          borderColor:
                            getMedicationColor("Sterodex") ??
                            "rgba(15,23,42,0.16)",
                        }}
                      >
                        Sterodex
                      </span>
                      <span>
                        שבוע 1 – 4 פעמים ביום;
                        שבוע 2 – 3 פעמים ביום;
                        שבוע 3 – בוקר וערב;
                        שבוע 4 – פעם ביום.
                      </span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${
                            getMedicationColor("Vigamox") ?? "#e5e7eb"
                          }22`,
                          color: getMedicationColor("Vigamox") ?? "#0f172a",
                          borderColor:
                            getMedicationColor("Vigamox") ??
                            "rgba(15,23,42,0.16)",
                        }}
                      >
                        Vigamox
                      </span>
                      <span>שבוע ראשון – 4 פעמים ביום.</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${
                            getMedicationColor("Dicloftil") ?? "#e5e7eb"
                          }22`,
                          color: getMedicationColor("Dicloftil") ?? "#0f172a",
                          borderColor:
                            getMedicationColor("Dicloftil") ??
                            "rgba(15,23,42,0.16)",
                        }}
                      >
                        Dicloftil
                      </span>
                      <span>3 הימים הראשונים – 3 פעמים ביום.</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${
                            getMedicationColor("Systane Balance") ??
                            "#e5e7eb"
                          }22`,
                          color:
                            getMedicationColor("Systane Balance") ??
                            "#0f172a",
                          borderColor:
                            getMedicationColor("Systane Balance") ??
                            "rgba(15,23,42,0.16)",
                        }}
                      >
                        Systane Balance
                      </span>
                      <span>חודש שלם – 6 פעמים ביום.</span>
                    </li>

                    <li className="flex items-start gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium"
                        style={{
                          backgroundColor: `${
                            getMedicationColor("Vitapos") ?? "#e5e7eb"
                          }22`,
                          color: getMedicationColor("Vitapos") ?? "#0f172a",
                          borderColor:
                            getMedicationColor("Vitapos") ??
                            "rgba(15,23,42,0.16)",
                        }}
                      >
                        Vitapos
                      </span>
                      <span>שבוע 2–3 – בוקר ולפני השינה.</span>
                    </li>
                  </ul>
                )}

                <p className="mt-2 text-[10px] text-slate-500">
                  החישוב נעשה אוטומטית על בסיס שעות הערות שהזנת. תמיד מומלץ לוודא מול המרשם
                  והוראות הרופא.
                </p>
              </div>


              {error && (
                <div className="mt-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-sky-500/40 transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400"
                >
                  {loading ? "יוצר לוח זמנים..." : "צור לוח זמנים לפי הפרוטוקול"}
                </button>
              </div>
            </div>
          </div>

          {/* סיכום + לוח זמנים */}
          <div ref={resultRef} className="space-y-4 lg:space-y-5">
            <PrescriptionView prescription={prescription} />
            <ScheduleView schedule={schedule} />
          </div>
        </div>
      </div>
    </section>
  );
}
