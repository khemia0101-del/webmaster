# Hardening rollout and operating checks

## Repository changes are not proof of production activation

Keep this update on a review branch until the migration and staging gates below pass. No production database changes, emails, calls, credentials, or deployment settings are changed by the PR itself. A GitHub PR may trigger the repository's existing preview deployment integration.

1. Review the new rate-limit migration. Apply migrations to an isolated staging Supabase project first. The migration adds a table and restricted atomic RPC, without changing customer records.
2. Run `npm ci`, `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run test:production`. The last command boots the compiled server using synthetic admin credentials and no external integrations. It checks actual route protection, not merely an auth helper. Linux CI verifies the native compiler path; Windows retains its compatibility path. `src/proxy.ts` must remain beside `src/app`; a root-level middleware file was not discovered in the previous build.
3. With Docker and Supabase CLI installed, run `supabase start` then `npm run db:test`. SQL tests wrap synthetic fixtures in transactions and roll back. Never point this test suite at production.
4. Configure staging Supabase URL/server key, site URL, and admin credentials through the deployment secret store. Never use production CRM credentials in automated tests or PR builds.
5. Confirm anonymous and malformed-auth requests to `/admin`, `/api/admin/readiness`, and `/api/celina/loop` return 401. Correct admin credentials should allow access. Check no CRM output is cached.
6. Confirm public `/api/readiness` returns only a boolean with 200/503; protected diagnostics must not contain secrets or lead counts. Confirm `abuseProtection` is true after migration. Health proves liveness, not business readiness.
7. In staging, submit a synthetic form and chat: verify one durable lead per successful request and the expected approval/audit artifacts. Check blocked origin, invalid types, oversized content, and quota exhaustion produce 4xx responses with no lead or email side effects. Quota exhaustion includes `Retry-After`.
8. Test duplicate impression delivery: the same visitor/experiment/bucket must create one event. Verify invalid variants/pages and mismatched cookies are rejected. Do not treat these metrics as fraud-proof.
9. Only after approval, use controlled test recipients/endpoints to verify Revenue Desk and Zoho delivery. Database persistence precedes notification. A saved lead does not mean a notification was delivered.
10. Inventory any external Python workers using the old path before retiring them. Confirm contractor call approval/consent gates remain in effect. No unattended calls are introduced.
11. With production-change approval and a database backup, apply the new migration before deploying the matching application. A missing or failed limiter returns 503, not an unprotected write. Re-run the authenticated checks after deployment.

## Notification failures and retries

The current delivery path is synchronous, with failure state recorded on the lead. This change does not invent a background retry worker. Review pending/failed delivery and email status in admin; verify actual provider evidence before retrying. Do not replay public intake to retry a notification: that creates another lead. Ambiguous email delivery must be reconciled before resend. Automated retries need a durable outbox, delivery claims, and provider-specific deduplication before they can be enabled safely.

## Limits and maintenance

The shared limits are 10 lead requests and 60 impression requests per 15 minutes. IPs are HMAC-hashed with the server credential and never stored raw. Rotation resets buckets. A shared office/proxy IP shares its quota; monitor legitimate rejections. Unknown/self-hosted IPs deliberately use a shared bucket rather than trust spoofable headers.

The limiter opportunistically removes up to 100 rows expired for more than an hour per call. It is not a DDoS defense: apply deployment-level firewall/challenge rules if traffic is abusive. Expired rows during inactivity are removed on later traffic; operators can establish a stricter retention job separately.

Keep the additive migration in place for an application rollback; do not drop tables or loosen access to restore an older release. An application rollback can reopen old vulnerabilities, so prefer correcting forward. Verify database role privileges and auth separately from HTTP availability.

## Deferred by design

MDX migration, removal of Framer Motion, external image hosting, payments, automatic contractor dispatch, and new background workers are not part of this hardening PR. Profile real page payload/LCP before changing the frontend dependency stack. Production configuration and delivered-email proof remain separate acceptance gates.
