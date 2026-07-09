-- ─────────────────────────────────────────────────────────────
-- ⚠️ 토스페이먼츠를 켜기 전에 반드시 먼저 실행할 것.
--
-- 이 테이블이 없으면 api/webhooks/toss.js 의 중복 방지 조건
--   if (status === "DONE" && !existing?.credits_added && pkg && email)
-- 에서 existing 이 항상 null 이라 조건이 항상 참이 된다.
-- 즉 /api/credits 가 이미 적립한 뒤 웹훅이 한 번 더 적립한다 (크레딧 이중 지급).
--
-- 현재는 TOSS_SECRET_KEY 미설정이라 웹훅이 결제 검증 단계에서 막히므로 안전하다.
-- 토스를 붙이는 시점에 이 파일부터 실행하고, 그다음 웹훅을 등록할 것.
-- ─────────────────────────────────────────────────────────────
-- 롤백: drop table if exists hll_payment_events;

create table if not exists hll_payment_events (
  payment_key   text primary key,
  order_id      text,
  email         text,
  amount        bigint,
  status        text,
  event         text,
  credits_added bigint default 0,
  raw           jsonb,
  created_at    bigint
);

create index if not exists hll_payment_events_email_idx on hll_payment_events(email);
create index if not exists hll_payment_events_order_idx on hll_payment_events(order_id);
