import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown, Activity, Minus } from 'lucide-react';
import { usePulseSocket } from '../../hooks/usePulseSocket';
import clsx from 'clsx';

export const SignalTicker = () => {
    const { pulseData } = usePulseSocket();

    return (
        <div className="h-8 overflow-hidden bg-indigo-500/5 rounded-full border border-indigo-500/10 px-4 flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
                <Zap className="w-3 h-3 text-indigo-400 fill-indigo-400/20 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">실시간 신호:</span>
            </div>

            <AnimatePresence mode="wait">
                {pulseData ? (
                    <motion.div
                        key={pulseData.ticker + pulseData.timestamp}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center gap-3"
                    >
                        <span className="text-xs font-black text-white font-mono">{pulseData.ticker}</span>
                        
                        {/* 신호 뱃지 */}
                        <div className={clsx(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border",
                            pulseData.signal === 'BUY' ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                            pulseData.signal === 'SELL' ? "bg-rose-500/10 text-rose-400 border-rose-500/20" :
                            "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        )}>
                            {pulseData.signal === 'BUY' ? <TrendingUp className="w-2.5 h-2.5" /> : 
                             pulseData.signal === 'SELL' ? <TrendingDown className="w-2.5 h-2.5" /> : 
                             <Minus className="w-2.5 h-2.5" />}
                            {pulseData.signal}
                        </div>

                        {/* 상세 지표 */}
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono tracking-tighter">
                            {pulseData.price !== null && <span>${pulseData.price.toFixed(2)}</span>}
                            {pulseData.rsi !== null && (
                                <>
                                    <span className="text-slate-600">|</span>
                                    <span>RSI: {pulseData.rsi}</span>
                                </>
                            )}
                            {pulseData.macd_diff !== null && (
                                <>
                                    <span className="text-slate-600">|</span>
                                    <span className="flex items-center gap-1">
                                        <Activity className="w-2.5 h-2.5" /> 
                                        {pulseData.macd_diff > 0 ? '+' : ''}{pulseData.macd_diff}
                                    </span>
                                </>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] text-slate-600 font-medium italic"
                    >
                        데이터 수신 대기 중...
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};
