import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { TrendingUp, TrendingDown, Clock, Activity } from 'lucide-react';
import clsx from 'clsx';
import { formatDistanceToNow } from 'date-fns';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
);

interface Position {
    id: string;
    ticker: string;
    status: 'OPEN' | 'CLOSED';
    entry_price: number;
    current_price: number;
    pnl_percent: number;
    created_at: string;
}

export const AlphaFundPositions = () => {
    const [positions, setPositions] = useState<Position[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPositions = async () => {
            const { data, error } = await supabase
                .from('paper_portfolio')
                .select('*')
                .eq('status', 'OPEN')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching Alpha Fund positions:', error);
            } else if (data) {
                setPositions(data);
            }
            setLoading(false);
        };

        fetchPositions();
    }, []);

    if (loading) {
        return (
            <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 mt-8 animate-pulse">
                <div className="h-8 w-48 bg-white/5 rounded mx-auto mb-8" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white/5 rounded-2xl w-full" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 mt-8">
            <div className="flex items-center gap-3 mb-8 border-b border-white/5 pb-4">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Activity className="w-5 h-5 text-indigo-400" />
                </div>
                <h2 className="text-xl font-black text-white tracking-tight uppercase">Active Positions</h2>
                <div className="ml-auto flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{positions.length} Assets Online</span>
                </div>
            </div>

            {positions.length === 0 ? (
                <div className="text-center py-12">
                     <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                        <Activity className="w-6 h-6 text-slate-500 opacity-50" />
                     </div>
                    <p className="text-slate-400 font-medium">현재 진행 중인 투자 포지션이 없습니다.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 text-slate-500 text-[10px] uppercase font-black tracking-widest">
                                <th className="pb-4 pl-4">Asset</th>
                                <th className="pb-4">Entry Strategy</th>
                                <th className="pb-4">Current Value</th>
                                <th className="pb-4">Live P&L</th>
                                <th className="pb-4 pr-4 text-right">Duration</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {positions.map((pos) => (
                                <tr key={pos.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="py-4 pl-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-indigo-400">
                                                {pos.ticker.charAt(0)}
                                            </div>
                                            <span className="font-black text-white text-lg tracking-tight group-hover:text-indigo-400 transition-colors">
                                                {pos.ticker}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 font-mono text-slate-300">
                                        ${Number(pos.entry_price).toFixed(2)}
                                    </td>
                                    <td className="py-4 font-mono font-bold text-white">
                                        ${Number(pos.current_price).toFixed(2)}
                                    </td>
                                    <td className="py-4">
                                        <div className={clsx(
                                            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-black font-mono border",
                                            pos.pnl_percent >= 0 
                                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" 
                                                : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                        )}>
                                            {pos.pnl_percent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                                            {pos.pnl_percent >= 0 ? '+' : ''}{Number(pos.pnl_percent).toFixed(2)}%
                                        </div>
                                    </td>
                                    <td className="py-4 pr-4 flex items-center justify-end gap-2 text-slate-500 text-sm font-medium">
                                        <Clock className="w-4 h-4 opacity-50" />
                                        {formatDistanceToNow(new Date(pos.created_at), { addSuffix: false })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
