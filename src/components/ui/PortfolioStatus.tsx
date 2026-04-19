import { useState, useEffect, useCallback } from 'react';
import { Briefcase, TrendingUp, TrendingDown, CheckCircle2, History, Activity, DollarSign, XCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchPaperAccount,
  fetchPaperPositions,
  fetchPaperHistory,
  sellPaperPosition,
} from '../../services/pythonApiService';

interface PaperPosition {
  id: string;
  ticker: string;
  status: string;
  entry_price: number;
  current_price: number;
  highest_price: number;
  ts_threshold: number;
  units: number;
  is_scaled_out: boolean;
  weight: number;
}

interface PaperTrade {
  id: string;
  ticker: string;
  type: string;
  filled_avg_price: number;
  pnl_pct: number;
  profit_amt: number;
  created_at: string;
}

interface PaperAccount {
  cash_available: number;
  total_assets: number;
  invested_capital?: number;
}

export const PortfolioStatus = () => {
  const [account, setAccount] = useState<PaperAccount | null>(null);
  const [positions, setPositions] = useState<PaperPosition[]>([]);
  const [history, setHistory] = useState<PaperTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [sellingTicker, setSellingTicker] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [acc, pos, hist] = await Promise.all([
        fetchPaperAccount(),
        fetchPaperPositions(),
        fetchPaperHistory(),
      ]);
      if (acc) setAccount(acc);
      setPositions(Array.isArray(pos) ? pos : []);
      setHistory(Array.isArray(hist) ? hist : []);
    } catch (err) {
      console.error('Portfolio fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const timer = setInterval(fetchAll, 30000);
    return () => clearInterval(timer);
  }, [fetchAll]);

  const handleSell = (pos: PaperPosition) => {
    const pnlPct = pos.current_price && pos.entry_price
      ? ((pos.current_price / pos.entry_price) - 1) * 100
      : 0;
    const isProfit = pnlPct >= 0;

    toast(`매도 확인 — ${pos.ticker}`, {
      description: `현재가: $${pos.current_price?.toFixed(2) ?? '-'} | 예상 손익: ${isProfit ? '+' : ''}${pnlPct.toFixed(2)}%`,
      action: {
        label: '매도 실행',
        onClick: () => executeSell(pos.ticker),
      },
      cancel: {
        label: '취소',
        onClick: () => {},
      },
      icon: isProfit ? '🚀' : '⚠️',
    });
  };

  const executeSell = async (ticker: string) => {
    setSellingTicker(ticker);
    const toastId = toast.loading(`[${ticker}] 매도 처리 중...`);
    try {
      const result = await sellPaperPosition(ticker);
      toast.success(`[${ticker}] 매도 완료`, {
        description: `청산가: $${result.exit_price} | 수익률: ${result.pnl_pct > 0 ? '+' : ''}${result.pnl_pct}%`,
        id: toastId,
      });
      await fetchAll();
    } catch (err: any) {
      toast.error(`[${ticker}] 매도 실패`, {
        description: err.message || '백엔드 연결을 확인하세요.',
        id: toastId,
      });
    } finally {
      setSellingTicker(null);
    }
  };

  const totalInvested = positions.reduce(
    (sum, p) => sum + (p.current_price ?? p.entry_price) * p.units,
    0
  );
  const totalEquity = (account?.cash_available ?? 0) + totalInvested;

  return (
    <div className="mt-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-900 rounded-xl">
            <Briefcase className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              Virtual Portfolio
              <span className="text-[10px] font-black tracking-widest bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full uppercase">
                Live Paper Trading
              </span>
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              시스템 시그널 기반 자동 매매 (모의투자)
            </p>
          </div>
        </div>
        <button
          onClick={fetchAll}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors disabled:opacity-50"
        >
          <Activity className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'LOADING...' : 'REFRESH'}
        </button>
      </div>

      {/* Account Summary */}
      {account && (
        <div className="grid grid-cols-3 divide-x divide-slate-100 border-b border-slate-100 bg-slate-50/50">
          <div className="p-4 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Cash Available
            </p>
            <p className="text-lg font-black text-slate-900 tabular-nums">
              ${account.cash_available?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-4 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Invested
            </p>
            <p className="text-lg font-black text-blue-600 tabular-nums">
              ${totalInvested.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="p-4 text-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
              Total Equity
            </p>
            <p className="text-lg font-black text-emerald-600 tabular-nums">
              ${totalEquity.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
        {/* Active Positions */}
        <div className="p-6 bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-400 tracking-[0.15em] mb-4 flex items-center gap-2 uppercase">
            <TrendingUp className="w-4 h-4" /> Active Positions ({positions.length})
          </h3>

          {loading ? (
            <div className="flex items-center justify-center p-8 bg-white rounded-xl border border-slate-100 shadow-sm animate-pulse">
              <Activity className="w-6 h-6 text-slate-300" />
            </div>
          ) : positions.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-100 border-dashed text-slate-400 shadow-sm">
              <CheckCircle2 className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider">No Active Positions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {positions.map((pos) => {
                const pnlPct = pos.current_price && pos.entry_price
                  ? ((pos.current_price / pos.entry_price) - 1) * 100
                  : 0;
                const isProfit = pnlPct >= 0;
                const isSelling = sellingTicker === pos.ticker;

                return (
                  <div
                    key={pos.ticker}
                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900">{pos.ticker}</span>
                        {pos.is_scaled_out && (
                          <span className="text-[9px] font-black bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded uppercase tracking-wider">
                            Scale-Out
                          </span>
                        )}
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider ${
                          pos.status === 'HOLD' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {pos.status}
                        </span>
                      </div>
                      <button
                        onClick={() => handleSell(pos)}
                        disabled={isSelling}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg text-[11px] font-black uppercase tracking-wide transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                      >
                        {isSelling ? (
                          <Activity className="w-3 h-3 animate-spin" />
                        ) : (
                          <XCircle className="w-3 h-3" />
                        )}
                        {isSelling ? 'SELLING...' : '매도'}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center mt-3">
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Entry</p>
                        <p className="text-xs font-black text-slate-700 tabular-nums">${pos.entry_price?.toFixed(2)}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Current</p>
                        <p className="text-xs font-black text-slate-700 tabular-nums">${pos.current_price?.toFixed(2) ?? '-'}</p>
                      </div>
                      <div className={`rounded-lg p-2 ${isProfit ? 'bg-emerald-50' : 'bg-rose-50'}`}>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">PnL</p>
                        <p className={`text-xs font-black tabular-nums flex items-center justify-center gap-0.5 ${isProfit ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isProfit ? <TrendingUp className="w-2.5 h-2.5" /> : <TrendingDown className="w-2.5 h-2.5" />}
                          {isProfit ? '+' : ''}{pnlPct.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      TS: ${pos.ts_threshold?.toFixed(2)} | High: ${pos.highest_price?.toFixed(2)} | {pos.units?.toFixed(2)} shares
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Trade History */}
        <div className="p-6 bg-slate-50/50">
          <h3 className="text-xs font-black text-slate-400 tracking-[0.15em] mb-4 flex items-center gap-2 uppercase">
            <History className="w-4 h-4" /> Recent Trades
          </h3>

          {loading ? (
            <div className="flex items-center justify-center p-8 bg-white rounded-xl border border-slate-100 shadow-sm animate-pulse">
              <Activity className="w-6 h-6 text-slate-300" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl border border-slate-100 border-dashed text-slate-400 shadow-sm">
              <DollarSign className="w-8 h-8 opacity-20 mb-2" />
              <p className="text-xs font-bold uppercase tracking-wider">No Trade History</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((trade) => {
                const isWin = trade.pnl_pct > 0;
                return (
                  <div
                    key={trade.id}
                    className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between transition-all hover:border-slate-200 hover:shadow-md"
                  >
                    <div>
                      <span className="text-base font-black text-slate-900">{trade.ticker}</span>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
                        {trade.type || 'TRAILING STOP'}
                        {trade.profit_amt !== undefined && (
                          <span className={`ml-2 ${isWin ? 'text-emerald-600' : 'text-rose-500'}`}>
                            {isWin ? '+' : ''}${trade.profit_amt?.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-sm font-black tabular-nums ${isWin ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {isWin ? '+' : ''}{trade.pnl_pct?.toFixed(2)}%
                      </span>
                      <p className="text-[10px] font-bold text-slate-400 tabular-nums">
                        ${trade.filled_avg_price?.toFixed(2)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
