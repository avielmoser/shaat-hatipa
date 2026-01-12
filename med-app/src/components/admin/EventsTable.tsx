
import { AdminEvent } from "@/server/admin/queries";

export default function EventsTable({ events }: { events: AdminEvent[] }) {
    if (events.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200 border-dashed">
                <p className="text-slate-500">אין נתונים להצגה בטווח שנבחר.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" dir="rtl">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                <h3 className="font-bold text-slate-800">אירועים אחרונים (Live Feed)</h3>
                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">Coming from DB</span>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-right">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 w-48">שם אירוע</th>
                            <th className="px-6 py-3 w-40">זמן</th>
                            <th className="px-6 py-3">Meta Data (JSON)</th>
                            <th className="px-6 py-3 w-32 text-left">ID</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {events.map((event) => (
                            <tr key={event.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-3 font-medium text-slate-900">
                                    {event.eventName}
                                </td>
                                <td className="px-6 py-3 text-slate-500 dir-ltr text-right">
                                    {new Date(event.createdAt).toLocaleString('he-IL', {
                                        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                    })}
                                </td>
                                <td className="px-6 py-3 text-slate-600 font-mono text-xs overflow-hidden max-w-xs truncate" dir="ltr">
                                    {event.meta ? JSON.stringify(event.meta) : "-"}
                                </td>
                                <td className="px-6 py-3 text-slate-400 font-mono text-xs text-left" dir="ltr">
                                    {event.id.slice(0, 8)}...
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
