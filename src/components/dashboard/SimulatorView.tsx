import { useState } from 'react';
import type { ChangeEvent } from 'react';
import { pythonService } from '../../services/pythonService';
import { BacktestChart } from './BacktestChart';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { 
  History, 
  TrendingUp, 
  TrendingDown, 
  Settings2, 
  Loader2,
  Zap
} from 'lucide-react';
import clsx from 'clsx';
import { AddToWatchlistBtn } from '../ui/AddToWatchlistBtn';

export const SimulatorView = () => {
  const [ticker, setTicker] = useState('AAPL');
  const [period, setPeriod] = useState('1y');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRunBacktest = async () => {
    if (!ticker) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await pythonService.backtestStock(ticker.toUpperCase(), period, initialCapital);
      setResult(data);
    } catch (err) {
      console.error('Backtest error:', err);
      setError('백테스팅 실행 중 오류가 발생했습니다. 티커를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <History className="w-8 h-8 text-indigo-500" />
            타임머신 시뮬레이터
          </h1>
          <div className="flex items-center gap-2">
            <p className="text-slate-400">과거 시장 데이터와 수학적 알고리즘을 통한 수익률 검증</p>
            <Badge variant="neutral" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
              100% Math Engine (Zero AI Intervention)
            </Badge>
          </div>
        </div>
      </div>

      <Card className="p-6 border-slate-700 bg-slate-900/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">주식 티커</label>
            <input 
              value={ticker} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setTicker(e.target.value)} 
              placeholder="예: TSLA, AAPL"
              className="w-full h-10 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">분석 기간</label>
            <select 
              value={period} 
              onChange={(e: ChangeEvent<HTMLSelectElement>) => setPeriod(e.target.value)}
              className="w-full h-10 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="1mo">1개월</option>
              <option value="6mo">6개월</option>
              <option value="1y">1년</option>
              <option value="2y">2년</option>
              <option value="5y">5년</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">초기 자본 ($)</label>
            <input 
              type="number"
              value={initialCapital} 
              onChange={(e: ChangeEvent<HTMLInputElement>) => setInitialCapital(Number(e.target.value))} 
              className="w-full h-10 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>
          <button 
            onClick={handleRunBacktest} 
            disabled={loading}
            className="w-full h-10 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            시뮬레이션 실행
          </button>
        </div>
      </Card>

      {error && (
        <Card className="p-4 border-rose-500/20 bg-rose-500/5 text-rose-400 text-sm italic">
          {error}
        </Card>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-500" />
                  수익률 시뮬레이션 결과
                </h3>
                <div className="flex items-center gap-2">
                  <AddToWatchlistBtn ticker={result.ticker} variant="full" />
                  <Badge variant="primary" className="font-mono">
                    {result.ticker} / {result.period}
                  </Badge>
                </div>
              </div>
              <BacktestChart data={result.chart_data} />
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6 border-slate-700 bg-slate-900/30">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">성과 요약</h3>
              
              <div className="space-y-6">
                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">전략 수익률</p>
                  <div className={clsx(
                    "text-3xl font-black font-mono",
                    result.total_return_pct >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {result.total_return_pct >= 0 ? '+' : ''}{result.total_return_pct}%
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                  <p className="text-xs text-slate-500 mb-1">Buy & Hold (시장)</p>
                  <div className={clsx(
                    "text-2xl font-bold font-mono",
                    result.benchmark_return_pct >= 0 ? "text-slate-200" : "text-rose-400"
                  )}>
                    {result.benchmark_return_pct >= 0 ? '+' : ''}{result.benchmark_return_pct}%
                  </div>
                </div>

                <div className={clsx(
                  "p-4 rounded-xl border flex items-center justify-between",
                  result.outperformance >= 0 
                    ? "bg-indigo-500/10 border-indigo-500/30" 
                    : "bg-slate-800/50 border-slate-700"
                )}>
                  <div>
                    <p className="text-xs text-slate-500 mb-1">초과 수익률</p>
                    <div className={clsx(
                      "text-xl font-bold font-mono",
                      result.outperformance >= 0 ? "text-indigo-400" : "text-slate-400"
                    )}>
                      {result.outperformance >= 0 ? '+' : ''}{result.outperformance}%
                    </div>
                  </div>
                  <div className={clsx(
                    "p-2 rounded-full",
                    result.outperformance >= 0 ? "bg-indigo-500/20" : "bg-slate-700"
                  )}>
                    {result.outperformance >= 0 ? (
                      <TrendingUp className="w-5 h-5 text-indigo-400" />
                    ) : (
                      <TrendingDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-5 border-indigo-500/20 bg-indigo-500/5">
              <div className="flex gap-3">
                <Settings2 className="w-5 h-5 text-indigo-400 shrink-0" />
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-white uppercase">전략 매커니즘</h4>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    본 전략은 RSI(상대강도지수)를 기반으로 작동합니다. 
                    <span className="text-emerald-400 font-bold ml-1">RSI가 30 미만</span>일 때 과매도로 판단하여 전액 매수하며, 
                    <span className="text-rose-400 font-bold ml-1">RSI가 70 초과</span>일 때 과매수 단계로 판단하여 전액 매도하고 현금을 보유합니다.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
