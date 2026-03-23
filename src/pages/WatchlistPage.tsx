import { useState, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getWatchlist, removeFromWatchlist, addToWatchlist, type WatchlistItem } from '../services/watchlistService';
import { 
  fetchMultipleStocksOptimized
} from '../services/stockService';
import { StockTerminalModal } from '../components/dashboard/StockTerminalModal';
import { WatchlistItemCard } from '../components/watchlist/WatchlistItemCard';
import { WatchlistHeader } from '../components/watchlist/WatchlistHeader';
import { WatchlistEmptyState } from '../components/watchlist/WatchlistEmptyState';
import type { Stock } from '../types';

export const WatchlistPage = () => {
  const navigate = useNavigate();
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false); // 🆕 Silent refresh state
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Terminal Modal State
  const [terminalData, setTerminalData] = useState<any | null>(null);
  const [addLoading, setAddLoading] = useState(false); // 🆕 Ticker adding state

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const items = await getWatchlist();
      setWatchlistItems(items);
      
      if (items.length > 0) {
        const tickers = items.map(i => i.ticker);
        const now = new Date();
        const earliestDate = items.reduce((earliest, item) => {
          const itemDate = new Date(item.addedAt);
          return itemDate < earliest ? itemDate : earliest;
        }, now);
        
        const diffDays = Math.ceil(Math.abs(now.getTime() - earliestDate.getTime()) / (1000 * 60 * 60 * 24)) + 5;
        const historyRange = diffDays <= 5 ? '5d' : diffDays <= 30 ? '1mo' : diffDays <= 90 ? '3mo' : '1y';
        
        const enrichedStocks = await fetchMultipleStocksOptimized(tickers, historyRange);
        
        setStocks(enrichedStocks);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    
    // 🆕 Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadData(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredItems = watchlistItems.filter(item => 
    item.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStock = (ticker: string) => stocks.find(s => s.ticker === ticker);

  const handleRemove = async (ticker: string) => {
    await removeFromWatchlist(ticker);
    loadData();
  };

  const handleAddTicker = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && e.currentTarget.value) {
      const val = e.currentTarget.value.trim().toUpperCase();
      if (val) {
        setAddLoading(true);
        try {
          // 🆕 Step 1: Fetch current price first to use as buyPrice
          const { fetchStockQuote } = await import('../services/stockService');
          const stockData = await fetchStockQuote(val);
          
          const initialPrice = stockData?.price;
          const initialDna = stockData?.dnaScore;

          // 🆕 Step 2: Add with captured price
          await addToWatchlist(
            val, 
            undefined, 
            'WATCHING', 
            initialPrice, 
            undefined, 
            undefined, 
            initialDna
          );
          
          e.currentTarget.value = '';
          loadData(true);
        } catch (err) {
          console.error('Failed to add ticker:', err);
          alert(`종목 추가 실패: ${val}. 유효한 티커인지 확인해 주세요.`);
        } finally {
          setAddLoading(false);
        }
      }
    }
  };

  return (
    <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-500 bg-slate-50 min-h-screen relative">
      {/* 🆕 Global Refresh Indicator */}
      {isRefreshing && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="w-2 h-2 bg-[#0176d3] rounded-full animate-pulse" />
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Refreshing Orbit...</span>
        </div>
      )}

      <WatchlistHeader 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-70">
          <div className="w-12 h-12 border-2 border-[#0176d3]/20 border-t-[#0176d3] rounded-full animate-spin" />
          <p className="font-mono text-xs text-slate-500 tracking-widest">SYNCHRONIZING ORBIT...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className={addLoading ? "opacity-50 pointer-events-none transition-opacity" : ""}>
          <WatchlistEmptyState 
            onAddTicker={handleAddTicker}
            onNavigateScanner={() => navigate('/scanner')}
          />
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-3"
        }>
          <AnimatePresence>
            {filteredItems.map((item) => (
              <WatchlistItemCard 
                key={item.ticker} 
                item={item} 
                stock={getStock(item.ticker)} 
                viewMode={viewMode}
                onRemove={handleRemove}
                onDeepDive={(data) => setTerminalData(data)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {terminalData && (
        <StockTerminalModal 
          isOpen={!!terminalData}
          onClose={() => setTerminalData(null)}
          data={terminalData}
          onAddToWatchlist={async () => {
            try {
              await addToWatchlist(
                terminalData.ticker, 
                undefined, 
                'WATCHING', 
                terminalData.price, 
                undefined, 
                undefined, 
                terminalData.dnaScore
              );
              loadData();
            } catch (err) {
              console.error('Failed to update/add to watchlist:', err);
            }
          }}
        />
      )}
    </div>
  );
};
