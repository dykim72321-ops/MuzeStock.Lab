-- Create watchlist table
CREATE TABLE IF NOT EXISTS public.watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    UNIQUE(ticker, user_id)
);

-- Set up Row Level Security (RLS)
ALTER TABLE public.watchlist ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see only their own watchlist
DROP POLICY IF EXISTS "Users can view their own watchlist" ON public.watchlist;
CREATE POLICY "Users can view their own watchlist" 
ON public.watchlist FOR SELECT 
USING (auth.uid() = user_id);

-- Policy to allow users to insert their own watchlist items
DROP POLICY IF EXISTS "Users can insert their own watchlist items" ON public.watchlist;
CREATE POLICY "Users can insert their own watchlist items" 
ON public.watchlist FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own watchlist items
DROP POLICY IF EXISTS "Users can delete their own watchlist items" ON public.watchlist;
CREATE POLICY "Users can delete their own watchlist items" 
ON public.watchlist FOR DELETE 
USING (auth.uid() = user_id);
