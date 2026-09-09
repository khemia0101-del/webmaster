begin;

create table public.public_request_limits (
  key text primary key check (length(key) <= 100),
  hits integer not null check (hits > 0),
  resets_at timestamptz not null
);
create index public_request_limits_expiry on public.public_request_limits (resets_at);
alter table public.public_request_limits enable row level security;
revoke all on public.public_request_limits from public, anon, authenticated;
grant select, insert, update, delete on public.public_request_limits to service_role;

-- One row lock per bucket; no process-local production counters. Only hashed IPs are stored.
create function public.consume_public_request_limit(p_key text, p_limit integer, p_seconds integer)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_now timestamptz := clock_timestamp();
  v_hits integer;
  v_reset timestamptz;
begin
  if p_key is null or p_key !~ '^(leads|impressions):[0-9a-f]{64}$'
     or p_limit is null or p_limit < 1 or p_limit > 1000
     or p_seconds is null or p_seconds < 1 or p_seconds > 3600 then
    raise exception 'Invalid request limit parameters';
  end if;
  -- Bounded opportunistic cleanup; locks are skipped under concurrent traffic.
  -- Only one cleanup transaction at a time avoids cross-key cleanup deadlocks.
  if pg_try_advisory_xact_lock(20846521) then
    delete from public.public_request_limits where key in (
      select key from public.public_request_limits where resets_at < v_now - interval '1 hour'
      order by resets_at limit 100 for update skip locked
    );
  end if;
  insert into public.public_request_limits as bucket (key, hits, resets_at)
  values (p_key, 1, v_now + make_interval(secs => p_seconds))
  on conflict (key) do update set
    hits = case when bucket.resets_at <= v_now then 1 else least(bucket.hits + 1, p_limit + 1) end,
    resets_at = case when bucket.resets_at <= v_now then v_now + make_interval(secs => p_seconds) else bucket.resets_at end
  returning hits, resets_at into v_hits, v_reset;
  return jsonb_build_object('allowed', v_hits <= p_limit, 'retryAfter', greatest(1, ceil(extract(epoch from v_reset - v_now))::integer));
end;
$$;
revoke all on function public.consume_public_request_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_public_request_limit(text, integer, integer) to service_role;

commit;
