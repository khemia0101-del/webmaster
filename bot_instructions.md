# Conquistador Oil Environment Setup Instructions

Configure and verify environment variables for the Conquistador Oil repository.

## Project decisions

- Google Places is not used. Do not configure `GOOGLE_PLACES_API_KEY`.
- Codex OAuth is not used. Do not configure `CODEX_OAUTH_CLIENT_ID`, `CODEX_OAUTH_CLIENT_SECRET`, or `CODEX_OAUTH_TOKEN_URL`.
- Do not configure or run the legacy `conquistador-oil-agent` Python workflow.
- `ADMIN_USERNAME` and `ADMIN_PASSWORD` are not required.
- Do not make `/admin` publicly accessible. When admin credentials are absent, keep admin and protected routes locked or disabled.
- Ensure missing admin credentials do not cause `/api/readiness` to return HTTP 503.
- Zoho is an email provider only. Supabase is the CRM system of record.

Use the current `main` branch if PR #4 has been merged. Otherwise, use `codex/supabase-crm-integration`.

## Known non-sensitive configuration

Use these exact values:

```env
NEXT_PUBLIC_SITE_URL=https://conquistadoroil.com

SUPABASE_URL=https://qnxizmyyvhxhiwycwrod.supabase.co

ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=465
ZOHO_FROM_EMAIL=info@conquistadoroil.com
ZOHO_FROM_NAME=Conquistador Oil
PHONE_LEAD_NOTIFICATION_EMAIL=info@conquistadoroil.com
CONTRACTOR_OUTREACH_NOTIFICATION_EMAIL=info@conquistadoroil.com

PHONE_ROUTING_MIN_CONTRACTORS=3
VAPI_OUTBOUND_MODEL=gpt-5.4
VAPI_OUTBOUND_VOICE_ID=Elliot
```

Supabase reference information:

```text
Project name: conquistadoroil
Project reference: qnxizmyyvhxhiwycwrod
Project URL: https://qnxizmyyvhxhiwycwrod.supabase.co
Publishable key: sb_publishable_jIkxL4F78PAHd6UebqRYHw_0f24hOWD
```

The application intentionally performs all CRM access on the server. It does not currently consume a Supabase publishable-key environment variable.

- Do not invent `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Do not add the publishable key to Vercel unless browser-side Supabase access is deliberately implemented later.
- The project reference is CLI metadata, not an application runtime variable.
- The publishable key may be used to verify that anonymous access to CRM data is denied by RLS.

## Required sensitive production variable

Retrieve this securely from the authenticated Supabase CLI or dashboard:

```env
SUPABASE_SECRET_KEY=<server-only Supabase secret key>
```

- Never print, echo, or commit the value.
- Never prefix it with `NEXT_PUBLIC_`.
- Prefer `SUPABASE_SECRET_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` is a legacy fallback and should not also be configured.
- Add it to Vercel Production as a sensitive variable.

## Feature-specific variables

### Celina command endpoint

If the endpoint remains enabled:

```env
CELINA_COMMAND_SECRET=<secure random 64+ character secret>
```

If unused, disable or securely reject the endpoint rather than leaving it unauthenticated.

### Inbound Vapi

The inbound assistant already exists and is already attached. Do not create a
duplicate assistant or replace the phone-number assignment:

```text
Assistant name: Conquistador Inbound Lead Desk
Assistant ID: 916302c4-5313-420f-bcd8-86be365b49bb
Phone-number record ID: e9111cee-82b6-42f2-8461-be46cfa72f4a
Phone number: +1 (223) 433-9345
Server URL: https://conquistadoroil.com/api/vapi/webhook
Server header name: X-Vapi-Secret
Model: openai / gpt-5.4-mini
Voice: Vapi / Elliot
```

The saved assistant calls `save_phone_inquiry` and does not currently include
a live-transfer tool. The app stores and routes the lead internally, and the
assistant tells the caller the Revenue Desk will follow up. Do not claim that
the current assistant performs a live transfer.

This production variable must exactly match the saved assistant's
`X-Vapi-Secret` header value:

```env
VAPI_WEBHOOK_SECRET=<secure shared webhook secret>
```

Use the Vapi private key to inspect the existing assistant and phone number.
Verify their IDs, attachment, URL, header name, model, voice, tool schema, and
disabled artifact settings without printing header or key values. The Vapi
public key is not used by the server application.

### Zoho email

Required for email delivery:

```env
ZOHO_SMTP_USER=<Zoho mailbox>
ZOHO_SMTP_PASS=<Zoho app password>
```

Never use Zoho CRM or store CRM records in Zoho.

### Outbound Vapi contractor calls

Required only when outbound calling is enabled:

```env
VAPI_PRIVATE_KEY=<Vapi private server key>
VAPI_OUTBOUND_PHONE_NUMBER_ID=e9111cee-82b6-42f2-8461-be46cfa72f4a
VAPI_OUTBOUND_WEBHOOK_SECRET=<separate secure webhook secret>
```

Do not confuse:

- `VAPI_WEBHOOK_SECRET`: inbound webhook authentication
- `VAPI_OUTBOUND_WEBHOOK_SECRET`: outbound webhook authentication
- `VAPI_PRIVATE_KEY`: Vapi server API credential

The outbound app creates individual calls through Vapi's `POST /call` API. For
each call it supplies a transient assistant whose server URL is
`https://conquistadoroil.com/api/vapi/outbound/webhook` and whose
`X-Vapi-Outbound-Secret` header is populated from
`VAPI_OUTBOUND_WEBHOOK_SECRET`. Do not enter that outbound webhook in the Vapi
dashboard, and do not configure a Vapi Campaign: the current app does not use
Vapi's Campaigns feature.

### Optional Hermes integration

Only configure these when a real hosted Hermes endpoint exists:

```env
HERMES_REVENUE_DESK_WEBHOOK_URL=<real endpoint>
HERMES_REVENUE_DESK_SECRET=<matching bearer secret>
```

Do not fabricate an endpoint. If unused, leave both unset and ensure the feature reports itself as unavailable.

## Local files and Vercel

Create a gitignored root `.env.local` for local development. Do not create a Python-agent `.env`.

For Vercel:

1. Authenticate and link the correct project.
2. Inspect existing variables before changing anything.
3. Add the core and enabled feature variables to Production.
4. Do not expose the production Supabase secret to Preview by default.
5. Use a separate preview Supabase project if Preview needs database access.

Never print secrets in command output or pass them in a way that records them in shell history.

## Repository alignment

Audit the repository for environment-variable references and remove outdated requirements for Google Places, Codex OAuth, admin credentials, and the legacy Python agent where it is presented as part of the active production system.

Update `.env.example`, README documentation, and readiness checks to match these decisions. Use placeholders only. Preserve the secure behavior of protected routes; removing admin credentials must not make them public.

Ignore these Supabase `config.toml` placeholders because their providers are not used by the current application:

- `SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN`
- `SUPABASE_AUTH_EXTERNAL_APPLE_SECRET`

Do not manually configure `NODE_ENV` or `VERCEL`; the platform provides them.

## Verification

1. Confirm no secrets appear in tracked files, `git diff`, logs, or command output.
2. Run `npm install`, `npm test`, `npm run typecheck`, `npm run lint`, and `npm run build`.
3. Run `supabase projects list`, `supabase migration list --linked`, `supabase db lint --linked`, and `supabase db advisors --linked --type all --level warn --fail-on warn`.
4. Confirm the linked Supabase project reference is `qnxizmyyvhxhiwycwrod`.
5. Confirm `/api/readiness` returns HTTP 200 without requiring admin credentials and reports Supabase as connected.
6. Confirm the publishable key cannot directly read or write CRM tables.
7. Confirm protected admin routes are not publicly accessible.
8. Confirm the saved inbound assistant remains attached to phone-number record
   `e9111cee-82b6-42f2-8461-be46cfa72f4a` and that its webhook header matches
   `VAPI_WEBHOOK_SECRET`, reporting only a boolean match result.
9. Verify email and Vapi configuration without sending real email or placing real calls.

Report variable names and configuration status only. Never include sensitive values in the report.
