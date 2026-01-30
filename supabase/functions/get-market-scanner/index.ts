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

    // Batch processing to avoid rate limits and timeouts
    // Finnhub limit is ~60/min, but burst limit exists.
    // Process in chunks of 5 with small delay.
    const CHUNK_SIZE = 5;
    const results = [];
    
    for (let i = 0; i < tickers.length; i += CHUNK_SIZE) {
      const chunk = tickers.slice(i, i + CHUNK_SIZE);
      
      const chunkPromises = chunk.map(async (ticker) => {
        try {
          const url = `https://finnhub.io/api/v1/quote?symbol=${ticker}&token=${FINNHUB_API_KEY}`
          const res = await fetch(url)
          
          if (!res.ok) {
             console.warn(`Error fetching ${ticker}: ${res.statusText}`)
             return null
          }
          
          const data = await res.json()
          
          // Finnhub returns 0s if ticker invalid or no data
          if (data.c === 0 && data.dp === 0) return null;

          return {
            ticker,
            price: data.c,
            changePercent: data.dp,
            volume: data.v || 0,
            rawVolume: data.v || 0
          }
        } catch (e) {
          console.error(`Failed to fetch ${ticker}`, e)
          return null
        }
      })

      const chunkResults = await Promise.all(chunkPromises);
      results.push(...chunkResults);

      // Add small delay between chunks (approx 200ms)
      if (i + CHUNK_SIZE < tickers.length) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
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
