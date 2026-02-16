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
      const { data, error } = await supabase
        .from('daily_discovery')
        .select(`
          *,
          ai_predictions (*),
          stock_analysis_cache (analysis)
        `)
        .order('updated_at', { ascending: false })
        .limit(6);

      if (error) {
        console.error("Dashboard Fetch Error:", error);
      }

      if (data) {
        const mapped = data.map((item: any) => {
          const analysis = item.stock_analysis_cache?.[0]?.analysis || {};
          const prediction = item.ai_predictions?.[0] || {};

          return {
            ticker: item.ticker,
            dnaScore: analysis.dnaScore || prediction.dna_score || 0,
            popProbability: analysis.popProbability || 0,
            bullPoints: analysis.bullCase || ["Calculating..."],
            bearPoints: analysis.bearCase || ["Calculating..."],
            matchedLegend: analysis.matchedLegend || { ticker: 'None', similarity: 0 },
            riskLevel: analysis.riskLevel || 'Medium',
            verification: null,
            aiSummary: analysis.aiSummary || ""
          };
        });
        setDiscoveries(mapped);
      }
      setLoading(false);
    };

    fetchDiscoveries();
  }, []);

  return (
    <div className="max-w-[2000px] mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-1000">

      {/* 1. Header Section (Floating Glass) */}
      <header className="flex flex-col md:flex-row justify-between items-end gap-4 pb-6 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 tracking-tighter mb-2 flex items-center gap-3 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]">
            COMMAND CENTER
            <span className="px-2 py-0.5 rounded text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold tracking-widest uppercase shadow-[0_0_10px_rgba(99,102,241,0.3)] backdrop-blur-md">
              LIVE FEED
            </span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl font-medium tracking-tight">
            Advanced Market Surveillance & AI Prediction Engine.
            <span className="text-indigo-400 font-bold"> Active Signals</span> • <span className="text-emerald-400 font-bold">Fund Performance</span>
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
              ALPHA FUND PERFORMANCE
            </h2>
          </div>
          <PortfolioDashboard />
        </div>
      </section>

      {/* 3. Main Content Grid (Bento Layout) */}
      <div className="grid grid-cols-1 2xl:grid-cols-12 gap-6">

        {/* Left Column: Daily Discoveries (Main Feed) */}
        <div className="2xl:col-span-8 space-y-6">
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className="h-8 w-1 bg-gradient-to-b from-indigo-400 to-cyan-400 rounded-full shadow-[0_0_10px_rgba(99,102,241,0.6)]" />
              <h2 className="text-2xl font-black text-white tracking-tight">TODAY'S AI SIGNALS</h2>
            </div>
            <span className="text-xs font-mono text-indigo-300/70 font-bold tracking-widest border border-indigo-500/20 px-3 py-1 rounded-full bg-indigo-500/5">LATEST SCAN RESULTS</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-32 relative">
              <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full opacity-30 animate-pulse" />
              <Loader2 className="w-12 h-12 text-indigo-400 animate-spin relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.8)]" />
            </div>
          ) : discoveries.length === 0 ? (
            <div className="bento-card p-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-500">
                <Loader2 className="w-8 h-8" />
              </div>
              <p className="text-slate-400 font-medium">No signals detected yet.</p>
              <p className="text-slate-600 text-sm mt-1">Initiate a system scan to identify opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {discoveries.map((stock) => (
                <div key={stock.ticker} className="group hover:z-20 relative transition-transform duration-300 hover:-translate-y-1">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-3xl opacity-0 group-hover:opacity-30 blur-lg transition duration-500" />
                  <AnalysisResultCard
                    {...stock}
                    className="h-full relative bento-card border-white/5 hover:border-white/20"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Leaderboard & Watchlist (Vertical Stack) */}
        <div className="2xl:col-span-4 space-y-6 flex flex-col h-full">

          {/* Persona Leaderboard */}
          <div className="bento-card p-6 flex-1 min-h-[400px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 relative z-10 border-b border-white/5 pb-4">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
              <h2 className="text-lg font-bold text-white tracking-tight uppercase">Model Accuracy</h2>
            </div>
            <PersonaLeaderboard />
          </div>

          {/* Watchlist */}
          <div className="bento-card p-6 flex-1 min-h-[400px]">
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none" />
            <div className="flex items-center gap-3 mb-6 border-b border-white/5 pb-4 relative z-10">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full shadow-[0_0_8px_rgba(148,163,184,0.5)]" />
              <h2 className="text-lg font-bold text-white tracking-tight uppercase">Quick Watch</h2>
            </div>
            <WatchlistView />
          </div>

        </div>
      </div>
    </div>
  );
};