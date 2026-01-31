import { supabase } from '../lib/supabase';
import type { Stock } from '../types';

// Focused Penny Stock Watchlist
export const WATCHLIST_TICKERS = [
  'SNDL', 'MULN', 'IDEX', 'ZOM', 'FCEL', 'OCGN', 'BNGO', 'CTXR',
  'CLOV', 'BB', 'AMC', 'GME', 'NKLA', 'OPEN', 'LCID',
  'SOFI', 'PLTR', 'PLUG', 'FUBO', 'DKNG',
  'MARA', 'RIOT', 'HUT', 'BITF',
  'NIO', 'XPEV', 'GRAB', 'CPNG'
];

const cache = new Map<string, { data: Stock; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000;

export async function fetchStockQuote(ticker: string): Promise<Stock | null> {
  const cached = cache.get(ticker);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    const { data, error } = await supabase.functions.invoke('get-stock-quote', {
      body: { ticker }
    });
    
    if (error) throw error;
    
    if (!data || !data.quote) {
      console.warn(`No price data for ${ticker}`);
      return null;
    }
    
    const { 
      quote: quoteData, 
      overview: overviewData, 
      cashFlow: cashFlowData,
      balanceSheet: balanceSheetData,
      sentiment: sentimentData, 
      institutional: institutionalData 
    } = data;
    
    const quote = quoteData['Global Quote'];
    if (!quote || !quote['05. price']) return null;

    // --- Financial Health Calculations (Resilient) ---
    const overview = overviewData || {};
    const cashFlow = cashFlowData || {};
    const balanceSheet = balanceSheetData || {};

    let totalCashValue = 0;
    let netIncomeValue = 0;
    let runwayMonths = undefined;

    try {
      if (balanceSheet.quarterlyReports && balanceSheet.quarterlyReports.length > 0) {
        const latestBS = balanceSheet.quarterlyReports[0];
        totalCashValue = parseFloat(latestBS.cashAndCashEquivalentsAtCarryingValue || '0') + 
                         parseFloat(latestBS.shortTermInvestments || '0');
      }

      if (cashFlow.quarterlyReports && cashFlow.quarterlyReports.length > 0) {
        const reports = cashFlow.quarterlyReports;
        netIncomeValue = reports.slice(0, 4).reduce((sum: number, r: any) => sum + parseFloat(r.netIncome || '0'), 0);
        const quarterlyOCFs = reports.slice(0, 4).map((r: any) => parseFloat(r.operatingCashflow || '0'));
        const negativeOCFs = quarterlyOCFs.filter((v: number) => v < 0);
        
        if (negativeOCFs.length > 0 && totalCashValue > 0) {
          const avgBurn = Math.abs(negativeOCFs.reduce((a: number, b: number) => a + b, 0) / negativeOCFs.length);
          if (avgBurn > 0) runwayMonths = Math.round((totalCashValue / avgBurn) * 3);
        } else if (quarterlyOCFs.length > 0 && totalCashValue > 0) {
          runwayMonths = 99; 
        }
      }
    } catch (calcErr) {
      console.error("Financial calculation error:", calcErr);
    }

    const formatCurrency = (val: number) => {
      if (val === 0) return 'N/A';
      if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(1)}B`;
      if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
      return `$${val.toLocaleString()}`;
    };

    const price = parseFloat(quote['05. price']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    const volume = parseInt(quote['06. volume'], 10);

    const stock: Stock = {
      id: ticker,
      ticker: quote['01. symbol'],
      name: getCompanyName(ticker),
      price,
      changePercent,
      volume,
      marketCap: 'N/A',
      dnaScore: calculateDnaScore(price, changePercent, volume),
      sector: getSector(ticker),
      description: getDescription(ticker),
      relevantMetrics: {
        revenueGrowth: parseFloat(overview['QuarterlyRevenueGrowthYOY'] || '0') * 100,
        peRatio: parseFloat(overview['PERatio'] || '0'),
        operatingMargin: parseFloat(overview['OperatingMarginTTM'] || '0'),
        sentimentScore: sentimentData?.feed?.[0]?.overall_sentiment_score || 0,
        sentimentLabel: sentimentData?.feed?.[0]?.overall_sentiment_label || 'Neutral',
        institutionalOwnership: institutionalData?.data?.[0]?.ownership || 0,
        topInstitution: institutionalData?.data?.[0]?.investorName || 'N/A',
        cashRunway: runwayMonths,
        netIncome: formatCurrency(netIncomeValue),
        totalCash: formatCurrency(totalCashValue),
      },
    };

    cache.set(ticker, { data: stock, timestamp: Date.now() });
    return stock;
  } catch (error) {
    console.error(`Failed to fetch ${ticker}:`, error);
    return null;
  }
}

export async function fetchMultipleStocks(tickers: string[]): Promise<Stock[]> {
  const results = await Promise.all(tickers.map(fetchStockQuote));
  return results.filter((stock): stock is Stock => stock !== null);
}

export async function getTopStocks(): Promise<Stock[]> {
  try {
    const { data: discoveryData, error: discoveryError } = await supabase
      .from('daily_discovery')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(30);

    if (discoveryError) throw discoveryError;

    const tickersToSync = (discoveryData && discoveryData.length > 0) 
      ? discoveryData.map((item: any) => item.ticker)
      : WATCHLIST_TICKERS.slice(0, 10);

    const { data: realTimeData, error: syncError } = await supabase.functions.invoke('get-market-scanner', {
      body: { tickers: tickersToSync }
    });

    if (syncError) throw syncError;
    if (!realTimeData) return [];

    const stocks: Stock[] = realTimeData.map((rtItem: any) => {
      const discoveryInfo = discoveryData?.find(d => d.ticker === rtItem.ticker);
      const price = rtItem.price || 0;
      const changePercent = rtItem.changePercent || 0;
      const volume = rtItem.rawVolume || 0;

      return {
        id: rtItem.ticker,
        ticker: rtItem.ticker,
        name: discoveryInfo?.name || getCompanyName(rtItem.ticker),
        price,
        changePercent,
        volume,
        marketCap: discoveryInfo?.market_cap || 'N/A',
        dnaScore: calculateDnaScore(price, changePercent, volume),
        sector: discoveryInfo?.sector || getSector(rtItem.ticker),
        description: discoveryInfo?.description || getDescription(rtItem.ticker),
        relevantMetrics: {
          sentimentScore: discoveryInfo?.sentiment_score || 0,
          institutionalOwnership: discoveryInfo?.institutional_ownership || 0,
        }
      };
    });

    return stocks.sort((a, b) => b.dnaScore - a.dnaScore);
  } catch (err) {
    console.warn('Real-time sync failed, falling back to cache:', err);
    return fetchMultipleStocks(WATCHLIST_TICKERS.slice(0, 5));
  }
}

function calculateDnaScore(price: number, change: number, volume: number): number {
  let score = 50; 
  if (price < 1.0) score += 30;
  else if (price < 3.0) score += 20;
  if (change > 15) score += 20;
  else if (change > 5) score += 10;
  if (volume > 10000000) score += 20;
  return Math.min(100, Math.max(0, score));
}

// ... (Keep existing helper functions getCompanyName, getSector, getDescription at the bottom)
export function getCompanyName(ticker: string): string {
  const names: Record<string, string> = {
    SNDL: 'Sundial Growers', CLOV: 'Clover Health', SOFI: 'SoFi Technologies',
    PLTR: 'Palantir Technologies', BB: 'BlackBerry Limited', MULN: 'Mullen Automotive'
  };
  return names[ticker] || ticker;
}

export function getSector(ticker: string | any): string {
  if (typeof ticker === 'object' && ticker !== null) return ticker.sector || 'Tech/Growth';
  const sectors: Record<string, string> = { SNDL: 'Cannabis', CLOV: 'Healthcare', SOFI: 'Fintech' };
  return sectors[ticker] || 'Tech/Growth';
}

function getDescription(ticker: string): string {
  const descriptions: Record<string, string> = { SNDL: 'Cannabis company', CLOV: 'Healthcare AI' };
  return descriptions[ticker] || 'High-growth potential stock.';
}
