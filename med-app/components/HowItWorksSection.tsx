"use client";

import { motion } from "framer-motion";

export default function HowItWorksSection() {
  const steps = [
    {
      number: 1,
      title: "העלאת המרשם או הזנת הנתונים",
      desc: "המערכת מקבלת את סוגי הטיפות והמרווחים המומלצים, לפי פרוטוקול רפואי קבוע או לפי הזנה ידנית שלך.",
    },
    {
      number: 2,
      title: "חישוב לוח זמנים חכם",
      desc: "האלגוריתם מחשב את השעות המדויקות לפי שעות הערות שלך, זמן הניתוח, ומרווחי הטיפול הנדרשים.",
    },
    {
      number: 3,
      title: "אישור ידני מהיר",
      desc: "אתה בודק שכל השעות נוחות לך – אפשר לשנות ולשמור התאמות אישיות לפני קבלת הלוח הסופי.",
    },
    {
      number: 4,
      title: "ייצוא והוספה ליומן שלך",
      desc: "בלחיצה אחת אפשר להוריד קובץ .ICS ולהוסיף את הטיפות ישירות ליומן – או לצפות בלוח השבועי באפליקציה.",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      <div className="text-center sm:text-start">
        <h2 className="text-lg font-semibold text-sky-600 sm:text-xl">
          איך זה עובד
        </h2>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          כל התהליך מתבצע תוך שניות – ברור, חכם, ועם שליטה מלאה בידיים שלך.
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
