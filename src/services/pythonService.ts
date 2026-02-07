/**
 * MuzeStock.Lab - Python Technical Analysis Service
 */

export interface TechnicalIndicators {
  ticker: string;
  period: string;
  current_price: number;
  rsi_14: number | null;
  sma_20: number | null;
  sma_50: number | null;
  ema_12: number | null;
  ema_26: number | null;
  macd: number | null;
  macd_signal: number | null;
  signal: 'BUY' | 'SELL' | 'HOLD';
  reasoning: string;
}

export interface AnalyzeRequest {
  ticker: string;
  period?: string;
}

/**
 * Fetch technical analysis data from the Python backend
 * @param params - { ticker: string, period?: string }
 * @returns Technical indicators and signal
 */
export async function fetchTechnicalAnalysis(params: AnalyzeRequest): Promise<TechnicalIndicators> {
  try {
    const response = await fetch('/py-api/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ticker: params.ticker,
        period: params.period || '1mo',
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to fetch technical analysis');
    }

    return await response.json();
  } catch (error) {
    console.error('Error in fetchTechnicalAnalysis:', error);
    throw error;
  }
}
