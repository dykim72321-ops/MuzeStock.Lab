-- 1. Establishing relationships for nested selects (Optional if skipping strict FK)
-- We'll skip the strict FK for ai_predictions because it contains historical data
-- for tickers that might not be in the current daily_discovery subset.
-- Code-level fallback handles this in Dashboard.tsx.

-- Ensure stock_analysis_cache references daily_discovery
ALTER TABLE public.stock_analysis_cache
DROP CONSTRAINT IF EXISTS fk_stock_analysis_cache_ticker;

ALTER TABLE public.stock_analysis_cache
ADD CONSTRAINT fk_stock_analysis_cache_ticker
FOREIGN KEY (ticker) 
REFERENCES public.daily_discovery(ticker)
ON DELETE CASCADE;

-- 2. Create the missing paper_portfolio table for Alpha Fund Performance
CREATE TABLE IF NOT EXISTS public.paper_portfolio (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ticker text NOT NULL,
    status text DEFAULT 'OPEN', -- 'OPEN' or 'CLOSED'
    entry_price numeric NOT NULL,
    current_price numeric,
    pnl_percent numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add sample data to paper_portfolio so it's not empty
INSERT INTO public.paper_portfolio (ticker, status, entry_price, current_price, pnl_percent)
VALUES 
('SNDL', 'OPEN', 1.50, 1.54, 2.67),
('FCEL', 'OPEN', 7.50, 7.75, 3.33)
ON CONFLICT DO NOTHING;

-- Enable RLS for paper_portfolio
ALTER TABLE public.paper_portfolio ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access for paper_portfolio" ON public.paper_portfolio;
CREATE POLICY "Public read access for paper_portfolio" ON public.paper_portfolio FOR SELECT TO public USING (true);
