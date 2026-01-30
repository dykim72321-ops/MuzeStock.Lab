import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Brain, Download, CheckCircle2, AlertCircle, Loader2, Star, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { ComparisonChart } from './ComparisonChart';
import { MOCK_BENCHMARK, getStockHistory } from '../../data/mockData';
import { fetchStockQuote } from '../../services/stockService';
import type { Stock } from '../../types';
import clsx from 'clsx';
import { addToWatchlist, isInWatchlist, removeFromWatchlist } from '../../services/watchlistService';

import { fetchStockAnalysis, type AIAnalysis } from '../../services/analysisService';

export const DnaMatchView = () => {
  const { id } = useParams(); // Now id is the ticker symbol
  const [stock, setStock] = useState<Stock | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [analysisLoading, setAnalysisLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);

  const benchmark = MOCK_BENCHMARK;

  const loadAIAnalysis = async (stockData: Stock) => {
    setAnalysisLoading(true);
    setAnalysis(null);
    try {
      const aiResult = await fetchStockAnalysis(stockData);
      if (aiResult) {
        setAnalysis(aiResult);
        setStock(prev => prev ? { ...prev, dnaScore: aiResult.dnaScore } : null);
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
    } finally {
      setAnalysisLoading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const [stockData, favoriteStatus] = await Promise.all([
          fetchStockQuote(id.toUpperCase()),
          isInWatchlist(id.toUpperCase())
        ]);
        setStock(stockData);
        setInWatchlist(favoriteStatus);

        // Fetch AI Analysis separately to not block main UI
        if (stockData) {
          loadAIAnalysis(stockData);
        }
      } catch (err) {
        console.error('Failed to fetch stock:', err);
        setAnalysisLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  const handleToggleWatchlist = async () => {
    if (!stock) return;
    setWatchlistLoading(true);
    try {
      if (inWatchlist) {
        await removeFromWatchlist(stock.ticker);
        setInWatchlist(false);
      } else {
        await addToWatchlist(stock.ticker);
        setInWatchlist(true);
      }
    } catch (err) {
      console.error('Failed to toggle watchlist:', err);
    } finally {
      setWatchlistLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-40">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!stock) {
    return (
      <div className="text-center py-20">
        <p className="text-slate-400">주식을 찾을 수 없습니다: {id}</p>
        <Link to="/" className="text-indigo-400 hover:underline mt-4 inline-block">
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  const history = getStockHistory(stock.ticker);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link to="/" className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            {stock.name} <span className="text-slate-500 font-normal">({stock.ticker})</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <Badge variant={stock.relevantMetrics.sentimentScore && stock.relevantMetrics.sentimentScore > 0 ? 'success' : 'neutral'}>
                Social Pulse: {stock.relevantMetrics.sentimentLabel || 'Neutral'}
             </Badge>
             <Badge variant="neutral">
                🐳 기관 보유: {stock.relevantMetrics.institutionalOwnership ? `${stock.relevantMetrics.institutionalOwnership}%` : 'N/A'}
             </Badge>
          </div>
        </div>
        <div className="ml-auto flex gap-2">
          <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" /> 리포트 내보내기
          </button>
          <button 
            onClick={handleToggleWatchlist}
            disabled={watchlistLoading}
            className={clsx(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              inWatchlist 
                ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/20" 
                : "bg-indigo-600 hover:bg-indigo-500 text-white"
            )}
          >
            {watchlistLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className={clsx("w-4 h-4", inWatchlist && "fill-current")} />}
            {inWatchlist ? '모니터링 중' : '관심 종목 추가'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Match Score & Chart */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold text-white">성장 DNA 매치</h2>
                <p className="text-sm text-slate-400">가격 변동 및 펀더멘털 비교</p>
              </div>
              <div className="flex items-center gap-3">
                 <div className="text-right">
                    <div className="text-xs text-slate-500 uppercase font-bold">매치 점수</div>
                    <div className="text-3xl font-bold text-emerald-400">{stock.dnaScore}%</div>
                 </div>
                 <div className="h-12 w-12 rounded-full border-4 border-emerald-500/30 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-emerald-400" />
                 </div>
              </div>
            </div>

            <ComparisonChart 
               currentData={history}
               benchmarkData={benchmark.historicalData}
               currentName={stock.ticker}
               benchmarkName={benchmark.name}
            />
            
            <div className="mt-4 flex justify-center gap-6 text-sm">
               <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-emerald-500 rounded-full"></span>
                  <span className="text-slate-300">{stock.ticker} (현재)</span>
               </div>
               <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-indigo-500 rounded-full opacity-50"></span>
                  <span className="text-slate-300">{benchmark.name} (과거)</span>
               </div>
            </div>
          </Card>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
             <Card className="p-4 bg-slate-900/50 border-slate-800">
                <div className="text-xs text-slate-500 uppercase mb-1">PER (주가수익비율)</div>
                <div className="text-lg font-bold text-white">{stock.relevantMetrics.peRatio ? stock.relevantMetrics.peRatio.toFixed(2) : '-'}</div>
                <div className="text-xs text-slate-400 mt-1">valuation</div>
             </Card>
             <Card className="p-4 bg-slate-900/50 border-slate-800">
                <div className="text-xs text-slate-500 uppercase mb-1">EPS (주당순이익)</div>
                <div className="text-lg font-bold text-white">${stock.relevantMetrics.eps ? stock.relevantMetrics.eps.toFixed(2) : '-'}</div>
                <div className="text-xs text-slate-400 mt-1">earnings</div>
             </Card>
             <Card className="p-4 bg-slate-900/50 border-slate-800">
                <div className="text-xs text-slate-500 uppercase mb-1">영업 이익률</div>
                <div className="text-lg font-bold text-white">{stock.relevantMetrics.operatingMargin ? `${(stock.relevantMetrics.operatingMargin * 100).toFixed(1)}%` : '-'}</div>
                <div className="text-xs text-slate-400 mt-1">efficiency</div>
             </Card>
             <Card className="p-4 bg-slate-900/50 border-slate-800">
                <div className="text-xs text-slate-500 uppercase mb-1">연간 매출 (TTM)</div>
                <div className="text-lg font-bold text-white">{stock.relevantMetrics.revenue ? `$${(stock.relevantMetrics.revenue / 1000000000).toFixed(1)}B` : '-'}</div>
                <div className="text-xs text-slate-400 mt-1">revenue</div>
             </Card>
          </div>

        
        {/* Additional Stats Row */}
          <div className="grid grid-cols-3 gap-4">
              <Card className="p-4 bg-slate-900/50 border-slate-800">
                 <div className="text-xs text-slate-500 uppercase mb-1">R&D 비율</div>
                 <div className="text-xl font-bold text-white">{stock.relevantMetrics.rndRatio}%</div>
                 <div className="text-xs text-emerald-400 mt-1">벤치마크 대비 +5%</div>
              </Card>
              <Card className="p-4 bg-slate-900/50 border-slate-800">
                 <div className="text-xs text-slate-500 uppercase mb-1">부채 비율</div>
                 <div className="text-xl font-bold text-white">{stock.relevantMetrics.debtToEquity}</div>
                 <div className="text-xs text-indigo-400 mt-1">최적 범위</div>
              </Card>
              <Card className="p-4 bg-slate-900/50 border-slate-800">
                 <div className="text-xs text-slate-500 uppercase mb-1">매출 성장률</div>
                 <div className="text-xl font-bold text-white">{stock.relevantMetrics.revenueGrowth ? stock.relevantMetrics.revenueGrowth.toFixed(1) : '-'}%</div>
                 <div className="text-xs text-emerald-400 mt-1">가속화 중</div>
              </Card>
           </div>

           {/* Market Signals Dashboard */}
           <div className="grid grid-cols-2 gap-4 mt-4">
              {/* Sentiment Meter */}
              <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 border-indigo-500/30">
                 <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-indigo-300">📊 시장 심리 지수</div>
                    <Badge variant={stock.relevantMetrics.sentimentScore && stock.relevantMetrics.sentimentScore > 0 ? 'success' : stock.relevantMetrics.sentimentScore && stock.relevantMetrics.sentimentScore < 0 ? 'warning' : 'neutral'}>
                       {stock.relevantMetrics.sentimentLabel || 'Neutral'}
                    </Badge>
                 </div>
                 <div className="relative h-4 bg-slate-700 rounded-full overflow-hidden">
                    <div 
                       className={clsx(
                          "absolute h-full rounded-full transition-all duration-500",
                          stock.relevantMetrics.sentimentScore && stock.relevantMetrics.sentimentScore > 0.2 ? 'bg-emerald-500' : 
                          stock.relevantMetrics.sentimentScore && stock.relevantMetrics.sentimentScore < -0.2 ? 'bg-rose-500' : 'bg-amber-500'
                       )}
                       style={{ width: `${Math.min(100, Math.max(0, ((stock.relevantMetrics.sentimentScore || 0) + 1) * 50))}%` }}
                    />
                 </div>
                 <div className="flex justify-between text-xs text-slate-500 mt-2">
                    <span>매우 부정</span>
                    <span>중립</span>
                    <span>매우 긍정</span>
                 </div>
              </Card>

              {/* Whale Tracker Widget */}
              <Card className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 border-cyan-500/30">
                 <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold text-cyan-300">🐳 고래 수급 현황</div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="text-4xl font-bold text-white">
                       {stock.relevantMetrics.institutionalOwnership ? `${stock.relevantMetrics.institutionalOwnership}%` : 'N/A'}
                    </div>
                    <div className="flex-1">
                       <div className="text-xs text-slate-400">기관 보유 비율</div>
                       <div className="text-sm text-cyan-400 mt-1 truncate">
                          Top: {stock.relevantMetrics.topInstitution || 'N/A'}
                       </div>
                    </div>
                 </div>
                 <div className="mt-3 text-xs text-slate-500">
                    기관 투자자의 매집은 장기적 신뢰도의 지표입니다.
                 </div>
              </Card>
           </div>
         </div>

        {/* Right Col: AI Analysis */}
        <div className="space-y-6">
           <Card className="p-6 h-full flex flex-col bg-slate-900 border-indigo-500/20 shadow-[0_0_20px_-10px_rgba(99,102,241,0.3)]">
              <div className="flex items-center justify-between mb-6 border-b border-indigo-500/20 pb-4">
                 <div className="flex items-center gap-2">
                   <Brain className="w-5 h-5 text-indigo-400" />
                   <h2 className="font-semibold text-indigo-100">AI 분석 노트</h2>
                 </div>
                 {analysisLoading && <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />}
              </div>
              
              <div className={clsx("flex-1", analysisLoading && "opacity-50 animate-pulse")}>
                 {analysis ? (
                   <>
                     <div className="bg-slate-800/50 p-4 rounded-lg mb-6 border border-slate-700 relative">
                        <div className="absolute -top-3 left-4 px-2 bg-slate-900 text-xs text-indigo-300 border border-indigo-500/30 rounded">
                            패턴 인식
                        </div>
                        <p className="text-slate-300 leading-relaxed italic">
                           "{analysis.matchReasoning}"
                        </p>
                     </div>

                     <div className="space-y-4">
                        <div>
                           <h3 className="text-emerald-400 font-medium flex items-center gap-2 mb-2">
                              <CheckCircle2 className="w-4 h-4" /> 낙관적 전망 (Bull Case)
                           </h3>
                           <ul className="space-y-2">
                              {analysis.bullCase.map((item, i) => (
                                 <li key={i} className="text-slate-400 pl-4 border-l-2 border-emerald-500/20 text-xs">
                                    {item}
                                 </li>
                              ))}
                           </ul>
                        </div>

                        <div>
                           <h3 className="text-rose-400 font-medium flex items-center gap-2 mb-2">
                              <AlertCircle className="w-4 h-4" /> 비관적 전망 (Bear Case)
                           </h3>
                           <ul className="space-y-2">
                              {analysis.bearCase.map((item, i) => (
                                 <li key={i} className="text-slate-400 pl-4 border-l-2 border-rose-500/20 text-xs">
                                    {item}
                                 </li>
                              ))}
                           </ul>
                        </div>
                     </div>
                   </>
                 ) : !analysisLoading && (
                   <div className="flex flex-col items-center justify-center py-10 text-center h-full">
                     <AlertTriangle className="w-10 h-10 text-amber-500 mb-3 opacity-80" />
                     <h3 className="text-slate-300 font-medium mb-1">AI 분석을 불러올 수 없습니다</h3>
                     <p className="text-slate-500 text-xs mb-4 max-w-[200px]">
                       일시적인 오류이거나 API 한도를 초과했을 수 있습니다.
                     </p>
                     <button 
                       onClick={() => stock && loadAIAnalysis(stock)}
                       className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-sm rounded-lg transition-colors flex items-center gap-2"
                     >
                       <RefreshCw className="w-3 h-3" /> 다시 시도
                     </button>
                   </div>
                 )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-500">
                 <span>모델: {analysisLoading ? '분석 중...' : 'GPT-4o-mini'}</span>
                 <span>신뢰도: {analysisLoading ? '-' : '높음'}</span>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
};
