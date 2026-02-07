import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTechnicalAnalysis } from '../../services/pythonApiService';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import { TrendingUp, TrendingDown, Info, Activity } from 'lucide-react';
import clsx from 'clsx';

interface Props {
  ticker: string;
  period?: string;
  className?: string;
}

export const TechnicalAnalysisCard: React.FC<Props> = ({ 
  ticker, 
  period = '1mo',
  className 
}) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['technical-analysis', ticker, period],
    queryFn: () => fetchTechnicalAnalysis(ticker, period),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  if (isLoading) {
    return (
      <Card className={clsx("p-5 space-y-4", className)}>
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
        <Skeleton className="h-20 w-full" />
      </Card>
    );
  }

  if (isError) {
    return (
      <Card className={clsx("p-5 border-rose-500/20 bg-rose-500/5", className)}>
        <div className="flex items-center gap-2 text-rose-400 mb-2">
          <Info className="w-4 h-4" />
          <span className="font-bold">분석 실패</span>
        </div>
        <p className="text-xs text-rose-300/70">{(error as any)?.message || 'Python 서버 연결을 확인해주세요.'}</p>
      </Card>
    );
  }

  if (!data) return null;

  return (
    <Card className={clsx("p-5 flex flex-col gap-5 hover:border-slate-700 transition-colors", className)}>
      {/* 1. 상단: 현재가 및 시그널 뱃지 */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-slate-500 text-[10px] uppercase tracking-widest font-bold mb-1">
            Technical Analysis
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white font-mono">
              ${data.current_price.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-1">
          <Badge 
            variant={data.signal === 'BUY' ? 'success' : data.signal === 'SELL' ? 'warning' : 'neutral'}
            className="px-3 py-1.5 text-xs font-black tracking-tighter"
          >
            {data.signal === 'BUY' && <TrendingUp className="w-3 h-3 mr-1" />}
            {data.signal === 'SELL' && <TrendingDown className="w-3 h-3 mr-1" />}
            {data.signal} SIGNAL
          </Badge>
          <span className="text-[10px] text-slate-500 font-mono">{period} interval</span>
        </div>
      </div>

      {/* 2. 중단: 주요 지표 그리드 */}
      <div className="grid grid-cols-2 gap-3">
        <IndicatorBox 
          label="RSI (14)" 
          value={data.rsi_14?.toFixed(1) || 'N/A'} 
          subLabel={data.rsi_14 ? (data.rsi_14 > 70 ? 'Overbought' : data.rsi_14 < 30 ? 'Oversold' : 'Neutral') : ''}
          highlight={data.rsi_14 ? (data.rsi_14 > 70 ? 'red' : data.rsi_14 < 30 ? 'green' : 'none') : 'none'}
        />
        <IndicatorBox 
          label="MACD" 
          value={data.macd?.toFixed(3) || 'N/A'} 
          subLabel={data.macd && data.macd_signal ? (data.macd > data.macd_signal ? 'Bullish Cross' : 'Bearish Cross') : ''}
          highlight={data.macd && data.macd_signal ? (data.macd > data.macd_signal ? 'green' : 'red') : 'none'}
        />
        <IndicatorBox 
          label="SMA 20" 
          value={`$${data.sma_20?.toFixed(2) || 'N/A'}`} 
          subLabel="Short-term Trend"
          highlight={data.current_price > (data.sma_20 || 0) ? 'green' : 'red'}
        />
        <IndicatorBox 
          label="SMA 50" 
          value={`$${data.sma_50?.toFixed(2) || 'N/A'}`} 
          subLabel="Medium-term Support"
          highlight={data.current_price > (data.sma_50 || 0) ? 'green' : 'none'}
        />
      </div>

      {/* 3. 하단: 알고리즘 분석 (Reasoning) */}
      <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-tight">Quantitative Logic (Python Engine)</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {data.reasoning}
        </p>
      </div>
    </Card>
  );
};

interface BoxProps {
  label: string;
  value: string;
  subLabel?: string;
  highlight?: 'green' | 'red' | 'none';
}

const IndicatorBox = ({ label, value, subLabel, highlight = 'none' }: BoxProps) => (
  <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-800/50 hover:bg-slate-800/50 transition-colors">
    <div className="text-[9px] text-slate-500 uppercase font-black tracking-tighter mb-1">{label}</div>
    <div className={clsx(
      "text-sm font-bold font-mono",
      highlight === 'green' ? 'text-emerald-400' : highlight === 'red' ? 'text-rose-400' : 'text-white'
    )}>
      {value}
    </div>
    {subLabel && <div className="text-[9px] text-slate-500 mt-0.5 truncate">{subLabel}</div>}
  </div>
);
