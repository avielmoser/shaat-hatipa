import { prisma } from "@/lib/server/db";
import { notFound } from "next/navigation";
import Link from "next/link";

// Force dynamic rendering so we always get fresh data
export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: { [key: string]: string | string[] | undefined };
}

/**
 * ADMIN DASHBOARD
 * Protected by strict environment variable check.
 */
export default async function AdminDashboard({ searchParams }: PageProps) {
    // 1. Admin Protection
    const secretKey = process.env.ADMIN_DASHBOARD_KEY;

    // Support both 'key' and 'ADMIN_DASHBOARD_KEY'
    const params = await Promise.resolve(searchParams);
    const rawKey = params.key ?? params.ADMIN_DASHBOARD_KEY;

    // Normalize user key
    const userKey = Array.isArray(rawKey) ? rawKey[0] : (rawKey ?? "");
    const paramExists = !!userKey;

    //Safe Server-Side Logging for Production Diagnostics
    // We do NOT log the actual keys, only their existence/match status.
    console.log(`[AdminDashboard] Auth Check | Env Key Set: ${!!secretKey} | User Key Provided: ${paramExists}`);

    if (!secretKey) {
        console.error("[AdminDashboard] CRITICAL: ADMIN_DASHBOARD_KEY is not set in environment.");
        notFound();
    }

    if (userKey !== secretKey) {
        console.warn("[AdminDashboard] Unauthorized access attempt. Key verification failed.");
        notFound();
    }

    // 2. Fetch Data
    // Environment Detection
    const isLocal = process.env.NODE_ENV === "development";
    const isProduction = process.env.VERCEL_ENV === "production"; // Vercel sets this automatically

    // View Mode Logic
    const viewMode = (Array.isArray(params.view) ? params.view[0] : params.view) || "meaningful"; // default to meaningful
    const showAll = viewMode === "all";

    // Prisma Where Clause for Filtering
    const whereCondition: any = {};
    if (!showAll) {
        // "Meaningful" = page_view OR conversion
        // Note: This relies on 'eventType' being stored in 'meta'.
        // Old events without this meta field will be excluded, effectively resetting stats to "clean" data.
        whereCondition.OR = [
            { meta: { path: ["eventType"], equals: "page_view" } },
            { meta: { path: ["eventType"], equals: "conversion" } },
        ];
    }

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    let totalEvents: number = 0;
    let eventsByName: any[] = [];
    let eventsByStep: any[] = [];
    let last50Events: any[] = [];
    let fetchError: any = null;

    try {
        [totalEvents, eventsByName, eventsByStep, last50Events] = await Promise.all([
            prisma.analyticsEvent.count({
                where: whereCondition,
            }),
            prisma.analyticsEvent.groupBy({
                by: ["eventName"],
                where: {
                    ...whereCondition,
                    createdAt: { gte: sevenDaysAgo }
                },
                _count: { eventName: true },
                orderBy: { _count: { eventName: "desc" } },
            }),
            prisma.analyticsEvent.groupBy({
                by: ["step"],
                where: {
                    ...whereCondition,
                    createdAt: { gte: sevenDaysAgo },
                    step: { not: null }
                },
                _count: { step: true },
                orderBy: { _count: { step: "desc" } },
            }),
            prisma.analyticsEvent.findMany({
                where: whereCondition,
                take: 50,
                orderBy: { createdAt: "desc" },
            }),
        ]);
    } catch (error) {
        console.error("[AdminDashboard] Database Fetch Error:", error);
        fetchError = error;
    }

    // Build URL for toggle
    const toggleUrl = showAll
        ? `?key=${userKey}&view=meaningful`
        : `?key=${userKey}&view=all`;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-50 p-6 md:p-12 font-sans selection:bg-indigo-500/30">
            <div className="max-w-7xl mx-auto space-y-12">
                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">
                            Analytics Dashboard
                        </h1>
                        <p className="text-slate-400">
                            Usage insights for the last 7 days • Live Data
                        </p>
                    </div>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                        <Link
                            href={toggleUrl}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${showAll
                                ? "bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30"
                                : "bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700"
                                }`}
                        >
                            {showAll ? "Viewing: ALL Events" : "Viewing: Meaningful Only"}
                        </Link>
                        <div className="bg-slate-900 border border-slate-800 rounded-full px-4 py-1.5 text-xs font-mono text-emerald-500 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            SECURE_MODE_ACTIVE
                        </div>
                    </div>
                </header>

                {/* Environment Banners */}
                {isProduction ? (
                    <div className="bg-emerald-900/30 border border-emerald-500/30 text-emerald-400 py-3 px-4 rounded-lg text-center font-bold tracking-widest shadow-[0_0_15px_rgba(16,185,129,0.1)] mb-6">
                        PRODUCTION DATA
                    </div>
                ) : isLocal ? (
                    <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 py-3 px-4 rounded-lg text-center font-bold tracking-widest mb-6">
                        LOCAL DEV DATA
                    </div>
                ) : (
                    <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 py-3 px-4 rounded-lg text-center font-bold tracking-widest mb-6">
                        PREVIEW DATA
                    </div>
                )}

                {/* Error Banner */}
                {fetchError && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm font-mono">
                        Error fetching analytics data. Check server logs for details.
                    </div>
                )}

                {/* Top Metric Cards */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <MetricCard
                        title={showAll ? "Total Events (All Time)" : "Meaningful Events (All Time)"}
                        value={totalEvents.toLocaleString()}
                        icon={<IconTotal />}
                    />
                    <MetricCard
                        title="Unique Event Types (7d)"
                        value={eventsByName.length.toString()}
                        icon={<IconTypes />}
                    />
                    <MetricCard
                        title="Active Steps Tracked (7d)"
                        value={eventsByStep.length.toString()}
                        icon={<IconSteps />}
                    />
                </section>

                {/* Data Tables Grid */}
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Recent 7d Events Breakdown */}
                    <CardContainer title="Top Events (Last 7 Days)">
                        <Table
                            headers={["Event Name", "Count"]}
                            rows={eventsByName.map((idx) => [
                                <span key="name" className="font-medium text-slate-200">{idx.eventName}</span>,
                                idx._count.eventName.toLocaleString()
                            ])}
                        />
                    </CardContainer>

                    {/* Steps Breakdown */}
                    <CardContainer title="Step Interactions (Last 7 Days)">
                        <Table
                            headers={["Step Name", "Count"]}
                            rows={eventsByStep.map((idx) => [
                                <span key="step" className="font-mono text-sm text-indigo-300">{idx.step || "-"}</span>,
                                idx._count.step.toLocaleString()
                            ])}
                        />
                    </CardContainer>
                </section>

                {/* Recent Events Log (Full Width) */}
                <section>
                    <CardContainer title="Recent Activity Log (Last 50)">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-400">
                                <thead className="text-xs uppercase bg-slate-900 text-slate-500 font-semibold tracking-wider border-b border-slate-800">
                                    <tr>
                                        <th className="px-6 py-4">Time</th>
                                        <th className="px-6 py-4">Event</th>
                                        <th className="px-6 py-4">Step / Button</th>
                                        <th className="px-6 py-4">Session ID</th>
                                        <th className="px-6 py-4">Meta</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {last50Events.map((evt) => (
                                        <tr key={evt.id} className="hover:bg-slate-900/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-slate-500 font-mono text-xs">
                                                {new Date(evt.createdAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-slate-200">
                                                {evt.eventName}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    {evt.step && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 w-fit">
                                                            {evt.step}
                                                        </span>
                                                    )}
                                                    {evt.buttonId && (
                                                        <span className="text-xs text-slate-500 font-mono">
                                                            #{evt.buttonId}
                                                        </span>
                                                    )}
                                                    {!evt.step && !evt.buttonId && (
                                                        <span className="text-slate-600">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono text-xs text-slate-500">
                                                {evt.sessionId ? evt.sessionId.slice(0, 8) + "..." : "-"}
                                            </td>
                                            <td className="px-6 py-4 max-w-xs truncate font-mono text-xs text-slate-600 relative group cursor-help">
                                                {evt.meta ? JSON.stringify(evt.meta) : "-"}
                                                {/* Tooltip for full JSON */}
                                                {evt.meta && (
                                                    <div className="absolute hidden group-hover:block bottom-full right-0 mb-2 p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 w-64 md:w-80 whitespace-pre-wrap break-words text-slate-300">
                                                        {JSON.stringify(evt.meta, null, 2)}
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {last50Events.length === 0 && (
                            <div className="text-center py-12 text-slate-500">
                                No events found in the last 50 records.
                            </div>
                        )}
                    </CardContainer>
                </section>
            </div>
        </div>
    );
}

// --- UI Components ---
// Icons
const IconTotal = () => (
    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
);
const IconTypes = () => (
    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
);
const IconSteps = () => (
    <svg className="w-5 h-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);

function MetricCard({ title, value, icon }: { title: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-slate-400 uppercase tracking-wider">{title}</h3>
                <div className="p-2 bg-slate-800 rounded-lg">{icon}</div>
            </div>
            <div className="text-4xl font-bold text-white tracking-tight">{value}</div>
        </div>
    );
}

function CardContainer({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/60">
                <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
            </div>
            <div>{children}</div>
        </div>
    );
}

function Table({ headers, rows }: { headers: string[]; rows: React.ReactNode[][] }) {
    if (rows.length === 0) {
        return <div className="p-8 text-center text-slate-500">No data available yet.</div>;
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-slate-500 text-xs uppercase font-semibold border-b border-slate-800">
                    <tr>
                        {headers.map((h, i) => (
                            <th key={i} className="px-6 py-4 first:rounded-tl-lg last:rounded-tr-lg">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                    {rows.map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                            {row.map((cell, j) => (
                                <td key={j} className="px-6 py-3.5 text-slate-300">
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
