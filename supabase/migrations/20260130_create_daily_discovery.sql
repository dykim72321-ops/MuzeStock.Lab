-- 매일 갱신될 '동적 발굴 리스트' 테이블
create table if not exists daily_discovery (
  ticker text primary key,      -- 종목 코드 (중복 방지)
  price numeric,                -- 현재 가격
  volume text,                  -- 거래량 (문자열로 저장 후 가공 추천)
  change text,                  -- 등락률
  sector text,                  -- 섹터 (산업군)
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- RLS 정책: 누구나 읽을 수 있게 (로그인 없이 웹에서 보여주려면)
alter table daily_discovery enable row level security;

-- 기존 정책 삭제 (중복 방지)
drop policy if exists "Public read access" on daily_discovery;
drop policy if exists "Service role write access" on daily_discovery;
drop policy if exists "Service role update access" on daily_discovery;
drop policy if exists "Service role delete access" on daily_discovery;

-- 정책 생성
create policy "Public read access" on daily_discovery for select using (true);
create policy "Service role write access" on daily_discovery for insert with check (true);
create policy "Service role update access" on daily_discovery for update using (true);
create policy "Service role delete access" on daily_discovery for delete using (true);
