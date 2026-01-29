import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Eye, Star, Bell, BellOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { getDailyPicks, generateBriefingSummary, type Recommendation } from '../../services/recommendationService';
import { 
  requestNotificationPermission, 
  getNotificationPermission, 
  sendDailyPicksNotification,
  getNotificationSettings,
  saveNotificationSettings 
} from '../../services/notificationService';
import { addToWatchlist, isInWatchlist } from '../../services/watchlistService';
import { getTopStocks } from '../../services/stockService';
import clsx from 'clsx';


export const DailyPicks = () => {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [briefingSummary, setBriefingSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [watchlistStatus, setWatchlistStatus] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const fetchPicks = async () => {
      setLoading(true);
      try {
        const stocks = await getTopStocks();
        const picks = getDailyPicks(stocks);
        setRecommendations(picks);
        setBriefingSummary(generateBriefingSummary(picks));

        // Update watchlist status
        const status: Record<string, boolean> = {};
        picks.forEach(pick => {
          status[pick.stock.ticker] = isInWatchlist(pick.stock.ticker);
        });
        setWatchlistStatus(status);

        // Send notification if enabled
        const settings = getNotificationSettings();
        if (settings.enabled && settings.dailyPicks && picks.length > 0) {
          sendDailyPicksNotification(picks.length, picks[0]?.stock.ticker);
        }
      } catch (error) {
        console.error('Failed to fetch daily picks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPicks();
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

  const handleAddToWatchlist = (ticker: string) => {
    addToWatchlist(ticker);
    setWatchlistStatus(prev => ({ ...prev, [ticker]: true }));
  };

  const getActionColor = (action: Recommendation['action']) => {
    switch (action) {
      case 'buy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      case 'watch': return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
      case 'avoid': return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    }
  };

  const getActionIcon = (action: Recommendation['action']) => {
    switch (action) {
      case 'buy': return <TrendingUp className="w-4 h-4" />;
      case 'watch': return <Eye className="w-4 h-4" />;
      case 'avoid': return <span className="text-sm">⚠️</span>;
    }
  };

  const translateConfidence = (confidence: string) => {
    switch (confidence) {
      case 'high': return '높은 신뢰도';
      case 'medium': return '중간 신뢰도';
      case 'low': return '낮은 신뢰도';
      default: return confidence;
    }
  };

  const translateAction = (action: string) => {
    switch (action) {
      case 'buy': return '매수';
      case 'watch': return '관찰';
      case 'avoid': return '회피';
      default: return action;
    }
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">오늘의 추천 종목</h2>
            <p className="text-sm text-slate-400">AI 기반 추천 시스템</p>
          </div>
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

      {/* Summary */}
      <div className="bg-gradient-to-r from-slate-800/50 to-slate-900/50 border border-slate-700/50 rounded-lg p-4">
        <p className="text-slate-300">{briefingSummary}</p>
      </div>

      {/* Recommendations */}
      {recommendations.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-slate-400">오늘 추천된 종목이 없습니다. 나중에 다시 확인해 주세요.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {recommendations.map((rec) => (
            <Card 
              key={rec.stock.ticker} 
              className="p-4 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Link 
                      to={`/stock/${rec.stock.ticker}`}
                      className="text-lg font-bold text-white hover:text-indigo-400 transition-colors"
                    >
                      {rec.stock.ticker}
                    </Link>
                    <span className="text-sm text-slate-500">{rec.stock.name}</span>
                    <Badge 
                      variant={rec.confidence === 'high' ? 'success' : rec.confidence === 'medium' ? 'primary' : 'neutral'}
                    >
                      {translateConfidence(rec.confidence)}
                    </Badge>
                  </div>
                  
                  <p className="text-sm text-slate-400 mb-3">{rec.reason}</p>
                  
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-slate-300">
                      <span className="text-slate-500">가격:</span> ${rec.stock.price.toFixed(2)}
                    </span>
                    <span className={rec.stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                      {rec.stock.changePercent >= 0 ? '+' : ''}{rec.stock.changePercent.toFixed(2)}%
                    </span>
                    <span className="text-slate-300">
                      <span className="text-slate-500">DNA:</span> {rec.stock.dnaScore}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium',
                    getActionColor(rec.action)
                  )}>
                    {getActionIcon(rec.action)}
                    <span className="capitalize">{translateAction(rec.action)}</span>
                  </div>
                  
                  <button
                    onClick={() => handleAddToWatchlist(rec.stock.ticker)}
                    disabled={watchlistStatus[rec.stock.ticker]}
                    className={clsx(
                      'flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors',
                      watchlistStatus[rec.stock.ticker]
                        ? 'bg-emerald-500/10 text-emerald-400 cursor-default'
                        : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                    )}
                  >
                    <Star className={clsx('w-4 h-4', watchlistStatus[rec.stock.ticker] && 'fill-current')} />
                    {watchlistStatus[rec.stock.ticker] ? '추가됨' : '모니터링 리스트'}
                  </button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
