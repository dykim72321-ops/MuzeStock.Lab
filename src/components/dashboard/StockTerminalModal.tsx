import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    TrendingUp,
    TrendingDown,
    Zap,
    Target,
    ShieldAlert,
    Info,
    ChevronRight,
    Fingerprint,
    List,
    Loader2
} from 'lucide-react';
import clsx from 'clsx';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    Tooltip
} from 'recharts';

interface StockTerminalModalProps {
    isOpen: boolean;
    onClose: () => void;
    data: {
        ticker: string;
        dnaScore: number;
        popProbability: number;
        bullPoints: string[];
        bearPoints: string[];
        matchedLegend: { ticker: string; similarity: number };
        riskLevel: string;
        aiSummary: string;
        price?: number;
        change?: string;
    };
    onSimulation?: () => Promise<void>;
    onAddToWatchlist?: () => Promise<void>;
}

export const StockTerminalModal = ({ 
    isOpen, 
    onClose, 
    data,
    onSimulation,
    onAddToWatchlist
}: StockTerminalModalProps) => {
    const [isSimulating, setIsSimulating] = useState(false);
    const [isAddingWatchlist, setIsAddingWatchlist] = useState(false);

    // Mock data for the chart (could be replaced with real history later)
    const chartData = [
        { name: '10:00', value: 40 },
        { name: '11:00', value: 35 },
        { name: '12:00', value: 55 },
        { name: '13:00', value: 45 },
        { name: '14:00', value: 70 },
        { name: '15:00', value: data.dnaScore },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 md:p-10">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-[#020617]/90 backdrop-blur-2xl"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        className="relative w-full max-w-5xl lg:max-w-6xl max-h-[95vh] md:max-h-[90vh] bg-[#020617]/80 backdrop-blur-3xl border border-white/10 rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.3)] flex flex-col md:flex-row"
                    >
                        {/* Ambient Background Glows */}
                        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-cyan-500/10 blur-[120px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />

                        {/* Left Column: Core Identity & Chart */}
                        <div className="w-full md:w-1/2 lg:w-[45%] p-5 md:p-8 border-b md:border-b-0 md:border-r border-white/5 flex flex-col relative z-10 shrink-0">
                            <div className="flex justify-between items-start mb-6 md:mb-10">
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <span className="px-2 py-1 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold tracking-widest uppercase mb-2 inline-block">
                                            시스템 심층 분석
                                        </span>
                                    </div>
                                    <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tighter flex items-center gap-3">
                                        {data.ticker}
                                        <Fingerprint className="w-6 h-6 md:w-8 md:h-8 text-indigo-400 opacity-50" />
                                    </h1>
                                    <p className="text-slate-400 text-[10px] md:text-sm font-medium flex items-center gap-2 mt-1 md:mt-2">
                                        <span className={clsx(
                                            "w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
                                            data.dnaScore >= 70 ? "bg-emerald-500 shadow-emerald-500/50" : data.dnaScore >= 50 ? "bg-amber-500 shadow-amber-500/50" : "bg-rose-500 shadow-rose-500/50"
                                        )} />
                                        AI 분석 신뢰도: <span className="text-white font-bold">{data.dnaScore}%</span>
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors group"
                                >
                                    <X className="w-5 h-5 md:w-6 md:h-6 text-slate-400 group-hover:text-white transition-colors" />
                                </button>
                            </div>

                            {/* DNA Gauge Visualization (Simplified for Terminal) */}
                            <div className="flex-1 flex flex-col justify-center min-h-[200px] md:min-h-[300px]">
                                <div className="h-32 md:h-48 w-full relative mb-8 md:mb-12">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={chartData}>
                                            <defs>
                                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <Tooltip
                                                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                                                itemStyle={{ color: '#818cf8', fontWeight: 'bold' }}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="value"
                                                stroke="#818cf8"
                                                strokeWidth={4}
                                                fillOpacity={1}
                                                fill="url(#colorValue)"
                                                animationDuration={1500}
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-x-0 bottom-0 py-2 flex justify-between text-[10px] font-mono text-slate-500 tracking-widest uppercase border-t border-white/5">
                                        <span>스캔 시작</span>
                                        <span>데이터 통합 완료</span>
                                    </div>
                                </div>

                                 {/* Score Pills */}
                                <div className="grid grid-cols-2 gap-3 md:gap-4">
                                    <div className="bg-white/5 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                                        <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">급등 발생 확률</p>
                                        <div className="flex items-end gap-1 md:gap-2 text-2xl md:text-3xl font-black text-cyan-400">
                                            {data.popProbability}%
                                            <TrendingUp className="w-4 h-4 md:w-5 md:h-5 mb-0.5 md:mb-1" />
                                        </div>
                                    </div>
                                    <div className="bg-white/5 p-3 md:p-4 rounded-2xl md:rounded-3xl border border-white/5 hover:bg-white/10 transition-colors">
                                        <p className="text-[9px] md:text-[10px] text-slate-500 uppercase font-black tracking-widest mb-1">위험 등급</p>
                                        <div className={clsx(
                                            "flex items-end gap-1 md:gap-2 text-2xl md:text-3xl font-black",
                                            data.riskLevel === 'High' ? "text-rose-400" : "text-amber-400"
                                        )}>
                                            {data.riskLevel === 'High' ? '높음' : data.riskLevel === 'Medium' ? '중간' : '낮음'}
                                            <ShieldAlert className="w-4 h-4 md:w-5 md:h-5 mb-0.5 md:mb-1" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                             {/* Right Column: Narrative & Evidence */}
                        <div className="flex-1 p-4 md:p-8 bg-black/20 flex flex-col overflow-y-auto w-full min-w-0
                                        [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent 
                                        [&::-webkit-scrollbar-thumb]:bg-white/10 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-white/20">
                            <div className="space-y-6 md:space-y-10">
                                {/* AI Summary Section */}
                                <div>
                                    <h3 className="text-[10px] md:text-xs font-black text-indigo-400 uppercase tracking-[0.2em] mb-3 md:mb-4 flex items-center gap-2">
                                        <Zap className="w-4 h-4 fill-indigo-400" />
                                        인공지능 분석 요약
                                    </h3>
                                    <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-200 font-medium leading-relaxed tracking-tight">
                                        {data.aiSummary || "해당 자산에 대한 최신 시장 Narrative를 분석 중입니다..."}
                                    </p>
                                </div>

                                 {/* Bull vs Bear Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 md:gap-8">
                                    <div className="space-y-3 md:space-y-4">
                                        <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                                            <TrendingUp className="w-3 h-3" />
                                            강세 요인 (Bullish)
                                        </h4>
                                        <ul className="space-y-3">
                                            {data.bullPoints.map((point, i) => (
                                                <li key={i} className="flex gap-2 text-slate-400 text-sm font-medium leading-snug">
                                                    <ChevronRight className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2">
                                            <TrendingDown className="w-3 h-3" />
                                            약세 요인 (Bearish)
                                        </h4>
                                        <ul className="space-y-3">
                                            {data.bearPoints.map((point, i) => (
                                                <li key={i} className="flex gap-2 text-slate-400 text-sm font-medium leading-snug">
                                                    <ChevronRight className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                                                    {point}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                 {/* Legend Analysis Section */}
                                <div className="bg-indigo-500/10 rounded-[1.5rem] md:rounded-[2rem] p-4 md:p-6 border border-indigo-500/20 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-40 transition-opacity">
                                        <Target className="w-8 h-8 md:w-12 md:h-12 text-indigo-500" />
                                    </div>
                                    <h3 className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Info className="w-3 h-3" />
                                        과거 패턴 매칭 분석
                                    </h3>
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                                        <div>
                                            <p className="text-slate-500 text-[10px] font-bold mb-1 uppercase tracking-tighter">유사 패턴 종목</p>
                                            <p className="text-xl md:text-2xl font-black text-white">{data.matchedLegend.ticker}</p>
                                        </div>
                                        <div className="hidden sm:block h-10 w-px bg-white/10" />
                                        <div className="flex-1 w-full">
                                            <p className="text-slate-500 text-[10px] font-bold mb-1 uppercase tracking-tighter">패턴 상관관계</p>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${data.matchedLegend.similarity}%` }}
                                                        transition={{ duration: 1.5, ease: "circOut" }}
                                                        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]"
                                                    />
                                                </div>
                                                <span className="text-indigo-400 font-mono text-sm font-bold">{data.matchedLegend.similarity}%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Footer */}
                                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                                    <button 
                                        onClick={async () => {
                                            if (onSimulation) {
                                                setIsSimulating(true);
                                                await onSimulation();
                                                setIsSimulating(false);
                                            }
                                        }}
                                        disabled={isSimulating}
                                        className="flex-1 bg-white text-black font-black py-4 rounded-2xl hover:bg-indigo-50 transition-colors uppercase tracking-widest text-xs shadow-lg shadow-white/5 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isSimulating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        시뮬레이션 투자하기
                                    </button>
                                    <button 
                                        onClick={async () => {
                                            if (onAddToWatchlist) {
                                                setIsAddingWatchlist(true);
                                                await onAddToWatchlist();
                                                setIsAddingWatchlist(false);
                                            }
                                        }}
                                        disabled={isAddingWatchlist}
                                        className="flex-1 bg-white/5 text-white font-black py-4 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors uppercase tracking-widest text-xs flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {isAddingWatchlist ? <Loader2 className="w-4 h-4 animate-spin" /> : <List className="w-4 h-4" />}
                                        관심 종목 추가
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
