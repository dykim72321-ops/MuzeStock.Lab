import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Clock, ShieldCheck, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export const SystemStatus: React.FC = () => {
    const { data: lastUpdate, isLoading } = useQuery({
        queryKey: ['system-last-update'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('daily_discovery')
                .select('updated_at')
                .order('updated_at', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data?.updated_at ? new Date(data.updated_at) : null;
        },
        refetchInterval: 60000,
    });

    return (
        <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-slate-900/30 backdrop-blur-md border border-white/5 rounded-2xl shadow-inner">
            {/* Pulse Indicator */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
                </div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">시스템 활성</span>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            {/* Last Heartbeat */}
            <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    최근 스캔: {isLoading ? '...' : (lastUpdate ? formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ko }) : '데이터 없음')}
                </span>
            </div>

            <div className="h-4 w-px bg-white/10 hidden md:block" />

            {/* AI Version */}
            <div className="hidden md:flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/20" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">AI 엔진 v2.1 (운영)</span>
            </div>

            <div className="h-4 w-px bg-white/10 hidden lg:block" />

            {/* Verification Status */}
            <div className="hidden lg:flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">자동 검증 시스템: 활성</span>
            </div>
        </div>
    );
};
