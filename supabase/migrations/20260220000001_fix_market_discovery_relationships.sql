-- 20260220000001_fix_market_discovery_relationships.sql
-- 1. Pre-insert missing tickers into daily_discovery to satisfy Foreign Key constraints
-- This prevents "Key (...) is not present in table daily_discovery" errors.

INSERT INTO public.daily_discovery (ticker, updated_at)
SELECT DISTINCT ticker, now()
FROM public.stock_analysis_cache
WHERE ticker NOT IN (SELECT ticker FROM public.daily_discovery)
ON CONFLICT (ticker) DO NOTHING;

INSERT INTO public.daily_discovery (ticker, updated_at)
SELECT DISTINCT ticker, now()
FROM public.ai_predictions
WHERE ticker NOT IN (SELECT ticker FROM public.daily_discovery)
ON CONFLICT (ticker) DO NOTHING;

-- 2. Add Foreign Key relationships for Nested Selects
-- Relationship: daily_discovery -> stock_analysis_cache
ALTER TABLE public.stock_analysis_cache
DROP CONSTRAINT IF EXISTS fk_stock_analysis_cache_daily_discovery,
ADD CONSTRAINT fk_stock_analysis_cache_daily_discovery
FOREIGN KEY (ticker) REFERENCES public.daily_discovery(ticker)
ON DELETE CASCADE;

-- Add FK from ai_predictions to daily_discovery
ALTER TABLE public.ai_predictions
DROP CONSTRAINT IF EXISTS fk_ai_predictions_daily_discovery,
ADD CONSTRAINT fk_ai_predictions_daily_discovery
FOREIGN KEY (ticker) REFERENCES public.daily_discovery(ticker)
ON DELETE CASCADE;

-- 3. Data Recovery: Sync missing fields in daily_discovery from stock_analysis_cache
UPDATE public.daily_discovery dd
SET 
  dna_score = COALESCE(dd.dna_score, (sac.analysis->>'dnaScore')::int),
  risk_level = COALESCE(dd.risk_level, (sac.analysis->>'riskLevel')::text),
  ai_summary = COALESCE(dd.ai_summary, (sac.analysis->>'aiSummary')::text),
  pop_probability = COALESCE(dd.pop_probability, (sac.analysis->>'popProbability')::int)
FROM public.stock_analysis_cache sac
WHERE dd.ticker = sac.ticker
AND (dd.dna_score IS NULL OR dd.risk_level IS NULL OR dd.ai_summary IS NULL);

-- 4. Notify about relationship establishment
COMMENT ON TABLE public.daily_discovery IS 'Primary table for daily stock discoveries with FK relationships to analysis and predictions.';
