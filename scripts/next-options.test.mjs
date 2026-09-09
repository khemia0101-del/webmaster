import test from "node:test";
import assert from "node:assert/strict";
import { nextOptions } from "./next-options.mjs";
test("Linux production retains native Next build and environment", () => {
  const env = { NODE_ENV: "production", VERCEL: "1" };
  const result = nextOptions("build", "/app", "linux", env);
  assert.equal(result.args.includes("--webpack"), false);
  assert.deepEqual(result.env, env);
  assert.equal(env.NEXT_TEST_WASM_DIR, undefined);
});
test("Windows keeps its isolated compatibility settings and forwards CLI arguments", () => {
  const result = nextOptions("dev", "/app", "win32", {}, ["--port", "3456"]);
  assert.equal(result.args.includes("--webpack"), true);
  assert.ok(result.env.NEXT_TEST_WASM_DIR);
  assert.deepEqual(result.args.slice(-2), ["--port", "3456"]);
});
