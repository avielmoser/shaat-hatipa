// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { ClinicBrandProvider } from "../components/ClinicBrandProvider";

export const metadata: Metadata = {
  title: "ShaatHaTipa",
  description: "Personal eye drop schedule generator after laser surgery",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" className="scroll-smooth">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased relative overflow-x-hidden font-sans">
        {/* הרקע שלך נשאר כמו שהוא... */}

        <ClinicBrandProvider>
          {children}
        </ClinicBrandProvider>
      </body>
    </html>
  );
}
