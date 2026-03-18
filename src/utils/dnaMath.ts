/**
 * ATR 기반 목표가(Target) 및 Chandelier Exit (Trailing Stop) 연산 로직
 */
export function calculateDNATargets(
  entryPrice: number, 
  currentPrice: number,
  currentHigh: number = 0,
  atr5?: number,
  volatilityStdDev: number = 0,
  daysHeld: number = 0
) {
  // 1. Fallback: 데이터 없을 시 매수가의 20% 변동성 가정
  const effectiveATR = atr5 && atr5 > 0 ? atr5 : entryPrice * 0.20;
  
  // 2. 동적 멀티플라이어 (1.5 ~ 3.0)
  // Time-based ATR Tightening: 시간이 지날수록 스탑라인을 바짝 올려 수익을 보존
  let multiplierBase = 2.0;
  if (daysHeld > 5) {
    // 5일 초과 시 하루마다 0.1씩 멀티플라이어 감소 (최소 1.0까지)
    multiplierBase = Math.max(1.0, 2.0 - ((daysHeld - 5) * 0.1));
  }
  
  const volatilityFactor = Math.min(1.0, volatilityStdDev / (entryPrice * 0.05));
  const dynamicMultiplier = multiplierBase + (volatilityFactor * 1.0); 

  // 3. 목표가 (Target) - 고정 2.5 ATR
  const targetPrice = entryPrice + (effectiveATR * 2.5);
  
  // 4. Chandelier Exit (Trailing Stop)
  // 매수가 기준 초기 손절선
  const initialStop = entryPrice - (effectiveATR * 1.5);
  // 현재가/최고가 기준 트레일링 스탑
  const highSoFar = Math.max(currentHigh, currentPrice, entryPrice);
  const trailingStop = highSoFar - (effectiveATR * dynamicMultiplier);
  
  // 최종 손절가는 초기 손절가와 트레일링 스탑 중 높은 것 (단, 매수가의 50% 하방 방어)
  const stopPrice = Math.max(initialStop, trailingStop, entryPrice * 0.5);

  return {
    targetPrice: Number(targetPrice.toFixed(4)),
    stopPrice: Number(stopPrice.toFixed(4)),
    effectiveATR,
    isTrailing: trailingStop > initialStop
  };
}

/**
 * Kaufman's Efficiency Ratio (ER)
 * 추세의 순수 이동거리를 총 변동량으로 나눈 값 (1: 직선 추세, 0: 노이즈)
 */
export function calculateEfficiencyRatio(prices: number[]): number {
  if (prices.length < 2) return 1.0;
  
  const netChange = Math.abs(prices[prices.length - 1] - prices[0]);
  let sumVolatility = 0;
  
  for (let i = 1; i < prices.length; i++) {
    sumVolatility += Math.abs(prices[i] - prices[i - 1]);
  }
  
  return sumVolatility === 0 ? 1.0 : netChange / sumVolatility;
}

/**
 * Fractional Kelly Criterion (Quarter-Kelly)
 * 포지션 사이징 제안
 */
export function calculateKellyWeight(winProb: number, winLossRatio: number): number {
  // f* = p - (1-p)/r
  const r = Math.max(0.1, winLossRatio);
  const p = winProb / 100;
  const kelly = p - (1 - p) / r;
  
  // 보수적 운용을 위한 Quarter-Kelly 적용 (최대 25% 제한)
  const quarterKelly = Math.max(0, kelly / 4);
  return Number((quarterKelly * 100).toFixed(1));
}
