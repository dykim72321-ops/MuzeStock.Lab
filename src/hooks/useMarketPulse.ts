
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

// Sonner Toast 사용 시 (프로젝트에 sonner가 설치되어 있다면)
import { toast } from 'sonner'; 

export interface MarketSignal {
  ticker: string;
  indicator: string;
  value: number;
  price: number;
  signal: 'OVERSOLD' | 'OVERBOUGHT' | 'NEUTRAL';
  timestamp: string;
}

export const useMarketPulse = () => {
  const [lastSignal, setLastSignal] = useState<MarketSignal | null>(null);

  useEffect(() => {
    // 'realtime_signals' 테이블의 INSERT 이벤트를 구독
    const channel = supabase
      .channel('market-pulse')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'realtime_signals' },
        (payload) => {
          const signal = payload.new as MarketSignal;
          setLastSignal(signal);
          
          console.log("💓 Pulse Received:", signal);

          // RSI 30 미만이면 즉각 알림 발송!
          if (signal.signal === 'OVERSOLD') {
             // Toast 알림 (라이브러리 없으면 alert 대체 가능)
             try {
                toast.error(`🚨 ${signal.ticker} 과매도 진입! (RSI: ${signal.value})`);
             } catch(e) {
                console.warn("Toast library not found:", e);
             }
          } else if (signal.signal === 'OVERBOUGHT') {
             try {
                toast.success(`📈 ${signal.ticker} 과매수 구간! (RSI: ${signal.value})`);
             } catch(e) {
                
             }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return lastSignal;
};
