-- 20260215000003_extend_discovery_for_viz.sql
-- Extend daily_discovery to store full AI synthesis data for visualization

ALTER TABLE public.daily_discovery
ADD COLUMN IF NOT EXISTS matched_legend_ticker text,
ADD COLUMN IF NOT EXISTS legend_similarity numeric,
ADD COLUMN IF NOT EXISTS bull_case text[],
ADD COLUMN IF NOT EXISTS bear_case text[];

-- Update RLS if necessary (usually not needed for just adds)
