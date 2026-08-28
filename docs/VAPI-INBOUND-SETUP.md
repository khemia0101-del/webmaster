# Vapi inbound lead desk

The app exposes a secured Vapi tool webhook at `/api/vapi/webhook`. The saved
English-only Vapi assistant calls it once with a structured inquiry. The app
stores the lead in Supabase, evaluates routing eligibility, and immediately
sends a compact lead to the internal Zoho inbox. A hosted Hermes / Conquistador
Revenue Desk webhook can receive the same compact handoff when one is
available.

No call recording, Vapi logging, full message history, or stored transcript is
enabled. Hermes receives confirmed fields and a short summary, not the raw call.

## Current Vapi resources

Do not create a second inbound assistant. These resources already exist:

```text
Assistant: Conquistador Inbound Lead Desk
Assistant ID: 916302c4-5313-420f-bcd8-86be365b49bb
Phone-number record ID: e9111cee-82b6-42f2-8461-be46cfa72f4a
Vapi phone number (not the public site number): +1 (223) 433-9345
Assistant server URL: https://conquistadoroil.com/api/vapi/webhook
Assistant server header: X-Vapi-Secret
Model: openai / gpt-5.4-mini
Voice: Vapi / Elliot
```

The public website contact number is `(717) 397-9800` (`tel:+17173979800`).
Restoring that public number does not change the Vapi number assignment or configure call forwarding.

The phone-number record is attached to that assistant. The assistant has the
`save_phone_inquiry` function and `endCall` tool. Recording, Vapi logging, full
message history, and transcripts are disabled.

## Production environment for live phone calls

Add these values to Vercel before accepting live Vapi calls:

```env
NEXT_PUBLIC_SITE_URL=https://conquistadoroil.com

SUPABASE_URL=https://qnxizmyyvhxhiwycwrod.supabase.co
SUPABASE_SECRET_KEY=YOUR_SERVER_ONLY_SUPABASE_SECRET

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

The saved Vapi assistant owns the inbound model and voice configuration. The
app defaults to a three-contractor routing threshold;
`PHONE_ROUTING_MIN_CONTRACTORS` is needed only to override that value.

The application does not consume a Vapi public key. `VAPI_PRIVATE_KEY` is not
used during normal inbound calls; it is needed only to inspect or change Vapi
resources, and by the separate outbound calling flow. Do not reuse a Vapi API
key as `VAPI_WEBHOOK_SECRET`.

## Verify the Vapi connection

1. Deploy the app and set the production variables above.
2. Confirm phone-number record `e9111cee-82b6-42f2-8461-be46cfa72f4a`
   remains attached to assistant `916302c4-5313-420f-bcd8-86be365b49bb`.
3. Confirm the assistant server URL is:

   `https://conquistadoroil.com/api/vapi/webhook`

4. Confirm its `X-Vapi-Secret` header value exactly matches the production
   `VAPI_WEBHOOK_SECRET`. Compare values without printing them.

The assistant's server header can be inspected or updated through the Vapi API
using `VAPI_PRIVATE_KEY`. Do not print either secret or expose the private key
to client code. The inbound webhook does not return an assistant dynamically;
it accepts authenticated tool calls from the saved assistant.

## Lead durability

Production phone leads are committed to Supabase before notification delivery.
The database transaction stores the compact lead, generated approvals, activity,
and interaction events together. Vapi call IDs have a unique database index, so
retries across separate Vercel instances resolve to the same lead. Local JSON is
used only in development when Supabase credentials are absent.

After the CRM commit, the app sends an operational notification to
`PHONE_LEAD_NOTIFICATION_EMAIL`. If `HERMES_REVENUE_DESK_WEBHOOK_URL` is also
configured, it receives the same compact lead. The payload contains:

- caller name and callback details;
- inquiry category and requested service;
- service address or area;
- a caller-confirmed summary of at most 240 characters;
- urgency and sharing consent;
- compact routing status.

It does not contain a transcript, recording URL, complete message history, or
raw Vapi artifact.

Vapi retries are idempotent by call ID. The app reuses a deterministic lead ID,
coalesces concurrent retries in one runtime, and uses the Supabase uniqueness
constraint plus a five-minute processing lease across runtimes. Only the lease
holder sends notifications. A concurrent retry reports the
already-saved inquiry as processing, while a completed handoff's stored tool
result is returned instead of sending the emails and webhook again.

There is intentionally no Vercel cron or delayed queue. The current saved
assistant does not have a live-transfer tool. All inbound inquiries are saved
and handed to the Revenue Desk for follow-up, even when the app's deterministic
routing policy identifies eligible contractors. A hosted Hermes endpoint can
over-watch the same event later. Live transfer or automatic delayed contractor
calls require a separately designed and deployed flow.

## Contractor routing data

The app marks a service inquiry `transfer_ready` for internal routing only when
at least three eligible contractors exist. Each contractor must be active,
verified, free of missing documents, match the requested trade and zone, and
contain a routing profile similar to:

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
rotation, and 5% configured priority. This routing result is stored for human
follow-up; the current saved assistant does not initiate a live transfer.

## Guardrails

- Service details are shared only after the caller grants permission.
- Billing, careers, supplier, complaint, and other calls are logged for
  follow-up.
- The assistant never quotes, books, promises dispatch, or accepts payment.
- The assistant never calls or transfers to 911.
- If neither the lead inbox nor the optional Hermes endpoint accepts the lead,
  the assistant does not claim that the handoff succeeded.

## Production smoke test

1. Confirm `/api/readiness` reports a connected Supabase database.
2. Confirm the internal Zoho inbox receives one compact test lead.
3. Call the Vapi number and complete a non-service inquiry.
4. Confirm the assistant invokes `save_phone_inquiry` once.
5. Confirm the CRM and inbox contain the fields but no transcript or recording.
6. Confirm no call transfer is attempted by the current saved assistant.
7. If routing fixtures are used, confirm eligibility status is stored only for
   human follow-up.
