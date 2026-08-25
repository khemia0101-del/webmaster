create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table public.leads (
  id text primary key,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  source text not null,
  lead_type text not null check (lead_type in (
    'emergency', 'commercial_audit', 'contractor', 'commercial_quote',
    'fuel', 'property_manager', 'hiring', 'other'
  )),
  status text not null,
  name text not null,
  company text,
  phone text not null default '',
  email text,
  vapi_call_id text,
  safety_critical boolean not null default false,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id)
);

create unique index leads_vapi_call_id_idx on public.leads (vapi_call_id)
where vapi_call_id is not null;
create index leads_created_at_idx on public.leads (created_at desc);
create index leads_status_created_at_idx on public.leads (status, created_at desc);
create index leads_type_created_at_idx on public.leads (lead_type, created_at desc);
create index leads_email_idx on public.leads (lower(email)) where email is not null;
create index leads_phone_idx on public.leads (phone) where phone <> '';

create table public.customers (
  id text primary key,
  name text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id)
);

create index customers_name_idx on public.customers (lower(name));

create table public.contractors (
  id text primary key,
  company text not null,
  status text not null check (status in ('vetting', 'signed', 'setup', 'test', 'active', 'blocked')),
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id)
);

create index contractors_status_company_idx on public.contractors (status, company);

create table public.jobs (
  id text primary key,
  customer_id text not null references public.customers(id) on delete restrict,
  contractor_id text references public.contractors(id) on delete restrict,
  status text not null,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id)
);

create index jobs_customer_id_idx on public.jobs (customer_id);
create index jobs_contractor_id_idx on public.jobs (contractor_id) where contractor_id is not null;
create index jobs_status_idx on public.jobs (status);

create table public.compliance_documents (
  id text primary key,
  contractor_id text not null references public.contractors(id) on delete restrict,
  status text not null check (status in ('missing', 'received', 'verified', 'expired')),
  expires_at date,
  storage_path text,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id)
);

create index compliance_documents_contractor_id_idx on public.compliance_documents (contractor_id);
create index compliance_documents_expiring_idx on public.compliance_documents (expires_at)
where status in ('received', 'verified') and expires_at is not null;

create table public.zones (
  id text primary key,
  name text not null,
  trade text not null,
  status text not null check (status in ('Red', 'Yellow', 'Green', 'Gold')),
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id),
  unique (name, trade)
);

create table public.approval_requests (
  id text primary key,
  created_at timestamptz not null,
  updated_at timestamptz not null default now(),
  status text not null check (status in ('pending', 'approved', 'rejected')),
  risk_level text not null check (risk_level in ('low', 'medium', 'high', 'critical')),
  related_record_id text,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id)
);

create index approval_requests_status_created_at_idx
on public.approval_requests (status, created_at desc);
create index approval_requests_related_record_id_idx
on public.approval_requests (related_record_id) where related_record_id is not null;

create table public.hermes_activity (
  id text primary key,
  created_at timestamptz not null,
  related_record_id text,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id)
);

create index hermes_activity_created_at_idx on public.hermes_activity (created_at desc);
create index hermes_activity_related_record_id_idx
on public.hermes_activity (related_record_id) where related_record_id is not null;

create table public.kpi_snapshots (
  id text primary key,
  created_at timestamptz not null,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id)
);

create index kpi_snapshots_created_at_idx on public.kpi_snapshots (created_at desc);

create table public.interaction_events (
  id text primary key,
  created_at timestamptz not null,
  kind text not null,
  source text not null,
  lead_id text references public.leads(id) on delete set null,
  customer_id text references public.customers(id) on delete set null,
  job_id text references public.jobs(id) on delete set null,
  contractor_id text references public.contractors(id) on delete set null,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id)
);

create index interaction_events_created_at_idx on public.interaction_events (created_at desc);
create index interaction_events_kind_created_at_idx on public.interaction_events (kind, created_at desc);
create index interaction_events_lead_id_idx on public.interaction_events (lead_id) where lead_id is not null;
create index interaction_events_customer_id_idx on public.interaction_events (customer_id) where customer_id is not null;
create index interaction_events_job_id_idx on public.interaction_events (job_id) where job_id is not null;
create index interaction_events_contractor_id_idx on public.interaction_events (contractor_id) where contractor_id is not null;

create table public.learning_records (
  id text primary key,
  created_at timestamptz not null,
  action_status text not null check (action_status in (
    'auto_now', 'approval_required', 'observe_more', 'blocked', 'implemented'
  )),
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id)
);

create index learning_records_created_at_idx on public.learning_records (created_at desc);

create table public.celina_actions (
  id text primary key,
  created_at timestamptz not null,
  status text not null check (status in (
    'auto_now', 'approval_required', 'observe_more', 'blocked', 'implemented'
  )),
  learning_record_id text references public.learning_records(id) on delete set null,
  data jsonb not null check (jsonb_typeof(data) = 'object' and data ->> 'id' = id)
);

create index celina_actions_status_created_at_idx on public.celina_actions (status, created_at desc);
create index celina_actions_learning_record_id_idx
on public.celina_actions (learning_record_id) where learning_record_id is not null;

insert into storage.buckets (id, name, public, file_size_limit)
values ('crm-documents', 'crm-documents', false, 52428800)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create or replace function public.persist_lead_bundle(
  p_lead jsonb,
  p_approvals jsonb default '[]'::jsonb,
  p_activity jsonb default '[]'::jsonb,
  p_events jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_lead jsonb;
  v_inserted boolean := false;
  v_vapi_call_id text := p_lead #>> '{phoneRouting,vapiCallId}';
begin
  insert into public.leads (
    id, created_at, source, lead_type, status, name, company, phone, email,
    vapi_call_id, safety_critical, data
  ) values (
    p_lead ->> 'id',
    (p_lead ->> 'createdAt')::timestamptz,
    p_lead ->> 'source',
    p_lead ->> 'type',
    p_lead ->> 'status',
    p_lead ->> 'name',
    p_lead ->> 'company',
    coalesce(p_lead ->> 'phone', ''),
    p_lead ->> 'email',
    v_vapi_call_id,
    coalesce((p_lead ->> 'safetyCritical')::boolean, false),
    p_lead
  )
  on conflict do nothing
  returning data into v_lead;

  v_inserted := found;

  if not v_inserted and v_vapi_call_id is not null then
    select data into v_lead
    from public.leads
    where vapi_call_id = v_vapi_call_id;
  end if;

  if v_lead is null then
    select data into v_lead
    from public.leads
    where id = p_lead ->> 'id';
  end if;

  if v_inserted then
    insert into public.approval_requests (
      id, created_at, status, risk_level, related_record_id, data
    )
    select
      item ->> 'id',
      (item ->> 'createdAt')::timestamptz,
      item ->> 'status',
      item ->> 'riskLevel',
      item ->> 'relatedRecordId',
      item
    from jsonb_array_elements(coalesce(p_approvals, '[]'::jsonb)) as item
    on conflict (id) do nothing;

    insert into public.hermes_activity (id, created_at, related_record_id, data)
    select
      item ->> 'id',
      (item ->> 'createdAt')::timestamptz,
      item ->> 'relatedRecordId',
      item
    from jsonb_array_elements(coalesce(p_activity, '[]'::jsonb)) as item
    on conflict (id) do nothing;

    insert into public.interaction_events (
      id, created_at, kind, source, lead_id, customer_id, job_id, contractor_id, data
    )
    select
      item ->> 'id',
      (item ->> 'createdAt')::timestamptz,
      item ->> 'kind',
      item ->> 'source',
      item ->> 'leadId',
      item ->> 'customerId',
      item ->> 'jobId',
      item ->> 'contractorId',
      item
    from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) as item
    on conflict (id) do nothing;
  end if;

  return v_lead;
end;
$$;

create or replace function public.update_lead_with_audit(
  p_id text,
  p_patch jsonb,
  p_activity jsonb default '[]'::jsonb,
  p_events jsonb default '[]'::jsonb
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
    data = data || p_patch,
    updated_at = now(),
    status = case when p_patch ? 'status' then p_patch ->> 'status' else status end,
    name = case when p_patch ? 'name' then p_patch ->> 'name' else name end,
    company = case when p_patch ? 'company' then p_patch ->> 'company' else company end,
    phone = case when p_patch ? 'phone' then coalesce(p_patch ->> 'phone', '') else phone end,
    email = case when p_patch ? 'email' then p_patch ->> 'email' else email end,
    safety_critical = case
      when p_patch ? 'safetyCritical' then (p_patch ->> 'safetyCritical')::boolean
      else safety_critical
    end,
    vapi_call_id = case
      when p_patch ? 'phoneRouting' then p_patch #>> '{phoneRouting,vapiCallId}'
      else vapi_call_id
    end
  where id = p_id
  returning data into v_lead;

  if v_lead is null then
    raise exception 'Lead % was not found.', p_id using errcode = 'P0002';
  end if;

  insert into public.hermes_activity (id, created_at, related_record_id, data)
  select
    item ->> 'id',
    (item ->> 'createdAt')::timestamptz,
    item ->> 'relatedRecordId',
    item
  from jsonb_array_elements(coalesce(p_activity, '[]'::jsonb)) as item
  on conflict (id) do nothing;

  insert into public.interaction_events (
    id, created_at, kind, source, lead_id, customer_id, job_id, contractor_id, data
  )
  select
    item ->> 'id',
    (item ->> 'createdAt')::timestamptz,
    item ->> 'kind',
    item ->> 'source',
    item ->> 'leadId',
    item ->> 'customerId',
    item ->> 'jobId',
    item ->> 'contractorId',
    item
  from jsonb_array_elements(coalesce(p_events, '[]'::jsonb)) as item
  on conflict (id) do nothing;

  return v_lead;
end;
$$;

create or replace function public.decide_approval_bundle(
  p_id text,
  p_decision text,
  p_note text,
  p_decided_by text,
  p_activity jsonb,
  p_event jsonb
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_updated_id text;
begin
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Invalid approval decision.' using errcode = '22023';
  end if;

  update public.approval_requests
  set
    status = p_decision,
    updated_at = now(),
    data = data || jsonb_build_object(
      'status', p_decision,
      'decidedAt', now(),
      'decisionNote', coalesce(p_note, ''),
      'decidedBy', coalesce(p_decided_by, 'Operator')
    )
  where id = p_id and status = 'pending'
  returning id into v_updated_id;

  if v_updated_id is null then
    return false;
  end if;

  insert into public.hermes_activity (id, created_at, related_record_id, data)
  values (
    p_activity ->> 'id',
    (p_activity ->> 'createdAt')::timestamptz,
    p_activity ->> 'relatedRecordId',
    p_activity
  )
  on conflict (id) do nothing;

  insert into public.interaction_events (
    id, created_at, kind, source, lead_id, customer_id, job_id, contractor_id, data
  ) values (
    p_event ->> 'id',
    (p_event ->> 'createdAt')::timestamptz,
    p_event ->> 'kind',
    p_event ->> 'source',
    p_event ->> 'leadId',
    p_event ->> 'customerId',
    p_event ->> 'jobId',
    p_event ->> 'contractorId',
    p_event
  )
  on conflict (id) do nothing;

  return true;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'leads', 'customers', 'contractors', 'jobs', 'compliance_documents',
    'zones', 'approval_requests', 'hermes_activity', 'kpi_snapshots',
    'interaction_events', 'learning_records', 'celina_actions'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('revoke all on table public.%I from anon, authenticated', table_name);
    execute format('grant select, insert, update on table public.%I to service_role', table_name);
  end loop;
end;
$$;

revoke execute on function public.persist_lead_bundle(jsonb, jsonb, jsonb, jsonb)
from public, anon, authenticated;
revoke execute on function public.update_lead_with_audit(text, jsonb, jsonb, jsonb)
from public, anon, authenticated;
revoke execute on function public.decide_approval_bundle(text, text, text, text, jsonb, jsonb)
from public, anon, authenticated;

grant execute on function public.persist_lead_bundle(jsonb, jsonb, jsonb, jsonb) to service_role;
grant execute on function public.update_lead_with_audit(text, jsonb, jsonb, jsonb) to service_role;
grant execute on function public.decide_approval_bundle(text, text, text, text, jsonb, jsonb) to service_role;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;
