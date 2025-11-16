// app/layout.tsx
//
// Root layout for the ShaatHaTipa application. Defines global HTML
// structure, theme colours, and background decoration. The layout uses
// a softened mesh gradient and subtle dot pattern to evoke a clean and
// modern medical feel without distracting from the primary content.

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ShaatHaTipa",
  description: "Personal eye drop schedule generator after laser surgery",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="scroll-smooth">
      <body
        className="min-h-screen bg-slate-50 text-slate-900 antialiased relative overflow-x-hidden font-sans"
      >
        {/* Background mesh gradient */}
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10">
          {/* Base light colour */}
          <div className="absolute inset-0 bg-slate-50" />
          {/* Soft mesh gradient – reduced opacity and blur for subtlety */}
          <div
            className="absolute -inset-[120px] blur-3xl opacity-80 mix-blend-normal"
            style={{
              backgroundImage: `
                radial-gradient(circle at 0% 10%, rgba(56, 189, 248, 0.8) 0, transparent 60%),
                radial-gradient(circle at 100% 20%, rgba(129, 140, 248, 0.7) 0, transparent 55%),
                radial-gradient(circle at 10% 100%, rgba(45, 212, 191, 0.7) 0, transparent 60%),
                radial-gradient(circle at 95% 90%, rgba(56, 189, 248, 0.7) 0, transparent 60%)
              `,
              backgroundRepeat: "no-repeat",
              backgroundSize: "140% 140%",
            }}
          />
          {/* Subtle dot pattern overlay */}
          <div
            className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(148,163,184,0.12)_1px,transparent_0)] bg-[length:22px_22px] opacity-40"
          />
        </div>
        {children}
      </body>
    </html>
  );
}
