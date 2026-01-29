import type { Stock, Benchmark, AnalysisReport } from '../types';


export const MOCK_STOCKS: Stock[] = [
  {
    id: '1',
    ticker: 'NANO',
    name: 'NanoTech Solutions',
    price: 0.85,
    changePercent: 12.5,
    volume: 1540000,
    marketCap: '45M',
    dnaScore: 92,
    sector: 'Semiconductors',
    description: 'Developing novel graphene-based chip interconnects.',
    relevantMetrics: {
      debtToEquity: 0.15,
      rndRatio: 35.0,
      revenueGrowth: 120,
    },
  },
  {
    id: '2',
    ticker: 'BIOX',
    name: 'BioXcelerate',
    price: 0.42,
    changePercent: -2.3,
    volume: 890000,
    marketCap: '22M',
    dnaScore: 88,
    sector: 'Biotech',
    description: 'AI-driven drug discovery for rare diseases.',
    relevantMetrics: {
      debtToEquity: 0.05,
      rndRatio: 45.0,
      revenueGrowth: 85,
    },
  },
  {
    id: '3',
    ticker: 'ROBO',
    name: 'RoboLogistics',
    price: 0.95,
    changePercent: 5.4,
    volume: 2100000,
    marketCap: '60M',
    dnaScore: 75,
    sector: 'Robotics',
    description: 'Autonomous warehouse fulfillment units.',
    relevantMetrics: {
      debtToEquity: 0.8,
      rndRatio: 15.0,
      revenueGrowth: 40,
    },
  },
  {
    id: '4',
    ticker: 'SOLA',
    name: 'SolarGrid',
    price: 0.33,
    changePercent: 1.2,
    volume: 450000,
    marketCap: '15M',
    dnaScore: 65,
    sector: 'Energy',
    description: 'Micro-grid management software.',
    relevantMetrics: {
      debtToEquity: 1.2,
      rndRatio: 10.0,
      revenueGrowth: 25,
    },
  },
  {
    id: '5',
    ticker: 'CYBR',
    name: 'CyberDef',
    price: 0.78,
    changePercent: 8.9,
    volume: 3200000,
    marketCap: '95M',
    dnaScore: 55,
    sector: 'Cybersecurity',
    description: 'Quantum-resistant encryption protocols.',
    relevantMetrics: {
      debtToEquity: 0.3,
      rndRatio: 25.0,
      revenueGrowth: 60,
    },
  },
];

// Generate synthetic historical data for NVIDIA (2002 era style approximation)
const generateHistory = (startPrice: number, volatility: number, trend: number, days: number) => {
  let price = startPrice;
  return Array.from({ length: days }, (_, i) => {
    const change = (Math.random() - 0.5) * volatility + trend;
    price = price * (1 + change);
    return {
      date: `Day ${i + 1}`,
      price: Number(price.toFixed(2)),
    };
  });
};

export const MOCK_BENCHMARK: Benchmark = {
  id: 'nvda-2002',
  name: 'NVIDIA (2002)',
  period: 'Early Growth Phase',
  description: 'The period following the launch of GeForce 4, characterized by high R&D spending and volatility before massive scale.',
  historicalData: generateHistory(2.5, 0.05, 0.002, 30), // 30 days of data
};

// Generate matching current stock history (shorter term, normalized to match scale visually or handled in component)
export const getStockHistory = (ticker: string) => {
  // Just deterministic random for demo
  const seed = ticker.length; // Used for deterministic 'random' if needed, currently unused but kept for expansion
  console.log(seed); // Suppress unused error

  return generateHistory(0.5, 0.08, 0.005, 30);
};

export const MOCK_ANALYSIS: AnalysisReport = {
  stockId: '1', // NANO
  summary: 'Strong match with early NVIDIA profiles due to aggressive R&D spending relative to market cap.',
  bullCase: [
    'R&D Ratio matches NVIDIA 2002 levels (35% vs 33%)',
    'Low debt structure allows flexibility',
    'Volume spike precedes price breakout',
  ],
  bearCase: [
    'Market cap is significantly smaller than the benchmark at similar stage',
    'Sector volatility is currently high',
  ],
  matchReasoning: 'The AI has identified a 92% correlation in the "Capital Allocation Efficiency" vector. Just like NVIDIA in the early 2000s, NANO is reinvesting nearly all gross profit into R&D while maintaining zero long-term debt. This specific pattern often precedes a product-led breakout.',
  dnaScore: 92,
};
