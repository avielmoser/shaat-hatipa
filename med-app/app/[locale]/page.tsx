// app/page.tsx

import HeroSection from "../../components/HeroSection";
import WorkArea from "../../components/WorkArea";
import { resolveClinicConfig } from "../../lib/domain/protocol-resolver";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { clinic } = await searchParams;
  const clinicId = Array.isArray(clinic) ? clinic[0] : clinic;
  const clinicConfig = resolveClinicConfig(clinicId);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main>
        <HeroSection clinicConfig={clinicConfig} />
        <WorkArea clinicConfig={clinicConfig} />
      </main>

      <footer className="border-t border-slate-200 bg-white/80 py-4 text-center text-sm text-slate-500">
        Developed and built by Aviel Moser
      </footer>
    </div>
  );
}
