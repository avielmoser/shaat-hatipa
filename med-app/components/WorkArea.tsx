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
import { getInterlasikMedications, getPrkMedications } from "../constants/protocols";

type Step = 1 | 2 | 3;

const stepperItems: { idx: Step; label: string }[] = [
  { idx: 1, label: "Surgery Details" },
  { idx: 2, label: "Protocol Review" },
  { idx: 3, label: "Schedule" },
];


export default function WorkArea() {
  const [step, setStep] = useState<Step>(1);

  const [surgeryType, setSurgeryType] = useState<SurgeryType>("INTERLASIK");
  const [surgeryDate, setSurgeryDate] = useState<string>(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    return `${year}-${month}-${day}`;
  });
  const [wakeTime, setWakeTime] = useState<string>("08:00");
  const [sleepTime, setSleepTime] = useState<string>("22:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [invalidTime, setInvalidTime] = useState<boolean>(false);
  const [prescription, setPrescription] =
    useState<LaserPrescriptionInput | null>(null);
  const [schedule, setSchedule] = useState<DoseSlot[]>([]);

  const step1Ref = useRef<HTMLDivElement | null>(null);
  const step2Ref = useRef<HTMLDivElement | null>(null);
  const step3Ref = useRef<HTMLDivElement | null>(null);
  const scheduleRef = useRef<HTMLDivElement | null>(null);

  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  useEffect(() => {
    if (schedule.length > 0 && step === 3 && scheduleRef.current) {
      scheduleRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [schedule.length, step]);

  // ===== Navigation =====

  const goToStep1 = () => {
    setStep(1);
    scrollToRef(step1Ref);
  };

  const goToStep2 = () => {
    if (!prescription) return;
    setStep(2);
    scrollToRef(step2Ref);
  };

  const goToStep3 = () => {
    if (schedule.length === 0) return;
    setStep(3);
    scrollToRef(step3Ref);
  };

  const handleStepClick = (target: Step) => {
    if (target === step) return;

    if (target === 1) {
      goToStep1();
      return;
    }

    if (target === 2) {
      goToStep2();
      return;
    }

    if (target === 3) {
      goToStep3();
    }
  };

  // ===== Button Logic =====

  const buildPrescription = (): LaserPrescriptionInput => {
    const { awakeMinutes } = normalizeAwakeWindow(wakeTime, sleepTime);
    const medications =
      surgeryType === "INTERLASIK"
        ? getInterlasikMedications(awakeMinutes)
        : getPrkMedications();

    return {
      surgeryType,
      surgeryDate,
      wakeTime,
      sleepTime,
      medications,
    };
  };

  const handleContinueToStep2 = () => {
    setError(null);
    setInvalidTime(false);

    if (isImpossibleAwakeWindow(wakeTime, sleepTime)) {
      setError("Error – You cannot wake up before you go to sleep");
      setInvalidTime(true);
      return;
    }

    const body = buildPrescription();

    setPrescription(body);
    setSchedule([]);
    setStep(2);
    scrollToRef(step2Ref);
  };

  const handleGenerateSchedule = async () => {
    setError(null);

    const body = buildPrescription();

    setLoading(true);
    try {
      const res = await fetch("/api/generate-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Error generating schedule");
      }

      const json = await res.json();
      setPrescription(json.prescription ?? body);
      setSchedule(json.schedule);
      setStep(3);
      scrollToRef(step3Ref);
    } catch (e: any) {
      console.error(e);
      setPrescription(body);
      setError(e.message || "Something went wrong, please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ===== Step 3 Buttons =====

  const goHome = () => {
    setStep(1);
    scrollToRef(step1Ref);
  };

  const hasPrescription = !!prescription;
  const hasSchedule = schedule.length > 0;

  return (
    <section
      id="work-area"
      className="px-4 pb-24 pt-10 sm:px-6 lg:px-8 sm:pt-16"
      aria-label="Drop schedule builder workspace"
    >
      <div className="mx-auto max-w-3xl space-y-8 sm:space-y-10">
        {/* Stepper */}
        <ol
          className="flex items-center justify-center gap-4 text-sm"
          aria-label="Schedule creation steps"
        >
          {stepperItems.map((stepItem) => {
            const isActive = step === stepItem.idx;
            const isDone = step > stepItem.idx;

            const canGoForward =
              stepItem.idx === 1 ||
              (stepItem.idx === 2 && hasPrescription) ||
              (stepItem.idx === 3 && hasSchedule);

            return (
              <li key={stepItem.idx} className="flex items-center">
                <button
                  type="button"
                  onClick={() => {
                    if (canGoForward) {
                      handleStepClick(stepItem.idx);
                    }
                  }}
                  disabled={!canGoForward}
                  className={`flex items-center gap-2 rounded-full px-2 py-1 transition ${canGoForward
                    ? "cursor-pointer"
                    : "cursor-not-allowed opacity-60"
                    }`}
                  aria-current={isActive ? "step" : undefined}
                  aria-label={`Step ${stepItem.idx}: ${stepItem.label}`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold transition ${isDone
                      ? "bg-emerald-500 border-emerald-500 text-white"
                      : isActive
                        ? "bg-sky-600 border-sky-600 text-white"
                        : "bg-slate-200 border-slate-300 text-slate-600"
                      }`}
                    aria-hidden="true"
                  >
                    {stepItem.idx}
                  </span>
                  <span
                    className={`text-xs sm:text-sm font-medium ${isActive
                      ? "text-sky-700"
                      : isDone
                        ? "text-emerald-600"
                        : canGoForward
                          ? "text-slate-700 hover:text-sky-700"
                          : "text-slate-500"
                      }`}
                  >
                    {stepItem.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* ===== Step 1 – Surgery Details ===== */}
        {step === 1 && (
          <div
            ref={step1Ref}
            className="relative space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:space-y-6 sm:p-6"
            aria-labelledby="step1-title"
          >
            <div className="space-y-1">
              <h2
                id="step1-title"
                className="text-lg font-semibold text-slate-900 sm:text-2xl"
              >
                Surgery Details
              </h2>
              <p className="text-xs text-slate-600 sm:text-sm">
                Select surgery type, date, and waking hours – then you'll see a structured protocol summary and finally a detailed drop schedule.
              </p>
            </div>

            <div className="space-y-3 text-sm sm:space-y-4">
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="surgery-type"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Surgery Type
                  </label>
                  <select
                    id="surgery-type"
                    value={surgeryType}
                    onChange={(e) => {
                      setSurgeryType(e.target.value as SurgeryType);
                      setSchedule([]); // Reset schedule on change
                    }}
                    className="block w-full appearance-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  >
                    <option value="INTERLASIK">INTERLASIK</option>
                    <option value="PRK">PRK</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="surgery-date"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Surgery Date
                  </label>
                  <input
                    id="surgery-date"
                    type="date"
                    value={surgeryDate}
                    onChange={(e) => {
                      setSurgeryDate(e.target.value);
                      setSchedule([]); // Reset schedule on change
                    }}
                    className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div className="space-y-1">
                  <label
                    htmlFor="wake-time"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Wake Up Time
                  </label>
                  <input
                    id="wake-time"
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className={`block w-full rounded-lg border px-3 py-2 text-base text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 ${invalidTime
                      ? "border-red-500"
                      : "border-slate-300 focus:border-sky-400"
                      }`}
                    aria-invalid={invalidTime || undefined}
                    aria-describedby={invalidTime ? "time-error" : undefined}
                  />
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="sleep-time"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Bedtime
                  </label>
                  <input
                    id="sleep-time"
                    type="time"
                    value={sleepTime}
                    onChange={(e) => setSleepTime(e.target.value)}
                    className={`block w-full rounded-lg border px-3 py-2 text-base text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-200 ${invalidTime
                      ? "border-red-500"
                      : "border-slate-300 focus:border-sky-400"
                      }`}
                    aria-invalid={invalidTime || undefined}
                    aria-describedby={invalidTime ? "time-error" : undefined}
                  />
                </div>
              </div>

              {error && (
                <div
                  id="time-error"
                  className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:text-sm"
                >
                  {error}
                </div>
              )}
            </div>

            {/* Spacer */}
            <div className="h-12 sm:h-14" />

            {/* Floating Button Step 2 */}
            <div className="pointer-events-none sticky bottom-4 z-30">
              <div className="pointer-events-auto mx-auto max-w-xs rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/15">
                <button
                  type="button"
                  onClick={handleContinueToStep2}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 sm:text-base"
                >
                  Continue to Step 2 – Protocol Review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ===== Step 2 – Protocol Review ===== */}
        {step === 2 && prescription && (
          <div
            className="relative space-y-4"
            ref={step2Ref}
            aria-labelledby="step2-title"
          >
            <div className="flex items-center justify-between">
              <h2
                id="step2-title"
                className="text-lg font-semibold text-slate-900 sm:text-2xl"
              >
                Protocol Review
              </h2>
              <button
                type="button"
                onClick={goToStep1}
                className="text-xs text-slate-500 underline-offset-2 hover:text-slate-700 hover:underline sm:text-sm"
              >
                Back to Step 1 – Surgery Details
              </button>
            </div>

            <PrescriptionView prescription={prescription} />

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 sm:text-sm">
                {error}
              </div>
            )}

            {/* Spacer */}
            <div className="h-14 sm:h-16" />

            {/* Floating Buttons */}
            <div className="pointer-events-none sticky bottom-4 z-30">
              <div className="pointer-events-auto mx-auto max-w-md rounded-2xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg shadow-slate-900/15">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <button
                    type="button"
                    onClick={handleGenerateSchedule}
                    disabled={loading}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-sky-400 sm:text-base"
                  >
                    {loading
                      ? "Generating Schedule..."
                      : "Continue to Step 3 – Schedule"}
                  </button>
                  <button
                    type="button"
                    onClick={goToStep1}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 sm:text-base"
                  >
                    Back to Step 1
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== Step 3 – Schedule ===== */}
        {step === 3 && hasSchedule && (
          <div
            className="relative space-y-4"
            ref={step3Ref}
            aria-labelledby="step3-title"
          >
            <div className="flex items-center justify-between">
              <h2
                id="step3-title"
                className="text-lg font-semibold text-slate-900 sm:text-2xl"
              >
                Drop Schedule
              </h2>
            </div>

            <div ref={scheduleRef}>
              <ScheduleView schedule={schedule} />
            </div>

            {/* Spacer */}
            <div className="h-14 sm:h-16" />

            {/* Floating Buttons */}
            <div className="pointer-events-none sticky bottom-4 z-30">
              <div className="pointer-events-auto mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 shadow-lg shadow-slate-900/15">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={goToStep2}
                    className="h-14 md:h-16 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-700 leading-snug hover:bg-slate-50 sm:text-base"
                  >
                    Back to Step 2
                    <br />
                    Protocol Review
                  </button>

                  <button
                    type="button"
                    onClick={goHome}
                    className="h-14 md:h-16 w-full rounded-xl bg-slate-100 px-3 text-sm font-semibold text-slate-900 hover:bg-slate-200 sm:text-base"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
