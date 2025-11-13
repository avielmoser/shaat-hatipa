import Link from "next/link";
import HowItWorksSection from "../../components/HowItWorksSection";

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* גרדיאנט עדין למעלה */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-0 h-64 bg-gradient-to-b from-sky-100 via-sky-50/40 to-transparent blur-2xl"
        aria-hidden="true"
      />

      {/* HEADER מודרני עם לוגו וניווט */}
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* לוגו – תמיד מחזיר לעמוד הבית */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/90 text-sm font-semibold text-white shadow-sm shadow-sky-500/40">
              💧
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">
                Sha’at HaTipot
              </span>
              <span className="text-xs text-slate-500">
                Smart prescription scheduler
              </span>
            </div>
          </Link>

          {/* ניווט עליון */}
          <nav className="hidden items-center gap-5 text-sm text-slate-600 sm:flex">
            {/* הקישור הזה "אקטיבי" בעמוד הנוכחי */}
            <Link
              href="/how-it-works"
              className="rounded-full px-3 py-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 hover:text-slate-800 transition"
            >
              איך זה עובד
            </Link>

            <Link
              href="/privacy"
              className="rounded-full px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
            >
              פרטיות
            </Link>

            <Link
              href="/"
              className="rounded-full border border-sky-500/80 bg-sky-500/90 px-4 py-1.5 text-xs font-semibold text-white shadow-sm shadow-sky-500/40 transition hover:-translate-y-0.5 hover:shadow-md hover:shadow-sky-400/70"
            >
              התחל עכשיו
            </Link>
          </nav>
        </div>
      </header>

      {/* תוכן העמוד */}
      <main className="relative z-10 mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-10 pt-6 sm:gap-10 sm:px-6 lg:px-8">
        {/* כותרת העמוד */}
        <section className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            איך זה עובד?
          </h1>
          <p className="max-w-2xl text-sm text-slate-500 sm:text-base">
            ככה המערכת בונה עבורך לוח זמנים חכם למרשמים ולתרופות – שלב אחרי
            שלב, בצורה ברורה ומדויקת, כדי שלא תפספס אף מנה.
          </p>
        </section>

        {/* סקשן "איך זה עובד" בתוך כרטיס */}
        <section
          className="rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm shadow-slate-200 transition duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-sky-100 sm:p-6"
          aria-label="איך המערכת פועלת עבור מרשמים ותרופות"
        >
          <HowItWorksSection />
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-200/80 bg-white/70">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-4 text-xs text-slate-400 sm:flex-row sm:px-6 lg:px-8">
          <span>© {new Date().getFullYear()} Sha’at HaTipot.</span>
          <div className="flex gap-4">
            <span className="hover:text-slate-600 transition">
              תנאים ושמירה על פרטיות
            </span>
            <span className="hover:text-slate-600 transition">
              פידבק על המערכת
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
