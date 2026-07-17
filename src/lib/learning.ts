import type { CelinaAction, CelinaActionStatus, CelinaActionType, LearningRecord, Store } from "@/lib/types";

/**
 * The learning loop. Hermes "learns" from real usage in a deterministic,
 * auditable, human-gated way: it aggregates interaction signals (what customers
 * and contractors do) and failures (what breaks), then surfaces insights to the
 * operator. It NEVER changes behavior on its own — per the Technical Review,
 * the LLM advises and the policy engine + operator remain the authority.
 *
 * Two signal sources:
 *   1. approval_decided events / decided approvals -> per-rule approval rates,
 *      which power autonomy-ramp recommendations (Human Review -> One-Click).
 *   2. form_error / system_error events -> "what breaks" friction hotspots.
 */

// Bars borrowed from the build plan's ramp criteria ("after a proven, error-free
// run"). High on purpose: a rule only graduates with real, consistent evidence.
const RAMP_MIN_SAMPLE = 8;
const RAMP_MIN_RATE = 0.95;
const OVERRIDE_MIN_SAMPLE = 3;
const OVERRIDE_MAX_RATE = 0.6;

export type RuleInsight = {
  rule: string;
  total: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  rampCandidate: boolean;
  note: string;
};

export type BreakageInsight = {
  label: string;
  count: number;
};

export type LearningReport = {
  totalInteractions: number;
  totalErrors: number;
  bookedGrossRevenue: number;
  monthlyRevenueTarget: number;
  revenueProgress: number;
  closeRate: number;
  followUpSuccessRate: number;
  rules: RuleInsight[];
  breakages: BreakageInsight[];
  learningRecords: LearningRecord[];
  actionQueue: CelinaAction[];
  biggestBottleneck: string;
  rampCandidates: string[];
  recommendations: string[];
};

const MONTHLY_REVENUE_TARGET = 500_000;

const uid = (prefix: string, input: string) =>
  `${prefix}-${input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 44) || "item"}`;

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function riskForAction(type: CelinaActionType): CelinaAction["riskLevel"] {
  if (type === "dispatch" || type === "pricing" || type === "paid_spend" || type === "legal_terms") return "high";
  if (type === "deploy" || type === "public_claim" || type === "hiring" || type === "vendor_capacity") return "medium";
  return "low";
}

function statusForAction(type: CelinaActionType, confidence: number, blocked = false): CelinaActionStatus {
  if (blocked) return "blocked";
  const risk = riskForAction(type);
  if (risk === "high" || risk === "critical" || type === "deploy" || type === "public_claim") return "approval_required";
  if (confidence >= 0.7 && (type === "follow_up" || type === "crm_update" || type === "report")) return "auto_now";
  if (confidence >= 0.62 && (type === "seo_content" || type === "experiment")) return "auto_now";
  return "observe_more";
}

function buildLearning(input: {
  pattern: string;
  evidenceCount: number;
  estimatedRevenueImpact: number;
  confidence: number;
  recommendedAction: string;
  actionType: CelinaActionType;
  sourceEventIds: string[];
  blocked?: boolean;
}): { learning: LearningRecord; action: CelinaAction } {
  const riskLevel = riskForAction(input.actionType);
  const actionStatus = statusForAction(input.actionType, input.confidence, input.blocked);
  const needsHumanApproval = actionStatus === "approval_required";
  const autoImplementable = actionStatus === "auto_now";
  const id = uid("learn", input.pattern);
  const actionId = uid("actq", input.recommendedAction);
  const createdAt = new Date().toISOString();

  const learning: LearningRecord = {
    id,
    createdAt,
    pattern: input.pattern,
    evidenceCount: input.evidenceCount,
    estimatedRevenueImpact: input.estimatedRevenueImpact,
    confidence: input.confidence,
    recommendedAction: input.recommendedAction,
    autoImplementable,
    needsHumanApproval,
    implemented: false,
    actionStatus,
    riskLevel,
    sourceEventIds: input.sourceEventIds
  };

  const action: CelinaAction = {
    id: actionId,
    createdAt,
    status: actionStatus,
    type: input.actionType,
    title: input.recommendedAction,
    summary: input.pattern,
    expectedRevenueImpact: input.estimatedRevenueImpact,
    confidence: input.confidence,
    riskLevel,
    approvalReason: needsHumanApproval ? "Human approval required by Conquistador safety and business-risk policy." : undefined,
    learningRecordId: id
  };

  return { learning, action };
}

export function computeLearning(store: Store): LearningReport {
  const events = store.events ?? [];
  const latestKpi = store.kpiSnapshots[0];
  const bookedGrossRevenue =
    latestKpi?.bookedGrossRevenue ??
    store.jobs
      .filter((job) => job.status === "booked" || job.status === "completed")
      .reduce((total, job) => total + job.quotedPrice, 0) +
      events.reduce((total, event) => total + (event.kind === "job_booked" ? event.revenueImpact ?? 0 : 0), 0);
  const monthlyRevenueTarget = latestKpi?.monthlyRevenueTarget ?? MONTHLY_REVENUE_TARGET;
  const revenueProgress = monthlyRevenueTarget ? bookedGrossRevenue / monthlyRevenueTarget : 0;
  const submitted = events.filter((event) => event.kind === "form_submitted").length;
  const booked = store.jobs.filter((job) => job.status === "booked" || job.status === "completed").length +
    events.filter((event) => event.kind === "job_booked").length;
  const closeRate = submitted ? booked / submitted : 0;
  const followUps = events.filter((event) => event.kind === "follow_up_sent" || event.kind === "follow_up_failed" || event.kind === "email_reply_sent");
  const successfulFollowUps = followUps.filter((event) => event.kind === "follow_up_sent" || event.kind === "email_reply_sent").length;
  const followUpSuccessRate = followUps.length ? successfulFollowUps / followUps.length : 0;

  // --- Per-rule approval/override history (from decision signals) ------------
  const byRule = new Map<string, { total: number; approved: number; rejected: number }>();

  const tally = (rule: string, approved: boolean) => {
    const g = byRule.get(rule) ?? { total: 0, approved: 0, rejected: 0 };
    g.total += 1;
    if (approved) g.approved += 1;
    else g.rejected += 1;
    byRule.set(rule, g);
  };

  for (const e of events) {
    if (e.kind !== "approval_decided") continue;
    const rule = e.triggeringRule || e.label || "Unspecified rule";
    tally(rule, e.agreed ?? e.humanDecision === "approved");
  }
  // Also fold in any already-decided approvals that predate event capture.
  for (const a of store.approvalRequests) {
    if (a.status === "pending" || !a.decidedAt) continue;
    const rule = a.triggeringRule || a.type;
    tally(rule, a.status === "approved");
  }

  const rules: RuleInsight[] = [...byRule.entries()]
    .map(([rule, g]) => {
      const approvalRate = g.total ? g.approved / g.total : 0;
      const rampCandidate = g.total >= RAMP_MIN_SAMPLE && approvalRate >= RAMP_MIN_RATE;
      let note: string;
      if (rampCandidate) {
        note = "Consistently approved — candidate for one-click approval. Policy engine still enforces hard blocks.";
      } else if (g.total >= OVERRIDE_MIN_SAMPLE && approvalRate < OVERRIDE_MAX_RATE) {
        note = "Frequently overridden — escalation criteria may be mis-scoped. Review the rule.";
      } else {
        note = "Insufficient or mixed history — keep on human review.";
      }
      return { rule, total: g.total, approved: g.approved, rejected: g.rejected, approvalRate, rampCandidate, note };
    })
    .sort((a, b) => b.total - a.total);

  // --- "What breaks" --------------------------------------------------------
  const breakMap = new Map<string, number>();
  let totalErrors = 0;
  for (const e of events) {
    if (e.kind !== "form_error" && e.kind !== "system_error") continue;
    totalErrors += 1;
    breakMap.set(e.label, (breakMap.get(e.label) ?? 0) + 1);
  }
  const breakages: BreakageInsight[] = [...breakMap.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const learningRecords: LearningRecord[] = [...(store.learningRecords ?? [])];
  const actionQueue: CelinaAction[] = [...(store.celinaActions ?? [])];
  const add = (item: ReturnType<typeof buildLearning>) => {
    if (!learningRecords.some((learning) => learning.id === item.learning.id)) learningRecords.push(item.learning);
    if (!actionQueue.some((action) => action.id === item.action.id)) actionQueue.push(item.action);
  };

  const unrespondedLeads = store.leads.filter((lead) =>
    !lead.safetyCritical &&
    lead.outboundEmailStatus !== "sent" &&
    lead.hermesDeliveryStatus !== "replied"
  );
  if (unrespondedLeads.length) {
    add(
      buildLearning({
        pattern: `${unrespondedLeads.length} lead${unrespondedLeads.length === 1 ? "" : "s"} still need confirmed follow-up.`,
        evidenceCount: unrespondedLeads.length,
        estimatedRevenueImpact: unrespondedLeads.length * 750,
        confidence: clamp(0.58 + unrespondedLeads.length * 0.08),
        recommendedAction: "Draft and queue follow-up for every lead without confirmed reply.",
        actionType: "follow_up",
        sourceEventIds: unrespondedLeads.map((lead) => lead.id)
      })
    );
  }

  const commercialLeads = store.leads.filter((lead) =>
    lead.type === "commercial_quote" || lead.type === "commercial_audit" || lead.type === "property_manager" || lead.type === "fuel"
  );
  if (commercialLeads.length >= 1) {
    add(
      buildLearning({
        pattern: "Commercial fuel, property-manager, and account-review leads are the fastest path toward booked gross revenue.",
        evidenceCount: commercialLeads.length,
        estimatedRevenueImpact: commercialLeads.length * 6_500,
        confidence: clamp(0.62 + commercialLeads.length * 0.04),
        recommendedAction: "Create the next commercial account follow-up package and a low-risk page/content experiment.",
        actionType: "experiment",
        sourceEventIds: commercialLeads.map((lead) => lead.id)
      })
    );
  }

  const redZones = store.zones.filter((zone) => zone.status === "Red" || zone.contractorCount === 0);
  if (redZones.length) {
    add(
      buildLearning({
        pattern: `${redZones.length} service zone${redZones.length === 1 ? "" : "s"} cannot scale because vendor capacity is red or empty.`,
        evidenceCount: redZones.length,
        estimatedRevenueImpact: redZones.length * 12_000,
        confidence: 0.78,
        recommendedAction: "Source and vet backup vendors for red zones before promising dispatch.",
        actionType: "vendor_capacity",
        sourceEventIds: redZones.map((zone) => zone.id)
      })
    );
  }

  // --- Operator-facing recommendations --------------------------------------
  const rampCandidates = rules.filter((r) => r.rampCandidate).map((r) => r.rule);
  const recommendations: string[] = [];
  for (const r of rules) {
    if (r.rampCandidate) {
      recommendations.push(
        `Promote "${r.rule}" toward one-click approval — ${r.approved}/${r.total} approved (${Math.round(
          r.approvalRate * 100
        )}%). The policy engine continues to enforce hard blocks.`
      );
    } else if (r.total >= OVERRIDE_MIN_SAMPLE && r.approvalRate < OVERRIDE_MAX_RATE) {
      recommendations.push(
        `Review "${r.rule}" — overridden ${r.rejected}/${r.total} times. Escalation criteria may be too aggressive.`
      );
    }
  }
  for (const b of breakages) {
    if (b.count >= 2) {
      recommendations.push(`Reduce friction: "${b.label}" occurred ${b.count} times — improve that form or field.`);
    }
  }
  if (recommendations.length === 0) {
    recommendations.push("Not enough interaction history yet. Keep every gate on human review until evidence accrues.");
  }

  const biggestBottleneck =
    redZones.length > 0
      ? "Vendor capacity is the biggest constraint: at least one zone is Red or has no contractor coverage."
      : unrespondedLeads.length > 0
        ? "Speed-to-lead is the biggest constraint: leads exist without confirmed follow-up."
        : revenueProgress < 0.25
          ? "Revenue volume is the biggest constraint: booked gross revenue is still far below the monthly target."
          : "The loop has no single obvious bottleneck yet; keep collecting outcome data.";

  return {
    totalInteractions: events.length,
    totalErrors,
    bookedGrossRevenue,
    monthlyRevenueTarget,
    revenueProgress,
    closeRate,
    followUpSuccessRate,
    rules,
    breakages,
    learningRecords: learningRecords.sort((a, b) => b.estimatedRevenueImpact - a.estimatedRevenueImpact),
    actionQueue: actionQueue.sort((a, b) => b.expectedRevenueImpact - a.expectedRevenueImpact),
    biggestBottleneck,
    rampCandidates,
    recommendations
  };
}
