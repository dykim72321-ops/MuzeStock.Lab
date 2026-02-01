import { supabase } from '../lib/supabase';
import type { Stock } from '../types';
import { apiCircuitBreaker } from '../utils/circuitBreaker';
import { validateStockData } from '../utils/normalizer';

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

// Finnhub API Key
const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;

// Finnhub API fallback for real-time quotes
async function fetchFromFinnhub(ticker: string): Promise<Stock | null> {
  if (!FINNHUB_API_KEY) {
    console.warn('Finnhub API key not configured');
    return null;
  }
  
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error(`Finnhub API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Finnhub returns: c=current, d=change, dp=percent change, h=high, l=low, o=open, pc=previous close
    if (!data || data.c === 0 || data.c === undefined) {
      console.warn(`[Finnhub] No data for ${ticker}`);
      return null;
    }
    
    const stock: Stock = {
      id: ticker,
      ticker: ticker,
      name: getCompanyName(ticker),
      price: data.c,
      changePercent: data.dp || 0,
      volume: 0, // Finnhub quote doesn't include volume, would need separate call
      marketCap: 'N/A',
      dnaScore: calculateDnaScore(data.c, data.dp || 0, 0),
      sector: getSector(ticker),
      description: '',
      relevantMetrics: {
        debtToEquity: 0,
        rndRatio: 0,
        sentimentScore: 0,
        institutionalOwnership: 0,
      }
    };
    
    console.log(`[Finnhub] Successfully fetched ${ticker}: $${data.c}`);
    
    // Cache the result
    cache.set(ticker, { data: stock, timestamp: Date.now() });
    
    return stock;
  } catch (err) {
    console.error(`[Finnhub] Failed for ${ticker}:`, err);
    return null;
  }
}

// Yahoo Finance API fallback (via Edge Function) - provides richer data
async function fetchFromYahoo(ticker: string): Promise<Stock | null> {
  try {
    const { data, error } = await supabase.functions.invoke('get-yahoo-quote', {
      body: { ticker }
    });
    
    if (error || !data || data.error) {
      console.warn(`[Yahoo] Failed for ${ticker}:`, error || data?.error);
      return null;
    }
    
    // Calculate enhanced DNA score using Yahoo data
    let dnaScore = calculateDnaScore(data.price, data.changePercent, data.volume);
    
    // Boost score based on analyst recommendations
    if (data.recommendationScore >= 4) dnaScore += 15; // Buy/Strong Buy
    else if (data.recommendationScore === 3) dnaScore += 5; // Hold
    
    // Boost if near 52-week low (potential upside)
    if (data.fiftyTwoWeekPosition < 30) dnaScore += 10;
    
    // Boost if significant upside potential
    if (data.upsidePotential > 50) dnaScore += 10;
    else if (data.upsidePotential > 20) dnaScore += 5;
    
    dnaScore = Math.min(100, Math.max(0, dnaScore));
    
    const stock: Stock = {
      id: ticker,
      ticker: ticker,
      name: getCompanyName(ticker),
      price: data.price,
      changePercent: data.changePercent,
      volume: data.volume,
      marketCap: formatMarketCap(data.marketCap),
      dnaScore: dnaScore,
      sector: getSector(ticker),
      description: '',
      relevantMetrics: {
        debtToEquity: 0,
        rndRatio: 0,
        sentimentScore: data.recommendationScore * 20, // Convert 0-5 to 0-100
        institutionalOwnership: 0,
        // Extended Yahoo data
        targetPrice: data.targetMeanPrice,
        upsidePotential: data.upsidePotential,
        fiftyTwoWeekPosition: data.fiftyTwoWeekPosition,
        analystCount: data.numberOfAnalystOpinions,
        recommendation: data.recommendationKey,
      }
    };
    
    console.log(`[Yahoo] Successfully fetched ${ticker}: $${data.price} (Target: $${data.targetMeanPrice})`);
    
    // Cache the result
    cache.set(ticker, { data: stock, timestamp: Date.now() });
    
    return stock;
  } catch (err) {
    console.error(`[Yahoo] Failed for ${ticker}:`, err);
    return null;
  }
}

// Helper to format market cap
function formatMarketCap(value: number): string {
  if (!value || value === 0) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  return `$${value.toLocaleString()}`;
}

export async function fetchStockQuote(ticker: string): Promise<Stock | null> {
  const cached = cache.get(ticker);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

// Fallback helper to return partial data from cache or minimal object
    const getFallback = async (): Promise<Stock | null> => {
      // 1. 메모리 캐시 확인
      if (cached) {
        console.warn(`[CircuitBreaker] Serving stale memory cache for ${ticker}`);
        return cached.data;
      }
      
      // 2. Yahoo Finance API 시도 (가장 풍부한 데이터)
      const yahooData = await fetchFromYahoo(ticker);
      if (yahooData && yahooData.price > 0) {
        return yahooData;
      }
      
      // 3. Finnhub API 시도 (실시간 데이터)
      const finnhubData = await fetchFromFinnhub(ticker);
      if (finnhubData && finnhubData.price > 0) {
        return finnhubData;
      }
      
      // 3. DB 캐시 확인 (오래된 데이터라도 반환)
      try {
        const { data: dbCache } = await supabase
          .from('stock_cache')
          .select('*')
          .eq('ticker', ticker)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();
        
        if (dbCache) {
          console.warn(`[CircuitBreaker] Serving stale DB cache for ${ticker}`);
          // DB 데이터를 Stock 타입으로 매핑
          return {
            id: ticker,
            ticker,
            name: dbCache.name || ticker,
            price: dbCache.price || 0,
            changePercent: dbCache.change_percent || 0,
            volume: dbCache.volume || 0,
            marketCap: dbCache.market_cap || 'N/A',
            dnaScore: dbCache.dna_score || 0,
            sector: dbCache.sector || 'Unknown',
            description: dbCache.description || '',
            relevantMetrics: {
              debtToEquity: 0,
              rndRatio: 0,
              sentimentScore: 0,
              institutionalOwnership: 0,
            }
          };
        }
      } catch (err) {
        console.error(`[CircuitBreaker] DB fallback failed for ${ticker}:`, err);
      }
      
      return null;
    };

    return await apiCircuitBreaker.execute(async () => {
      const { data, error } = await supabase.functions.invoke('get-stock-quote', {
        body: { ticker }
      });
      
      if (error) throw error;
      
      if (!data || !data.quote) {
        console.warn(`No price data for ${ticker}`);
        throw new Error(`Data missing for ${ticker}`); // Trip Circuit Breaker
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
      if (!quote || !quote['05. price']) {
         throw new Error(`Invalid quote data for ${ticker}`);
      }

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
          debtToEquity: parseFloat(overview['DebtToEquityTTL'] || '0'),
          rndRatio: 15.0, // Default estimate
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
        news: sentimentData?.feed?.map((f: any) => ({
          title: f.title,
          url: f.url,
          time_published: f.time_published
        })) || []
      };

      if (!validateStockData(stock)) {
         console.warn(`[DataQuality] Invalid stock data for ${ticker}, discarding.`);
         return null;
      }

      cache.set(ticker, { data: stock, timestamp: Date.now() });
      return stock;
    }, getFallback);
}

export async function fetchMultipleStocks(tickers: string[]): Promise<Stock[]> {
  const results = await Promise.all(tickers.map(fetchStockQuote));
  return results.filter((stock): stock is Stock => stock !== null);
}

export async function getTopStocks(): Promise<Stock[]> {
  try {
    // 1. 24시간 이내 데이터만 조회
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: discoveryData, error: discoveryError } = await supabase
      .from('daily_discovery')
      .select('*')
      .gte('created_at', twentyFourHoursAgo) // 신선도 필터
      .order('updated_at', { ascending: false })
      .limit(20); // API 부담 감소: 50 → 20

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

    // 2. 섹터별 그룹화 및 다양성 적용
    const bySector = stocks.reduce((acc, stock) => {
      const sector = stock.sector || 'Unknown';
      if (!acc[sector]) acc[sector] = [];
      acc[sector].push(stock);
      return acc;
    }, {} as Record<string, Stock[]>);

    // 3. 각 섹터에서 최대 3개씩 선택하여 다양성 확보
    const diverseStocks = Object.values(bySector)
      .flatMap(sectorStocks => 
        sectorStocks
          .sort((a, b) => b.dnaScore - a.dnaScore)
          .slice(0, 3)
      )
      .sort((a, b) => b.dnaScore - a.dnaScore)
      .slice(0, 30);

    return diverseStocks;
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
