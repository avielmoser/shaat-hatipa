
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { logout } from "./actions";

export default async function AdminPage() {
    // STRICT Route-Level Security Guard
    const session = await getSession();
    if (!session.isLoggedIn) {
        redirect("/admin/login");
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900" dir="rtl">
            <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm">
                            SH
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-slate-900">ממשק ניהול</h1>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex flex-col items-end">
                            <span className="text-xs font-medium text-slate-700">Admin Session</span>
                            <span className="text-[10px] text-slate-400 font-mono">
                                Since: {new Date(session.loggedInAt || "").toLocaleTimeString('he-IL')}
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

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">ברוך הבא, אדמין</h2>
                    <p className="text-slate-500 mb-8 max-w-lg mx-auto leading-relaxed">
                        החיבור למערכת בוצע בהצלחה. סשן מאובטח פעיל.
                        <br />
                        דאשבורד מלא יוצג בשלב הבא (Unit 2).
                    </p>
                </div>
            </main>
        </div>
    );
}
