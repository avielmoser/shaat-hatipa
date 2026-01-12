"use client";

import { useEffect } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";

export default function ErrorBoundary({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log to console for dev debugging, but don't expose details in UI
        console.error("[Admin Error Boundary]", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center max-w-sm w-full">
                <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-6 h-6" />
                </div>

                <h2 className="text-lg font-bold text-slate-900 mb-2">
                    שגיאת מערכת
                </h2>

                <p className="text-sm text-slate-500 mb-6">
                    אירעה שגיאה בטעינת ממשק הניהול.
                </p>

                <button
                    onClick={() => reset()}
                    className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <RefreshCw className="w-4 h-4" />
                    <span>נסה שוב</span>
                </button>

                {process.env.NODE_ENV === "development" && (
                    <div className="mt-8 text-left bg-slate-100 p-2 rounded text-xs font-mono text-red-700 overflow-auto max-h-32 border border-slate-200" dir="ltr">
                        {error.message}
                    </div>
                )}
            </div>
        </div>
    );
}
