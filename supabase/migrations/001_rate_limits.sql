-- ─────────────────────────────────────────────────────────────
-- 레이트 리미팅 저장소
--
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 "Run" 하세요.
-- 실행 전까지 api/_redis.js 의 checkRateLimit 은 인메모리 폴백으로 동작하며
-- (서버리스 인스턴스 간 공유 안 됨) Vercel 로그에 경고를 남깁니다.
-- ─────────────────────────────────────────────────────────────

create table if not exists hll_rate_limits (
  key      text primary key,
  count    integer not null default 0,
  reset_at bigint  not null
);

create index if not exists hll_rate_limits_reset_idx on hll_rate_limits(reset_at);

-- 카운터를 원자적으로 증가시키고 (count, reset_at) 을 반환한다.
-- 윈도우가 지났으면 1로 초기화한다.
create or replace function incr_rate_limit(p_key text, p_window integer)
returns table (count integer, reset_at bigint)
language plpgsql
as $$
declare
  now_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  return query
  insert into hll_rate_limits as t (key, count, reset_at)
  values (p_key, 1, now_ms + p_window * 1000)
  on conflict (key) do update
    set count = case when t.reset_at <= now_ms then 1 else t.count + 1 end,
        reset_at = case when t.reset_at <= now_ms then now_ms + p_window * 1000 else t.reset_at end
  returning t.count, t.reset_at;
end;
$$;

-- 만료된 행 정리 (선택 — pg_cron 이 있으면 하루 1회 실행)
-- delete from hll_rate_limits where reset_at < (extract(epoch from now()) * 1000)::bigint;
