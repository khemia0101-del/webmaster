# Vapi inbound lead desk

The app exposes a secured Vapi webhook at `/api/vapi/webhook`. It returns a
transient English-only assistant, accepts one structured lead tool call, ranks
eligible contractors, and immediately sends a compact lead to the internal
Zoho inbox. A hosted Hermes / Conquistador Revenue Desk webhook can receive the
same compact handoff when one is available.

No call recording, Vapi logging, full message history, or stored transcript is
enabled. Hermes receives confirmed fields and a short summary, not the raw call.

## Merge and preview deployment

PR #2 does not require any environment variables to compile, test, or create a
Vercel preview. Missing runtime integrations remain inactive.

## Production environment before live phone calls

Add these values to Vercel before attaching the live Vapi number:

```env
NEXT_PUBLIC_SITE_URL=https://YOUR_PRODUCTION_DOMAIN

VAPI_WEBHOOK_SECRET=YOUR_RANDOM_64_CHARACTER_SECRET

ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=465
ZOHO_SMTP_USER=YOUR_ZOHO_MAILBOX
ZOHO_SMTP_PASS=YOUR_ZOHO_APP_PASSWORD
ZOHO_FROM_EMAIL=info@conquistadoroil.com
ZOHO_FROM_NAME=Conquistador Oil
PHONE_LEAD_NOTIFICATION_EMAIL=info@conquistadoroil.com

# Optional; leave blank until a real hosted Hermes endpoint exists.
HERMES_REVENUE_DESK_WEBHOOK_URL=
HERMES_REVENUE_DESK_SECRET=
```

The app already defaults to `openai`, `gpt-5.4-mini`, and a three-contractor
activation threshold. Their override variables do not need to be added.

`VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID`, `CRON_SECRET`, and database variables
are not needed by this inbound-only implementation.

## Connect Vapi later

1. Deploy the app and set the production variables above.
2. Configure the Vapi phone number with no fixed assistant.
3. Set the phone number server URL to:

   `https://YOUR_PRODUCTION_DOMAIN/api/vapi/webhook`

4. Configure that server request to send the exact `VAPI_WEBHOOK_SECRET` value
   in either `Authorization: Bearer <secret>` or `X-Vapi-Secret: <secret>`.

If the dashboard only shows Vapi public/private API keys, that is expected.
Those keys authenticate calls to Vapi's API; they are not the webhook secret.
The phone number's `server.headers` can be configured during the later number
integration using the Vapi API and the private key. Do not expose the private
key in client code or reuse it as `VAPI_WEBHOOK_SECRET`.

With no fixed assistant, Vapi sends an `assistant-request` and the app returns
the controlled transient assistant.

The public website number remains unchanged until the Vapi number is ready.

## Lead durability without a database

Vercel function files are temporary. The local JSON store is therefore only for
development and best-effort admin visibility.

For production phone calls, the durable no-database record is the email sent to
`PHONE_LEAD_NOTIFICATION_EMAIL`. If `HERMES_REVENUE_DESK_WEBHOOK_URL` is also
configured, it receives the same compact lead. The phone tool reports success
after at least one of those handoffs succeeds. The payload contains:

- caller name and callback details;
- inquiry category and requested service;
- service address or area;
- a caller-confirmed summary of at most 240 characters;
- urgency and sharing consent;
- compact routing status.

It does not contain a transcript, recording URL, complete message history, or
raw Vapi artifact.

There is intentionally no Vercel cron or delayed queue. Outside contractor
hours, the lead inbox receives the inquiry immediately for follow-up. A hosted
Hermes endpoint can over-watch the same event later. Automatic delayed
contractor calls should be added only after the contractor system has a real
durable datastore or queue.

## Contractor routing data

Automatic live transfer remains off for a service and area until at least three
eligible contractors exist. Each contractor must be active, verified, free of
missing documents, match the requested trade and zone, and contain a routing
profile similar to:

```json
{
  "phoneNumber": "+17175550100",
  "timeZone": "America/New_York",
  "acceptingLeads": true,
  "postalCode": "17602",
  "latitude": 40.0379,
  "longitude": -76.3055,
  "priority": 50,
  "businessHours": {
    "mon": [{ "open": "08:00", "close": "17:00" }],
    "tue": [{ "open": "08:00", "close": "17:00" }],
    "wed": [{ "open": "08:00", "close": "17:00" }],
    "thu": [{ "open": "08:00", "close": "17:00" }],
    "fri": [{ "open": "08:00", "close": "17:00" }]
  }
}
```

The score is 50% proximity, 20% reliability, 15% service fit, 10% workload
rotation, and 5% configured priority. Up to three eligible open destinations
are returned for a live transfer attempt.

## Guardrails

- Service details are shared only after the caller grants permission.
- Billing, careers, supplier, complaint, and other calls are logged without a
  contractor transfer.
- The assistant never quotes, books, promises dispatch, or accepts payment.
- The assistant never calls or transfers to 911.
- Warm transfers use a fixed compact message rather than a transcript.
- If neither the lead inbox nor the optional Hermes endpoint accepts the lead,
  the assistant does not claim it was saved and does not attempt a transfer.

## Production smoke test

1. Confirm the internal Zoho inbox receives one compact test lead.
2. Call the Vapi number and complete a non-service inquiry.
3. Confirm the assistant invokes `save_phone_inquiry` once.
4. Confirm the inbox receives the fields but no transcript or recording.
5. Add three test contractors matching one trade and zone.
6. During their working hours, confirm an eligible service call can transfer.
7. Outside their working hours, confirm the inbox receives
   `queued_after_hours` and no transfer is attempted.
