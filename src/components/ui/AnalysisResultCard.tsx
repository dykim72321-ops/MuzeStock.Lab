import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { TrendingUp, AlertTriangle, ShieldCheck, Zap, Sparkles, BrainCircuit } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

interface AnalysisResultCardProps {
    ticker: string;
    dnaScore: number;
    popProbability?: number;
    bullPoints: string[];
    bearPoints: string[];
    matchedLegend?: {
        ticker: string;
        similarity: number;
    };
    isCorrect?: boolean | null; // hit/miss stamp
    riskLevel?: string;
    aiSummary?: string;
    className?: string;
}

export const AnalysisResultCard: React.FC<AnalysisResultCardProps> = ({
    ticker,
    dnaScore,
    popProbability,
    bullPoints,
    bearPoints,
    matchedLegend,
    isCorrect,
    riskLevel,
    aiSummary,
    className
}) => {
    const getScoreColor = (score: number) => {
        if (score >= 70) return 'text-emerald-400';
        if (score >= 40) return 'text-amber-400';
        return 'text-rose-400';
    };


    return (
        <Card className={clsx("p-0 overflow-hidden bg-slate-900/50 backdrop-blur-xl border border-white/5", className)}>
            <div className={clsx("h-1.5 w-full bg-gradient-to-r",
                dnaScore >= 70 ? "from-emerald-500 to-indigo-500" :
                    dnaScore >= 40 ? "from-amber-500 to-orange-500" :
                        "from-rose-500 to-purple-500"
            )} />

            <div className="p-6">
                <div className="flex items-start justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                            <BrainCircuit className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-white tracking-tighter font-mono">{ticker} <span className="text-slate-500 font-light ml-2 uppercase text-xs tracking-widest">DNA Analysis</span></h3>
                            <div className="flex items-center gap-2 mt-1">
                                <Badge variant="neutral" className="bg-white/5 border-white/10 text-slate-400 text-[9px] px-1.5 font-bold uppercase tracking-widest">
                                    AI-CORE v2.0
                                </Badge>
                                {riskLevel && (
                                    <span className={clsx("text-[9px] font-bold uppercase tracking-widest",
                                        riskLevel === 'Low' ? 'text-emerald-500' : riskLevel === 'Medium' ? 'text-amber-500' : 'text-rose-500'
                                    )}>
                                        • {riskLevel} Risk
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="text-right flex flex-col items-end">
                        <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">DNA SCORE</div>
                        <div className={clsx("text-4xl font-black font-mono leading-none", getScoreColor(dnaScore))}>
                            {dnaScore}
                        </div>
                    </div>
                </div>

                {/* DNA GAUGE & STATS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                    <div className="relative flex flex-col items-center justify-center py-4 px-8 bg-black/20 rounded-2xl border border-white/5 overflow-hidden group">
                        {/* SVG Gauge Background */}
                        <svg className="w-32 h-16" viewBox="0 0 100 50">
                            <path d="M10,45 A40,40 0 0,1 90,45" fill="none" stroke="#ffffff10" strokeWidth="8" strokeLinecap="round" />
                            <motion.path
                                d="M10,45 A40,40 0 0,1 90,45"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="8"
                                strokeLinecap="round"
                                strokeDasharray="125.66"
                                initial={{ strokeDashoffset: 125.66 }}
                                animate={{ strokeDashoffset: 125.66 - (125.66 * (dnaScore / 100)) }}
                                transition={{ duration: 1.5, ease: "easeOut" }}
                                className={getScoreColor(dnaScore)}
                            />
                        </svg>
                        <div className="absolute inset-x-0 bottom-4 text-center">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Momentum DNA</span>
                        </div>
                        <div className="absolute top-2 right-2 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Sparkles className="w-8 h-8 text-white" />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/5">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-tight">Pop Probability</span>
                            </div>
                            <span className="text-lg font-black text-white font-mono">{popProbability || 0}%</span>
                        </div>

                        {matchedLegend && matchedLegend.ticker !== 'None' && (
                            <div className="flex justify-between items-center bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20">
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-indigo-400" />
                                    <span className="text-xs font-bold text-indigo-300 uppercase tracking-tight">Pattern Match</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-lg font-black text-indigo-400 font-mono">{matchedLegend.ticker}</span>
                                    <p className="text-[9px] text-indigo-500/70 font-bold uppercase tracking-tighter">{matchedLegend.similarity.toFixed(0)}% Similarity</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* BULL vs BEAR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Bull Thesis</span>
                        </div>
                        {bullPoints && bullPoints.length > 0 ? (
                            bullPoints.slice(0, 3).map((point, i) => (
                                <p key={i} className="text-[11px] text-slate-400 leading-tight flex items-start gap-2">
                                    <span className="text-emerald-500 font-bold">•</span> {point}
                                </p>
                            ))
                        ) : (
                            <p className="text-[11px] text-slate-600 italic">No bullish signals detected.</p>
                        )}
                    </div>

                    <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10 space-y-2">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-rose-500" />
                            <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Bear Risks</span>
                        </div>
                        {bearPoints && bearPoints.length > 0 ? (
                            bearPoints.slice(0, 3).map((point, i) => (
                                <p key={i} className="text-[11px] text-slate-400 leading-tight flex items-start gap-2">
                                    <span className="text-rose-500 font-bold">•</span> {point}
                                </p>
                            ))
                        ) : (
                            <p className="text-[11px] text-slate-600 italic">No significant risks identified.</p>
                        )}
                    </div>
                </div>

                {/* AI SUMMARY BOX */}
                {aiSummary && (
                    <div className="p-4 bg-indigo-950/20 rounded-xl border border-indigo-500/10 relative overflow-hidden group mb-4">
                        <p className="text-xs text-indigo-200/80 leading-relaxed italic max-h-16 overflow-hidden">
                            "{aiSummary}"
                        </p>
                    </div>
                )}

                {/* STAMPS & METADATA */}
                <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-4">
                        {isCorrect !== undefined && isCorrect !== null && (
                            <div className={clsx(
                                "px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-tighter flex items-center gap-1.5",
                                isCorrect ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-rose-500/20 text-rose-400 border-rose-500/30"
                            )}>
                                {isCorrect ? <ShieldCheck className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                {isCorrect ? "VERIFIED HIT" : "VERIFIED MISS"}
                            </div>
                        )}
                    </div>

                    <div className="text-[10px] text-slate-600 font-mono">
                        GENERATED: {new Date().toISOString().slice(0, 10)}
                    </div>
                </div>
            </div>

            {/* Visual Glitch/Overlay effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/5 to-transparent opacity-30" />
        </Card>
    );
};
