create or replace function public.claim_phone_handoff(
  p_id text,
  p_token text,
  p_claimed_at timestamptz
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lead jsonb;
begin
  update public.leads
  set
    data = jsonb_set(
      data,
      '{phoneRouting,handoffClaim}',
      jsonb_build_object('token', p_token, 'claimedAt', p_claimed_at),
      true
    ),
    updated_at = now()
  where id = p_id
    and data #> '{phoneRouting,handoffResult}' is null
    and (
      data #> '{phoneRouting,handoffClaim}' is null
      or (data #>> '{phoneRouting,handoffClaim,claimedAt}')::timestamptz < now() - interval '5 minutes'
    )
  returning data into v_lead;

  return v_lead;
end;
$$;

revoke execute on function public.claim_phone_handoff(text, text, timestamptz)
from public, anon, authenticated;
grant execute on function public.claim_phone_handoff(text, text, timestamptz) to service_role;
