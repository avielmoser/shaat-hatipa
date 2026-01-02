// app/accessibility/page.tsx
import Link from "next/link";

export default function AccessibilityPage() {
  return (
    <div className="min-h-screen bg-white text-slate-900" dir="rtl">
      {/* גרדיאנט עדין למעלה */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-64 bg-gradient-to-b from-sky-100 via-sky-50/40 to-transparent blur-2xl"
        aria-hidden="true"
      />

      {/* HEADER פשוט עם חזרה לדף הבית */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/90 text-sm font-semibold text-white shadow-sm shadow-sky-500/40">
              💧
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">
                ShaatHaTipa
              </span>
              <span className="text-xs text-slate-500">
                לוח זמנים חכם לטיפות עיניים
              </span>
            </div>
          </Link>

          <nav className="hidden items-center gap-4 text-xs text-slate-600 sm:flex">
            <Link
              href="/"
              className="rounded-full px-3 py-1 font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
            >
              חזרה לדף הבית
            </Link>
          </nav>
        </div>
      </header>

      {/* תוכן העמוד */}
      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-16 pt-8 sm:px-6 lg:px-8">
        <section className="space-y-4 sm:space-y-6">
          <div className="space-y-2 text-center sm:text-start">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              הצהרת נגישות
            </h1>
            <p className="mx-auto max-w-3xl text-sm text-slate-600 sm:text-base">
              המערכת ShaatHaTipa נבנתה מתוך הבנה שמטופלים אחרי ניתוח עיניים
              זקוקים למידע ברור, פשוט ונגיש – במיוחד בתקופה רגישה של התאוששות.
              המטרה שלנו היא לאפשר לכל מטופל להשתמש במערכת באופן נוח, שוויוני
              ועצמאי ככל האפשר.
            </p>
          </div>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              המחויבות שלנו לנגישות
            </h2>
            <p className="text-sm text-slate-600 sm:text-base">
              האתר והמערכת פותחו בהשראת עקרונות התקן{" "}
              <span className="font-medium">WCAG 2.1 ברמת AA</span>, ככל הניתן,
              ונמצאים בתהליך שיפור מתמשך בהתאם למשוב משתמשים וצורכי מטופלים.
            </p>

            <p className="rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900 sm:text-base">
              <span className="font-semibold">
                המשפט המרכזי שתוכל גם לצטט מול רופאים:
              </span>
              <br />
              <span>
                האתר פותח מתוך מחויבות לאפשר לכל מטופל – ללא קשר ליכולת הראייה,
                הקשב או השליטה הטכנולוגית שלו – לקבל גישה פשוטה, ברורה ובטוחה
                להנחיות הטיפול שקיבל מהרופא.
              </span>
            </p>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              מה עשינו בפועל כדי לשפר נגישות?
            </h2>
            <ul className="list-disc space-y-2 pe-5 text-sm text-slate-600 sm:text-base">
              <li>מבנה עמודים ברור עם כותרות מסודרות וסדר לוגי של תוכן.</li>
              <li>טפסים עם תוויות (labels) ברורות וקישור מלא בין שדות להנחיות.</li>
              <li>אפשרות ניווט באמצעות מקלדת בלבד (Tab, Shift+Tab, Enter).</li>
              <li>צבעי טקסט ורקע עם יחס ניגודיות המתאים לקריאה נוחה.</li>
              <li>
                הודעות שגיאה ברורות עם קריאה מודגשת – כך שגם משתמשים עם קורא
                מסך יוכלו להבין מה נדרש לתיקון.
              </li>
            </ul>
          </section>

          <section className="space-y-3 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
              משוב על נגישות
            </h2>
            <p className="text-sm text-slate-600 sm:text-base">
              אם נתקלת בקושי בשימוש באתר או בלוח הזמנים, נשמח מאוד לדעת – כדי
              שנוכל לשפר. אפשר לפנות אלינו ולתאר את הבעיה, סוג המכשיר/דפדפן
              שבו השתמשת, ואיזה פעולה ניסית לבצע.
            </p>
            <p className="text-sm text-slate-600 sm:text-base">
              ניתן ליצור קשר בדוא&quot;ל:
              <span className="font-medium"> example@shaat-hatipot.com</span>{" "}
              (ניתן להחליף לכתובת האמיתית שלך).
            </p>
          </section>

          <div className="mt-4 flex justify-center sm:justify-start">
            <Link
              href="/"
              className="rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-sky-500/40 transition hover:bg-sky-700 hover:-translate-y-0.5"
            >
              חזרה ללוח הזמנים לטיפות
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
