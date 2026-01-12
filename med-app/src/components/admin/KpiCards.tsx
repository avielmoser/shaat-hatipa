
import { Users, FileText, Activity } from "lucide-react";
import { AdminKpis } from "@/server/admin/queries";

export default function KpiCards({ kpis }: { kpis: AdminKpis }) {
    // Calculate conversion rate safely
    const conversionRate = kpis.sessionStartCount > 0
        ? ((kpis.scheduleGeneratedCount / kpis.sessionStartCount) * 100).toFixed(1)
        : "0.0";

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" dir="rtl">
            <Card
                label="סה״כ כניסות (Sessions)"
                value={kpis.sessionStartCount}
                icon={<Users className="w-5 h-5 text-blue-600" />}
                subText={`ב-${kpis.rangeDays} הימים האחרונים`}
                accentClass="bg-blue-500"
                containerClass="bg-blue-50 border-blue-100"
            />
            <Card
                label="לוחות זמנים (Schedules)"
                value={kpis.scheduleGeneratedCount}
                icon={<FileText className="w-5 h-5 text-emerald-600" />}
                subText={`${conversionRate}% יחס המרה`}
                accentClass="bg-emerald-500"
                containerClass="bg-emerald-50 border-emerald-100"
            />
            <Card
                label="כלל האירועים (Events)"
                value={kpis.totalEvents}
                icon={<Activity className="w-5 h-5 text-indigo-600" />}
                subText="נפח פעילות כללי"
                accentClass="bg-indigo-500"
                containerClass="bg-indigo-50 border-indigo-100"
            />
        </div>
    );
}

interface CardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    subText: string;
    accentClass: string;
    containerClass: string;
}

function Card({ label, value, icon, subText, accentClass, containerClass }: CardProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-md transition-shadow">
            {/* Left Accent Bar */}
            <div className={`absolute top-0 left-0 w-1 h-full ${accentClass}`}></div>

            <div className="flex justify-between items-start">
                <div>
                    <p className="text-slate-500 text-xs font-medium tracking-wider mb-1">
                        {label}
                    </p>
                    <h3 className="text-3xl font-bold text-slate-900">{value.toLocaleString()}</h3>
                </div>
                <div className={`p-2 rounded-lg ${containerClass}`}>
                    {icon}
                </div>
            </div>

            <div className="mt-2">
                <span className="text-xs text-slate-400 font-medium">{subText}</span>
            </div>
        </div>
    );
}
