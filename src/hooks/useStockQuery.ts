import { useQuery } from '@tanstack/react-query';
import { fetchStockQuote } from '../services/stockService';
import { fetchStockAnalysis } from '../services/analysisService';
import type { Stock } from '../types';

export const useStockQuery = (ticker: string) => {
  return useQuery({
    queryKey: ['stock', ticker],
    queryFn: () => fetchStockQuote(ticker),
    enabled: !!ticker,
  });
};

export const useStockAnalysisQuery = (ticker: string) => {
  return useQuery({
    queryKey: ['analysis', ticker],
    queryFn: () => fetchStockAnalysis(ticker),
    enabled: !!ticker,
    staleTime: 60 * 60 * 1000, // 1시간 (AI 분석은 덜 자주 갱신)
  });
};
