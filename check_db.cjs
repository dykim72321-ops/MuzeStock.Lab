require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function check() {
    console.log("Checking Supabase connection and tables...");
    
    // Exact query from Dashboard.tsx
    const { data, error } = await supabase
        .from('daily_discovery')
        .select(`
          *,
          ai_predictions (*),
          stock_analysis_cache (analysis)
        `)
        .order('updated_at', { ascending: false })
        .limit(6);
    
    if (error) {
        console.log("Dashboard-style Query ERROR:", error.message, error.details, error.hint);
    } else {
        console.log(`Dashboard-style Query SUCCESS: ${data.length} rows returned.`);
        if (data.length > 0) {
            console.log("First row mapped:", {
                ticker: data[0].ticker,
                predictionCount: data[0].ai_predictions?.length,
                cacheType: typeof data[0].stock_analysis_cache,
                cacheVal: data[0].stock_analysis_cache
            });
        }
    }

    console.log("\nChecking and verifying schema for paper_portfolio...");
    // Let's see all tables in the schema if possible (or just try to list them)
    // Actually, let's just try a direct select on paper_portfolio again but without head:true
    const { data: pp, error: ppError } = await supabase.from('paper_portfolio').select('*').limit(1);
    if (ppError) console.log("paper_portfolio select error:", ppError.message);
    else console.log("paper_portfolio sample:", pp);
}

check();
