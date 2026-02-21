import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trash2, Activity, TrendingUp, TrendingDown, Clock, Search,
  Filter, ArrowLeft, MoreHorizontal, LayoutGrid, List
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { getWatchlist, removeFromWatchlist, type WatchlistItem } from '../services/watchlistService';
import { fetchMultipleStocks } from '../services/stockService';
import type { Stock } from '../types';

export const WatchlistPage = () => {
  const navigate = useNavigate();
  const [watchlistItems, setWatchlistItems] = useState<WatchlistItem[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadData = async () => {
    setLoading(true);
    try {
      const items = await getWatchlist();
      setWatchlistItems(items);
      
      if (items.length > 0) {
        const tickers = items.map(i => i.ticker);
        const stockData = await fetchMultipleStocks(tickers);
        setStocks(stockData);
      }
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredItems = watchlistItems.filter(item => 
    item.ticker.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStock = (ticker: string) => stocks.find(s => s.ticker === ticker);

  const handleRemove = async (ticker: string) => {
    await removeFromWatchlist(ticker);
    loadData();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <section className="relative overflow-hidden p-8 rounded-[2rem] bg-indigo-500/5 border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase text-indigo-400">Tactical Watchlist</p>
            </div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">My Monitoring Orbit</h1>
            <p className="text-slate-400 text-sm font-medium">실시간 펄스 정찰 중인 종목 리스트입니다.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text"
                placeholder="Ticker search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900/50 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500/50 outline-none w-48 transition-all"
              />
            </div>
            <div className="bg-slate-900/50 border border-white/10 rounded-xl p-1 flex">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-slate-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 gap-4 opacity-50">
          <div className="w-12 h-12 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          <p className="font-mono text-xs text-slate-500 tracking-widest">SYNCHRONIZING ORBIT...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="text-center py-40 bg-slate-900/10 rounded-[2rem] border border-dashed border-white/5">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="w-6 h-6 text-slate-600" />
          </div>
          <p className="text-slate-500 font-medium">관심 종목 리스트가 비어있습니다.</p>
          <button 
            onClick={() => navigate('/scanner')}
            className="mt-6 text-indigo-400 font-bold hover:underline flex items-center gap-2 mx-auto text-sm"
          >
            새로운 기회 탐색하기 <TrendingUp className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          : "space-y-3"
        }>
          <AnimatePresence>
            {filteredItems.map((item) => {
              const stock = getStock(item.ticker);
              const isPositive = stock && stock.changePercent >= 0;
              
              return (
                <motion.div
                  layout
                  key={item.ticker}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={viewMode === 'grid' ? "" : "w-full"}
                >
                  <Card className={`group relative overflow-hidden transition-all hover:border-indigo-500/40 ${
                    viewMode === 'grid' ? 'p-6' : 'p-4 flex items-center justify-between'
                  }`}>
                    {/* Background Glow */}
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br ${
                      isPositive ? 'from-emerald-500' : 'from-rose-500'
                    } to-transparent`} />

                    <div className={`flex flex-1 ${viewMode === 'grid' ? 'flex-col' : 'items-center gap-6'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm border ${
                            isPositive ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {item.ticker[0]}
                          </div>
                          <div>
                            <h3 className="font-black text-xl text-white tracking-tighter">{item.ticker}</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-[100px]">
                              {stock?.name || 'Loading...'}
                            </p>
                          </div>
                        </div>
                        
                        {viewMode === 'grid' && (
                          <button 
                            onClick={() => handleRemove(item.ticker)}
                            className="p-2 text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className={`flex items-end justify-between ${viewMode === 'grid' ? '' : 'flex-1'}`}>
                        <div>
                          <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mb-1">Market Price</p>
                          <p className="text-2xl font-black text-white font-mono">
                            {stock ? `$${stock.price.toFixed(2)}` : '---'}
                          </p>
                        </div>
                        <div className="text-right">
                          <div className={`flex items-center gap-1.5 font-black font-mono text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                            {stock ? `${isPositive ? '+' : ''}${stock.changePercent.toFixed(2)}%` : '0.00%'}
                          </div>
                          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter flex items-center gap-1 justify-end mt-1">
                            <Clock className="w-3 h-3" /> {new Date(item.addedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      {viewMode === 'list' && (
                        <div className="flex items-center gap-4 ml-8">
                           <button 
                            onClick={() => navigate(`/analysis/${item.ticker}`)}
                            className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-xs font-bold text-slate-300 transition-all"
                          >
                            Analyze
                          </button>
                          <button 
                            onClick={() => handleRemove(item.ticker)}
                            className="p-2 text-slate-600 hover:text-rose-500 transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
