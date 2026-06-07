# Conquistador Oil MVP

Customer-facing marketing site plus governed Hermes admin system for fuel delivery, HVAC service requests, emergency heating intake, commercial accounts, and A/B testing.

The initial build is designed for the lowest possible operating cost: no paid external API is required. Forms, A/B test events, leads, and admin records can be stored in a local JSON file on the server.

## Local Run

```powershell
cd "C:\Users\rocam\Downloads\CONQUISTADOR OIL"
.\RUN_APP.cmd
```

Open `http://localhost:3000`.

## Lowest-Cost Production Environment

Set these before deployment:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.example
DATA_DIR=.data
ADMIN_USERNAME=
ADMIN_PASSWORD=
```

Use a host with persistent disk storage if you want to keep the zero-API data mode. Good low-cost fits are a small VPS or any Node host that preserves `DATA_DIR` between deploys/restarts.

No OpenAI, Supabase, Stripe, email provider, Google, or financing API is needed for this build.

## Production Checklist

- Set all required environment variables above.
- Confirm the deployment host persists `DATA_DIR`.
- Confirm `/api/readiness` returns HTTP 200.
- Confirm `/admin` prompts for credentials in production.
- Confirm `/robots.txt` blocks `/admin` and `/api`.
- Confirm form submissions create leads and experiment conversions.
- Download `/api/export/leads` and `/api/export/store` from an authenticated admin session to confirm backups work.
- Review all public copy for legal, licensing, insurance, and service-claim accuracy before launch.

## Commands

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

## Autonomous Operations Agent

The `conquistador-oil-agent/` directory contains a separate Python pipeline that
sources local contractors (Google Places), places authorized outbound AI voice
calls (Vapi), and records every call to a local store it can learn from. It runs
independently of the website. See
[`conquistador-oil-agent/README.md`](conquistador-oil-agent/README.md) for setup,
cost, and privacy details. Run `python conquistador-oil-agent/run.py` for a free,
no-credentials mock simulation of the full pipeline.

## Notes

- Local and lowest-cost production mode uses `DATA_DIR/conquistador-store.json` when Supabase credentials are absent.
- `/admin` and `/api/approvals/*` are protected by Basic Auth when `ADMIN_USERNAME` and `ADMIN_PASSWORD` are configured.
- `/api/export/*` is also protected and provides manual CSV/JSON backup.
- Hermes A/B testing tracks impressions and form conversions, then recommends a winning variant for human review.
- `src/lib/supabase-schema.sql` is retained only as an archived future-upgrade reference. It is not used by the initial low-cost build.
