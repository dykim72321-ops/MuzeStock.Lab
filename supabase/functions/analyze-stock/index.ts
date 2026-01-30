import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { ticker, price, change, volume, peRatio, revenueGrowth, operatingMargin, sentimentScore, sentimentLabel, institutionalOwnership, topInstitution } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    // 1. Fetch Global Market Context
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    let globalContext = "General Market Context: Uncertain.";
    
    try {
       const { data: contextData } = await supabase
         .from('market_context')
         .select('summary')
         .order('created_at', { ascending: false })
         .limit(1)
         .single();
       
       if (contextData?.summary) {
          globalContext = contextData.summary;
       }
    } catch (err) {
       console.warn("Failed to fetch market context, using default.", err);
    }

    const systemPrompt = `You are a professional stock analyst for MuzeStock.Lab. 
    
    [GLOBAL MARKET CONTEXT]
    ${globalContext}
    
    [INSTRUCTIONS]
    Analyze the provided stock data in the context of the global market situation above.
    Generate a JSON response with the following fields:
    - matchReasoning (string): A brief, insightful pattern recognition note (1-2 sentences). Mention if the global context affects this stock.
    - bullCase (string[]): 3 concise bullet points for optimistic scenarios.
    - bearCase (string[]): 3 concise bullet points for pessimistic scenarios.
    - dnaScore (number): A score from 0-100 based on the data provided (be critical).
    
    Response must be purely valid JSON. Language: Korean.`;

    const userPrompt = `Analyze this stock:
    Ticker: ${ticker}
    Price: ${price}
    Change: ${change}%
    Volume: ${volume}
    PE Ratio: ${peRatio || 'N/A'}
    Revenue Growth: ${revenueGrowth || 'N/A'}%
    Operating Margin: ${operatingMargin || 'N/A'}%
    Current Market Sentiment: ${sentimentLabel || 'Neutral'} (Score: ${sentimentScore || 0})
    Institutional Ownership: ${institutionalOwnership || 'N/A'}%
    Top Institutional Holder: ${topInstitution || 'N/A'}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message);
    }

    const content = data.choices[0].message.content;
    const analysis = JSON.parse(content);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
