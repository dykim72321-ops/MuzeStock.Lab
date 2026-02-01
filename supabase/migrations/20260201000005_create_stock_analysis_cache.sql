-- 20260201000005_create_stock_analysis_cache.sql
create table if not exists public.stock_analysis_cache (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  analysis jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index for faster lookup
create index if not exists idx_stock_analysis_cache_ticker on public.stock_analysis_cache (ticker);

-- RLS
alter table public.stock_analysis_cache enable row level security;

-- Policies
create policy "Public read access" on public.stock_analysis_cache for select using (true);
create policy "Service role insert/update" on public.stock_analysis_cache for all using (true);

-- Maintenance: Utility to delete old cache (Optional, can be triggered by Cron)
-- For MVP, we'll just check timestamps in the Edge Function.
