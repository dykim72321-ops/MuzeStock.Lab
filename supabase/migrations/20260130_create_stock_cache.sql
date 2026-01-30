-- Stock Data Cache Table
-- Caches Alpha Vantage responses to reduce API calls

CREATE TABLE IF NOT EXISTS stock_cache (
    id SERIAL PRIMARY KEY,
    ticker VARCHAR(10) NOT NULL UNIQUE,
    quote_data JSONB,
    overview_data JSONB,
    sentiment_data JSONB,
    institutional_data JSONB,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast ticker lookup
CREATE INDEX IF NOT EXISTS idx_stock_cache_ticker ON stock_cache(ticker);

-- Index for cache freshness check
CREATE INDEX IF NOT EXISTS idx_stock_cache_updated ON stock_cache(updated_at);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_stock_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update timestamp
DROP TRIGGER IF EXISTS stock_cache_update_trigger ON stock_cache;
CREATE TRIGGER stock_cache_update_trigger
    BEFORE UPDATE ON stock_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_cache_timestamp();

-- Enable RLS but allow public read (data is not sensitive)
ALTER TABLE stock_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON stock_cache
    FOR SELECT USING (true);

CREATE POLICY "Allow service role write access" ON stock_cache
    FOR ALL USING (auth.role() = 'service_role');
