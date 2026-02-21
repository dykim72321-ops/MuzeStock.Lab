require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();


const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncPortfolio() {
    console.log("🔄 Starting Portfolio Price Sync...");
    
    // 1. Fetch OPEN positions
    const { data: positions, error: fetchError } = await supabase
        .from('paper_portfolio')
        .select('*')
        .eq('status', 'OPEN');

    if (fetchError) {
        console.error("❌ Error fetching positions:", fetchError.message);
        return;
    }

    if (!positions || positions.length === 0) {
        console.log("ℹ️ No open positions found to sync.");
        return;
    }

    console.log(`📊 Found ${positions.length} open positions. Fetching latest prices...`);

    for (const pos of positions) {
        try {
            // 2. Fetch current price from Yahoo Finance
            const quote = await yahooFinance.quote(pos.ticker);
            const currentPrice = quote.regularMarketPrice;

            if (!currentPrice) {
                console.warn(`⚠️ Could not fetch price for ${pos.ticker}`);
                continue;
            }

            // 3. Calculate PnL
            // entry_price 대비 current_price 수익률
            const pnlPercent = ((currentPrice - pos.entry_price) / pos.entry_price) * 100;

            // 4. Update DB
            const { error: updateError } = await supabase
                .from('paper_portfolio')
                .update({
                    current_price: currentPrice,
                    pnl_percent: parseFloat(pnlPercent.toFixed(2)),
                    updated_at: new Date().toISOString()
                })
                .eq('id', pos.id);

            if (updateError) {
                console.error(`❌ Failed to update ${pos.ticker}:`, updateError.message);
            } else {
                console.log(`✅ Updated ${pos.ticker}: ${pos.entry_price} -> ${currentPrice} (${pnlPercent.toFixed(2)}%)`);
            }

        } catch (err) {
            console.error(`❌ Error syncing ${pos.ticker}:`, err.message);
        }
    }

    console.log("🏁 Portfolio Price Sync Completed.");
}

// Execute if run directly
if (require.main === module) {
    syncPortfolio();
}

module.exports = { syncPortfolio };
