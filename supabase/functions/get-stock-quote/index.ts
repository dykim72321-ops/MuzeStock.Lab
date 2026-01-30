// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALPHA_VANTAGE_API_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

// Cache duration: 15 minutes for quotes, 24 hours for overview
const QUOTE_CACHE_MINUTES = 15
const OVERVIEW_CACHE_HOURS = 24

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      }
    })
  }

  try {
    const { ticker } = await req.json()
    if (!ticker) {
      return new Response(JSON.stringify({ error: "Ticker is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)

    // 1. Check cache first
    const { data: cached } = await supabase
      .from('stock_cache')
      .select('*')
      .eq('ticker', ticker.toUpperCase())
      .single()

    const now = new Date()
    let quoteData = null
    let overviewData = null
    let needsQuoteRefresh = true
    let needsOverviewRefresh = true

    if (cached) {
      const cacheTime = new Date(cached.updated_at)
      const minutesSinceUpdate = (now.getTime() - cacheTime.getTime()) / (1000 * 60)
      
      // Use cached quote if less than 15 minutes old
      if (minutesSinceUpdate < QUOTE_CACHE_MINUTES && cached.quote_data) {
        quoteData = cached.quote_data
        needsQuoteRefresh = false
      }
      
      // Use cached overview if less than 24 hours old
      if (minutesSinceUpdate < OVERVIEW_CACHE_HOURS * 60 && cached.overview_data) {
        overviewData = cached.overview_data
        needsOverviewRefresh = false
      }
    }

    // 2. Fetch fresh data if needed
    if (needsQuoteRefresh) {
      const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
      const quoteRes = await fetch(quoteUrl)
      quoteData = await quoteRes.json()
    }

    if (needsOverviewRefresh) {
      const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
      const overviewRes = await fetch(overviewUrl)
      overviewData = await overviewRes.json()
    }

    // 3. Update cache if we fetched fresh data
    if (needsQuoteRefresh || needsOverviewRefresh) {
      await supabase
        .from('stock_cache')
        .upsert({
          ticker: ticker.toUpperCase(),
          quote_data: quoteData,
          overview_data: overviewData,
          updated_at: now.toISOString()
        }, { onConflict: 'ticker' })
    }

    return new Response(JSON.stringify({ 
      quote: quoteData, 
      overview: overviewData,
      sentiment: cached?.sentiment_data || null,
      institutional: cached?.institutional_data || null,
      fromCache: !needsQuoteRefresh
    }), {
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        'Access-Control-Allow-Origin': '*',
      }
    })
  }
})
