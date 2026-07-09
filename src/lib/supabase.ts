import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { seedStore } from "@/data/seed";
import type {
  ApprovalRequest,
  HermesActivity,
  InteractionEvent,
  Lead,
  Store
} from "@/lib/types";

/**
 * Supabase storage adapter. Used in production (Vercel) where the local file
 * store would be ephemeral. Activated automatically when both env vars are set:
 *   NEXT_PUBLIC_SUPABASE_URL  +  SUPABASE_SERVICE_ROLE_KEY
 *
 * Table <-> Store key mapping is explicit so the JSON column names line up with
 * src/lib/supabase-schema.sql.
 */

const TABLES = {
  leads: "leads",
  customers: "customers",
  contractors: "contractors",
  jobs: "jobs",
  documents: "documents",
  zones: "zones",
  approvalRequests: "approval_requests",
  hermesActivity: "hermes_activity",
  kpiSnapshots: "kpi_snapshots",
  events: "events"
} as const;

let cached: SupabaseClient | null = null;

export function supabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function supabase(): SupabaseClient {
  if (cached) return cached;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Supabase env vars are not set.");
  cached = createClient(url, key, { auth: { persistSession: false } });
  return cached;
}

export async function readStore(): Promise<Store> {
  const db = supabase();
  const [
    leads,
    customers,
    contractors,
    jobs,
    documents,
    zones,
    approvalRequests,
    hermesActivity,
    kpiSnapshots,
    events
  ] = await Promise.all([
    db.from(TABLES.leads).select("*").order("createdAt", { ascending: false }),
    db.from(TABLES.customers).select("*"),
    db.from(TABLES.contractors).select("*"),
    db.from(TABLES.jobs).select("*"),
    db.from(TABLES.documents).select("*"),
    db.from(TABLES.zones).select("*"),
    db.from(TABLES.approvalRequests).select("*").order("createdAt", { ascending: false }),
    db.from(TABLES.hermesActivity).select("*").order("createdAt", { ascending: false }),
    db.from(TABLES.kpiSnapshots).select("*").order("createdAt", { ascending: false }),
    db.from(TABLES.events).select("*").order("createdAt", { ascending: false })
  ]);

  return {
    leads: (leads.data ?? []) as Store["leads"],
    customers: (customers.data ?? []) as Store["customers"],
    contractors: (contractors.data ?? []) as Store["contractors"],
    jobs: (jobs.data ?? []) as Store["jobs"],
    documents: (documents.data ?? []) as Store["documents"],
    zones: (zones.data ?? []) as Store["zones"],
    approvalRequests: (approvalRequests.data ?? []) as Store["approvalRequests"],
    hermesActivity: (hermesActivity.data ?? []) as Store["hermesActivity"],
    kpiSnapshots: (kpiSnapshots.data ?? []) as Store["kpiSnapshots"],
    events: (events.data ?? []) as Store["events"]
  };
}

export async function insertLead(
  lead: Lead,
  approvals: ApprovalRequest[],
  activity: HermesActivity[],
  events: InteractionEvent[]
): Promise<void> {
  const db = supabase();
  await db.from(TABLES.leads).insert(lead);
  if (approvals.length) await db.from(TABLES.approvalRequests).insert(approvals);
  if (activity.length) await db.from(TABLES.hermesActivity).insert(activity);
  if (events.length) await db.from(TABLES.events).insert(events);
}

export async function insertEvent(event: InteractionEvent): Promise<void> {
  await supabase().from(TABLES.events).insert(event);
}

export async function insertActivity(activity: HermesActivity): Promise<void> {
  await supabase().from(TABLES.hermesActivity).insert(activity);
}

export async function updateLead(id: string, patch: Partial<Lead>): Promise<void> {
  await supabase().from(TABLES.leads).update(patch).eq("id", id);
}

export async function applyDecision(
  approval: ApprovalRequest,
  activity: HermesActivity,
  event: InteractionEvent
): Promise<void> {
  const db = supabase();
  await db
    .from(TABLES.approvalRequests)
    .update({
      status: approval.status,
      decidedAt: approval.decidedAt,
      decidedBy: approval.decidedBy,
      decisionNote: approval.decisionNote
    })
    .eq("id", approval.id);
  await db.from(TABLES.hermesActivity).insert(activity);
  await db.from(TABLES.events).insert(event);
}

export async function findApproval(id: string): Promise<ApprovalRequest | null> {
  const { data } = await supabase().from(TABLES.approvalRequests).select("*").eq("id", id).maybeSingle();
  return (data as ApprovalRequest) ?? null;
}

/**
 * One-time seed of the live database from seedStore. Safe to call repeatedly:
 * uses upsert so it won't duplicate rows.
 */
export async function seedDatabase(): Promise<{ seeded: boolean; counts: Record<string, number> }> {
  const db = supabase();
  const s = seedStore;
  const ops: Array<[string, unknown[]]> = [
    [TABLES.customers, s.customers],
    [TABLES.contractors, s.contractors],
    [TABLES.zones, s.zones],
    [TABLES.leads, s.leads],
    [TABLES.jobs, s.jobs],
    [TABLES.documents, s.documents],
    [TABLES.approvalRequests, s.approvalRequests],
    [TABLES.hermesActivity, s.hermesActivity],
    [TABLES.kpiSnapshots, s.kpiSnapshots],
    [TABLES.events, s.events]
  ];
  const counts: Record<string, number> = {};
  for (const [table, rows] of ops) {
    if (!rows.length) continue;
    await db.from(table).upsert(rows as Record<string, unknown>[], { onConflict: "id" });
    counts[table] = rows.length;
  }
  return { seeded: true, counts };
}
