import "server-only";

import { brandConfig, coreServices, serviceAreas } from "@/lib/config";
import { updateLeadRevenueDeskState } from "@/lib/store";
import type { HermesActivity, InteractionEvent, Lead } from "@/lib/types";
import { sendLeadReplyEmail } from "@/lib/zoho-mail";

type RevenueDeskWebhookReply = {
  subject?: string;
  body?: string;
  replySubject?: string;
  replyBody?: string;
  status?: string;
  nextAction?: string;
};

const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

function requiresHuman(lead: Lead) {
  return (
    lead.safetyCritical ||
    lead.type === "emergency" ||
    lead.type === "commercial_quote" ||
    lead.type === "contractor" ||
    lead.type === "hiring"
  );
}

function leadSummary(lead: Lead) {
  const service = lead.details.serviceType || lead.details.fuelType || lead.details.roleInterest || lead.type.replaceAll("_", " ");
  const phoneLead = lead.source === "Vapi Phone";
  return {
    id: lead.id,
    createdAt: lead.createdAt,
    source: lead.source,
    type: lead.type,
    status: lead.status,
    name: lead.name,
    company: lead.company,
    phone: lead.phone,
    email: lead.email,
    siteAddress: lead.siteAddress,
    zone: lead.zone,
    service,
    safetyCritical: lead.safetyCritical,
    hermesRecommendation: lead.hermesRecommendation,
    details: phoneLead
      ? {
          inquiryKind: lead.details.inquiryKind,
          summary: lead.details.summary,
          city: lead.details.city,
          postalCode: lead.details.postalCode,
          urgency: lead.details.urgency,
          consentToShare: lead.details.consentToShare
        }
      : lead.details,
    phoneRouting: phoneLead
      ? {
          status: lead.phoneRouting?.status,
          nextAttemptAt: lead.phoneRouting?.nextAttemptAt
        }
      : undefined,
    chatTranscript: phoneLead ? undefined : lead.chatTranscript
  };
}

function fallbackReply(lead: Lead) {
  const urgent = requiresHuman(lead);
  const phoneLead = lead.source === "Vapi Phone";
  const subject = urgent
    ? "We received your Conquistador Oil request"
    : "Thanks for contacting Conquistador Oil";
  const body = urgent
    ? phoneLead
      ? [
          `Hi ${lead.name},`,
          "",
          "Thank you for calling Conquistador Oil. The virtual assistant recorded your request and flagged it for human review.",
          "",
          "We will use the confirmed contact details you provided to follow up. If conditions become dangerous, contact the appropriate local emergency service directly.",
          "",
          "Conquistador Oil",
          brandConfig.email
        ].join("\n")
      : [
        `Hi ${lead.name},`,
        "",
        "Thank you for contacting Conquistador Oil. We received your request and flagged it for human review.",
        "",
        `If this is urgent, involves no heat, or needs immediate attention, please call ${brandConfig.phone} now so a person can review the situation as quickly as possible.`,
        "",
        "We will use the details you submitted to follow up.",
        "",
        "Conquistador Oil",
        brandConfig.phone,
        brandConfig.email
      ].join("\n")
    : [
        `Hi ${lead.name},`,
        "",
        "Thank you for contacting Conquistador Oil. We received your request and the Conquistador Revenue Desk is reviewing the details.",
        "",
        "We will follow up using the contact information you provided. If anything is urgent, please call us directly.",
        "",
        "Conquistador Oil",
        brandConfig.phone,
        brandConfig.email
      ].join("\n");
  return { subject, body };
}

async function callRevenueDeskWebhook(lead: Lead): Promise<RevenueDeskWebhookReply | null> {
  const url = process.env.HERMES_REVENUE_DESK_WEBHOOK_URL;
  if (!url) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
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
        mode: lead.source === "Vapi Phone" ? "phone_inquiry" : "website_inquiry",
        autoReplyAllowed: true,
        humanRequired: requiresHuman(lead),
        business: {
          name: brandConfig.name,
          phone: brandConfig.phone,
          email: brandConfig.email,
          address: `${brandConfig.streetAddress}, ${brandConfig.city}, ${brandConfig.state} ${brandConfig.postalCode}`,
          services: coreServices,
          serviceAreas
        },
        guardrails: [
          "Do not promise pricing.",
          "Do not guarantee dispatch or response time.",
          "Do not claim licensing or availability beyond approved business data.",
          "Emergency, no-heat, safety, pricing, hiring decisions, and contractor approvals require human attention.",
          "Never call, transfer to, or claim to contact 911.",
          lead.source === "Vapi Phone"
            ? "Urgent phone inquiries require human follow-up; do not route the caller back into the same phone assistant."
            : `For urgent issues, tell the customer to call ${brandConfig.phone}.`
        ],
        lead: leadSummary(lead)
      }),
      signal: controller.signal
    });

    if (!response.ok) throw new Error(`Revenue Desk webhook returned HTTP ${response.status}`);
    return (await response.json().catch(() => ({}))) as RevenueDeskWebhookReply;
  } finally {
    clearTimeout(timeout);
  }
}

export async function routeLeadToRevenueDesk(lead: Lead) {
  const at = new Date().toISOString();
  const activities: HermesActivity[] = [];
  const events: InteractionEvent[] = [];
  let deliveryStatus: Lead["hermesDeliveryStatus"] = requiresHuman(lead) ? "needs_human" : "sent";
  let webhookDelivered = false;
  let reply = fallbackReply(lead);
  let webhookNote = "Revenue Desk webhook is not configured; used conservative local reply template.";

  try {
    const webhookReply = await callRevenueDeskWebhook(lead);
    if (webhookReply) {
      webhookDelivered = true;
      webhookNote = webhookReply.nextAction || "Revenue Desk webhook accepted the lead.";
      reply = {
        subject: webhookReply.replySubject || webhookReply.subject || reply.subject,
        body: webhookReply.replyBody || webhookReply.body || reply.body
      };
    } else {
      deliveryStatus = "failed";
    }
  } catch (err) {
    deliveryStatus = "failed";
    webhookNote = err instanceof Error ? err.message : String(err);
  }

  const mail = await sendLeadReplyEmail({ lead, subject: reply.subject, body: reply.body });
  const emailStatus: Lead["outboundEmailStatus"] =
    mail.status === "sent" ? "sent" : mail.status === "skipped" ? "skipped" : "failed";
  const finalDeliveryStatus: Lead["hermesDeliveryStatus"] =
    requiresHuman(lead) ? "needs_human" : deliveryStatus === "sent" && mail.status === "sent" ? "replied" : deliveryStatus;

  activities.push({
    id: uid("act"),
    createdAt: at,
    module: "Conquistador Revenue Desk",
    action: `Processed ${lead.source} inquiry`,
    result: `${webhookNote} Email status: ${mail.status}${mail.status === "failed" ? ` (${mail.error})` : ""}.`,
    relatedRecordId: lead.id
  });

  events.push({
    id: uid("evt"),
    createdAt: at,
    kind: "revenue_desk_delivery",
    eventType: "revenue_desk_delivery",
    source: "Conquistador Revenue Desk",
    actor: "CelinaAmenBot",
    label: `Revenue Desk delivery ${finalDeliveryStatus}`,
    leadType: lead.type,
    relatedRecordId: lead.id,
    leadId: lead.id,
    recommendation: webhookNote,
    outcome: finalDeliveryStatus || "failed",
    revenueImpact: 0,
    confidence: finalDeliveryStatus === "failed" ? 0.25 : 0.72,
    riskLevel: requiresHuman(lead) ? "high" : "low",
    metadata: {
      deliveryStatus: finalDeliveryStatus || "failed",
      webhookNote
    }
  });

  if (mail.status === "sent") {
    events.push({
      id: uid("evt"),
      createdAt: at,
      kind: "email_reply_sent",
      eventType: "email_reply_sent",
      source: "Zoho",
      actor: "CelinaAmenBot",
      label: reply.subject,
      leadType: lead.type,
      relatedRecordId: lead.id,
      leadId: lead.id,
      recommendation: reply.body,
      outcome: "reply_sent",
      revenueImpact: 0,
      confidence: 0.8,
      riskLevel: requiresHuman(lead) ? "medium" : "low",
      metadata: { messageId: mail.messageId || "" }
    });
  }

  await updateLeadRevenueDeskState(
    lead.id,
    {
      status: requiresHuman(lead) ? "needs_human" : lead.status,
      hermesDeliveryStatus: finalDeliveryStatus,
      hermesReplyText: reply.body,
      outboundEmailStatus: emailStatus,
      lastFollowUpAt: at
    },
    activities,
    events
  );

  return {
    webhookDelivered,
    deliveryStatus: finalDeliveryStatus,
    emailStatus
  };
}
