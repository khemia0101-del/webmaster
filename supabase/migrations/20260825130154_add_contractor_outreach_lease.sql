create or replace function public.claim_contractor_outreach(
  p_id text,
  p_call_id text,
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
      '{details,outreachDeliveryClaim}',
      jsonb_build_object('token', p_token, 'claimedAt', p_claimed_at),
      true
    ),
    updated_at = now()
  where id = p_id
    and coalesce(data #>> '{details,vapiCallId}', p_call_id) = p_call_id
    and not (
      data #>> '{details,outreachDeliveryCompletedAt}' is not null
      and data #>> '{details,outreachDeliverySucceeded}' = 'true'
    )
    and (
      data #> '{details,outreachDeliveryClaim}' is null
      or (data #>> '{details,outreachDeliveryClaim,claimedAt}')::timestamptz < now() - interval '5 minutes'
    )
  returning data into v_lead;

  return v_lead;
end;
$$;

revoke execute on function public.claim_contractor_outreach(text, text, text, timestamptz)
from public, anon, authenticated;
grant execute on function public.claim_contractor_outreach(text, text, text, timestamptz) to service_role;
