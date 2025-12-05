"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export default class GlobalErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo);
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[400px] w-full flex-col items-center justify-center rounded-3xl border border-red-100 bg-red-50 p-8 text-center">
                    <h2 className="text-2xl font-bold text-red-900">Something went wrong</h2>
                    <p className="mt-2 text-red-700">
                        We encountered an unexpected error. Please try refreshing the page.
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 rounded-lg bg-red-600 px-6 py-3 font-bold text-white hover:bg-red-700"
                    >
                        Refresh Page
                    </button>
                    {process.env.NODE_ENV === "development" && this.state.error && (
                        <pre className="mt-8 max-w-full overflow-auto rounded bg-red-100 p-4 text-start text-xs text-red-900">
                            {this.state.error.toString()}
                        </pre>
                    )}
                </div>
            );
        }

        return this.props.children;
    }
}
