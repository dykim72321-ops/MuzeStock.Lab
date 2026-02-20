require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * 🤖 AI 분석 모듈 (Sensing -> Recall -> Synthesis)
 * @param {string} ticker 
 */
async function analyzeStock(ticker) {
    try {
        // 1. Sensing (데이터 수집)
        const { data: quote, error: quoteError } = await supabase.functions.invoke('smart-quote', {
            body: { ticker }
        });

        if (quoteError || !quote) throw new Error(`Sensing failed: ${quoteError?.message || 'No data'}`);

        // 2 & 3. Recall & Synthesis (AI 분석 및 패턴 매칭)
        const { data: analysis, error: analysisError } = await supabase.functions.invoke('analyze-stock', {
            body: {
                ticker: ticker,
                price: quote.price,
                change: quote.changePercent,
                volume: quote.volume,
                relativeVolume: quote.relativeVolume,
                averageVolume10d: quote.averageVolume10d,
                newsHeadlines: quote.newsHeadlines || [],
                sector: quote.sector || 'Unknown'
            }
        });

        if (analysisError || !analysis) throw new Error(`Synthesis failed: ${analysisError?.message || 'No response'}`);

        // masterAnalysis.cjs에서 기대하는 필드명으로 매핑 (dnaScore -> totalScore)
        return {
            symbol: ticker,
            totalScore: analysis.dnaScore || 0,
            riskLevel: analysis.riskLevel || 'Medium',
            recommendation: analysis.recommendation || 'Hold',
            summary: analysis.aiSummary || '',
            price: quote.price,
            change: quote.changePercent,
            volume: quote.volume,
            sector: quote.sector
        };
    } catch (err) {
        throw err;
    }
}

module.exports = { analyzeStock };
