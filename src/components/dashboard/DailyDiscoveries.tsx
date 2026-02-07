import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDiscoveries, type DiscoveryItem } from '../../services/pythonApiService';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';
import { Clock, Sparkles, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

interface DailyDiscoveriesProps {
  limit?: number;
  className?: string;
}

export const DailyDiscoveries: React.FC<DailyDiscoveriesProps> = ({ 
  limit = 10, 
  className 
}) => {
  const { data: discoveries, isLoading, error } = useQuery({
    queryKey: ['discoveries', limit],
    queryFn: () => fetchDiscoveries(limit),
    staleTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className={clsx("p-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
          <h3 className="text-lg font-bold text-white">오늘의 보석 발굴 중...</h3>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-800/50 rounded-lg animate-pulse" />
          ))}
        </div>
      </Card>
    );
  }

  if (error || !discoveries || discoveries.length === 0) {
    return (
      <Card className={clsx("p-6", className)}>
        <div className="flex items-center gap-2 text-slate-400">
          <AlertCircle className="w-5 h-5" />
          <span>발견된 종목이 없습니다. 수집을 실행해 주세요.</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={clsx("p-6", className)}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-400" />
          <h3 className="text-lg font-bold text-white">오늘의 보석</h3>
          <Badge variant="primary">{discoveries.length}개 발견</Badge>
        </div>
        <span className="text-xs text-slate-500 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          자동 갱신
        </span>
      </div>

      <div className="space-y-3">
        {discoveries.map((item, index) => (
          <DiscoveryCard key={item.id} item={item} rank={index + 1} />
        ))}
      </div>
    </Card>
  );
};

const DiscoveryCard: React.FC<{ item: DiscoveryItem; rank: number }> = ({ item, rank }) => {
  const changeValue = parseFloat(item.change.replace('%', ''));
  const isPositive = changeValue >= 0;

  return (
    <div className="flex items-center gap-4 p-3.5 bg-white/5 rounded-xl border border-white/5 hover:border-white/10 hover:bg-white/10 transition-all group">
      {/* Rank Badge */}
      <div className={clsx(
        "flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold flex-shrink-0",
        rank === 1 && "bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/20",
        rank === 2 && "bg-gradient-to-br from-slate-400 to-slate-500 text-white shadow-lg shadow-slate-500/20",
        rank === 3 && "bg-gradient-to-br from-amber-700 to-amber-800 text-white shadow-lg shadow-amber-800/20",
        rank > 3 && "bg-slate-800 text-slate-400 ring-1 ring-white/10"
      )}>
        #{rank}
      </div>

      {/* Stock Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Link 
            to={`/analysis/${item.ticker}`}
            className="font-bold text-white hover:text-indigo-400 transition-colors font-mono text-sm tracking-tight"
          >
            {item.ticker}
          </Link>
          <span className="text-[10px] text-slate-500 uppercase tracking-tighter truncate">{item.sector}</span>
        </div>
        <p className="text-[11px] text-slate-400 truncate opacity-70">
          {item.ai_summary?.split('\n')[0] || 'AI Analysis in progress...'}
        </p>
      </div>

      {/* Price & Change - 고정 너비 확보 */}
      <div className="text-right flex-shrink-0 min-w-[70px]">
        <div className="text-sm font-mono font-bold text-white">${item.price.toFixed(2)}</div>
        <div className={clsx(
          "text-[10px] font-bold flex items-center justify-end gap-1",
          isPositive ? "text-emerald-400" : "text-rose-400"
        )}>
          {isPositive ? '+' : ''}{item.change}
        </div>
      </div>

      {/* DNA Score - 고정 너비 확보 */}
      <div className={clsx(
        "flex flex-col items-center justify-center px-2 py-1 rounded-lg flex-shrink-0 min-w-[50px] border",
        item.dna_score >= 80 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
        item.dna_score >= 60 ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : 
        "bg-slate-800/50 text-slate-500 border-slate-700/50"
      )}>
        <span className="text-[8px] uppercase font-bold tracking-tighter opacity-60">DNA</span>
        <span className="text-xs font-mono font-bold">{item.dna_score}</span>
      </div>
    </div>
  );
};
