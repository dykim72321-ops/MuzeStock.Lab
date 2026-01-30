import { supabase } from '../lib/supabase';
import type { Stock } from '../types';

// Penny stock tickers to scan
// Expanded stock list for scanner (30+ stocks)
// Focused Penny Stock Watchlist (Targeting $1-$5 range with high volume)
export const WATCHLIST_TICKERS = [
  'SNDL', 'MULN', 'IDEX', 'ZOM', 'FCEL', 'OCGN', 'BNGO', 'CTXR', // Sub $1-$2
  'CLOV', 'BB', 'AMC', 'GME', 'NKLA', 'OPEN', 'LCID', // Volatile Small/Mid Caps
  'SOFI', 'PLTR', 'PLUG', 'FUBO', 'DKNG', // Popular Retail Favorites
  'MARA', 'RIOT', 'HUT', 'BITF', // Crypto Miners (High Volatility)
  'NIO', 'XPEV', 'GRAB', 'CPNG' // International Growth
];

// Cache for storing fetched data
const cache = new Map<string, { data: Stock; timestamp: number }>();
const CACHE_DURATION = 15 * 60 * 1000; // 15 minutes

export async function fetchStockQuote(ticker: string): Promise<Stock | null> {
  // Check cache first
  const cached = cache.get(ticker);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  try {
    // Calling Supabase Edge Function instead of direct Alpha Vantage to secure the API key
    const { data, error } = await supabase.functions.invoke('get-stock-quote', {
      body: { ticker }
    });
    
    if (error) throw error;
    
    // Defensive checks for API rate limiting or empty responses
    if (!data || !data.quote) {
      console.warn(`No API response for ${ticker} (possible rate limit)`);
      return null;
    }
    
    const { quote: quoteData, overview: overviewData, sentiment: sentimentData, institutional: institutionalData } = data;
    
    if (!quoteData || !quoteData['Global Quote'] || !quoteData['Global Quote']['05. price']) {
      console.warn(`No data for ${ticker}`);
      return null;
    }
    
    // Ensure overviewData exists (may be empty for some stocks or during rate limiting)
    const overview = overviewData || {};

    const quote = quoteData['Global Quote'];
    const price = parseFloat(quote['05. price']);
    const changePercent = parseFloat(quote['10. change percent'].replace('%', ''));
    const volume = parseInt(quote['06. volume'], 10);

    // Create Stock object
    const stock: Stock = {
      id: ticker,
      ticker: quote['01. symbol'],
      name: getCompanyName(ticker), // Helper function
      price,
      changePercent,
      volume,
      marketCap: 'N/A', // Would need separate API call
      dnaScore: calculateDnaScore(price, changePercent, volume), // Simplified score
      sector: getSector(ticker),
      description: getDescription(ticker),
      relevantMetrics: {
        debtToEquity: parseFloat(overview['DebtToEquityTTL'] || '0'), 
        rndRatio: 15.0, // R&D data often hard to get from free APIs, usually kept as estimate or separate calculation
        revenueGrowth: parseFloat(overview['QuarterlyRevenueGrowthYOY'] || '0') * 100,
        peRatio: parseFloat(overview['PERatio'] || '0'),
        eps: parseFloat(overview['EPS'] || '0'),
        revenue: parseInt(overview['RevenueTTM'] || '0', 10),
        grossProfit: parseInt(overview['GrossProfitTTM'] || '0', 10),
        operatingMargin: parseFloat(overview['OperatingMarginTTM'] || '0'),
        sentimentScore: sentimentData?.feed?.[0]?.overall_sentiment_score || 0,
        sentimentLabel: sentimentData?.feed?.[0]?.overall_sentiment_label || 'Neutral',
        institutionalOwnership: institutionalData?.data?.[0]?.ownership || 0,
        topInstitution: institutionalData?.data?.[0]?.investorName || 'N/A',
      },
    };

    // Update cache
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
    // 1. Fetch discovered tickers from Finviz Hunter Bot (daily_discovery table)
    const { data: discoveryData, error: discoveryError } = await supabase
      .from('daily_discovery')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(30);

    if (discoveryError) throw discoveryError;

    // Use discovered tickers or fallback to static watchlist
    const tickersToSync = (discoveryData && discoveryData.length > 0) 
      ? discoveryData.map((item: any) => item.ticker)
      : WATCHLIST_TICKERS;

    console.log(`📡 Syncing ${tickersToSync.length} stocks with real-time data...`);

    // 2. Fetch real-time market data for these tickers via Edge Function
    const { data: realTimeData, error: syncError } = await supabase.functions.invoke('get-market-scanner', {
      body: { tickers: tickersToSync }
    });

    if (syncError) throw syncError;
    if (!realTimeData) return [];

    // 3. Map discovery metadata (like sector) with real-time prices
    const stocks: Stock[] = realTimeData.map((rtItem: any) => {
      // Find discovery metadata if available
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

    // 4. Return sorted by DNA Score (Higher score = Better opportunity)
    return stocks.sort((a, b) => b.dnaScore - a.dnaScore);

  } catch (err) {
    console.warn('Real-time sync failed, falling back to cached fetchMultipleStocks:', err);
    return fetchMultipleStocks(WATCHLIST_TICKERS.slice(0, 5));
  }
}

// Helper functions
function calculateDnaScore(price: number, change: number, volume: number): number {
  // Simplified DNA score calculation
  // In production, this would use ML models comparing to historical patterns
  // Penny Stock DNA Score (Explosive Potential Focus)
  let score = 50; 
  
  // 1. Price Factor: Lower is Better (The "Golden Zone" is $0.50 - $2.00)
  if (price < 1.0) score += 30;       // Jackpot zone
  else if (price < 3.0) score += 20;  // Sweet spot
  else if (price < 5.0) score += 10;  // Acceptable
  else if (price > 20.0) score -= 20; // Too expensive for this strategy
  
  // 2. Momentum Factor: We want EXPLOSIVE moves
  if (change > 15) score += 20;       // Ripping
  else if (change > 5) score += 10;   // Moving
  else if (change < -5) score -= 5;   // Dumping (catch falling knife risky)
  
  // 3. Volume Factor: Liquidity is King
  if (volume > 50000000) score += 20; // Mega volume
  else if (volume > 10000000) score += 10;
  
  return Math.min(100, Math.max(0, score));
}

function getCompanyName(ticker: string): string {
  const names: Record<string, string> = {
    SNDL: 'Sundial Growers',
    CLOV: 'Clover Health',
    SOFI: 'SoFi Technologies',
    PLTR: 'Palantir Technologies',
    BB: 'BlackBerry Limited',
  };
  return names[ticker] || ticker;
}

function getSector(ticker: string): string {
  const sectors: Record<string, string> = {
    SNDL: 'Cannabis',
    CLOV: 'Healthcare',
    SOFI: 'Fintech',
    PLTR: 'Software',
    BB: 'Cybersecurity',
  };
  return sectors[ticker] || 'Technology';
}

function getDescription(ticker: string): string {
  const descriptions: Record<string, string> = {
    SNDL: 'Canadian cannabis company focused on cultivation and retail.',
    CLOV: 'Medicare Advantage insurer using AI-driven healthcare platform.',
    SOFI: 'Digital financial services company offering loans and investing.',
    PLTR: 'Big data analytics company serving government and enterprise.',
    BB: 'Enterprise software and IoT security solutions provider.',
  };
  return descriptions[ticker] || 'Technology company';
}
