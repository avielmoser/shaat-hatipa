"use client";

import React from "react";

const faqs = [
  {
    q: "האם המערכת שומרת את הנתונים שלי?",
    a: "לא. המידע משמש רק לצורך הצגת התוצאה ואינו נשמר לצורך זיהוי אישי.",
  },
  {
    q: "האם שעת הטיפה מחליפה רופא?",
    a: "ממש לא. הכלי מיועד לעזור להבין מרשמים בצורה נוחה, אבל תמיד צריך לאמת כל הוראה עם הרופא המטפל.",
  },
  {
    q: "איזה מרשמים נתמכים?",
    a: "מרשמים מודפסים בעברית או באנגלית, בפרט מרשמי טיפות עיניים וכדורים סטנדרטיים.",
  },
];

export default function FaqSection() {
  return (
    <section className="bg-white rounded-2xl shadow-md border border-slate-100 p-5 space-y-3">
      <h2 className="text-xl font-semibold text-slate-800">
        שאלות נפוצות
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
