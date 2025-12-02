"use client";

import { motion } from "framer-motion";

export default function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "Upload Prescription or Enter Data",
      desc: "The system accepts drop types and recommended intervals, based on a fixed medical protocol or your manual input.",
    },
    {
      number: 2,
      title: "Smart Schedule Calculation",
      desc: "The algorithm calculates exact times based on your waking hours, surgery time, and required treatment intervals.",
    },
    {
      number: 3,
      title: "Quick Manual Approval",
      desc: "You verify that all times are convenient – you can change and save personal adjustments before receiving the final schedule.",
    },
    {
      number: 4,
      title: "Export and Add to Calendar",
      desc: "With one click, you can download an .ICS file and add the drops directly to your calendar – or view the weekly schedule in the app.",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center sm:text-start">
        <h2 className="text-lg font-semibold text-sky-600 sm:text-xl">
          How It Works
        </h2>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          The entire process takes seconds – clear, smart, and fully under your control.
        </p>
      </div>

      <div className="grid gap-4 sm:gap-6">
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1, duration: 0.4 }}
            className="group relative flex flex-col gap-1 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:shadow-sky-50 sm:flex-row sm:items-start sm:gap-4 sm:p-5"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/90 font-semibold text-white shadow-sm shadow-sky-400/40 sm:h-11 sm:w-11">
              {step.number}
            </div>

            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-800 sm:text-base">
                {step.title}
              </h3>
              <p className="text-xs text-slate-500 sm:text-sm">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
