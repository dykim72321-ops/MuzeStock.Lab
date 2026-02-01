create table if not exists market_context (
  id uuid default gen_random_uuid() primary key,
  summary text not null,
  source_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table market_context is 'Stores daily global market and political context for AI analysis';

-- No RLS needed for now as it's read-only for public/authenticated users and written by service role
alter table market_context enable row level security;

drop policy if exists "Enable read access for all users" on market_context;
create policy "Enable read access for all users" on market_context
  for select using (true);
