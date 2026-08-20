# Vapi outbound contractor qualification

This feature lets an authenticated operator find contractor candidates and call one prospect at a time from `/admin/contractor-outreach`. Google Places returns current public business listings for review. Vapi runs a short English qualification conversation and returns structured fields to the app. Every interested contractor remains in human vetting.

Vapi places calls; it does not discover phone numbers. The app uses Google Places API (New) for optional discovery, or the operator can enter a prospect from a documented application, referral, existing relationship, or another legitimate source.

## Production environment

```env
NEXT_PUBLIC_SITE_URL=https://YOUR_PRODUCTION_DOMAIN
ADMIN_USERNAME=YOUR_ADMIN_USERNAME
ADMIN_PASSWORD=YOUR_ADMIN_PASSWORD

GOOGLE_PLACES_API_KEY=YOUR_SERVER_SIDE_GOOGLE_PLACES_API_KEY
VAPI_PRIVATE_KEY=YOUR_VAPI_PRIVATE_KEY
VAPI_OUTBOUND_PHONE_NUMBER_ID=YOUR_VAPI_PHONE_NUMBER_ID
VAPI_OUTBOUND_WEBHOOK_SECRET=YOUR_RANDOM_64_CHARACTER_SHARED_SECRET

ZOHO_SMTP_HOST=smtp.zoho.com
ZOHO_SMTP_PORT=465
ZOHO_SMTP_USER=YOUR_ZOHO_MAILBOX
ZOHO_SMTP_PASS=YOUR_ZOHO_APP_PASSWORD
ZOHO_FROM_EMAIL=info@conquistadoroil.com
ZOHO_FROM_NAME=Conquistador Oil
CONTRACTOR_OUTREACH_NOTIFICATION_EMAIL=info@conquistadoroil.com

# Optional; defaults to the Vapi-documented gpt-5.4.
# VAPI_OUTBOUND_MODEL=gpt-5.4
# Optional Vapi Voice V2 voice; defaults to Elliot and remains English-only.
# VAPI_OUTBOUND_VOICE_ID=Elliot

# Optional compact Hermes handoff.
HERMES_REVENUE_DESK_WEBHOOK_URL=
HERMES_REVENUE_DESK_SECRET=
```

`VAPI_PRIVATE_KEY` is the private key shown in the Vapi dashboard. The app sends that private key using the API's standard `Authorization: Bearer ...` HTTP scheme; there is no separate bearer token to obtain. The Vapi public key is not used by this server-side workflow.

`VAPI_OUTBOUND_WEBHOOK_SECRET` is a random secret you create. It is not either Vapi API key. The app includes it in the transient assistant's `X-Vapi-Outbound-Secret` header so `/api/vapi/outbound/webhook` can authenticate Vapi tool calls.

`GOOGLE_PLACES_API_KEY` is a server-side Google Cloud key with Places API (New) enabled. Restrict it to the Places API and to the production deployment where possible. It is never sent to the browser. Search results are requested with a narrow field mask and `cache: no-store` to limit returned data, cost, and caching.

## Flow

1. An authenticated operator opens `/admin/contractor-outreach`.
2. The operator searches by service and U.S. location. The server calls Google Places Text Search (New), requesting at most ten currently listed candidates with published phone numbers.
3. Results remain ephemeral in the browser. The operator opens the Google Maps listing, chooses one candidate, and independently verifies its line type, timezone, contact basis, and suppression status. Selecting a result only fills the form; it never calls automatically.
4. The operator can also enter a prospect from a different documented source.
5. The server rejects invalid U.S. numbers, calls outside 9:00 AM-5:00 PM weekdays in the prospect timezone, repeat calls queued in the last 24 hours, and stored do-not-call numbers.
6. Mobile and unknown lines are rejected unless the operator documents written consent for an AI-voice call. Google Places does not establish whether a published number is a landline or mobile number.
7. The app creates a contractor prospect record and calls Vapi's `POST /call` endpoint with a transient assistant.
8. The assistant identifies itself and Conquistador Oil, explains the purpose, and asks permission to continue.
9. The assistant records one disposition and confirmed business fields through `save_contractor_outreach`.
10. The app updates the prospect and sends a compact internal Zoho email. The optional Hermes webhook receives the same structured result. If Vapi's webhook reaches a different Vercel function instance, the app reconstructs the minimum prospect record from compact call metadata before delivering the result.

The structured result includes contact and company details, services, service areas, hours, after-hours availability, preferred lead types, verbal license/insurance/W-9 readiness, follow-up preference, permission, disposition, and a short summary.

No recording, transcript, full message history, raw Vapi artifact, payment information, tax ID, or document image is stored or forwarded.

## Dispositions

- `interested`: qualified for human vetting;
- `follow_up`: asked for later human contact;
- `declined`: not interested;
- `do_not_call`: questioning stops immediately and the stored number is suppressed;
- `wrong_number`: number is not a valid company contact;
- `voicemail`: no qualification occurred.

## Operational limits

- There is no batch endpoint, campaign auto-start, cron, or automatic redial.
- Discovery uses Google's supported Places API; the system does not scrape Google Maps pages or buy prospect data.
- Every call requires an authenticated operator action and an explicit compliance confirmation.
- The local `/tmp` file store is best-effort on Vercel. Compact call metadata lets the result webhook recover and deliver a record across instances, but do-not-call suppression and idempotency are not durable across deployments or cold instances. This is another reason campaigns, automatic retries, and unattended calling remain disabled until a durable non-Supabase store is chosen.
- Google Places content is displayed with Google Maps attribution and direct listing links. Before enabling Places in production, ensure the site's public terms and privacy policy meet Google's current requirements and review Google's caching restrictions.
- This code provides conservative product safeguards, not legal advice. Review federal and applicable state calling rules with counsel before production outreach.

The FTC says most genuine business-to-business solicitation calls are exempt from the Telemarketing Sales Rule's consumer provisions, while prohibitions on deceptive B2B calls still apply. The FCC has confirmed that AI-generated voices fall within the TCPA's artificial/prerecorded voice rules. See the [FTC TSR compliance guide](https://www.ftc.gov/business-guidance/resources/complying-telemarketing-sales-rule) and [FCC AI voice declaratory ruling](https://docs.fcc.gov/public/attachments/FCC-24-17A1.pdf). Google documents the current [Text Search (New) request](https://developers.google.com/maps/documentation/places/web-service/text-search) and [Places API policy and attribution requirements](https://developers.google.com/maps/documentation/places/web-service/policies).

## Smoke test

1. Use a company-controlled test number with written consent.
2. Confirm the admin page reports all six runtime values configured.
3. Search for a contractor category and confirm results include visible Google Maps attribution and direct listing links.
4. Select a result and confirm no call starts until the operator completes and submits the authorization form.
5. Start one controlled test during the allowed timezone window.
6. Confirm Vapi returns a call ID and the prospect status becomes `outreach_call_queued`.
7. Complete the call and confirm exactly one `save_contractor_outreach` tool result.
8. Confirm Zoho receives structured fields without a recording or transcript.
9. Say “do not call” on a second controlled test and confirm the stored status becomes `do_not_call`.
10. Confirm another attempt to that number is rejected before Vapi is called.
