import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowUpRight, Search, Loader2, RefreshCw, 
  List, LayoutGrid 
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { getTopStocks } from '../services/stockService';
import type { Stock } from '../types';
import clsx from 'clsx';

export const ScannerPage = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  
  // Filters
  const [minDna, setMinDna] = useState(0);
  const [selectedSector, setSelectedSector] = useState('All');
  const [priceRange, setPriceRange] = useState<'all'|'penny'|'mid'>('all');

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const data = await getTopStocks();
      setStocks(data);
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const sectors = ['All', ...new Set(stocks.map(s => s.sector))];

  const filteredStocks = stocks.filter(stock => {
    const matchesSearch = stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         stock.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDna = stock.dnaScore >= minDna;
    const matchesSector = selectedSector === 'All' || stock.sector === selectedSector;
    const matchesPrice = priceRange === 'all' || 
                        (priceRange === 'penny' && stock.price < 1) ||
                        (priceRange === 'mid' && stock.price >= 1);
    
    return matchesSearch && matchesDna && matchesSector && matchesPrice;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="neutral" className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">LIVE SCANNER</Badge>
          <Badge variant="neutral" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20">REAL-TIME DATA</Badge>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">Market Scanner</h1>
        <p className="text-slate-400 mt-2 max-w-2xl">
          실시간 시장 데이터를 기반으로 급등 가능성이 높은 종목을 필터링합니다. 
          DNA 점수와 상대 거래량(RelVol)을 조합하여 나만의 사냥감을 찾으세요.
        </p>
      </section>

      {/* Control Bar */}
      <Card className="p-4 bg-slate-900/50 border-slate-800">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search ticker..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-48"
              />
            </div>

            {/* Price Filter */}
            <select 
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="all">All Prices</option>
              <option value="penny">$1 미만 (Penny)</option>
              <option value="mid">$1 이상</option>
            </select>

            {/* Sector Filter */}
            <select 
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-950 border border-slate-700 text-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>

            {/* DNA Filter */}
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg">
              <span className="text-xs text-slate-500 font-bold">DNA 70+</span>
              <input 
                type="checkbox" 
                checked={minDna === 70}
                onChange={(e) => setMinDna(e.target.checked ? 70 : 0)}
                className="w-4 h-4 accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-950 border border-slate-800 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('table')}
                className={clsx("p-1.5 rounded", viewMode === 'table' ? "bg-slate-800 text-white" : "text-slate-500")}
              >
                <List className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={clsx("p-1.5 rounded", viewMode === 'grid' ? "bg-slate-800 text-white" : "text-slate-500")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <button 
              onClick={fetchStocks}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg transition-all active:scale-95"
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="text-slate-500 font-mono animate-pulse">Scanning the market for opportunities...</p>
        </div>
      ) : filteredStocks.length === 0 ? (
        <div className="text-center py-20 bg-slate-900/20 rounded-2xl border border-dashed border-slate-800">
          <p className="text-slate-500 italic">No matches found for current filters.</p>
        </div>
      ) : viewMode === 'table' ? (
        <Card className="overflow-hidden border-slate-800">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-800/30 text-slate-500 uppercase text-[10px] font-black tracking-widest">
                <tr>
                  <th className="px-6 py-4">Symbol / Name</th>
                  <th className="px-6 py-4">Price / Change</th>
                  <th className="px-6 py-4">RelVol</th>
                  <th className="px-6 py-4">DNA Score</th>
                  <th className="px-6 py-4">Sector</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {filteredStocks.map(stock => (
                  <tr 
                    key={stock.id} 
                    className="hover:bg-indigo-500/5 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/stock/${stock.ticker}`)}
                  >
                    <td className="px-6 py-5">
                      <div className="font-black text-lg text-white group-hover:text-indigo-400 transition-colors">{stock.ticker}</div>
                      <div className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{stock.name}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-mono text-slate-200 text-base">${stock.price.toFixed(2)}</div>
                      <div className={clsx(
                        "flex items-center gap-1 text-xs font-bold",
                        stock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-6 py-5 font-mono text-slate-400 text-base">
                      {stock.relevantMetrics?.relativeVolume ? `${stock.relevantMetrics.relativeVolume.toFixed(1)}x` : 'N/A'}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={clsx(
                              "h-full rounded-full transition-all duration-1000",
                              stock.dnaScore >= 70 ? "bg-emerald-500" : 
                              stock.dnaScore >= 40 ? "bg-indigo-500" : "bg-rose-500"
                            )}
                            style={{ width: `${stock.dnaScore}%` }}
                          />
                        </div>
                        <span className="font-black text-lg text-white font-mono">{stock.dnaScore}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <Badge variant="neutral" className="bg-slate-800 text-slate-400 border-none px-2 py-0.5 text-[10px]">{stock.sector}</Badge>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg opacity-0 group-hover:opacity-100 transition-all active:scale-90">
                        <ArrowUpRight className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredStocks.map(stock => (
            <Card 
              key={stock.id} 
              className="p-5 bg-slate-900/40 border-slate-800 hover:border-indigo-500/50 transition-all group cursor-pointer"
              onClick={() => navigate(`/stock/${stock.ticker}`)}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-2xl font-black text-white group-hover:text-indigo-400 transition-colors">{stock.ticker}</h3>
                  <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{stock.name}</p>
                </div>
                <div className={clsx(
                  "px-2 py-1 rounded text-[10px] font-black",
                  stock.changePercent >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                )}>
                  {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                </div>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-mono font-black text-white">${stock.price.toFixed(2)}</p>
                  <p className="text-xs text-slate-500 font-bold mt-1">DNA: <span className="text-indigo-400">{stock.dnaScore}</span></p>
                </div>
                <div className="text-right">
                   <p className="text-[10px] text-slate-600 uppercase font-bold">RelVol</p>
                   <p className="text-xl font-mono text-slate-400 font-black">{stock.relevantMetrics?.relativeVolume ? `${stock.relevantMetrics.relativeVolume.toFixed(1)}x` : 'N/A'}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
