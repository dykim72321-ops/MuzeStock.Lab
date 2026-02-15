import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, Wallet, PieChart, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const PortfolioDashboard = () => {
    const [stats, setStats] = useState({
        totalReturn: 0,
        winRate: 0,
        activePositions: 0,
        bestPerformer: { ticker: '-', pnl: 0 }
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPortfolio = async () => {
            const { data: positions } = await supabase
                .from('paper_portfolio')
                .select('*');

            if (positions && positions.length > 0) {
                const totalPnl = positions.reduce((acc, curr) => acc + (curr.pnl_percent || 0), 0);
                const avgReturn = totalPnl / positions.length;
                const wins = positions.filter(p => p.pnl_percent > 0).length;
                const winRate = (wins / positions.length) * 100;

                // 최고 수익 종목 찾기
                let best = { ticker: 'N/A', pnl_percent: 0 };
                if (positions.length > 0) {
                    best = positions.reduce((prev, current) =>
                        (prev.pnl_percent > current.pnl_percent) ? prev : current
                    );
                }

                setStats({
                    totalReturn: avgReturn,
                    winRate: winRate,
                    activePositions: positions.filter(p => p.status === 'OPEN').length,
                    bestPerformer: { ticker: best.ticker, pnl: best.pnl_percent }
                });
            } else {
                setStats({
                    totalReturn: 0,
                    winRate: 0,
                    activePositions: 0,
                    bestPerformer: { ticker: '-', pnl: 0 }
                });
            }
            setLoading(false);
        };

        fetchPortfolio();
    }, []);

    if (loading) return <div className="h-48 w-full animate-pulse bg-white/5 rounded-xl" />;

    return (
        <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* Left: Main KPI (Total Return) */}
            <div className="flex-1 relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent p-6 border border-white/5 group min-h-[180px]">
                <div className="absolute inset-0 bg-indigo-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div className="relative z-10 flex flex-col h-full justify-between">
                    <div>
                        <div className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-2 uppercase tracking-widest whitespace-nowrap">
                            <Wallet className="w-4 h-4 text-indigo-400" />
                            Account Balance Growth
                        </div>
                        <div className="flex items-baseline gap-3 mt-1">
                            <h2 className={`text-6xl font-black font-mono tracking-tighter ${stats.totalReturn >= 0 ? 'text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.4)]' : 'text-rose-400'} transition-all duration-300`}>
                                {stats.totalReturn > 0 ? '+' : ''}{stats.totalReturn.toFixed(2)}%
                            </h2>
                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${stats.totalReturn >= 0 ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'}`}>
                                24H
                            </span>
                        </div>
                    </div>

                    {/* SVG Sparkline (Abstract Representation) */}
                    <div className="h-16 w-full mt-4 relative opacity-80 group-hover:opacity-100 transition-opacity">
                        <svg className="w-full h-full" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradientIndent" x1="0%" y1="0%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#6366f1" stopOpacity="0" />
                                    <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
                                    <stop offset="100%" stopColor="#ec4899" stopOpacity="1" />
                                </linearGradient>
                            </defs>
                            <motion.path
                                d="M0,45 Q30,35 60,55 T120,30 T180,60 T240,15 T300,45 T360,25 T420,55 T480,10"
                                fill="none"
                                stroke="url(#gradientIndent)"
                                strokeWidth="3"
                                strokeLinecap="round"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{ duration: 2.5, ease: "easeInOut" }}
                            />
                        </svg>
                        <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
                    </div>
                </div>
            </div>

            {/* Right: Secondary Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 lg:w-[60%]">

                {/* Win Rate */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:bg-white/10 transition-colors relative overflow-hidden group">
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                        <PieChart className="w-4 h-4 text-cyan-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Win Rate</span>
                    </div>
                    <div className="relative z-10">
                        <div className="text-3xl font-black text-white font-mono tracking-tighter group-hover:scale-105 transition-transform origin-left">{stats.winRate.toFixed(0)}%</div>
                        <div className="w-full bg-slate-700/30 h-1 mt-3 rounded-full overflow-hidden">
                            <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full shadow-[0_0_10px_rgba(34,211,238,0.5)]" style={{ width: `${stats.winRate}%` }} />
                        </div>
                    </div>
                </div>

                {/* Best Performer */}
                <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:bg-white/10 transition-colors relative overflow-hidden group">
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                        <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Top Pick</span>
                    </div>
                    <div className="relative z-10">
                        <div className="text-xl font-black text-white font-mono tracking-tight truncate mb-1">{stats.bestPerformer.ticker}</div>
                        <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-emerald-400">+{Number(stats.bestPerformer.pnl).toFixed(1)}%</span>
                        </div>
                    </div>
                </div>

                {/* Active Positions */}
                <div className="col-span-2 md:col-span-1 bg-indigo-500/10 rounded-2xl p-5 border border-indigo-500/20 flex flex-col justify-between hover:bg-indigo-500/20 transition-colors relative overflow-hidden group">
                    <div className="flex items-center gap-2 mb-2 relative z-10">
                        <TrendingUp className="w-4 h-4 text-indigo-300" />
                        <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest whitespace-nowrap">Active</span>
                    </div>
                    <div className="relative z-10">
                        <div className="text-3xl font-black text-white font-mono tracking-tighter group-hover:scale-105 transition-transform origin-left">{stats.activePositions}</div>
                        <div className="text-[9px] font-bold text-indigo-300/70 mt-1 uppercase tracking-wider">Open Positions</div>
                    </div>
                    {/* Decorative BG */}
                    <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-indigo-500/20 blur-3xl rounded-full pointer-events-none group-hover:bg-indigo-500/30 transition-colors duration-500" />
                </div>

            </div>
        </div>
    );
};
