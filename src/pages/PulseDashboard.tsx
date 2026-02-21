import { usePulseSocket, type PulseData } from '../hooks/usePulseSocket';
import { QuantSignalCard } from '../components/ui/QuantSignalCard';
import { BacktestChart } from '../components/ui/BacktestChart';
import { Activity, Rocket, Loader2, CheckCircle, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useState } from 'react';
import clsx from 'clsx';

// ─────────────────────────────────────────────────────────
// NORMAL 강도 전용 미니 카드 (축약형 정보 표시)
// ─────────────────────────────────────────────────────────
const NormalSignalMiniCard = ({ rawData }: { rawData: PulseData }) => {
  const signalIcon = rawData.signal === 'BUY'
    ? <TrendingUp className="w-4 h-4 text-emerald-400" />
    : rawData.signal === 'SELL'
    ? <TrendingDown className="w-4 h-4 text-rose-400" />
    : <Minus className="w-4 h-4 text-slate-500" />;

  const signalColor = rawData.signal === 'BUY' ? 'text-emerald-400' : rawData.signal === 'SELL' ? 'text-rose-400' : 'text-slate-500';

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-slate-900/40 border border-slate-800/60 rounded-xl hover:border-slate-700/60 transition-colors group">
      <div className="flex items-center gap-3">
        <div className="w-1.5 h-8 bg-slate-700 rounded-full" />
        <div>
          <span className="text-sm font-black text-slate-300 tracking-tight">{rawData.ticker}</span>
          <p className="text-[10px] font-mono text-slate-600 mt-0.5">
            LAST_SYNC: {new Date(rawData.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* RSI */}
        <div className="text-right">
          <p className="text-[9px] text-slate-600 uppercase tracking-wide">RSI</p>
          <p className="font-mono font-black text-sm text-slate-400">{rawData.rsi?.toFixed(1) ?? '—'}</p>
        </div>
        {/* Signal */}
        <div className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-black',
          rawData.signal === 'BUY' ? 'bg-emerald-500/10 border-emerald-500/20' :
          rawData.signal === 'SELL' ? 'bg-rose-500/10 border-rose-500/20' :
          'bg-slate-800/60 border-slate-700/50'
        )}>
          {signalIcon}
          <span className={signalColor}>{rawData.signal}</span>
        </div>
        {/* NORMAL 뱃지 */}
        <span className="text-[9px] font-black text-slate-600 bg-slate-800 border border-slate-700 px-2 py-1 rounded-md tracking-widest uppercase">
          NORMAL
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// 메인 대시보드 컴포넌트
// ─────────────────────────────────────────────────────────
const PulseDashboard: React.FC = () => {
  const { pulseMap, isConnected } = usePulseSocket('ws://localhost:8000/ws/pulse');

  // STRONG / NORMAL 분류
  const allTickers = Object.keys(pulseMap);
  const strongTickers = allTickers.filter(t => pulseMap[t].strength === 'STRONG');
  const normalTickers = allTickers.filter(t => pulseMap[t].strength === 'NORMAL');

  const [isHunting, setIsHunting] = useState(false);
  const [huntStatus, setHuntStatus] = useState<'success' | 'error' | null>(null);

  const handleTriggerHunt = async () => {
    setIsHunting(true);
    setHuntStatus(null);
    try {
      const adminKey = import.meta.env.VITE_ADMIN_SECRET_KEY || 'muze_secret_key_2024';
      const response = await fetch('http://localhost:8000/api/hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      setHuntStatus('success');
      setTimeout(() => setHuntStatus(null), 3000);
    } catch (error) {
      setHuntStatus('error');
      setTimeout(() => setHuntStatus(null), 3000);
    } finally {
      setIsHunting(false);
    }
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans space-y-10">

      {/* ─── Header ────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 tracking-tighter flex items-center gap-3">
            <Activity className="w-8 h-8 text-indigo-400 animate-pulse" />
            MuzeStock.Lab Live Pulse
          </h1>
          <p className="text-slate-500 font-medium mt-1">실시간 퀀트 데이터 스트리밍 터미널</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerHunt}
              disabled={isHunting}
              className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${
                isHunting
                  ? 'bg-indigo-600/30 text-indigo-300 cursor-not-allowed border border-indigo-500/20'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-400/50 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5'
              }`}
            >
              {isHunting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {isHunting ? '엔진 가동 중...' : '딥 헌팅 실행 (Track A+B)'}
            </button>

            {huntStatus === 'success' && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle className="w-3.5 h-3.5" /> 백그라운드 탐색 시작됨
              </span>
            )}
            {huntStatus === 'error' && (
              <span className="text-xs text-rose-400 font-bold animate-in fade-in slide-in-from-bottom-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> 통신 오류
              </span>
            )}
          </div>

          <div className="h-8 w-px bg-slate-800 hidden md:block mx-1" />

          <div className={`px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border transition-all duration-500 ${
            isConnected
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}>
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
            {isConnected ? 'PULSE LIVE' : 'OFFLINE'}
          </div>
        </div>
      </header>

      {/* ─── Empty state ────────────────────────────────────────── */}
      {allTickers.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[50vh] text-slate-600 border-2 border-dashed border-slate-800/50 rounded-3xl bg-slate-900/20 gap-4">
          <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
          <p className="font-bold text-lg tracking-tight">백엔드 펄스 엔진에서 첫 번째 신호를 기다리는 중...</p>
          <p className="text-sm opacity-60">상단의 '딥 헌팅 실행' 버튼을 눌러 발굴을 시작해 보세요.</p>
        </div>
      )}

      {/* ─── STRONG 시그널 (풀사이즈 QuantSignalCard) ──────────── */}
      {strongTickers.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-gradient-to-b from-indigo-400 to-emerald-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
            <h2 className="text-lg font-black text-white tracking-tight uppercase">
              ⚡ STRONG 시그널 — 정밀 AI 분석 완료
            </h2>
            <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full">
              {strongTickers.length}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {strongTickers.map((ticker) => {
              const rawData = pulseMap[ticker];
              const cardData = {
                dna_score: rawData.ai_metadata?.dna_score ?? null,
                bull_case: rawData.ai_metadata?.bull_case || '상승 분석 데이터 생성 중...',
                bear_case: rawData.ai_metadata?.bear_case || '리스크 분석 데이터 생성 중...',
                reasoning_ko: rawData.ai_metadata?.reasoning_ko || rawData.ai_report,
                tags: rawData.ai_metadata?.tags || [ticker, 'STRONG'],
              };

              return (
                <div key={ticker} className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                  <div className="flex items-center gap-3 mb-4 pl-1">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                    <h2 className="text-2xl font-black tracking-tighter text-white">{ticker}</h2>
                    <span className="text-[10px] font-mono text-slate-500 opacity-50 ml-auto">
                      LAST_SYNC: {new Date(rawData.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <QuantSignalCard data={cardData} />
                  <div className="mt-4">
                    <BacktestChart ticker={ticker} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── NORMAL 시그널 (미니 카드 목록) ────────────────────── */}
      {normalTickers.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="h-6 w-1 bg-slate-700 rounded-full" />
            <h2 className="text-sm font-black text-slate-500 tracking-widest uppercase">
              NORMAL 시그널 — 관측 대기 중
            </h2>
            <span className="text-[10px] font-black text-slate-600 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-full">
              {normalTickers.length}
            </span>
          </div>

          <div className="space-y-2">
            {normalTickers.map((ticker) => (
              <NormalSignalMiniCard key={ticker} rawData={pulseMap[ticker]} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PulseDashboard;
