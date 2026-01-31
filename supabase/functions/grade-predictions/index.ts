
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const FINNHUB_API_KEY = Deno.env.get("FINNHUB_API_KEY")
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!)
    const now = new Date()
    // Identify predictions older than 7 days that haven't been checked
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data: predictions, error: fetchError } = await supabase
      .from('ai_predictions')
      .select('*')
      .is('checked_at', null)
      .lte('analysis_date', sevenDaysAgo)
      .limit(10) // Process in batches

    if (fetchError) throw fetchError
    if (!predictions || predictions.length === 0) {
      return new Response(JSON.stringify({ message: "No pending predictions to grade." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      })
    }

    const updates = []
    
    for (const pred of predictions) {
      // 1. Fetch current price
      let currentPrice = 0
      try {
        const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${pred.ticker}&token=${FINNHUB_API_KEY}`)
        const data = await res.json()
        currentPrice = data.c
      } catch (err) {
        console.error(`Failed to fetch current price for ${pred.ticker}`, err)
        continue
      }

      if (currentPrice <= 0) continue

      // 2. Grade prediction
      const entryPrice = parseFloat(pred.start_price)
      const percentChange = ((currentPrice - entryPrice) / entryPrice) * 100
      
      let isCorrect = false
      if (pred.predicted_direction === 'BULLISH' && percentChange > 0) isCorrect = true
      if (pred.predicted_direction === 'BEARISH' && percentChange < 0) isCorrect = true
      
      // 3. Prepare update
      updates.push({
        id: pred.id,
        checked_at: now.toISOString(),
        price_7d: currentPrice,
        accuracy_score: isCorrect ? 1.0 : 0.0,
        is_correct: isCorrect
      })
      
      // Update Persona Score logic could go here (e.g., incrementing persona_performance table)
      if (pred.persona_used) {
         await supabase.rpc('increment_persona_score', { 
           p_name: pred.persona_used, 
           p_is_correct: isCorrect 
         })
      }
    }

    if (updates.length > 0) {
      const { error: upsertError } = await supabase
        .from('ai_predictions')
        .upsert(updates)
      
      if (upsertError) throw upsertError
    }

    return new Response(JSON.stringify({ 
      processed: updates.length, 
      updates 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    })
  }
})
