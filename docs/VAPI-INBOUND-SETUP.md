# Vapi inbound lead desk

The app now exposes a secured Vapi webhook at `/api/vapi/webhook`. It returns a transient English-only inbound assistant, accepts structured tool calls, chooses contractors with deterministic policy, and records compact outcomes in the existing lead and Hermes activity stores.

No call recording, Vapi logging, full message history, or stored transcript is enabled. The app stores only confirmed lead fields, a short caller-approved summary, routing state, and outcome events.

## Before connecting the phone number

1. Apply `src/lib/supabase-schema.sql` to the production Supabase database. Phone queues must use Supabase on Vercel because function-local files under `/tmp` are not durable across invocations.
2. Add the variables from `.env.example` to the Vercel production environment.
3. Generate strong independent values for `VAPI_WEBHOOK_SECRET` and `CRON_SECRET`.
4. In Vapi, create a Bearer Token custom credential:
   - Token: the exact `VAPI_WEBHOOK_SECRET` value.
   - Header: `Authorization`.
   - Bearer prefix: enabled.
   - Save its ID as `VAPI_SERVER_CREDENTIAL_ID` in Vercel.
5. Configure the Vapi phone number with no fixed assistant and set its server URL to:

   `https://YOUR_PRODUCTION_DOMAIN/api/vapi/webhook`

   Attach the custom credential created above. With no fixed assistant, Vapi sends an `assistant-request` and the app returns the controlled transient assistant.
6. Set `VAPI_API_KEY` and `VAPI_PHONE_NUMBER_ID`. They are used only for queued outbound contractor follow-ups.

The public website number is intentionally unchanged until the Vapi number is ready.

## Contractor routing data

Automatic routing remains off for a service/area until at least three eligible contractors exist. Each contractor must be active, verified, free of missing documents, match the requested trade and zone, and contain a routing profile similar to:

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

The ranking score is 50% proximity, 20% reliability, 15% service fit, 10% workload rotation, and 5% configured priority. At most three contractors are attempted.

## Follow-up cron

`vercel.json` invokes `/api/cron/phone-followups` every 15 minutes. The route requires Vercel's `Authorization: Bearer $CRON_SECRET` header and processes at most ten leads by default.

The 15-minute schedule requires a Vercel plan that supports sub-daily cron execution. If the project is on the Hobby plan, upgrade before enabling timely contractor follow-up; Hobby cron frequency is not sufficient for this workflow.

## Behavior and guardrails

- Service calls are shared only after the caller grants permission.
- Billing, careers, suppliers, complaints, and other non-service inquiries are logged without transfer.
- The assistant collects details but never quotes, books, promises dispatch, or accepts payment.
- The assistant cannot call or transfer to 911.
- Warm transfers use a compact structured message rather than a transcript. Confirm the imported number's carrier supports the selected Vapi warm-transfer mode during integration testing.
- If all live attempts fail, the lead remains visible with an `exhausted` state for manual follow-up.

## Production smoke test

1. Add three test contractors that match one trade and zone and are open during the test.
2. Call the Vapi number and submit a service request with permission to share.
3. Confirm Vapi requests `save_phone_inquiry`, then `transfer-destination-request`.
4. Reject or miss the first destination and confirm the next contractor is attempted.
5. Place a call outside every test contractor's hours and confirm the lead becomes `queued_after_hours`.
6. Invoke the cron with its Bearer token and confirm an outbound contractor follow-up starts after the next opening.
7. Verify the lead contains no transcript or recording URL.
