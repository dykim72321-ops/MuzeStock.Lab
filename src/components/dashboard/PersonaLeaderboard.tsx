import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Trophy, Target } from 'lucide-react';
import clsx from 'clsx';

interface PersonaStats {
    persona_name: string;
    win_rate: number;
    avg_roi: number;
    total_predictions: number;
}

export const PersonaLeaderboard: React.FC = () => {
    const { data: stats, isLoading } = useQuery<PersonaStats[]>({
        queryKey: ['persona-performance'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('persona_performance')
                .select('*')
                .order('win_rate', { ascending: false });

            if (error) throw error;
            return data || [];
        },
        staleTime: 60000,
    });

    if (isLoading) return <div className="h-48 bg-slate-800/20 rounded-2xl animate-pulse" />;
    if (!stats || stats.length === 0) return null;

    return (
        <Card className="p-6 bg-slate-900/40 border-slate-800 shadow-xl overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                <Trophy className="w-20 h-20 text-indigo-400" />
            </div>

            <div className="flex items-center gap-2 mb-6 relative z-10">
                <h3 className="text-lg font-black text-white uppercase tracking-tighter">AI Persona Leaderboard</h3>
                <Badge variant="primary" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 text-[9px]">
                    REAL AUTHENTICITY
                </Badge>
            </div>

            <div className="space-y-4 relative z-10">
                {stats.map((persona, index) => (
                    <div key={persona.persona_name} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-indigo-500/20 transition-all">
                        <div className="flex items-center gap-3">
                            <div className={clsx(
                                "w-6 h-6 rounded flex items-center justify-center text-[10px] font-black",
                                index === 0 ? "bg-amber-500 text-black" : "bg-slate-800 text-slate-400"
                            )}>
                                {index + 1}
                            </div>
                            <div>
                                <p className="text-xs font-bold text-white uppercase tracking-tight">{persona.persona_name.replace(/ \(.*\)/, '')}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-[9px] text-slate-500 flex items-center gap-1 font-mono">
                                        <Target className="w-2.5 h-2.5" /> {persona.total_predictions} Predictions
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-right">
                            <div className="text-sm font-black text-emerald-400 font-mono">{((persona.win_rate || 0) * 100).toFixed(1)}% HIT</div>
                            <div className={clsx(
                                "text-[10px] font-bold font-mono",
                                (persona.avg_roi || 0) >= 0 ? "text-indigo-400" : "text-rose-400"
                            )}>
                                {(persona.avg_roi || 0) >= 0 ? '+' : ''}{(persona.avg_roi || 0).toFixed(2)}% ROI
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
};
