// app/page.tsx

import HeroSection from "../components/HeroSection";
import WorkArea from "../components/WorkArea";

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        <HeroSection />
        <WorkArea />
      </main>

      <footer className="border-t border-slate-200 bg-white/80 py-4 text-center text-[11px] text-slate-400">
        פותח ונבנה על ידי אביאל מאוזר
      </footer>
    </div>
  );
}
