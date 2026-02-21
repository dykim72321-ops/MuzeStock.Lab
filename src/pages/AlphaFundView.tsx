import { motion } from 'framer-motion';
import AnimatedNumber from '../components/ui/AnimatedNumber';

import {
  Zap, ShieldCheck, TrendingUp, History, Info,
  PieChart, ShieldAlert, DollarSign,
  ArrowRightLeft, Target
} from 'lucide-react';
import clsx from 'clsx';
import { PortfolioDashboard } from '../components/dashboard/PortfolioDashboard';
import { PersonaLeaderboard } from '../components/dashboard/PersonaLeaderboard';
import { AlphaFundPositions } from '../components/dashboard/AlphaFundPositions';

// ─────────────────────────────────────────────────────────────────
// v4 엔진 로직을 반영한 목업 데이터
// 추후 Supabase 'active_positions' 테이블 & backtester API와 연동
// ─────────────────────────────────────────────────────────────────
const MOCK_PORTFOLIO = {
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
    <div className="px-2 py-1 rounded bg-orange-500/10 border border-orange-500/20 flex items-center gap-1.5 shrink-0">
      <ArrowRightLeft className="w-3 h-3 text-orange-400" />
      <span className="text-[10px] font-bold text-orange-400 whitespace-nowrap">절반 익절</span>
    </div>
  ) : (
    <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 flex items-center gap-1.5 shrink-0">
      <TrendingUp className="w-3 h-3 text-blue-400" />
      <span className="text-[10px] font-bold text-blue-400 whitespace-nowrap">추세 홀딩</span>
    </div>
  );

// ─────────────────────────────────────────────────────────────────
// Main Component (named export — App.tsx lazy import에 맞춤)
// ─────────────────────────────────────────────────────────────────
export const AlphaFundView = () => {
  const { totalAssets, cashAvailable, investedCapital, dailyPnL, dailyPnLPct, positions } =
    MOCK_PORTFOLIO;

  const investedPct = (investedCapital / totalAssets) * 100;
  const cashPct = (cashAvailable / totalAssets) * 100;

  return (
    <div className="max-w-[1600px] mx-auto p-6 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">

      {/* ── 1. HEADER ─────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <div className="absolute -inset-2 bg-amber-500/20 rounded-2xl blur-xl group-hover:bg-amber-500/30 transition-all duration-700" />
            <div className="relative p-4 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-[0_0_20px_rgba(251,191,36,0.2)]">
              <Zap className="w-8 h-8 text-amber-400 fill-amber-400/20 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-black tracking-widest uppercase">
                System Managed
              </span>
              <span className="text-slate-500 text-xs font-mono tracking-tighter">v4-PULSE</span>
              <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-[10px] font-bold text-purple-400 flex items-center gap-1">
                <PieChart className="w-3 h-3" /> 3/4 KELLY
              </span>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter drop-shadow-sm">
              ALPHA FUND <span className="text-slate-500 font-light">OPERATIONS</span>
            </h1>
            <p className="text-slate-400 text-sm font-medium flex items-center gap-2 mt-1">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              v4 Pulse Engine — Trailing Stop · Breakeven Lock · 50% Scale-Out
            </p>
          </div>
        </div>

        {/* AUM Summary */}
        <div className="text-right">
          <p className="text-sm font-semibold text-slate-500 mb-1">총 운용 자산 (AUM)</p>
          <div className="flex items-baseline justify-end gap-3">
            <AnimatedNumber value={totalAssets} currency={true} decimals={2} className="text-4xl font-black text-slate-100" />
            <span
              className={clsx(
                'text-sm font-bold flex items-center gap-1',
                dailyPnL >= 0 ? 'text-emerald-400' : 'text-rose-400',
              )}
            >
              <AnimatedNumber value={dailyPnL} currency={true} decimals={2} className="text-sm font-bold" />
              ({dailyPnLPct}%)
            </span>
          </div>
        </div>
      </header>

      {/* ── 2. CAPITAL ALLOCATION BAR ─────────────────────────────── */}
      <section className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-2xl p-6">
        <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-slate-500" />
          자본 배분 현황 (Capital Allocation) — 3/4 Kelly
        </h2>

        {/* Progress bar */}
        <div className="w-full h-4 rounded-full bg-slate-800 flex overflow-hidden mb-4 border border-slate-700/60">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${investedPct}%` }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full relative"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
          </motion.div>
          <div className="bg-slate-900 h-full flex-1" />
        </div>

        <div className="flex flex-col sm:flex-row justify-between gap-3 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-blue-500 shrink-0" />
            <span className="text-slate-300">
              투입 자산{' '}
              <span className="text-slate-100 ml-1 tabular-nums">
                ${investedCapital.toLocaleString()} ({investedPct.toFixed(1)}%)
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm bg-slate-700 shrink-0" />
            <span className="text-slate-300">
              가용 현금{' '}
              <span className="text-emerald-400 ml-1 tabular-nums">
                ${cashAvailable.toLocaleString()} ({cashPct.toFixed(1)}%)
              </span>
              <span className="text-slate-500 text-xs ml-1">← SWAN 방어 버퍼</span>
            </span>
          </div>
        </div>
      </section>

      {/* ── 3. V4 ACTIVE POSITIONS ────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-bold text-slate-200 mb-5 flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-400" />
          v4 State Machine 운용 포지션
          <span className="text-xs font-normal text-slate-500 ml-1">(T.S = Trailing Stop 방어선)</span>
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {positions.map((pos) => (
            <motion.div
              key={pos.ticker}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ scale: 1.002 }}
              className="bg-slate-900/60 border border-white/10 backdrop-blur-xl rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-5"
            >
              {/* LEFT: Ticker + status */}
              <div className="flex items-center gap-4 w-48 shrink-0">
                <div>
                  <h3 className="text-2xl font-black text-slate-100 tracking-tighter">{pos.ticker}</h3>
                  <span className="text-xs font-bold text-slate-500">
                    Weight: {(pos.weight * 100).toFixed(1)}%
                  </span>
                </div>
                <StatusBadge status={pos.status} />
              </div>

              {/* MIDDLE: Price grid */}
              <div className="flex-1 grid grid-cols-3 gap-4 border-x border-slate-800/50 px-6">
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">진입가</p>
                  <p className="font-mono text-slate-300">${pos.entryPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">현재가</p>
                  <p className="font-mono font-bold text-slate-100">${pos.currentPrice.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1 mb-1">
                    <ShieldAlert className="w-3 h-3 text-rose-400" /> T.S 방어선
                  </p>
                  {/* 진입가 < T.S 임계선 → 수익 보전 구간 (초록) */}
                  <p
                    className={clsx(
                      'font-mono font-bold',
                      pos.tsThreshold > pos.entryPrice ? 'text-emerald-400' : 'text-rose-400',
                    )}
                  >
                    ${pos.tsThreshold.toFixed(2)}
                    {pos.tsThreshold > pos.entryPrice && (
                      <span className="ml-1 text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded px-1 py-0.5">본전보호</span>
                    )}
                  </p>
                </div>
              </div>

              {/* RIGHT: P&L */}
              <div className="w-28 text-right shrink-0">
                <p className="text-[10px] font-bold text-slate-500 uppercase mb-1">수익률 (P&L)</p>
                <div
                  className={clsx(
                    'text-2xl font-black tabular-nums tracking-tight',
                    pos.pnlPct >= 0 ? 'text-emerald-400' : 'text-rose-400',
                  )}
                >
                  {pos.pnlPct >= 0 ? '+' : ''}
                  {pos.pnlPct.toFixed(2)}%
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── 4. LEGACY: Live Performance Matrix (기존 포트폴리오 차트) ── */}
      <section className="relative">
        <div className="absolute top-0 left-0 w-full h-full bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8 overflow-hidden">
          <div className="flex items-center gap-2 mb-8 border-b border-white/5 pb-4">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-black text-white tracking-tight uppercase">
              Live Performance Matrix
            </h2>
          </div>
          <PortfolioDashboard />
        </div>
      </section>

      {/* ── 5. EXISTING POSITIONS ─────────────────────────────────── */}
      <AlphaFundPositions />

      {/* ── 6. QUANT PERSONA + STRATEGY GUIDE ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 bg-slate-900/40 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-indigo-400" />
              <h2 className="text-xl font-black text-white tracking-tight uppercase">
                Quant Persona Accuracy
              </h2>
            </div>
          </div>
          <PersonaLeaderboard />
        </div>

        <div className="xl:col-span-4">
          <div className="bg-gradient-to-br from-indigo-500/10 to-transparent backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-8">
            <div className="flex items-center gap-2 mb-6">
              <Info className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">v4 Strategy Blueprint</h2>
            </div>
            <div className="space-y-4">
              {[
                {
                  step: '1',
                  color: 'indigo',
                  title: 'MOMENTUM 진입',
                  desc: 'RSI < 45 + MACD 기울기 개선 — 우량주 눌림목 포착',
                },
                {
                  step: '2',
                  color: 'cyan',
                  title: 'Trailing Stop -10%',
                  desc: '최고가 대비 -10% 이탈 시 자동 청산',
                },
                {
                  step: '3',
                  color: 'emerald',
                  title: 'Breakeven Lock +1%',
                  desc: '+5% 수익 달성 시 손절선을 +1%로 상향, 원금 보호',
                },
                {
                  step: '4',
                  color: 'amber',
                  title: '50% Scale-Out (RSI 60)',
                  desc: 'RSI 60 돌파 시 절반 익절 → 현금화로 SWAN 확보',
                },
              ].map(({ step, color, title, desc }) => (
                <div
                  key={step}
                  className={`flex items-start gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-${color}-500/30 transition-colors`}
                >
                  <div
                    className={`w-9 h-9 bg-${color}-500/20 rounded-xl flex items-center justify-center text-${color}-400 font-black text-sm shrink-0`}
                  >
                    {step}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white mb-0.5">{title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
