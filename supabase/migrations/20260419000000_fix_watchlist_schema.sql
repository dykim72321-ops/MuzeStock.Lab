-- BUG-1: Add missing watchlist columns for paper trading sync
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'WATCHING';
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS buy_price NUMERIC;
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS stop_loss NUMERIC;
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS target_profit NUMERIC;
ALTER TABLE public.watchlist ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN public.watchlist.status IS 'WATCHING | HOLDING | EXITED';
COMMENT ON COLUMN public.watchlist.buy_price IS '자동 매수 진입가 (paper engine 동기화)';
COMMENT ON COLUMN public.watchlist.stop_loss IS '현재 트레일링 스탑선 (paper engine 실시간 동기화)';

-- BUG-2: Fix SELECT policy to expose system-inserted rows (user_id IS NULL) to all authenticated users
DROP POLICY IF EXISTS "Users can view their own watchlist" ON public.watchlist;
CREATE POLICY "Users can view their own watchlist"
ON public.watchlist FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow system (service role bypasses RLS) but also add explicit policy for UPDATE on system rows
DROP POLICY IF EXISTS "System can update watchlist" ON public.watchlist;
CREATE POLICY "System can update watchlist"
ON public.watchlist FOR UPDATE
USING (user_id IS NULL)
WITH CHECK (user_id IS NULL);

-- Allow system to delete auto-registered entries; users delete their own
DROP POLICY IF EXISTS "Users can delete their own watchlist items" ON public.watchlist;
CREATE POLICY "Users can delete their own watchlist items"
ON public.watchlist FOR DELETE
USING (auth.uid() = user_id OR user_id IS NULL);
