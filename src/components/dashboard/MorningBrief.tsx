import { useState, useEffect } from 'react';
import { ArrowRight, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';
import { getTopStocks } from '../../services/stockService';
import { MOCK_STOCKS } from '../../data/mockData';
import type { Stock } from '../../types';
import clsx from 'clsx';

export const MorningBrief = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getTopStocks();
        if (data.length > 0) {
          setStocks(data.slice(0, 3));
          setLastUpdated(new Date());
        } else {
          setStocks(MOCK_STOCKS.slice(0, 3));
        }
      } catch (err) {
        console.error('Failed to fetch stocks:', err);
        setStocks(MOCK_STOCKS.slice(0, 3));
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
    <Card className="p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-indigo-400 fill-indigo-400/20" />
          <h2 className="text-lg font-bold text-white tracking-tight">Morning Brief</h2>
        </div>
        {lastUpdated && !loading && (
          <span className="text-[10px] font-mono text-slate-500 uppercase">{formatTime(lastUpdated)} UPDATED</span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3 py-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <div className="space-y-3 flex-1">
          {stocks.map((stock) => (
            <Link 
              key={stock.id}
              to={`/analysis/${stock.ticker}`}
              className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-indigo-500/30 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-indigo-400 text-xs border border-slate-700">
                  {stock.ticker[0]}
                </div>
                <div>
                  <div className="font-bold text-white text-sm font-mono">{stock.ticker}</div>
                  <div className="text-[10px] text-slate-500 truncate max-w-[80px]">{stock.name}</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-white font-mono">${stock.price.toFixed(2)}</div>
                <div className={clsx(
                  "text-[10px] font-bold font-mono",
                  stock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4 pt-4 border-t border-white/5">
        <Link 
          to="/scanner"
          className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 rounded-lg transition-all"
        >
          전체 스캔 결과 보기 <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </Card>
  );
};
