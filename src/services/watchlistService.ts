import { supabase } from '../lib/supabase';

export interface WatchlistItem {
  ticker: string;
  addedAt: string;
  notes?: string;
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
export async function addToWatchlist(ticker: string, notes?: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await supabase
    .from('watchlist')
    .upsert({
      ticker: ticker.toUpperCase(),
      user_id: user?.id, // Optional if not logged in but RLS might block it
      notes,
    });

  if (error) {
    console.error('Error adding to watchlist:', error);
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
