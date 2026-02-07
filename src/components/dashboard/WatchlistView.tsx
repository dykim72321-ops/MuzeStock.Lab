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
    <div className="space-y-8 animate-fade-in">
      {/* 1. Header Section */}
      <div className="flex items-end justify-between border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase font-mono">
               Step 2: Exploration
             </span>
          </div>
          <h1 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
            <span className="text-amber-400">
              <Star className="w-8 h-8 fill-current" />
            </span>
            Watchlist
          </h1>
          <p className="text-slate-400 mt-2 max-w-xl text-sm leading-relaxed">
            관심 종목의 실시간 시세와 변동성을 추적하는 개인화된 관제 센터입니다. 
            상세 분석을 원하시면 종목을 클릭하세요.
          </p>
        </div>
        
        {/* 요약 카드 */}
        <div className="flex gap-4">
          <div className="bg-slate-800/50 rounded-xl px-5 py-3 border border-slate-700 backdrop-blur-sm">
             <div className="text-xs text-slate-500 font-mono mb-1 uppercase">Total Items</div>
             <div className="text-2xl font-bold text-white font-mono">{watchlistItems.length}</div>
          </div>
        </div>
      </div>

      {/* 2. List Section */}
      {watchlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/50">
          <div className="bg-slate-800 p-4 rounded-full mb-4">
            <Activity className="w-8 h-8 text-slate-600" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">리스트가 비어있습니다</h3>
          <p className="text-slate-400 mb-6 text-center max-w-md">
            'Discovery' 탭에서 AI가 발굴한 종목을 추가하거나,<br/> 직접 종목을 검색하여 모니터링을 시작하세요.
          </p>
          <button 
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-lg transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 flex items-center gap-2"
          >
            <Activity className="w-4 h-4" />
            종목 발굴하러 가기
          </button>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead>
                <tr className="bg-slate-800/50 border-b border-slate-700">
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Ticker / Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono text-right">Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono text-right">Change (24h)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono text-right">Volume</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono text-center">Sector</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono text-center">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider font-mono text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {watchlistItems.map((item) => {
                  const stock = getStockData(item.ticker);
                  const isPositive = stock && stock.changePercent >= 0;
                  
                  return (
                    <tr 
                      key={item.ticker} 
                      onClick={() => navigate(`/analysis/${item.ticker}`)}
                      className="group hover:bg-slate-800/60 transition-colors cursor-pointer"
                    >
                      {/* Ticker & Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-800 flex items-center justify-center font-bold text-indigo-400 text-sm border border-slate-700 group-hover:border-indigo-500/50 group-hover:bg-indigo-500/10 transition-colors">
                            {item.ticker[0]}
                          </div>
                          <div>
                            <div className="font-bold text-white text-base group-hover:text-indigo-400 transition-colors font-mono tracking-tight">
                              {item.ticker}
                            </div>
                            <div className="text-xs text-slate-500 truncate max-w-[150px]">
                              {stock?.name || 'Loading data...'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono text-white font-medium text-lg tracking-tight">
                          {stock ? `$${stock.price.toFixed(2)}` : '-'}
                        </span>
                      </td>

                      {/* Change % */}
                      <td className="px-6 py-4 text-right">
                        {stock ? (
                          <span className={clsx(
                            "inline-flex items-center gap-1 px-2.5 py-1 rounded font-mono text-sm font-bold",
                            isPositive 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          )}>
                            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Math.abs(stock.changePercent).toFixed(2)}%
                          </span>
                        ) : '-'}
                      </td>

                      {/* Volume */}
                      <td className="px-6 py-4 text-right font-mono text-slate-400">
                         {stock ? (
                           stock.volume > 1000000 
                             ? <span className="text-white">{(stock.volume / 1000000).toFixed(2)}<span className="text-slate-500 ml-0.5">M</span></span> 
                             : <span className="text-white">{(stock.volume / 1000).toFixed(0)}<span className="text-slate-500 ml-0.5">k</span></span>
                         ) : '-'}
                      </td>

                      {/* Sector */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                          {stock?.sector || 'Unknown'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <div className="relative inline-block" onClick={e => e.stopPropagation()}>
                          <select 
                            value={item.status}
                            onChange={(e) => handleStatusChange(e, item.ticker)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer appearance-none"
                          >
                            <option value="WATCHING">관찰 중 (WATCHING)</option>
                            <option value="HOLDING">보유 중 (HOLDING)</option>
                            <option value="EXITED">투자 종료 (EXITED)</option>
                          </select>
                          <div className="flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity">
                            {getStatusBadge(item.status)}
                            <ChevronDown className="w-3 h-3 text-slate-500" />
                          </div>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={(e) => handleRemove(e, item.ticker)}
                          className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                          title="리스트에서 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};