import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import AnimatedNumber from '../components/ui/AnimatedNumber';

import {
  Zap, ShieldCheck, TrendingUp, History, Info,
  PieChart, ShieldAlert, DollarSign,
  ArrowRightLeft, Target, Loader2
} from 'lucide-react';
import clsx from 'clsx';
import { PortfolioDashboard } from '../components/dashboard/PortfolioDashboard';
import { PersonaLeaderboard } from '../components/dashboard/PersonaLeaderboard';
import { AlphaFundPositions } from '../components/dashboard/AlphaFundPositions';

// ─────────────────────────────────────────────────────────────────
// v4 엔진 로직을 반영한 데이터 타입 및 목업
// ─────────────────────────────────────────────────────────────────
interface Position {
  ticker: string;
  status: string;
  weight: number;
  entryPrice: number;
  currentPrice: number;
  tsThreshold: number;
  pnlPct: number;
}

interface PortfolioData {
  totalAssets: number;
  cashAvailable: number;
  investedCapital: number;
  dailyPnL: number;
  dailyPnLPct: number;
  positions: Position[];
}

const MOCK_PORTFOLIO: PortfolioData = {
  totalAssets: 125430.50,
  cashAvailable: 85292.74,   // 3/4 켈리: 현금 비중 높음 (SWAN의 핵심)
  investedCapital: 40137.76,
  dailyPnL: 342.15,
  dailyPnLPct: 0.27,
  positions: [
    {
      ticker: 'NVDA',
      status: 'SCALE_OUT',  // RSI 60 돌파 → 50% 분할 익절 완료
      weight: 0.08,
      entryPrice: 850.20,
      currentPrice: 942.50,
      tsThreshold: 905.00,  // 수익보전 룰: 진입가 +1% 상향 방어선
      pnlPct: 10.85,
    },
    {
      ticker: 'TSLA',
      status: 'HOLD',
      weight: 0.12,
      entryPrice: 175.40,
      currentPrice: 182.10,
      tsThreshold: 168.00,  // 초기 트레일링 스탑선 (최고가 대비 -10%)
      pnlPct: 3.82,
    },
    {
      ticker: 'AAPL',
      status: 'HOLD',
      weight: 0.12,
      entryPrice: 168.50,
      currentPrice: 165.20,
      tsThreshold: 151.65,  // 최고가 대비 -10% 하락선
      pnlPct: -1.95,
    },
  ],
};

// ─────────────────────────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────────────────────────
const StatusBadge = ({ status }: { status: string }) =>
  status === 'SCALE_OUT' ? (
    <div className="px-2 py-1 rounded-md bg-orange-50 border border-orange-100 flex items-center gap-1.5 shrink-0 shadow-sm">
      <ArrowRightLeft className="w-3 h-3 text-orange-600" />
      <span className="text-[10px] font-black text-orange-600 whitespace-nowrap uppercase tracking-wider">Scale Out</span>
    </div>
  ) : (
    <div className="px-2 py-1 rounded-md bg-blue-50 border border-blue-100 flex items-center gap-1.5 shrink-0 shadow-sm">
      <TrendingUp className="w-3 h-3 text-[#0176d3]" />
      <span className="text-[10px] font-black text-[#0176d3] whitespace-nowrap uppercase tracking-wider">Holding</span>
    </div>
  );

// ─────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────
export const AlphaFundView = () => {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    const fetchPortfolio = async () => {
      try {
        const response = await fetch('/py-api/api/portfolio');
        if (!response.ok) throw new Error('Failed to fetch portfolio');
        const json = await response.json();
        setData(json);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolio();
    const timer = setInterval(fetchPortfolio, 5000);
    return () => clearInterval(timer);
  }, []);

  if (loading && !data) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#0176d3] animate-spin" />
        <p className="text-slate-400 font-black text-xs tracking-[0.2em] uppercase">Securing Alpha Shield...</p>
      </div>
    </div>
  );

  if (error && !data) return (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-rose-600 font-bold p-8 text-center">
      ERROR_COMM_FAILED: {error}
    </div>
  );

  const { totalAssets, cashAvailable, investedCapital, dailyPnL, dailyPnLPct, positions } = data || MOCK_PORTFOLIO;


  const investedPct = (investedCapital / totalAssets) * 100;
  const cashPct = (cashAvailable / totalAssets) * 100;

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12 bg-slate-50 min-h-screen">

      {/* ── 1. HEADER ─────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-1 bg-amber-400/20 rounded-2xl blur-lg group-hover:bg-amber-400/30 transition-all duration-700" />
            <div className="relative p-4 bg-white border border-amber-200 rounded-2xl shadow-sm">
              <Zap className="w-8 h-8 text-amber-500 fill-amber-500/10" />
            </div>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[9px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-black tracking-widest uppercase shadow-sm">
                System Autonomous
              </span>
              <span className="text-slate-400 text-[10px] font-black font-mono tracking-widest uppercase">ENGINE_V4</span>
              <span className="px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 text-[9px] font-black text-[#0176d3] flex items-center gap-1.5 shadow-sm">
                <PieChart className="w-3 h-3" /> 3/4 KELLY INDEX
              </span>
            </div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
              Alpha Fund <span className="text-slate-300 font-bold italic">Operations</span>
            </h1>
            <p className="text-slate-500 text-sm font-medium flex items-center gap-2 mt-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0176d3]" />
              v4 Pulse Engine <span className="text-slate-300 mx-1">|</span> Trailing Stop · Breakeven Lock · 50% Scale-Out
            </p>
          </div>
        </div>

        {/* AUM Summary */}
        <div className="text-right bg-slate-50 px-8 py-5 rounded-xl border border-slate-100 shadow-inner">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">총 운용 자산 (AUM)</p>
          <div className="flex items-baseline justify-end gap-3">
            <AnimatedNumber value={totalAssets} currency={true} decimals={2} className="text-4xl font-black text-slate-900 tabular-nums" />
            <span
              className={clsx(
                'text-sm font-black flex items-center gap-1',
                dailyPnL >= 0 ? 'text-emerald-600' : 'text-rose-600',
              )}
            >
              <AnimatedNumber value={dailyPnL} currency={true} decimals={2} className="text-sm font-black" />
              <span className="opacity-80">({dailyPnLPct}%)</span>
            </span>
          </div>
        </div>
      </header>

      {/* ── 2. CAPITAL ALLOCATION BAR ─────────────────────────────── */}
      <section className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
        <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.25em] mb-6 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-[#0176d3]" />
          자본 배분 매트릭스 (Capital Allocation) — Kelly v4
        </h2>

        {/* Progress bar */}
        <div className="w-full h-5 rounded-full bg-slate-100 flex overflow-hidden mb-6 border border-slate-200 shadow-inner p-1">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${investedPct}%` }}
            transition={{ duration: 1.5, ease: 'circOut' }}
            className="bg-gradient-to-r from-[#0176d3] to-blue-400 h-full rounded-full relative shadow-lg"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </motion.div>
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-6">
          <div className="flex items-center gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 flex-1">
            <div className="w-10 h-10 rounded-lg bg-white border border-blue-100 flex items-center justify-center shadow-sm">
              <Target className="w-5 h-5 text-[#0176d3]" />
            </div>
            <div>
              <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Active Exposure</p>
              <p className="text-xl font-black text-slate-900 tabular-nums">
                ${investedCapital.toLocaleString()} <span className="text-sm font-bold opacity-60">({investedPct.toFixed(1)}%)</span>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100 flex-1">
            <div className="w-10 h-10 rounded-lg bg-white border border-emerald-100 flex items-center justify-center shadow-sm">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Reserve Cash</p>
                <span className="text-[9px] font-black text-emerald-600 bg-white px-1.5 py-0.5 rounded border border-emerald-100">SWAN Buffer</span>
              </div>
              <p className="text-xl font-black text-slate-900 tabular-nums">
                ${cashAvailable.toLocaleString()} <span className="text-sm font-bold opacity-60">({cashPct.toFixed(1)}%)</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. V4 ACTIVE POSITIONS ────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1.5 bg-emerald-500 rounded-full shadow-sm" />
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              v4 State Machine Active Positions
            </h2>
          </div>
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live Tracking Matrix</span>
        </div>

        <div className="grid grid-cols-1 gap-5">
          {positions.map((pos: Position) => (
            <motion.div
              key={pos.ticker}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.005, backgroundColor: '#ffffff' }}
              className="bg-white border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-8 shadow-sm transition-all hover:shadow-xl hover:border-blue-200"
            >
              {/* LEFT: Ticker + status */}
              <div className="flex items-center gap-5 w-56 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center font-black text-lg text-[#0176d3] shadow-inner">
                  {pos.ticker[0]}
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tighter">{pos.ticker}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                    Weight: {(pos.weight * 100).toFixed(1)}%
                  </p>
                </div>
                <StatusBadge status={pos.status} />
              </div>

              {/* MIDDLE: Price grid */}
              <div className="flex-1 grid grid-cols-3 gap-8 border-x border-slate-100 px-8">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">진입가</p>
                  <p className="font-mono text-base font-bold text-slate-500 tabular-nums">${pos.entryPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">현재가</p>
                  <p className="font-mono font-black text-lg text-slate-900 tabular-nums">${pos.currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5 mb-1 tracking-widest">
                    <ShieldAlert className="w-3 h-3 text-rose-500" /> T.S 방어선
                  </p>
                  <div className="flex items-center gap-2">
                    <p className={clsx(
                        'font-mono font-black text-base tabular-nums',
                        pos.tsThreshold > pos.entryPrice ? 'text-emerald-600' : 'text-rose-600',
                      )}
                    >
                      ${pos.tsThreshold.toFixed(2)}
                    </p>
                    {pos.tsThreshold > pos.entryPrice && (
                      <span className="text-[9px] font-black bg-emerald-50 text-emerald-600 border border-emerald-100 rounded px-1.5 py-0.5 uppercase tracking-tighter shadow-sm">BE-Lock</span>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT: P&L */}
              <div className="w-32 text-right shrink-0">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Asset ROI (P&L)</p>
                <div
                  className={clsx(
                    'text-3xl font-black tabular-nums tracking-tighter drop-shadow-sm',
                    pos.pnlPct >= 0 ? 'text-emerald-600' : 'text-rose-600',
                  )}
                >
                  {pos.pnlPct >= 0 ? '+' : ''}{pos.pnlPct.toFixed(2)}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 4. LEGACY Dashboard Integration ───────────────────── */}
      <section className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
          <div className="p-2 bg-blue-50 rounded-lg">
            <TrendingUp className="w-6 h-6 text-[#0176d3]" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
            Live Performance Portfolio Matrix
          </h2>
        </div>
        <PortfolioDashboard />
      </section>

      {/* ── 5. SECONDARY POSITIONS ─────────────────────────────────── */}
      <div className="sfdc-card p-8">
        <AlphaFundPositions />
      </div>

      {/* ── 6. QUANT PERSONA + STRATEGY GUIDE ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-5">
            <div className="p-2 bg-purple-50 rounded-lg">
              <History className="w-6 h-6 text-purple-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
              Quant Persona Core Accuracy
            </h2>
          </div>
          <PersonaLeaderboard />
        </div>

        <div className="xl:col-span-4 space-y-8">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 blur-3xl opacity-50 group-hover:bg-indigo-100 transition-colors" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Info className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight uppercase">v4 Strategic Blueprint</h2>
              </div>
              <div className="space-y-4">
                {[
                  {
                    step: '1',
                    color: 'blue',
                    title: 'MOMENTUM ENTRY',
                    desc: 'RSI < 45 + MACD 기울기 개선 판정 시 즉각 진입',
                  },
                  {
                    step: '2',
                    color: 'amber',
                    title: 'TS DEFENSE (-10%)',
                    desc: '최고가 대비 -10% 자동 청산 메커니즘 가동',
                  },
                  {
                    step: '3',
                    color: 'emerald',
                    title: 'BE-LOCK (+1%)',
                    desc: '+5% 도달 시 스탑선을 진입가+1%로 이동해 원금 보호',
                  },
                  {
                    step: '4',
                    color: 'blue',
                    title: '50% SCALE-OUT (RSI 60)',
                    desc: 'RSI 60 돌파 시 절반 익절 후 추세 추종 모드 전환',
                  },
                ].map(({ step, color, title, desc }) => (
                  <div
                    key={step}
                    className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-xl transition-all cursor-default border border-transparent hover:border-slate-100 shadow-none hover:shadow-inner"
                  >
                    <div
                      className={clsx(
                        "w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0",
                        color === 'blue' ? "bg-blue-50 text-[#0176d3]" :
                        color === 'amber' ? "bg-amber-50 text-amber-600" :
                        "bg-emerald-50 text-emerald-600"
                      )}
                    >
                      {step}
                    </div>
                    <div>
                      <p className="text-sm font-black text-slate-900 mb-0.5 uppercase tracking-tight">{title}</p>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
