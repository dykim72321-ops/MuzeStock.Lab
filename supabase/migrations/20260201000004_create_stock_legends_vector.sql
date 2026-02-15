-- 20260201000004_create_stock_legends_vector.sql
-- Enable the "vector" extension to work with embeddings
create extension if not exists vector;

-- Create the stock_legends table
create table if not exists public.stock_legends (
  id uuid primary key default gen_random_uuid(),
  ticker text not null,
  name text not null,
  period text not null, -- e.g., "Jan 2021"
  description text not null, -- Technical & Contextual description
  metrics jsonb, -- { "relVol": 10.5, "shortInterest": 140, "rsi": 85, ... }
  embedding vector(1536), -- OpenAI text-embedding-3-small
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Index for vector similarity search (using HNSW for better performance and memory efficiency)
create index on public.stock_legends using hnsw (embedding vector_cosine_ops);

-- Search function for cosine similarity
create or replace function match_stock_patterns (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  ticker text,
  name text,
  period text,
  description text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    stock_legends.id,
    stock_legends.ticker,
    stock_legends.name,
    stock_legends.period,
    stock_legends.description,
    1 - (stock_legends.embedding <=> query_embedding) as similarity
  from stock_legends
  where 1 - (stock_legends.embedding <=> query_embedding) > match_threshold
  order by stock_legends.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- Seed Data (Initial Legends without embeddings - will be updated via Edge Function)
insert into public.stock_legends (ticker, name, period, description, metrics)
values 
('GME', 'GameStop Corp.', 'Jan 2021', 'The ultimate short squeeze. Characterized by 140% short interest, massive retail frenzy on Reddit/WallStreetBets, extreme relative volume (15x+), and over 1800% price gain in 15 days.', '{"shortInterest": 140, "relVol": 15.0, "gain15d": 1800}'),

('AMC', 'AMC Entertainment', 'Jun 2021', 'Meme stock rally driven by high short interest (80%) and social media coordination. Seen massive volume spikes and a 400% rally in 8 days.', '{"shortInterest": 80, "relVol": 10.0, "gain8d": 400}'),

('NVDA', 'NVIDIA Corporation', '2023-2024', 'AI paradigm shift leader. Sustained bullish momentum driven by 90% AI chip market share and exponential earnings growth (EPS +288%). High institutional demand and consistent Relative Strength.', '{"epsGrowth": 288, "revenueGrowth": 126, "trend": "sustained_bullish"}'),

('TSLA', 'Tesla, Inc.', '2020', 'Massive momentum rally fueled by high relative volume (15x avg), public participation, and index inclusion anticipation. Extreme trading activity where 30% of float traded in a single day.', '{"relVol": 15.0, "floatTradedRatio": 0.3}'),

('ZOM', 'Zomedica Corp.', 'Jan 2021', 'Penny stock momentum classic. 250% rally in few days on social media hype and "accelerometer" 수급 signal. High relative volume in a sub-$1 stock.', '{"price": 0.5, "gain3d": 250, "category": "penny_momentum"}');
