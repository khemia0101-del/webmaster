import assert from "node:assert/strict";
import test from "node:test";
import { boundedBody, publicJson, publicForm, stringFields, consumeLocalLimit, requestIdentity, validExperiment, impressionId, guardPublicRequest } from "./public-request";

const url = "https://example.test/api/intake";
test("limits enforce quota and expire without trusting user supplied IP outside Vercel", () => {
  assert.equal(consumeLocalLimit("test", 2, 1, 1000).allowed, true);
  assert.equal(consumeLocalLimit("test", 2, 1, 1000).allowed, true);
  assert.deepEqual(consumeLocalLimit("test", 2, 1, 1500), { allowed: false, retryAfter: 1 });
  assert.equal(consumeLocalLimit("test", 2, 1, 2000).allowed, true);
  const a = new Request(url, { headers: { "x-vercel-forwarded-for": "192.0.2.1" } });
  const b = new Request(url, { headers: { "x-vercel-forwarded-for": "192.0.2.2" } });
  assert.equal(requestIdentity(a, {}), requestIdentity(b, {}));
  const env = { VERCEL: "1", SUPABASE_SECRET_KEY: "synthetic-test-key" };
  assert.notEqual(requestIdentity(a, env), requestIdentity(b, env));
  assert.match(requestIdentity(a, env), /^[0-9a-f]{64}$/);
  assert.throws(() => requestIdentity(a, { NODE_ENV: "production" }));
});
test("bounded bodies reject both declared and streamed oversized input", async () => {
  await assert.rejects(boundedBody(new Request(url, { method: "POST", body: "abc", headers: { "content-length": "1000" } }), 10), { status: 413 });
  await assert.rejects(boundedBody(new Request(url, { method: "POST", body: "a".repeat(100) }), 10), { status: 413 });
  assert.equal((await boundedBody(new Request(url, { method: "POST", body: "abc" }), 10)).toString(), "abc");
});
test("JSON and fields reject malformed types, oversized content, spam, and invalid contacts", async () => {
  for (const body of ["null", "[]", "{bad"]) await assert.rejects(publicJson(new Request(url, { method: "POST", body, headers: { "content-type": "application/json" } })), { status: 400 });
  await assert.rejects(publicJson(new Request(url, { method: "POST", body: "{}" })), { status: 415 });
  for (const value of [{ question: {} }, { unknown: "x" }, { question: "x".repeat(4001) }, { website: "spam" }, { email: "bad" }, { phone: "123" }]) {
    assert.throws(() => stringFields(value, ["question", "website", "email", "phone"]));
  }
});
test("intake validates contacts, duplicates, files, and internal-source spoofing", async () => {
  const form = () => { const f = new FormData(); f.set("name", "Test"); f.set("phone", "7175550100"); f.set("fallbackType", "other"); return f; };
  const good = form(); good.set("source", "Vapi Phone"); good.set("experimentId", "invented"); good.set("variantId", "fake");
  const clean = await publicForm(new Request(url, { method: "POST", body: good }));
  assert.equal(clean.get("source"), "Website");
  assert.equal(clean.has("experimentId"), false);
  const duplicate = form(); duplicate.append("name", "Other");
  await assert.rejects(publicForm(new Request(url, { method: "POST", body: duplicate })), { status: 400 });
  const file = form(); file.set("documents", new Blob(["not supported"]), "upload.txt");
  await assert.rejects(publicForm(new Request(url, { method: "POST", body: file })), { status: 400 });
  const invalid = form(); invalid.set("fallbackType", "internal");
  await assert.rejects(publicForm(new Request(url, { method: "POST", body: invalid })), { status: 400 });
});
test("experiment allowlist, cookie assignment, and replay IDs", () => {
  const request = new Request(url, { headers: { cookie: "co_home_hero_variant=service-first; co_visitor=11111111-1111-4111-8111-111111111111" } });
  assert.equal(validExperiment("home-hero-v1", "service-first", "/", request), true);
  assert.equal(validExperiment("invented", "service-first", "/", request), false);
  assert.equal(validExperiment("home-hero-v1", "hvac-urgent", "/", request), false);
  assert.equal(validExperiment("home-hero-v1", "service-first", "/admin", request), false);
  assert.equal(impressionId(request, "home-hero-v1", 1000), impressionId(request, "home-hero-v1", 2000));
  assert.notEqual(impressionId(request, "home-hero-v1", 1000), impressionId(request, "home-hero-v1", 1_800_000));
  assert.throws(() => impressionId(new Request(url), "home-hero-v1"));
});
test("cross-site browser requests are rejected before database access", async () => {
  await assert.rejects(guardPublicRequest(new Request(url, { headers: { origin: "https://attacker.test" } }), "leads"), { status: 403 });
});
