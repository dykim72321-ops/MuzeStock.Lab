// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const ALPHA_VANTAGE_API_KEY = Deno.env.get("ALPHA_VANTAGE_API_KEY")

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

    const quoteUrl = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
    const overviewUrl = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
    const sentimentUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&limit=5&apikey=${ALPHA_VANTAGE_API_KEY}`
    const institutionalUrl = `https://www.alphavantage.co/query?function=INSTITUTIONAL_OWNERSHIP&symbol=${ticker}&apikey=${ALPHA_VANTAGE_API_KEY}`
    
    const [quoteRes, overviewRes, sentimentRes, institutionalRes] = await Promise.all([
      fetch(quoteUrl),
      fetch(overviewUrl),
      fetch(sentimentUrl),
      fetch(institutionalUrl)
    ])

    const quoteData = await quoteRes.json()
    const overviewData = await overviewRes.json()
    const sentimentData = await sentimentRes.json()
    const institutionalData = await institutionalRes.json()

    return new Response(JSON.stringify({ 
      quote: quoteData, 
      overview: overviewData,
      sentiment: sentimentData,
      institutional: institutionalData
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
