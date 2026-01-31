import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600', // Cache AI analysis for 1 hour
};

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

    // 🚨 Anomaly Detection (Sanity Check)
    if (!ticker || typeof price !== 'number' || price <= 0) {
      console.error(`Anomaly detected for input: ${ticker}, Price: ${price}`);
      throw new Error("Input validation failed: Invalid Ticker or Price anomaly detected.");
    }
    
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!OPENAI_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing environment variables');
    }

    const randomSeed = ticker.length + (price || 1);
    const benchmark = BENCHMARK_POOL[Math.floor(randomSeed % BENCHMARK_POOL.length)];
    const persona = PERSONA_POOL[Math.floor((randomSeed * 2) % PERSONA_POOL.length)];

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

    // --- RAG: Vector Search for Historical Patterns ---
    let historicalContext = "No specific historical pattern matched.";
    try {
      // 1. Generate Embedding for current context
      const queryText = `Stock: ${ticker}, Sector: ${sector}, Price Action: ${change}%, Volume: ${volume}, Sentiment: ${sentimentLabel}`;
      const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: queryText
        })
      });
      const embedData = await embedRes.json();
      
      if (embedData.data && embedData.data[0]) {
        const embedding = embedData.data[0].embedding;
        
        // 2. Search Supabase
        const { data: similarPatterns, error: rpcError } = await supabase.rpc('match_market_patterns', {
          query_embedding: embedding,
          match_threshold: 0.7, // 70% similarity
          match_count: 2
        });

        if (!rpcError && similarPatterns && similarPatterns.length > 0) {
          historicalContext = similarPatterns.map((p: any) => 
            `- Event: ${p.event_name} (Similarity: ${(p.similarity * 100).toFixed(1)}%)\n  Context: ${p.description}`
          ).join('\n');
          console.log(`🔍 Found ${similarPatterns.length} similar historical patterns for ${ticker}`);
        }
      }
    } catch (err) {
      console.warn("Vector search failed (RAG skipped):", err);
    }

    const systemPrompt = `You are a professional stock analyst for MuzeStock.Lab.
    Current Persona: ${persona.name} (${persona.tone})
    
    [ANALYSIS PRINCIPLE: 5W1H & LOGICAL EVIDENCE]
    Your report MUST follow the 5W1H principle and provide deep insights into Financial Health (Revenue) and Market Trends.

    [HISTORICAL PATTERN MATCHING (RAG)]
    The following historical events match the current chart pattern of ${ticker}:
    ${historicalContext}
    *IF* relevant, compare the current situation to these historical events in your analysis.
    
    Format JSON Fields exactly as follows (Language: Korean):
    - matchReasoning: Single formatted string with 5W1H bullet points (e.g., "[누가] ...\n[언제] ...\n[어디서] ..."). NOT a JSON object.
    - financialHealthAudit: Single string with detailed Revenue, Net Income, and Cash analysis.
    - marketTrendAnalysis: Single string analyzing Market Context and Sentiment.
    - bullCase (string[]): 3 concise facts.
    - bearCase (string[]): 3 concise facts.
    - dnaScore (number): 0-100.
    - riskLevel (string): "Low", "Medium", "High", "CRITICAL".
    - riskReason (string): Specific reason.
    - survivalRate (string): "Healthy", "Warning", "Critical".
    
    [GLOBAL MARKET CONTEXT]
    ${globalContext}
    
    [DYNAMIC BENCHMARK]
    Compare against ${benchmark.name}. Focus on ${benchmark.focus}.
    
    [INSTRUCTIONS]
    1. Result MUST be purely valid JSON.
    2. Use technical but readable Korean.
    3. CITE specific numbers from the provided user context as evidence.`;

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
    if (data.error) throw new Error(data.error.message);

    const content = data.choices[0].message.content;
    const analysis = JSON.parse(content);

    // --- 4. Return Result & Save to Backtesting Log ---
    
    // Save prediction asynchronously (don't block response)
    const { error: logError } = await supabase.from('ai_predictions').insert({
      ticker: ticker,
      persona_used: persona.name,
      dna_score: analysis.dnaScore,
      predicted_direction: analysis.dnaScore >= 50 ? 'BULLISH' : 'BEARISH',
      start_price: price
    });
    
    if (logError) console.warn("Failed to log prediction for backtesting:", logError);

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
