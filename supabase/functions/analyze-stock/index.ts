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
  { name: "부실 자산 분석가 (Distressed Asset Analyst)", tone: "Solely focuses on balance sheet and cash flow. Evaluates solvency, burn rate, and capital raise needs." },
  { name: "시장 조작 감시 AI (Sentiment & Hype Auditor)", tone: "Detects market manipulation, distinguishes organic growth from hype/fluff, and calculates Hype Score." },
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
      sector, cashRunway, netIncome, totalCash, debtToEquity, newsHeadlines,
      relativeVolume, averageVolume10d // 🆕 Added momentum indicators
    } = await req.json();

    // 🚨 Anomaly Detection (Sanity Check)
    if (!ticker) {
      throw new Error("Input validation failed: Ticker is required.");
    }
    
    // If price is missing or 0, we can't do a full analysis, but we can return a "Waiting for Data" state
    if (!price || price <= 0) {
      console.warn(`Data mismatch for ${ticker}: Price is ${price}. Returning placeholder.`);
      return new Response(JSON.stringify({
        matchReasoning: "현재 해당 종목의 실시간 시세가 비정상(0.00)입니다. 데이터 연동 완료 후 다시 분석해 주세요.",
        bullCase: ["실시간 데이터 대기 중"],
        bearCase: ["데이터 연동 이슈"],
        dnaScore: 0,
        riskLevel: "High",
        riskReason: "Data Unavailable",
        survivalRate: "Critical",
        solvencyAnalysis: {
          survival_months: 0,
          financial_health_grade: "F",
          capital_raise_needed: false,
          reason: "가격 데이터가 0으로 확인되어 분석이 불가능합니다."
        },
        sentimentAudit: {
          score: 0,
          hype_score: 0,
          category: "Negative",
          key_event: null,
          summary: "데이터 없음"
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
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

    // --- 🚀 NEW: Cache Lookup (Improvement 1) ---
    try {
      const CACHE_HOURS = 6;
      const { data: cachedData } = await supabase
        .from('stock_analysis_cache')
        .select('analysis, created_at')
        .eq('ticker', ticker)
        .gt('created_at', new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cachedData) {
        console.log(`⚡ [Cache Hit] Using cached analysis for ${ticker} from ${cachedData.created_at}`);
        return new Response(JSON.stringify(cachedData.analysis), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
          status: 200,
        });
      }
    } catch (err) {
      console.warn("Cache lookup failed, proceeding to AI:", err);
    }

    // --- RAG: Vector Search for Historical Pattern Legends ---
    let historicalContext = "No specific historical legend matched.";
    let matchedLegend = { ticker: "None", similarity: 0 };
    
    try {
      // 🚨 Lazy Seeding: Check if legends need embeddings
      const { data: legendsToEmbed } = await supabase
        .from('stock_legends')
        .select('id, description')
        .is('embedding', null);

      if (legendsToEmbed && legendsToEmbed.length > 0) {
        console.log(`🚀 Seeding ${legendsToEmbed.length} legends with embeddings...`);
        for (const legend of legendsToEmbed) {
          try {
            const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                model: 'text-embedding-3-small',
                input: legend.description
              })
            });
            const embedData = await embedRes.json();
            if (embedData.data?.[0]?.embedding) {
              await supabase
                .from('stock_legends')
                .update({ embedding: embedData.data[0].embedding })
                .eq('id', legend.id);
            }
          } catch (e) {
            console.error(`Failed to embed legend ${legend.id}:`, e);
          }
        }
      }

      // 1. Generate Embedding for current context
      const queryText = `Stock: ${ticker}, Sector: ${sector}, Price Action: ${change}%, Volume: ${volume}, RelVol: ${relativeVolume}x, Sentiment: ${sentimentLabel}`;
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
        
        // 2. Search Supabase (using match_stock_patterns)
        const { data: similarLegends, error: rpcError } = await supabase.rpc('match_stock_patterns', {
          query_embedding: embedding,
          match_threshold: 0.6, // Slightly lower for broader matching
          match_count: 2
        });

        if (!rpcError && similarLegends && similarLegends.length > 0) {
          historicalContext = similarLegends.map((p: any) => 
            `- Legend: ${p.ticker} (${p.period}) (Similarity: ${(p.similarity * 100).toFixed(1)}%)\n  Context: ${p.description}`
          ).join('\n');
          matchedLegend = { 
            ticker: similarLegends[0].ticker, 
            similarity: Math.round(similarLegends[0].similarity * 100) 
          };
          console.log(`🔍 Found ${similarLegends.length} similar momentum legends for ${ticker}`);
        }
      }
    } catch (err) {
      console.warn("Vector search failed (RAG skipped):", err);
    }

    
    // 뉴스 섹션: 최우선 분석 대상으로 프롬프트 상단 배치
    const newsSection = newsHeadlines && newsHeadlines.length > 0 
      ? `📰 BREAKING NEWS (분석 최우선 순위):
${newsHeadlines.map((h: string, i: number) => `${i+1}. ${h}`).join('\n')}

⚠️ 중요 지시사항: 위 뉴스를 가장 먼저 분석하세요. 뉴스에서 주요 이벤트(실적 발표, FDA 승인, 인수합병 등)가 언급되면, DNA 점수가 낮더라도 이를 최우선적으로 고려하여 판단하세요.`
      : `⚠️ 최근 뉴스 데이터 없음
경고: 지난 7일간 뉴스 감정 데이터가 없어 분석이 과거 지표에 의존할 수 있습니다. 기술적 지표와 과거 패턴에 더 많이 의존하세요.`;


    const systemPrompt = `You are the Master Brain of MuzeStock.Lab, a sophisticated AI trading terminal specializing in high-momentum stocks ($1-$10 range).
    
    Current Persona: ${persona.name} (${persona.tone})
    
    ${newsSection}
    
    ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    [MASTER FUSION ALGORITHM: 4-SOURCE ANALYSIS]
    
    1. 🛑 BRAKE (Financials): Check for dilution, bankruptcy, or toxic debt. (Cash Runway: ${cashRunway}mo)
    2. 🚀 ACCELERATOR (Momentum): Analyze Relative Volume (${relativeVolume}x), Price Action, and Volatility.
    3. 🧭 NAVIGATION (Catalyst/News): Deep dive into recent headlines. Identify specific catalysts (FDA, Contracts, Earnings). This is the "Fuel" for the momentum.
    4. 🗺️ MAP (Pattern Match): Compare current chart/context to historical momentum legends.
    
    [HISTORICAL LEGEND MATCH]
    ${historicalContext}
    
    [ANALYSIS PRINCIPLE: 5W1H & MOMENTUM SURVIVAL]
    Your report MUST follow the 5W1H principle. For momentum stocks, focus on "Can this survive long enough to pop?" vs "Is the volume expansion sustainable?".

    Format JSON Fields exactly as follows (Language: Korean):
    - matchReasoning: 5W1H bullet points (e.g., "[누가] ...\n[언제] ...").
    - matchedLegend: { "ticker": string, "similarity": number } // From Pattern Match data
    - popProbability: number // 0-100, Predicted chance of a massive pop in next 1-5 days.
    - financialHealthAudit: detailed analysis of Balance Sheet/Cash.
    - marketTrendAnalysis: analysis of Market Sentiment/Vol.
    - bullCase (string[]): 3 concise facts.
    - bearCase (string[]): 3 concise facts.
    - dnaScore (number): 0-100.
    - riskLevel (string): "Low", "Medium", "High", "CRITICAL".
    - riskReason (string): Specific reason.
    - survivalRate (string): "Healthy", "Warning", "Critical".
    - solvencyAnalysis: { "survival_months": number, "financial_health_grade": "A"|"F", "reason": "string" }
    - sentimentAudit: { "score": number, "hype_score": number, "category": "Organic"|"Hype", "summary": "string" }
    
    [GLOBAL MARKET CONTEXT]
    ${globalContext}
    
    [DYNAMIC BENCHMARK]
    Compare against ${benchmark.name}. Focus on ${benchmark.focus}.`;


    const userPrompt = `Analyze this stock ($1-$10 range):
    Ticker: ${ticker} | Sector: ${sector}
    Price: ${price} | Change: ${change}% | Volume: ${volume} | RelVol: ${relativeVolume}x (Avg: ${averageVolume10d})
    Fundamentals: PE: ${peRatio || 'N/A'} | Rev Growth: ${revenueGrowth || 'N/A'}% | Margin: ${operatingMargin || 'N/A'}%
    Sentiment: ${sentimentLabel || 'Neutral'} (Score: ${sentimentScore || 0})
    Ownership: Institutional: ${institutionalOwnership || '0'}% | Top: ${topInstitution || 'N/A'}
    Financial Health: 
    - Cash Runway: ${cashRunway || 'Unknown'} months
    - Net Income (Latest): ${netIncome || 'N/A'}
    - Total Cash: ${totalCash || 'N/A'}
    - Debt to Equity: ${debtToEquity || 'N/A'}
    
    [NEWS HEADLINES]
    ${(newsHeadlines || []).map((h: string) => `- ${h}`).join('\n') || 'No recent news news.'}`;

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
    const logPrediction = async () => {
      // 1. Log to ai_predictions for backtesting
      await supabase.from('ai_predictions').insert({
        ticker: ticker,
        persona_used: persona.name,
        dna_score: analysis.dnaScore,
        predicted_direction: analysis.dnaScore >= 50 ? 'BULLISH' : 'BEARISH',
        start_price: price
      });

      // 2. Save to analysis cache (Improvement 1)
      await supabase.from('stock_analysis_cache').insert({
        ticker: ticker,
        analysis: analysis
      });
      
      console.log(`💾 [Memorize] Analysis cached for ${ticker}`);
    };
    
    // Run logging but don't wait for it to return response faster
    logPrediction().catch(err => console.error("Logging error:", err));

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
      status: 200,
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
