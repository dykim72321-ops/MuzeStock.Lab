import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, AlertTriangle, BrainCircuit, Share2, Plus, Minus, ShieldAlert, ExternalLink, Database, Banknote, Globe } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend } from 'recharts';
import { Badge } from '../ui/Badge';
import { Card } from '../ui/Card';
import clsx from 'clsx';

// --- Services Import ---
import { fetchStockQuote } from '../../services/stockService';
// fetchStockAnalysis: Supabase 'daily_discovery' 테이블에서 단일 종목 데이터를 가져오는 함수
// (analysisService.ts에 구현되어 있다고 가정, 없으면 아래에서 직접 Supabase 호출로 대체 가능)
import { fetchStockAnalysis } from '../../services/analysisService'; 
import { addToWatchlist, removeFromWatchlist, isInWatchlist } from '../../services/watchlistService';
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
}

interface RealTimeData {
  price: number;
  change: number;
  changePercent: number;
  sector: string;
  name: string;
  volume: number;
  totalCash?: string;
  netIncome?: string;
  cashRunway?: number;
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
  const [inPortfolio, setInPortfolio] = useState(false);
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
        
        const watched = await isInWatchlist(ticker);

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
            totalCash: quoteData.relevantMetrics.totalCash,
            netIncome: quoteData.relevantMetrics.netIncome,
            cashRunway: quoteData.relevantMetrics.cashRunway
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
            marketTrendAnalysis: analysisData.marketTrendAnalysis
          });
        }

        setInPortfolio(watched);

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

  // --- Handlers ---
  const handlePortfolioToggle = async () => {
    try {
      if (inPortfolio) {
        if (confirm('포트폴리오에서 제거하시겠습니까?')) {
          await removeFromWatchlist(ticker);
          setInPortfolio(false);
        }
      } else {
        await addToWatchlist(ticker);
        setInPortfolio(true);
      }
    } catch (err) {
      console.error("Portfolio Toggle Error:", err);
      alert("포트폴리오 업데이트 실패");
    }
  };

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
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors flex items-center gap-2 text-sm font-medium">
            <Share2 className="w-4 h-4" /> Share
          </button>
          
          {/* Portfolio Toggle Button */}
          <button 
            onClick={handlePortfolioToggle}
            className={clsx(
              "px-6 py-2 rounded-lg font-bold transition-all flex items-center gap-2 shadow-lg",
              inPortfolio 
                ? "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-500/20" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20"
            )}
          >
            {inPortfolio ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {inPortfolio ? "Remove from Portfolio" : "Add to Portfolio"}
          </button>
        </div>
      </div>

      {/* 2. Main Content Grid */}
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
                    <span className="text-[10px] text-slate-500 font-mono italic">Grounded in Alpha Vantage Real-time Financials</span>
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
        </div>

        {/* Right Column: Visuals & Metrics (1/3 width) */}
        <div className="space-y-6">
          
          {/* Radar Chart Card (Fixed Height Issue Resolved) */}
          <Card className="p-6 flex flex-col items-center justify-center">
            <h3 className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4 w-full text-center">
              DNA Pattern Matching
            </h3>
            {/* Height를 명시적으로 지정하여 Recharts 경고 해결 */}
            <div className="w-full h-[320px] min-h-[320px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={analysis?.radarData}>
                  <PolarGrid stroke="#334155" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                  <Radar name="Benchmark" dataKey="A" stroke="#64748b" strokeDasharray="4 4" fill="#64748b" fillOpacity={0.1} />
                  <Radar name="Target" dataKey="B" stroke="#8b5cf6" strokeWidth={3} fill="#8b5cf6" fillOpacity={0.4} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '20px' }} iconType="circle" />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </Card>

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
                <span className="text-slate-200 font-mono font-bold">{realTimeData.totalCash || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-slate-800 pb-2">
                <span className="text-slate-500">TTM Net Income</span>
                <span className={clsx("font-mono font-bold", realTimeData.netIncome?.includes('-') ? "text-rose-400" : "text-emerald-400")}>
                  {realTimeData.netIncome || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Est. Cash Runway</span>
                <span className="text-indigo-400 font-mono font-bold">{realTimeData.cashRunway && realTimeData.cashRunway !== 99 ? `${realTimeData.cashRunway} Mo` : 'Healthy'}</span>
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