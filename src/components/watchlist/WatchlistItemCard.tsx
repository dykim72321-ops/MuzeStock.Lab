// WatchlistItemCard.tsx
import { 
  Trash2, ShieldCheck, Activity, HelpCircle, Zap, TrendingUp, Calendar, ArrowUpRight
} from 'lucide-react';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { ResponsiveContainer, AreaChart, Area, XAxis, ReferenceLine, YAxis } from 'recharts';
import { useDNACalculator } from '../../hooks/useDNACalculator';
import type { Stock } from '../../types';
import type { WatchlistItem } from '../../services/watchlistService';
import clsx from 'clsx';

interface DeepDiveData {
  ticker: string;
  dnaScore: number;
  price: number;
  change: string;
  efficiencyRatio: number;
  kellyWeight: number;
  bullPoints: string[];
  bearPoints: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  quantSummary: string;
}

interface WatchlistItemCardProps {
  item: WatchlistItem;
  stock?: Stock;
  viewMode: 'grid' | 'list';
  onRemove: (ticker: string) => void;
  onDeepDive: (data: DeepDiveData) => void;
}

export const WatchlistItemCard = ({ 
  item, 
  stock, 
  viewMode, 
  onRemove, 
  onDeepDive 
}: WatchlistItemCardProps) => {
  const dna = useDNACalculator({
    buyPrice: item.buyPrice || stock?.price || 0,
    currentPrice: stock?.price || 0,
    buyDate: item.addedAt,
    history: stock?.history || []
  });

  const { 
    dnaScore, 
    targetPrice, 
    stopPrice, 
    daysHeld,
    efficiencyRatio,
    kellyWeight,
    isTrailing,
    action,
    isLoading
  } = dna;

  const currentPrice = stock?.price || 0;
  const buyPrice = item.buyPrice || stock?.price || 0;
  
  const chartData = useMemo(() => {
    if (!stock?.history) return [];
    const data = stock.history.map(h => ({ value: h.price, date: h.date }));
    if (currentPrice > 0 && (data.length === 0 || currentPrice !== data[data.length - 1].value)) {
      data.push({ value: currentPrice, date: new Date().toISOString() });
    }
    return data;
  }, [stock?.history, currentPrice]);

  const currentReturnPct = buyPrice > 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;
  const isProfit = currentReturnPct > 0.01;
  const isLoss = currentReturnPct < -0.01;

  if (isLoading || !stock) {
    return (
      <div className="cursor-wait animate-pulse">
        <div className="overflow-hidden bg-[#0b101a]/60 border-slate-800 rounded-[2rem] p-6 border shadow-2xl">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800" />
              <div className="space-y-2 flex-1">
                <div className="h-4 w-24 bg-slate-900 rounded" />
                <div className="h-3 w-32 bg-slate-900/50 rounded" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="h-16 bg-slate-900 rounded-[1rem] border border-slate-800" />
              <div className="h-16 bg-slate-900 rounded-[1rem] border border-slate-800" />
            </div>
            <div className="h-24 bg-slate-900 rounded-[1.5rem] border border-slate-800" />
          </div>
        </div>
      </div>
    );
  }

  const handleCardClick = () => {
    const analysisCache = stock?.stock_analysis_cache?.[0]?.analysis;
    const riskLevel: 'Low' | 'Medium' | 'High' = dnaScore >= 70 ? 'Low' : dnaScore >= 50 ? 'Medium' : 'High';
    
    onDeepDive({
      ticker: item.ticker,
      dnaScore,
      price: currentPrice,
      change: `${stock?.changePercent.toFixed(2)}%`,
      efficiencyRatio,
      kellyWeight,
      bullPoints: analysisCache?.bullCase || ["모멘텀 지표 분석 중"],
      bearPoints: analysisCache?.bearCase || ["리스크 요인 스캔 중"],
      riskLevel,
      quantSummary: analysisCache?.quantSummary || "해당 종목에 대한 시스템 분석 데이터가 존재하지 않습니다.",
    });
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleCardClick();
        }
      }}
      className="cursor-pointer group outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-[2.2rem] transition-all duration-500 hover:-translate-y-1"
    >
      <div className="overflow-hidden bg-[#0b101a]/80 backdrop-blur-xl border border-slate-800 hover:border-indigo-500/50 transition-all duration-500 shadow-3xl rounded-[2rem] relative h-full">
        {/* Card Background Glow */}
        <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className={viewMode === 'grid' ? "p-6" : "p-5 flex items-center justify-between"}>
          {viewMode === 'grid' ? (
            <div className="space-y-6 relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-2xl text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-2xl">
                    {item.ticker[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors tracking-tighter uppercase leading-none">{item.ticker}</h3>
                      {isTrailing && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[9px] font-black rounded-lg border border-amber-500/20 uppercase tracking-widest shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                          <Activity className="w-2.5 h-2.5" /> Trailing
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Sentinel Locked</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div 
                    className={clsx(
                      "px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-lg transition-all duration-500",
                      action === 'HOLD' ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                        : action === 'REJECT' ? "bg-amber-500/20 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]" 
                        : action === 'TIME_STOP' ? "bg-orange-500/20 text-orange-400 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.2)]"
                        : "bg-rose-500/20 text-rose-400 border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
                    )}
                    title={action === 'REJECT' ? (dna.rejectReason || 'R/R Violation') : ''}
                  >
                    {action}
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemove(item.ticker);
                    }}
                    className="p-2.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20 active:scale-90"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-[1.2rem] border border-slate-800 shadow-inner group-hover:border-slate-700 transition-colors" title="AI-Calculated DNA Synthesis Score">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2 flex items-center gap-1.5 tracking-widest">
                    Alpha Efficiency <HelpCircle className="w-3 h-3 opacity-50 text-indigo-400" />
                  </p>
                  <div className="flex items-baseline gap-1.5 leading-none">
                    <span className="text-3xl font-black text-white font-mono tracking-tighter tabular-nums leading-none">{dnaScore}</span>
                    <span className="text-[10px] font-black text-indigo-400 tracking-widest">DNA</span>
                  </div>
                </div>
                <div className="bg-slate-900/50 p-4 rounded-[1.2rem] border border-slate-800 shadow-inner group-hover:border-slate-700 transition-colors" title="Performance Relative to Entry Basis">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2 flex items-center gap-1.5 tracking-widest">
                    Orbit Yield <TrendingUp className="w-3 h-3 opacity-50 text-indigo-400" />
                  </p>
                  <div className={clsx(
                    "font-mono text-3xl font-black tracking-tighter tabular-nums leading-none",
                    isProfit ? "text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]" : isLoss ? "text-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]" : "text-slate-500"
                  )}>
                    <span>{isProfit ? '+' : ''}{currentReturnPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-4 rounded-[1.2rem] border border-slate-800 shadow-inner group-hover:border-slate-700 transition-colors">
                  <p className="text-[10px] font-black text-slate-500 uppercase mb-2 flex items-center gap-1.5 tracking-widest">
                    Current Quote <Activity className="w-3 h-3 opacity-50 text-indigo-400" />
                  </p>
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-white font-mono tracking-tighter tabular-nums leading-none">${currentPrice.toFixed(2)}</span>
                    <span className={clsx(
                      "text-[10px] font-black font-mono mt-1",
                      stock.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"
                    )}>
                      {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(1)}% (24h)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/50 p-1 rounded-[1.2rem] border border-slate-800 shadow-inner group-hover:border-slate-700 transition-colors relative overflow-hidden h-16">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id={`grad-${item.ticker}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isProfit ? "#10b981" : isLoss ? "#f43f5e" : "#6366f1"} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={isProfit ? "#10b981" : isLoss ? "#f43f5e" : "#6366f1"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Area 
                        type="monotone" 
                        dataKey="value" 
                        stroke={isProfit ? "#10b981" : isLoss ? "#f43f5e" : "#6366f1"} 
                        fillOpacity={1} 
                        fill={`url(#grad-${item.ticker})`} 
                        strokeWidth={2.5} 
                        connectNulls
                        animationDuration={1500}
                      />
                      {buyPrice > 0 && (
                        <ReferenceLine 
                          y={buyPrice} 
                          stroke="#475569" 
                          strokeDasharray="4 4" 
                          strokeWidth={1} 
                        />
                      )}
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800/50">
                <div title="Target Analysis">
                  <p className="text-[10px] font-black text-slate-600 uppercase mb-1 tracking-widest flex items-center gap-2">Target <Zap className="w-2.5 h-2.5 text-indigo-400" /></p>
                  <p className="text-xl font-black text-emerald-400 font-mono tracking-tighter tabular-nums leading-none">${targetPrice.toFixed(2)}</p>
                </div>
                <div className="text-right" title="Protection Matrix">
                  <p className="text-[10px] font-black text-slate-600 uppercase mb-1 tracking-widest">Protection</p>
                  <p className="text-xl font-black text-rose-400 font-mono tracking-tighter tabular-nums leading-none">${stopPrice.toFixed(2)}</p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800/50 shadow-inner">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${dnaScore}%` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                    className={clsx(
                      "h-full rounded-full transition-all duration-1000",
                      dnaScore >= 70 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" :
                      dnaScore >= 40 ? "bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                    )}
                  />
                </div>
                
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-600">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Age: <span className="text-slate-300 font-mono tracking-normal">{daysHeld}d</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>ER: <span className="text-slate-300 font-mono tracking-normal">{(efficiencyRatio * 100).toFixed(0)}%</span></span>
                  </div>
                  <div className="text-indigo-400/80">
                    Kelly: <span className="font-mono tracking-normal text-slate-300">{kellyWeight.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between w-full gap-8 relative z-10">
               <div className="flex items-center gap-5 min-w-[280px]">
                 <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center font-black text-2xl text-indigo-400 shadow-2xl group-hover:bg-indigo-600/20 transition-all duration-500">
                   {item.ticker[0]}
                 </div>
                 <div>
                   <div className="flex items-center gap-3">
                     <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors tracking-tighter uppercase leading-none">{item.ticker}</h3>
                     {isTrailing && <Activity className="w-4 h-4 text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.3)] animate-pulse" />}
                   </div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-1.5 leading-none">Asset Sentinel Verified</p>
                 </div>
               </div>

               <div className="flex-1 grid grid-cols-5 gap-8 items-center">
                  <div className="col-span-1">
                    <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-[0.2em] whitespace-nowrap">DNA Energy</p>
                    <div className="flex items-center gap-4">
                       <div className="flex-1 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800 shadow-inner">
                         <div className={clsx("h-full rounded-full transition-all duration-700", dnaScore >= 70 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-indigo-500")} style={{ width: `${dnaScore}%` }} />
                       </div>
                       <span className="text-lg font-black text-white font-mono tracking-tighter">{dnaScore}</span>
                    </div>
                  </div>

                   <div className="text-center">
                     <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-[0.2em]">Efficiency</p>
                     <p className="text-lg font-black text-slate-300 font-mono tracking-tighter">{(efficiencyRatio * 100).toFixed(1)}%</p>
                   </div>
  
                   <div className="text-center">
                     <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-[0.2em]">Market 24h</p>
                     <p className={clsx(
                       "text-lg font-black font-mono tracking-tighter flex items-center justify-center gap-2",
                       stock.changePercent >= 0 ? "text-emerald-500" : "text-rose-500"
                     )}>
                       {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                     </p>
                   </div>
  
                   <div className="text-center">
                     <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-[0.2em]">Orbit Yield</p>
                     <div className={clsx(
                       "text-2xl font-black font-mono tracking-tighter leading-none mb-1",
                       isProfit ? "text-emerald-400" : isLoss ? "text-rose-400" : "text-slate-500"
                     )}>
                       {isProfit ? '+' : ''}{currentReturnPct.toFixed(2)}%
                     </div>
                     <p className="text-[9px] font-black text-slate-600 uppercase tracking-tighter leading-none mt-1">Basis: ${buyPrice.toFixed(0)}</p>
                   </div>

                   <div className="flex items-center justify-end gap-5">
                     <div 
                        className={clsx(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border shadow-2xl",
                          action === 'HOLD' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                            : action === 'REJECT' ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : action === 'TIME_STOP' ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                            : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        )}
                      >
                        {action}
                      </div>

                      <button 
                       onClick={(e) => {
                         e.stopPropagation();
                         onRemove(item.ticker);
                       }}
                       className="p-3.5 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all border border-transparent hover:border-rose-500/20 active:scale-95 group-hover:opacity-100 opacity-40"
                     >
                       <Trash2 className="w-5.5 h-5.5" />
                     </button>
                     
                     <div className="p-3.5 bg-slate-900/50 rounded-xl border border-slate-800 text-slate-500 group-hover:text-indigo-400 group-hover:border-indigo-500/30 transition-all shadow-inner">
                        <ArrowUpRight className="w-5.5 h-5.5" />
                     </div>
                   </div>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
