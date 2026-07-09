-- ─────────────────────────────────────────────────────────────
-- 결제 크레딧 적립을 원자적·멱등적으로 처리한다.
--
-- 왜 필요한가:
--   api/credits.js 는 적립 "전에" credits_added=0 으로 이벤트를 먼저 기록했다.
--   그 사이에 토스 웹훅이 도착하면 api/webhooks/toss.js 가
--     if (status === "DONE" && !existing?.credits_added && ...)
--   에서 "아직 적립 안 됨"으로 판단해 크레딧을 한 번 더 넣는다.
--   두 경로가 각자 조회 → 판단 → 갱신을 하는 한 경쟁 조건은 없앨 수 없다.
--
-- 이 함수는 payment_key 를 PK 로 하는 행의 잠금을 이용해
-- "이벤트 기록 + 크레딧 적립"을 한 트랜잭션으로 묶는다.
-- 두 번째 호출은 applied=false 를 받고 아무것도 하지 않는다.
--
-- 반환: { "applied": bool, "balance": int }
--   applied=true  → 이번 호출이 적립했다
--   applied=false → 이미 적립되어 있었다 (멱등)
--   HTTP 오류/예외 → 호출부에서 null 을 받는다. 적립되지 않았다는 뜻.
-- ─────────────────────────────────────────────────────────────
-- 롤백: drop function if exists apply_payment_credits(text,text,text,bigint,bigint,text,text,jsonb);

create or replace function apply_payment_credits(
  p_payment_key text,
  p_order_id    text,
  p_email       text,
  p_amount      bigint,
  p_credits     bigint,
  p_status      text,
  p_event       text,
  p_raw         jsonb
) returns json
language plpgsql
as $$
declare
  v_claimed boolean;
  v_balance integer;
  now_ms bigint := (extract(epoch from clock_timestamp()) * 1000)::bigint;
begin
  if p_credits is null or p_credits <= 0 then
    raise exception 'p_credits must be positive';
  end if;

  -- 아직 적립되지 않은 경우에만 이 행을 "선점"한다.
  -- 동일 payment_key 로 동시에 들어오면 PK 잠금으로 직렬화되고, 둘 중 하나만 선점한다.
  insert into hll_payment_events as e
    (payment_key, order_id, email, amount, status, event, credits_added, raw, created_at)
  values
    (p_payment_key, p_order_id, p_email, p_amount, p_status, p_event, p_credits, p_raw, now_ms)
  on conflict (payment_key) do update
    set order_id      = coalesce(p_order_id, e.order_id),
        email         = coalesce(p_email, e.email),
        amount        = coalesce(p_amount, e.amount),
        status        = p_status,
        event         = p_event,
        raw           = p_raw,
        credits_added = p_credits
    where e.credits_added = 0          -- ← 이미 적립됐으면 갱신하지 않는다
  returning true into v_claimed;

  if v_claimed is null then
    -- 선점 실패 = 이미 적립됨
    select credits into v_balance from hll_users where email = p_email;
    return json_build_object('applied', false, 'balance', v_balance);
  end if;

  update hll_users
     set credits = coalesce(credits, 0) + p_credits
   where email = p_email
  returning credits into v_balance;

  if not found then
    -- 사용자 행이 없으면 이벤트 기록도 함께 롤백된다 (같은 트랜잭션)
    raise exception 'user not found: %', p_email;
  end if;

  return json_build_object('applied', true, 'balance', v_balance);
end;
$$;
