-- 1. Establishing relationships for nested selects to work
-- These foreign keys are required by PostgREST to perform joins via .select('*, ai_predictions(*)')

-- Ensure ai_predictions references daily_discovery
-- Note: daily_discovery.ticker is the primary key
ALTER TABLE public.ai_predictions 
DROP CONSTRAINT IF EXISTS fk_ai_predictions_ticker;

ALTER TABLE public.ai_predictions
ADD CONSTRAINT fk_ai_predictions_ticker
FOREIGN KEY (ticker) 
REFERENCES public.daily_discovery(ticker)
ON DELETE CASCADE;

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
