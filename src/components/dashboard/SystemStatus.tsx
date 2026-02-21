import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { Clock, ShieldCheck, Zap, Wifi, WifiOff } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';
import { usePulseSocket } from '../../hooks/usePulseSocket';
import clsx from 'clsx';

export const SystemStatus: React.FC = () => {
    // WebSocket 연결 상태
    const { isConnected } = usePulseSocket();

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
            {/* WebSocket Pulse Indicator */}
            <div className="flex items-center gap-2">
                <div className="relative">
                    <div className={clsx(
                        "w-2 h-2 rounded-full",
                        isConnected ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    )} />
                    {isConnected && (
                        <div className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-75" />
                    )}
                </div>
                <div className="flex items-center gap-1">
                    {isConnected ? (
                        <Wifi className="w-3 h-3 text-emerald-400" />
                    ) : (
                        <WifiOff className="w-3 h-3 text-rose-500" />
                    )}
                    <span className={clsx(
                        "text-[10px] font-black uppercase tracking-widest",
                        isConnected ? "text-emerald-400" : "text-rose-500"
                    )}>
                        {isConnected ? "엔진 연결됨" : "엔진 오프라인"}
                    </span>
                </div>
            </div>

            <div className="h-4 w-px bg-white/10 hidden sm:block" />

            {/* Last Heartbeat (DB) */}
            <div className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">
                    DB 스캔: {isLoading ? '...' : (lastUpdate ? formatDistanceToNow(lastUpdate, { addSuffix: true, locale: ko }) : '데이터 없음')}
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
