# Vapi inbound lead desk

The app exposes a secured Vapi webhook at `/api/vapi/webhook`. It returns a
transient English-only assistant, accepts one structured lead tool call, ranks
eligible contractors, and immediately sends a compact lead to the internal
Zoho inbox. A hosted Hermes / Conquistador Revenue Desk webhook can receive the
same compact handoff when one is available.

No call recording, Vapi logging, full message history, or stored transcript is
enabled. Hermes receives confirmed fields and a short summary, not the raw call.

## Required environment

Copy `.env.example` and replace every `REPLACE_WITH_...` value. For the phone
flow, these values must be configured in Vercel:

```env
NEXT_PUBLIC_SITE_URL=https://YOUR_PRODUCTION_DOMAIN

VAPI_WEBHOOK_SECRET=YOUR_RANDOM_64_CHARACTER_SECRET
VAPI_MODEL_PROVIDER=openai
VAPI_MODEL=gpt-5.4-mini

PHONE_ROUTING_MIN_CONTRACTORS=3

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

`VAPI_API_KEY`, `VAPI_PHONE_NUMBER_ID`, `CRON_SECRET`, and database variables
are not needed by this inbound-only implementation.

## Connect Vapi

1. Deploy the app and set the production variables above.
2. In Vapi, create a Bearer Token custom credential.
3. Use the exact `VAPI_WEBHOOK_SECRET` value as its token.
4. Keep the header as `Authorization` and enable the Bearer prefix.
5. Save the credential. You do not need to copy its generated ID into Vercel.
6. Configure the Vapi phone number with no fixed assistant.
7. Set the phone number server URL to:

   `https://YOUR_PRODUCTION_DOMAIN/api/vapi/webhook`

8. Select the saved Bearer credential in the phone number server settings.

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
