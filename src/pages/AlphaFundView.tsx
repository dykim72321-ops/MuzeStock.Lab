import { Zap, ShieldCheck, TrendingUp, History, Info } from 'lucide-react';
import { PortfolioDashboard } from '../components/dashboard/PortfolioDashboard';
import { PersonaLeaderboard } from '../components/dashboard/PersonaLeaderboard';

export const AlphaFundView = () => {
    return (
        <div className="max-w-[1600px] mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* Header: Alpha Fund Identity */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-5">
                    <div className="relative group">
                        <div className="absolute -inset-2 bg-amber-500/20 rounded-2xl blur-xl group-hover:bg-amber-500/30 transition-all duration-700" />
                        <div className="relative p-4 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-[0_0_20px_rgba(251,191,36,0.2)]">
                            <Zap className="w-8 h-8 text-amber-400 fill-amber-400/20 animate-pulse" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black tracking-widest uppercase">
                                System Managed
                            </span>
                            <span className="text-slate-500 text-xs font-mono tracking-tighter">v2.4-STABLE</span>
                        </div>
                        <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-sm">
                            ALPHA FUND <span className="text-slate-500 font-light">OPERATIONS</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-medium flex items-center gap-2 mt-1">
                            <ShieldCheck className="w-4 h-4 text-indigo-400" />
                            Autonomous Portfolio Management & Performance Optimization
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl backdrop-blur-md">
                        <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">Health Status</p>
                        <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Optimal
                        </div>
                    </div>
                </div>
            </header>

            {/* Performance Overview (Primary Metric) */}
            <section className="relative">
                <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="relative bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 overflow-hidden">
                    <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
                        <TrendingUp className="w-5 h-5 text-indigo-400" />
                        <h2 className="text-xl font-black text-white tracking-tight uppercase">Live Performance Matrix</h2>
                    </div>
                    <PortfolioDashboard />
                </div>
            </section>

            {/* Sub Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* AI Models Performance (Leaderboard) */}
                <div className="xl:col-span-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
                    <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                        <div className="flex items-center gap-2">
                            <History className="w-5 h-5 text-indigo-400" />
                            <h2 className="text-xl font-black text-white tracking-tight uppercase">Quant Persona Accuracy</h2>
                        </div>
                        <button className="text-xs font-bold text-slate-500 hover:text-white transition-colors bg-white/5 px-4 py-1.5 rounded-full border border-white/5">
                            Detailed Report
                        </button>
                    </div>
                    <PersonaLeaderboard />
                </div>

                {/* Fund System Specs */}
                <div className="xl:col-span-4 space-y-8">
                    <div className="bg-gradient-to-br from-indigo-500/10 to-transparent backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <Info className="w-5 h-5 text-cyan-400" />
                            <h2 className="text-lg font-bold text-white tracking-tight">Strategy Blueprint</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 transition-colors hover:border-indigo-500/30">
                                <div className="w-10 h-10 bg-indigo-500/20 rounded-xl flex items-center justify-center text-indigo-400 font-bold">1</div>
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">Momentum DNA Analysis</p>
                                    <p className="text-xs text-slate-400 leading-relaxed">Prioritizing stocks with DNA score higher than 70 and Low Risk Level.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 transition-colors hover:border-cyan-500/30">
                                <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center text-cyan-400 font-bold">2</div>
                                <div>
                                    <p className="text-sm font-bold text-white mb-1">Risk-Weighted Allocation</p>
                                    <p className="text-xs text-slate-400 leading-relaxed">Position sizing based on calculated risk-reward ratios from AI synthesis.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
