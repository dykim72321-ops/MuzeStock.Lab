require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
  process.exit(1);
}

const isServiceRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!isServiceRole) {
  console.warn('⚠️  Warning: SUPABASE_SERVICE_ROLE_KEY is missing. "Memorize" stage may fail due to RLS policies.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Default tickers if none provided
const DEFAULT_TICKERS = ['SNDL', 'MULN', 'IDEX', 'ZOM', 'FCEL', 'OCGN', 'BNGO', 'CTXR'];

async function masterAnalysis(ticker) {
  console.log(`\n🧠 [Master Algorithm] Start analyzing ${ticker}...`);

  try {
    // Stage 1: Sensing (Fetching rich market data)
    console.log(`   📡 Stage 1: Sensing... (Fetching market data for ${ticker})`);
    const { data: quote, error: quoteError } = await supabase.functions.invoke('smart-quote', {
      body: { ticker }
    });

    if (quoteError || !quote) {
      throw new Error(`Sensing failed: ${quoteError?.message || 'No data'}`);
    }
    console.log(`      ✅ Data received: $${quote.price} (${quote.changePercent}%) | RelVol: ${quote.relativeVolume}x`);

    // Stage 2 & 3: Recall (Pattern Match) & Synthesis (AI Fusion)
    // These are handled by the 'analyze-stock' Edge Function
    console.log(`   🔮 Stage 2 & 3: Recall & Synthesis... (AI Brain thinking)`);
    const { data: analysis, error: analysisError } = await supabase.functions.invoke('analyze-stock', {
      body: {
        ticker: ticker,
        price: quote.price,
        change: quote.changePercent,
        volume: quote.volume,
        relativeVolume: quote.relativeVolume,
        averageVolume10d: quote.averageVolume10d,
        newsHeadlines: quote.newsHeadlines || [],
        sector: quote.sector || 'Unknown',
        // Pass other metrics if available from quote
        targetPrice: quote.targetPrice,
        upsidePotential: quote.upsidePotential,
        analystCount: quote.analystCount,
        recommendation: quote.recommendation,
        cashRunway: quote.financials?.cashRunway,
        totalCash: quote.financials?.totalCash,
        netIncome: quote.financials?.netIncome,
        debtToEquity: quote.financials?.debtToEquity
      }
    });

    if (analysisError || !analysis) {
      throw new Error(`Synthesis failed: ${analysisError?.message || 'No response'}`);
    }

    const matchedTicker = analysis.matchedLegend?.ticker || 'None';
    const similarity = analysis.matchedLegend?.similarity || 0;
    console.log(`      ✅ Brain Result: DNA ${analysis.dnaScore} | Pop Prob: ${analysis.popProbability}%`);
    console.log(`      📍 Matched Legend: ${matchedTicker} (${similarity}% similarity)`);

    // Stage 4: Memorize (Saving results to DB)
    console.log(`   💾 Stage 4: Memorize... (Saving to daily_discovery)`);
    
    // UPSERT into daily_discovery
    const { error: saveError } = await supabase
      .from('daily_discovery')
      .upsert({
        ticker: ticker,
        price: quote.price,
        volume: quote.volume ? quote.volume.toString() : '0',
        change: quote.changePercent ? `${quote.changePercent.toFixed(2)}%` : '0%',
        sector: quote.sector || 'Unknown',
        updated_at: new Date().toISOString()
      });

    if (saveError) {
      console.warn(`      ⚠️ Failed to save to daily_discovery:`, saveError.message);
    } else {
      console.log(`      ✅ Analysis memorized.`);
    }

    // --- ALPHA FUND AUTOMATION ---
    if (analysis.dnaScore >= 85) {
      console.log(`🚀 [Alpha Fund] High Conviction Detected: ${ticker} (${analysis.dnaScore}pts). Adding to portfolio...`);
      const { error: alphaError } = await supabase
        .from('paper_portfolio')
        .upsert({
          ticker: ticker,
          status: 'OPEN',
          entry_price: quote.price,
          current_price: quote.price,
          pnl_percent: 0,
          updated_at: new Date().toISOString()
        }, { on_conflict: 'ticker' });

      if (alphaError) console.error(`      ⚠️ Alpha Fund Entry Error [${ticker}]:`, alphaError.message);
      else console.log(`      ✅ Alpha Fund Entry Success: ${ticker}`);
    }
    // ----------------------------

    return { ticker, analysis };


  } catch (err) {
    console.error(`   ❌ Error analyzed ${ticker}:`, err.message);
    return null;
  }
}

async function runBatch() {
  const args = process.argv.slice(2);
  const tickers = args.length > 0 ? args : DEFAULT_TICKERS;

  console.log(`🚀 MuzeStock Master Algorithm: Processing ${tickers.length} tickers...`);
  
  const results = [];
  for (const ticker of tickers) {
    const result = await masterAnalysis(ticker.toUpperCase());
    if (result) results.push(result);
  }

  console.log('\n✨ Batch Analysis Completed.');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  results.forEach(r => {
    console.log(`${r.ticker.padEnd(6)} | DNA: ${r.analysis.dnaScore.toString().padEnd(3)} | Pop: ${r.analysis.popProbability.toString().padEnd(3)}% | Match: ${r.analysis.matchedLegend?.ticker || 'N/A'}`);
  });
}

runBatch();
