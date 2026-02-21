import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2, Rocket, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

import { SystemStatus } from '../components/dashboard/SystemStatus';
import { PortfolioDashboard } from '../components/dashboard/PortfolioDashboard';
import { PersonaLeaderboard } from '../components/dashboard/PersonaLeaderboard';
import { WatchlistView } from '../components/dashboard/WatchlistView';
import { SignalTicker } from '../components/dashboard/SignalTicker';
import { QuantSignalCard, type QuantSignalData } from '../components/ui/QuantSignalCard';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Supabase 레코드 → QuantSignalCard 인터페이스 변환
const mapToSignalData = (item: any): QuantSignalData & { ticker: string } => {
  const analysis = item.stock_analysis_cache?.[0]?.analysis || {};
  const aiSummary: string = item.ai_summary || '';

  // ai_summary에서 bull/bear/tags를 추출 (JSON 형식이면 파싱 시도)
  let bull_case = '분석 데이터 수집 중...';
  let bear_case = '리스크 스캔 중...';
  let tags: string[] = [item.ticker || ''];
  let reasoning_ko = aiSummary || '분석 결과 동기화 중...';

  try {
    const parsed = typeof aiSummary === 'string' ? JSON.parse(aiSummary) : aiSummary;
    if (parsed?.bull_case) bull_case = parsed.bull_case;
    if (parsed?.bear_case) bear_case = parsed.bear_case;
    if (parsed?.tags) tags = parsed.tags;
    if (parsed?.reasoning_ko) reasoning_ko = parsed.reasoning_ko;
  } catch {
    // ai_summary가 일반 텍스트인 경우 → reasoning으로 활용
    if (aiSummary && aiSummary.length > 10) {
      reasoning_ko = aiSummary;
    }
    // AnalysisResultCard 포맷으로 저장된 배열 데이터 변환
    const bullPoints: string[] = analysis.bullCase || [];
    const bearPoints: string[] = analysis.bearCase || [];
    if (bullPoints.length) bull_case = bullPoints.join(' '); 
    if (bearPoints.length) bear_case = bearPoints.join(' ');
  }

  return {
    ticker: item.ticker,
    dna_score: item.dna_score || analysis.dnaScore || 0,
    bull_case,
    bear_case,
    reasoning_ko,
    tags,
  };
};

export const Dashboard = () => {
  const [discoveries, setDiscoveries] = useState<(QuantSignalData & { ticker: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscoveries = async () => {
      setLoading(true);

      let { data, error } = await supabase
        .from('daily_discovery')
        .select('*, ai_predictions(*), stock_analysis_cache(analysis)')
        .order('updated_at', { ascending: false })
        .limit(6);

      if (error) {
        const { data: simple } = await supabase
          .from('daily_discovery')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(6);
        data = simple;
      }

      if (data) setDiscoveries(data.map(mapToSignalData));
      setLoading(false);
    };

    fetchDiscoveries();
  }, []);

  return (
    <div className="max-w-[2000px] mx-auto space-y-8 animate-in fade-in duration-1000">

      {/* ─── 1. Header ─────────────────────────────────────────────── */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 tracking-tighter mb-2 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            작전 지휘소
          </h1>
          <p className="text-slate-400 text-sm font-medium tracking-tight">
            폰드 수익률 요약 •{' '}
            <Link to="/pulse" className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors">
              퀀트 펄스 실시간 피드 →
            </Link>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <SystemStatus />
          <SignalTicker />
        </div>
      </header>

      {/* ─── 2. Alpha Fund Section ──────────────────────────────────── */}
      <section className="bento-card p-1 group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-emerald-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative z-10 p-6">
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
            알파 펀드 운용 현황
          </h2>
          <PortfolioDashboard />
        </div>
      </section>

      {/* ─── 3. Main Content Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 md:gap-8">

        {/* Left Column: Today's AI Discoveries */}
        <div className="2xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3">
              <div className="h-7 w-1 bg-gradient-to-b from-indigo-400 to-cyan-400 rounded-full" />
              <h2 className="text-xl font-black text-white tracking-tight">오늘의 AI 포착 종목</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-indigo-300/70 font-bold tracking-widest border border-indigo-500/20 px-3 py-1 rounded-full bg-indigo-500/5">
                최신 분석 결과
              </span>
              <Link
                to="/pulse"
                className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:text-blue-300 border border-blue-500/20 px-3 py-1 rounded-full bg-blue-500/5 hover:bg-blue-500/10 transition-colors"
              >
                <Zap className="w-3 h-3" />
                실시간 펄스 보기
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-32">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
            </div>
          ) : discoveries.length === 0 ? (
            <div className="bento-card p-16 flex flex-col items-center justify-center text-center gap-4">
              <Rocket className="w-10 h-10 text-slate-600" />
              <p className="text-white font-bold">활성 시그널 없음</p>
              <p className="text-slate-500 text-sm">
                사이드바의 <span className="text-blue-400 font-bold">퀀트 펄스</span> 메뉴에서 딥 헌팅을 실행하세요.
              </p>
            </div>
          ) : (
            /* QuantSignalCard 그리드 — ticker를 헤더 뱃지로 표시 */
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {discoveries.map((stock) => (
                <div key={stock.ticker} className="relative group">
                  {/* 종목 티커 헤더 뱃지 */}
                  <div className="absolute -top-3 left-4 z-20 px-3 py-1 bg-slate-800 border border-slate-700 rounded-full text-xs font-black text-slate-200 tracking-widest shadow-lg">
                    {stock.ticker}
                  </div>
                  <QuantSignalCard
                    data={{
                      dna_score: stock.dna_score,
                      bull_case: stock.bull_case,
                      bear_case: stock.bear_case,
                      reasoning_ko: stock.reasoning_ko,
                      tags: stock.tags,
                    }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column */}
        <div className="2xl:col-span-4 space-y-6 flex flex-col">
          <div className="bento-card p-6 flex-1 min-h-[380px]">
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <h2 className="text-base font-bold text-white tracking-tight uppercase">모델 정확도</h2>
            </div>
            <PersonaLeaderboard />
          </div>

          <div className="bento-card p-6 flex-1 min-h-[380px]">
            <div className="flex items-center gap-3 mb-5 border-b border-white/5 pb-4">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
              <h2 className="text-base font-bold text-white tracking-tight uppercase">퀵 워치</h2>
            </div>
            <WatchlistView />
          </div>
        </div>

      </div>
    </div>
  );
};