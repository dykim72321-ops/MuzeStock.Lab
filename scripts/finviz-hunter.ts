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
  volume: number; // string에서 number로 변경
  change: string;
  sector: string;
}

async function scrapeFinviz(): Promise<DiscoveredStock[]> {
  console.log('🚀 Finviz Hunter Bot 시작 (Bypass Mode)...');
  
  // 1. 안티봇 우회 설정
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 720 },
    extraHTTPHeaders: {
      'Accept-Language': 'en-US,en;q=0.9',
    }
  });
  
  const page = await context.newPage();
  
  // Finviz 스크리너 URL: $1 미만, 거래량 내림차순
  const url = 'https://finviz.com/screener.ashx?v=111&f=sh_price_u1&o=-volume';
  
  console.log('📡 Finviz 접속 중...');
  try {
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 45000 
    });
    
    // 테이블 로드 대기
    await page.waitForSelector('table.screener-body-table', { timeout: 20000 });
    
    // 데이터 추출
    const stocks = await page.evaluate(() => {
      const rows = document.querySelectorAll('table.screener-body-table tr.table-dark-row-cp, table.screener-body-table tr.table-light-row-cp');
      const results: any[] = [];
      
      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 10) {
          const ticker = cells[1]?.textContent?.trim() || '';
          const sector = cells[3]?.textContent?.trim() || '';
          const priceText = cells[8]?.textContent?.trim() || '0';
          const change = cells[9]?.textContent?.trim() || '0%';
          const volumeText = cells[10]?.textContent?.trim() || '0';
          
          if (ticker && ticker !== 'Ticker') {
            results.push({
              ticker,
              price: parseFloat(priceText.replace(/[^0-9.-]/g, '')) || 0,
              volumeText, // 파싱 전 텍스트 전달
              change,
              sector
            });
          }
        }
      });
      
      return results;
    });

    // 2. Volume 데이터 정규화 (Commas 제거 및 Number 변환)
    const normalizedStocks: DiscoveredStock[] = stocks.map(s => ({
      ...s,
      volume: parseInt(s.volumeText.replace(/,/g, ''), 10) || 0
    }));
    
    await browser.close();
    console.log(`✅ ${normalizedStocks.length}개 종목 1차 발굴 완료`);
    return normalizedStocks;

  } catch (error) {
    console.error('❌ 스크래핑 실패 (블락 가능성):', error);
    await browser.close();
    return [];
  }
}

async function validateWithPythonEngine(stocks: DiscoveredStock[]): Promise<DiscoveredStock[]> {
  const tickers = stocks.map(s => s.ticker);
  console.log(`🧪 Python 퀀트 엔진에 {${tickers.length}}개 종목 검증 요청...`);
  
  try {
    const response = await fetch('http://localhost:8000/api/validate_candidates', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Admin-Key': process.env.ADMIN_SECRET_KEY || ''
      },
      body: JSON.stringify({ tickers })
    });
    
    if (!response.ok) {
      console.warn('⚠️ 퀀트 엔진 응답 실패, 필터링 없이 진행합니다.');
      return stocks;
    }
    
    const validTickers: string[] = await response.json();
    console.log(`🎯 검증 통과: ${validTickers.length}/${tickers.length} 종목`);
    
    return stocks.filter(s => validTickers.includes(s.ticker));
  } catch (error) {
    console.error('❌ 퀀트 엔진 통신 오류:', error);
    return stocks; // 오류 시 원래 데이터 반환 (Fallback)
  }
}

async function saveToSupabase(stocks: DiscoveredStock[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
    return;
  }
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  
  console.log(`💾 Supabase에 ${stocks.length}개 최종 타겟 저장 중...`);
  
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
    // 1. 스크래핑
    const candidates = await scrapeFinviz();
    
    if (candidates.length > 0) {
      // 2. 퀀트 엔진 검증 (The Missing Link)
      const validStocks = await validateWithPythonEngine(candidates);
      
      if (validStocks.length > 0) {
        // 콘솔에 미리보기 출력
        console.log('\n🎯 최종 선정된 타겟:');
        validStocks.slice(0, 10).forEach((s, i) => {
          console.log(`${i + 1}. ${s.ticker} | $${s.price} | ${s.change} | Vol: ${s.volume.toLocaleString()}`);
        });
        
        // 3. DB 저장
        await saveToSupabase(validStocks);
      } else {
        console.log('⚠️ 퀀트 엔진 검증을 통과한 종목이 없습니다.');
      }
    } else {
      console.log('⚠️ 발굴된 후보 종목이 없습니다. (Finviz 블락 확인 필요)');
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
    process.exit(1);
  }
}

main();
