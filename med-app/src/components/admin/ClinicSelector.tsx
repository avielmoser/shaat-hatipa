"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CLINICS, defaultClinic } from "@/config/clinics";

export function ClinicSelector() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    // Get current value or null (for "All")
    const currentClinic = searchParams.get("clinic");

    const handleSelect = (slug: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (slug === "all") {
            params.delete("clinic");
        } else {
            params.set("clinic", slug);
        }
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider hidden md:block">
                Clinic:
            </span>
            <select
                value={currentClinic || "all"}
                onChange={(e) => handleSelect(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-300 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2"
            >
                <option value="all">All Clinics</option>
                {Object.values(CLINICS).map((clinic) => (
                    <option key={clinic.id} value={clinic.slug}>
                        {clinic.name} ({clinic.slug})
                    </option>
                ))}
            </select>
        </div>
    );
}
