import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type {
  ApprovalRequest,
  CelinaAction,
  ComplianceDocument,
  Contractor,
  Customer,
  HermesActivity,
  InteractionEvent,
  Job,
  KpiSnapshot,
  Lead,
  LearningRecord,
  Store,
  Zone
} from "@/lib/types";

const PAGE_SIZE = 1000;

let adminClient: SupabaseClient | undefined;

function secretKey() {
  return process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && secretKey());
}

export function shouldUseSupabase() {
  const hasUrl = Boolean(process.env.SUPABASE_URL);
  const hasSecret = Boolean(secretKey());

  if (hasUrl !== hasSecret) {
    throw new Error(
      "Supabase is partially configured. Set SUPABASE_URL and SUPABASE_SECRET_KEY together."
    );
  }

  if (hasUrl && hasSecret) return true;

  if (process.env.VERCEL || process.env.NODE_ENV === "production") {
    throw new Error(
      "Supabase is required in production. Set SUPABASE_URL and SUPABASE_SECRET_KEY."
    );
  }

  return false;
}

function getAdminClient() {
  if (adminClient) return adminClient;

  const url = process.env.SUPABASE_URL;
  const key = secretKey();
  if (!url || !key) {
    throw new Error("Supabase server credentials are not configured.");
  }

  adminClient = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false
    },
    global: {
      fetch: (input, init) => fetch(input, {
        ...init,
        signal: init?.signal ? AbortSignal.any([init.signal, AbortSignal.timeout(10_000)]) : AbortSignal.timeout(10_000)
      }),
      headers: { "X-Client-Info": "conquistador-oil-crm" }
    }
  });

  return adminClient;
}

function databaseError(operation: string, error: { message: string; code?: string; details?: string }) {
  const suffix = [error.code, error.details].filter(Boolean).join(" / ");
  return new Error(`Supabase ${operation} failed: ${error.message}${suffix ? ` (${suffix})` : ""}`);
}

type SortColumn = "created_at" | "id" | "name" | "company";

async function selectAll<T>(table: string, sortColumn: SortColumn, ascending = false): Promise<T[]> {
  const client = getAdminClient();
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await client
      .from(table)
      .select("data")
      .order(sortColumn, { ascending })
      .range(from, from + PAGE_SIZE - 1);

    if (error) throw databaseError(`read from ${table}`, error);

    const page = (data ?? []).map((row) => row.data as T);
    rows.push(...page);
    if (page.length < PAGE_SIZE) return rows;
  }
}

export async function readSupabaseStore(): Promise<Store> {
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
    events,
    learningRecords,
    celinaActions
  ] = await Promise.all([
    selectAll<Lead>("leads", "created_at"),
    selectAll<Customer>("customers", "name", true),
    selectAll<Contractor>("contractors", "company", true),
    selectAll<Job>("jobs", "id", true),
    selectAll<ComplianceDocument>("compliance_documents", "id", true),
    selectAll<Zone>("zones", "name", true),
    selectAll<ApprovalRequest>("approval_requests", "created_at"),
    selectAll<HermesActivity>("hermes_activity", "created_at"),
    selectAll<KpiSnapshot>("kpi_snapshots", "created_at"),
    selectAll<InteractionEvent>("interaction_events", "created_at"),
    selectAll<LearningRecord>("learning_records", "created_at"),
    selectAll<CelinaAction>("celina_actions", "created_at")
  ]);

  return {
    leads,
    customers,
    contractors,
    jobs,
    documents,
    zones,
    approvalRequests,
    hermesActivity,
    kpiSnapshots,
    events,
    learningRecords,
    celinaActions
  };
}

function leadRow(lead: Lead) {
  return {
    id: lead.id,
    created_at: lead.createdAt,
    source: lead.source,
    lead_type: lead.type,
    status: lead.status,
    name: lead.name,
    company: lead.company ?? null,
    phone: lead.phone,
    email: lead.email ?? null,
    vapi_call_id: lead.phoneRouting?.vapiCallId ?? null,
    safety_critical: lead.safetyCritical,
    data: lead
  };
}

function eventRow(event: InteractionEvent) {
  return {
    id: event.id,
    created_at: event.createdAt,
    kind: event.kind,
    source: event.source,
    lead_id: event.leadId ?? null,
    customer_id: event.customerId ?? null,
    job_id: event.jobId ?? null,
    contractor_id: event.contractorId ?? null,
    data: event
  };
}

export async function appendSupabaseEvent(event: InteractionEvent) {
  const { error } = await getAdminClient()
    .from("interaction_events")
    .upsert(eventRow(event), { onConflict: "id", ignoreDuplicates: true });

  if (error) throw databaseError("append interaction event", error);
}

export async function persistSupabaseLeadBundle(
  lead: Lead,
  approvals: ApprovalRequest[],
  activity: HermesActivity[],
  events: InteractionEvent[]
): Promise<Lead> {
  const { data, error } = await getAdminClient().rpc("persist_lead_bundle", {
    p_lead: lead,
    p_approvals: approvals,
    p_activity: activity,
    p_events: events
  });

  if (error) throw databaseError("persist lead bundle", error);
  if (!data) throw new Error("Supabase persist lead bundle returned no lead.");
  return data as Lead;
}

export async function findSupabaseLeadByVapiCallId(callId: string): Promise<Lead | null> {
  const { data, error } = await getAdminClient()
    .from("leads")
    .select("data")
    .eq("vapi_call_id", callId)
    .maybeSingle();

  if (error) throw databaseError("find Vapi lead", error);
  return data ? (data.data as Lead) : null;
}

export async function claimSupabasePhoneHandoff(leadId: string, token: string): Promise<Lead | null> {
  const { data, error } = await getAdminClient().rpc("claim_phone_handoff", {
    p_id: leadId,
    p_token: token,
    p_claimed_at: new Date().toISOString()
  });

  if (error) throw databaseError("claim phone handoff", error);
  return data ? (data as Lead) : null;
}

export async function claimSupabaseContractorOutreach(
  leadId: string,
  callId: string,
  token: string
): Promise<Lead | null> {
  const { data, error } = await getAdminClient().rpc("claim_contractor_outreach", {
    p_id: leadId,
    p_call_id: callId,
    p_token: token,
    p_claimed_at: new Date().toISOString()
  });

  if (error) throw databaseError("claim contractor outreach", error);
  return data ? (data as Lead) : null;
}

export async function updateSupabaseLeadWithAudit(
  id: string,
  patch: Partial<Lead>,
  activity: HermesActivity[],
  events: InteractionEvent[]
) {
  const { error } = await getAdminClient().rpc("update_lead_with_audit", {
    p_id: id,
    p_patch: patch,
    p_activity: activity,
    p_events: events
  });

  if (error) throw databaseError("update lead with audit", error);
}

export async function decideSupabaseApproval(
  id: string,
  decision: "approved" | "rejected",
  note: string,
  decidedBy: string,
  activity: HermesActivity,
  event: InteractionEvent
) {
  const { data, error } = await getAdminClient().rpc("decide_approval_bundle", {
    p_id: id,
    p_decision: decision,
    p_note: note,
    p_decided_by: decidedBy,
    p_activity: activity,
    p_event: event
  });

  if (error) throw databaseError("decide approval", error);
  return data === true;
}

type UpsertSpec = {
  table: string;
  rows: Record<string, unknown>[];
};

async function upsertRows(client: SupabaseClient, spec: UpsertSpec) {
  if (spec.rows.length === 0) return;
  const { error } = await client.from(spec.table).upsert(spec.rows, { onConflict: "id" });
  if (error) throw databaseError(`import ${spec.table}`, error);
}

export async function importSupabaseStore(store: Store) {
  const client = getAdminClient();

  const specs: UpsertSpec[] = [
    {
      table: "customers",
      rows: store.customers.map((item) => ({ id: item.id, name: item.name, data: item }))
    },
    {
      table: "contractors",
      rows: store.contractors.map((item) => ({
        id: item.id,
        company: item.company,
        status: item.status,
        data: item
      }))
    },
    { table: "leads", rows: store.leads.map(leadRow) },
    {
      table: "jobs",
      rows: store.jobs.map((item) => ({
        id: item.id,
        customer_id: item.customerId,
        contractor_id: item.contractorId ?? null,
        status: item.status,
        data: item
      }))
    },
    {
      table: "compliance_documents",
      rows: store.documents.map((item) => ({
        id: item.id,
        contractor_id: item.contractorId,
        status: item.status,
        expires_at: item.expiresAt ?? null,
        storage_path: null,
        data: item
      }))
    },
    {
      table: "zones",
      rows: store.zones.map((item) => ({
        id: item.id,
        name: item.name,
        trade: item.trade,
        status: item.status,
        data: item
      }))
    },
    {
      table: "approval_requests",
      rows: store.approvalRequests.map((item) => ({
        id: item.id,
        created_at: item.createdAt,
        status: item.status,
        risk_level: item.riskLevel,
        related_record_id: item.relatedRecordId ?? null,
        data: item
      }))
    },
    {
      table: "hermes_activity",
      rows: store.hermesActivity.map((item) => ({
        id: item.id,
        created_at: item.createdAt,
        related_record_id: item.relatedRecordId ?? null,
        data: item
      }))
    },
    {
      table: "kpi_snapshots",
      rows: store.kpiSnapshots.map((item) => ({
        id: item.id,
        created_at: item.createdAt,
        data: item
      }))
    },
    { table: "interaction_events", rows: store.events.map(eventRow) },
    {
      table: "learning_records",
      rows: store.learningRecords.map((item) => ({
        id: item.id,
        created_at: item.createdAt,
        action_status: item.actionStatus,
        data: item
      }))
    },
    {
      table: "celina_actions",
      rows: store.celinaActions.map((item) => ({
        id: item.id,
        created_at: item.createdAt,
        status: item.status,
        learning_record_id: item.learningRecordId ?? null,
        data: item
      }))
    }
  ];

  for (const spec of specs) await upsertRows(client, spec);
}

export async function checkSupabaseConnection() {
  const { error, count } = await getAdminClient()
    .from("leads")
    .select("id", { count: "exact", head: true });

  if (error) throw databaseError("health check", error);
  return { backend: "supabase" as const, leadCount: count ?? 0 };
}

export async function checkPublicRateLimitSchema() {
  const { error } = await getAdminClient().from("public_request_limits").select("key").limit(0);
  if (error) throw databaseError("abuse protection schema", error);
}

export async function consumePublicRateLimit(key: string, limit: number, seconds: number) {
  const { data, error } = await getAdminClient().rpc("consume_public_request_limit", {
    p_key: key, p_limit: limit, p_seconds: seconds
  });
  if (error) throw databaseError("public request limit", error);
  if (!data || typeof data.allowed !== "boolean" || !Number.isFinite(data.retryAfter) || data.retryAfter < 1) {
    throw new Error("Invalid rate limit result.");
  }
  return data as { allowed: boolean; retryAfter: number };
}
