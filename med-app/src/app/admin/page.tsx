
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/session";
import { getKpis, getLatestEvents } from "@/server/admin/queries";
import { logout } from "./actions";
import KpiCards from "@/components/admin/KpiCards";
import EventsTable from "@/components/admin/EventsTable";
import { AlertCircle } from "lucide-react";

// Ensure dynamic rendering for real-time dashboard data
export const dynamic = "force-dynamic";

export default async function AdminPage({
    searchParams
}: {
    searchParams?: { range?: string | string[] }
}) {
    // 1. Auth Guard (Session)
    const session = await getSession();
    if (!session.isLoggedIn) {
        redirect("/admin/login");
    }

    // 2. Parse Params Safely (Synchronous Access)
    let rangeDays = 30;
    try {
        const rawRange = Array.isArray(searchParams?.range) ? searchParams.range[0] : searchParams?.range;
        const parsed = Number(rawRange || "30");
        if ([7, 30, 90].includes(parsed)) {
            rangeDays = parsed;
        }
    } catch {
        // Fallback already set to 30
    }

    // 3. Data Fetching (Parallel & Resilient)
    let kpiResult, eventsResult;
    try {
        [kpiResult, eventsResult] = await Promise.all([
            getKpis(rangeDays),
            getLatestEvents(20)
        ]);
    } catch (e) {
        console.error("[AdminPage] Critical Fetch Error:", e);
        // Explicitly match the QueryResult failure shape
        kpiResult = { success: false, error: "Critical fetch error" } as const;
        eventsResult = { success: false, error: "Critical fetch error" } as const;
    }

    // 4. Safe Date Rendering
    const sessionStartTime = session.loggedInAt
        ? new Date(session.loggedInAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })
        : "--:--";

    // 5. Error State Calculation
    const hasError = !kpiResult.success || !eventsResult.success;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            SH
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">ממשק ניהול</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${hasError ? 'bg-amber-500' : 'bg-green-500'} animate-pulse`}></span>
                                <span className="text-xs font-medium text-slate-700">
                                    {hasError ? 'System Issues' : 'Online'}
                                </span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-mono">
                                Login: {sessionStartTime}
                            </span>
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
                    <h2 className="text-xl font-bold text-slate-800">סקירה כללית</h2>

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
                {hasError ? (
                    <div className="bg-white border border-slate-200 rounded-xl p-12 flex flex-col items-center text-center shadow-sm">
                        <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">המערכת זמנית לא זמינה</h3>
                        <p className="text-slate-500 mt-2 max-w-sm">
                            אירעה שגיאה בקריאת הנתונים מהשרת. ייתכן שיש בעיית תקשורת עם בסיס הנתונים.
                        </p>
                        <a href="/admin" className="mt-6 px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-colors">
                            רענן עמוד
                        </a>
                    </div>
                ) : (
                    <>
                        {/* KPIs */}
                        {kpiResult.success && (
                            <KpiCards kpis={kpiResult.data} />
                        )}

                        {/* Recent Events Table */}
                        {eventsResult.success && (
                            <EventsTable events={eventsResult.data} />
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
