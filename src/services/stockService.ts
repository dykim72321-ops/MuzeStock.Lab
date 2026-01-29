import { supabase } from '../lib/supabase';
import type { Stock } from '../types';

// Penny stock tickers to scan
export const PENNY_STOCK_TICKERS = ['SNDL', 'CLOV', 'SOFI', 'PLTR', 'BB'];

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
    
    if (!data['Global Quote'] || !data['Global Quote']['05. price']) {
      console.warn(`No data for ${ticker}`);
      return null;
    }

    const quote = data['Global Quote'];
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
        debtToEquity: 0.3, // Placeholder - needs fundamental data
        rndRatio: 15.0,
        revenueGrowth: 25,
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
  const stocks = await fetchMultipleStocks(PENNY_STOCK_TICKERS);
  // Sort by DNA score descending
  return stocks.sort((a, b) => b.dnaScore - a.dnaScore);
}

// Helper functions
function calculateDnaScore(price: number, change: number, volume: number): number {
  // Simplified DNA score calculation
  // In production, this would use ML models comparing to historical patterns
  let score = 50; // Base score
  
  // Price under $5 (penny stock territory) gets bonus
  if (price < 1) score += 20;
  else if (price < 5) score += 10;
  
  // Positive momentum
  if (change > 5) score += 15;
  else if (change > 0) score += 5;
  
  // High volume indicates interest
  if (volume > 10000000) score += 15;
  else if (volume > 1000000) score += 10;
  
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
