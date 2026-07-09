-- ─────────────────────────────────────────────────────────────
-- 감사 로그 (api/_redis.js writeAuditLog)
--
-- 없으면 등급 변경·결제 이력이 아무 데도 남지 않는다.
-- supaReq 가 404 를 null 로 삼켜서 조용히 실패한다.
-- ─────────────────────────────────────────────────────────────
-- 롤백: drop table if exists hll_audit_logs;

create table if not exists hll_audit_logs (
  id         bigserial primary key,
  actor      text,
  action     text,
  target     text,
  detail     jsonb,
  created_at bigint
);

create index if not exists hll_audit_logs_actor_idx  on hll_audit_logs(actor);
create index if not exists hll_audit_logs_action_idx on hll_audit_logs(action);
