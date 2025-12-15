"use client";

import React, { useState, useEffect } from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    BarChart, Bar, ComposedChart, Area
} from 'recharts';
import { Loader2, Filter, Download, AlertCircle } from "lucide-react";
import type { DashboardMetrics } from "@/types/analytics";

export default function AdminDashboard() {
    const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters State
    const [dateRange, setDateRange] = useState("30d"); // 30d, 90d, 1y
    const [clinic, setClinic] = useState("all");
    const [protocol, setProtocol] = useState("all");

    // Derived Date Range
    const getDates = () => {
        const end = new Date();
        const start = new Date();
        if (dateRange === "30d") start.setDate(end.getDate() - 30);
        if (dateRange === "90d") start.setDate(end.getDate() - 90);
        if (dateRange === "1y") start.setDate(end.getDate() - 365);
        return { start, end };
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const { start, end } = getDates();
            const query = new URLSearchParams({
                startDate: start.toISOString(),
                endDate: end.toISOString()
            });
            if (clinic !== "all") query.append("clinic", clinic);
            if (protocol !== "all") query.append("protocol", protocol);

            const res = await fetch(`/api/analytics/dashboard?${query.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch data");
            const data = await res.json();
            setMetrics(data);
        } catch (e) {
            console.error(e);
            setError("Could not load analytics data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dateRange, clinic, protocol]);

    if (loading && !metrics) {
        return (
            <div className="flex bg-slate-50 min-h-screen items-center justify-center text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex bg-slate-50 min-h-screen items-center justify-center p-4">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 max-w-md w-full text-center space-y-4">
                    <div className="bg-red-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto text-red-500">
                        <AlertCircle className="h-6 w-6" />
                    </div>
                    <h2 className="text-lg font-bold text-slate-800">Error Loading Dashboard</h2>
                    <p className="text-sm text-slate-600">{error}</p>
                    <button
                        onClick={fetchData}
                        className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!metrics) return null;

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 sm:p-8 space-y-8 font-sans">
            {/* Header & Filters */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Analytics Dashboard</h1>
                    <p className="text-sm text-slate-500">Decision support for ShaatHaTipa</p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Date Range */}
                    <select
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="30d">Last 30 Days</option>
                        <option value="90d">Last 90 Days</option>
                        <option value="1y">Last Year</option>
                    </select>

                    {/* Clinic Filter */}
                    <select
                        value={clinic}
                        onChange={(e) => setClinic(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg px-3 py-2 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none max-w-[150px]"
                    >
                        <option value="all">All Clinics</option>
                        {metrics.filters.clinics.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>

                    <button
                        onClick={fetchData}
                        className="p-2 bg-white border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 shadow-sm"
                        title="Refresh"
                    >
                        <Filter className="h-4 w-4" />
                    </button>
                </div>
            </header>

            {/* KPIs Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <KPICard title="Total Visits" value={metrics.kpis.totalVisits.toLocaleString()} subtext="Sessions started" />
                <KPICard title="Avg Daily Visits" value={metrics.kpis.avgDailyVisits} subtext="Unique sessions/day" />
                <KPICard title="Time Mod. Rate" value={metrics.kpis.timeModificationRate} subtext="Vs Clinic Default" highlight />
                <KPICard title="Schedule Rate" value={metrics.kpis.scheduleCreationRate} subtext="Funnel Conversion" highlight />
                <KPICard title="Calendar Add" value={metrics.kpis.calendarAddRate} subtext="Of Generated" />
                <KPICard title="PDF Export" value={metrics.kpis.pdfExportRate} subtext="Of Generated" />
            </div>

            {/* Protocol Review & Funnel Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Protocol Review Time */}
                <div className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center justify-between">
                        <span>Avg Time on Protocol Review</span>
                        <span className="text-xs font-normal text-slate-400">Step 2 Engagement</span>
                    </h3>
                    <div className="flex items-end gap-2 mb-6">
                        <span className="text-4xl font-bold text-slate-900">{metrics.kpis.avgProtocolReviewTime.avg}</span>
                        <span className="text-sm text-slate-500 mb-1">avg</span>
                        <span className="text-sm text-slate-300 mb-1 mx-1">|</span>
                        <span className="text-xl font-semibold text-slate-700">{metrics.kpis.avgProtocolReviewTime.median}</span>
                        <span className="text-sm text-slate-500 mb-1">median</span>
                    </div>
                    {/* Simple Bar for buckets */}
                    <div className="space-y-3">
                        {Object.entries(metrics.kpis.avgProtocolReviewTime.buckets).map(([label, count]) => {
                            const total = Object.values(metrics.kpis.avgProtocolReviewTime.buckets).reduce((a, b) => a + b, 0);
                            const percent = total > 0 ? (count / total) * 100 : 0;
                            return (
                                <div key={label} className="flex items-center text-xs gap-3">
                                    <span className="w-12 text-slate-500 text-right">{label}</span>
                                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${percent}%` }}
                                        />
                                    </div>
                                    <span className="w-8 text-slate-600">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Funnel */}
                <div className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100 lg:col-span-2">
                    <h3 className="font-semibold text-slate-800 mb-6">Values Funnel</h3>
                    <div className="flex flex-col sm:flex-row items-center justify-around gap-8 sm:gap-4 relative">
                        {/* Connector Line (Desktop) */}
                        <div className="hidden sm:block absolute top-[2.25rem] left-10 right-10 h-0.5 bg-slate-100 -z-0" />

                        <FunnelStep label="Wizard Started" count={metrics.funnel.started} sub="Step 1" total={metrics.funnel.started} />
                        <FunnelStep label="Protocol Review" count={metrics.funnel.step2} sub="Step 2" total={metrics.funnel.started} />
                        <FunnelStep label="Schedule Generated" count={metrics.funnel.generated} sub="Step 3" total={metrics.funnel.started} isLast />
                    </div>
                </div>
            </div>

            {/* Graphs */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                    <h3 className="font-semibold text-slate-800 mb-6">Traffic Analysis (Monthly)</h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={metrics.graphs.monthly}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="date"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                    minTickGap={30}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                />
                                <Bar dataKey="visits" fill="#e2e8f0" barSize={20} radius={[4, 4, 0, 0]} name="Sessions" />
                                <Line type="monotone" dataKey="movingAvg" stroke="#0ea5e9" strokeWidth={3} dot={false} name="7-Day Avg" />
                            </ComposedChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
                    <h3 className="font-semibold text-slate-800 mb-6">Yearly Overview (Avg Daily Visits/Month)</h3>
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={metrics.graphs.yearly}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 12, fill: '#64748b' }}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                                />
                                <Bar dataKey="avgDaily" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Avg Daily Visits" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}

function KPICard({ title, value, subtext, highlight }: { title: string, value: string | number, subtext: string, highlight?: boolean }) {
    return (
        <div className={`
            p-5 rounded-xl border flex flex-col justify-between h-32
            ${highlight
                ? "bg-white border-blue-100 shadow-[0_4px_12px_-2px_rgba(59,130,246,0.08)]"
                : "bg-white border-slate-100 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)] text-slate-600"
            }
        `}>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{title}</p>
            <div>
                <span className={`text-2xl font-bold tracking-tight ${highlight ? "text-blue-600" : "text-slate-900"}`}>
                    {value}
                </span>
            </div>
            <p className="text-xs text-slate-400 mt-2">{subtext}</p>
        </div>
    );
}

function FunnelStep({ label, count, sub, total, isLast }: { label: string, count: number, sub: string, total: number, isLast?: boolean }) {
    const conversion = total > 0 ? ((count / total) * 100).toFixed(1) : "0.0";

    return (
        <div className="flex flex-col items-center bg-white z-10 w-full sm:w-auto">
            <div className={`
                flex items-center justify-center w-16 h-16 rounded-full border-4 mb-3 shadow-sm bg-white
                ${isLast ? "border-emerald-100 text-emerald-600" : "border-blue-50 text-blue-600"}
            `}>
                <span className="font-bold text-lg">{conversion}%</span>
            </div>
            <h4 className="font-bold text-slate-900 text-sm">{label}</h4>
            <div className="text-xs text-slate-500 mt-0.5">{sub}</div>
            <div className="mt-2 text-xs font-medium px-2 py-0.5 bg-slate-50 text-slate-600 rounded-full border border-slate-100">
                {count.toLocaleString()} sessions
            </div>
        </div>
    );
}
