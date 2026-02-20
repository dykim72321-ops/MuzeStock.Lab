require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log("Checking Supabase connection and tables...");
    
    // 1. Unified Query (May fail if relationships missing)
    const { data: unifiedData, error: unifiedError } = await supabase
        .from('daily_discovery')
        .select(`
          *,
          ai_predictions (*),
          stock_analysis_cache (analysis)
        `)
        .order('updated_at', { ascending: false })
        .limit(3);
    
    if (unifiedError) {
        console.log("❌ Dashboard Unified Query ERROR:", unifiedError.message);
    } else {
        console.log(`✅ Dashboard Unified Query SUCCESS: ${unifiedData.length} rows.`);
    }

    // 2. Simple daily_discovery check
    const { data: dd, error: ddError } = await supabase
        .from('daily_discovery')
        .select('*')
        .limit(3);
    
    if (ddError) {
        console.log("❌ daily_discovery fetch ERROR:", ddError.message);
    } else {
        console.log(`✅ daily_discovery count: ${dd.length} rows.`);
        if (dd.length > 0) {
            console.log("   Sample Ticker:", dd[0].ticker, "| Price:", dd[0].price, "| DNA Score:", dd[0].dna_score);
        }
    }

    // 3. Simple stock_analysis_cache check
    const { data: sac, error: sacError } = await supabase
        .from('stock_analysis_cache')
        .select('*')
        .limit(3);
    
    if (sacError) {
        console.log("❌ stock_analysis_cache fetch ERROR:", sacError.message);
    } else {
        console.log(`✅ stock_analysis_cache count: ${sac.length} rows.`);
        if (sac.length > 0) {
            console.log("   Sample Ticker:", sac[0].ticker, "| Analysis Type:", typeof sac[0].analysis);
        }
    }

    // 4. paper_portfolio check
    const { data: pp, error: ppError } = await supabase.from('paper_portfolio').select('*').limit(1);
    if (ppError) console.log("❌ paper_portfolio select ERROR:", ppError.message);
    else console.log("✅ paper_portfolio sample:", pp);
}

check();
