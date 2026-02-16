require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 💾 데이터베이스 업로드 모듈 (Triple-Sync)
 * @param {object} result 
 */
async function saveToSupabase(result) {
    try {
        const now = new Date().toISOString();

        // 1. daily_discovery (메인 리포팅 테이블)
        const { error: err1 } = await supabase
            .from('daily_discovery')
            .upsert({
                ticker: result.symbol,
                price: result.price,
                volume: result.volume ? result.volume.toString() : '0',
                change: result.change ? `${result.change.toFixed(2)}%` : '0%',
                sector: result.sector || 'Unknown',
                dna_score: result.totalScore,
                risk_level: result.riskLevel,
                ai_summary: result.summary,
                updated_at: now
            });

        // 2. stock_analysis_cache (Dashboard Detail 연동)
        const analysisData = {
            dnaScore: result.totalScore,
            popProbability: result.popProbability || 0,
            bullCase: result.bullCase || ["High Momentum Detected"],
            bearCase: result.bearCase || ["Market Volatility Risk"],
            riskLevel: result.riskLevel,
            recommendation: result.recommendation,
            aiSummary: result.summary,
            matchedLegend: result.matchedLegend || { ticker: 'None', similarity: 0 }
        };

        const { error: err2 } = await supabase
            .from('stock_analysis_cache')
            .upsert({
                ticker: result.symbol,
                analysis: analysisData,
                dna_score: result.totalScore,
                pop_probability: analysisData.popProbability,
                created_at: now // 캐시 테이블은 created_at 사용
            });

        // 3. ai_predictions (백테스팅 연동)
        const { error: err3 } = await supabase
            .from('ai_predictions')
            .upsert({
                ticker: result.symbol,
                dna_score: result.totalScore,
                predicted_direction: result.totalScore >= 60 ? 'BULLISH' : 'BEARISH',
                start_price: result.price,
                persona_used: 'AI_LAB_BATCH',
                analysis_date: now // ai_predictions는 analysis_date 사용
            });

        if (err1) console.warn(`      ⚠️ DB Error [daily_discovery]:`, err1.message);
        if (err2) console.warn(`      ⚠️ DB Error [analysis_cache]:`, err2.message);
        if (err3) console.warn(`      ⚠️ DB Error [ai_predictions]:`, err3.message);

    } catch (err) {
        console.error("   ❌ saveToSupabase Critical Error:", err.message);
        throw err;
    }
}

module.exports = { saveToSupabase };
