import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Med App",
  description: "Prescription scheduler MVP",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
   <html lang="he" dir="rtl">
    <body
  className="
    min-h-screen
    bg-slate-50
    text-slate-900
    relative
    overflow-x-hidden
  "
>
  {/* רקע Mesh רפואי יוקרתי */}
<div
  aria-hidden="true"
  className="pointer-events-none fixed inset-0 -z-50"
>
  {/* בסיס בהיר */}
  <div className="absolute inset-0 bg-slate-50" />

  {/* שכבת Mesh Gradient – גרסה חזקה */}
  <div
    className="
      absolute
      -inset-[150px]
      blur-2xl              /* פחות blur → יותר צבע מורגש */
      opacity-95            /* כמעט מלא – אבל לא מוגזם */
      mix-blend-normal
      transition-all
    "
    style={{
      backgroundImage: `
        radial-gradient(circle at 0% 0%, rgba(56, 189, 248, 0.90) 0, transparent 55%),
        radial-gradient(circle at 100% 10%, rgba(129, 140, 248, 0.85) 0, transparent 52%),
        radial-gradient(circle at 12% 100%, rgba(45, 212, 191, 0.85) 0, transparent 55%),
        radial-gradient(circle at 90% 90%, rgba(56, 189, 248, 0.85) 0, transparent 55%)
      `,
      backgroundRepeat: "no-repeat",
      backgroundSize: "120% 120%",  // יותר קטן → צבעים מרוכזים יותר
    }}
  />

  {/* Pattern עדין מעל הכול (נקודות) */}
  <div
    className="
      absolute inset-0
      bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.18)_1px,transparent_0)]
      bg-[length:22px_22px]
      opacity-50
    "
  />
</div>


  {children}
</body>




    </html>
  );
}
