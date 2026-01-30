import { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, CheckCircle2, BrainCircuit, Share2, Loader2, Plus } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { fetchStockQuote } from '../../services/stockService';
import { fetchStockAnalysis, type AIAnalysis } from '../../services/analysisService';
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../../services/watchlistService';
import type { Stock } from '../../types';
import clsx from 'clsx';

export const DnaMatchView = () => {
  const { id: ticker } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stock, setStock] = useState<Stock | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!ticker) return;
      setLoading(true);
      try {
        // 1. Fetch real-time stock quote
        const stockData = await fetchStockQuote(ticker);
        setStock(stockData);

        // 2. Fetch AI analysis
        if (stockData) {
          const aiData = await fetchStockAnalysis(stockData);
          setAnalysis(aiData);
        }

        // 3. Check watchlist status
        const saved = await isInWatchlist(ticker);
        setInWatchlist(saved);
      } catch (err) {
        console.error('Failed to load analysis:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [ticker]);

  const handlePortfolioToggle = async () => {
    if (!ticker) return;
    setActionLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(ticker);
        setInWatchlist(false);
      } else {
        await addToWatchlist(ticker);
        setInWatchlist(true);
      }
    } catch (err) {
      console.error('Failed to update portfolio:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const radarData = useMemo(() => {
    if (!analysis) return [];
    return [
      { subject: 'Volatility', A: 70, B: stock?.changePercent ? Math.min(100, Math.abs(stock.changePercent) * 5) : 50 },
      { subject: 'Momentum', A: 80, B: analysis.dnaScore },
      { subject: 'Growth', A: 90, B: stock?.relevantMetrics.revenueGrowth || 60 },
      { subject: 'Sentiment', A: 60, B: (stock?.relevantMetrics.sentimentScore || 0) * 100 + 50 },
      { subject: 'Inst. Support', A: 50, B: (stock?.relevantMetrics.institutionalOwnership || 0) * 100 },
    ];
  }, [analysis, stock]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-6 text-xl font-bold text-white tracking-tight">AI Agent Analyzing {ticker}...</h2>
        <p className="text-slate-400 font-mono text-sm mt-2">Deep-scanning fundamentals & pattern matching...</p>
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="p-8 text-center bg-slate-900 rounded-xl border border-slate-800">
        <h2 className="text-xl font-bold text-white mb-2">Analysis Unavailable</h2>
        <p className="text-slate-400 mb-4">Could not retrieve real-time data for {ticker}. Please try again later.</p>
        <button onClick={() => navigate(-1)} className="text-indigo-400 hover:text-indigo-300 font-bold">Return to Discovery</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Top Navigation & Header */}
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to Discovery</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-5xl font-black text-white tracking-tighter font-mono">{stock.ticker}</h1>
            <Badge variant="neutral" className="text-xs">{stock.sector}</Badge>
            {analysis?.riskLevel && (analysis.riskLevel === 'High' || analysis.riskLevel === 'CRITICAL') && (
              <div className="flex items-center gap-1.5 px-2 py-1 bg-rose-500/10 border border-rose-500/20 rounded text-rose-400 animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-[10px] font-black uppercase tracking-widest font-mono">Risk Alert</span>
              </div>
            )}
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 uppercase font-mono">
               Step 3: Deep Dive
             </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-3xl font-mono text-slate-200">${stock.price.toFixed(3)}</span>
            <span className={clsx("flex items-center gap-1 font-mono font-bold px-2 py-1 rounded text-sm", 
              stock.changePercent > 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
              {stock.changePercent > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(stock.changePercent).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-2 text-sm font-medium">
            <Share2 className="w-4 h-4" /> Share Analysis
          </button>
          <button 
            onClick={handlePortfolioToggle}
            disabled={actionLoading}
            className={clsx(
              "px-6 py-2 rounded-lg shadow-lg font-bold transition-all flex items-center gap-2 disabled:opacity-50",
              inWatchlist 
                ? "bg-slate-800 border border-emerald-500/30 text-emerald-400" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
            )}
          >
            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 
             inWatchlist ? <CheckCircle2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {inWatchlist ? "In Portfolio" : "Add to Portfolio"}
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI Verdict & Reasoning (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI Verdict Card */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-indigo-500/30 shadow-2xl shadow-indigo-900/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">AI Growth DNA Analysis</span>
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    Verdict: <span className={clsx(
                      (analysis?.dnaScore || 0) > 70 ? "text-emerald-400" : "text-amber-400"
                    )}>{(analysis?.dnaScore || 0) > 70 ? "STRONG BUY" : "SPECULATIVE"}</span>
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-black text-white font-mono tracking-tighter">{analysis?.dnaScore || stock.dnaScore}</div>
                  <div className="text-xs text-slate-400 font-mono mt-1">/ 100 SCORE</div>
                </div>
              </div>

              <div className="bg-slate-950/50 rounded-xl p-6 border border-indigo-500/20 mb-8">
                <p className="text-lg text-slate-200 leading-relaxed font-medium">
                  "{analysis?.matchReasoning || "Loading reasoning..."}"
                </p>
                {analysis?.riskReason && (
                   <div className="mt-4 flex gap-2 items-start text-sm text-slate-400 border-t border-slate-800 pt-4">
                     <AlertTriangle className={clsx("w-4 h-4 mt-1", 
                       (analysis.riskLevel === 'High' || analysis.riskLevel === 'CRITICAL') ? "text-rose-400" : "text-amber-400"
                     )} />
                     <p><span className="font-bold text-slate-300">Risk Assessment:</span> {analysis.riskReason}</p>
                   </div>
                )}
              </div>

              {/* Bull vs Bear Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-5">
                  <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Bull Case (Why it could fly)
                  </h3>
                  <ul className="space-y-2">
                    {analysis?.bullCase.map((point, i) => (
                      <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>
                        {point}
                      </li>
                    ))}
                    {!analysis && <li className="text-slate-600 animate-pulse text-sm">Identifying bull signals...</li>}
                  </ul>
                </div>

                <div className="bg-rose-950/30 border border-rose-500/20 rounded-xl p-5">
                  <h3 className="text-rose-400 font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Bear Case (Risks)
                  </h3>
                  <ul className="space-y-2">
                    {analysis?.bearCase.map((point, i) => (
                      <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-rose-500 mt-1">•</span>
                        {point}
                      </li>
                    ))}
                    {!analysis && <li className="text-slate-600 animate-pulse text-sm">Evaluating risk factors...</li>}
                  </ul>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Visuals & Metrics (1/3 width) */}
        <div className="space-y-6">
          
          {/* Radar Chart Card */}
          <Card className="p-6 flex flex-col items-center justify-center min-h-[400px]">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 w-full text-center">
              DNA Pattern Matching
            </h3>
            <div className="w-full" style={{ height: 300, minHeight: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar
                    name="Benchmark (NVDA)"
                    dataKey="A"
                    stroke="#64748b"
                    strokeDasharray="4 4"
                    fill="#64748b"
                    fillOpacity={0.1}
                  />
                  <Radar
                    name="Target Stock"
                    dataKey="B"
                    stroke="#8b5cf6"
                    strokeWidth={3}
                    fill="#8b5cf6"
                    fillOpacity={0.4}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} 
                    iconType="circle"
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-center text-slate-500 mt-4">
              <span className="text-indigo-400 font-bold">Purple Area</span> indicates current stock potential.
              <br/>Matches {analysis?.dnaScore || stock.dnaScore}% with Growth DNA pattern.
            </p>
          </Card>

          {/* Quick Stats */}
          <Card className="p-5">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">
              Key Fundamentals
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-sm text-slate-500">Market Cap</span>
                <span className="text-sm font-mono text-white">{stock.marketCap}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-sm text-slate-500">Total Cash</span>
                <span className="text-sm font-mono text-white">{stock.relevantMetrics.totalCash || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-sm text-slate-500">Cash Runway</span>
                <span className={clsx(
                  "text-sm font-mono font-bold",
                  (stock.relevantMetrics.cashRunway || 0) < 6 ? "text-rose-400" : "text-emerald-400"
                )}>
                  {stock.relevantMetrics.cashRunway === 99 ? 'Profitable' : `${stock.relevantMetrics.cashRunway} Months`}
                  {analysis?.survivalRate === 'Critical' && ' ⚠️'}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-sm text-slate-500">Volume (24h)</span>
                <span className="text-sm font-mono text-emerald-400">
                  {stock.volume > 1000000 
                    ? `${(stock.volume / 1000000).toFixed(1)}M` 
                    : `${(stock.volume / 1000).toFixed(0)}k`} 
                  {stock.volume > 10000000 ? ' 🔥' : ''}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Sentiment</span>
                <span className={clsx(
                  "text-sm font-mono font-bold",
                  (stock.relevantMetrics.sentimentScore || 0) > 0 ? "text-emerald-400" : "text-slate-400"
                )}>
                  {stock.relevantMetrics.sentimentLabel || 'Neutral'}
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};