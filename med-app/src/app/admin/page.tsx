
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getAdminKpis, getAdminFunnel, getAdminBreakdown, getLatestEvents, getDebugStats } from "@/server/admin/queries";
import { logout } from "./actions";
import KpiCards from "@/components/admin/KpiCards";
import FunnelWidget from "@/components/admin/FunnelWidget";
import BreakdownTable from "@/components/admin/BreakdownTable";
import EventsTable from "@/components/admin/EventsTable";
import { AlertCircle, Clock, Bug } from "lucide-react";

// Ensure dynamic rendering for real-time dashboard data
export const dynamic = "force-dynamic";

export default async function AdminPage(props: {
    searchParams: Promise<{ range?: string | string[] }>
}) {
    // 1. Auth Guard (Session)
    const session = await getSession();
    if (!session.isLoggedIn) {
        redirect("/admin/login");
    }

    // 2. Parse Params Safely (Synchronous Access)
    let rangeDays = 30;
    try {
        // Next.js 15: searchParams is a promise
        const params = await props.searchParams;
        const rawRange = Array.isArray(params?.range) ? params.range[0] : params?.range;
        const parsed = Number(rawRange || "30");
        if ([7, 30, 90].includes(parsed)) {
            rangeDays = parsed;
        }
    } catch {
        // Fallback already set to 30
    }

    // 3. Data Fetching (Parallel & Resilient)
    let kpiResult, funnelResult, breakdownResult, eventsResult, debugStats;
    try {
        [kpiResult, funnelResult, breakdownResult, eventsResult, debugStats] = await Promise.all([
            getAdminKpis(rangeDays),
            getAdminFunnel(rangeDays),
            getAdminBreakdown(rangeDays),
            getLatestEvents(20),
            getDebugStats(rangeDays)
        ]);
    } catch (e) {
        console.error("[AdminPage] Critical Fetch Error:", e);
        // Explicitly fallback
        kpiResult = { success: false, error: "Critical fetch error" } as const;
        funnelResult = { success: false, error: "Critical fetch error" } as const;
        breakdownResult = { success: false, error: "Critical fetch error" } as const;
        eventsResult = { success: false, error: "Critical fetch error" } as const;
        debugStats = null;
    }

    // 4. Safe Date Rendering
    const sessionStartTime = session.loggedInAt
        ? new Date(session.loggedInAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        : "--:--";

    // 5. Error State Calculation
    const hasError = !kpiResult.success || !eventsResult.success || !funnelResult.success || !breakdownResult.success;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            SH
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">ממשק ניהול (Admin)</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${hasError ? 'bg-amber-500' : 'bg-green-500'} animate-pulse`}></span>
                                <span className="text-xs font-medium text-slate-700">
                                    {hasError ? 'Partial Data' : 'Production DB'}
                                </span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
                                <Clock size={10} />
                                <span>Last Event: Now</span>
                            </div>
                        </div>

                        <form action={logout}>
                            <button
                                type="submit"
                                className="text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-100"
                            >
                                התנתק
                            </button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Filters */}
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800">דשבורד אנליטיקס (Analytics)</h2>

                    <div className="bg-white rounded-lg border border-slate-200 p-1 flex items-center gap-1 shadow-sm">
                        {[7, 30, 90].map((d) => (
                            <Link
                                key={d}
                                href={`/admin?range=${d}`}
                                scroll={false}
                                className={`
                                    px-3 py-1.5 text-xs font-medium rounded-md transition-all
                                    ${rangeDays === d
                                        ? "bg-slate-900 text-white shadow-sm"
                                        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}
                                `}
                            >
                                {d} ימים
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Content or Error Fallback */}
                {hasError && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center gap-3 text-amber-800">
                        <AlertCircle className="w-5 h-5" />
                        <span className="text-sm font-medium">חלק מהנתונים לא נטענו. בדוק את חיבור המסד.</span>
                    </div>
                )}

                {/* DEBUG PANEL */}
                {debugStats && (
                    <details className="bg-white border border-slate-300 rounded-lg p-4 mb-4 text-xs font-mono text-left" dir="ltr">
                        <summary className="cursor-pointer font-bold flex items-center gap-2 text-slate-700">
                            <Bug size={14} /> Debug Analytics (Hidden in Prod)
                        </summary>
                        <pre className="mt-2 bg-slate-50 p-2 rounded overflow-auto max-h-64">
                            {JSON.stringify(debugStats, null, 2)}
                        </pre>
                    </details>
                )}

                <div className="space-y-8">
                    {/* KPIs */}
                    {kpiResult.success && (
                        <KpiCards kpis={kpiResult.data} />
                    )}

                    {/* Funnel & Breakdown Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {funnelResult.success && (
                            <FunnelWidget steps={funnelResult.data} />
                        )}

                        {breakdownResult.success && (
                            <BreakdownTable data={breakdownResult.data} />
                        )}
                    </div>

                    {/* Recent Events Table */}
                    {eventsResult.success && (
                        <div className="pt-8 border-t border-slate-200">
                            <h3 className="text-lg font-bold text-slate-800 mb-4">אירועים אחרונים (Raw Hits)</h3>
                            <EventsTable events={eventsResult.data} />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
