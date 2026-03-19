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
  // 1. Fallback: 데이터 없을 시 매수가의 8% 변동성 가정 (현실적인 스윙 변동성)
  // 저가주(Under $1)의 경우 주가의 1% 혹은 최소 0.0005로 조정하여 초정밀 대응
  const minAtr = entryPrice < 1 ? Math.max(0.0005, entryPrice * 0.01) : 0.01;
  const effectiveATR = Math.max(minAtr, atr5 && atr5 > 0 ? atr5 : entryPrice * 0.08);
  
  // 2. 동적 목표가 (Target) - [Optimized] 4.0 ATR (보수적 수익 실현)
  let targetPrice = entryPrice + (effectiveATR * 4.0); 

  // 3. 동적 손절가 멀티플라이어 (Chandelier Exit 기반)
  // 1. Time-based ATR Tightening (시작 3.0 -> 최저 1.8)
  let multiplierBase = 2.5; // [Fix] 3.0 -> 2.5로 더 타이트하게 보호
  if (daysHeld > 1) {
    multiplierBase = Math.max(1.5, 2.5 - (daysHeld * 0.4));
  }
  
  const volatilityFactor = Math.min(1.0, volatilityStdDev / (entryPrice * 0.05));
  const dynamicMultiplier = multiplierBase + (volatilityFactor * 0.5); 

  // 4. Chandelier Exit (Trailing Stop)
  const initialStop = entryPrice - (effectiveATR * 2.5);
  const highSoFar = Math.max(currentHigh, currentPrice, entryPrice);
  const trailingStop = highSoFar - (effectiveATR * dynamicMultiplier);
  
  // 최종 손절가 (매수가의 50% 하방 방어 유지)
  let stopPrice = Math.max(initialStop, trailingStop, entryPrice * 0.5);

  // [Fix] 논리적 가드 (Math Guards)
  // 1. Target은 항상 현재가보다 최소 3% 위, 진입가보다 최소 5% 위여야 함
  targetPrice = Math.max(targetPrice, currentPrice * 1.03, entryPrice * 1.05);
  
  // 2. Stop은 항상 현재가보다 낮아야 함 (직격 손절 방지)
  stopPrice = Math.min(stopPrice, currentPrice * 0.98);

  // 3. R/R Ratio Guard: Target 수익폭이 Stop 리스크폭의 최소 1.5배가 되도록 보정
  const risk = entryPrice - stopPrice;
  const minReward = risk * 1.5;
  if ((targetPrice - entryPrice) < minReward) {
    targetPrice = entryPrice + minReward;
  }

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
export function calculateKellyWeight(winProb: number, winLossRatio: number): { weight: number, rawKelly: number } {
  // f* = p - (1-p)/r
  // 손익비(r)를 최대 5.0으로 캡핑하여 과도한 비중 실림 방지 (안전장치)
  const r = Math.min(5.0, Math.max(0.1, winLossRatio));
  const p = winProb / 100;
  const kelly = p - (1 - p) / r;
  
  const quarterKelly = isNaN(kelly) ? 0 : Math.max(0, kelly / 4);
  return {
    weight: Number((quarterKelly * 100).toFixed(1)),
    rawKelly: isNaN(kelly) ? 0 : kelly
  };
}
