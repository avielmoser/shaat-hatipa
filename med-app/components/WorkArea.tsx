// components/WorkArea.tsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useTranslations } from 'next-intl';
import type {
  LaserPrescriptionInput,
  DoseSlot,
  SurgeryType,
} from "../types/prescription";

import SurgeryForm from "./SurgeryForm";
import ProtocolReview from "./ProtocolReview";
import ScheduleDisplay from "./ScheduleDisplay";
import GlobalErrorBoundary from "./GlobalErrorBoundary";
import { normalizeAwakeWindow, isImpossibleAwakeWindow } from "../lib/utils";
import { resolveProtocol } from "../lib/domain/protocol-resolver";
import { trackEvent } from "../lib/client/analytics";
import type { ClinicConfig } from "../config/clinics";

type Step = 1 | 2 | 3;

interface WorkAreaProps {
  clinicConfig?: ClinicConfig | null;
}

export default function WorkArea({ clinicConfig }: WorkAreaProps) {
  const t = useTranslations('Wizard');
  const [step, setStep] = useState<Step>(1);

  // Initialize with null to force user selection
  const [surgeryType, setSurgeryType] = useState<SurgeryType | null>(null);

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
  const [scheduleGenerated, setScheduleGenerated] = useState(false);

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

  // Track Step Views
  useEffect(() => {
    if (step > 1) {
      trackEvent("step_viewed", { eventType: "action", step: String(step), stepName: step === 2 ? "protocol_review" : "schedule_view" });
    }
  }, [step]);

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

  const buildPrescription = (): LaserPrescriptionInput | null => {
    if (!surgeryType) return null; // Should not happen if validation passes

    // Resolve protocol strictly
    // surgeryType state variable actually holds the protocolKey now
    const protocolKey = surgeryType;

    // We expect clinicConfig to be present (page loader handles default)
    // If null, we can't resolve strictly.
    if (!clinicConfig) {
      console.error("Clinic config missing in WorkArea");
      return null;
    }

    let medications: any[] = [];
    try {
      const protocolDef = resolveProtocol(clinicConfig, protocolKey);
      medications = protocolDef.actions;
    } catch (e) {
      console.error("Failed to resolve protocol", e);
      // Fallback or empty?
      // If resolution fails, we can't proceed.
      return null;
    }

    return {
      clinicSlug: clinicConfig.slug,
      protocolKey,
      surgeryType, // Legacy
      surgeryDate,
      wakeTime,
      sleepTime,
      medications,
    };
  };

  const handleContinueToStep2 = () => {
    setError(null);
    setInvalidTime(false);

    if (!surgeryType) {
      setError(t('step1.errors.generic')); // Or a specific "Please select surgery" error
      return;
    }

    if (isImpossibleAwakeWindow(wakeTime, sleepTime)) {
      setError(t('step1.errors.impossibleWakeTime'));
      setInvalidTime(true);
      return;
    }

    const body = buildPrescription();
    if (!body) return;

    setPrescription(body);
    setSchedule([]);
    setStep(2);
    scrollToRef(step2Ref);

  };

  const handleGenerateSchedule = async () => {
    setError(null);

    const body = buildPrescription();
    if (!body) return;

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
      setScheduleGenerated(true);
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
    } catch (e: unknown) {
      console.error(e);
      setPrescription(body);
      const errorMessage = e instanceof Error ? e.message : String(e);
      setError(errorMessage || t('errors.generic'));
      trackEvent("schedule_generation_failed", { eventType: "action", error: errorMessage });
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
  const hasSchedule = scheduleGenerated;

  const stepperItems: { idx: Step; label: string }[] = [
    { idx: 1, label: t('steps.1') },
    { idx: 2, label: t('steps.2') },
    { idx: 3, label: t('steps.3') },
  ];

  return (
    <GlobalErrorBoundary>
      <section
        id="work-area"
        className="px-4 pb-32 pt-6 sm:px-6 lg:px-8 sm:pt-10"
        aria-label="Drop schedule builder workspace"
      >
        <div className="mx-auto max-w-3xl space-y-6 sm:space-y-8">
          {/* Stepper */}
          <nav aria-label={t('steps.1')}>
            <ol
              className="flex items-center justify-center gap-2 sm:gap-4 text-base"
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
                      className={`flex items-center gap-1.5 sm:gap-2 rounded-full px-1 py-1 transition ${canGoForward
                        ? "cursor-pointer"
                        : "cursor-not-allowed opacity-60"
                        }`}
                      aria-current={isActive ? "step" : undefined}
                      aria-label={`Step ${stepItem.idx}: ${stepItem.label}`}
                    >
                      <span
                        className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full border text-xs sm:text-sm font-bold transition ${isDone
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
                        className={`text-sm sm:text-base font-bold transition-colors ${isActive
                          ? "text-sky-800"
                          : isDone
                            ? "text-emerald-700"
                            : canGoForward
                              ? "text-slate-700 hover:text-sky-800"
                              : "text-slate-600"
                          } ${isActive ? "block" : "hidden sm:block"}`}
                      >
                        {stepItem.label}
                      </span>
                    </button>
                    {stepItem.idx < 3 && (
                      <div className="h-0.5 w-4 sm:w-8 bg-slate-200 mx-1 sm:mx-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-emerald-500 transition-all duration-500 ${isDone ? 'w-full' : 'w-0'}`}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>

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
                clinicConfig={clinicConfig}
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
          {step === 3 && hasSchedule && prescription && (
            <div ref={step3Ref}>
              <div ref={scheduleRef}>
                <ScheduleDisplay
                  schedule={schedule}
                  prescription={prescription}
                  onBack={goToStep2}
                  onHome={goHome}
                  clinicConfig={clinicConfig || undefined}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </GlobalErrorBoundary>
  );
}
