import "server-only";

import { brandConfig } from "@/lib/config";
import { createLead, getStore, updateLeadWithAudit } from "@/lib/store";
import type { HermesActivity, InteractionEvent, Lead } from "@/lib/types";
import { createVapiContractorCall } from "@/lib/vapi-outbound";
import {
  normalizeUsPhone,
  validateContractorProspect,
  type ContractorProspectInput
} from "@/lib/vapi-outbound-policy";
import { sendInternalNotificationEmail } from "@/lib/zoho-mail";

type VapiOutboundCall = {
  id?: string;
  metadata?: Record<string, unknown>;
};

type ContractorOutreachParameters = Record<string, unknown>;

type ContractorOutreachResult = {
  saved: boolean;
  leadId: string;
  disposition: string;
  message: string;
};

type OutreachDisposition =
  | "interested"
  | "follow_up"
  | "declined"
  | "do_not_call"
  | "wrong_number"
  | "voicemail";

const DISPOSITIONS = new Set<OutreachDisposition>([
  "interested",
  "follow_up",
  "declined",
  "do_not_call",
  "wrong_number",
  "voicemail"
]);

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const inFlightOutcomes = new Map<string, Promise<ContractorOutreachResult>>();

function text(value: unknown, maximum: number) {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function boolean(value: unknown) {
  return typeof value === "boolean" ? value : String(value).toLowerCase() === "true";
}

function list(value: unknown, maximumItems = 12) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => text(item, 100)).filter(Boolean).slice(0, maximumItems);
}

function event(
  lead: Lead,
  kind: InteractionEvent["kind"],
  label: string,
  outcome: string,
  metadata: Record<string, string> = {}
): InteractionEvent {
  return {
    id: uid("evt"),
    createdAt: new Date().toISOString(),
    kind,
    eventType: kind,
    source: "Vapi Outbound",
    actor: "Contractor outreach assistant",
    label,
    leadType: "contractor",
    relatedRecordId: lead.id,
    leadId: lead.id,
    outcome,
    confidence: 1,
    riskLevel: outcome === "do_not_call" ? "high" : "low",
    metadata
  };
}

function activity(lead: Lead, action: string, result: string): HermesActivity {
  return {
    id: uid("act"),
    createdAt: new Date().toISOString(),
    module: "Contractor Outreach",
    action,
    result,
    relatedRecordId: lead.id
  };
}

function suppressedLead(leads: Lead[], phone: string) {
  return leads.find((lead) => {
    if (normalizeUsPhone(lead.phone) !== phone) return false;
    return (
      lead.status === "do_not_call" ||
      lead.details.outreachDisposition === "do_not_call" ||
      lead.details.doNotCall === "true"
    );
  });
}

function recentOpenOutreach(leads: Lead[], phone: string, now: Date) {
  const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
  return leads.find((lead) => {
    if (normalizeUsPhone(lead.phone) !== phone) return false;
    const createdAt = new Date(lead.createdAt).getTime();
    return (
      Number.isFinite(createdAt) &&
      createdAt >= cutoff &&
      ["outreach_queued", "outreach_call_queued"].includes(lead.status)
    );
  });
}

export async function startContractorOutreach(input: ContractorProspectInput, now = new Date()) {
  const validation = validateContractorProspect(input, now);
  if (!validation.ok) throw new Error(validation.error);
  const prospect = validation.prospect;
  const store = await getStore();

  if (suppressedLead(store.leads, prospect.phone)) {
    throw new Error("This number is on the Conquistador Oil do-not-call list.");
  }
  if (recentOpenOutreach(store.leads, prospect.phone, now)) {
    throw new Error("An outreach call to this number was already queued within the last 24 hours.");
  }

  const form = new FormData();
  form.set("source", "Vapi Outbound");
  form.set("name", prospect.contactName || prospect.company);
  form.set("company", prospect.company);
  form.set("phone", prospect.phone);
  form.set("zone", prospect.city || "Unknown");
  form.set("serviceType", prospect.serviceHint || "Unconfirmed contractor services");
  form.set("prospectSource", prospect.source);
  form.set("targetTimeZone", prospect.targetTimeZone);
  form.set("lineType", prospect.lineType);
  form.set("consentBasis", prospect.consentBasis);
  form.set("complianceConfirmed", "true");
  form.set("outreachDisposition", "queued");

  const lead = await createLead(form, "contractor");
  await updateLeadWithAudit(
    lead.id,
    { status: "outreach_queued" },
    [activity(lead, "Approved one contractor outreach call", `Operator supplied ${prospect.consentBasis} as the contact basis.`)],
    [event(lead, "contractor_contacted", "Outbound contractor call approved", "approved_for_call", {
      lineType: prospect.lineType,
      consentBasis: prospect.consentBasis
    })]
  );

  try {
    const call = await createVapiContractorCall({ ...lead, status: "outreach_queued" }, prospect);
    await updateLeadWithAudit(
      lead.id,
      {
        status: "outreach_call_queued",
        details: {
          ...lead.details,
          vapiCallId: call.id,
          vapiCallStatus: call.status,
          outreachDisposition: "queued"
        }
      },
      [activity(lead, "Queued Vapi contractor call", `Vapi accepted call ${call.id}.`)],
      [event(lead, "contractor_contacted", "Vapi contractor call queued", call.status, { vapiCallId: call.id })]
    );
    return { leadId: lead.id, callId: call.id, status: call.status };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await updateLeadWithAudit(
      lead.id,
      { status: "outreach_failed" },
      [activity(lead, "Vapi contractor call failed", message.slice(0, 240))],
      [event(lead, "system_error", "Vapi contractor call failed", "failed", { message: message.slice(0, 240) })]
    );
    throw error;
  }
}

async function sendHermesContractorOutreach(lead: Lead, callId: string) {
  const url = process.env.HERMES_REVENUE_DESK_WEBHOOK_URL?.trim();
  if (!url) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.HERMES_REVENUE_DESK_SECRET
          ? { Authorization: `Bearer ${process.env.HERMES_REVENUE_DESK_SECRET}` }
          : {})
      },
      body: JSON.stringify({
        targetAgent: "Conquistador Revenue Desk",
        mode: "contractor_outreach",
        autoReplyAllowed: false,
        humanRequired: true,
        guardrails: [
          "Do not approve contractors automatically.",
          "Do not promise jobs, pricing, volume, exclusivity, or dispatch.",
          "Honor do-not-call outcomes immediately.",
          "Use only the confirmed structured fields; no transcript or recording is attached."
        ],
        lead: {
          id: lead.id,
          vapiCallId: callId,
          createdAt: lead.createdAt,
          company: lead.company,
          contactName: lead.name,
          phone: lead.phone,
          email: lead.email,
          area: lead.zone,
          status: lead.status,
          details: {
            outreachDisposition: lead.details.outreachDisposition,
            contactRole: lead.details.contactRole,
            services: lead.details.services,
            serviceAreas: lead.details.serviceAreas,
            businessHours: lead.details.businessHours,
            afterHoursAvailable: lead.details.afterHoursAvailable,
            preferredLeadTypes: lead.details.preferredLeadTypes,
            licensingConfirmed: lead.details.licensingConfirmed,
            insuranceConfirmed: lead.details.insuranceConfirmed,
            w9Ready: lead.details.w9Ready,
            followUpPreference: lead.details.followUpPreference,
            permissionToFollowUp: lead.details.permissionToFollowUp,
            summary: lead.details.summary
          }
        }
      }),
      signal: controller.signal
    });
    if (!response.ok) throw new Error(`Hermes webhook returned HTTP ${response.status}.`);
    return true;
  } finally {
    clearTimeout(timeout);
  }
}

async function deliverContractorOutreach(lead: Lead, callId: string) {
  const to =
    process.env.CONTRACTOR_OUTREACH_NOTIFICATION_EMAIL ||
    process.env.ZOHO_FROM_EMAIL ||
    brandConfig.email;
  const body = [
    "Structured Vapi contractor outreach result",
    "",
    `Lead ID: ${lead.id}`,
    `Company: ${lead.company || "Not confirmed"}`,
    `Contact: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email || "Not provided"}`,
    `Disposition: ${lead.details.outreachDisposition}`,
    `Services: ${lead.details.services || "Not confirmed"}`,
    `Service areas: ${lead.details.serviceAreas || "Not confirmed"}`,
    `Business hours: ${lead.details.businessHours || "Not confirmed"}`,
    `After-hours availability: ${lead.details.afterHoursAvailable || "false"}`,
    `Preferred leads: ${lead.details.preferredLeadTypes || "Not confirmed"}`,
    `License confirmed verbally: ${lead.details.licensingConfirmed || "false"}`,
    `Insurance confirmed verbally: ${lead.details.insuranceConfirmed || "false"}`,
    `W-9 ready: ${lead.details.w9Ready || "false"}`,
    `Follow-up preference: ${lead.details.followUpPreference || "Not provided"}`,
    `Permission to follow up: ${lead.details.permissionToFollowUp || "false"}`,
    "",
    `Summary: ${lead.details.summary || "No summary provided."}`,
    "",
    "No transcript, recording, or raw Vapi artifact is attached. Human vetting is required."
  ].join("\n");

  const [mail, hermes] = await Promise.allSettled([
    sendInternalNotificationEmail({
      to,
      subject: `[Contractor outreach] ${lead.details.outreachDisposition} - ${lead.company || lead.name}`,
      body,
      replyTo: lead.email,
      messageId: `<contractor-outreach.${callId.replace(/[^a-zA-Z0-9.-]/g, "")}@conquistadoroil.com>`
    }),
    sendHermesContractorOutreach(lead, callId)
  ]);
  const emailSent = mail.status === "fulfilled" && mail.value.status === "sent";
  const hermesDelivered = hermes.status === "fulfilled" && hermes.value;
  return {
    delivered: Boolean(emailSent || hermesDelivered),
    emailStatus: emailSent ? "sent" as const : "failed" as const,
    hermesDelivered: Boolean(hermesDelivered)
  };
}

async function recoverProspectFromCall(call: VapiOutboundCall) {
  const metadata = call.metadata ?? {};
  if (text(metadata.purpose, 80) !== "contractor_discovery") return null;

  const company = text(metadata.company, 120);
  const phone = normalizeUsPhone(metadata.phone);
  if (!company || !phone) return null;

  const form = new FormData();
  form.set("source", "Vapi Outbound Webhook Recovery");
  form.set("name", text(metadata.contactName, 100) || company);
  form.set("company", company);
  form.set("phone", phone);
  form.set("zone", text(metadata.city, 100) || "Unknown");
  form.set("serviceType", text(metadata.serviceHint, 180) || "Unconfirmed contractor services");
  form.set("prospectSource", text(metadata.prospectSource, 240));
  form.set("targetTimeZone", text(metadata.targetTimeZone, 80));
  form.set("lineType", text(metadata.lineType, 40));
  form.set("consentBasis", text(metadata.consentBasis, 80));
  form.set("outreachDisposition", "webhook_recovered");
  return createLead(form, "contractor");
}

async function captureContractorOutreachOnce(
  callId: string,
  leadId: string,
  call: VapiOutboundCall,
  parameters: ContractorOutreachParameters
): Promise<ContractorOutreachResult> {
  const store = await getStore();
  let existing = store.leads.find(
    (lead) => lead.id === leadId || lead.details.vapiCallId === callId
  );
  if (!existing) {
    existing = await recoverProspectFromCall(call) ?? undefined;
  }
  if (!existing) throw new Error("The contractor prospect record was not found.");
  leadId = existing.id;

  if (
    existing.details.outreachDeliveryCompletedAt &&
    existing.details.outreachDeliverySucceeded === "true"
  ) {
    return {
      saved: true,
      leadId: existing.id,
      disposition: existing.details.outreachDisposition,
      message: "This call outcome was already saved and delivered."
    };
  }

  let updated = existing;
  let disposition = existing.details.outreachDisposition as OutreachDisposition;
  if (!existing.details.outreachCompletedAt) {
    const suppliedDisposition = text(parameters.disposition, 30).toLowerCase();
    disposition = DISPOSITIONS.has(suppliedDisposition as OutreachDisposition)
      ? suppliedDisposition as OutreachDisposition
      : "declined";
    const company = text(parameters.companyName, 120) || existing.company || existing.name;
    const contactName = text(parameters.contactName, 100) || existing.name;
    const email = text(parameters.email, 160) || undefined;
    const services = list(parameters.services).join(", ");
    const serviceAreas = list(parameters.serviceAreas).join(", ");
    const preferredLeadTypes = list(parameters.preferredLeadTypes).join(", ");
    const permissionToFollowUp = disposition === "do_not_call" ? false : boolean(parameters.permissionToFollowUp);
    const status = {
      interested: "outreach_qualified",
      follow_up: "outreach_follow_up",
      declined: "outreach_declined",
      do_not_call: "do_not_call",
      wrong_number: "wrong_number",
      voicemail: "outreach_voicemail"
    }[disposition];

    updated = {
      ...existing,
      status,
      name: contactName,
      company,
      email,
      zone: serviceAreas || existing.zone,
      details: {
        ...existing.details,
        vapiCallId: callId,
        outreachDisposition: disposition,
        outreachCompletedAt: new Date().toISOString(),
        contactRole: text(parameters.contactRole, 100),
        services,
        serviceAreas,
        businessHours: text(parameters.businessHours, 200),
        afterHoursAvailable: String(boolean(parameters.afterHoursAvailable)),
        preferredLeadTypes,
        licensingConfirmed: String(boolean(parameters.licensingConfirmed)),
        insuranceConfirmed: String(boolean(parameters.insuranceConfirmed)),
        w9Ready: String(boolean(parameters.w9Ready)),
        followUpPreference: text(parameters.followUpPreference, 160),
        permissionToFollowUp: String(permissionToFollowUp),
        doNotCall: String(disposition === "do_not_call"),
        summary: text(parameters.summary, 240)
      }
    };

    await updateLeadWithAudit(
      leadId,
      updated,
      [activity(updated, "Captured contractor outreach result", `${disposition}: ${updated.details.summary || "No summary."}`)],
      [event(updated, "contractor_interaction", "Contractor outreach completed", disposition, {
        vapiCallId: callId,
        permissionToFollowUp: String(permissionToFollowUp)
      })]
    );
  }

  if (!DISPOSITIONS.has(disposition)) disposition = "declined";
  const delivery = await deliverContractorOutreach(updated, callId);
  await updateLeadWithAudit(
    leadId,
    {
      details: {
        ...updated.details,
        outreachDeliveryCompletedAt: new Date().toISOString(),
        outreachDeliverySucceeded: String(delivery.delivered)
      },
      hermesDeliveryStatus: delivery.hermesDelivered ? "sent" : delivery.delivered ? "needs_human" : "failed",
      outboundEmailStatus: delivery.emailStatus
    },
    [activity(
      updated,
      "Delivered contractor outreach result",
      delivery.delivered ? "Internal Zoho or Hermes handoff succeeded." : "Both internal handoffs failed."
    )],
    [event(updated, "revenue_desk_delivery", "Contractor outreach handoff", delivery.delivered ? "delivered" : "failed")]
  );

  return {
    saved: delivery.delivered,
    leadId,
    disposition,
    message: delivery.delivered
      ? "The structured contractor outcome was delivered for human review."
      : "The structured outcome was captured locally, but the durable handoff failed."
  };
}

export async function captureContractorOutreach(
  call: VapiOutboundCall,
  parameters: ContractorOutreachParameters
): Promise<ContractorOutreachResult> {
  const callId = text(call.id, 120);
  const leadId = text(call.metadata?.leadId, 160);
  if (!callId || !leadId) throw new Error("Vapi call metadata is missing.");

  const inFlight = inFlightOutcomes.get(callId);
  if (inFlight) return inFlight;

  const task = captureContractorOutreachOnce(callId, leadId, call, parameters);
  inFlightOutcomes.set(callId, task);
  try {
    return await task;
  } finally {
    if (inFlightOutcomes.get(callId) === task) {
      inFlightOutcomes.delete(callId);
    }
  }
}
