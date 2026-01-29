/**
 * Watchlist Service
 * Manages user's stock watchlist with localStorage persistence
 */

const WATCHLIST_KEY = 'stock_watchlist';

export interface WatchlistItem {
  ticker: string;
  addedAt: string;
  notes?: string;
}

/**
 * Get all watchlist items
 */
export function getWatchlist(): WatchlistItem[] {
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Check if a stock is in the watchlist
 */
export function isInWatchlist(ticker: string): boolean {
  const watchlist = getWatchlist();
  return watchlist.some(item => item.ticker.toUpperCase() === ticker.toUpperCase());
}

/**
 * Add a stock to the watchlist
 */
export function addToWatchlist(ticker: string, notes?: string): void {
  const watchlist = getWatchlist();
  
  if (isInWatchlist(ticker)) {
    return; // Already exists
  }

  const newItem: WatchlistItem = {
    ticker: ticker.toUpperCase(),
    addedAt: new Date().toISOString(),
    notes,
  };

  watchlist.push(newItem);
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
}

/**
 * Remove a stock from the watchlist
 */
export function removeFromWatchlist(ticker: string): void {
  const watchlist = getWatchlist();
  const filtered = watchlist.filter(
    item => item.ticker.toUpperCase() !== ticker.toUpperCase()
  );
  localStorage.setItem(WATCHLIST_KEY, JSON.stringify(filtered));
}

/**
 * Toggle a stock in/out of the watchlist
 */
export function toggleWatchlist(ticker: string): boolean {
  if (isInWatchlist(ticker)) {
    removeFromWatchlist(ticker);
    return false;
  } else {
    addToWatchlist(ticker);
    return true;
  }
}

/**
 * Clear the entire watchlist
 */
export function clearWatchlist(): void {
  localStorage.removeItem(WATCHLIST_KEY);
}
