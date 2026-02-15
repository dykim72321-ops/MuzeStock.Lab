import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { fetchDiscoveries, fetchBacktestData, type DiscoveryItem } from '../../services/pythonApiService';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Link } from 'react-router-dom';
import { Zap, TrendingUp, ArrowUpDown, Loader2, Target, List, Verified } from 'lucide-react';
import clsx from 'clsx';
import { AddToWatchlistBtn } from '../ui/AddToWatchlistBtn';

interface DailyDiscoveriesProps {
  limit?: number;
  className?: string;
}

type SortMode = 'updated_at' | 'performance';

export const DailyDiscoveries: React.FC<DailyDiscoveriesProps> = ({
  limit = 10,
  className
}) => {
  const [sortMode, setSortMode] = useState<SortMode>('performance');

  const { data: discoveries, isLoading, error } = useQuery({
    queryKey: ['discoveries', limit, sortMode],
    queryFn: () => fetchDiscoveries(limit, sortMode),
    staleTime: 5 * 60 * 1000, // 5분
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <Card className={clsx("p-6", className)}>
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-bold text-white">최적의 투자 기회 탐색 중...</h3>
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
          <span>현재 분석된 고효율 종목이 없습니다. 새로운 스캔을 시작해 주세요.</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className={clsx("p-6 shadow-2xl border-slate-800", className)}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-white uppercase tracking-tight">AI 정밀 분석 결과 (Top Picks)</h3>
          <Badge variant="neutral" className="bg-slate-800 text-slate-400 border-slate-700 font-mono tracking-tighter">
            {discoveries.length} GEMS FOUND
          </Badge>
        </div>
      </div>

      <div className="mb-8">
        <TopPickHero item={discoveries[0]} />
      </div>

      <div className="flex items-center justify-between mb-4 mt-8 pt-6 border-t border-slate-800">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
          <List className="w-3.5 h-3.5" />
          전체 발굴 리스트
        </h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortMode(sortMode === 'updated_at' ? 'performance' : 'updated_at')}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all shadow-sm uppercase tracking-wider",
              sortMode === 'performance'
                ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700"
            )}
          >
            <ArrowUpDown className="w-3 h-3" />
            {sortMode === 'performance' ? 'BY Performance' : 'BY RECENT'}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {discoveries.map((item, index) => (
          <DiscoveryCard key={item.id} item={item} rank={index + 1} />
        ))}
      </div>
    </Card>
  );
};

const TopPickHero: React.FC<{ item: DiscoveryItem }> = ({ item }) => {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-905 border border-indigo-500/30 p-6 shadow-2xl shadow-indigo-500/10 group">
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
        <Target className="w-24 h-24 text-indigo-400" />
      </div>

      <div className="flex flex-col gap-5 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col gap-1">
              <Badge variant="primary" className="bg-indigo-500 text-white border-none shadow-lg shadow-indigo-500/40 py-1 flex items-center gap-1 w-fit">
                <Verified className="w-3 h-3" />
                SIMULATOR'S CHOICE
              </Badge>
            </div>
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest font-mono opacity-60">Math Verified</span>
          </div>
          <AddToWatchlistBtn ticker={item.ticker} variant="icon" className="bg-white/5 border-white/10 hover:bg-white/10" />
        </div>

        <div className="flex items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-5xl font-black text-white font-mono tracking-tighter group-hover:text-indigo-400 transition-colors">{item.ticker}</h2>
              <div className="px-2 py-1 rounded bg-slate-800/80 text-slate-400 text-[10px] font-bold uppercase border border-white/5">{item.sector}</div>
            </div>
            <p className="text-sm text-slate-400 font-medium line-clamp-1 opacity-80 italic max-w-md">
              "데이터 시뮬레이션 결과, 시장 지수 대비 <span className="text-emerald-400 font-bold">압도적인 수익 방어율</span>을 증명했습니다."
            </p>
          </div>

          <div className="text-right flex flex-col items-end">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">1Y STRATEGY RETURN</div>
            <div className={clsx(
              "text-4xl font-black font-mono leading-none tracking-tighter",
              (item.backtest_return || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {item.backtest_return !== null ? `${item.backtest_return >= 0 ? '+' : ''}${item.backtest_return.toFixed(1)}%` : 'TBD'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="bg-white/5 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">DNA Score</div>
            <div className="text-2xl font-black text-white font-mono">{item.dna_score}</div>
          </div>
          <div className="bg-white/5 rounded-xl p-4 border border-white/5 backdrop-blur-sm">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Live Price</div>
            <div className="text-2xl font-black text-white font-mono">${item.price.toFixed(2)}</div>
          </div>
          <Link
            to="/simulator"
            className="group relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 rounded-xl p-4 flex flex-col items-center justify-center transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
          >
            <div className="relative z-10 text-[10px] text-indigo-100 font-black uppercase tracking-widest mb-1">Verify Math</div>
            <TrendingUp className="relative z-10 w-6 h-6 text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
          </Link>
        </div>
      </div>
    </div>
  );
};

const DiscoveryCard: React.FC<{ item: DiscoveryItem; rank: number }> = ({ item, rank }) => {
  const [backtestResult, setBacktestResult] = useState<number | null>(null);

  const changeValue = parseFloat(item.change.replace('%', ''));
  const isPositive = changeValue >= 0;

  const backtestMutation = useMutation({
    mutationFn: () => fetchBacktestData(item.ticker, '1y'),
    onSuccess: (data) => {
      if (data && data.total_return_pct !== undefined) {
        setBacktestResult(data.total_return_pct);
      }
    },
  });

  const handleBacktest = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    backtestMutation.mutate();
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all group relative overflow-hidden">
      {/* Rank Badge */}
      <div className={clsx(
        "flex items-center justify-center w-8 h-8 rounded-lg text-[10px] font-black flex-shrink-0 font-mono border",
        rank === 1 && "bg-amber-500/10 text-amber-500 border-amber-500/30",
        rank === 2 && "bg-slate-400/10 text-slate-400 border-slate-400/30",
        rank === 3 && "bg-amber-700/10 text-amber-700 border-amber-700/30",
        rank > 3 && "bg-slate-800/10 text-slate-500 border-white/5"
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
          <span className="text-[10px] text-slate-500 uppercase tracking-tighter truncate font-medium opacity-60 group-hover:opacity-100">{item.sector}</span>
        </div>
        <p className="text-[11px] text-slate-500 truncate opacity-70 italic font-medium">
          {item.ai_summary?.split('\n')[0] || 'AI Analysis in progress...'}
        </p>
      </div>

      {/* Inline Actions */}
      <div className="flex items-center gap-2">
        {/* One-Click Backtest Button */}
        <button
          onClick={handleBacktest}
          disabled={backtestMutation.isPending}
          className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black transition-all flex-shrink-0 uppercase tracking-wider",
            backtestMutation.isPending
              ? "bg-slate-700 text-slate-400 cursor-wait"
              : backtestResult !== null
                ? backtestResult >= 0
                  ? "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30"
                  : "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/30"
                : "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 border border-white/5"
          )}
        >
          {backtestMutation.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : backtestResult !== null ? (
            <>
              <TrendingUp className="w-3 h-3" />
              {backtestResult >= 0 ? '+' : ''}{backtestResult.toFixed(0)}%
            </>
          ) : (
            <>
              <Zap className="w-3 h-3 opacity-50 group-hover:opacity-100" />
              BACKTEST
            </>
          )}
        </button>

        {/* Math Badge from DB */}
        {item.backtest_return !== null && (
          <div className={clsx(
            "flex flex-col items-center justify-center px-1.5 py-1 rounded-lg flex-shrink-0 min-w-[45px] border",
            item.backtest_return >= 10 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
              item.backtest_return >= 0 ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" :
                "bg-rose-500/10 text-rose-400 border-rose-500/20"
          )}>
            <span className="text-[7px] uppercase font-black tracking-tighter opacity-50">MATH</span>
            <span className="text-[11px] font-mono font-bold leading-none">
              {item.backtest_return >= 0 ? '+' : ''}{item.backtest_return.toFixed(0)}%
            </span>
          </div>
        )}

        {/* DNA/Price Area */}
        <div className="flex flex-col items-end min-w-[70px]">
          <div className="text-sm font-black font-mono text-white leading-tight">${item.price.toFixed(2)}</div>
          <div className={clsx(
            "text-[10px] font-bold font-mono",
            isPositive ? "text-emerald-400" : "text-rose-400"
          )}>
            {isPositive ? '+' : ''}{item.change}
          </div>
        </div>

        {/* Add to Watchlist Button */}
        <AddToWatchlistBtn
          ticker={item.ticker}
          variant="icon"
          className="bg-slate-800/50 border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/10"
        />
      </div>
    </div>
  );
};
