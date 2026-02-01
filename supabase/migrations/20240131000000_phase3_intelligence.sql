-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- 1. MARKET PATTERNS TABLE (For RAG)
-- Stores historical events (e.g., "GameStop Short Squeeze 2021") with their embeddings
create table if not exists market_patterns (
  id bigint primary key generated always as identity,
  event_name text not null,
  description text not null, -- "Massive retail volume spike with high short interest..."
  embedding vector(1536), -- OpenAI Ada-002 dimension
  metadata jsonb -- { "ticker": "GME", "year": 2021, "outcome": "100x gain" }
);

-- Function to search for similar market patterns
create or replace function match_market_patterns (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  id bigint,
  event_name text,
  description text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    market_patterns.id,
    market_patterns.event_name,
    market_patterns.description,
    market_patterns.metadata,
    1 - (market_patterns.embedding <=> query_embedding) as similarity
  from market_patterns
  where 1 - (market_patterns.embedding <=> query_embedding) > match_threshold
  order by market_patterns.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 2. AI PREDICTIONS TABLE (For Backtesting)
-- Stores every analysis made by the bot to verify later
create table if not exists ai_predictions (
  id uuid default gen_random_uuid() primary key,
  ticker text not null,
  analysis_date timestamp with time zone default now(),
  persona_used text not null, -- "Explosive Hunter", "Skeptical Auditor"...
  dna_score int not null,
  predicted_direction text, -- "BULLISH", "BEARISH"
  start_price numeric,
  
  -- Fields to be filled by access-performance bot later
  checked_at timestamp with time zone,
  price_7d numeric,
  accuracy_score float, -- 0.0 to 1.0
  is_correct boolean
);

-- 3. PERSONA PERFORMANCE (For Reinforcement Learning)
-- Tracks which persona is accurate in current market
create table if not exists persona_performance (
  persona_name text primary key,
  total_predictions int default 0,
  correct_predictions int default 0,
  win_rate float generated always as (correct_predictions::float / nullif(total_predictions, 0)) stored
);
