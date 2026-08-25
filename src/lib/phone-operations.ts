import "server-only";

import {
  DEFAULT_MINIMUM_CONTRACTOR_COVERAGE,
  planPhoneRouting
} from "@/lib/phone-routing";
import { routeLeadToRevenueDesk } from "@/lib/revenue-desk";
import {
  claimPhoneHandoff,
  createPhoneLead,
  findLeadByVapiCallId,
  getStore,
  updateLeadWithAudit
} from "@/lib/store";
import type {
  InteractionEvent,
  Lead,
  PhoneInquiryHandoffResult,
  PhoneInquiryKind,
  PhoneRoutingState,
  PhoneRoutingStatus
} from "@/lib/types";
import { normalizeE164 } from "@/lib/vapi";
import { sendPhoneLeadNotificationEmail } from "@/lib/zoho-mail";

type VapiCall = {
  id?: string;
  customer?: { number?: string };
};

type PhoneInquiryParameters = Record<string, unknown>;

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
const inFlightInquiries = new Map<string, Promise<PhoneInquiryHandoffResult>>();

function text(value: unknown, maximum: number) {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

function boolean(value: unknown) {
  if (typeof value === "boolean") return value;
  return String(value).toLowerCase() === "true";
}

function inquiryKind(value: unknown): PhoneInquiryKind {
  const normalized = text(value, 30).toLowerCase();
  const allowed: PhoneInquiryKind[] = ["service", "billing", "careers", "supplier", "complaint", "other"];
  return allowed.includes(normalized as PhoneInquiryKind) ? (normalized as PhoneInquiryKind) : "other";
}

function minimumCoverage() {
  const configured = Number(process.env.PHONE_ROUTING_MIN_CONTRACTORS);
  return Number.isInteger(configured) && configured > 0
    ? configured
    : DEFAULT_MINIMUM_CONTRACTOR_COVERAGE;
}

function routingEvent(
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
    source: "Phone Router",
    actor: "Deterministic routing policy",
    label,
    leadType: lead.type,
    relatedRecordId: lead.id,
    leadId: lead.id,
    outcome,
    confidence: 1,
    riskLevel: lead.safetyCritical ? "critical" : "low",
    metadata
  };
}

function routingAction(status: PhoneRoutingStatus) {
  if (status === "logged_only") return "logged" as const;
  return "follow_up" as const;
}

/**
 * Capture one compact, caller-confirmed lead. The local store supports the
 * admin view during development; the Hermes webhook is the production handoff.
 * No transcript, recording, or full Vapi message history is forwarded.
 */
async function capturePhoneInquiryOnce(
  callId: string,
  call: VapiCall,
  parameters: PhoneInquiryParameters
): Promise<PhoneInquiryHandoffResult> {
  const kind = inquiryKind(parameters.inquiryKind);
  const normalizedCallbackNumber =
    normalizeE164(text(parameters.callbackNumber, 40)) || normalizeE164(call.customer?.number);
  const callbackNumber =
    normalizedCallbackNumber || text(parameters.callbackNumber || call.customer?.number, 40);
  const consentToShare = kind === "service" && boolean(parameters.consentToShare);
  const city = text(parameters.city, 80);
  const postalCode = text(parameters.postalCode, 12);

  if (kind === "service" && !normalizedCallbackNumber) {
    throw new Error("Confirm a valid U.S. callback number before saving this service inquiry.");
  }
  if (kind === "service" && !city && !postalCode) {
    throw new Error("Confirm the service city or postal code before saving this service inquiry.");
  }

  const existingLead = await findLeadByVapiCallId(callId);
  if (existingLead?.phoneRouting?.handoffResult) {
    return existingLead.phoneRouting.handoffResult;
  }

  let lead = existingLead ?? await createPhoneLead({
    vapiCallId: callId,
    inquiryKind: kind,
    callerName: text(parameters.callerName, 100) || "Phone caller",
    callbackNumber,
    email: text(parameters.email, 160) || undefined,
    serviceType:
      text(parameters.serviceType, 100) || (kind === "service" ? "General service" : "Not applicable"),
    issue: text(parameters.issue, 500),
    summary: text(parameters.summary, 240),
    address: text(parameters.address, 180) || undefined,
    city: city || undefined,
    postalCode: postalCode || undefined,
    urgency: text(parameters.urgency, 80) || undefined,
    consentToShare
  });

  const claimToken = uid("handoff");
  const claimedLead = await claimPhoneHandoff(lead, claimToken);
  if (!claimedLead) {
    const currentLead = await findLeadByVapiCallId(callId);
    if (currentLead?.phoneRouting?.handoffResult) return currentLead.phoneRouting.handoffResult;

    return {
      saved: true,
      leadId: lead.id,
      routingStatus: lead.phoneRouting?.status ?? "collecting",
      action: "follow_up",
      transferDestinations: [],
      message: "The inquiry is saved and is already being processed by the Revenue Desk."
    };
  }
  lead = claimedLead;

  let phoneRouting: PhoneRoutingState;
  let event: InteractionEvent;

  if (kind !== "service" || !consentToShare) {
    phoneRouting = {
      ...lead.phoneRouting!,
      status: "logged_only",
      failureReason:
        kind === "service"
          ? "Caller did not consent to contractor sharing."
          : "Non-service inquiry."
    };
    event = routingEvent(
      lead,
      "phone_routing_queued",
      kind === "service"
        ? "Saved service inquiry without contractor sharing"
        : "Logged non-service phone inquiry",
      "logged_only",
      { inquiryKind: kind }
    );
  } else {
    const store = await getStore();
    const plan = planPhoneRouting(lead, store.contractors, {
      minimumCoverage: minimumCoverage()
    });
    phoneRouting = {
      ...lead.phoneRouting!,
      status: plan.status,
      candidateContractorIds: plan.candidates.map(({ contractor }) => contractor.id),
      nextAttemptAt: plan.nextAttemptAt,
      failureReason: plan.status === "transfer_ready" ? undefined : plan.reason
    };
    event = routingEvent(
      lead,
      plan.status === "transfer_ready"
        ? "phone_routing_ready"
        : "phone_routing_queued",
      plan.status === "transfer_ready"
        ? "Phone lead has eligible contractors for Revenue Desk follow-up"
        : "Phone lead handed to Revenue Desk for follow-up",
      plan.status,
      {
        eligibleContractors: String(plan.eligibleCount),
        status: plan.status
      }
    );
  }

  const status = phoneRouting.status === "logged_only" ? "logged" : phoneRouting.status;
  await updateLeadWithAudit(lead.id, { phoneRouting, status }, [], [event]);

  const routedLead: Lead = { ...lead, phoneRouting, status };
  const delivery = await routeLeadToRevenueDesk(routedLead);
  const notification = await sendPhoneLeadNotificationEmail(routedLead);
  const saved =
    delivery.webhookDelivered || notification.status === "sent";
  const action = saved
    ? routingAction(phoneRouting.status)
    : "handoff_failed";

  const result: PhoneInquiryHandoffResult = {
    saved,
    leadId: lead.id,
    routingStatus: phoneRouting.status,
    action,
    // The saved inbound assistant is follow-up only and has no transfer tool.
    // Keep candidate IDs in the CRM routing record, not phone numbers in model output.
    transferDestinations: [],
    message:
      action === "handoff_failed"
        ? "The Revenue Desk handoff is temporarily unavailable."
        : action === "follow_up"
          ? "The inquiry was handed to the Revenue Desk for follow-up."
          : "The inquiry was handed to the Revenue Desk; no live transfer is needed."
  };

  await updateLeadWithAudit(lead.id, {
    phoneRouting: {
      ...phoneRouting,
      handoffCompletedAt: new Date().toISOString(),
      handoffResult: result
    }
  });

  return result;
}

export async function capturePhoneInquiry(
  call: VapiCall,
  parameters: PhoneInquiryParameters
): Promise<PhoneInquiryHandoffResult> {
  const callId = text(call.id, 120);
  if (!callId) throw new Error("Vapi call ID is missing.");

  const inFlight = inFlightInquiries.get(callId);
  if (inFlight) return inFlight;

  const task = capturePhoneInquiryOnce(callId, call, parameters);
  inFlightInquiries.set(callId, task);
  try {
    return await task;
  } finally {
    if (inFlightInquiries.get(callId) === task) {
      inFlightInquiries.delete(callId);
    }
  }
}
