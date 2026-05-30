import { prohibitedClaims } from "@/lib/config";
import type {
  ApprovalRequest,
  Contractor,
  HermesActivity,
  Job,
  Lead,
  LeadType,
  Zone
} from "@/lib/types";

const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;

export function classifyLead(input: Record<string, string>, fallback: LeadType): LeadType {
  const text = Object.values(input).join(" ").toLowerCase();
  if (text.includes("no heat") || text.includes("emergency") || text.includes("urgent")) return "emergency";
  if (text.includes("contractor") || text.includes("insurance") || text.includes("truck")) return "contractor";
  if (text.includes("quote") || text.includes("terms")) return "commercial_quote";
  if (text.includes("property") || text.includes("multi-site")) return "property_manager";
  return fallback;
}

export function isSafetyCritical(input: Record<string, string>) {
  const text = Object.values(input).join(" ").toLowerCase();
  return (
    text.includes("no heat") ||
    text.includes("elder") ||
    text.includes("daycare") ||
    text.includes("vulnerable") ||
    text.includes("safety")
  );
}

export function claimViolations(copy: string) {
  const normalized = copy.toLowerCase();
  return prohibitedClaims.filter((claim) => normalized.includes(claim));
}

export function contractorReadiness(contractor: Contractor) {
  if (contractor.status === "blocked") return "Blocked from routing.";
  if (contractor.missingDocuments.length > 0) {
    return `Missing ${contractor.missingDocuments.join(", ")}. Keep in vetting.`;
  }
  if (contractor.status !== "active") return "Not active yet. Route only a low-risk test job after approval.";
  return "Active and eligible for recommendations.";
}

export function evaluateJob(job: Job) {
  const approvals: string[] = [];
  if (job.spread < 150) approvals.push("Below minimum margin floor.");
  if (job.paymentStatus === "not_secured") approvals.push("Customer funds are not secured.");
  return {
    canRecommendRouting: approvals.length === 0,
    summary: approvals.length ? approvals.join(" ") : "Margin and payment checks pass."
  };
}

export function recommendDispatch(job: Job, contractors: Contractor[], zones: Zone[]) {
  const zone = zones.find((item) => item.name === job.zone && item.trade === job.trade);
  const eligible = contractors
    .filter((contractor) => contractor.status === "active")
    .filter((contractor) => contractor.trades.includes(job.trade))
    .filter((contractor) => contractor.zones.includes(job.zone))
    .filter((contractor) => contractor.missingDocuments.length === 0)
    .sort((a, b) => b.score - a.score);

  if (!zone || zone.status === "Red") return "Do not promise dispatch. Zone readiness is Red or unknown.";
  if (eligible.length === 0) return "No compliant active contractor is eligible for this trade and zone.";
  return `Recommend ${eligible[0].company}. ${zone.name} is ${zone.status}; confirm human approval before routing.`;
}

// Transparency metadata for each escalation (Technical Review Rec #4). The rule
// strings here are the grouping keys the learning module aggregates on, so keep
// them stable.
type GateMeta = { rule: string; riskScore: number; explanation: string };

const GATES: Record<string, GateMeta> = {
  safety_escalation: {
    rule: "Safety carve-out (no-heat / vulnerable occupants / safety incident)",
    riskScore: 100,
    explanation:
      "Lead contains safety-critical signals. Escalated to a human immediately. Welfare response is decoupled from payment and approval and is never placed on the autonomy ramp."
  },
  emergency_dispatch: {
    rule: "Emergency dispatch gate",
    riskScore: 78,
    explanation:
      "Emergency request requires a human to confirm payment status, margin floor, contractor compliance, and zone readiness before any dispatch is recommended."
  },
  contractor_activation: {
    rule: "Contractor activation gate",
    riskScore: 45,
    explanation:
      "A contractor cannot be moved to active status until business, insurance, permit, reference, W-9, rate, and test-job checks are cleared by a human."
  },
  pricing_terms: {
    rule: "Pricing & terms gate",
    riskScore: 64,
    explanation:
      "Final pricing, terms, rebates, credits, and guarantees require recorded human approval. The LLM may draft; the policy engine and operator decide."
  }
};

export function buildLeadArtifacts(lead: Lead): {
  approvals: ApprovalRequest[];
  activity: HermesActivity[];
} {
  const approvals: ApprovalRequest[] = [];
  const activity: HermesActivity[] = [
    {
      id: id("act"),
      createdAt: new Date().toISOString(),
      module: "Lead Intake",
      action: `Classified ${lead.type} lead`,
      result: lead.hermesRecommendation,
      relatedRecordId: lead.id
    }
  ];

  if (lead.safetyCritical) {
    const g = GATES.safety_escalation;
    approvals.push({
      id: id("appr"),
      createdAt: new Date().toISOString(),
      type: "safety_escalation",
      title: "Immediate human safety escalation",
      summary: `Lead from ${lead.name} may involve safety or no-heat conditions. Welfare response is not gated by payment.`,
      status: "pending",
      relatedRecordId: lead.id,
      riskLevel: "critical",
      triggeringRule: g.rule,
      riskScore: g.riskScore,
      explanation: g.explanation
    });
  }

  if (lead.type === "emergency" && !lead.safetyCritical) {
    const g = GATES.emergency_dispatch;
    approvals.push({
      id: id("appr"),
      createdAt: new Date().toISOString(),
      type: "dispatch",
      title: "Emergency dispatch approval required",
      summary: "Operator must confirm payment status, margin, contractor compliance, and zone readiness.",
      status: "pending",
      relatedRecordId: lead.id,
      riskLevel: "high",
      triggeringRule: g.rule,
      riskScore: g.riskScore,
      explanation: g.explanation
    });
  }

  if (lead.type === "contractor") {
    const g = GATES.contractor_activation;
    approvals.push({
      id: id("appr"),
      createdAt: new Date().toISOString(),
      type: "contractor_approval",
      title: "Contractor vetting started",
      summary: "Contractor must clear business, insurance, permit, reference, W-9, rate, and test-job checks before activation.",
      status: "pending",
      relatedRecordId: lead.id,
      riskLevel: "medium",
      triggeringRule: g.rule,
      riskScore: g.riskScore,
      explanation: g.explanation
    });
  }

  if (lead.type === "commercial_quote") {
    const g = GATES.pricing_terms;
    approvals.push({
      id: id("appr"),
      createdAt: new Date().toISOString(),
      type: "pricing",
      title: "Commercial quote approval required",
      summary: "Final pricing, terms, rebates, credits, and guarantees require recorded human approval.",
      status: "pending",
      relatedRecordId: lead.id,
      riskLevel: "high",
      triggeringRule: g.rule,
      riskScore: g.riskScore,
      explanation: g.explanation
    });
  }

  return { approvals, activity };
}

export function recommendationFor(type: LeadType, safetyCritical: boolean) {
  if (safetyCritical) return "Escalate immediately to a human operator. Do not gate welfare response on payment.";
  if (type === "emergency") return "Escalate to operator, verify payment status, margin, contractor compliance, and zone readiness.";
  if (type === "contractor") return "Start Stage 1 vetting and request required documents before any approval.";
  if (type === "commercial_quote") return "Prepare draft quote inputs and route pricing/terms to human approval.";
  if (type === "property_manager") return "Schedule vendor-desk audit and map sites, vendors, billing, and service pain points.";
  return "Schedule commercial audit and prepare structured follow-up.";
}
