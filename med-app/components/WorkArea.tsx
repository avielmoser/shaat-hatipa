// components/WorkArea.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from 'next-intl';
import type {
  LaserPrescriptionInput,
  DoseSlot,
  SurgeryType,
} from "../types/prescription";

import PrescriptionView from "./PrescriptionView";
import ScheduleView from "./ScheduleView";
import SurgeryForm from "./SurgeryForm";
import ProtocolReview from "./ProtocolReview";
import ScheduleDisplay from "./ScheduleDisplay";
import GlobalErrorBoundary from "./GlobalErrorBoundary";
import { normalizeAwakeWindow, isImpossibleAwakeWindow } from "../lib/utils";
import { resolveProtocol } from "../lib/domain/protocol-resolver";
import { trackEvent } from "../lib/client/analytics";
import type { ClinicBrand } from "../config/clinics";

type Step = 1 | 2 | 3;

interface WorkAreaProps {
  clinicConfig?: ClinicBrand;
}

export default function WorkArea({ clinicConfig }: WorkAreaProps) {
  const t = useTranslations('Wizard');
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

  // ... existing refs ...
  const step1Ref = useRef<HTMLDivElement | null>(null);
  const step2Ref = useRef<HTMLDivElement | null>(null);
  const step3Ref = useRef<HTMLDivElement | null>(null);
  const scheduleRef = useRef<HTMLDivElement | null>(null);

  // ... existing scrollToRef ...
  const scrollToRef = (ref: React.RefObject<HTMLDivElement | null>) => {
    if (ref.current) {
      ref.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  // ... existing useEffect ...
  useEffect(() => {
    trackEvent("wizard_viewed", { eventType: "page_view" });
  }, []);

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
    const medications = resolveProtocol(clinicConfig, surgeryType, awakeMinutes);

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
      setError(t('step1.errors.impossibleWakeTime'));
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

      trackEvent("generate_schedule_clicked", { eventType: "action", surgeryType });

      const json = await res.json();

      if (!res.ok) {
        // Handle specific error codes
        if (res.status === 422 && json.code === "IMPOSSIBLE_SCHEDULE") {
          throw new Error(`Impossible Schedule: ${json.error}`);
        }
        throw new Error(json?.error || "Error generating schedule");
      }

      setPrescription(json.prescription ?? body);
      setSchedule(json.schedule);
      setStep(3);
      scrollToRef(step3Ref);

      // Calculate some stats for analytics
      const totalDoses = json.schedule.length;
      const days = new Set(json.schedule.map((s: DoseSlot) => s.date)).size;
      const meds = new Set(json.schedule.map((s: DoseSlot) => s.medicationId)).size;

      trackEvent("schedule_generated", {
        eventType: "conversion",
        slots: totalDoses,
        days,
        uniqueMeds: meds,
        surgeryType: body.surgeryType,
        wakeTime: body.wakeTime,
        sleepTime: body.sleepTime,
        clinic: clinicConfig?.name,
      });
    } catch (e: any) {
      console.error(e);
      setPrescription(body);
      setError(e.message || t('errors.generic'));
      trackEvent("schedule_generation_failed", { eventType: "action", error: e.message });
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

  const stepperItems: { idx: Step; label: string }[] = [
    { idx: 1, label: t('steps.1') },
    { idx: 2, label: t('steps.2') },
    { idx: 3, label: t('steps.3') },
  ];

  return (
    <GlobalErrorBoundary>
      <section
        id="work-area"
        className="px-4 pb-24 pt-10 sm:px-6 lg:px-8 sm:pt-16"
        aria-label="Drop schedule builder workspace"
      >
        <div className="mx-auto max-w-3xl space-y-8 sm:space-y-10">
          {/* Stepper */}
          <ol
            className="flex items-center justify-center gap-4 text-base"
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
                      className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-bold transition ${isDone
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
                      className={`text-sm sm:text-base font-bold ${isActive
                        ? "text-sky-800"
                        : isDone
                          ? "text-emerald-700"
                          : canGoForward
                            ? "text-slate-700 hover:text-sky-800"
                            : "text-slate-600"
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
            <div ref={step1Ref}>
              <SurgeryForm
                surgeryType={surgeryType}
                setSurgeryType={(val) => {
                  setSurgeryType(val);
                  setSchedule([]);
                }}
                surgeryDate={surgeryDate}
                setSurgeryDate={(val) => {
                  setSurgeryDate(val);
                  setSchedule([]);
                }}
                wakeTime={wakeTime}
                setWakeTime={setWakeTime}
                sleepTime={sleepTime}
                setSleepTime={setSleepTime}
                invalidTime={invalidTime}
                error={error}
                onNext={handleContinueToStep2}
              />
            </div>
          )}

          {/* ===== Step 2 – Protocol Review ===== */}
          {step === 2 && prescription && (
            <div ref={step2Ref}>
              <ProtocolReview
                prescription={prescription}
                error={error}
                loading={loading}
                onBack={goToStep1}
                onGenerate={handleGenerateSchedule}
              />
            </div>
          )}

          {/* ===== Step 3 – Schedule ===== */}
          {step === 3 && hasSchedule && (
            <div ref={step3Ref}>
              <div ref={scheduleRef}>
                <ScheduleDisplay
                  schedule={schedule}
                  onBack={goToStep2}
                  onHome={goHome}
                  clinicConfig={clinicConfig}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </GlobalErrorBoundary>
  );
}
