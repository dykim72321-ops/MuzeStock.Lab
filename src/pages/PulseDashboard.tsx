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
    ? <TrendingUp className="w-4 h-4 text-emerald-600" />
    : rawData.signal === 'SELL'
    ? <TrendingDown className="w-4 h-4 text-rose-600" />
    : <Minus className="w-4 h-4 text-slate-400" />;

  const signalColor = rawData.signal === 'BUY' ? 'text-emerald-600' : rawData.signal === 'SELL' ? 'text-rose-600' : 'text-slate-500';

  return (
    <div className="flex items-center justify-between px-6 py-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-md transition-all group">
      <div className="flex items-center gap-4">
        <div className="w-1 h-10 bg-slate-200 rounded-full group-hover:bg-blue-400 transition-colors" />
        <div>
          <span className="text-lg font-black text-slate-900 tracking-tight">{rawData.ticker}</span>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5 uppercase tracking-tighter">
            SYNC: {new Date(rawData.timestamp).toLocaleTimeString()}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* RSI */}
        <div className="text-right">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.15em]">RSI Matrix</p>
          <p className="font-mono font-black text-base text-slate-700">{rawData.rsi?.toFixed(1) ?? '—'}</p>
        </div>
        {/* Signal */}
        <div className={clsx('flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-black shadow-sm',
          rawData.signal === 'BUY' ? 'bg-emerald-50 border-emerald-100' :
          rawData.signal === 'SELL' ? 'bg-rose-50 border-rose-100' :
          'bg-slate-50 border-slate-200'
        )}>
          {signalIcon}
          <span className={clsx('uppercase tracking-widest', signalColor)}>{rawData.signal}</span>
        </div>
        {/* NORMAL 뱃지 */}
        <span className="text-[9px] font-black text-slate-400 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-md tracking-[0.2em] uppercase">
          Standard
        </span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────
// 메인 대시보드 컴포넌트
// ─────────────────────────────────────────────────────────
const PulseDashboard: React.FC = () => {
  const { pulseMap, isConnected } = usePulseSocket(`ws://${window.location.host}/py-api/ws/pulse`);

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
      const response = await fetch('/py-api/api/hunt', {
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
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-10 animate-in fade-in duration-700 bg-slate-50 min-h-screen">

      {/* ─── Header ────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Activity className="w-7 h-7 text-indigo-600 animate-pulse" />
            </div>
            Quant Pulse <span className="text-slate-300 font-bold">/ Terminal</span>
          </h1>
          <p className="text-slate-500 font-medium mt-1">실시간 퀀트 데이터 스트리밍 및 AI 시그널 터미널</p>
        </div>

        <div className="flex items-center gap-5">
          <div className="flex items-center gap-3">
            <button
              onClick={handleTriggerHunt}
              disabled={isHunting}
              className={clsx(
                "flex items-center gap-2 px-6 py-2.5 rounded-md font-black text-sm transition-all shadow-md active:scale-95",
                isHunting
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-[#0176d3] hover:bg-[#014486] text-white'
              )}
            >
              {isHunting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
              {isHunting ? '엔진 가동 중...' : '딥 헌팅 실행'}
            </button>

            {huntStatus === 'success' && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 font-black uppercase tracking-tight bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-100 animate-in fade-in slide-in-from-bottom-2">
                <CheckCircle className="w-3.5 h-3.5" /> 탐색 시작됨
              </span>
            )}
          </div>

          <div className="h-10 w-px bg-slate-200 hidden md:block" />

          <div className={clsx(
            "px-4 py-2 rounded-full text-[10px] font-black tracking-widest flex items-center gap-2 border transition-all duration-500 shadow-sm",
            isConnected
              ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
              : 'bg-rose-50 text-rose-600 border-rose-100'
          )}>
            <span className={clsx("w-2 h-2 rounded-full", isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500')} />
            {isConnected ? 'SYSTEM ONLINE' : 'OFFLINE'}
          </div>
        </div>
      </header>

      {/* ─── Empty state ────────────────────────────────────────── */}
      {allTickers.length === 0 && (
        <div className="flex flex-col items-center justify-center h-[50vh] bg-white border-2 border-dashed border-slate-200 rounded-3xl gap-4 text-slate-400 shadow-inner">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
            <Activity className="w-8 h-8 opacity-20" />
          </div>
          <p className="font-black text-xl tracking-tight text-slate-900">백엔드 펄스 엔진 수신 대기 중</p>
          <p className="text-sm font-medium">상단의 '딥 헌팅 실행' 버튼을 눌러 시장 발굴을 시작해 보세요.</p>
        </div>
      )}

      {/* ─── STRONG 시그널 (풀사이즈 QuantSignalCard) ──────────── */}
      {strongTickers.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200 pb-4">
            <div className="flex items-center gap-3">
              <div className="h-6 w-1.5 bg-[#0176d3] rounded-full shadow-sm" />
              <h2 className="text-xl font-black text-slate-900 tracking-tight uppercase">
                ⚡ STRONG SIGNALS — AI Analysis Matrix
              </h2>
            </div>
            <span className="text-[10px] font-black text-white bg-[#0176d3] px-3 py-1 rounded-full shadow-md">
              {strongTickers.length} DETECTED
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-10">
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
                <div key={ticker} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-1.5 h-8 bg-indigo-500 rounded-full" />
                      <div>
                        <h2 className="text-3xl font-black tracking-tighter text-slate-900">{ticker}</h2>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-0.5">Verified Intelligence</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono font-black text-slate-300 uppercase tracking-tighter">
                      SYNC: {new Date(rawData.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <QuantSignalCard data={cardData} />
                  <div className="mt-8 pt-8 border-t border-slate-100 p-2 bg-slate-50/50 rounded-xl shadow-inner">
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
        <section className="space-y-4">
          <div className="flex items-center gap-3 border-b border-slate-200 pb-3">
            <div className="h-5 w-1 bg-slate-400 rounded-full" />
            <h2 className="text-xs font-black text-slate-500 tracking-[0.2em] uppercase">
              STANDARD MONITORING GRID
            </h2>
            <span className="text-[10px] font-black text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
              {normalTickers.length} TICKERS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
