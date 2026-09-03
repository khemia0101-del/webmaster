import test from "node:test";
import assert from "node:assert/strict";

test("HTTP routes enforce auth, limit writes, deduplicate impressions, and persist before delivery", async () => {
  Object.assign(process.env, {
    NODE_ENV: "production", SUPABASE_URL: "https://example.test", SUPABASE_SECRET_KEY: "synthetic-test-key",
    NEXT_PUBLIC_SITE_URL: "https://site.test", ADMIN_USERNAME: "test-admin", ADMIN_PASSWORD: "test-password",
    HERMES_REVENUE_DESK_WEBHOOK_URL: "https://webhook.test", HERMES_REVENUE_DESK_SECRET: "test"
  });
  delete process.env.VERCEL; delete process.env.ZOHO_SMTP_USER; delete process.env.ZOHO_SMTP_PASS;
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  const events = new Map<string, unknown>();
  const ids: string[] = [];
  let limited = false;
  let failed = false;
  let failLead = false;
  let failWebhook = false;
  const patches: Record<string, unknown>[] = [];
  globalThis.fetch = async (input, init) => {
    const url = String(input);
    calls.push(url);
    assert.ok(url.startsWith("https://example.test/") || url === "https://webhook.test", "test must not reach real services");
    if (failed) return Response.json({ message: "synthetic outage" }, { status: 400 });
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    if (failLead && url.includes("persist_lead_bundle")) return Response.json({ message: "synthetic write failure" }, { status: 400 });
    if (failWebhook && url === "https://webhook.test") return Response.json({ error: "synthetic provider failure" }, { status: 500 });
    if (url.includes("update_lead_with_audit")) patches.push(body.p_patch);
    if (url.includes("consume_public_request_limit")) return Response.json({ allowed: !limited, retryAfter: 900 });
    if (url.includes("persist_lead_bundle")) { ids.push(body.p_lead.id); return Response.json(body.p_lead); }
    if (url.includes("interaction_events")) events.set(body.id, body);
    return Response.json(url === "https://webhook.test" ? { nextAction: "Synthetic accepted" } : null, { headers: { "Content-Range": "0-0/0" } });
  };
  try {
    const intake = await import("../app/api/intake/route");
    const chat = await import("../app/api/chat/route");
    const loop = await import("../app/api/celina/loop/route");
    const diagnostics = await import("../app/api/admin/readiness/route");
    const readiness = await import("../app/api/readiness/route");
    const impression = await import("../app/api/experiments/impression/route");
    for (const authorization of ["", "Basic !!!", "Basic " + btoa("wrong:credentials")]) {
      const req = new Request("https://site.test/api/celina/loop", { headers: { authorization } });
      assert.equal((await loop.GET(req)).status, 401);
      assert.equal((await diagnostics.GET(req)).status, 401);
    }
    assert.equal(calls.length, 0, "denied admin requests must not read CRM");
    const json = (path: string, body: unknown, headers = {}) => new Request(`https://site.test${path}`, {
      method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body)
    });
    assert.equal((await chat.POST(json("/api/chat", { question: { bad: "type" } }))).status, 400);
    assert.equal((await chat.POST(json("/api/chat", { question: "hello", website: "spam" }))).status, 400);
    assert.equal(ids.length, 0);
    assert.equal(events.size, 0, "invalid traffic must not flood audit events");
    limited = true;
    const blocked = await chat.POST(json("/api/chat", { question: "hello" }));
    assert.equal(blocked.status, 429);
    assert.equal(blocked.headers.get("retry-after"), "900");
    limited = false;
    const form = new FormData(); form.set("name", "Synthetic"); form.set("phone", "7175550100"); form.set("fallbackType", "other");
    const accepted = await intake.POST(new Request("https://site.test/api/intake", { method: "POST", body: form }));
    assert.equal(accepted.status, 200);
    assert.equal(ids.length, 1);
    const persistIndex = calls.findIndex((url) => url.includes("persist_lead_bundle"));
    assert.ok(persistIndex >= 0 && calls.indexOf("https://webhook.test") > persistIndex);
    assert.equal((await chat.POST(json("/api/chat", { question: "Routine service question" }))).status, 200);
    assert.equal(new Set(ids).size, 2, "separate leads have distinct IDs");
    failLead = true;
    const notificationsBefore = calls.filter((url) => url === "https://webhook.test").length;
    assert.equal((await chat.POST(json("/api/chat", { question: "Synthetic persistence failure" }))).status, 500);
    assert.equal(calls.filter((url) => url === "https://webhook.test").length, notificationsBefore, "failed save must not notify");
    failLead = false; failWebhook = true;
    assert.equal((await chat.POST(json("/api/chat", { question: "Synthetic delivery failure" }))).status, 200, "saved lead remains accepted if delivery fails");
    assert.equal(ids.length, 3);
    assert.equal(patches.at(-1)?.hermesDeliveryStatus, "failed");
    failWebhook = false;
    const eventCount = events.size;
    const payload = { experimentId: "home-hero-v1", variantId: "service-first", page: "/" };
    const cookies = { cookie: "co_home_hero_variant=service-first; co_visitor=11111111-1111-4111-8111-111111111111" };
    assert.equal((await impression.POST(json("/api/experiments/impression", { ...payload, variantId: "invented" }, cookies))).status, 400);
    for (let n = 0; n < 2; n++) assert.equal((await impression.POST(json("/api/experiments/impression", payload, cookies))).status, 200);
    assert.equal(events.size, eventCount + 1);
    const publicReady = await readiness.GET();
    assert.deepEqual(await publicReady.json(), { ready: true });
    assert.equal(publicReady.headers.get("cache-control"), "no-store");
    failed = true;
    const notReady = await readiness.GET();
    assert.equal(notReady.status, 503);
    assert.deepEqual(await notReady.json(), { ready: false });
    const webhookCount = calls.filter((url) => url === "https://webhook.test").length;
    assert.equal((await chat.POST(json("/api/chat", { question: "hello" }))).status, 503);
    assert.equal(calls.filter((url) => url === "https://webhook.test").length, webhookCount);
  } finally { globalThis.fetch = originalFetch; }
});
