import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

test("store never overwrites a corrupt local store with seed data", async () => {
  const dir = await mkdtemp(path.join(tmpdir(), "conquistador-store-test-"));
  process.env.DATA_DIR = dir;
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SECRET_KEY; delete process.env.SUPABASE_SERVICE_ROLE_KEY; delete process.env.VERCEL;
  Object.assign(process.env, { NODE_ENV: "test" });
  const file = path.join(dir, "conquistador-store.json");
  await writeFile(file, "{broken");
  try {
    const { getStore } = await import("./store");
    await assert.rejects(getStore(), SyntaxError);
    assert.equal(await readFile(file, "utf8"), "{broken");
  } finally { await rm(dir, { recursive: true }); }
});
