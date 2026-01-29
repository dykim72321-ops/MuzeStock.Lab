import { supabase } from '../lib/supabase';
import type { Stock } from '../types';

export interface AIAnalysis {
  matchReasoning: string;
  bullCase: string[];
  bearCase: string[];
  dnaScore: number;
}

export async function fetchStockAnalysis(stock: Stock): Promise<AIAnalysis | null> {
  try {
    const { data, error } = await supabase.functions.invoke('analyze-stock', {
      body: {
        ticker: stock.ticker,
        price: stock.price,
        change: stock.changePercent,
        volume: stock.volume,
        peRatio: stock.relevantMetrics.peRatio,
        revenueGrowth: stock.relevantMetrics.revenueGrowth,
        operatingMargin: stock.relevantMetrics.operatingMargin,
      },
    });

    if (error) throw error;
    return data as AIAnalysis;
  } catch (error) {
    console.warn('AI Analysis failed, falling back to heuristic:', error);
    return null;
  }
}
