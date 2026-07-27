import "server-only";

import {
  contractorEligibleForLead,
  DEFAULT_MINIMUM_CONTRACTOR_COVERAGE,
  isContractorOpen,
  MAX_CONTRACTOR_ATTEMPTS,
  planPhoneRouting
} from "@/lib/phone-routing";
import {
  createPhoneLead,
  findLeadByVapiCallId,
  getStore,
  markContractorAssigned,
  recordEvent,
  updateLeadWithAudit
} from "@/lib/store";
import type {
  Contractor,
  HermesActivity,
  InteractionEvent,
  Lead,
  PhoneInquiryKind,
  PhoneRoutingState,
  PhoneRoutingStatus
} from "@/lib/types";
import {
  buildWarmTransferDestination,
  normalizeE164,
  placeContractorFollowUpCall,
  vapiOutboundConfigurationError
} from "@/lib/vapi";

type VapiCall = {
  id?: string;
  customer?: { number?: string };
  metadata?: Record<string, unknown>;
};

type PhoneInquiryParameters = Record<string, unknown>;

export class NoTransferDestinationError extends Error {}

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
  return Number.isInteger(configured) && configured > 0 ? configured : DEFAULT_MINIMUM_CONTRACTOR_COVERAGE;
}

function recheckMinutes() {
  const configured = Number(process.env.PHONE_ROUTING_RECHECK_MINUTES);
  return Number.isFinite(configured) && configured >= 15 ? configured : 60;
}

function nextFollowUp(now = new Date(), minutes = 15) {
  return new Date(now.getTime() + minutes * 60_000).toISOString();
}

function routingEvent(
  lead: Lead,
  kind: InteractionEvent["kind"],
  label: string,
  outcome: string,
  metadata: Record<string, string> = {},
  contractorId?: string
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
    contractorId,
    outcome,
    confidence: 1,
    riskLevel: lead.safetyCritical ? "critical" : "low",
    metadata
  };
}

function activity(lead: Lead, action: string, result: string): HermesActivity {
  return {
    id: uid("act"),
    createdAt: new Date().toISOString(),
    module: "Phone Routing",
    action,
    result,
    relatedRecordId: lead.id
  };
}

function routingAction(status: PhoneRoutingStatus) {
  if (status === "transfer_ready") return "transfer";
  if (status === "logged_only") return "logged";
  return "follow_up";
}

export async function capturePhoneInquiry(call: VapiCall, parameters: PhoneInquiryParameters) {
  const callId = text(call.id, 120);
  if (!callId) throw new Error("Vapi call ID is missing.");
  const kind = inquiryKind(parameters.inquiryKind);
  const normalizedCallbackNumber =
    normalizeE164(text(parameters.callbackNumber, 40)) || normalizeE164(call.customer?.number);
  const callbackNumber = normalizedCallbackNumber || text(parameters.callbackNumber || call.customer?.number, 40);
  const consentToShare = kind === "service" && boolean(parameters.consentToShare);
  const city = text(parameters.city, 80);
  const postalCode = text(parameters.postalCode, 12);
  if (kind === "service" && !normalizedCallbackNumber) {
    throw new Error("Confirm a valid U.S. callback number before saving this service inquiry.");
  }
  if (kind === "service" && !city && !postalCode) {
    throw new Error("Confirm the service city or postal code before saving this service inquiry.");
  }
  const lead = await createPhoneLead({
    vapiCallId: callId,
    inquiryKind: kind,
    callerName: text(parameters.callerName, 100) || "Phone caller",
    callbackNumber,
    email: text(parameters.email, 160) || undefined,
    serviceType: text(parameters.serviceType, 100) || (kind === "service" ? "General service" : "Not applicable"),
    issue: text(parameters.issue, 500),
    summary: text(parameters.summary, 240),
    address: text(parameters.address, 180) || undefined,
    city: city || undefined,
    postalCode: postalCode || undefined,
    urgency: text(parameters.urgency, 80) || undefined,
    consentToShare
  });

  let phoneRouting: PhoneRoutingState;
  let event: InteractionEvent;
  if (kind !== "service" || !consentToShare) {
    phoneRouting = {
      ...lead.phoneRouting!,
      status: "logged_only",
      failureReason: kind === "service" ? "Caller did not consent to contractor sharing." : "Non-service inquiry."
    };
    event = routingEvent(
      lead,
      "phone_routing_queued",
      kind === "service" ? "Saved service inquiry without sharing" : "Logged non-service phone inquiry",
      "logged_only",
      { inquiryKind: kind }
    );
  } else {
    const store = await getStore();
    const plan = planPhoneRouting(lead, store.contractors, {
      minimumCoverage: minimumCoverage(),
      coverageRecheckMinutes: recheckMinutes()
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
      plan.status === "transfer_ready" ? "phone_routing_ready" : "phone_routing_queued",
      plan.status === "transfer_ready" ? "Phone lead ready for contractor transfer" : "Phone lead queued for follow-up",
      plan.status,
      { eligibleContractors: String(plan.eligibleCount), status: plan.status }
    );
  }

  await updateLeadWithAudit(
    lead.id,
    {
      phoneRouting,
      status: phoneRouting.status === "logged_only" ? "logged" : phoneRouting.status
    },
    [],
    [event]
  );

  const action = routingAction(phoneRouting.status);
  return {
    saved: true,
    leadId: lead.id,
    routingStatus: phoneRouting.status,
    action,
    message:
      action === "transfer"
        ? "The inquiry is saved and eligible for a contractor transfer."
        : action === "follow_up"
          ? "The inquiry is saved for follow-up."
          : "The inquiry is saved; no transfer is needed."
  };
}

function candidateForTransfer(lead: Lead, contractors: Contractor[]) {
  const routing = lead.phoneRouting!;
  const contractorById = new Map(contractors.map((contractor) => [contractor.id, contractor]));
  return routing.candidateContractorIds
    .filter((id) => !routing.attemptedContractorIds.includes(id))
    .map((id) => contractorById.get(id))
    .find(
      (contractor): contractor is Contractor =>
        Boolean(contractor && contractorEligibleForLead(lead, contractor) && isContractorOpen(contractor))
    );
}

export async function destinationForInboundCall(call: VapiCall) {
  const callId = text(call.id, 120);
  const lead = await findLeadByVapiCallId(callId);
  if (!lead?.phoneRouting) throw new NoTransferDestinationError("Save the inquiry before requesting a transfer.");
  const store = await getStore();
  const contractor = candidateForTransfer(lead, store.contractors);
  if (!contractor) {
    const attempted = lead.phoneRouting.attemptedContractorIds.length;
    const status: PhoneRoutingStatus = attempted >= MAX_CONTRACTOR_ATTEMPTS ? "exhausted" : "queued_follow_up";
    const phoneRouting: PhoneRoutingState = {
      ...lead.phoneRouting,
      status,
      nextAttemptAt: status === "queued_follow_up" ? nextFollowUp() : undefined,
      failureReason: "No untried open contractor is available."
    };
    await updateLeadWithAudit(
      lead.id,
      { phoneRouting, status },
      status === "exhausted" ? [activity(lead, "Exhausted contractor transfer attempts", "Lead retained for follow-up.")] : []
    );
    throw new NoTransferDestinationError("No additional contractor is available. The lead is saved for follow-up.");
  }

  const attemptedContractorIds = [...new Set([...lead.phoneRouting.attemptedContractorIds, contractor.id])];
  const phoneRouting: PhoneRoutingState = {
    ...lead.phoneRouting,
    status: "transfer_attempted",
    attemptedContractorIds,
    lastAttemptAt: new Date().toISOString(),
    failureReason: undefined
  };
  await updateLeadWithAudit(
    lead.id,
    { phoneRouting, status: "transfer_attempted" },
    [],
    [
      routingEvent(
        lead,
        "phone_transfer_attempted",
        `Attempted contractor ${attemptedContractorIds.length} of ${MAX_CONTRACTOR_ATTEMPTS}`,
        "transfer_attempted",
        { attempt: String(attemptedContractorIds.length) },
        contractor.id
      )
    ]
  );
  await markContractorAssigned(contractor.id);
  return buildWarmTransferDestination(lead, contractor);
}

function destinationNumber(message: Record<string, unknown>) {
  const destination = message.destination as Record<string, unknown> | undefined;
  return normalizeE164(text(destination?.number, 40));
}

export async function recordTransferUpdate(call: VapiCall, message: Record<string, unknown>) {
  const status = text(message.status, 40).toLowerCase();
  if (status.includes("fail") || status.includes("cancel")) return;
  const lead = await findLeadByVapiCallId(text(call.id, 120));
  if (!lead?.phoneRouting || lead.phoneRouting.status === "transferred") return;
  const store = await getStore();
  const number = destinationNumber(message);
  const contractor =
    store.contractors.find((item) => normalizeE164(item.routingProfile?.phoneNumber) === number) ??
    store.contractors.find((item) => item.id === lead.phoneRouting?.attemptedContractorIds.at(-1));
  if (!contractor) return;

  const phoneRouting: PhoneRoutingState = {
    ...lead.phoneRouting,
    status: "transferred",
    selectedContractorId: contractor.id,
    failureReason: undefined
  };
  await updateLeadWithAudit(
    lead.id,
    { phoneRouting, status: "transferred" },
    [activity(lead, "Completed contractor warm transfer", contractor.company)],
    [
      routingEvent(
        lead,
        "phone_transfer_completed",
        "Phone lead connected to contractor",
        "transferred",
        {},
        contractor.id
      )
    ]
  );
}

function metadataString(call: VapiCall, key: string) {
  return text(call.metadata?.[key], 160);
}

export async function recordContractorLeadResponse(call: VapiCall, parameters: Record<string, unknown>) {
  const leadId = metadataString(call, "leadId");
  const contractorId = metadataString(call, "contractorId");
  const store = await getStore();
  const lead = store.leads.find((item) => item.id === leadId);
  const contractor = store.contractors.find((item) => item.id === contractorId);
  if (!lead?.phoneRouting || !contractor) throw new Error("The follow-up call metadata is invalid.");
  if (!lead.phoneRouting.consentToShare) throw new Error("The caller did not consent to contractor sharing.");

  const accepted = boolean(parameters.accepted);
  if (accepted) {
    const phoneRouting: PhoneRoutingState = {
      ...lead.phoneRouting,
      status: "contractor_notified",
      selectedContractorId: contractor.id,
      failureReason: undefined
    };
    await updateLeadWithAudit(
      lead.id,
      { phoneRouting, status: "contractor_notified", lastFollowUpAt: new Date().toISOString() },
      [activity(lead, "Contractor accepted queued phone lead", contractor.company)],
      [
        routingEvent(
          lead,
          "contractor_contacted",
          "Contractor accepted queued phone lead",
          "accepted",
          {},
          contractor.id
        )
      ]
    );
    return { recorded: true, accepted: true, message: "Acceptance recorded. Share the callback number and end politely." };
  }

  const exhausted = lead.phoneRouting.attemptedContractorIds.length >= MAX_CONTRACTOR_ATTEMPTS;
  const phoneRouting: PhoneRoutingState = {
    ...lead.phoneRouting,
    status: exhausted ? "exhausted" : "queued_follow_up",
    nextAttemptAt: exhausted ? undefined : nextFollowUp(),
    failureReason: text(parameters.note, 120) || "Contractor declined the lead."
  };
  await updateLeadWithAudit(
    lead.id,
    { phoneRouting, status: phoneRouting.status, lastFollowUpAt: new Date().toISOString() },
    exhausted ? [activity(lead, "Exhausted contractor follow-up attempts", "Lead retained for manual follow-up.")] : [],
    [
      routingEvent(
        lead,
        "contractor_contacted",
        "Contractor declined queued phone lead",
        exhausted ? "exhausted" : "declined",
        {},
        contractor.id
      )
    ]
  );
  return { recorded: true, accepted: false, message: "Response recorded. Thank the contractor and end politely." };
}

async function recordOutboundCallEnd(call: VapiCall, message: Record<string, unknown>) {
  const leadId = metadataString(call, "leadId");
  const contractorId = metadataString(call, "contractorId");
  const store = await getStore();
  const lead = store.leads.find((item) => item.id === leadId);
  if (!lead?.phoneRouting || lead.phoneRouting.status !== "follow_up_in_progress") return;
  if (lead.phoneRouting.vapiFollowUpCallId && lead.phoneRouting.vapiFollowUpCallId !== call.id) return;
  const exhausted = lead.phoneRouting.attemptedContractorIds.length >= MAX_CONTRACTOR_ATTEMPTS;
  const phoneRouting: PhoneRoutingState = {
    ...lead.phoneRouting,
    status: exhausted ? "exhausted" : "queued_follow_up",
    nextAttemptAt: exhausted ? undefined : nextFollowUp(),
    failureReason: text(message.endedReason, 80) || "Contractor follow-up ended without acceptance."
  };
  await updateLeadWithAudit(
    lead.id,
    { phoneRouting, status: phoneRouting.status },
    exhausted ? [activity(lead, "Exhausted contractor follow-up attempts", "Lead retained for manual follow-up.")] : [],
    [
      routingEvent(
        lead,
        "follow_up_failed",
        "Contractor follow-up ended without acceptance",
        exhausted ? "exhausted" : "retry_queued",
        {},
        contractorId || undefined
      )
    ]
  );
}

export async function recordCallEnd(call: VapiCall, message: Record<string, unknown>) {
  if (metadataString(call, "purpose") === "contractor-follow-up") {
    await recordOutboundCallEnd(call, message);
    return;
  }
  const callId = text(call.id, 120);
  let lead = await findLeadByVapiCallId(callId);
  if (!lead && callId) {
    lead = await createPhoneLead({
      vapiCallId: callId,
      inquiryKind: "other",
      callerName: "Incomplete phone intake",
      callbackNumber: normalizeE164(call.customer?.number) || text(call.customer?.number, 40),
      serviceType: "Not specified",
      issue: "Caller disconnected before completing intake.",
      summary: "Caller disconnected before completing intake.",
      consentToShare: false
    });
  }
  if (!lead?.phoneRouting || lead.phoneRouting.completedCallLoggedAt) return;
  let status = lead.phoneRouting.status;
  let nextAttemptAt = lead.phoneRouting.nextAttemptAt;
  if (status === "collecting") status = "logged_only";
  if (status === "transfer_ready" || status === "transfer_attempted") {
    const hasUntried = lead.phoneRouting.candidateContractorIds.some(
      (id) => !lead.phoneRouting!.attemptedContractorIds.includes(id)
    );
    status = hasUntried ? "queued_follow_up" : "exhausted";
    nextAttemptAt = hasUntried ? nextFollowUp() : undefined;
  }
  const phoneRouting: PhoneRoutingState = {
    ...lead.phoneRouting,
    status,
    nextAttemptAt,
    completedCallLoggedAt: new Date().toISOString()
  };
  await updateLeadWithAudit(
    lead.id,
    { phoneRouting, status },
    status === "exhausted" ? [activity(lead, "Completed phone intake without a transfer", "Lead retained for follow-up.")] : [],
    [
      routingEvent(lead, "call_completed", "Inbound phone call completed", status, {
        endedReason: text(message.endedReason, 80) || "unknown"
      })
    ]
  );
}

const QUEUED_STATUSES: PhoneRoutingStatus[] = [
  "queued_coverage",
  "queued_after_hours",
  "queued_follow_up",
  "configuration_required"
];

async function markExhausted(lead: Lead) {
  const phoneRouting: PhoneRoutingState = {
    ...lead.phoneRouting!,
    status: "exhausted",
    nextAttemptAt: undefined,
    failureReason: "The maximum of three contractor attempts was reached."
  };
  await updateLeadWithAudit(
    lead.id,
    { phoneRouting, status: "exhausted" },
    [activity(lead, "Exhausted contractor follow-up attempts", "Lead retained for manual follow-up.")]
  );
}

export async function processDuePhoneFollowUps(now = new Date()) {
  const store = await getStore();
  const configuredLimit = Number(process.env.PHONE_FOLLOW_UP_BATCH_SIZE);
  const limit = Number.isInteger(configuredLimit) && configuredLimit > 0 ? Math.min(configuredLimit, 25) : 10;
  const due = store.leads
    .filter((lead) => lead.phoneRouting && QUEUED_STATUSES.includes(lead.phoneRouting.status))
    .filter((lead) => !lead.phoneRouting!.nextAttemptAt || new Date(lead.phoneRouting!.nextAttemptAt).getTime() <= now.getTime())
    .sort(
      (a, b) =>
        new Date(a.phoneRouting!.nextAttemptAt || a.createdAt).getTime() -
        new Date(b.phoneRouting!.nextAttemptAt || b.createdAt).getTime()
    )
    .slice(0, limit);
  const result = { reviewed: due.length, started: 0, queued: 0, exhausted: 0, failed: 0 };

  for (const lead of due) {
    const routing = lead.phoneRouting!;
    if (!routing.consentToShare || routing.inquiryKind !== "service") continue;
    if (routing.attemptedContractorIds.length >= MAX_CONTRACTOR_ATTEMPTS) {
      await markExhausted(lead);
      result.exhausted += 1;
      continue;
    }

    const plan = planPhoneRouting(lead, store.contractors, {
      now,
      minimumCoverage: minimumCoverage(),
      coverageRecheckMinutes: recheckMinutes()
    });
    if (plan.status !== "transfer_ready") {
      const phoneRouting: PhoneRoutingState = {
        ...routing,
        status: plan.status,
        candidateContractorIds: plan.candidates.map(({ contractor }) => contractor.id),
        nextAttemptAt: plan.nextAttemptAt,
        failureReason: plan.reason
      };
      await updateLeadWithAudit(lead.id, { phoneRouting, status: plan.status });
      result.queued += 1;
      continue;
    }

    const contractor = plan.candidates
      .map(({ contractor: candidate }) => candidate)
      .find(
        (candidate) =>
          !routing.attemptedContractorIds.includes(candidate.id) && isContractorOpen(candidate, now)
      );
    if (!contractor) {
      const nextPlan = planPhoneRouting(lead, store.contractors, {
        now: new Date(now.getTime() + 15 * 60_000),
        minimumCoverage: minimumCoverage(),
        coverageRecheckMinutes: recheckMinutes()
      });
      const phoneRouting: PhoneRoutingState = {
        ...routing,
        status: "queued_after_hours",
        nextAttemptAt: nextPlan.nextAttemptAt ?? nextFollowUp(now),
        failureReason: "Remaining candidate contractors are currently closed."
      };
      await updateLeadWithAudit(lead.id, { phoneRouting, status: "queued_after_hours" });
      result.queued += 1;
      continue;
    }

    const configurationError = vapiOutboundConfigurationError();
    if (configurationError) {
      const shouldLog = routing.failureReason !== configurationError;
      const phoneRouting: PhoneRoutingState = {
        ...routing,
        status: "configuration_required",
        nextAttemptAt: nextFollowUp(now, recheckMinutes()),
        failureReason: configurationError
      };
      await updateLeadWithAudit(lead.id, { phoneRouting, status: "configuration_required" });
      if (shouldLog) {
        await recordEvent({
          kind: "system_error",
          source: "Phone Router",
          label: "Contractor follow-up requires Vapi configuration",
          relatedRecordId: lead.id,
          leadId: lead.id,
          outcome: "configuration_required"
        });
      }
      result.failed += 1;
      continue;
    }

    const attemptedContractorIds = [...new Set([...routing.attemptedContractorIds, contractor.id])];
    const claimed: PhoneRoutingState = {
      ...routing,
      status: "follow_up_in_progress",
      candidateContractorIds: plan.candidates.map(({ contractor: candidate }) => candidate.id),
      attemptedContractorIds,
      lastAttemptAt: now.toISOString(),
      nextAttemptAt: undefined,
      failureReason: undefined
    };
    await updateLeadWithAudit(
      lead.id,
      { phoneRouting: claimed, status: "follow_up_in_progress" },
      [],
      [
        routingEvent(
          lead,
          "contractor_contacted",
          "Started queued contractor follow-up",
          "follow_up_started",
          { attempt: String(attemptedContractorIds.length) },
          contractor.id
        )
      ]
    );
    await markContractorAssigned(contractor.id, now);

    try {
      const callId = await placeContractorFollowUpCall({ ...lead, phoneRouting: claimed }, contractor);
      await updateLeadWithAudit(lead.id, {
        phoneRouting: { ...claimed, vapiFollowUpCallId: callId }
      });
      result.started += 1;
    } catch (error) {
      const exhausted = attemptedContractorIds.length >= MAX_CONTRACTOR_ATTEMPTS;
      const phoneRouting: PhoneRoutingState = {
        ...claimed,
        status: exhausted ? "exhausted" : "queued_follow_up",
        nextAttemptAt: exhausted ? undefined : nextFollowUp(now),
        failureReason: text(error instanceof Error ? error.message : error, 160)
      };
      await updateLeadWithAudit(
        lead.id,
        { phoneRouting, status: phoneRouting.status },
        exhausted ? [activity(lead, "Exhausted contractor follow-up attempts", "Lead retained for manual follow-up.")] : [],
        [routingEvent(lead, "follow_up_failed", "Could not start contractor follow-up", phoneRouting.status, {}, contractor.id)]
      );
      result.failed += 1;
    }
  }

  return result;
}
