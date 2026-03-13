/**
 * ATR 기반 목표가(Target) 및 손절가(Stop Loss) 연산 로직을 중앙화한 순수 함수입니다.
 * React Hook 규칙과 상관없이 이벤트 핸들러 등 어디서든 호출 가능합니다.
 */
export function calculateDNATargets(buyPrice: number, atr5?: number) {
  // 1. Fallback 로직 (데이터 없을 시 매수가의 20% 변동성 가정)
  const effectiveATR = atr5 && atr5 > 0 ? atr5 : buyPrice * 0.20;
  
  // 2. 동적 목표가(T)와 손절가(S) 계산
  const targetPrice = buyPrice + effectiveATR * 2.5;
  
  // 손절가 최소 50% 방어 (Floor 설정)
  const calculatedStop = buyPrice - effectiveATR * 1.2;
  const stopPrice = Math.max(calculatedStop, buyPrice * 0.5); 

  return {
    targetPrice: Number(targetPrice.toFixed(2)),
    stopPrice: Number(stopPrice.toFixed(2)),
    effectiveATR: Number(effectiveATR.toFixed(2))
  };
}
