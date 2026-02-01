// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { ticker } = await req.json()
    
    if (!ticker) {
      throw new Error('Ticker symbol is required')
    }

    // Fetch quote summary with multiple modules
    const modules = [
      'price',
      'summaryDetail',
      'financialData',
      'recommendationTrend',
      'defaultKeyStatistics'
    ].join(',')

    const url = `${YAHOO_BASE_URL}/${ticker}?modules=${modules}`
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }

    const data = await response.json()
    const result = data?.quoteSummary?.result?.[0]

    if (!result) {
      throw new Error(`No data found for ${ticker}`)
    }

    const price = result.price || {}
    const summaryDetail = result.summaryDetail || {}
    const financialData = result.financialData || {}
    const recommendationTrend = result.recommendationTrend?.trend?.[0] || {}
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
      'strongBuy': 5,
      'buy': 4,
      'hold': 3,
      'sell': 2,
      'strongSell': 1,
      'none': 0
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
