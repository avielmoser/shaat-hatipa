
"use client";

import React, { useState } from 'react';
import { BreakdownItem, BreakdownResult } from '@/server/admin/queries';

interface BreakdownTableProps {
    data: BreakdownResult;
}

type SortKey = 'schedulesGenerated' | 'activationRate' | 'exportRate';

export default function BreakdownTable({ data }: BreakdownTableProps) {
    const [activeTab, setActiveTab] = useState<'clinics' | 'protocols'>('clinics');
    const [sortKey, setSortKey] = useState<SortKey>('schedulesGenerated');

    const items = activeTab === 'clinics' ? data.byClinic : data.byProtocol;

    // Client-side sorting
    const sortedItems = [...items].sort((a, b) => b[sortKey] - a[sortKey]);

    const TH = ({ label, k }: { label: string, k: SortKey }) => (
        <th
            className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider cursor-pointer hover:bg-slate-50"
            onClick={() => setSortKey(k)}
        >
            <div className="flex items-center gap-1">
                {label}
                {sortKey === k && <span className="text-blue-500">↓</span>}
            </div>
        </th>
    );

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Tabs / Header */}
            <div className="border-b border-slate-200 flex items-center justify-between p-4">
                <h3 className="text-lg font-bold text-slate-800">פירוט (Breakdown)</h3>

                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('clinics')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'clinics' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        מרפאות (Clinics)
                    </button>
                    <button
                        onClick={() => setActiveTab('protocols')}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'protocols' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        פרוטוקולים (Protocols)
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto" dir="ltr"> {/* Force LTR for table numbers to align naturally? Or keep RTL? */}
                {/* Keeping RTL context but table often cleaner LTR for English keys. Let's respect user context (RTL). */}
                {/* Actually, user specified "Maintain RTL alignment". I should keep RTL. 
                    Structure: [Name] [Schedules] [Activation] [Export]
                */}
                <table className="min-w-full divide-y divide-slate-200" dir="rtl">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                                {activeTab === 'clinics' ? 'שם המרפאה' : 'שם הפרוטוקול'}
                            </th>
                            <TH label="נוצרו (Schedules)" k="schedulesGenerated" />
                            <TH label="המרה (Activation)" k="activationRate" />
                            <TH label="ייצוא (Export)" k="exportRate" />
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-200">
                        {sortedItems.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500 text-sm">
                                    אין נתונים להציג
                                </td>
                            </tr>
                        ) : (
                            sortedItems.map((item) => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">
                                        {item.label}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        {item.schedulesGenerated}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        {item.activationRate.toFixed(1)}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                        {item.exportRate.toFixed(1)}%
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
