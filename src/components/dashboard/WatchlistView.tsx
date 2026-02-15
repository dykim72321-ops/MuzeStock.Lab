import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trash2, TrendingUp, TrendingDown, Loader2, Star, Activity, ChevronDown } from 'lucide-react';
import { getWatchlist, removeFromWatchlist, updateWatchlistStatus, type WatchlistItem, type WatchlistStatus } from '../../services/watchlistService';
import { fetchMultipleStocks } from '../../services/stockService';
import type { Stock } from '../../types';
import { Badge } from '../ui/Badge';
import clsx from 'clsx';

export const WatchlistView = () => {
  const navigate = useNavigate();
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWatchlist = async () => {
    setLoading(true);
    try {
      const items = await getWatchlist();
      setWatchlistItems(items);

      if (items.length > 0) {
        const tickers = items.map(i => i.ticker);
        const stockData = await fetchMultipleStocks(tickers);
        setStocks(stockData);
      } else {
        setStocks([]);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const handleRemove = async (e: React.MouseEvent, ticker: string) => {
    e.stopPropagation();
    if (confirm(`${ticker}를 모니터링 리스트에서 제거하시겠습니까?`)) {
      await removeFromWatchlist(ticker);
      loadWatchlist();
    }
  };

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>, ticker: string) => {
    e.stopPropagation();
    const newStatus = e.target.value as WatchlistStatus;
    await updateWatchlistStatus(ticker, newStatus);
    loadWatchlist();
  };

  const getStatusBadge = (status: WatchlistStatus) => {
    switch (status) {
      case 'HOLDING':
        return <Badge variant="primary" className="bg-blue-500/10 text-blue-400 border-blue-500/20">보유 중</Badge>;
      case 'EXITED':
        return <Badge variant="neutral" className="bg-slate-700/50 text-slate-400 border-slate-600">투자 종료</Badge>;
      default:
        return <Badge variant="warning" className="bg-amber-500/10 text-amber-400 border-amber-500/20">관찰 중</Badge>;
    }
  };

  const getStockData = (ticker: string) => stocks.find(s => s.ticker === ticker);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-500" />
        <p className="text-slate-500 font-mono text-sm animate-pulse">SYNCING PORTFOLIO DATA...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* List Section */}
      {watchlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center p-6 bg-white/[0.02] rounded-2xl border border-white/5 border-dashed">
          <div className="bg-white/5 p-3 rounded-full mb-3">
            <Activity className="w-6 h-6 text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Watchlist is empty.
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-bold rounded-lg transition-all border border-indigo-500/30 hover:border-indigo-500/50 flex items-center gap-2"
          >
            <Activity className="w-3 h-3" />
            DISCOVER ASSETS
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          <div className="space-y-2">
            {watchlistItems.map((item) => {
              const stock = getStockData(item.ticker);
              const isPositive = stock && stock.changePercent >= 0;

              return (
                <div
                  key={item.ticker}
                  onClick={() => navigate(`/analysis/${item.ticker}`)}
                  className="group flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all cursor-pointer relative overflow-hidden"
                >
                  {/* Left: Ticker & Name */}
                  <div className="flex items-center gap-3 relative z-10">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs border transition-colors ${isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'}`}>
                      {item.ticker[0]}
                    </div>
                    <div>
                      <div className="font-bold text-white text-sm font-mono tracking-tight flex items-center gap-2">
                        {item.ticker}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          {stock ? Math.abs(stock.changePercent).toFixed(2) + '%' : '-'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[120px]">
                        {stock?.name || 'Loading...'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Price & Chart (Mini) */}
                  <div className="text-right relative z-10">
                    <div className="font-mono text-white font-bold text-sm">
                      {stock ? `$${stock.price.toFixed(2)}` : '-'}
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      VOL: {stock ? (stock.volume / 1000).toFixed(0) + 'K' : '-'}
                    </div>
                  </div>

                  {/* Hover Action */}
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => handleRemove(e, item.ticker)}
                      className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg hover:bg-rose-500/30 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};