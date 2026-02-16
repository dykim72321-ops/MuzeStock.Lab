import { useState } from 'react';
import { Target, Zap } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
import { StockTerminalModal } from '../dashboard/StockTerminalModal';
import clsx from 'clsx';

interface AnalysisResultCardProps {
    ticker: string;
    dnaScore: number;
    popProbability: number;
    bullPoints: string[];
    bearPoints: string[];
    matchedLegend: { ticker: string; similarity: number };
    riskLevel: string;
    className?: string;
    aiSummary?: string;
}

export const AnalysisResultCard = ({
    ticker,
    dnaScore,
    popProbability,
    bullPoints,
    bearPoints,
    matchedLegend,
    riskLevel,
    className,
    aiSummary
}: AnalysisResultCardProps) => {
    const [isTerminalOpen, setIsTerminalOpen] = useState(false);

    // Sparkline data (mocked for visual effect)
    const sparkData = [
        { v: 30 }, { v: 45 }, { v: 35 }, { v: 60 }, { v: 50 }, { v: dnaScore }
    ];

    return (
        <>
            <div
                onClick={() => setIsTerminalOpen(true)}
                className={clsx(
                    "relative group cursor-pointer transition-all duration-500",
                    className
                )}
            >
                {/* Glow Effects */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/0 to-cyan-500/0 group-hover:from-indigo-500/10 group-hover:via-indigo-500/5 group-hover:to-cyan-500/10 rounded-[2rem] blur-xl transition-all duration-700" />

                <div className="relative h-full flex flex-col p-6 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden hover:border-white/20 transition-all duration-300">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="absolute -inset-2 bg-indigo-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
                                <h3 className="text-3xl font-black text-white tracking-tighter relative z-10">{ticker}</h3>
                            </div>
                            <div className={clsx(
                                "px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase border",
                                dnaScore >= 70 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" :
                                    dnaScore >= 50 ? "bg-amber-500/10 border-amber-500/30 text-amber-400" :
                                        "bg-rose-500/10 border-rose-500/30 text-rose-400"
                            )}>
                                {dnaScore >= 80 ? 'Grade S' : dnaScore >= 70 ? 'Grade A' : 'Grade B'}
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">DNA Score</p>
                            <div className="text-2xl font-black text-white flex items-center gap-1 justify-end">
                                {dnaScore}
                                <span className="text-xs text-indigo-400">%</span>
                            </div>
                        </div>
                    </div>

                    {/* Sparkline & Probability */}
                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 overflow-hidden">
                            <div className="h-10 w-full mb-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={sparkData}>
                                        <Area
                                            type="monotone"
                                            dataKey="v"
                                            stroke="#818cf8"
                                            strokeWidth={2}
                                            fill="#818cf8"
                                            fillOpacity={0.1}
                                            animationDuration={1500}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Confidence Trend</p>
                        </div>
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex flex-col justify-center">
                            <div className="flex items-center gap-1 text-cyan-400 mb-1">
                                <Zap className="w-4 h-4 fill-current" />
                                <span className="text-xl font-black">{popProbability}%</span>
                            </div>
                            <p className="text-[9px] text-slate-500 uppercase font-bold tracking-tighter">Pop Probability</p>
                        </div>
                    </div>

                    {/* AI Narrative Hook */}
                    <div className="flex-1 mb-6">
                        <p className="text-sm text-slate-400 font-medium leading-normal line-clamp-3 italic">
                            "{(aiSummary || bullPoints[0] || "").split(';')[0]}..."
                        </p>
                    </div>

                    {/* Matched Legend Stamp */}
                    <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Target className="w-3.5 h-3.5 text-indigo-400" />
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Matched: {matchedLegend.ticker}</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono font-bold text-indigo-300">{matchedLegend.similarity}%</span>
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>

            <StockTerminalModal
                isOpen={isTerminalOpen}
                onClose={() => setIsTerminalOpen(false)}
                data={{
                    ticker,
                    dnaScore,
                    popProbability,
                    bullPoints,
                    bearPoints,
                    matchedLegend,
                    riskLevel,
                    aiSummary: aiSummary || ""
                }}
            />
        </>
    );
};
