import type { Stock } from '../types';

export interface Recommendation {
  stock: Stock;
  reason: string;
  confidence: 'high' | 'medium' | 'low';
  action: 'buy' | 'watch' | 'avoid';
}

interface RecommendationCriteria {
  minDnaScore: number;
  maxPrice: number;
  minVolume: number;
  minChangePercent?: number;
}

const DEFAULT_CRITERIA: RecommendationCriteria = {
  minDnaScore: 65,
  maxPrice: 50, // Under $50 for growth stocks
  minVolume: 1000000,
};

/**
 * Analyzes a stock and generates a recommendation
 */
export function analyzeStock(stock: Stock, criteria = DEFAULT_CRITERIA): Recommendation | null {
  const { minDnaScore, maxPrice, minVolume } = criteria;

  // Filter out stocks that don't meet basic criteria
  if (stock.price > maxPrice || stock.volume < minVolume) {
    return null;
  }

  // Generate recommendation based on DNA score
  let action: Recommendation['action'];
  let confidence: Recommendation['confidence'];
  let reason: string;

  if (stock.dnaScore >= 80) {
    action = 'buy';
    confidence = 'high';
    reason = `High DNA score (${stock.dnaScore}) with strong volume. Pattern matches early-stage tech giants.`;
  } else if (stock.dnaScore >= 70) {
    action = 'buy';
    confidence = 'medium';
    reason = `Good DNA score (${stock.dnaScore}). Showing potential growth indicators.`;
  } else if (stock.dnaScore >= minDnaScore) {
    action = 'watch';
    confidence = 'low';
    reason = `Moderate DNA score (${stock.dnaScore}). Add to watchlist for further monitoring.`;
  } else {
    return null; // Don't recommend low-scoring stocks
  }

  // Adjust based on momentum
  if (stock.changePercent > 5) {
    reason += ' Strong upward momentum today.';
    if (confidence === 'medium') confidence = 'high';
  } else if (stock.changePercent < -5) {
    reason += ' Caution: Significant drop today.';
    if (action === 'buy') action = 'watch';
    confidence = 'low';
  }

  return { stock, reason, confidence, action };
}

/**
 * Gets top daily stock picks based on recommendation criteria
 */
export function getDailyPicks(stocks: Stock[], maxPicks = 5): Recommendation[] {
  const recommendations = stocks
    .map(stock => analyzeStock(stock))
    .filter((rec): rec is Recommendation => rec !== null)
    .sort((a, b) => {
      // Sort by confidence then DNA score
      const confidenceOrder = { high: 3, medium: 2, low: 1 };
      const confDiff = confidenceOrder[b.confidence] - confidenceOrder[a.confidence];
      if (confDiff !== 0) return confDiff;
      return b.stock.dnaScore - a.stock.dnaScore;
    });

  return recommendations.slice(0, maxPicks);
}

/**
 * Generates a morning briefing summary
 */
export function generateBriefingSummary(recommendations: Recommendation[]): string {
  const buyCount = recommendations.filter(r => r.action === 'buy').length;
  const watchCount = recommendations.filter(r => r.action === 'watch').length;
  const highConfCount = recommendations.filter(r => r.confidence === 'high').length;

  if (buyCount === 0 && watchCount === 0) {
    return 'No strong opportunities identified today. Market conditions may be volatile.';
  }

  let summary = `Today's scan found ${buyCount} buy signal${buyCount !== 1 ? 's' : ''} and ${watchCount} watch candidate${watchCount !== 1 ? 's' : ''}.`;
  
  if (highConfCount > 0) {
    summary += ` ${highConfCount} high-confidence pick${highConfCount !== 1 ? 's' : ''} detected.`;
  }

  return summary;
}
