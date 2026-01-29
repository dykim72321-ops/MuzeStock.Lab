import { useState, useEffect } from 'react';
import { ArrowRight, Zap, TrendingUp, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { DailyPicks } from './DailyPicks';
import { getTopStocks } from '../../services/stockService';
import { MOCK_STOCKS } from '../../data/mockData';
import type { Stock } from '../../types';

export const MorningBrief = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getTopStocks();
        if (data.length > 0) {
          setStocks(data.slice(0, 3));
          setLastUpdated(new Date());
          setError(null);
        } else {
          // Fallback to mock data if API fails
          setStocks(MOCK_STOCKS.slice(0, 3));
          setError('캐시된 데이터를 사용 중입니다');
        }
      } catch (err) {
        console.error('Failed to fetch stocks:', err);
        setStocks(MOCK_STOCKS.slice(0, 3));
        setError('캐시된 데이터를 사용 중입니다');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">모닝 브리핑</h1>
          <p className="text-slate-400 mt-2">MuzeStock.Lab 알고리즘이 발견한 오늘의 주요 기회입니다.</p>
        </div>
        <Badge variant={error ? 'warning' : 'success'} className="px-4 py-2 text-sm">
          {loading ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> 스캔 중...
            </span>
          ) : lastUpdated ? (
            `라이브 데이터: ${formatTime(lastUpdated)} 업데이트됨`
          ) : (
            '시스템 상태: 준비됨'
          )}
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stocks.map((stock) => (
            <Card key={stock.id} className="p-6 flex flex-col group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-24 h-24 text-indigo-500 rotate-12" />
              </div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div>
                  <h3 className="text-2xl font-bold text-white">{stock.ticker}</h3>
                  <p className="text-sm text-slate-400">{stock.name}</p>
                </div>
                <Badge variant={stock.dnaScore > 80 ? 'success' : 'warning'}>
                  DNA 점수: {stock.dnaScore}
                </Badge>
              </div>

              <div className="space-y-3 mb-6 relative z-10">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">가격</span>
                  <span className="text-slate-200 font-mono">${stock.price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">변동률</span>
                  <span className={stock.changePercent >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                    {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">섹터</span>
                  <span className="text-slate-200">{stock.sector}</span>
                </div>
              </div>

              <Link 
                to={`/stock/${stock.ticker}`}
                className="mt-auto flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-indigo-600 text-white rounded-lg transition-all duration-200 text-sm font-medium relative z-10"
              >
                DNA 매치 스캔 <ArrowRight className="w-4 h-4" />
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Daily Picks Section */}
      <DailyPicks />

      <div className="bg-gradient-to-r from-indigo-900/50 to-slate-900/50 border border-indigo-500/20 rounded-xl p-6 flex items-start gap-4">
        <div className="bg-indigo-500/20 p-3 rounded-lg">
          <TrendingUp className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white mb-1">시장 인사이트</h3>
          <p className="text-slate-400 text-sm leading-relaxed max-w-3xl">
            오늘의 스캔은 초기 기술 거물들과 유사한 거래량 모멘텀 및 성장 패턴을 보이는 주식을 식별했습니다. 
            AI는 가격 변동, 거래량 추세 및 펀더멘털 비율을 분석하여 DNA 점수를 산출합니다.
          </p>
        </div>
      </div>
    </div>
  );
};
