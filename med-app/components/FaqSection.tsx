"use client";

import React from "react";

const faqs = [
  {
    q: "Does the system save my data?",
    a: "No. The information is used only for displaying the result and is not saved for personal identification.",
  },
  {
    q: "Does the drop time replace a doctor?",
    a: "Absolutely not. The tool is designed to help understand prescriptions conveniently, but you should always verify every instruction with your treating physician.",
  },
  {
    q: "Which prescriptions are supported?",
    a: "Printed prescriptions in Hebrew or English, specifically standard eye drops and pills.",
  },
];

export default function FaqSection() {
  return (
    <section className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 space-y-3">
      <h2 className="text-xl font-semibold text-slate-800">
        Frequently Asked Questions
      </h2>
      <div className="space-y-2">
        {faqs.map((item) => (
          <details
            key={item.q}
            className="bg-slate-50 rounded-xl border border-slate-100 px-3 py-2 text-sm"
          >
            <summary className="cursor-pointer font-semibold text-slate-800">
              {item.q}
            </summary>
            <p className="mt-1 text-slate-600 text-xs">{item.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
