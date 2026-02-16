import { motion, AnimatePresence } from 'framer-motion';
import { Zap, TrendingUp, TrendingDown } from 'lucide-react';
import { useMarketPulse } from '../../hooks/useMarketPulse';
import clsx from 'clsx';

export const SignalTicker = () => {
    const lastSignal = useMarketPulse();

    return (
        <div className="h-8 overflow-hidden bg-indigo-500/5 rounded-full border border-indigo-500/10 px-4 flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
                <Zap className="w-3 h-3 text-indigo-400 fill-indigo-400/20 animate-pulse" />
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Live Signals:</span>
            </div>

            <AnimatePresence mode="wait">
                {lastSignal ? (
                    <motion.div
                        key={lastSignal.ticker + lastSignal.value}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        className="flex items-center gap-3"
                    >
                        <span className="text-xs font-black text-white font-mono">{lastSignal.ticker}</span>
                        <div className={clsx(
                            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold",
                            lastSignal.signal === 'OVERSOLD' ? "bg-emerald-500/20 text-emerald-400" :
                                lastSignal.signal === 'OVERBOUGHT' ? "bg-rose-500/20 text-rose-400" :
                                    "bg-white/5 text-slate-400"
                        )}>
                            {lastSignal.signal === 'OVERSOLD' ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                            RSI: {lastSignal.value}
                        </div>
                    </motion.div>
                ) : (
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-[10px] text-slate-600 font-medium italic"
                    >
                        Waiting for market pulse...
                    </motion.p>
                )}
            </AnimatePresence>
        </div>
    );
};
