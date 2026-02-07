// scripts/daily_scraper.js
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env.local for local development (GitHub Actions uses env vars directly)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';
import YahooFinance from 'yahoo-finance2';
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

// 1. Supabase Connection
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase Env Variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// 2. Constants
const ANALYZE_FUNCTION_URL = `${supabaseUrl}/functions/v1/analyze-stock`;
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

async function fetchStockDetails(ticker) {
  try {
    const quote = await yahooFinance.quote(ticker);
    return {
      price: quote.regularMarketPrice,
      change: quote.regularMarketChangePercent,
      volume: quote.regularMarketVolume,
      avgVolume: quote.averageDailyVolume10Day,
      peRatio: quote.trailingPE,
      marketCap: quote.marketCap,
      fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh
    };
  } catch (e) {
    console.warn(`⚠️ Failed to fetch Yahoo data for ${ticker}:`, e.message);
    return null;
  }
}

async function analyzeWithAI(stockData, yahooData) {
  console.log(`🧠 AI Analyzing ${stockData.ticker}...`);
  
  if (!yahooData) return null;

  try {
    const payload = {
      ticker: stockData.ticker,
      sector: stockData.sector,
      price: yahooData.price,
      change: yahooData.change,
      volume: yahooData.volume,
      relativeVolume: yahooData.avgVolume ? (yahooData.volume / yahooData.avgVolume).toFixed(2) : 1,
      averageVolume10d: yahooData.avgVolume,
      peRatio: yahooData.peRatio,
      // Defaulting others for now as they require deeper cleaning or different API points
      sentimentScore: 0, 
      sentimentLabel: 'Neutral',
    };

    const response = await fetch(ANALYZE_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}` // Using Service Role Key for permission
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI Function Error: ${response.status} - ${errText}`);
    }

    const aiResult = await response.json();
    return aiResult;
  } catch (e) {
    console.error(`❌ AI Analysis Failed for ${stockData.ticker}:`, e.message);
    return null;
  }
}

async function scrapeFinviz() {
  const day = new Date().getDay(); // 0: Sun, 1: Mon...
  
  // Rotation Strategy
  const DISCOVERY_MODES = [
    { name: '대포주 (유동성 폭발)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u2,sh_relvol_o1.5&o=-volume' }, // Sun (Ready for Mon)
    { name: '로켓 (급등주)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_1to5&o=-change' }, // Mon
    { name: '전통의 강자 (거래량 상위)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u1&o=-volume' }, // Tue
    { name: '바닥 탈출 (과매도 반등)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u5,ta_rsi_u30&o=-volume' }, // Wed
    { name: '신고가 헌터 (20일 신고가)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u5,ta_highlow20d_nh&o=-volume' }, // Thu
    { name: '세력 매집 (기관 관심주)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u5,sh_instown_o10&o=-volume' }, // Fri
    { name: '변동성 대장 (모 아니면 도)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u5&o=-volatility' } // Sat
  ];

  const mode = DISCOVERY_MODES[day];
  console.log(`🚀 Hunter Bot Launched: [${mode.name}]`);

  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true, 
      args: ['--no-sandbox', '--disable-setuid-sandbox'] 
    });
    
    const context = await browser.newContext({ userAgent: USER_AGENT });
    const page = await context.newPage();

    console.log(`🌐 Navigating to ${mode.url}`);
    
    try {
        await page.goto(mode.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    } catch(e) {
        console.warn("⚠️ Initial navigation timeout, retrying...");
        await page.reload({ waitUntil: 'domcontentloaded', timeout: 60000 });
    }

    // Checking for table/results
    try {
        await page.waitForSelector('table[width="100%"] tr[valign="top"]', { timeout: 15000 });
    } catch {
        console.log("⚠️ No results found or selector changed.");
        // Check for "No matches found" text if possible?
        // But simply returning empty is safe.
    }

    const scrapedStocks = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table[width="100%"] tr[valign="top"]'));
      return rows.slice(0, 10).map(row => { // Limit to Top 10 to save AI tokens
        const cells = row.querySelectorAll('td');
        if (cells.length < 10) return null;
        
        return {
          ticker: cells[1].innerText.trim(),
          sector: cells[3].innerText.trim(),
          // Saving raw text for debug, but we will rely on Yahoo for numbers
        };
      }).filter(item => item !== null);
    });

    console.log(`✅ Found ${scrapedStocks.length} candidates. Starting Deep Analysis...`);

    // Process each stock
    for (const stock of scrapedStocks) {
        console.log(`\n🔍 Processing ${stock.ticker}...`);
        
        // 1. Get Real-time/Better Data
        const yahooData = await fetchStockDetails(stock.ticker);
        
        // 2. Perform AI Analysis
        // If yahoo fails, we might skip AI or pass partial data. 
        // Let's skip AI if no price data is available to avoid hallucination.
        let aiAnalysis = null;
        if (yahooData) {
            aiAnalysis = await analyzeWithAI(stock, yahooData);
        }

        // 3. Save to Supabase (using actual schema columns only)
        const upsertData = {
            ticker: stock.ticker,
            sector: stock.sector,
            price: yahooData?.price || 0,
            volume: yahooData?.volume?.toString() || '0',
            change: yahooData?.change ? `${yahooData.change.toFixed(2)}%` : '0%',
            updated_at: new Date().toISOString()
        };

        const { error } = await supabase
            .from('daily_discovery')
            .upsert(upsertData, { onConflict: 'ticker' });

        if (error) console.error(`❌ DB Save Failed for ${stock.ticker}:`, error.message);
        else console.log(`💾 Saved ${stock.ticker} (DNA: ${upsertData.dna_score})`);
        
        // Random delay to be polite to APIs
        await new Promise(r => setTimeout(r, 1000)); 
    }

    console.log("\n🎉 Mission Complete.");

  } catch (err) {
    console.error('🚨 Global Error:', err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

scrapeFinviz();
