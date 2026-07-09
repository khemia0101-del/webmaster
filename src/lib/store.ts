import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { seedStore } from "@/data/seed";
import { buildLeadArtifacts, classifyLead, isSafetyCritical, recommendationFor } from "@/lib/hermes";
import {
  applyDecision as sbApplyDecision,
  findApproval as sbFindApproval,
  insertActivity as sbInsertActivity,
  insertEvent as sbInsertEvent,
  insertLead as sbInsertLead,
  readStore as sbReadStore,
  supabaseConfigured,
  updateLead as sbUpdateLead
} from "@/lib/supabase";
import type { ApprovalRequest, HermesActivity, InteractionEvent, Lead, LeadType, Store } from "@/lib/types";

const dataDir =
  process.env.DATA_DIR ||
  (process.env.VERCEL ? path.join("/tmp", "conquistador-data") : path.join(process.cwd(), ".data"));
const runtimePath = path.join(dataDir, "conquistador-store.json");

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

async function readLocalStore(): Promise<Store> {
  try {
    const raw = await fs.readFile(runtimePath, "utf8");
    const parsed = JSON.parse(raw) as Partial<Store>;
    // Backfill collections added after a store file was first written.
    if (!parsed.events) parsed.events = [];
    return parsed as Store;
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(runtimePath, JSON.stringify(seedStore, null, 2));
    return seedStore;
  }
}

async function writeLocalStore(store: Store) {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(runtimePath, JSON.stringify(store, null, 2));
}

export async function getStore(): Promise<Store> {
  if (supabaseConfigured()) return sbReadStore();
  return readLocalStore();
}

/** Append a single interaction/failure signal (used for error capture etc.). */
export async function recordEvent(
  partial: Omit<InteractionEvent, "id" | "createdAt"> & { id?: string; createdAt?: string }
): Promise<InteractionEvent> {
  const event: InteractionEvent = {
    id: partial.id ?? uid("evt"),
    createdAt: partial.createdAt ?? new Date().toISOString(),
    ...partial
  };
  if (supabaseConfigured()) {
    await sbInsertEvent(event);
    return event;
  }
  const store = await readLocalStore();
  store.events.unshift(event);
  await writeLocalStore(store);
  return event;
}

export async function createLead(form: FormData, fallbackType: LeadType) {
  const entries = Object.fromEntries(
    Array.from(form.entries()).map(([key, value]) => [key, String(value)])
  ) as Record<string, string>;
  const type = classifyLead(entries, fallbackType);
  const safetyCritical = isSafetyCritical(entries);
  const lead: Lead = {
    id: `lead-${Date.now()}`,
    createdAt: new Date().toISOString(),
    source: entries.source || "Website",
    type,
    status: safetyCritical ? "human_escalation" : type === "contractor" ? "vetting" : "new",
    hermesDeliveryStatus: "pending",
    outboundEmailStatus: entries.email ? "pending" : "not_applicable",
    chatTranscript: entries.chatTranscript,
    name: entries.name || entries.company || "Unnamed lead",
    company: entries.company,
    phone: entries.phone || "",
    email: entries.email,
    siteAddress: entries.siteAddress || entries.address,
    zone: entries.zone || "Lancaster",
    details: entries,
    paymentRequirement:
      type === "commercial_audit" || type === "contractor"
        ? "No payment needed for this intake."
        : "Payment collected, authorized, financed, or terms-matched before routing unless safety-critical.",
    hermesRecommendation: recommendationFor(type, safetyCritical),
    safetyCritical
  };

  const artifacts = buildLeadArtifacts(lead);

  // Interaction signals captured for the learning loop.
  const events: InteractionEvent[] = [
    {
      id: uid("evt"),
      createdAt: lead.createdAt,
      kind: "form_submitted",
      source: lead.source,
      label: `${lead.type} intake submitted`,
      leadType: lead.type,
      relatedRecordId: lead.id,
      metadata: { zone: lead.zone, safetyCritical: String(lead.safetyCritical) }
    },
    {
      id: uid("evt"),
      createdAt: lead.createdAt,
      kind: "lead_classified",
      source: "Hermes",
      label: lead.hermesRecommendation,
      leadType: lead.type,
      relatedRecordId: lead.id,
      hermesRecommended: lead.hermesRecommendation
    }
  ];

  if (entries.experimentId && entries.variantId) {
    events.push({
      id: uid("evt"),
      createdAt: lead.createdAt,
      kind: "experiment_conversion",
      source: lead.source,
      label: `${entries.experimentId}:${entries.variantId} conversion`,
      leadType: lead.type,
      relatedRecordId: lead.id,
      metadata: {
        experimentId: entries.experimentId,
        variantId: entries.variantId,
        conversion: "form_submitted"
      }
    });
  }

  if (supabaseConfigured()) {
    await sbInsertLead(lead, artifacts.approvals, artifacts.activity, events);
    return lead;
  }

  const store = await readLocalStore();
  store.leads.unshift(lead);
  store.approvalRequests.unshift(...artifacts.approvals);
  store.hermesActivity.unshift(...artifacts.activity);
  store.events.unshift(...events);
  await writeLocalStore(store);

  return lead;
}

export async function updateLeadRevenueDeskState(
  id: string,
  patch: Pick<Partial<Lead>, "status" | "hermesDeliveryStatus" | "hermesReplyText" | "outboundEmailStatus" | "lastFollowUpAt">,
  activity: HermesActivity[] = [],
  events: InteractionEvent[] = []
) {
  if (supabaseConfigured()) {
    await sbUpdateLead(id, patch);
    for (const item of activity) {
      await sbInsertActivity(item);
    }
    for (const item of events) {
      await sbInsertEvent(item);
    }
    return;
  }

  const store = await readLocalStore();
  const lead = store.leads.find((item) => item.id === id);
  if (lead) Object.assign(lead, patch);
  store.hermesActivity.unshift(...activity);
  store.events.unshift(...events);
  await writeLocalStore(store);
}

/**
 * Record an operator's decision on an approval. This is the human-in-the-loop
 * gate: it updates the approval, writes an audit-log entry, and emits a learning
 * signal (what Hermes recommended vs. what the human decided).
 */
export async function decideApproval(
  id: string,
  decision: "approved" | "rejected",
  note = "",
  decidedBy = "Operator"
): Promise<boolean> {
  const at = new Date().toISOString();

  const buildAudit = (approval: ApprovalRequest): HermesActivity => ({
    id: uid("act"),
    createdAt: at,
    module: "Approval Queue",
    action: `${decision === "approved" ? "Approved" : "Rejected"} - ${approval.title}`,
    result: note || `${decidedBy} ${decision} this approval.`,
    relatedRecordId: approval.relatedRecordId
  });

  const buildSignal = (approval: ApprovalRequest): InteractionEvent => ({
    id: uid("evt"),
    createdAt: at,
    kind: "approval_decided",
    source: "Admin",
    label: `${decision} ${approval.triggeringRule || approval.type}`,
    relatedRecordId: approval.relatedRecordId,
    triggeringRule: approval.triggeringRule || approval.type,
    hermesRecommended: approval.title,
    humanDecision: decision,
    agreed: decision === "approved"
  });

  if (supabaseConfigured()) {
    const existing = await sbFindApproval(id);
    if (!existing) return false;
    const updated: ApprovalRequest = {
      ...existing,
      status: decision,
      decidedAt: at,
      decisionNote: note,
      decidedBy
    };
    await sbApplyDecision(updated, buildAudit(updated), buildSignal(updated));
    return true;
  }

  const store = await readLocalStore();
  const approval = store.approvalRequests.find((a) => a.id === id);
  if (!approval) return false;

  approval.status = decision;
  approval.decidedAt = at;
  approval.decisionNote = note;
  approval.decidedBy = decidedBy;

  store.hermesActivity.unshift(buildAudit(approval));
  store.events.unshift(buildSignal(approval));

  await writeLocalStore(store);
  return true;
}

export async function exportStoreJson() {
  return JSON.stringify(await getStore(), null, 2);
}

export async function exportLeadsCsv() {
  const store = await getStore();
  const rows = [
    ["createdAt", "type", "status", "hermesDeliveryStatus", "outboundEmailStatus", "name", "company", "phone", "email", "siteAddress", "zone", "safetyCritical"],
    ...store.leads.map((lead) => [
      lead.createdAt,
      lead.type,
      lead.status,
      lead.hermesDeliveryStatus ?? "",
      lead.outboundEmailStatus ?? "",
      lead.name,
      lead.company ?? "",
      lead.phone,
      lead.email ?? "",
      lead.siteAddress ?? "",
      lead.zone,
      String(lead.safetyCritical)
    ])
  ];

  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(",")
    )
    .join("\n");
}
