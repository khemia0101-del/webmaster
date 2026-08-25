begin;

create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;

select plan(8);

select is(
  (
    select count(*)::bigint
    from information_schema.tables
    where table_schema = 'public'
      and table_name = any(array[
        'leads', 'customers', 'contractors', 'jobs', 'compliance_documents',
        'zones', 'approval_requests', 'hermes_activity', 'kpi_snapshots',
        'interaction_events', 'learning_records', 'celina_actions'
      ])
  ),
  12::bigint,
  'all CRM tables exist'
);

select ok(
  (
    select bool_and(c.relrowsecurity)
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = any(array[
        'leads', 'customers', 'contractors', 'jobs', 'compliance_documents',
        'zones', 'approval_requests', 'hermes_activity', 'kpi_snapshots',
        'interaction_events', 'learning_records', 'celina_actions'
      ])
  ),
  'RLS is enabled on every CRM table'
);

select ok(
  (
    select bool_and(not has_table_privilege('anon', format('public.%I', table_name), 'select'))
    from unnest(array[
      'leads', 'customers', 'contractors', 'jobs', 'compliance_documents',
      'zones', 'approval_requests', 'hermes_activity', 'kpi_snapshots',
      'interaction_events', 'learning_records', 'celina_actions'
    ]) as table_name
  ),
  'anonymous clients have no CRM table access'
);

select ok(
  (
    select bool_and(not has_table_privilege('authenticated', format('public.%I', table_name), 'select'))
    from unnest(array[
      'leads', 'customers', 'contractors', 'jobs', 'compliance_documents',
      'zones', 'approval_requests', 'hermes_activity', 'kpi_snapshots',
      'interaction_events', 'learning_records', 'celina_actions'
    ]) as table_name
  ),
  'signed-in clients have no direct CRM table access'
);

select ok(
  (
    select bool_and(not has_function_privilege('anon', function_name, 'execute'))
    from unnest(array[
      'public.persist_lead_bundle(jsonb,jsonb,jsonb,jsonb)',
      'public.update_lead_with_audit(text,jsonb,jsonb,jsonb)',
      'public.claim_phone_handoff(text,text,timestamp with time zone)',
      'public.claim_contractor_outreach(text,text,text,timestamp with time zone)',
      'public.decide_approval_bundle(text,text,text,text,jsonb,jsonb)'
    ]) as function_name
  ),
  'anonymous clients cannot execute CRM write functions'
);

select ok(
  (
    select bool_and(has_function_privilege('service_role', function_name, 'execute'))
    from unnest(array[
      'public.persist_lead_bundle(jsonb,jsonb,jsonb,jsonb)',
      'public.update_lead_with_audit(text,jsonb,jsonb,jsonb)',
      'public.claim_phone_handoff(text,text,timestamp with time zone)',
      'public.claim_contractor_outreach(text,text,text,timestamp with time zone)',
      'public.decide_approval_bundle(text,text,text,text,jsonb,jsonb)'
    ]) as function_name
  ),
  'the server role can execute CRM write functions'
);

select is(
  (select public from storage.buckets where id = 'crm-documents'),
  false,
  'the CRM document bucket is private'
);

select has_index(
  'public',
  'leads',
  'leads_vapi_call_id_idx',
  'Vapi call ids have a unique idempotency index'
);

select * from finish();
rollback;
