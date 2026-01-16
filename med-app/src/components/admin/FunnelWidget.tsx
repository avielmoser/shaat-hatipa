
import React from 'react';
import { FunnelStep } from '@/server/admin/queries';

interface FunnelWidgetProps {
    steps: FunnelStep[];
}

export default function FunnelWidget({ steps }: FunnelWidgetProps) {
    if (!steps || steps.length === 0) {
        return (
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-center text-slate-500">
                No funnel data available
            </div>
        );
    }

    // Determine max count for scaling bar widths
    const maxCount = Math.max(...steps.map(s => s.count)) || 1;

    return (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-6">משפך המרה (Conversion Funnel)</h3>

            <div className="space-y-6">
                {steps.map((step, index) => {
                    const isFirst = index === 0;
                    const prevStep = isFirst ? null : steps[index - 1];
                    const widthPercent = (step.count / maxCount) * 100;

                    return (
                        <div key={step.stepName} className="relative">
                            {/* Connector Line */}
                            {!isFirst && (
                                <div className="absolute top-[-24px] right-8 w-0.5 h-6 bg-slate-200" />
                            )}

                            <div className="flex items-center gap-4">
                                {/* Step Metric Circle/Indicator */}
                                <div className={`
                                    w-16 h-16 rounded-full flex flex-col items-center justify-center border-4 shrink-0 z-10 bg-white
                                    ${step.count > 0 ? 'border-blue-100 text-blue-600' : 'border-slate-100 text-slate-400'}
                                `}>
                                    <span className="text-lg font-bold">{step.count}</span>
                                </div>

                                {/* Bar & Labels */}
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium text-slate-900">{step.label}</span>
                                        {!isFirst && (
                                            <span className="text-xs font-medium text-slate-500">
                                                {step.conversionRate.toFixed(1)}% conversion
                                            </span>
                                        )}
                                    </div>

                                    <div className="h-3 bg-slate-50 rounded-full overflow-hidden w-full max-w-md">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                            style={{ width: `${Math.max(widthPercent, 2)}%` }}
                                        />
                                    </div>

                                    {!isFirst && prevStep && (
                                        <div className="text-[10px] text-red-400 mt-1">
                                            {step.dropOffRate.toFixed(1)}% drop-off
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
