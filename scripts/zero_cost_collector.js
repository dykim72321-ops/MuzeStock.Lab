import dotenv from 'dotenv';
import yahooFinance from 'yahoo-finance2';
import Parser from 'rss-parser';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// Load environment variables
dotenv.config({ path: '.env.local' });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.error('Expected VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const parser = new Parser();

// Target Tickers
const TICKERS = ['SNDL', 'MULN', 'IDEX', 'ZOM', 'FCEL'];

async function fetchFinancials(ticker) {
  try {
    console.log(`📊 Fetching financials for ${ticker}...`);
    
    const yf = new yahooFinance({ suppressNotices: ['yahooSurvey'] });
    const quote = await yf.quoteSummary(ticker, { 
      modules: ['financialData', 'defaultKeyStatistics', 'balanceSheetHistory'] 
    });
    
    if (!quote) return null;

    const financials = {
      ticker: ticker,
      price: quote.financialData?.currentPrice,
      total_cash: quote.financialData?.totalCash,
      total_debt: quote.financialData?.totalDebt,
      total_revenue: quote.financialData?.totalRevenue,
      revenue_growth: quote.financialData?.revenueGrowth,
      current_ratio: quote.financialData?.currentRatio,
      net_income: quote.defaultKeyStatistics?.netIncomeToCommon,
      last_updated: new Date().toISOString()
    };
    
    console.log(`✅ Financials for ${ticker}: Cash $${((financials.total_cash || 0)/1e6).toFixed(1)}M`);
    return financials;
  } catch (error) {
    console.error(`❌ Failed to fetch financials for ${ticker}:`, error.message);
    return null;
  }
}

async function fetchNews(ticker) {
  try {
    console.log(`📰 Fetching news for ${ticker}...`);
    const feedUrl = `https://news.google.com/rss/search?q=${ticker}+stock&hl=en-US&gl=US&ceid=US:en`;
    const feed = await parser.parseURL(feedUrl);
    
    const newsItems = feed.items.slice(0, 3).map(item => ({
      ticker: ticker,
      title: item.title,
      link: item.link,
      pub_date: item.pubDate,
      source: item.source || 'Google News'
    }));

    if (newsItems.length > 0) {
      const { error } = await supabase.from('news_feed').upsert(newsItems, { onConflict: 'link' });
      if (error && error.code === '42P01') {
           console.warn(`⚠️ Table 'news_feed' does not exist. Skiping save.`);
      } else if (error) {
          console.error('Supabase News Error:', error.message);
      } else {
          console.log(`✅ Saved ${newsItems.length} news items for ${ticker}`);
      }
    }
    return newsItems;
  } catch (error) {
    console.error(`❌ Failed to fetch news for ${ticker}:`, error.message);
    return [];
  }
}

async function analyzeRisk(ticker, financials, newsItems) {
  if (!OPENAI_API_KEY) {
    console.warn('⚠️ Skipping AI Risk Audit: OPENAI_API_KEY not found in .env.local');
    return null;
  }

  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  console.log(`🧠 Generating AI Risk Audit for ${ticker}...`);

  const prompt = `You are an elite Financial Risk Auditor specialized in analyzing high-risk penny stocks. 
Your goal is to protect investors from bankruptcy risks, dilution events, and "Pump and Dump" schemes.
You will be provided with the company's latest financial data and recent news headlines. Analyze the following stock.

[Target Stock Info]
Ticker: ${ticker}
Price: $${financials.price || 'N/A'}

[Financial Data (from Yahoo Finance)]
- Total Cash: $${financials.total_cash || 'N/A'}
- Net Income (Quarterly): $${financials.net_income || 'N/A'}
- Total Revenue: $${financials.total_revenue || 'N/A'}
- Current Ratio: ${financials.current_ratio || 'N/A'}

[Recent News Headlines (from Google News)]
${newsItems.map(n => `- ${n.title} (${n.source})`).join('\n')}

[Task]
1. Cash Runway Analysis: 
   - If Net Income is negative, calculate the estimated months of cash remaining (Total Cash / |Net Income| * 3).
   - If cash runway is less than 6 months, flag as "CRITICAL".
2. Scam/Dilution Detection:
   - Scan news titles for keywords: "Offering", "Direct Offering", "Private Placement", "Reverse Split", "Investigation", "Lawsuit", "Dilution".
3. Growth Reality Check:
   - Does the revenue justify the current hype? (Revenue vs. $0 revenue companies).

[Output Requirement]
Return ONLY a JSON object in the following format:
{
  "risk_score": 0-100,
  "cash_runway_months": "Number or 'Safe/Profitable'",
  "is_dilution_likely": true/false,
  "scam_alert_level": "Low" | "Medium" | "High",
  "audit_reason": "A short, sharp summary of the financial health and news sentiment (max 2 sentences)."
}`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error(`❌ AI Audit failed for ${ticker}:`, error.message);
    return null;
  }
}

async function runCollector() {
  console.log('🚀 Starting Zero-Cost Data Collector + AI Auditor...');
  
  for (const ticker of TICKERS) {
    const financials = await fetchFinancials(ticker);
    const newsItems = await fetchNews(ticker);
    
    if (financials && newsItems.length > 0) {
      const audit = await analyzeRisk(ticker, financials, newsItems);
      if (audit) {
        const { error } = await supabase.from('risk_audits').insert({
          ticker: ticker,
          risk_score: audit.risk_score,
          cash_runway_months: audit.cash_runway_months.toString(),
          is_dilution_likely: audit.is_dilution_likely,
          scam_alert_level: audit.scam_alert_level,
          audit_reason: audit.audit_reason
        });

        if (error && error.code === '42P01') {
          console.warn(`⚠️ Table 'risk_audits' does not exist. Run SQL in walkthrough.md`);
        } else if (error) {
          console.error('Supabase Audit Error:', error.message);
        } else {
          console.log(`✅ Risk Audit saved for ${ticker} (Score: ${audit.risk_score})`);
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('✨ Data collection and AI Audit complete!');
}

runCollector();
