import type { Stock } from '../types';

export interface Recommendation {
  stock: Stock;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  action: 'buy' | 'watch' | 'avoid';
}

/**
 * Groups stocks by sector for diversity analysis
 */
function groupBySector(stocks: Stock[]): Record<string, Stock[]> {
  return stocks.reduce((acc, stock) => {
    const sector = stock.sector || 'Unknown';
    if (!acc[sector]) acc[sector] = [];
    acc[sector].push(stock);
    return acc;
  }, {} as Record<string, Stock[]>);
}



/**
 * Analyzes a stock and generates a recommendation
 */
export const analyzeStock = (stock: Stock): Recommendation => {
  const { dnaScore, changePercent, volume } = stock;
  
  let action: Recommendation['action'] = 'watch';
  let confidence: Recommendation['confidence'] = 'medium';
  let reason = '';

  if (dnaScore > 85) {
    action = 'buy';
    confidence = 'high';
    reason = `매우 높은 DNA 점수(${dnaScore})와 강력한 모멘텀을 보유하고 있습니다.`;
  } else if (dnaScore > 75) {
    action = 'buy';
    confidence = 'medium';
    reason = `양호한 DNA 점수(${dnaScore})를 기록하며 성장 지표가 유효합니다.`;
  } else if (changePercent > 5 && volume > 500000) {
    action = 'buy';
    confidence = 'low';
    reason = `높은 거래량과 함께 가격 급등이 포착되었습니다. 단기 변동성에 주의하세요.`;
  } else if (dnaScore > 60) {
    action = 'watch';
    confidence = 'medium';
    reason = `잠재적 DNA 일치 가능성이 있으나 추가적인 거래량 확인이 필요합니다.`;
  } else {
    action = 'avoid';
    confidence = 'low';
    reason = `현재 기준 DNA 점수가 낮으며 리스크가 높습니다.`;
  }

  return { stock, reason, confidence, action };
};

/**
 * Gets top daily stock picks based on recommendation criteria
 * @param stocks - Input stock list
 * @param maxPicks - Maximum number of picks to return
 * @param recentTickers - Recently recommended tickers to exclude (blacklist)
 */
export function getDailyPicks(
  stocks: Stock[], 
  maxPicks = 5,
  recentTickers: string[] = []
): Recommendation[] {
  // 1. 최근 추천 종목 제외
  const freshStocks = stocks.filter(s => !recentTickers.includes(s.ticker));
  
  // 2. 섹터별 그룹화
  const bySector = groupBySector(freshStocks);
  
  // 3. 각 섹터에서 최대 2개씩 선택하여 다양성 확보
  const diverseStocks: Stock[] = [];
  for (const sectorStocks of Object.values(bySector)) {
    const topTwo = sectorStocks
      .sort((a, b) => b.dnaScore - a.dnaScore)
      .slice(0, 2);
    diverseStocks.push(...topTwo);
  }
  
  // 4. 추천 생성 및 정렬
  const recommendations = diverseStocks
    .map(stock => analyzeStock(stock))
    .filter((rec): rec is Recommendation => rec !== null)
    .sort((a, b) => {
      // Sort by confidence then DNA score
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      const confDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      if (confDiff !== 0) return confDiff;
      return b.stock.dnaScore - a.stock.dnaScore;
    });

  return recommendations.slice(0, maxPicks);
}

/**
 * Generates a morning briefing summary
 */
export function generateBriefingSummary(recommendations: Recommendation[]): string {
  const buyCount = recommendations.filter(r => r.action === 'buy').length;
  const watchCount = recommendations.filter(r => r.action === 'watch').length;
  const highConfCount = recommendations.filter(r => r.confidence === 'high').length;

  if (buyCount === 0 && watchCount === 0) {
    return '현재 스캔 결과 강력한 추천 종목이 없습니다. 시장 상황을 계속 모니터링 중입니다.';
  }

  let summary = `오늘의 스캔 결과 ${buyCount}개의 매수 신호와 ${watchCount}개의 관찰 대상 종목이 발견되었습니다.`;
  
  if (highConfCount > 0) {
    summary += ` 그 중 ${highConfCount}개는 높은 신뢰도의 추천 종목입니다.`;
  }

  return summary;
}
