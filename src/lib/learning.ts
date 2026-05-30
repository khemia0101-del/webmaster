import type { Store } from "@/lib/types";

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
  rules: RuleInsight[];
  breakages: BreakageInsight[];
  rampCandidates: string[];
  recommendations: string[];
};

export function computeLearning(store: Store): LearningReport {
  const events = store.events ?? [];

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

  return {
    totalInteractions: events.length,
    totalErrors,
    rules,
    breakages,
    rampCandidates,
    recommendations
  };
}
