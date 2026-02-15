require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// 1. 설정 확인
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// 유틸리티: 대기 함수
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function masterAnalysis(ticker) {
    console.log(`\n🧠 [Master Algorithm] ${ticker} 분석 시작...`);

    let attempts = 0;
    const maxAttempts = 2; // 최대 재시도 횟수

    while (attempts <= maxAttempts) {
        try {
            // Step 1: Sensing (데이터 수집)
            // *주의: smart-quote 함수가 배포되어 있어야 합니다. 없다면 목업 데이터를 사용하세요.
            console.log(`   📡 Sensing... (Attempt ${attempts + 1})`);
            const { data: quote, error: quoteError } = await supabase.functions.invoke('smart-quote', {
                body: { ticker }
            });

            if (quoteError) throw new Error(`Sensing failed: ${quoteError.message}`);
            if (!quote) throw new Error('No quote data received');

            console.log(`      ✅ Price: $${quote.price} (${quote.changePercent}%)`);

            // Step 2 & 3: AI Synthesis (분석 요청)
            console.log(`   🔮 Synthesis... (AI Brain)`);
            const { data: analysis, error: analysisError } = await supabase.functions.invoke('analyze-stock', {
                body: {
                    ticker: ticker,
                    price: quote.price,
                    change: quote.changePercent,
                    volume: quote.volume,
                    relativeVolume: quote.relativeVolume || 1.5, // 기본값
                    newsHeadlines: quote.newsHeadlines || [],
                    sector: quote.sector || 'Unknown'
                }
            });

            if (analysisError) throw new Error(`Synthesis failed: ${analysisError.message}`);

            console.log(`      ✅ Result: DNA ${analysis.dnaScore} | Match: ${analysis.matchedLegend?.ticker}`);

            // Step 4: Memorize (저장)
            const { error: saveError } = await supabase
                .from('daily_discovery')
                .upsert({
                    ticker: ticker,
                    price: quote.price,
                    change: `${quote.changePercent}%`,
                    volume: quote.volume ? quote.volume.toString() : '0',
                    updated_at: new Date().toISOString()
                });

            if (saveError) console.warn('      ⚠️ DB Save Warning:', saveError.message);
            else console.log('      💾 Analysis Saved.');

            return analysis; // 성공 시 반환

        } catch (err) {
            attempts++;
            console.error(`   ❌ Error on ${ticker}:`, err.message);

            if (attempts > maxAttempts) {
                console.error(`   💀 Failed to analyze ${ticker} after retries.`);
                return null;
            }
            await sleep(2000 * attempts); // 2초, 4초 대기 후 재시도
        }
    }
}

// 실행
const ticker = process.argv[2] || 'MULN';
masterAnalysis(ticker);
