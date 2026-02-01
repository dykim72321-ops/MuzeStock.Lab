// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Yahoo Finance API (unofficial) - using query endpoints
const YAHOO_BASE_URL = 'https://query1.finance.yahoo.com/v10/finance/quoteSummary'

interface YahooQuoteData {
  price: number;
  changePercent: number;
  volume: number;
  marketCap: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  targetMeanPrice: number;
  recommendationKey: string;
  numberOfAnalystOpinions: number;
  dividendYield: number;
  trailingPE: number;
  forwardPE: number;
}

// In-memory fallback cache
let memorySession: { cookie: string; crumb: string; timestamp: number } | null = null;
const SESSION_TTL = 1000 * 60 * 30; // 30 minutes

async function getYahooSession() {
  const now = Date.now();
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  
  // 1. Try to get session from DB (shared across instances)
  try {
    const { data: dbSession } = await supabase
      .from('yahoo_session')
      .select('*')
      .eq('id', 'global')
      .single();
    
    if (dbSession && (now - new Date(dbSession.updated_at).getTime() < SESSION_TTL)) {
      console.log('✅ Using DB-cached Yahoo Session');
      return { cookie: dbSession.cookie, crumb: dbSession.crumb };
    }
  } catch (e) {
    console.warn('DB session fetch failed, will create new session:', e);
  }

  // 2. Check in-memory cache (fallback)
  if (memorySession && (now - memorySession.timestamp < SESSION_TTL)) {
    console.log('✅ Using memory-cached Yahoo Session');
    return memorySession;
  }

  // 3. Create new session
  console.log('🔄 Creating new Yahoo Session...');
  
  const userAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

  const cookieRes = await fetch('https://fc.yahoo.com', {
    headers: { 'User-Agent': userAgent },
    redirect: 'manual'
  });
  
  const setCookie = cookieRes.headers.get('set-cookie');
  if (!setCookie) throw new Error('Failed to obtain Yahoo cookies');

  const crumbRes = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
    headers: {
      'Cookie': setCookie,
      'User-Agent': userAgent,
      'Origin': 'https://finance.yahoo.com',
      'Referer': 'https://finance.yahoo.com/'
    }
  });

  const crumb = await crumbRes.text();
  if (!crumb || crumb.includes('html') || crumb.length > 100) {
    throw new Error('Failed to obtain valid Yahoo crumb');
  }

  // Save to DB for cross-instance sharing
  try {
    await supabase.from('yahoo_session').upsert({
      id: 'global',
      cookie: setCookie,
      crumb: crumb,
      updated_at: new Date().toISOString()
    }, { onConflict: 'id' });
    console.log('💾 Session saved to DB');
  } catch (e) {
    console.warn('Failed to save session to DB:', e);
  }

  // Also save to memory
  memorySession = { cookie: setCookie, crumb, timestamp: now };
  console.log('✅ New Yahoo Session Acquired');
  
  return { cookie: setCookie, crumb };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ticker } = await req.json()
    if (!ticker) throw new Error('Ticker symbol is required')

    // Get Session (Cached or New)
    let session;
    try {
      session = await getYahooSession();
    } catch (sessionErr) {
      console.error('Session Error:', sessionErr);
      // Fallback: Try one more time without cache logic implies a retry, 
      // but here we just fail gracefully to let client handle it or just retry naturally next time.
      throw new Error('Yahoo Authentication Failed');
    }

    const modules = [
      'price', 'summaryDetail', 'financialData', 
      'recommendationTrend', 'defaultKeyStatistics'
    ].join(',')

    const url = `${YAHOO_BASE_URL}/${ticker}?modules=${modules}&crumb=${session.crumb}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Cookie': session.cookie,
        'Origin': 'https://finance.yahoo.com',
        'Referer': `https://finance.yahoo.com/quote/${ticker}`
      }
    })

    if (!response.ok) {
       // If 401, maybe session expired prematurely? Reset cache.
       if (response.status === 401 || response.status === 403) {
         memorySession = null;
         console.warn('⚠️ Session rejected by Yahoo. Cache cleared for next request.');
       }
       throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json()
    const result = data?.quoteSummary?.result?.[0]

    if (!result) {
      throw new Error(`No data found for ${ticker}`)
    }

    const price = result.price || {}
    const summaryDetail = result.summaryDetail || {}
    const financialData = result.financialData || {}
    const keyStats = result.defaultKeyStatistics || {}

    // Extract and normalize data
    const quoteData: YahooQuoteData = {
      price: price.regularMarketPrice?.raw || 0,
      changePercent: price.regularMarketChangePercent?.raw || 0,
      volume: price.regularMarketVolume?.raw || 0,
      marketCap: price.marketCap?.raw || 0,
      fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh?.raw || 0,
      fiftyTwoWeekLow: summaryDetail.fiftyTwoWeekLow?.raw || 0,
      targetMeanPrice: financialData.targetMeanPrice?.raw || 0,
      recommendationKey: financialData.recommendationKey || 'none',
      numberOfAnalystOpinions: financialData.numberOfAnalystOpinions?.raw || 0,
      dividendYield: summaryDetail.dividendYield?.raw || 0,
      trailingPE: summaryDetail.trailingPE?.raw || 0,
      forwardPE: keyStats.forwardPE?.raw || 0,
    }

    // Calculate upside potential
    const upsidePotential = quoteData.targetMeanPrice > 0 && quoteData.price > 0
      ? ((quoteData.targetMeanPrice - quoteData.price) / quoteData.price) * 100
      : 0

    // Calculate position in 52-week range (0 = at low, 100 = at high)
    const fiftyTwoWeekPosition = quoteData.fiftyTwoWeekHigh > quoteData.fiftyTwoWeekLow
      ? ((quoteData.price - quoteData.fiftyTwoWeekLow) / (quoteData.fiftyTwoWeekHigh - quoteData.fiftyTwoWeekLow)) * 100
      : 50

    // Map recommendation to score (1-5)
    const recommendationScoreMap: Record<string, number> = {
      'strongBuy': 5, 'buy': 4, 'hold': 3, 'sell': 2, 'strongSell': 1, 'none': 0
    }
    const recommendationScore = recommendationScoreMap[quoteData.recommendationKey] || 0

    return new Response(JSON.stringify({
      ticker,
      ...quoteData,
      upsidePotential,
      fiftyTwoWeekPosition,
      recommendationScore,
      source: 'yahoo'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    console.error('Yahoo Finance Error:', error)
    return new Response(JSON.stringify({ 
      error: error.message,
      ticker: null 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
