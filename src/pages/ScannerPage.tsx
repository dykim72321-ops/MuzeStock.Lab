import { useState, useEffect, useMemo } from 'react';
import { Loader2, Zap, Search } from 'lucide-react';
import { getTopStocks } from '../services/stockService';
import type { Stock } from '../types';
import { StockTerminalModal } from '../components/dashboard/StockTerminalModal';
import { addToWatchlist } from '../services/watchlistService';
import { useNavigate } from 'react-router-dom';
import { calculateDNATargets } from '../utils/dnaMath';

import { processSignal } from '../utils/signalProcessor';

// Components
import { ScannerHeader } from '../components/scanner/ScannerHeader';
import { ScannerControls } from '../components/scanner/ScannerControls';
import { ScannerTopFive } from '../components/scanner/ScannerTopFive';
import { ScannerAssetList } from '../components/scanner/ScannerAssetList';

const RISK_LOW_MAX = 40;
const RISK_HIGH_MIN = 70;

export const ScannerPage = () => {
  const navigate = useNavigate();
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
  const [isHistorical, setIsHistorical] = useState(false);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const data = await getTopStocks(isHistorical);
      setStocks(data);
    } catch (err) {
      console.error('Failed to fetch stocks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, [isHistorical]);

  const sectors = useMemo(() => ['All', ...new Set(stocks.map(s => s.sector))], [stocks]);

  const processedStocks = useMemo(() => {
    return stocks
      .filter(stock => {
        const matchesSearch = stock.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
          stock.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDna = stock.dnaScore >= minDna;
        const matchesSector = selectedSector === 'All' || stock.sector === selectedSector;
        const matchesRisk = selectedRisk === 'All' ||
          (selectedRisk === 'Low' && stock.dnaScore < RISK_LOW_MAX) ||
          (selectedRisk === 'Medium' && stock.dnaScore >= RISK_LOW_MAX && stock.dnaScore < RISK_HIGH_MIN) ||
          (selectedRisk === 'High' && stock.dnaScore >= RISK_HIGH_MIN);

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
    const displaySignal = processSignal(stock);
    const cache = (stock as { stock_analysis_cache?: Array<{ analysis: any }> }).stock_analysis_cache?.[0]?.analysis;
    const rawSummary = stock.rawAiSummary || "";

    let quantData: any = undefined;
    if (rawSummary && rawSummary.trim().startsWith('{')) {
      try {
        quantData = JSON.parse(rawSummary);
      } catch (e) {
        console.warn(`Failed to parse raw summary for ${stock.ticker}:`, e);
      }
    }

    setTerminalData({
      ticker: stock.ticker,
      dnaScore: stock.dnaScore,
      bullPoints: displaySignal.bullPoints,
      bearPoints: displaySignal.bearPoints,
      riskLevel: cache?.riskLevel || 'Medium',
      formulaVerdict: displaySignal.reasoning,
      price: stock.price,
      change: `${stock.changePercent.toFixed(2)}%`,
      quantData
    });
  };

  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      {/* Terminal Grid Background Overlay */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Ambient Glows */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />

      <div className="max-w-[1600px] mx-auto px-6 py-8 space-y-8 animate-in fade-in duration-700 relative z-10">
        <ScannerHeader 
          loading={loading}
          onRefresh={fetchStocks}
          onNavigateWatchlist={() => navigate('/watchlist')}
        />

        <ScannerControls 
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          minDna={minDna}
          onMinDnaToggle={() => setMinDna(minDna === 70 ? 0 : 70)}
          isHistorical={isHistorical}
          onHistoricalToggle={() => setIsHistorical(!isHistorical)}
          selectedRisk={selectedRisk}
          onRiskChange={setSelectedRisk}
          selectedSector={selectedSector}
          onSectorChange={setSelectedSector}
          sectors={sectors}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
        />

        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 space-y-8">
            <div className="relative">
              <div className="w-20 h-20 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
              <Zap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-slate-400 font-black text-xs tracking-[0.3em] uppercase animate-pulse">Filtering Market Signal Matrix...</p>
          </div>
        ) : processedStocks.length === 0 ? (
          <div className="text-center py-40 bg-[#0b101a]/40 rounded-[2rem] border border-dashed border-slate-800 shadow-2xl backdrop-blur-sm">
            <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-800">
               <Search className="w-8 h-8 text-slate-600" />
            </div>
            <p className="text-slate-400 font-bold text-lg mb-4">No results matched your search matrix.</p>
            <button onClick={() => { setSearchTerm(''); setMinDna(0); setSelectedRisk('All'); setSelectedSector('All'); }} className="text-indigo-400 font-black uppercase text-xs hover:text-indigo-300 tracking-widest transition-colors py-2 px-4 bg-indigo-500/10 rounded-lg border border-indigo-500/20">Reset Core Filters</button>
          </div>
        ) : (
          <>
            <ScannerTopFive stocks={stocks} onDeepDive={handleDeepDive} />
            <div className="h-4" />
            <ScannerAssetList 
              viewMode={viewMode}
              stocks={processedStocks}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={toggleSort}
              onDeepDive={handleDeepDive}
            />
          </>
        )}
      </div>

      {terminalData && (
        <StockTerminalModal
          isOpen={!!terminalData}
          onClose={() => setTerminalData(null)}
          data={terminalData}
          onAddToWatchlist={async () => {
            try {
              const buyPrice = terminalData.price;
              const { targetPrice, stopPrice } = calculateDNATargets(
                buyPrice, 
                buyPrice,
                buyPrice,
                terminalData.quantData?.atr5
              );
              
              await addToWatchlist(
                terminalData.ticker, 
                undefined, 
                'WATCHING', 
                buyPrice,
                targetPrice,
                stopPrice,
                terminalData.dnaScore
              );
              navigate('/watchlist');
            } catch (err) {
              console.error('Failed to add to watchlist:', err);
              alert('종목 추가에 실패했습니다. 데이터베이스 컬럼(initial_dna_score) 생성 여부를 확인해주세요.');
            }
          }}
        />
      )}
    </div>
  );
};
