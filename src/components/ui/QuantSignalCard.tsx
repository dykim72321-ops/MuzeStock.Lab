import React from 'react';
import { TrendingUp, TrendingDown, AlertCircle, Activity } from 'lucide-react';
import clsx from 'clsx';
import { motion } from 'framer-motion';

// TypeScript 인터페이스 정의
export interface QuantSignalData {
    dna_score: number | null;
    bull_case: string;
    bear_case: string;
    reasoning_ko: string;
    tags?: string[];
}

interface QuantSignalCardProps {
    data: QuantSignalData | null;
}

export const QuantSignalCard: React.FC<QuantSignalCardProps> = ({ data }) => {
    // 데이터가 없을 경우 로딩/에러 처리
    if (!data) return (
        <div className="w-full p-8 bg-white border border-slate-200 rounded-xl flex items-center justify-center min-h-[300px] shadow-inner">
            <div className="text-slate-400 animate-pulse font-bold tracking-tight uppercase text-xs">Waiting for Quantum Matrix Data...</div>
        </div>
    );

    const { dna_score, bull_case, bear_case, reasoning_ko, tags } = data;

    const isAIPending = !bull_case || bull_case.includes('분석 중') || bull_case.includes('데이터');
    const showDNA = dna_score && dna_score !== 50 && dna_score > 0;

    const getScoreColor = (score: number | null) => {
        if (score === null || score === 0) return 'text-slate-400 bg-slate-50 border-slate-200';
        if (score >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
        if (score >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
        return 'text-rose-600 bg-rose-50 border-rose-200';
    };

    const getProgressBarColor = (score: number | null) => {
        if (score === null || score === 0) return 'bg-slate-200';
        if (score >= 80) return 'bg-emerald-500 shadow-sm';
        if (score >= 60) return 'bg-amber-500 shadow-sm';
        return 'bg-rose-500 shadow-sm';
    };

    return (
        <div className="relative overflow-hidden bg-white rounded-xl border border-slate-100">
            {/* Subtle Gradient Overlay */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/30 blur-[100px] rounded-full pointer-events-none" />

            <div className="p-6 relative z-10">
                {/* Header Section */}
                <div className="flex justify-between items-start mb-6">
                    <div className="space-y-3">
                        <h2 className="text-base font-black flex items-center gap-2 tracking-tight text-slate-800 uppercase">
                            <Activity className="w-4 h-4 text-[#0176d3]" />
                            AI Quant Inference Matrix
                        </h2>
                        <div className="flex flex-wrap gap-1.5">
                            {tags && tags.length > 0 ? (
                                tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded bg-slate-100 text-slate-600 border border-slate-200"
                                    >
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-widest rounded bg-slate-50 text-slate-400 border border-slate-200 border-dashed">
                                    No Active Tags
                                </span>
                            )}
                        </div>
                    </div>

                    {/* DNA Score Badge */}
                    <div className={clsx(
                        "flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 shrink-0 shadow-sm transition-all duration-500",
                        showDNA ? getScoreColor(dna_score) : 'text-slate-300 bg-slate-50 border-slate-100'
                    )}>
                        <span className="text-xl font-black tracking-tighter">
                            {showDNA ? dna_score : '—'}
                        </span>
                        <span className="text-[8px] uppercase font-black tracking-widest opacity-80 -mt-1">DNA</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 mb-8 overflow-hidden">
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: showDNA ? `${Math.max(0, Math.min(100, dna_score!))}%` : '0%' }}
                        className={clsx(
                            "h-full rounded-full transition-all duration-1000 ease-out",
                            showDNA ? getProgressBarColor(dna_score) : 'bg-transparent'
                        )}
                    />
                </div>

                {/* Analysis Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {isAIPending ? (
                        <div className="col-span-2 flex flex-col items-center justify-center py-10 gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
                            <div className="flex gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest">AI Synthesis Initializing</p>
                            <p className="text-[10px] text-slate-400 font-medium">Deep analysis triggers on validated STRONG SIGNALS</p>
                        </div>
                    ) : (
                        <>
                            {/* Bull Case */}
                            <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-100 hover:border-emerald-300 transition-colors group/case">
                                <h3 className="text-emerald-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <TrendingUp className="w-3.5 h-3.5" /> Bullish Momentum
                                </h3>
                                <p className="text-sm text-slate-700 leading-relaxed font-bold break-keep">{bull_case}</p>
                            </div>
                            {/* Bear Case */}
                            <div className="p-4 bg-rose-50/30 rounded-xl border border-rose-100 hover:border-rose-300 transition-colors group/case">
                                <h3 className="text-rose-700 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-3">
                                    <TrendingDown className="w-3.5 h-3.5" /> Bearish Risk Factors
                                </h3>
                                <p className="text-sm text-slate-700 leading-relaxed font-bold break-keep">{bear_case}</p>
                            </div>
                        </>
                    )}
                </div>

                {/* Synthesis Summary */}
                <div className="p-5 bg-blue-50/30 rounded-xl border border-blue-100 hover:border-blue-300 transition-colors">
                    <h3 className="text-[#0176d3] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 mb-3">
                        <AlertCircle className="w-3.5 h-3.5" /> Strategic Synthesis (Reasoning)
                    </h3>
                    <p className="text-sm text-slate-700 leading-relaxed font-bold break-keep">
                        {isAIPending
                            ? 'The engine will generate a formal AI report once the STRONG SIGNAL validation is complete.'
                            : reasoning_ko}
                    </p>
                </div>
            </div>
        </div>
    );
};
