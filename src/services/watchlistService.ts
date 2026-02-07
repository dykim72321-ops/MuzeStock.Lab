import { supabase } from '../lib/supabase';

export type WatchlistStatus = 'WATCHING' | 'HOLDING' | 'EXITED';

export interface WatchlistItem {
  ticker: string;
  addedAt: string;
  notes?: string;
  status: WatchlistStatus;
}

/**
 * Get all watchlist items from Supabase
 */
export async function getWatchlist(): Promise<WatchlistItem[]> {
  const { data, error } = await supabase
    .from('watchlist')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching watchlist:', error);
    return [];
  }

  return data.map(item => ({
    ticker: item.ticker,
    addedAt: item.created_at,
    notes: item.notes,
    status: (item.status as WatchlistStatus) || 'WATCHING',
  }));
}

/**
 * Check if a stock is in the watchlist
 */
export async function isInWatchlist(ticker: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('watchlist')
    .select('*', { count: 'exact', head: true })
    .eq('ticker', ticker.toUpperCase());

  if (error) {
    console.error('Error checking watchlist:', error);
    return false;
  }

  return (count ?? 0) > 0;
}

/**
 * Add a stock to the watchlist
 */
export async function addToWatchlist(ticker: string, notes?: string, status: WatchlistStatus = 'WATCHING'): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('watchlist')
    .upsert({
      ticker: ticker.toUpperCase(),
      user_id: user?.id,
      notes,
      status,
    });

  if (error) {
    console.error('Error adding to watchlist:', error);
  }
}

/**
 * Update the status of a watchlist item
 */
export async function updateWatchlistStatus(ticker: string, status: WatchlistStatus): Promise<void> {
  const { error } = await supabase
    .from('watchlist')
    .update({ status })
    .eq('ticker', ticker.toUpperCase());

  if (error) {
    console.error('Error updating watchlist status:', error);
  }
}

/**
 * Remove a stock from the watchlist
 */
export async function removeFromWatchlist(ticker: string): Promise<void> {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .eq('ticker', ticker.toUpperCase());

  if (error) {
    console.error('Error removing from watchlist:', error);
  }
}

/**
 * Toggle a stock in/out of the watchlist
 */
export async function toggleWatchlist(ticker: string): Promise<boolean> {
  const inWatchlist = await isInWatchlist(ticker);
  if (inWatchlist) {
    await removeFromWatchlist(ticker);
    return false;
  } else {
    await addToWatchlist(ticker);
    return true;
  }
}

/**
 * Clear the entire watchlist
 */
export async function clearWatchlist(): Promise<void> {
  const { error } = await supabase
    .from('watchlist')
    .delete()
    .neq('ticker', ''); // Delete all

  if (error) {
    console.error('Error clearing watchlist:', error);
  }
}
