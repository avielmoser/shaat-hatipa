export default function Footer() {
  return (
    <footer className="mt-6 border-t border-slate-200 bg-white/90">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 text-[11px] text-slate-500 lg:flex-row lg:items-center lg:justify-between lg:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-slate-700">
            שעת הטיפות © {new Date().getFullYear()}
          </span>
          <span className="hidden h-3 w-px bg-slate-300 sm:inline-block" />
          <span>
            כלי עזר לניהול לוח זמנים לטיפול. אין לראות במידע המוצג תחליף לייעוץ
            רפואי.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href="#work-area"
            className="text-[11px] text-slate-500 hover:text-slate-700"
          >
            חזרה לבניית לוח זמנים
          </a>
          <span className="text-[11px] text-slate-400">
            תנאי שימוש · מדיניות פרטיות
          </span>
        </div>
      </div>
    </footer>
  );
}
