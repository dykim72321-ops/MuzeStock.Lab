const fs = require('fs');
if (fs.existsSync('.env.local')) {
    require('dotenv').config({ path: '.env.local' });
}
const { createClient } = require('@supabase/supabase-js');
const { fetchMarketMovers } = require('./fetchMarketMovers.cjs');

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

// 2. 메인 실행 로직
async function masterAnalysis(ticker) {
    console.log(`\n🧠 [Master Algorithm] ${ticker} 분석 시작...`);

    let attempts = 0;
    const maxAttempts = 2; // 최대 재시도 횟수

    while (attempts <= maxAttempts) {
        try {
            // Step 1: Sensing (데이터 수집)
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
                    relativeVolume: quote.relativeVolume || 1.5,
                    newsHeadlines: quote.newsHeadlines || [],
                    sector: quote.sector || 'Unknown'
                }
            });

            if (analysisError) throw new Error(`Synthesis failed: ${analysisError.message}`);

            console.log(`      ✅ Result: DNA ${analysis.dnaScore} | PopProb: ${analysis.popProbability}% | Match: ${analysis.matchedLegend?.ticker || 'None'}`);

            // Step 4: Filtering & Memorize (저장)
            // DNA Score 60점 이상만 저장 (Smart Filtering)
            if (analysis.dnaScore >= 60) {
                const { error: saveError } = await supabase
                    .from('daily_discovery')
                    .upsert({
                        ticker: ticker,
                        price: quote.price,
                        change: `${quote.changePercent}%`,
                        volume: quote.volume ? quote.volume.toString() : '0',
                        dna_score: analysis.dnaScore,
                        pop_probability: analysis.popProbability,
                        risk_level: analysis.riskLevel,
                        ai_summary: analysis.aiSummary || (analysis.bullCase ? analysis.bullCase.join('; ') : ''),
                        matched_legend_ticker: analysis.matchedLegend?.ticker || 'None',
                        legend_similarity: analysis.matchedLegend?.similarity || 0,
                        bull_case: analysis.bullCase || [],
                        bear_case: analysis.bearCase || [],
                        updated_at: new Date().toISOString()
                    });

                if (saveError) console.warn('      ⚠️ DB Save Warning:', saveError.message);
                else console.log('      💾 Analysis Saved (High Potential).');
            } else {
                console.log('      💨 Skipped Save (Low DNA Score).');
            }

            return { ticker, ...analysis };

        } catch (err) {
            attempts++;
            console.error(`   ❌ Error on ${ticker}:`, err.message);

            if (attempts > maxAttempts) {
                console.error(`   💀 Failed to analyze ${ticker} after retries.`);
                return null;
            }
            await sleep(2000 * attempts);
        }
    }
}

async function runBatch() {
    const args = process.argv.slice(2);
    // 인자가 있으면 그 종목만, 없으면 핫한 종목 스캔
    let tickers = args.length > 0 ? args : await fetchMarketMovers();

    console.log(`🚀 MuzeStock Master Algorithm: Starting Wide Area Scan for ${tickers.length} tickers...`);

    const results = [];
    for (const ticker of tickers) {
        const result = await masterAnalysis(ticker.toUpperCase());
        if (result && result.dnaScore >= 60) results.push(result);

        // API Rate Limit Protection
        await sleep(2000);
    }

    console.log('\n✨ Wide Area Scan Result Summary (DNA >= 60):');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    if (results.length === 0) {
        console.log('   No high-potential stocks found in this batch.');
    } else {
        results.forEach(r => {
            console.log(`${r.ticker.padEnd(6)} | DNA: ${r.dnaScore.toString().padEnd(3)} | Pop: ${r.popProbability.toString().padEnd(3)}% | Match: ${r.matchedLegend?.ticker || 'N/A'}`);
        });
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

runBatch();
