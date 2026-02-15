/**
 * Finviz Hunter Bot
 * 
 * Playwright 기반 Finviz 스크리너 크롤러
 * 조건: $1 미만 + 거래량 순 정렬
 * 
 * 실행: npx ts-node scripts/finviz-hunter.ts
 */

import { chromium } from 'playwright';
import { createClient } from '@supabase/supabase-js';

// Supabase 설정 (환경변수에서 로드)
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

interface DiscoveredStock {
  ticker: string;
  price: number;
  volume: string;
  change: string;
  sector: string;
}

async function scrapeFinviz(): Promise<DiscoveredStock[]> {
  console.log('🚀 Finviz Hunter Bot 시작...');
  
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // Finviz 스크리너 URL: $1 미만, 거래량 내림차순
  // 필터: sh_price_u1 (Under $1), o=-volume (거래량 내림차순)
  const url = 'https://finviz.com/screener.ashx?v=111&f=sh_price_u1&o=-volume';
  
  console.log('📡 Finviz 접속 중...');
  await page.goto(url, { 
    waitUntil: 'networkidle',
    timeout: 30000  // 30초로 증가 (CI 환경 고려)
  });
  
  // 테이블 로드 대기
  await page.waitForSelector('table.screener_table', { timeout: 20000 });  // 20초로 증가
  
  // 데이터 추출
  const stocks = await page.evaluate(() => {
    const rows = document.querySelectorAll('table.screener_table tbody tr');
    const results: any[] = [];
    
    rows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      if (cells.length >= 10) {
        const ticker = cells[1]?.textContent?.trim() || '';
        const sector = cells[3]?.textContent?.trim() || '';
        const priceText = cells[8]?.textContent?.trim() || '0';
        const change = cells[9]?.textContent?.trim() || '0%';
        const volume = cells[10]?.textContent?.trim() || '0';
        
        if (ticker && ticker !== 'Ticker') {
          results.push({
            ticker,
            price: parseFloat(priceText.replace(/[^0-9.-]/g, '')) || 0,
            volume,
            change,
            sector
          });
        }
      }
    });
    
    return results;
  });
  
  await browser.close();
  
  console.log(`✅ ${stocks.length}개 종목 발굴 완료`);
  return stocks;
}

async function saveToSupabase(stocks: DiscoveredStock[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  console.log('💾 Supabase에 저장 중...');
  
  // 기존 데이터 삭제 (매일 갱신)
  await supabase.from('daily_discovery').delete().neq('ticker', '');
  
  // 새 데이터 삽입
  const { error } = await supabase.from('daily_discovery').upsert(
    stocks.map(s => ({
      ticker: s.ticker,
      price: s.price,
      volume: s.volume,
      change: s.change,
      sector: s.sector,
      updated_at: new Date().toISOString()
    })),
    { onConflict: 'ticker' }
  );
  
  if (error) {
    console.error('❌ 저장 실패:', error);
  } else {
    console.log(`✅ ${stocks.length}개 종목 저장 완료`);
  }
}

async function main() {
  try {
    const stocks = await scrapeFinviz();
    
    if (stocks.length > 0) {
      // 콘솔에 미리보기 출력
      console.log('\n📊 상위 10개 종목:');
      stocks.slice(0, 10).forEach((s, i) => {
        console.log(`${i + 1}. ${s.ticker} | $${s.price} | ${s.change} | Vol: ${s.volume}`);
      });
      
      await saveToSupabase(stocks);
    } else {
      console.log('⚠️ 발굴된 종목이 없습니다.');
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();
