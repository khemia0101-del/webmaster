# Conquistador Oil Website

Public marketing and lead-intake website for Conquistador Oil Heating & Air Conditioning in Lancaster, Pennsylvania.

Live site: https://webmaster-mocha.vercel.app/

## What This Site Does

- Promotes heating oil delivery, HVAC service requests, emergency heating intake, commercial fuel delivery, and commercial account review.
- Captures website form leads and chat inquiries through the existing intake system.
- Routes leads toward the Conquistador Revenue Desk / Hermes workflow when configured.
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
- Optional Hermes Revenue Desk webhook
- CelinaAmenBot closed-loop learning and action queue
- Optional Zoho SMTP outbound email
- Vapi inbound phone intake with deterministic contractor routing and compact Hermes audit events

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
NEXT_PUBLIC_SITE_URL=https://YOUR_PRODUCTION_DOMAIN
ADMIN_USERNAME=YOUR_ADMIN_USERNAME
ADMIN_PASSWORD=YOUR_LONG_RANDOM_PASSWORD

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
```

`VAPI_MODEL_PROVIDER=openai`, `VAPI_MODEL=gpt-5.4-mini`, and
`PHONE_ROUTING_MIN_CONTRACTORS=3` are built-in defaults, so they do not need to
be added to Vercel unless you want to override them.

Vapi phone routing variables and connection steps are documented in [`docs/VAPI-INBOUND-SETUP.md`](docs/VAPI-INBOUND-SETUP.md). Production phone leads are sent immediately to the internal Zoho inbox and, when configured, the optional Hermes Revenue Desk webhook. There is no database-backed cron queue.

## Lead Flow

1. A visitor submits a form or chat inquiry.
2. The site saves the inquiry as a lead.
3. If Revenue Desk webhook settings are present, the lead is handed off to the Conquistador Revenue Desk.
4. If Zoho SMTP settings are present, outbound email replies can be sent from `info@conquistadoroil.com`.
5. Emergency / no-heat leads use conservative language and direct customers to call `(717) 397-9800`.

Inbound Vapi calls use a separate structured path: the assistant collects details, sends one compact lead to the internal inbox and optional Hermes webhook, and warm-transfers eligible service inquiries only when at least three vetted contractors cover the requested service and area. Other inquiries and after-hours calls are handed off for follow-up.

Forms and chat are intentionally website-intake only. There is no public booking guarantee, pricing promise, payment flow, or automatic dispatch confirmation.

## CelinaAmenBot Closed Loop

Celina's operating loop is built into the website data layer:

```text
Interact -> capture signal -> score outcome -> extract learning -> choose action -> implement or request approval -> measure result -> update policy -> repeat
```

Endpoints:

- `/api/celina/loop` returns the current revenue goal, bottleneck, learning records, and action queue.
- `/api/celina/telegram` accepts a JSON `POST` with `command` for Telegram-style commands such as `/status`, `/today`, `/learned`, `/actions`, and `/goal`.

Set `CELINA_COMMAND_SECRET` in production to require `Authorization: Bearer <secret>` for command calls.

## Deployment

Production deploy:

```powershell
C:\Users\rocam\AppData\Local\hermes\node\vercel.cmd deploy --prod --yes
```

Current production alias:

```text
https://webmaster-mocha.vercel.app/
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

- `/admin` and protected API routes use Basic Auth when `ADMIN_USERNAME` and `ADMIN_PASSWORD` are configured.
- Local JSON supports development and demos; `DATA_DIR` may override its local path. Do not set `DATA_DIR` on Vercel because deployed files are temporary and are not the durable record for production phone leads.
- `/api/export/leads` and `/api/export/store` provide authenticated backup/export paths.

## Safety Notes

Public copy avoids unsupported claims such as guaranteed response times, guaranteed dispatch, lowest pricing, or licensing/insurance claims that have not been explicitly confirmed.

For urgent heating or no-heat situations, the site directs customers to call:

```text
(717) 397-9800
```
