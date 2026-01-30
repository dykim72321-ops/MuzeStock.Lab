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
    const { 
      ticker, price, change, volume, peRatio, revenueGrowth, operatingMargin, 
      sentimentScore, sentimentLabel, institutionalOwnership, topInstitution,
      sector, cashRunway, netIncome, totalCash
    } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    // Determine Dynamic Benchmark based on Sector
    let benchmark = "NVIDIA (1999)";
    let benchmarkFocus = "R&D and Exponential Computing Growth";
    if (sector?.toLowerCase().includes('bio') || sector?.toLowerCase().includes('health')) {
      benchmark = "Moderna (Early Stage)";
      benchmarkFocus = "Clinical Pipeline and FDA Approval Milestones";
    } else if (sector?.toLowerCase().includes('auto') || sector?.toLowerCase().includes('energy')) {
      benchmark = "Tesla (Initial Scaling)";
      benchmarkFocus = "Production Capacity and Order Backlog";
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

    const systemPrompt = `You are a professional stock analyst for MuzeStock.Lab specializing in Penny Stocks ($1-$5).
    
    [GLOBAL MARKET CONTEXT]
    ${globalContext}
    
    [DYNAMIC BENCHMARK]
    Compare this stock against ${benchmark}. Focus on ${benchmarkFocus}.
    
    [SCAM FILTER / PUMP & DUMP DETECTOR]
    Identify risks like Share Dilution, Offering, and Insider Selling. If detected, penalize the DNA Score heavily.
    
    [INSTRUCTIONS]
    Analyze the provided stock data. Generate a JSON response with the following fields:
    - matchReasoning (string): 1-2 sentence pattern recognition note. Mention the benchmark (${benchmark}).
    - bullCase (string[]): 3 concise bullet points.
    - bearCase (string[]): 3 concise bullet points.
    - dnaScore (number): 0-100 (be EXTREMELY critical of penny stocks).
    - riskLevel (string): "Low", "Medium", "High", "CRITICAL".
    - riskReason (string): Why this risk level? (e.g., "High Dilution Risk").
    - survivalRate (string): "Healthy", "Warning", "Critical" based on Cash Runway.
    
    Response must be purely valid JSON. Language: Korean.`;

    const userPrompt = `Analyze this stock:
    Ticker: ${ticker} | Sector: ${sector}
    Price: ${price} | Change: ${change}% | Volume: ${volume}
    Fundamentals: PE: ${peRatio || 'N/A'} | Rev Growth: ${revenueGrowth || 'N/A'}% | Margin: ${operatingMargin || 'N/A'}%
    Sentiment: ${sentimentLabel || 'Neutral'} (Score: ${sentimentScore || 0})
    Ownership: Institutional: ${institutionalOwnership || '0'}% | Top: ${topInstitution || 'N/A'}
    Financial Health: 
    - Cash Runway: ${cashRunway || 'Unknown'} months
    - Net Income (Latest): ${netIncome || 'N/A'}
    - Total Cash: ${totalCash || 'N/A'}`;

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
