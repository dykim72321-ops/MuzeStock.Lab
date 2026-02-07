import { useState, useEffect } from 'react';
import { Bell, BellOff, LayoutGrid, List, Globe } from 'lucide-react';
import { Card } from '../ui/Card';
import { StockCard } from './StockCard';
import { HuntControl } from './HuntControl';
import { generateBriefingSummary, type Recommendation } from '../../services/recommendationService';
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  sendDailyPicksNotification,
  getNotificationSettings,
  saveNotificationSettings 
} from '../../services/notificationService';
import { getTopStocks } from '../../services/stockService';
import { fetchStockAnalysis, type AIAnalysis } from '../../services/analysisService';
import { supabase } from '../../lib/supabase';
import clsx from 'clsx';

// 추천 아이템 (AI 분석 포함)
interface RankedRecommendation extends Recommendation {
  rank: number;
  topReason: string;
  aiAnalysis: AIAnalysis | null;
}

// 신뢰도 계산 헬퍼
function getConfidenceLevel(dnaScore: number, riskLevel?: string): 'high' | 'medium' | 'low' {
  if (dnaScore >= 70 && riskLevel === 'Low') return 'high';
  if (dnaScore >= 50 && riskLevel !== 'CRITICAL') return 'medium';
  return 'low';
}

export const DailyPicks = () => {
  const [rankedRecommendations, setRankedRecommendations] = useState<RankedRecommendation[]>([]);
  const [briefingSummary, setBriefingSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [marketContext, setMarketContext] = useState<string>('');

  useEffect(() => {
    const fetchPicks = async () => {
      setLoading(true);
      try {
        // 1. 종목 리스트 가져오기
        const stocks = await getTopStocks();
        
        // 2. 각 종목 AI 분석 (병렬 처리)
        const analysisPromises = stocks.map(stock => 
          fetchStockAnalysis(stock).catch(_err => {
            console.warn(`AI analysis failed for ${stock.ticker}, using heuristic`);
            return null;
          })
        );
        
        const analyses = await Promise.all(analysisPromises);
        
        // 3. 분석 결과와 종목 결합
        const combinedData = stocks.map((stock, i) => {
          const aiAnalysis = analyses[i];
          const finalScore = aiAnalysis?.dnaScore || stock.dnaScore;
          const confidence = aiAnalysis 
            ? getConfidenceLevel(aiAnalysis.dnaScore, aiAnalysis.riskLevel)
            : 'low';
          const topReason = aiAnalysis?.bullCase?.[0] || "기술적 지표 기반 추천";
          
          return {
            stock,
            aiAnalysis,
            confidence,
            topReason,
            finalScore
          };
        });
        
        // 4. 최종 점수 기준 정렬
        combinedData.sort((a, b) => b.finalScore - a.finalScore);
        
        // 5. 상위 5개만 선택하여 순위 부여
        const topPicks = combinedData.slice(0, 5).map((item, index) => ({
          stock: item.stock,
          action: item.finalScore >= 70 ? 'buy' as const : 
                  item.finalScore >= 50 ? 'watch' as const : 'avoid' as const,
          confidence: item.confidence,
          reason: item.topReason,
          rank: index + 1,
          topReason: item.topReason,
          aiAnalysis: item.aiAnalysis
        }));
        
        setRankedRecommendations(topPicks);
        setBriefingSummary(generateBriefingSummary(topPicks));

        // Send notification if enabled
        const settings = getNotificationSettings();
        if (settings.enabled && settings.dailyPicks && topPicks.length > 0) {
          sendDailyPicksNotification(topPicks.length, topPicks[0]?.stock.ticker);
        }
      } catch (error) {
        console.error('Failed to fetch daily picks:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMarketContext = async () => {
      try {
        const { data } = await supabase
          .from('market_context')
          .select('summary')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (data?.summary) {
          setMarketContext(data.summary);
        }
      } catch (err) {
        console.warn('Market context not available');
      }
    };

    fetchPicks();
    fetchMarketContext();
    setNotificationsEnabled(getNotificationPermission() === 'granted' && getNotificationSettings().enabled);
  }, []);

  const handleEnableNotifications = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      saveNotificationSettings({ enabled: true });
      setNotificationsEnabled(true);
    }
  };

  const handleDisableNotifications = () => {
    saveNotificationSettings({ enabled: false });
    setNotificationsEnabled(false);
  };



  if (loading) {
    return (
      <Card className="p-6 animate-pulse">
        <div className="h-6 bg-slate-800 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-slate-800 rounded w-2/3"></div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Market Discovery Style */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              STEP 1: DISCOVERY
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              AI RANKED
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Market Discovery</h1>
          <p className="text-slate-400 mt-2">
            오늘 아침 발굴한 <span className="text-emerald-400 font-bold">$1 미만 급등 후보군</span>입니다. 
            관심 종목을 클릭하여 <span className="text-indigo-400 font-bold">AI 심층 분석(Step 3)</span>을 진행하세요.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* 보기 전환 버튼 */}
          <div className="flex bg-slate-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('card')}
              className={clsx(
                'p-2 rounded transition-colors',
                viewMode === 'card' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
              )}
              title="카드 보기"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={clsx(
                'p-2 rounded transition-colors',
                viewMode === 'table' ? 'bg-indigo-500 text-white' : 'text-slate-400 hover:text-white'
              )}
              title="테이블 보기"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          
          <button
            onClick={notificationsEnabled ? handleDisableNotifications : handleEnableNotifications}
            className={clsx(
              'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              notificationsEnabled 
                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                : 'bg-slate-800 text-slate-400 hover:text-white'
            )}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {notificationsEnabled ? '알림 켬' : '알림 활성화'}
          </button>
        </div>
      </div>

      {/* 🆕 AI Hunter Control - 수동 수집 버튼 */}
      <HuntControl />

      {/* 시장 요약 카드 */}
      {marketContext && (
        <Card className="bg-gradient-to-r from-blue-950/40 to-indigo-950/30 border-blue-500/30">
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">오늘의 시장 요약</h3>
            </div>
            <p className="text-sm text-slate-300 leading-relaxed">{marketContext}</p>
          </div>
        </Card>
      )}

      {/* AI Summary */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-4">
        <p className="text-slate-300">{briefingSummary}</p>
      </div>

      {/* Recommendations - Card View */}
      {rankedRecommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-400">오늘 추천된 종목이 없습니다. 나중에 다시 확인해 주세요.</p>
        </Card>
      ) : viewMode === 'card' ? (
        <div className="space-y-4">
          {rankedRecommendations.map((rec) => (
            <StockCard 
              key={rec.stock.ticker}
              stock={rec.stock}
              action={rec.action}
              confidence={rec.confidence}
              reason={rec.reason}
              rank={rec.rank}
              topReason={rec.topReason}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/50 text-slate-400 uppercase font-medium">
                <tr>
                  <th className="px-4 py-3">순위</th>
                  <th className="px-4 py-3">티커</th>
                  <th className="px-4 py-3">가격</th>
                  <th className="px-4 py-3">변동</th>
                  <th className="px-4 py-3">DNA 점수</th>
                  <th className="px-4 py-3">신뢰도</th>
                  <th className="px-4 py-3">추천 이유</th>
                </tr>
              </thead>
              <tbody>
                {rankedRecommendations.map((rec) => (
                  <tr 
                    key={rec.stock.ticker} 
                    className="border-b border-slate-800 hover:bg-slate-800/30 cursor-pointer"
                    onClick={() => window.location.href = `/stock/${rec.stock.ticker}`}
                  >
                    <td className="px-4 py-3">
                      <span className={clsx(
                        "inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold",
                        rec.rank === 1 && "bg-amber-500 text-white",
                        rec.rank === 2 && "bg-slate-400 text-white",
                        rec.rank === 3 && "bg-amber-700 text-white",
                        rec.rank > 3 && "bg-slate-700 text-slate-300"
                      )}>
                        #{rec.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-bold text-white">{rec.stock.ticker}</span>
                        <span className="block text-xs text-slate-500">{rec.stock.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-200">${rec.stock.price.toFixed(2)}</td>
                    <td className={clsx(
                      "px-4 py-3 font-mono font-bold",
                      rec.stock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {rec.stock.changePercent >= 0 ? '+' : ''}{rec.stock.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-indigo-400 font-bold">{rec.stock.dnaScore}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        "px-2 py-1 rounded text-xs font-bold",
                        rec.confidence === 'high' && "bg-emerald-500/20 text-emerald-400",
                        rec.confidence === 'medium' && "bg-yellow-500/20 text-yellow-400",
                        rec.confidence === 'low' && "bg-slate-500/20 text-slate-400"
                      )}>
                        {rec.confidence === 'high' && '🔥 HIGH'}
                        {rec.confidence === 'medium' && '⭐ MEDIUM'}
                        {rec.confidence === 'low' && '💡 LOW'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs max-w-[200px] truncate">
                      {rec.topReason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};
