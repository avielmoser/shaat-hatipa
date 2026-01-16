
import React from 'react';
import { BusinessKpis } from '@/server/admin/queries';
import { Target, Users, Zap, Share2, ArrowDownRight, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardsProps {
    kpis: BusinessKpis;
}

export default function KpiCards({ kpis }: KpiCardsProps) {
    const { schedulesGenerated, activationRate, exportRate, returningUsers, biggestDropoffStep, deltas } = kpis;

    const cards = [
        {
            label: "Schedules Generated (North Star)",
            value: schedulesGenerated.toLocaleString(),
            icon: Target,
            color: "blue",
            delta: deltas?.schedulesGenerated,
            suffix: ""
        },
        {
            label: "Activation Rate",
            value: activationRate.toFixed(1) + "%",
            icon: Zap,
            color: "emerald",
            delta: deltas?.activationRate,
            suffix: " conversion"
        },
        {
            label: "Export Rate",
            value: exportRate.toFixed(1) + "%",
            icon: Share2,
            color: "purple",
            delta: deltas?.exportRate,
            suffix: " of generated"
        },
        {
            label: "Returning Users",
            value: returningUsers.toLocaleString(),
            icon: Users,
            color: "amber",
            delta: deltas?.returningUsers,
            suffix: " total"
        },
        {
            label: "Biggest Drop-off",
            value: biggestDropoffStep,
            icon: ArrowDownRight,
            color: "rose",
            delta: null, // No delta for text
            suffix: ""
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {cards.map((card, idx) => {
                const DeltaIcon = card.delta && card.delta > 0 ? TrendingUp : (card.delta && card.delta < 0 ? TrendingDown : Minus);
                const deltaColor = card.delta && card.delta > 0 ? "text-green-500" : (card.delta && card.delta < 0 ? "text-red-500" : "text-slate-400");
                const deltaText = card.delta !== undefined && card.delta !== null ? `${Math.abs(card.delta).toFixed(1)}%` : null;

                return (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between h-32">
                        <div className="flex items-start justify-between">
                            <span className="text-xs font-semibold text-slate-500 uppercase tracking-tight">{card.label}</span>
                            <div className={`p-1.5 rounded-lg bg-${card.color}-50 text-${card.color}-600`}>
                                <card.icon size={16} />
                            </div>
                        </div>

                        <div>
                            <div className="text-2xl font-bold text-slate-900 truncate" title={card.value}>
                                {card.value}
                            </div>

                            {/* Delta / Sublabel */}
                            <div className="flex items-center gap-1 mt-1 text-[10px] font-medium">
                                {deltaText ? (
                                    <>
                                        <DeltaIcon size={12} className={deltaColor} />
                                        <span className={deltaColor}>{deltaText}</span>
                                        <span className="text-slate-400">vs prev</span>
                                    </>
                                ) : (
                                    <span className="text-slate-400">{card.suffix || "—"}</span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
