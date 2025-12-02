"use client";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/85 backdrop-blur supports-[backdrop-filter]:bg-white/75">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2.5 lg:px-6">
        {/* לוגו / שם המוצר */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-600 text-base font-bold text-white shadow-sm">
            ט
          </div>
          <div className="leading-tight">
            <p className="text-lg font-bold text-slate-900">
              שעת הטיפות
            </p>
            <p className="text-sm text-slate-700">
              לוח זמנים חכם לטיפות עיניים
            </p>
          </div>
        </div>

        {/* ניווט קצר / תג מצב */}
        <nav className="flex items-center gap-3 text-base">
          <a
            href="#work-area"
            className="hidden rounded-full px-4 py-2 font-medium text-slate-700 hover:bg-slate-100 sm:inline-flex"
          >
            בניית לוח זמנים
          </a>

          <span className="rounded-full bg-sky-50 px-3 py-1 text-sm font-bold text-sky-800 shadow-sm border-2 border-sky-100">
            גרסת ניסיון · לא מחליף ייעוץ רפואי
          </span>
        </nav>
      </div>
    </header>
  );
}
