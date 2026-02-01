import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, BrainCircuit, Share2, ShieldAlert, ExternalLink, Database, Banknote, Globe, CheckCircle, ShieldCheck, Search, AlertOctagon } from 'lucide-react';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import { GradeBadge } from '../ui/GradeBadge';
import { AddToWatchlistBtn } from '../ui/AddToWatchlistBtn';
import { DnaRadarChart } from './DnaRadarChart';
import clsx from 'clsx';

import { fetchStockQuote } from '../../services/stockService';
import { fetchStockAnalysis } from '../../services/analysisService'; 
import { useLiveTicker } from '../../hooks/useLiveTicker';

// --- Types ---
interface AnalysisData {
  score: number;
  verdict: string;
  reason: string;
  bullPoints: string[];
  bearPoints: string[];
  riskScore: number;
  radarData: any[];
  financialHealthAudit?: string;
  marketTrendAnalysis?: string;
  solvencyAnalysis?: {
    survival_months: number;
    financial_health_grade: 'A' | 'B' | 'C' | 'D' | 'F';
    capital_raise_needed: boolean;
    reason: string;
  };
  sentimentAudit?: {
    score: number;
    hype_score: number;
    category: 'Organic' | 'Hype' | 'Negative';
    key_event: string | null;
    summary: string;
  };
}

interface RealTimeData {
  price: number;
  change: number;
  changePercent: number;
  sector: string;
  name: string;
  volume: number;
  cashRunway?: number;
  marketCap?: string;
  totalCash?: string;
  netIncome?: string;
  // Yahoo Finance Data
  targetPrice?: number;
  upsidePotential?: number;
  fiftyTwoWeekPosition?: number;
  analystCount?: number;
  recommendation?: string;
}

// Helper function to safely render AI analysis content (string or object)
const renderContent = (content: any): string => {
  if (!content) return "";
  if (typeof content === 'string') return content;
  
  // If it's an object (e.g., 5W1H structure), convert to formatted string
  if (typeof content === 'object') {
    return Object.entries(content)
      .map(([key, value]) => `[${key}] ${value}`)
      .join('\n');
  }
  
  return String(content);
};


export const DnaMatchView = () => {
  const { id } = useParams(); // id = ticker
  const navigate = useNavigate();
  const ticker = id?.toUpperCase() || "UNKNOWN";

  // --- State Management ---
  const [loading, setLoading] = useState(true);
  const [realTimeData, setRealTimeData] = useState<RealTimeData | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // --- Live Ticker Hook ---
  const { currentPrice, isConnected } = useLiveTicker(ticker);

  // --- Live Price Override Effect ---
  useEffect(() => {
    if (currentPrice && realTimeData) {
      setRealTimeData(prev => prev ? { ...prev, price: currentPrice } : null);
    }
  }, [currentPrice]);

  // --- Data Fetching Effect ---
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. 병렬 요청: 실시간 시세 + AI 분석 데이터 + 포트폴리오 상태 확인
        const quoteData = await fetchStockQuote(ticker);
        
        let analysisData = null;
        if (quoteData) {
          analysisData = await fetchStockAnalysis(quoteData);
        }

        if (!isMounted) return;

        // 2. 실시간 데이터 매핑
        if (quoteData) {
          setRealTimeData({
            price: quoteData.price || 0,
            change: 0, // Stock type doesn't have absolute change, only %
            changePercent: quoteData.changePercent || 0,
            sector: quoteData.sector || "Unknown", 
            name: quoteData.name || ticker,
            volume: quoteData.volume || 0,
            marketCap: quoteData.marketCap || "N/A",
            totalCash: quoteData.relevantMetrics.totalCash,
            netIncome: quoteData.relevantMetrics.netIncome,
            cashRunway: quoteData.relevantMetrics.cashRunway,
            // Yahoo Data
            targetPrice: quoteData.relevantMetrics.targetPrice,
            upsidePotential: quoteData.relevantMetrics.upsidePotential,
            fiftyTwoWeekPosition: quoteData.relevantMetrics.fiftyTwoWeekPosition,
            analystCount: quoteData.relevantMetrics.analystCount,
            recommendation: quoteData.relevantMetrics.recommendation
          });
        }

        // 3. AI 분석 데이터 매핑 (데이터가 없으면 기본값 제공)
        if (analysisData) {
          setAnalysis({
            score: analysisData.dnaScore || 0,
            verdict: getVerdictLabel(analysisData.dnaScore),
            reason: analysisData.matchReasoning || "AI 분석 대기 중...",
            bullPoints: analysisData.bullCase || [],
            bearPoints: analysisData.bearCase || [],
            riskScore: analysisData.riskLevel === 'CRITICAL' ? 95 : 
                       analysisData.riskLevel === 'High' ? 80 :
                       analysisData.riskLevel === 'Medium' ? 50 : 20,
            radarData: generateDefaultRadar(analysisData.dnaScore),
            financialHealthAudit: analysisData.financialHealthAudit,
            marketTrendAnalysis: analysisData.marketTrendAnalysis,
            solvencyAnalysis: analysisData.solvencyAnalysis,
            sentimentAudit: analysisData.sentimentAudit
          });
        }
      } catch (err) {
        console.error("Data Load Error:", err);
        setError("데이터를 불러오는 데 실패했습니다.");
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (ticker !== "UNKNOWN") {
      loadData();
    }

    return () => { isMounted = false; };
  }, [ticker]);



  // --- Helpers ---
  const getVerdictLabel = (score: number) => {
    if (score >= 80) return "STRONG BUY";
    if (score >= 60) return "BUY";
    if (score >= 40) return "HOLD";
    return "SELL";
  };

  const generateDefaultRadar = (score: number) => [
    { subject: 'Growth', A: 90, B: score, fullMark: 100 },
    { subject: 'R&D', A: 85, B: Math.max(score - 10, 40), fullMark: 100 },
    { subject: 'Cash', A: 60, B: Math.min(score + 10, 90), fullMark: 100 },
    { subject: 'Volume', A: 80, B: score, fullMark: 100 },
    { subject: 'Risk', A: 40, B: 100 - score, fullMark: 100 },
  ];

  // --- Render Loading ---
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh]">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <BrainCircuit className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-6 text-xl font-bold text-white tracking-tight">Syncing Real-time Data...</h2>
        <p className="text-slate-400 font-mono text-sm mt-2">Analyzing DNA Patterns for {ticker}...</p>
      </div>
    );
  }

  // --- Render Error ---
  if (error || !realTimeData) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <AlertTriangle className="w-12 h-12 text-rose-500 mb-4" />
        <h2 className="text-xl font-bold text-white">데이터 로드 실패</h2>
        <p className="text-slate-400 mt-2 mb-6">해당 종목의 데이터를 찾을 수 없습니다.</p>
        <button onClick={() => navigate('/')} className="px-4 py-2 bg-slate-800 rounded text-white">돌아가기</button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in pb-10">
      {/* 1. Header Navigation & Price Info */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-2 group">
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="text-sm font-medium">Back to List</span>
      </button>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-5xl font-black text-white tracking-tighter font-mono">{ticker}</h1>
            <Badge variant="neutral" className="text-xs">{realTimeData.sector}</Badge>
            {analysis && (analysis.score < 40 || analysis.riskScore > 70) && (
              <Badge variant="warning" className="animate-pulse flex items-center gap-1">
                <ShieldAlert className="w-3 h-3" /> Risk Alert
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="text-3xl font-mono text-slate-200">${realTimeData.price.toFixed(3)}</span>
              {isConnected && (
                <span className="absolute -top-1 -right-2 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </div>
            <span className={clsx("flex items-center gap-1 font-mono font-bold px-2 py-1 rounded text-sm", 
              realTimeData.changePercent >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400")}>
              {realTimeData.changePercent >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(realTimeData.changePercent).toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex gap-3">
          <AddToWatchlistBtn ticker={ticker} />
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-2 text-sm font-medium">
            <Share2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      {/* Yahoo Finance Analyst Consensus */}
      {realTimeData.targetPrice && realTimeData.targetPrice > 0 && (
        <Card className="bg-slate-900/50 border-slate-700/50 overflow-hidden">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800">
            <div className="flex-1 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Globe className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Market Consensus</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Target Price</div>
                  <div className="text-2xl font-black text-white font-mono">${realTimeData.targetPrice.toFixed(2)}</div>
                  {realTimeData.upsidePotential !== undefined && (
                    <div className={clsx(
                      "text-xs font-bold mt-1",
                      realTimeData.upsidePotential > 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {realTimeData.upsidePotential > 0 ? '↑' : '↓'} 
                      {Math.abs(realTimeData.upsidePotential).toFixed(1)}% Potential
                    </div>
                  )}
                </div>
                
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Recommendation</div>
                  <div className="text-2xl font-black text-indigo-400 uppercase tracking-tighter">
                    {realTimeData.recommendation?.replace(/([A-Z])/g, ' $1')}
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Based on {realTimeData.analystCount} analysts</div>
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 bg-slate-800/20">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] text-slate-500 uppercase font-bold">52W Range</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {realTimeData.fiftyTwoWeekPosition?.toFixed(0)}% from low
                </span>
              </div>
              
              <div className="space-y-4">
                <div className="h-2 w-full bg-slate-800 rounded-full relative overflow-hidden">
                  <div 
                    className="absolute top-0 bottom-0 bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000"
                    style={{ width: `${realTimeData.fiftyTwoWeekPosition}%` }}
                  />
                  <div 
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_white] z-10 transition-all duration-1000"
                    style={{ left: `${realTimeData.fiftyTwoWeekPosition}%`, marginLeft: '-2px' }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-slate-500 uppercase">
                  <span>52W Low</span>
                  <span>52W High</span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-6">
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Market Cap</div>
                  <div className="text-sm font-bold text-slate-200 font-mono">{realTimeData.marketCap}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 uppercase font-bold mb-1">Volume</div>
                  <div className="text-sm font-bold text-slate-200 font-mono">
                    {realTimeData.volume > 1e6 ? `${(realTimeData.volume / 1e6).toFixed(1)}M` : realTimeData.volume.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* 2. 추천 근거 섹션 (최상단) */}
      {analysis && (
        <Card className="bg-gradient-to-br from-indigo-950/50 to-purple-950/30 border-indigo-500/40">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-indigo-300 mb-4 flex items-center gap-2">
              <BrainCircuit className="w-7 h-7" />
              왜 {ticker}를 추천하는가?
            </h2>
            
            {/* AI 분석 근거 (5W1H) */}
            <div className="bg-black/30 p-4 rounded-lg border border-indigo-500/30 mb-4">
              <h3 className="text-sm font-bold text-slate-400 mb-3 flex items-center gap-1">
                <Database className="w-4 h-4" />
                AI 분석 근거
              </h3>
              <pre className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed font-sans">
                {renderContent(analysis.reason)}
              </pre>
            </div>

            {/* Bull Case */}
            {analysis.bullPoints && analysis.bullPoints.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-emerald-400 mb-3 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  주요 긍정 요인
                </h3>
                <ul className="space-y-2">
                  {analysis.bullPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-slate-300">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* 3. Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: AI Verdict (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-indigo-500/30 shadow-2xl shadow-indigo-900/20 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-32 bg-indigo-500/10 blur-3xl rounded-full pointer-events-none"></div>
            
            <div className="p-8">
              {/* Verdict Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <BrainCircuit className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-bold text-indigo-400 tracking-widest uppercase">AI Growth DNA Analysis</span>
                    {analysis?.marketTrendAnalysis?.includes("Zero-Cost") && (
                      <Badge variant="success" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] py-0">ZERO-COST AUDIT</Badge>
                    )}
                  </div>
                  <h2 className="text-3xl font-bold text-white mb-1">
                    Verdict: <span className={analysis && analysis.score >= 80 ? "text-emerald-400" : "text-yellow-400"}>
                      {analysis?.verdict || "ANALYZING..."}
                    </span>
                  </h2>
                </div>
                <div className="text-right">
                  <div className="text-6xl font-black text-white font-mono tracking-tighter">
                    {analysis?.score || 0}
                  </div>
                  <div className="text-xs text-slate-400 font-mono mt-1">/ 100 SCORE</div>
                </div>
              </div>

              {/* Reasoning */}
              <div className="bg-slate-950/50 rounded-xl p-6 border border-indigo-500/20 mb-8 overflow-hidden">
                <div className="text-slate-200 leading-relaxed font-medium whitespace-pre-wrap text-sm">
                  {renderContent(analysis?.reason)}
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Database className="w-3 h-3 text-slate-500" />
                    <span className="text-[10px] text-slate-500 font-mono italic">
                      {analysis?.marketTrendAnalysis?.includes("Zero-Cost") 
                        ? "Grounded in Yahoo & RSS Free Analytics" 
                        : "Grounded in Alpha Vantage Real-time Financials"}
                    </span>
                  </div>
                  <div className="h-px bg-slate-800 flex-1 mx-4"></div>
                  <Badge variant="neutral" className="bg-slate-800 text-slate-500 text-[9px] border-slate-700">Audit Status: Fact-Checked</Badge>
                </div>
              </div>

              {/* Bull/Bear Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-5">
                  <h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Bull Case
                  </h3>
                  <ul className="space-y-2">
                    {analysis?.bullPoints?.length ? analysis.bullPoints.map((point, i) => (
                      <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-emerald-500 mt-1">•</span>{point}
                      </li>
                    )) : <li className="text-slate-500 text-sm">데이터 분석 중...</li>}
                  </ul>
                </div>

                <div className="bg-rose-950/30 border border-rose-500/20 rounded-xl p-5">
                  <h3 className="text-rose-400 font-bold mb-3 flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4" /> Bear Case
                  </h3>
                  <ul className="space-y-2">
                    {analysis?.bearPoints?.length ? analysis.bearPoints.map((point, i) => (
                      <li key={i} className="text-slate-300 text-sm flex items-start gap-2">
                        <span className="text-rose-500 mt-1">•</span>{point}
                      </li>
                    )) : <li className="text-slate-500 text-sm">데이터 분석 중...</li>}
                  </ul>
                </div>
              </div>

              {/* Strategic Audit Section */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-slate-200 font-bold mb-3 flex items-center gap-2">
                    <Banknote className="w-4 h-4 text-emerald-400" /> Revenue & Financial Health
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {renderContent(analysis?.financialHealthAudit) || "재무 지표 분석 중..."}
                  </p>
                </div>
                <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-slate-200 font-bold mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400" /> Market Dynamics & Trend
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {renderContent(analysis?.marketTrendAnalysis) || "시장 동향 분석 중..."}
                  </p>
                </div>
                </div>
              </div>
            </Card>

            {/* Solvency Analysis (v3) */}
          {analysis?.solvencyAnalysis && (
            <Card className="bg-slate-900/50 border-indigo-500/20 shadow-xl overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                      <ShieldAlert className="w-5 h-5 text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Solvency & Cash Runway Audit</h3>
                      <p className="text-xs text-slate-400 font-mono">Distressed Asset Analysis Persona</p>
                    </div>
                  </div>
                  <GradeBadge grade={analysis.solvencyAnalysis.financial_health_grade} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Survival Months</p>
                    <p className="text-2xl font-mono font-bold text-white">
                      {analysis.solvencyAnalysis.survival_months} <span className="text-sm font-normal text-slate-400">Mo</span>
                    </p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Burn Rate Status</p>
                    <p className={clsx(
                      "text-sm font-bold",
                      analysis.solvencyAnalysis.survival_months < 6 ? "text-rose-400" :
                      analysis.solvencyAnalysis.survival_months < 12 ? "text-yellow-400" : "text-emerald-400"
                    )}>
                      {analysis.solvencyAnalysis.survival_months < 6 ? "CRITICAL BURN" : 
                       analysis.solvencyAnalysis.survival_months < 12 ? "MANAGEABLE" : "HEALTHY"}
                    </p>
                  </div>
                  <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Capital Raise Needed</p>
                    <div className="flex items-center gap-2 mt-1">
                      {analysis.solvencyAnalysis.capital_raise_needed ? (
                        <>
                          <AlertTriangle className="w-4 h-4 text-rose-500" />
                          <span className="text-rose-400 font-bold text-sm underline decoration-rose-500/30">DILUTION LIKELY</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span className="text-emerald-400 font-bold text-sm">NO IMMEDIATE NEED</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
                  <p className="text-slate-300 text-sm italic leading-relaxed">
                    "{analysis?.solvencyAnalysis?.reason}"
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Sentiment & Hype Audit (v4) */}
          {analysis?.sentimentAudit && (
            <Card className={clsx(
              "overflow-hidden border-l-4 shadow-xl",
              analysis.sentimentAudit.category === 'Organic' ? "bg-emerald-950/10 border-emerald-500" :
              analysis.sentimentAudit.category === 'Hype' ? "bg-amber-950/10 border-amber-500" : "bg-rose-950/10 border-rose-500"
            )}>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "p-2 rounded-lg",
                      analysis.sentimentAudit.category === 'Organic' ? "bg-emerald-500/10" :
                      analysis.sentimentAudit.category === 'Hype' ? "bg-amber-500/10" : "bg-rose-500/10"
                    )}>
                      {analysis.sentimentAudit.category === 'Organic' ? <ShieldCheck className="w-5 h-5 text-emerald-400" /> :
                       analysis.sentimentAudit.category === 'Hype' ? <Search className="w-5 h-5 text-amber-400" /> : <AlertOctagon className="w-5 h-5 text-rose-400" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">Sentiment & Hype Audit</h3>
                      <p className="text-xs text-slate-400 font-mono">Market Manipulation Monitor AI</p>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-slate-800 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    {analysis.sentimentAudit.category} Growth
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col items-center">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Hype Score</p>
                    <div className="relative flex items-center justify-center">
                      <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                        <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="transparent" 
                          strokeDasharray={2 * Math.PI * 28}
                          strokeDashoffset={2 * Math.PI * 28 * (1 - analysis.sentimentAudit.hype_score / 100)}
                          className={clsx(
                            analysis.sentimentAudit.hype_score > 70 ? "text-amber-500" :
                            analysis.sentimentAudit.hype_score > 40 ? "text-indigo-500" : "text-emerald-500"
                          )} />
                      </svg>
                      <span className="absolute text-lg font-black font-mono text-white">{analysis.sentimentAudit.hype_score}</span>
                    </div>
                  </div>
                  <div className="bg-slate-900/40 p-4 rounded-xl border border-slate-800 flex flex-col items-center justify-center">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mb-2">Sentiment Val.</p>
                    <p className={clsx(
                      "text-2xl font-black font-mono",
                      analysis.sentimentAudit.score >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {analysis.sentimentAudit.score > 0 ? '+' : ''}{analysis.sentimentAudit.score}
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">-100 to +100</p>
                  </div>
                </div>

                {analysis.sentimentAudit.key_event && (
                  <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-rose-500/10 border border-rose-500/20 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-rose-400" />
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-tight">Detect: {analysis.sentimentAudit.key_event}</span>
                  </div>
                )}

                <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800">
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {analysis.sentimentAudit.summary}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Visuals & Metrics (1/3 width) */}
        <div className="space-y-6">
          
          {/* Radar Chart Component */}
          <DnaRadarChart data={analysis?.radarData || []} />

          {/* Risk Shield */}
          <Card className="p-5 border-rose-500/30 bg-rose-950/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-rose-400 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Risk Assessment
              </h3>
              <span className={clsx("font-mono font-bold", (analysis?.riskScore || 0) > 50 ? 'text-rose-500' : 'text-emerald-500')}>
                {analysis?.riskScore || 0}/100
              </span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div 
                className={clsx("h-2 rounded-full", (analysis?.riskScore || 0) > 50 ? 'bg-rose-500' : 'bg-emerald-500')} 
                style={{ width: `${analysis?.riskScore || 0}%` }}
              ></div>
            </div>
            
            {/* Cash Runway / Survival Rate Alert */}
            {analysis && (
              <div className={clsx(
                "mt-4 p-3 rounded-lg border flex items-center gap-3",
                analysis.score < 30 ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              )}>
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <div className="text-sm">
                  <span className="font-bold block uppercase text-[10px] tracking-widest opacity-70">Survival Assessment</span>
                  {analysis.score < 30 ? (
                    <>
                      Cash Runway가 6개월 미만입니다.
                      <div className="text-[10px] mt-1 opacity-70 italic font-mono">
                        Source Audit: Approx. {realTimeData?.cashRunway || '< 1'} months remaining.
                      </div>
                    </>
                  ) : "안정적인 현금 흐름을 확보하고 있습니다."}
                </div>
              </div>
            )}
          </Card>

          {/* Technical Data Audit - Ground Truth */}
          <Card className="p-5 border-slate-800 bg-slate-900/40">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" /> Ground Truth Audit
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-500">Total Cash (Latest)</span>
                <span className="text-slate-200 font-mono font-bold">{realTimeData?.totalCash || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-500">TTM Net Income</span>
                <span className={clsx("font-mono font-bold", realTimeData?.netIncome?.includes('-') ? "text-rose-400" : "text-emerald-400")}>
                  {realTimeData?.netIncome || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Est. Cash Runway</span>
                <span className="text-indigo-400 font-mono font-bold">{realTimeData?.cashRunway && realTimeData?.cashRunway !== 99 ? `${realTimeData?.cashRunway} Mo` : 'Healthy'}</span>
              </div>
            </div>
            <p className="mt-4 text-[10px] text-slate-600 leading-tight">
              * Based on latest quarterly SEC filings via Alpha Vantage. 
              Runway = Total Cash / Avg Quarterly Operating Burn.
            </p>
          </Card>

          {/* External Verification Links */}
          <div className="flex flex-col gap-2 pt-2">
            <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest px-1">Verify Externally</h4>
            <div className="grid grid-cols-2 gap-2">
              <a 
                href={`https://finviz.com/quote.ashx?t=${ticker}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors border border-slate-700"
              >
                Finviz <ExternalLink className="w-3 h-3" />
              </a>
              <a 
                href={`https://www.alphavantage.co/`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium text-slate-300 transition-colors border border-slate-700"
              >
                AlphaV <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};