# Supabase CRM Operations

Supabase Postgres is the durable system of record for the custom Conquistador
CRM. Zoho remains the email provider; it is not used as the CRM.

## Runtime architecture

- The Next.js server is the only database client.
- `SUPABASE_SECRET_KEY` is server-only and must never use a `NEXT_PUBLIC_` prefix.
- Public forms call Next.js route handlers; browser code never writes directly
  to Supabase.
- Production refuses to fall back to the Vercel filesystem when Supabase is
  absent or partially configured.
- Local development can omit both Supabase variables to use `.data` JSON.

The schema uses separate tables for leads, customers, contractors, jobs,
documents, zones, approvals, activity, KPIs, events, learning records, and the
action queue. Frequently queried fields are typed and indexed. Each row also
keeps the complete application payload in JSONB so new intake fields can be
introduced without losing data during the CRM's early evolution.

Lead creation, generated approvals, activity, and interaction events are
committed by one Postgres function and therefore succeed or fail together.
Lead updates and approval decisions use the same transactional pattern.

## Environment variables

Required in production:

```env
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SECRET_KEY
```

The legacy `SUPABASE_SERVICE_ROLE_KEY` name is accepted as a transition
fallback, but new environments should use `SUPABASE_SECRET_KEY`.

Add both variables to Vercel Production. Add them to Preview only when preview
deployments are intentionally allowed to access the production CRM; otherwise
use a separate preview Supabase project. Never commit either key to Git.

## CLI workflow

Authenticate and link a checkout:

```powershell
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

Review and apply migrations:

```powershell
supabase db push --linked --dry-run
npm run db:push
supabase migration list --linked
```

Run schema checks:

```powershell
npm run db:lint
supabase db advisors --linked --type all --level warn --fail-on warn
supabase test db --linked supabase/tests/database
```

The pgTAP command uses a small Docker `pg_prove` runner. When Docker is not
available, the same SQL file can be executed against the linked database:

```powershell
supabase db query --linked --file supabase/tests/database/crm_security.test.sql
```

## Importing an existing JSON store

The importer is idempotent by record ID and does not delete remote records.
Standalone scripts do not automatically load `.env.local`, so provide the two
Supabase variables in the shell first.

```powershell
npm run db:import -- --file .data/conquistador-store.json
```

Use `--seed` only for an intentional demo environment:

```powershell
npm run db:import -- --seed
```

Synthetic seed contacts are never inserted automatically by migrations.

## Security model

- RLS is enabled on every CRM table in the exposed `public` schema.
- `anon` and `authenticated` have no table privileges and cannot execute CRM
  write functions.
- Only `service_role` can read, insert, update, or invoke transactional writes.
- The server role has no CRM delete grant during normal application operation.
- `crm-documents` is a private Storage bucket with a 50 MiB object limit.
- The current app does not upload documents yet; add narrowly scoped server
  endpoints before enabling that workflow.

The protected `/admin` and export routes continue to use application Basic
Auth. Supabase Auth is not exposed to the public site and can be introduced
later if individual staff accounts and per-user attribution are required.

## Health, backups, and recovery

`GET /api/health` checks process liveness. `GET /api/readiness` returns HTTP 200
only when all required production settings exist and Supabase answers a live
query; it returns HTTP 503 otherwise.

Supabase Free does not include automatic database backups. Until the project is
upgraded to Pro, export regularly with the authenticated `/api/export/store`
endpoint or `supabase db dump`, and keep the export outside Supabase. Pro adds
daily database backups, but database backups do not include Storage objects.
Back up `crm-documents` separately once document uploads are enabled.
