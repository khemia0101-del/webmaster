# Conquistador Oil Website

Public marketing and lead-intake website for Conquistador Oil Heating & Air Conditioning in Lancaster, Pennsylvania.

Live site: https://conquistadoroil.com/

## What This Site Does

- Promotes heating oil delivery, HVAC service requests, emergency heating intake, commercial fuel delivery, and commercial account review.
- Captures website form leads and chat inquiries through the existing intake system.
- Routes leads toward the Conquistador Revenue Desk / Hermes workflow when configured.
- Lets Hermes research sourced contractor candidates or accepts manual prospect entry, then provides human-approved Vapi qualification calls without recordings or transcripts.
- Includes local SEO content, service-area pages, structured data, sitemap, robots rules, and high-intent landing pages.
- Includes a careers page for CDL fuel delivery drivers and licensed, experienced HVAC technicians.

## Key Public Pages

- `/` - Homepage with local trust signals, service CTAs, mobile call bar, and placeholder service visuals.
- `/hvac-services` - HVAC, furnace, boiler, oil burner, and cooling service intake.
- `/emergency-service` - Urgent heating / no-heat intake.
- `/commercial-fuel-delivery-lancaster` - Commercial fuel delivery overview.
- `/commercial-quote` - Commercial fuel quote form.
- `/commercial-audit` - Commercial fuel and HVAC account review form.
- `/careers` - CDL driver and HVAC technician application form.
- `/service-areas` - Lancaster and Central Pennsylvania service-area content.
- `/heating-oil-delivery-lancaster-pa`
- `/furnace-repair-lancaster-pa`
- `/boiler-repair-lancaster-pa`
- `/emergency-heating-service-lancaster-pa`
- `/commercial-diesel-delivery-lancaster-pa`

## Tech Stack

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Vercel deployment
- Supabase Postgres and Storage for the durable CRM system of record
- Optional Hermes Revenue Desk webhook
- CelinaAmenBot closed-loop learning and action queue
- Optional Zoho SMTP outbound email
- Vapi inbound phone intake with deterministic contractor routing and compact Hermes audit events

The `conquistador-oil-agent` Python directory is a legacy experiment and is not
part of the active production system. Do not configure its Google Places or
Codex OAuth variables for this application.

## Local Development

```powershell
cd "C:\Users\rocam\OneDrive\Documents\webmaster"
npm.cmd install
npm.cmd run dev
```

Open:

```text
http://localhost:3000
```

## Quality Checks

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

The project uses a custom Next output directory:

```text
.next-conquistador
```

`vercel.json` is configured so Vercel uses that output directory during production deploys.

## Environment Variables

Copy `.env.example` and fill production values as needed.

```env
NEXT_PUBLIC_SITE_URL=https://conquistadoroil.com
SUPABASE_URL=https://qnxizmyyvhxhiwycwrod.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SUPABASE_SECRET

HERMES_REVENUE_DESK_WEBHOOK_URL=
HERMES_REVENUE_DESK_SECRET=
CELINA_COMMAND_SECRET=YOUR_RANDOM_64_CHARACTER_SECRET

VAPI_WEBHOOK_SECRET=YOUR_RANDOM_64_CHARACTER_SECRET

ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=465
ZOHO_SMTP_USER=YOUR_ZOHO_MAILBOX
ZOHO_SMTP_PASS=YOUR_ZOHO_APP_PASSWORD
ZOHO_FROM_EMAIL=info@conquistadoroil.com
ZOHO_FROM_NAME=Conquistador Oil
PHONE_LEAD_NOTIFICATION_EMAIL=info@conquistadoroil.com

VAPI_PRIVATE_KEY=
VAPI_OUTBOUND_PHONE_NUMBER_ID=e9111cee-82b6-42f2-8461-be46cfa72f4a
VAPI_OUTBOUND_WEBHOOK_SECRET=
CONTRACTOR_OUTREACH_NOTIFICATION_EMAIL=info@conquistadoroil.com
```

The saved inbound Vapi assistant controls its own model and voice.
`PHONE_ROUTING_MIN_CONTRACTORS=3`, `VAPI_OUTBOUND_MODEL=gpt-5.4`, and
`VAPI_OUTBOUND_VOICE_ID=Elliot` are built-in application defaults, so they do
not need to be added to Vercel unless you want to override them.

Supabase CRM setup, migrations, imports, security, and recovery are documented in [`docs/SUPABASE-CRM.md`](docs/SUPABASE-CRM.md). Vapi phone routing variables and connection steps are documented in [`docs/VAPI-INBOUND-SETUP.md`](docs/VAPI-INBOUND-SETUP.md). Production phone leads are committed to Supabase before notification delivery, then sent to the internal Zoho inbox and, when configured, the optional Hermes Revenue Desk webhook. There is no automatic delayed-call queue.

Outbound contractor discovery and qualification is documented in [`docs/VAPI-OUTBOUND-CONTRACTORS.md`](docs/VAPI-OUTBOUND-CONTRACTORS.md). It is a separate, one-prospect-at-a-time workflow: an authenticated operator asks Hermes for sourced web research or supplies a contractor manually, verifies the source and contact basis, then starts one Vapi call from `/admin/contractor-outreach`. It does not run an unattended dialer.

For each outbound call, the app dynamically injects
`https://conquistadoroil.com/api/vapi/outbound/webhook` and the
`X-Vapi-Outbound-Secret` header into a transient assistant. Nothing needs to be
entered in the Vapi dashboard for that outbound webhook. The app creates
individual calls and does not use Vapi Campaigns.

## Lead Flow

1. A visitor submits a form or chat inquiry.
2. The site atomically saves the lead, approvals, activity, and interaction events in Supabase.
3. If Revenue Desk webhook settings are present, the lead is handed off to the Conquistador Revenue Desk.
4. If Zoho SMTP settings are present, outbound email replies can be sent from `info@conquistadoroil.com`.
5. Emergency / no-heat leads use conservative language and direct customers to call `(717) 397-9800`.

Inbound Vapi calls use saved assistant `916302c4-5313-420f-bcd8-86be365b49bb`, which is attached to phone-number record `e9111cee-82b6-42f2-8461-be46cfa72f4a`. It collects structured details and sends one compact lead to the internal inbox and optional Hermes webhook for follow-up. The saved assistant does not currently include a live-transfer tool.

Forms and chat are intentionally website-intake only. There is no public booking guarantee, pricing promise, payment flow, or automatic dispatch confirmation.

## CelinaAmenBot Closed Loop

Celina's operating loop is built into the website data layer:

```text
Interact -> capture signal -> score outcome -> extract learning -> choose action -> implement or request approval -> measure result -> update policy -> repeat
```

Endpoints:

- `/api/celina/loop` returns the current revenue goal, bottleneck, learning records, and action queue.
- `/api/celina/telegram` accepts a JSON `POST` with `command` for Telegram-style commands such as `/status`, `/today`, `/learned`, `/actions`, and `/goal`.

Set `CELINA_COMMAND_SECRET` in production to enable command calls authenticated
with `Authorization: Bearer <secret>`. When it is absent, the command endpoint
rejects production requests instead of allowing anonymous access.

## Deployment

Production deploy:

```powershell
C:\Users\rocam\AppData\Local\hermes\node\vercel.cmd deploy --prod --yes
```

Production site:

```text
https://conquistadoroil.com/
```

The repo includes `.vercelignore` to keep local logs, build output, caches, and data files out of deployments.

## Content and Brand Assets

Brand assets live in:

```text
public/brand
```

Current assets include:

- `conquistador-oil-logo.png`
- `placeholder-oil-delivery.svg`
- `placeholder-hvac-service.svg`
- `placeholder-local-building.svg`

The placeholder service images are branded illustrations, not claimed real field photos. Replace them with real truck, team, building, or service photos when available.

## Admin and Data Notes

- `/admin` and protected API routes stay locked in production when admin credentials are absent. Set both `ADMIN_USERNAME` and `ADMIN_PASSWORD` only if Basic Auth access is intentionally enabled.
- Supabase is mandatory in production. The app fails closed instead of writing customer data to Vercel's temporary filesystem when credentials are missing or incomplete.
- Local JSON remains an explicit development-only fallback when neither Supabase variable is set; `DATA_DIR` may override its local path.
- The server secret is never exposed to browser code. Anonymous and authenticated Data API roles have no CRM table or write-function privileges, and every exposed CRM table has RLS enabled.
- `/api/readiness` verifies both required environment variables and a live Supabase query. `/api/health` remains a lightweight liveness endpoint.
- `/api/export/leads` and `/api/export/store` provide authenticated backup/export paths.

## Safety Notes

Public copy avoids unsupported claims such as guaranteed response times, guaranteed dispatch, lowest pricing, or licensing/insurance claims that have not been explicitly confirmed.

For urgent heating or no-heat situations, the site directs customers to call:

```text
(717) 397-9800
```
