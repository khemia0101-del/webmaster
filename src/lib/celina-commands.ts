import "server-only";

import { computeLearning, type LearningReport } from "@/lib/learning";
import type { Store } from "@/lib/types";

const money = (value: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function buildCelinaLoopReport(store: Store, learning: LearningReport = computeLearning(store)) {
  const urgentLeads = store.leads.filter((lead) => lead.safetyCritical || lead.status === "human_escalation");
  const missedFollowUps = store.leads.filter((lead) =>
    !lead.safetyCritical &&
    lead.hermesDeliveryStatus !== "replied" &&
    lead.outboundEmailStatus !== "sent"
  );
  const topActions = learning.actionQueue.slice(0, 3);
  const newestLearnings = learning.learningRecords.slice(0, 5);

  return {
    goal: {
      northStarMetric: "booked_gross_revenue",
      bookedGrossRevenue: learning.bookedGrossRevenue,
      monthlyRevenueTarget: learning.monthlyRevenueTarget,
      progress: learning.revenueProgress,
      remaining: Math.max(0, learning.monthlyRevenueTarget - learning.bookedGrossRevenue)
    },
    today: {
      leads: store.leads.length,
      urgentLeads: urgentLeads.length,
      missedFollowUps: missedFollowUps.length,
      pendingApprovals: store.approvalRequests.filter((approval) => approval.status === "pending").length,
      biggestBottleneck: learning.biggestBottleneck
    },
    learning: {
      totalInteractions: learning.totalInteractions,
      totalErrors: learning.totalErrors,
      closeRate: learning.closeRate,
      followUpSuccessRate: learning.followUpSuccessRate,
      newestLearnings
    },
    actions: {
      autoNow: learning.actionCounts.auto_now,
      approvalRequired: learning.actionCounts.approval_required,
      observeMore: learning.actionCounts.observe_more,
      blocked: learning.actionCounts.blocked,
      implemented: learning.actionCounts.implemented,
      topActions
    }
  };
}

export function renderCelinaCommand(command: string, store: Store) {
  const normalized = command.trim().toLowerCase().split(/\s+/)[0] || "/today";
  const learning = computeLearning(store);
  const report = buildCelinaLoopReport(store, learning);

  if (normalized === "/status") {
    return [
      "CelinaAmenBot growth loop status",
      `Leads: ${report.today.leads}`,
      `Interactions learned from: ${report.learning.totalInteractions}`,
      `Auto-now actions: ${report.actions.autoNow}`,
      `Approval-required actions: ${report.actions.approvalRequired}`,
      `Blocked actions: ${report.actions.blocked}`
    ].join("\n");
  }

  if (normalized === "/goal") {
    return [
      "Conquistador Oil revenue goal",
      `Booked gross revenue: ${money(report.goal.bookedGrossRevenue)}`,
      `Monthly target: ${money(report.goal.monthlyRevenueTarget)}`,
      `Progress: ${Math.round(report.goal.progress * 100)}%`,
      `Remaining: ${money(report.goal.remaining)}`
    ].join("\n");
  }

  if (normalized === "/learned") {
    return report.learning.newestLearnings
      .slice(0, 5)
      .map(
        (item, index) =>
          `${index + 1}. ${item.pattern}\nAction: ${item.recommendedAction}\nEvidence: ${item.evidenceCount}, confidence ${Math.round(item.confidence * 100)}%, impact ${money(item.estimatedRevenueImpact)}`
      )
      .join("\n\n");
  }

  if (normalized === "/actions") {
    return report.actions.topActions
      .slice(0, 5)
      .map(
        (action, index) =>
          `${index + 1}. [${action.status}] ${action.title}\nRisk: ${action.riskLevel}, confidence ${Math.round(action.confidence * 100)}%, expected impact ${money(action.expectedRevenueImpact)}`
      )
      .join("\n\n");
  }

  return [
    "Today for Conquistador Oil",
    `Booked gross revenue: ${money(report.goal.bookedGrossRevenue)} / ${money(report.goal.monthlyRevenueTarget)}`,
    `Urgent leads: ${report.today.urgentLeads}`,
    `Missed follow-ups: ${report.today.missedFollowUps}`,
    `Pending approvals: ${report.today.pendingApprovals}`,
    `Biggest bottleneck: ${report.today.biggestBottleneck}`,
    `Top action: ${report.actions.topActions[0]?.title ?? "Keep collecting outcome data."}`
  ].join("\n");
}
