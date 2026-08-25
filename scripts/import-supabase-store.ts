import { promises as fs } from "fs";
import path from "path";
import { seedStore } from "../src/data/seed";
import { importSupabaseStore } from "../src/lib/supabase-store";
import type { Store } from "../src/lib/types";

function argument(name: string) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

async function loadStore(): Promise<{ store: Store; source: string }> {
  if (process.argv.includes("--seed")) return { store: seedStore, source: "synthetic seed data" };

  const requestedPath = argument("--file") || path.join(process.cwd(), ".data", "conquistador-store.json");
  const absolutePath = path.resolve(requestedPath);
  const raw = await fs.readFile(absolutePath, "utf8");
  return { store: JSON.parse(raw) as Store, source: absolutePath };
}

async function main() {
  const { store, source } = await loadStore();
  await importSupabaseStore(store);

  console.log(`Imported CRM store from ${source}.`);
  console.log(
    JSON.stringify({
      leads: store.leads.length,
      customers: store.customers.length,
      contractors: store.contractors.length,
      jobs: store.jobs.length,
      documents: store.documents.length,
      approvals: store.approvalRequests.length,
      events: store.events.length
    })
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
