import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Loader2 } from 'lucide-react';

// 경로 수정 완료
import { SystemStatus } from '../components/dashboard/SystemStatus';
import { PortfolioDashboard } from '../components/dashboard/PortfolioDashboard'; // 아래 3번에서 생성
import { AnalysisResultCard } from '../components/ui/AnalysisResultCard'; // ui 폴더
import { PersonaLeaderboard } from '../components/dashboard/PersonaLeaderboard';
import { WatchlistView } from '../components/dashboard/WatchlistView';
import { SignalTicker } from '../components/dashboard/SignalTicker';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export const Dashboard = () => {
  const [discoveries, setDiscoveries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscoveries = async () => {
      setLoading(true);
      // Try to fetch with relationships (requires FK in DB)
      let { data, error } = await supabase
        .from('daily_discovery')
        .select(`
          *,
          ai_predictions (*),
          stock_analysis_cache (analysis)
        `)
        .order('updated_at', { ascending: false })
        .limit(6);

      // Fallback: If join fails, fetch daily_discovery only
      if (error) {
        console.warn("Joined fetch failed, falling back to simple fetch:", error.message);
        const { data: simpleData, error: simpleError } = await supabase
          .from('daily_discovery')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(6);
        
        if (simpleError) {
          console.error("Dashboard Fetch Critical Error:", simpleError);
        }
        data = simpleData;
      }

      if (data) {
        const mapped = data.map((item: any) => {
          const analysis = item.stock_analysis_cache?.[0]?.analysis || {};
          const prediction = item.ai_predictions?.[0] || {};

          return {
            ticker: item.ticker,
            dnaScore: item.dna_score || analysis.dnaScore || prediction.dna_score || 0,
            popProbability: item.pop_probability || analysis.popProbability || 0,
            bullPoints: analysis.bullCase || ["High Momentum Strategy"],
            bearPoints: analysis.bearCase || ["Market Volatility Risks"],
            matchedLegend: analysis.matchedLegend || { ticker: 'N/A', similarity: 0 },
            riskLevel: item.risk_level || analysis.riskLevel || 'Medium',
            verification: null,
            aiSummary: item.ai_summary || analysis.aiSummary || "Analysis pending system synchronization..."
          };
        });
        setDiscoveries(mapped);
      }
      setLoading(false);
    };

    fetchDiscoveries();
  }, []);

  return (
    <div className="max-w-[2000px] mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-1000">

      {/* 1. Header Section (Floating Glass) */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 tracking-tighter mb-2 flex items-center gap-3 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            작전 지휘소
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(99,102,241,0.3)] backdrop-blur-md">
              실시간 피드
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl font-medium tracking-tight">
            차세대 시장 감시 및 AI 예측 엔진.
            <span className="text-indigo-400 font-bold"> 활성 시그널</span> • <span className="text-emerald-400 font-bold">펀드 수익률</span>
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <SystemStatus />
          <SignalTicker />
        </div>
      </header>

      {/* 2. Top Metric Section: Alpha Fund Performance (Wide Bento Cell) */}
      <section className="bento-card p-1 group">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-transparent to-emerald-500/10 opacity-50 group-hover:opacity-100 transition-opacity duration-700" />
        <div className="relative z-10 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse" />
              알파 펀드 운용 현황
            </h2>
          </div>
          <PortfolioDashboard />
        </div>
      </section>

      {/* 3. Main Content Grid (Bento Layout) */}
      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6 md:gap-8">

        {/* Left Column: Daily Discoveries (Main Feed) */}
        <div className="2xl:col-span-8 space-y-6 md:space-y-8">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-gradient-to-b from-indigo-400 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
              <h2 className="text-2xl font-black text-white tracking-tight">오늘의 AI 포착 종목</h2>
            </div>
            <span className="text-xs font-mono text-indigo-300/70 font-bold tracking-widest border border-indigo-500/20 px-3 py-1 rounded-full bg-indigo-500/5">최신 분석 결과</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-32 relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full opacity-30 animate-pulse" />
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            </div>
          ) : discoveries.length === 0 ? (
            <div className="bento-card p-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-500 border border-white/5">
                <Loader2 className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-white font-bold tracking-tight">활성 시그널 없음</p>
              <p className="text-slate-500 text-sm mt-1">시스템 스캔을 시작하여 기회를 포착하세요.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {discoveries.map((stock) => (
                <div key={stock.ticker} className="group hover:z-20 relative transition-transform duration-300 hover:-translate-y-1">
                  <AnalysisResultCard
                    {...stock}
                    className="h-full relative"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Leaderboard & Watchlist (Vertical Stack) */}
        <div className="2xl:col-span-4 space-y-6 md:space-y-8 flex flex-col h-full">

          {/* Persona Leaderboard */}
          <div className="bento-card p-6 flex-1 min-h-[400px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 relative z-10 border-b border-white/5 pb-4">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <h2 className="text-lg font-bold text-white tracking-tight uppercase">모델 정확도</h2>
            </div>
            <PersonaLeaderboard />
          </div>

          {/* Watchlist */}
          <div className="bento-card p-6 flex-1 min-h-[400px]">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4 relative z-10">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full shadow-[0_0_8px_rgba(148,163,184,0.5)]" />
              <h2 className="text-lg font-bold text-white tracking-tight uppercase">퀵 워치</h2>
            </div>
            <WatchlistView />
          </div>

        </div>
      </div>
    </div>
  );
};