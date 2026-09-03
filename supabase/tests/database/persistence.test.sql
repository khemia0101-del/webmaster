begin;
create extension if not exists pgtap with schema extensions;
set local search_path = extensions, public;
select plan(5);
select is(public.persist_lead_bundle('{"id":"test-bundle","createdAt":"2026-09-03T00:00:00Z","source":"Website","type":"other","status":"new","name":"Synthetic","phone":"7175550100"}'::jsonb)->>'id', 'test-bundle', 'bundle returns saved lead');
select is(public.persist_lead_bundle('{"id":"test-bundle","createdAt":"2026-09-03T00:00:00Z","source":"Website","type":"other","status":"new","name":"Overwrite attempt"}'::jsonb)->>'name', 'Synthetic', 'same ID retry preserves original record');
select is((select count(*) from public.leads where id = 'test-bundle'), 1::bigint, 'retry does not duplicate lead');
select throws_ok($$select public.persist_lead_bundle(
  '{"id":"test-rollback","createdAt":"2026-09-03T00:00:00Z","source":"Website","type":"other","status":"new","name":"Synthetic"}'::jsonb,
  '[]'::jsonb, '[]'::jsonb,
  '[{"id":"test-invalid-event","createdAt":"invalid timestamp","kind":"form_submitted","source":"Website"}]'::jsonb
)$$, '22007', null, 'invalid audit event fails whole transaction');
select is((select count(*) from public.leads where id = 'test-rollback'), 0::bigint, 'failed bundle leaves no orphan lead');
select * from finish();
rollback;
