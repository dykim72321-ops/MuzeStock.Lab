-- 20260215000002_sync_schema_for_ai.sql
-- Synchronize DB schema with Python Engine & AI Brain requirements

-- 1. Updates for daily_discovery (AI Synthesis & Reporting)
ALTER TABLE public.daily_discovery 
ADD COLUMN IF NOT EXISTS ai_summary text,
ADD COLUMN IF NOT EXISTS dna_score int,
ADD COLUMN IF NOT EXISTS pop_probability int,
ADD COLUMN IF NOT EXISTS backtest_return numeric,
ADD COLUMN IF NOT EXISTS risk_level text;

-- 2. Updates for realtime_signals (Quant Metrics)
-- Assuming realtime_signals might not exist yet based on some logs, let's create it or update it
CREATE TABLE IF NOT EXISTS public.realtime_signals (
    ticker text PRIMARY KEY,
    price numeric,
    rsi_14 numeric,
    macd numeric,
    macd_signal numeric,
    kelly_f numeric, -- Missing Kelly Criterion result
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS for the new table
ALTER TABLE public.realtime_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read realtime_signals" ON public.realtime_signals FOR SELECT TO public USING (true);
CREATE POLICY "Allow service role full access realtime_signals" ON public.realtime_signals FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 3. Update stock_analysis_cache to match Edge Function usage
ALTER TABLE public.stock_analysis_cache
ADD COLUMN IF NOT EXISTS dna_score int,
ADD COLUMN IF NOT EXISTS pop_probability int;
