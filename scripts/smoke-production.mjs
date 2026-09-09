// Run against the compiled app with isolated synthetic configuration. No live integrations.
import { spawn } from "node:child_process";
import assert from "node:assert/strict";
import { nextOptions } from "./next-options.mjs";
const port = "3198";
const base = `http://127.0.0.1:${port}`;
const safeEnv = { ...process.env, NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1",
  NEXT_PUBLIC_SITE_URL: base, ADMIN_USERNAME: "smoke-admin", ADMIN_PASSWORD: "synthetic-smoke-password" };
for (const key of Object.keys(safeEnv)) {
  if (/^(SUPABASE_|HERMES_|ZOHO_|VAPI_|VERCEL|CELINA_)/.test(key)) delete safeEnv[key];
}
const { env } = nextOptions("start", process.cwd(), process.platform, safeEnv);
const child = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", port], { env, stdio: "pipe" });
let logs = "";
let exited = false;
child.stdout.on("data", (chunk) => { logs = (logs + chunk).slice(-6000); });
child.stderr.on("data", (chunk) => { logs = (logs + chunk).slice(-6000); });
child.on("exit", () => { exited = true; });
try {
  let running = false;
  for (let n = 0; n < 60; n++) {
    if (exited) throw new Error(`Server exited before readiness: ${logs}`);
    if (logs.includes("Ready in")) { running = true; break; }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  assert.ok(running, `Server startup timed out: ${logs}`);
  const get = (path, headers) => fetch(base + path, { headers, signal: AbortSignal.timeout(20_000), redirect: "manual" });
  for (const path of ["/admin", "/admin/contractor-outreach", "/api/admin/contractor-search", "/api/admin/contractor-outreach", "/api/admin/readiness", "/api/celina/loop", "/api/export/store", "/api/export/leads", "/api/approvals/synthetic"]) {
    assert.equal((await get(path)).status, 401, `anonymous ${path}`);
    assert.equal((await get(path, { authorization: "Basic !!!" })).status, 401, `malformed ${path}`);
  }
  const ready = await get("/api/readiness");
  assert.equal(ready.status, 503);
  assert.deepEqual(await ready.json(), { ready: false });
  const diagnostic = await get("/api/admin/readiness", { authorization: "Basic " + Buffer.from("smoke-admin:synthetic-smoke-password").toString("base64") });
  assert.equal(diagnostic.status, 503, "valid auth reaches diagnostics, but DB remains unconfigured");
  const report = await diagnostic.json();
  assert.equal(report.ready, false);
  assert.ok(Array.isArray(report.checks));
  assert.equal(JSON.stringify(report).includes("leadCount"), false);
  const home = await get("/");
  assert.equal(home.status, 200);
  assert.match(home.headers.get("set-cookie"), /co_visitor=/);
  assert.match(home.headers.get("set-cookie"), /co_home_hero_variant=/);
  console.log("Production HTTP smoke passed: protected routes reject anonymous/malformed auth; valid auth works; readiness is minimal; homepage cookies assigned.");
} finally {
  child.kill();
}
