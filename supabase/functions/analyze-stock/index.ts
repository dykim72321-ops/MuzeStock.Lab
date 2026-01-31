import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// --- Enhancement: Diversity Pools ---
const BENCHMARK_POOL = [
  { name: "Apple (1997)", focus: "Bankruptcy threat to Market Dominance" },
  { name: "Amazon (2001)", focus: "Cash burn vs Infrastructure moat" },
  { name: "AMD (2015)", focus: "Turnaround strategy and Product pivot" },
  { name: "Tesla (2018)", focus: "Production hell to Scalability" },
  { name: "NVIDIA (2012)", focus: "Niche GPU to AI Infrastructure shift" },
  { name: "GameStop (2021)", focus: "Retail Momentum and Short Interest dynamics" }
];

const PERSONA_POOL = [
  { name: "공격적인 성장 헌터 (Explosive Hunter)", tone: "Very optimistic but data-driven, looks for 10x potential." },
  { name: "냉철한 리스크 관리자 (Skeptical Auditor)", tone: "Extremely critical, focuses heavily on cash burn and dilution risk." },
  { name: "차트 & 거래량 분석가 (Momentum Specialist)", tone: "Focuses on volume patterns and price action speed." },
  { name: "가치 사냥꾼 (Deep Value Deep Diver)", tone: "Focuses on fundamentals vs market cap discrepancy." }
];

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

    // --- Dynamic Selection ---
    const randomSeed = ticker.length + (price || 1); // Simple deterministic randomness per ticker
    const benchmark = BENCHMARK_POOL[Math.floor(randomSeed % BENCHMARK_POOL.length)];
    const persona = PERSONA_POOL[Math.floor((randomSeed * 2) % PERSONA_POOL.length)];

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
    Current Persona: ${persona.name} (${persona.tone})
    
    [GLOBAL MARKET CONTEXT]
    ${globalContext}
    
    [DYNAMIC BENCHMARK]
    Compare this stock against ${benchmark.name}. Focus on ${benchmark.focus}.
    
    [SECTOR AWARENESS]
    - If Bio/Pharma: Focus ONLY on clinical trials, FDA results, and pipeline.
    - If EV/Auto/Energy: Focus ONLY on production, orders, and scaling.
    - If Fintech: Focus on transaction volume, user growth, and regulatory environment.

    [RISK ASSESSMENT]
    - Penny stocks are HIGH RISK. If Cash Runway < 6 months, set survivalRate to "Critical" and dnaScore < 30.
    
    [INSTRUCTIONS]
    Analyze the provided stock data. 
    1. Avoid generic advice (e.g., "high risk, high reward"). 
    2. Be specific about the numbers provided (Cash Runway, Burn Rate).
    3. Generate a JSON response with the following fields:
    - matchReasoning (string): 1-2 sentence pattern recognition note. Mention ${benchmark.name} and how it relates to this stock's current situation.
    - bullCase (string[]): 3 concise bullet points unique to this ticker.
    - bearCase (string[]): 3 concise bullet points unique to this ticker.
    - dnaScore (number): 0-100 (Be critical).
    - riskLevel (string): "Low", "Medium", "High", "CRITICAL".
    - riskReason (string): Why this risk level? 
    - survivalRate (string): "Healthy", "Warning", "Critical" based on Cash Runway.
    
    Response must be purely valid JSON. Language: Korean.`;

    const userPrompt = `Analyze this stock ($1-$10 range):
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
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
      },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 
        ...corsHeaders, 
        'Content-Type': 'application/json',
      },
      status: 400,
    });
  }
});
