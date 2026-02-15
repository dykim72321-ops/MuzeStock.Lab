require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function verifyPerformance() {
    console.log('📊 [AI Profit Report] Verifying performance of past predictions...');

    // 1. Fetch predictions from the last 7 days that haven't been checked for accuracy
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: predictions, error: fetchError } = await supabase
        .from('ai_predictions')
        .select('*')
        .is('is_correct', null)
        .gte('analysis_date', sevenDaysAgo.toISOString());

    console.log(`   📡 Fetching results: ${predictions ? predictions.length : 0} rows found.`);
    if (fetchError) {
        console.error('❌ Failed to fetch predictions:', fetchError.message);
        return;
    }

    if (!predictions || predictions.length === 0) {
        console.log('✅ No pending predictions found to verify.');
        return;
    }

    console.log(`🔍 Found ${predictions.length} pending predictions. Fetching current prices...`);

    const results = [];

    for (const pred of predictions) {
        try {
            // Get current price via smart-quote
            const { data: quote, error: quoteError } = await supabase.functions.invoke('smart-quote', {
                body: { ticker: pred.ticker }
            });

            if (quoteError || !quote || quote.price === 0) {
                console.warn(`   ⚠️ Skipping ${pred.ticker}: Current price data unavailable.`);
                continue;
            }

            const currentPrice = quote.price;
            const startPrice = pred.start_price || 0;

            if (startPrice === 0) {
                console.warn(`   ⚠️ Skipping ${pred.ticker}: Start price was 0 or null.`);
                continue;
            }

            const roi = ((currentPrice - startPrice) / startPrice) * 100;
            const isCorrect = (pred.predicted_direction === 'BULLISH' && roi > 0) ||
                (pred.predicted_direction === 'BEARISH' && roi < 0);

            // Update prediction result
            const { error: updateError } = await supabase
                .from('ai_predictions')
                .update({
                    price_7d: currentPrice,
                    accuracy_score: isCorrect ? 1.0 : 0.0,
                    is_correct: isCorrect,
                    checked_at: new Date().toISOString()
                })
                .eq('id', pred.id);

            if (updateError) console.warn(`   ⚠️ DB Update failed for ${pred.ticker}:`, updateError.message);

            results.push({
                ticker: pred.ticker,
                dna: pred.dna_score,
                persona: pred.persona_used,
                start: startPrice,
                current: currentPrice,
                roi: roi.toFixed(2),
                status: isCorrect ? '✅ HIT' : '❌ MISS'
            });

        } catch (err) {
            console.error(`   ❌ Error verifying ${pred.ticker}:`, err.message);
        }
    }

    // Aggregation by Persona (New for Phase 6)
    const personaStats = {};
    results.forEach(res => {
        const p = res.persona || 'AI_LAB_DEFAULT';
        if (!personaStats[p]) personaStats[p] = { correct: 0, total: 0, totalRoi: 0 };
        personaStats[p].total++;
        if (res.status.includes('HIT')) personaStats[p].correct++;
        personaStats[p].totalRoi += parseFloat(res.roi);
    });

    console.log('\n🧠 [Persona Performance Update]');
    for (const [persona, stats] of Object.entries(personaStats)) {
        const hitRate = (stats.correct / stats.total) * 100;
        const avgRoi = stats.totalRoi / stats.total;

        console.log(`   🏆 ${persona.padEnd(20)} | Hit: ${hitRate.toFixed(1)}% | Avg ROI: ${avgRoi.toFixed(2)}%`);

        const { error: pError } = await supabase
            .from('persona_performance')
            .upsert({
                persona_name: persona,
                total_predictions: stats.total,
                correct_predictions: stats.correct,
                avg_roi: avgRoi,
                verified_at: new Date().toISOString()
            }, { onConflict: 'persona_name' });

        if (pError) console.warn(`   ⚠️ Persona sync failed for ${persona}:`, pError.message);
    }

    const hitRate = results.length > 0 ? (results.filter(r => r.status.includes('HIT')).length / results.length * 100).toFixed(1) : 0;
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Verified: ${results.length} | Global Hit Rate: ${hitRate}%`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

verifyPerformance();
