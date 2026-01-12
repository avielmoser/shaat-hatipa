"use client";

import { useActionState } from "react";
import { authenticate } from "../actions";
import { Loader2, Lock, ShieldCheck } from "lucide-react";

export default function LoginForm() {
    // initialState is empty object
    const [state, action, isPending] = useActionState(authenticate, {});

    return (
        <div className="w-full max-w-sm" dir="rtl">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 ring-1 ring-slate-900/5">
                {/* Header */}
                <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
                    <div className="mx-auto bg-slate-800/80 backdrop-blur-sm w-12 h-12 rounded-xl flex items-center justify-center mb-4 border border-slate-700 shadow-inner">
                        <Lock className="h-6 w-6 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white tracking-tight">כניסה למערכת ניהול</h2>
                    <p className="text-slate-400 text-sm mt-1 font-medium">ShaatHaTipa Admin</p>
                </div>

                {/* Form */}
                <div className="p-8">
                    <form action={action} className="space-y-5">
                        <div className="space-y-2">
                            <label htmlFor="key" className="block text-sm font-semibold text-slate-700">
                                מפתח גישה
                            </label>
                            <input
                                id="key"
                                name="key"
                                type="password"
                                required
                                disabled={isPending}
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed text-left ltr font-mono text-sm shadow-sm"
                                placeholder="sk-admin-..."
                            />
                        </div>

                        {/* Error Message */}
                        {state.error && (
                            <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
                                <span className="flex-shrink-0 w-1 h-4 bg-red-400 rounded-full"></span>
                                <span>{state.error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isPending}
                            className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg hover:bg-slate-800 active:bg-slate-950 transition-all shadow-lg shadow-slate-900/10 flex items-center justify-center gap-2 disabled:opacity-70 disabled:shadow-none disabled:transform-none"
                        >
                            {isPending ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin text-indigo-300" />
                                    <span>מאמת נתונים...</span>
                                </>
                            ) : (
                                <>
                                    <span>התחברות</span>
                                    <ShieldCheck className="h-4 w-4 text-indigo-300" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="bg-slate-50/80 p-4 text-center border-t border-slate-100 backdrop-blur-sm">
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold">
                        Secure Environment
                    </p>
                </div>
            </div>
        </div>
    );
}
