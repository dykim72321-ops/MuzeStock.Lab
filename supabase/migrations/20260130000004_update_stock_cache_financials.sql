-- Update stock_cache table to include cash flow and balance sheet data
ALTER TABLE public.stock_cache 
ADD COLUMN IF NOT EXISTS cash_flow_data JSONB,
ADD COLUMN IF NOT EXISTS balance_sheet_data JSONB;

-- Update the comment to reflect the changes
COMMENT ON TABLE public.stock_cache IS 'Caches Alpha Vantage responses including quotes, overview, sentiment, institutional, cash flow, and balance sheet data.';
