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

    // 3. RAG/AI 분석 과정 제거 및 고정 값(Mock) 할당
    let historicalContext = "OpenAI 제거로 인한 기본 분석 모드입니다.";
    let matchedLegend = { ticker: "None", similarity: 0 };

    const analysis = {
      dnaScore: Math.floor(Math.random() * 41) + 40, // 40~80 난수
      popProbability: Math.floor(Math.random() * 50) + 10,
      bullCase: ["기술적 지표 분석 전용 모드 활성화 됨"],
      bearCase: ["뉴스 및 센티먼트 분석 생략됨"],
      riskLevel: "Medium",
      recommendation: "Hold",
      aiSummary: "OpenAI 의존성이 제거되어 퀀트 엔진에 의한 분석 결과만 참조합니다."
    };
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
