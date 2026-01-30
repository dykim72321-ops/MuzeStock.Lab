// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { tickers } = await req.json()
    
    if (!tickers || !Array.isArray(tickers)) {
      throw new Error('Tickers array is required')
    }

    // Finnhub allows 60 calls/min. We can fetch concurrently.
    // For 30 stocks, we can fire 30 requests. It's fast.
    const promises = tickers.map(async (ticker) => {
      try {
        const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
        const res = await fetch(url)
        const data = await res.json()
        
        // Finnhub response: { c: current price, d: change, dp: percent change, ... }
        return {
          ticker,
          price: data.c,
          changePercent: data.dp,
          volume: 0, // Finnhub Quote API doesn't always return volume, or it's limited. We'll use 0 or verify.
          // Finnhub quote has 'v' for volume sometimes, but often 0 for delayed data.
          // Let's check 'v' field.
          rawVolume: data.v
        }
      } catch (e) {
        console.error(`Failed to fetch ${ticker}`, e)
        return null
      }
    })

    const results = await Promise.all(promises)
    const validResults = results.filter(r => r !== null && r.price > 0)

    return new Response(JSON.stringify(validResults), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
