import { useState, useEffect, useMemo } from 'react';
import {
  ArrowUpRight, Search, Loader2, RefreshCw,
  List, LayoutGrid, Filter, ArrowDownWideNarrow, ArrowUpWideNarrow,
  ShieldCheck, ShieldAlert, Shield, Zap, TrendingUp, TrendingDown
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { getTopStocks } from '../services/stockService';
import type { Stock } from '../types';
import clsx from 'clsx';
import { motion } from 'framer-motion';
import { StockTerminalModal } from '../components/dashboard/StockTerminalModal';
import { addToWatchlist } from '../services/watchlistService';
import { addToPortfolio } from '../services/portfolioService';

export const ScannerPage = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Terminal Modal State
  const [terminalData, setTerminalData] = useState<any | null>(null);

  // Filters & Sorting
  const [minDna, setMinDna] = useState(0);
  const [selectedSector, setSelectedSector] = useState('All');
  const [selectedRisk, setSelectedRisk] = useState('All');
  const [sortBy, setSortBy] = useState<'dna' | 'price' | 'change'>('dna');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

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

  const sectors = useMemo(() => ['All', ...new Set(stocks.map(s => s.sector))], [stocks]);

  const processedStocks = useMemo(() => {
    return stocks
      .filter(stock => {
        const matchesSearch = stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDna = stock.dnaScore >= minDna;
        const matchesSector = selectedSector === 'All' || stock.sector === selectedSector;
        const matchesRisk = selectedRisk === 'All' ||
          (selectedRisk === 'Low' && stock.dnaScore < 40) || // Example logic, adjust as needed
          (selectedRisk === 'Medium' && stock.dnaScore >= 40 && stock.dnaScore < 70) ||
          (selectedRisk === 'High' && stock.dnaScore >= 70);

        return matchesSearch && matchesDna && matchesSector && matchesRisk;
      })
      .sort((a, b) => {
        let valA = sortBy === 'dna' ? a.dnaScore : sortBy === 'price' ? a.price : a.changePercent;
        let valB = sortBy === 'dna' ? b.dnaScore : sortBy === 'price' ? b.price : b.changePercent;
        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [stocks, searchTerm, minDna, selectedSector, selectedRisk, sortBy, sortOrder]);

  const toggleSort = (field: 'dna' | 'price' | 'change') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const handleDeepDive = (stock: Stock) => {
    // Map to Terminal format
    const analysis = (stock as any).stock_analysis_cache?.[0]?.analysis || {};
    setTerminalData({
      ticker: stock.ticker,
      dnaScore: stock.dnaScore,
      popProbability: analysis.popProbability || 0,
      bullPoints: analysis.bullCase || ["No details available"],
      bearPoints: analysis.bearCase || ["No details available"],
      matchedLegend: analysis.matchedLegend || { ticker: 'None', similarity: 0 },
      riskLevel: analysis.riskLevel || 'Medium',
      aiSummary: analysis.aiSummary || "",
      price: stock.price,
      change: `${stock.changePercent.toFixed(2)}%`
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <section className="relative overflow-hidden p-8 rounded-[2rem] bg-indigo-500/5 border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full -mr-20 -mt-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            <p className="text-[10px] text-slate-500 font-mono font-bold tracking-widest uppercase">TERMINAL SCANNER v3.1</p>
          </div>
          <h1 className="text-5xl font-black text-white tracking-tighter mb-4 flex items-center gap-4">
            Market Discovery
            <Filter className="w-8 h-8 text-indigo-400 opacity-30" />
          </h1>
          <p className="text-slate-400 max-w-2xl font-medium leading-relaxed">
            광범위 스캔 알고리즘이 처리한 상위 100개 종목 중 최적의 기회를 선별합니다.
            DNA 점수와 패턴 유사도를 기반으로 고밀도 데이터 분석을 시작하십시오.
          </p>
        </div>
      </section>

      {/* Control Bar */}
      <Card className="p-4 bg-slate-900/50 backdrop-blur-xl border border-white/5 rounded-3xl">
        <div className="flex flex-col xl:flex-row gap-6 items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
              <input
                type="text"
                placeholder="Search symbol..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950/50 border border-white/10 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none w-56 transition-all"
              />
            </div>

            {/* High Performance Toggle */}
            <button
              onClick={() => setMinDna(minDna === 70 ? 0 : 70)}
              className={clsx(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-bold",
                minDna === 70
                  ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-300"
                  : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
              )}
            >
              <Zap className={clsx("w-4 h-4", minDna === 70 ? "fill-current" : "")} />
              DNA 70+ Spec
            </button>

            {/* Risk Selection */}
            <div className="flex items-center bg-white/5 rounded-xl border border-white/5 p-1">
              {['All', 'Low', 'Medium', 'High'].map(risk => (
                <button
                  key={risk}
                  onClick={() => setSelectedRisk(risk)}
                  className={clsx(
                    "px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all",
                    selectedRisk === risk ? "bg-white/10 text-white" : "text-slate-500 hover:text-slate-300"
                  )}
                >
                  {risk}
                </button>
              ))}
            </div>

            {/* Sector Dropdown */}
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="bg-slate-950/50 border border-white/10 text-slate-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none"
            >
              {sectors.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex bg-slate-950/50 border border-white/10 rounded-xl p-1">
              <button
                onClick={() => setViewMode('table')}
                className={clsx("p-2 rounded-lg transition-all", viewMode === 'table' ? "bg-white/10 text-white shadow-lg" : "text-slate-600")}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={clsx("p-2 rounded-lg transition-all", viewMode === 'grid' ? "bg-white/10 text-white shadow-lg" : "text-slate-600")}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
            <button
              onClick={fetchStocks}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
            >
              <RefreshCw className={clsx("w-4 h-4", loading && "animate-spin")} />
              Sync Data
            </button>
          </div>
        </div>
      </Card>

      {/* Main Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-6 relative">
          <div className="absolute inset-0 bg-indigo-500/5 blur-[120px] rounded-full mx-auto w-64 h-64 opacity-50" />
          <Loader2 className="w-16 h-16 text-indigo-500 animate-spin relative z-10 drop-shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
          <p className="text-slate-500 font-mono text-sm tracking-widest uppercase animate-pulse">Filtering Market Signal Matrix...</p>
        </div>
      ) : processedStocks.length === 0 ? (
        <div className="text-center py-40 bg-slate-900/10 rounded-[2rem] border border-dashed border-white/5">
          <p className="text-slate-500 italic font-medium">No results matched your search matrix.</p>
          <button onClick={() => { setSearchTerm(''); setMinDna(0); setSelectedRisk('All'); setSelectedSector('All'); }} className="mt-4 text-indigo-400 font-bold hover:underline">Reset Filters</button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bento-card overflow-hidden border-white/5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white/[0.02] text-slate-500 uppercase text-[10px] font-black tracking-widest border-b border-white/5">
                <tr>
                  <th className="px-8 py-5">Asset Identification</th>
                  <th className="px-8 py-5 cursor-pointer hover:text-slate-200 transition-colors" onClick={() => toggleSort('price')}>
                    Market Value {sortBy === 'price' && (sortOrder === 'asc' ? <ArrowUpWideNarrow className="inline w-3 h-3 ml-1" /> : <ArrowDownWideNarrow className="inline w-3 h-3 ml-1" />)}
                  </th>
                  <th className="px-8 py-5 cursor-pointer hover:text-slate-200 transition-colors" onClick={() => toggleSort('change')}>
                    24H Delta {sortBy === 'change' && (sortOrder === 'asc' ? <ArrowUpWideNarrow className="inline w-3 h-3 ml-1" /> : <ArrowDownWideNarrow className="inline w-3 h-3 ml-1" />)}
                  </th>
                  <th className="px-8 py-5 cursor-pointer hover:text-slate-200 transition-colors" onClick={() => toggleSort('dna')}>
                    DNA Signal {sortBy === 'dna' && (sortOrder === 'asc' ? <ArrowUpWideNarrow className="inline w-3 h-3 ml-1" /> : <ArrowDownWideNarrow className="inline w-3 h-3 ml-1" />)}
                  </th>
                  <th className="px-8 py-5">Risk Matrix</th>
                  <th className="px-8 py-5 text-right">Terminal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {processedStocks.map(stock => (
                  <tr
                    key={stock.id}
                    className="hover:bg-white/[0.03] transition-all group cursor-pointer"
                    onClick={() => handleDeepDive(stock)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center font-black text-xs text-indigo-400 border border-white/5 group-hover:border-indigo-500/30 transition-all">
                          {stock.ticker[0]}
                        </div>
                        <div>
                          <div className="font-black text-xl text-white tracking-tighter group-hover:text-indigo-400 transition-colors">{stock.ticker}</div>
                          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{stock.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="font-mono text-white text-lg font-bold">${stock.price.toFixed(2)}</div>
                    </td>
                    <td className="px-8 py-6">
                      <div className={clsx(
                        "flex items-center gap-1.5 text-sm font-black font-mono",
                        stock.changePercent >= 0 ? "text-emerald-400" : "text-rose-400"
                      )}>
                        {stock.changePercent >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                        {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="flex-1 h-2 w-24 bg-white/5 rounded-full overflow-hidden border border-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${stock.dnaScore}%` }}
                            transition={{ duration: 1, ease: "circOut" }}
                            className={clsx(
                              "h-full rounded-full",
                              stock.dnaScore >= 70 ? "bg-gradient-to-r from-emerald-500 to-indigo-500" :
                                stock.dnaScore >= 40 ? "bg-gradient-to-r from-indigo-500 to-cyan-500" : "bg-gradient-to-r from-rose-500 to-orange-500"
                            )}
                          />
                        </div>
                        <span className="font-black text-lg text-white font-mono drop-shadow-[0_0_10px_rgba(99,102,241,0.3)]">{stock.dnaScore}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        {stock.dnaScore >= 70 ? <ShieldCheck className="w-4 h-4 text-emerald-500" /> : stock.dnaScore >= 40 ? <Shield className="w-4 h-4 text-amber-500" /> : <ShieldAlert className="w-4 h-4 text-rose-500" />}
                        <span className={clsx(
                          "text-[10px] font-black uppercase tracking-widest",
                          stock.dnaScore >= 70 ? "text-emerald-500" : stock.dnaScore >= 40 ? "text-amber-500" : "text-rose-400"
                        )}>
                          {stock.dnaScore >= 70 ? 'Optimal' : stock.dnaScore >= 40 ? 'Moderate' : 'High Risk'}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button className="p-3 bg-white/5 text-slate-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-all active:scale-90 border border-white/5 hover:border-indigo-500/30 hover:text-indigo-400">
                        <ArrowUpRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {processedStocks.map(stock => (
            <Card
              key={stock.id}
              className="p-6 bg-slate-900/40 backdrop-blur-xl border border-white/5 hover:border-indigo-500/40 transition-all group cursor-pointer group rounded-[2rem]"
              onClick={() => handleDeepDive(stock)}
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center font-black text-lg text-indigo-400 group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500">
                  {stock.ticker[0]}
                </div>
                <div className={clsx(
                  "px-3 py-1.5 rounded-full text-[10px] font-black uppercase hover:shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all",
                  stock.changePercent >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                )}>
                  {stock.changePercent >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-3xl font-black text-white tracking-tighter group-hover:text-indigo-400 transition-colors">{stock.ticker}</h3>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-[0.2em] mt-1">{stock.name}</p>
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-1">Asset Value</p>
                  <p className="text-3xl font-mono font-black text-white">${stock.price.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-600 uppercase font-black tracking-widest mb-1">DNA Power</p>
                  <div className="flex items-center gap-2">
                    <Zap className={clsx("w-4 h-4 fill-current", stock.dnaScore >= 70 ? "text-emerald-400" : "text-amber-400")} />
                    <p className="text-2xl font-mono text-white font-black">{stock.dnaScore}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Deep-Dive Modal */}
      {terminalData && (
        <StockTerminalModal
          isOpen={!!terminalData}
          onClose={() => setTerminalData(null)}
          data={terminalData}
          onSimulation={async () => {
            const res = await addToPortfolio(terminalData.ticker, terminalData.price || 0);
            alert(res.message);
          }}
          onAddToWatchlist={async () => {
            await addToWatchlist(terminalData.ticker);
            alert(`${terminalData.ticker}가 관심 종목에 추가되었습니다.`);
          }}
        />
      )}
    </div>
  );
};
