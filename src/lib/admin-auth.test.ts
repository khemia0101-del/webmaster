import test from "node:test";
import assert from "node:assert/strict";
import { adminAuthorized } from "./admin-auth";

const request = (value?: string) => new Request("https://example.test", { headers: value ? { authorization: value } : {} });
test("admin auth fails closed in production, preview, and partial configuration", () => {
  assert.equal(adminAuthorized(request(), { NODE_ENV: "production" }), false);
  assert.equal(adminAuthorized(request(), { NODE_ENV: "development", VERCEL: "1" }), false);
  assert.equal(adminAuthorized(request(), { NODE_ENV: "production", ADMIN_USERNAME: "admin" }), false);
});
test("admin auth accepts exact credentials including colon in password, rejects malformed input", () => {
  const env = { NODE_ENV: "production", ADMIN_USERNAME: "admin", ADMIN_PASSWORD: "test:password" };
  for (const value of [undefined, "Basic !!!", "Basic Og==", "Bearer nope", "Basic " + btoa("admin:wrong")]) {
    assert.equal(adminAuthorized(request(value), env), false);
  }
  assert.equal(adminAuthorized(request("Basic " + btoa("admin:test:password")), env), true);
});
