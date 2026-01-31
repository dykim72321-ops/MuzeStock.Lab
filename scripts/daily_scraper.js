// scripts/daily_scraper.js
import 'dotenv/config';
import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

async function scrapeFinviz() {
  const day = new Date().getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
  
  // --- Discovery Modes Rotation ---
  const DISCOVERY_MODES = [
    { name: '대포주 (유동성 폭발)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u2,sh_relvol_o1.5&o=-volume' },
    { name: '로켓 (급등주)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_1to5&o=-change' },
    { name: '전통의 강자 (거래량 상위)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u1&o=-volume' },
    { name: '바닥 탈출 (과매도 반등)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u5,ta_rsi_u30&o=-volume' },
    { name: '신고가 헌터 (20일 신고가)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u5,ta_highlow20d_nh&o=-volume' },
    { name: '세력 매집 (기관 관심주)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u5,sh_instown_o10&o=-volume' },
    { name: '변동성 대장 (모 아니면 도)', url: 'https://finviz.com/screener.ashx?v=111&f=sh_price_u5&o=-volatility' }
  ];

  const mode = DISCOVERY_MODES[day];
  console.log(`🚀 헌터 봇 출격 모드: [${mode.name}]`);
  
  // 1. Supabase 연결 
  // 1. Supabase 연결 
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl) console.error('❌ Missing Env: VITE_SUPABASE_URL');
  if (!supabaseKey) console.error('❌ Missing Env: SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    console.error('⚠️ 필수 환경 변수가 누락되어 스크립트를 종료합니다.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  let browser;

  // 🛡️ Proxy Rotation Logic
  const PROXY_POOL = [
    // Add your proxy servers here in format: 'http://username:password@ip:port'
  ];

  const getRandomProxy = () => {
    if (PROXY_POOL.length === 0) return undefined;
    const proxy = PROXY_POOL[Math.floor(Math.random() * PROXY_POOL.length)];
    console.log(`🛡️ Rotating Proxy: ${proxy.replace(/:[^:]*@/, ':****@')}`);
    return { server: proxy };
  };

  try {
    const launchOptions = { 
      headless: true,
      proxy: getRandomProxy(),
      args: ['--no-sandbox', '--disable-setuid-sandbox'] // Fix: Sandbox issues in Docker
    };

    browser = await chromium.launch(launchOptions); 
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      viewport: { width: 1920, height: 1080 }
    });
    const page = await context.newPage();

    console.log(`🌐 접속 중: ${mode.url}`);
    
    // Fix 3: Timeout Handling
    try {
      await page.goto(mode.url, { waitUntil: 'networkidle', timeout: 60000 }); // 60s timeout
    } catch (e) {
      console.warn(`⏳ 1차 접속 실패 (Timeout). 재시도 중... (${e.message})`);
      await page.waitForTimeout(3000);
      await page.goto(mode.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
    }
    await page.goto(mode.url, { waitUntil: 'domcontentloaded' });

    // 데이터 긁어오기
    const stocks = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table[width="100%"] tr[valign="top"]'));
      return rows.slice(0, 15).map(row => { // 15개로 확장
        const cells = row.querySelectorAll('td');
        if (cells.length < 10) return null;
        
        return {
          ticker: cells[1].innerText.trim(),
          sector: cells[3].innerText.trim(),
          price: parseFloat(cells[8].innerText.trim()),
          change: cells[9].innerText.trim(),
          volume: cells[10].innerText.trim()
        };
      }).filter(item => item !== null);
    });

    console.log(`✅ [${mode.name}] 모드에서 ${stocks.length}개의 종목 발견!`);

    // Supabase에 저장 (추가 정보: 모드 이름 저장 가능하도록 나중에 테이블 확장 고려)
    const { error } = await supabase
      .from('daily_discovery')
      .upsert(stocks.map(s => ({ ...s, last_discovery_mode: mode.name })), { onConflict: 'ticker' });

    if (error) console.error('❌ 저장 실패:', error);
    else console.log('💾 Supabase 저장 완료!');

  } catch (err) {
    console.error('🚨 에러 발생:', err.message || err);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

scrapeFinviz().catch(err => {
  console.error('💥 예상치 못한 오류:', err);
  process.exit(1);
});
