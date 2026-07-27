import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { seedStore } from "@/data/seed";
import { buildLeadArtifacts, classifyLead, isSafetyCritical, recommendationFor } from "@/lib/hermes";
import {
  applyDecision as sbApplyDecision,
  findApproval as sbFindApproval,
  findLeadByVapiCallId as sbFindLeadByVapiCallId,
  insertActivity as sbInsertActivity,
  insertEvent as sbInsertEvent,
  insertLead as sbInsertLead,
  readStore as sbReadStore,
  supabaseConfigured,
  updateContractor as sbUpdateContractor,
  updateLead as sbUpdateLead
} from "@/lib/supabase";
import type {
  ApprovalRequest,
  HermesActivity,
  InteractionEvent,
  Lead,
  LeadType,
  PhoneInquiryKind,
  PhoneRoutingState,
  Store
} from "@/lib/types";

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
    if (!parsed.learningRecords) parsed.learningRecords = [];
    if (!parsed.celinaActions) parsed.celinaActions = [];
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
    eventType: partial.eventType ?? partial.kind,
    actor: partial.actor ?? partial.source,
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
      eventType: "form_submitted",
      source: lead.source,
      actor: "Website visitor",
      label: `${lead.type} intake submitted`,
      leadType: lead.type,
      relatedRecordId: lead.id,
      leadId: lead.id,
      outcome: "lead_created",
      revenueImpact: 0,
      confidence: 0.8,
      riskLevel: lead.safetyCritical ? "critical" : "low",
      metadata: { zone: lead.zone, safetyCritical: String(lead.safetyCritical) }
    },
    {
      id: uid("evt"),
      createdAt: lead.createdAt,
      kind: "lead_classified",
      eventType: "lead_classified",
      source: "Hermes",
      actor: "CelinaAmenBot",
      label: lead.hermesRecommendation,
      leadType: lead.type,
      relatedRecordId: lead.id,
      leadId: lead.id,
      hermesRecommended: lead.hermesRecommendation,
      recommendation: lead.hermesRecommendation,
      outcome: safetyCritical ? "human_escalation" : "queued_next_action",
      confidence: safetyCritical ? 1 : 0.72,
      riskLevel: safetyCritical ? "critical" : "medium"
    }
  ];

  if (entries.experimentId && entries.variantId) {
    events.push({
      id: uid("evt"),
      createdAt: lead.createdAt,
      kind: "experiment_conversion",
      eventType: "experiment_conversion",
      source: lead.source,
      actor: "Website visitor",
      label: `${entries.experimentId}:${entries.variantId} conversion`,
      leadType: lead.type,
      relatedRecordId: lead.id,
      leadId: lead.id,
      experimentId: entries.experimentId,
      outcome: "converted_to_lead",
      revenueImpact: 0,
      confidence: 0.7,
      riskLevel: "low",
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

export type PhoneLeadInput = {
  vapiCallId: string;
  inquiryKind: PhoneInquiryKind;
  callerName: string;
  callbackNumber: string;
  email?: string;
  serviceType: string;
  issue: string;
  summary: string;
  address?: string;
  city?: string;
  postalCode?: string;
  urgency?: string;
  consentToShare: boolean;
};

function phoneFallbackType(input: PhoneLeadInput): LeadType {
  if (input.inquiryKind === "careers") return "hiring";
  if (input.inquiryKind !== "service") return "other";
  const service = `${input.serviceType} ${input.issue}`.toLowerCase();
  if (/diesel|fuel|heating oil|oil delivery|kerosene/.test(service)) return "fuel";
  if (/commercial|property manager|multi[ -]?site/.test(service)) return "commercial_quote";
  return "other";
}

/** Persist one structured phone inquiry. Raw transcripts and recordings never enter the store. */
export async function createPhoneLead(input: PhoneLeadInput): Promise<Lead> {
  const existing = await findLeadByVapiCallId(input.vapiCallId);
  if (existing) return existing;

  const createdAt = new Date().toISOString();
  const details: Record<string, string> = {
    inquiryKind: input.inquiryKind,
    serviceType: input.serviceType,
    issue: input.issue,
    summary: input.summary,
    city: input.city ?? "",
    postalCode: input.postalCode ?? "",
    urgency: input.urgency ?? "Not specified",
    consentToShare: String(input.consentToShare)
  };
  const fallback = phoneFallbackType(input);
  const type = classifyLead(details, fallback);
  const safetyCritical = isSafetyCritical(details);
  const callSuffix = input.vapiCallId.replace(/[^a-zA-Z0-9]/g, "").slice(-12) || Math.random().toString(16).slice(2);
  const routing: PhoneRoutingState = {
    vapiCallId: input.vapiCallId,
    inquiryKind: input.inquiryKind,
    serviceType: input.serviceType,
    consentToShare: input.consentToShare,
    status: "collecting",
    candidateContractorIds: [],
    attemptedContractorIds: []
  };
  const lead: Lead = {
    id: `lead-phone-${Date.now()}-${callSuffix}`,
    createdAt,
    source: "Vapi Phone",
    type,
    status: safetyCritical ? "human_escalation" : "new",
    hermesDeliveryStatus: "pending",
    outboundEmailStatus: "not_applicable",
    name: input.callerName || "Phone caller",
    phone: input.callbackNumber,
    email: input.email,
    siteAddress: input.address,
    zone: input.city || input.postalCode || "Unknown",
    details,
    paymentRequirement: "No payment is collected or authorized by the phone assistant.",
    hermesRecommendation: recommendationFor(type, safetyCritical),
    safetyCritical,
    phoneRouting: routing
  };

  const artifacts = buildLeadArtifacts(lead);
  const events: InteractionEvent[] = [
    {
      id: uid("evt"),
      createdAt,
      kind: "phone_inquiry_logged",
      eventType: "phone_inquiry_logged",
      source: "Vapi",
      actor: "Phone assistant",
      label: `Logged ${input.inquiryKind} phone inquiry`,
      leadType: type,
      relatedRecordId: lead.id,
      leadId: lead.id,
      outcome: "lead_created",
      confidence: 1,
      riskLevel: safetyCritical ? "critical" : "low",
      metadata: {
        inquiryKind: input.inquiryKind,
        serviceType: input.serviceType,
        zone: lead.zone,
        consentToShare: String(input.consentToShare)
      }
    }
  ];

  if (supabaseConfigured()) {
    try {
      await sbInsertLead(lead, artifacts.approvals, artifacts.activity, events);
    } catch (error) {
      const duplicate = await sbFindLeadByVapiCallId(input.vapiCallId).catch(() => null);
      if (duplicate) return duplicate;
      throw error;
    }
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

export async function findLeadByVapiCallId(callId: string): Promise<Lead | null> {
  if (!callId) return null;
  if (supabaseConfigured()) return sbFindLeadByVapiCallId(callId);
  const store = await getStore();
  return store.leads.find((lead) => lead.phoneRouting?.vapiCallId === callId) ?? null;
}

export async function updateLeadWithAudit(
  id: string,
  patch: Partial<Lead>,
  activity: HermesActivity[] = [],
  events: InteractionEvent[] = []
) {
  if (supabaseConfigured()) {
    await sbUpdateLead(id, patch);
    for (const item of activity) await sbInsertActivity(item);
    for (const item of events) await sbInsertEvent(item);
    return;
  }

  const store = await readLocalStore();
  const lead = store.leads.find((item) => item.id === id);
  if (!lead) throw new Error(`Lead ${id} was not found.`);
  Object.assign(lead, patch);
  store.hermesActivity.unshift(...activity);
  store.events.unshift(...events);
  await writeLocalStore(store);
}

export async function markContractorAssigned(contractorId: string, at = new Date()) {
  const store = await getStore();
  const contractor = store.contractors.find((item) => item.id === contractorId);
  if (!contractor?.routingProfile) return;
  const assignmentDate = at.toISOString().slice(0, 10);
  const routingProfile = {
    ...contractor.routingProfile,
    lastAssignedAt: at.toISOString(),
    assignmentsDate: assignmentDate,
    assignmentsToday:
      contractor.routingProfile.assignmentsDate === assignmentDate
        ? (contractor.routingProfile.assignmentsToday ?? 0) + 1
        : 1
  };

  if (supabaseConfigured()) {
    await sbUpdateContractor(contractorId, { routingProfile });
    return;
  }
  const local = await readLocalStore();
  const localContractor = local.contractors.find((item) => item.id === contractorId);
  if (!localContractor) return;
  localContractor.routingProfile = routingProfile;
  await writeLocalStore(local);
}

export async function updateLeadRevenueDeskState(
  id: string,
  patch: Pick<Partial<Lead>, "status" | "hermesDeliveryStatus" | "hermesReplyText" | "outboundEmailStatus" | "lastFollowUpAt">,
  activity: HermesActivity[] = [],
  events: InteractionEvent[] = []
) {
  await updateLeadWithAudit(id, patch, activity, events);
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
    eventType: "approval_decided",
    source: "Admin",
    actor: decidedBy,
    label: `${decision} ${approval.triggeringRule || approval.type}`,
    relatedRecordId: approval.relatedRecordId,
    leadId: approval.relatedRecordId?.startsWith("lead-") ? approval.relatedRecordId : undefined,
    triggeringRule: approval.triggeringRule || approval.type,
    hermesRecommended: approval.title,
    recommendation: approval.summary,
    humanDecision: decision,
    outcome: decision,
    confidence: approval.riskScore ? Math.min(1, approval.riskScore / 100) : 0.8,
    riskLevel: approval.riskLevel,
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
    ["createdAt", "type", "status", "phoneRoutingStatus", "nextPhoneAttemptAt", "hermesDeliveryStatus", "outboundEmailStatus", "name", "company", "phone", "email", "siteAddress", "zone", "safetyCritical"],
    ...store.leads.map((lead) => [
      lead.createdAt,
      lead.type,
      lead.status,
      lead.phoneRouting?.status ?? "",
      lead.phoneRouting?.nextAttemptAt ?? "",
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
