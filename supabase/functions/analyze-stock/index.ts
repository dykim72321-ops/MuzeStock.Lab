import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // CORS 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const {
      ticker, price, change, volume,
      newsHeadlines, sector, relativeVolume
    } = payload;

    // 1. 필수 데이터 검증
    if (!ticker) {
      return new Response(JSON.stringify({ error: "Ticker is required" }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 가격이 0원일 경우(Sensing 실패 시) 임시값 할당 또는 경고 처리
    const validPrice = (price && price > 0) ? price : 0;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

    // 2. 캐시 확인 (6시간 이내 분석 데이터 재사용)
    const CACHE_HOURS = 6;
    const { data: cachedData } = await supabase
      .from('stock_analysis_cache')
      .select('analysis')
      .eq('ticker', ticker)
      .gt('created_at', new Date(Date.now() - CACHE_HOURS * 60 * 60 * 1000).toISOString())
      .limit(1)
      .maybeSingle();

    if (cachedData) {
      return new Response(JSON.stringify(cachedData.analysis), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
        status: 200,
      });
    }

    // 3. RAG: 벡터 검색 (현재 종목의 패턴과 유사한 과거 전설 찾기)
    let historicalContext = "No specific historical legend matched.";
    let matchedLegend = { ticker: "None", similarity: 0 };

    try {
      const queryText = `Stock: ${ticker}, Sector: ${sector}, Change: ${change}%, Volume: ${volume}`;
      const embedRes = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: queryText })
      });
      const embedData = await embedRes.json();

      if (embedData.data?.[0]?.embedding) {
        // RPC 호출 (uuid 타입 문제 해결됨)
        const { data: similarLegends } = await supabase.rpc('match_stock_patterns', {
          query_embedding: embedData.data[0].embedding,
          match_threshold: 0.5, // 매칭 문턱값
          match_count: 1
        });

        if (similarLegends && similarLegends.length > 0) {
          historicalContext = `Matched Legend: ${similarLegends[0].ticker} (${similarLegends[0].period})\nDescription: ${similarLegends[0].description}`;
          matchedLegend = {
            ticker: similarLegends[0].ticker,
            similarity: Math.round(similarLegends[0].similarity * 100)
          };
        }
      }
    } catch (e) {
      console.warn("RAG failed, proceeding without historical context:", e);
    }

    // 4. 프롬프트 구성 (뉴스 주입 방지 적용)
    const safeNews = (newsHeadlines || []).map((h: string) => `- ${h.replace(/[{}]/g, '')}`).join('\n');

    const systemPrompt = `You are an AI Analyst for penny stocks. 
    Analyze the following stock based on Momentum, Fundamentals, and News.
    
    [HISTORICAL PATTERN]
    ${historicalContext}
    
    [NEWS CONTEXT]
    ${safeNews || "No recent news."}
    
    Return valid JSON with keys: dnaScore (0-100), popProbability (0-100), bullCase (array), bearCase (array), riskLevel (string).`;

    const userPrompt = `Ticker: ${ticker}, Price: ${validPrice}, Change: ${change}%, Vol: ${volume}, RelVol: ${relativeVolume}`;

    // 5. OpenAI 분석 요청
    const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        response_format: { type: "json_object" }
      })
    });

    const gptData = await gptRes.json();
    const analysis = JSON.parse(gptData.choices[0].message.content);
    // 분석 결과에 매칭된 전설 정보 병합
    analysis.matchedLegend = matchedLegend;

    // 6. 결과 저장 (비동기 처리 안정화)
    const saveTask = (async () => {
      try {
        const results = await Promise.all([
          supabase.from('stock_analysis_cache').insert({ ticker, analysis }),
          supabase.from('ai_predictions').insert({
            ticker,
            dna_score: analysis.dnaScore,
            predicted_direction: analysis.dnaScore >= 60 ? 'BULLISH' : 'BEARISH',
            start_price: price,
            persona_used: 'AI_LAB_DEFAULT'
          })
        ]);
        results.forEach((res, i) => {
          if (res.error) console.error(`   ❌ DB Save Error [${i === 0 ? 'Cache' : 'Prediction'}]:`, res.error.message);
        });
      } catch (err: any) {
        console.error("   ❌ Async Save Task Failed:", err.message);
      }
    })();

    // Edge Runtime 환경에 따라 처리
    if (typeof EdgeRuntime !== 'undefined') {
      EdgeRuntime.waitUntil(saveTask);
    } else {
      await saveTask; // 로컬 테스트용
    }

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
      status: 200,
    });

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
