import { useMemo } from 'react';
import { calculateDNATargets } from '../utils/dnaMath';

interface DNAConfig {
  buyPrice: number;
  currentPrice: number;
  atr5?: number; // Supabase에서 내려주는 5일 평균 변동폭
  buyDate: string; // ISO String 형태
}

export function useDNACalculator({ buyPrice, currentPrice, atr5, buyDate }: DNAConfig) {
  return useMemo(() => {
    // 1. 공통 연산 함수 사용 (T: 목표가, S: 손절가)
    const { targetPrice: T, stopPrice: S, effectiveATR } = calculateDNATargets(buyPrice, atr5);
    
    const GAMMA = 0.8; // 수익 모멘텀 지수
    const DELTA = 1.5; // 손실 공포 지수
    const LAMBDA = 2; // 일일 시간 감가점

    // 2. 시간 페널티 계산 (Time Decay - UTC 기준 안정화)
    const msPerDay = 1000 * 60 * 60 * 24;
    const now = new Date();
    const utcNow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    const added = new Date(buyDate);
    const utcAdded = Date.UTC(added.getUTCFullYear(), added.getUTCMonth(), added.getUTCDate());
    
    const daysHeld = Math.max(0, Math.floor((utcNow - utcAdded) / msPerDay));
    const timePenalty = Math.min(40, daysHeld * LAMBDA); // 최대 40점 Cap

    // 3. 비선형 DNA 스코어 계산
    let score = 50;

    if (currentPrice >= T) {
      score = 100; // 목표 달성 시 페널티 없이 100점
    } else if (currentPrice > buyPrice) {
      // 수익 구간 로직
      const progress = (currentPrice - buyPrice) / (T - buyPrice);
      score = 50 + 50 * Math.pow(progress, GAMMA) - timePenalty;
    } else {
      // 손실 구간 로직
      const fall = (buyPrice - currentPrice) / (buyPrice - S);
      // currentPrice가 S 밑으로 내려가면 fall이 1보다 커지므로 점수는 0에 수렴
      const clampedFall = Math.min(1, fall); 
      score = 50 - 50 * Math.pow(clampedFall, DELTA) - timePenalty;
    }

    // 4. 최종 점수 보정 (0 ~ 100 사이 유지)
    return {
      dnaScore: Math.max(0, Math.min(100, Math.round(score))),
      targetPrice: T,
      stopPrice: S,
      timePenalty,
      daysHeld,
      effectiveATR
    };
  }, [buyPrice, currentPrice, atr5, buyDate]);
}

