// scripts/daily_scraper.js
require('dotenv').config();
const { chromium } = require('playwright');
const { createClient } = require('@supabase/supabase-js');

// 1. Supabase 연결 (Service Role Key 필요 - 쓰기 권한)
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 주의: 서비스 롤 키 사용
const supabase = createClient(supabaseUrl, supabaseKey);

async function scrapeFinviz() {
  console.log('🚀 헌터 봇 출격 준비...');
  
  // 2. 브라우저 띄우기 (Finviz가 봇을 막지 않도록 User-Agent 설정)
  const browser = await chromium.launch({ headless: true }); // 서버에서는 true
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  const page = await context.newPage();

  try {
    // 3. Finviz 접속 ($1 미만, 거래량 상위 순)
    const url = 'https://finviz.com/screener.ashx?v=111&f=sh_price_u1&o=-volume';
    console.log(`🌐 접속 중: ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded' });

    // 4. 데이터 긁어오기 (테이블 행 추출)
    const stocks = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('table[width="100%"] tr[valign="top"]'));
      // 상위 10개만 추출
      return rows.slice(0, 10).map(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length < 10) return null;
        
        return {
          ticker: cells[1].innerText.trim(),  // No.2 컬럼이 티커
          sector: cells[3].innerText.trim(),  // No.4 컬럼이 섹터
          price: parseFloat(cells[8].innerText.trim()), // No.9 가격
          change: cells[9].innerText.trim(),  // No.10 등락률
          volume: cells[10].innerText.trim()  // No.11 거래량
        };
      }).filter(item => item !== null); // 빈 값 제거
    });

    console.log(`✅ ${stocks.length}개의 보물 발견:`, stocks.map(s => s.ticker).join(', '));

    // 5. Supabase에 저장 (기존 데이터 덮어쓰기 - Upsert)
    const { error } = await supabase
      .from('daily_discovery')
      .upsert(stocks, { onConflict: 'ticker' });

    if (error) console.error('❌ 저장 실패:', error);
    else console.log('💾 Supabase 저장 완료!');

  } catch (err) {
    console.error('🚨 에러 발생:', err);
  } finally {
    await browser.close();
  }
}

scrapeFinviz();
