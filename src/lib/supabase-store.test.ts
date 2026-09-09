import test from "node:test";
import assert from "node:assert/strict";
import { shouldUseSupabase, persistSupabaseLeadBundle, appendSupabaseEvent, consumePublicRateLimit, claimSupabasePhoneHandoff } from "./supabase-store";
import type { Lead, InteractionEvent } from "./types";

test("Supabase configuration fails closed and never enables a production JSON fallback", () => {
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY; delete process.env.SUPABASE_SERVICE_ROLE_KEY; delete process.env.VERCEL;
  Object.assign(process.env, { NODE_ENV: "test" });
  assert.equal(shouldUseSupabase(), false);
  Object.assign(process.env, { NODE_ENV: "production" });
  assert.throws(() => shouldUseSupabase(), /required in production/);
  process.env.SUPABASE_URL = "https://example.test";
  assert.throws(() => shouldUseSupabase(), /partially configured/);
  process.env.SUPABASE_SECRET_KEY = "synthetic-test-key";
  assert.equal(shouldUseSupabase(), true);
});
test("store adapters preserve bundle payloads, surface errors, and map idempotent event writes", async () => {
  const original = globalThis.fetch;
  const calls: { url: string; body: Record<string, unknown>; headers: Headers }[] = [];
  let reply: unknown = { id: "lead-test" };
  let status = 200;
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), body: init?.body ? JSON.parse(String(init.body)) : {}, headers: new Headers(init?.headers) });
    return new Response(JSON.stringify(reply), { status, headers: { "Content-Type": "application/json" } });
  };
  try {
    const lead = { id: "lead-test", name: "Synthetic", phone: "7175550100" } as Lead;
    assert.deepEqual(await persistSupabaseLeadBundle(lead, [], [], []), { id: "lead-test" });
    assert.deepEqual(calls[0].body, { p_lead: lead, p_approvals: [], p_activity: [], p_events: [] });
    reply = null;
    await assert.rejects(persistSupabaseLeadBundle(lead, [], [], []), /returned no lead/);
    assert.equal(await claimSupabasePhoneHandoff("lead-test", "lease"), null);
    reply = { message: "synthetic failure", code: "TEST" }; status = 400;
    await assert.rejects(persistSupabaseLeadBundle(lead, [], [], []), /synthetic failure/);
    status = 200; reply = {};
    await assert.rejects(consumePublicRateLimit("leads:test", 10, 900), /Invalid rate limit result/);
    reply = { allowed: false, retryAfter: 12 };
    assert.deepEqual(await consumePublicRateLimit("leads:test", 10, 900), reply);
    const event = { id: "evt-test", createdAt: "2026-09-03T00:00:00Z", kind: "experiment_impression", source: "Website", label: "test" } as InteractionEvent;
    reply = null;
    await appendSupabaseEvent(event);
    const call = calls.at(-1)!;
    assert.equal(call.body.id, event.id);
    assert.deepEqual(call.body.data, event);
    assert.match(call.headers.get("Prefer")!, /resolution=ignore-duplicates/);
  } finally { globalThis.fetch = original; }
});
