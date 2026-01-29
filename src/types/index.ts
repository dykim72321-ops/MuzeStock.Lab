export interface Stock {
  id: string;
  ticker: string;
  name: string;
  price: number;
  changePercent: number;
  volume: number;
  marketCap: string;
  dnaScore: number;
  sector: string;
  description: string;
  relevantMetrics: {
    debtToEquity: number;
    rndRatio: number; // R&D as % of Revenue
    revenueGrowth: number;
  };
}

export interface HistoricalDataPoint {
  date: string;
  price: number;
}

export interface Benchmark {
  id: string;
  name: string;
  period: string;
  description: string;
  historicalData: HistoricalDataPoint[];
}

export interface AnalysisReport {
  stockId: string;
  summary: string;
  bullCase: string[];
  bearCase: string[];
  matchReasoning: string;
  dnaScore: number;
}
