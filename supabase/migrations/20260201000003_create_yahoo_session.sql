-- Create Yahoo Session table for cross-instance session sharing
CREATE TABLE IF NOT EXISTS yahoo_session (
  id TEXT PRIMARY KEY DEFAULT 'global',
  cookie TEXT NOT NULL,
  crumb TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allow Edge Functions to read/write
ALTER TABLE yahoo_session ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if any, then create
DROP POLICY IF EXISTS "Enable all for service role" ON yahoo_session;
CREATE POLICY "Enable all for service role" ON yahoo_session
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_yahoo_session_updated ON yahoo_session(updated_at);

