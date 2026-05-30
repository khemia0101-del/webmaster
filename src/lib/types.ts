export type LeadType =
  | "emergency"
  | "commercial_audit"
  | "contractor"
  | "commercial_quote"
  | "fuel"
  | "property_manager"
  | "other";

export type ZoneStatus = "Red" | "Yellow" | "Green" | "Gold";
export type ApprovalType =
  | "pricing"
  | "dispatch"
  | "contractor_approval"
  | "public_content"
  | "legal_terms"
  | "safety_escalation";

export type Lead = {
  id: string;
  createdAt: string;
  source: string;
  type: LeadType;
  status: string;
  name: string;
  company?: string;
  phone: string;
  email?: string;
  siteAddress?: string;
  zone: string;
  details: Record<string, string>;
  paymentRequirement: string;
  hermesRecommendation: string;
  safetyCritical: boolean;
};

export type Customer = {
  id: string;
  name: string;
  segment: string;
  contact: string;
  sites: string[];
  paymentMethodOnFile: boolean;
  terms: string;
  renewalDate?: string;
};

export type Contractor = {
  id: string;
  company: string;
  trades: string[];
  zones: string[];
  status: "vetting" | "signed" | "setup" | "test" | "active" | "blocked";
  score: number;
  insuranceExpires?: string;
  permitExpires?: string;
  missingDocuments: string[];
  successfulJobs: number;
  onTimeRate: number;
  // Reliability fields (Technical Review Rec #3): contractor data goes stale, so
  // track when it was last confirmed and how confident we are in it.
  lastVerified?: string;
  verificationStatus?: "verified" | "pending" | "unverified" | "expired";
  verificationConfidence?: "high" | "medium" | "low";
};

export type Job = {
  id: string;
  customerId: string;
  contractorId?: string;
  trade: string;
  zone: string;
  quotedPrice: number;
  contractorCost: number;
  spread: number;
  paymentStatus: "not_secured" | "authorized" | "collected" | "financed" | "terms_matched";
  slaPhase: string;
  proofOfService?: string;
  status: string;
};

export type ComplianceDocument = {
  id: string;
  contractorId: string;
  type: string;
  status: "missing" | "received" | "verified" | "expired";
  expiresAt?: string;
};

export type Zone = {
  id: string;
  name: string;
  trade: string;
  status: ZoneStatus;
  contractorCount: number;
  successfulJobs: number;
  onTimeRate: number;
};

export type ApprovalRequest = {
  id: string;
  createdAt: string;
  type: ApprovalType;
  title: string;
  summary: string;
  status: "pending" | "approved" | "rejected";
  relatedRecordId?: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  // Approval transparency (Technical Review Rec #4): every escalation explains the
  // rule that triggered it, a numeric risk score, and why it escalated.
  triggeringRule?: string;
  riskScore?: number; // 0-100
  explanation?: string;
  // Recorded when an operator decides the approval (the human-in-the-loop gate).
  decidedAt?: string;
  decidedBy?: string;
  decisionNote?: string;
};

export type HermesActivity = {
  id: string;
  createdAt: string;
  module: string;
  action: string;
  result: string;
  relatedRecordId?: string;
};

// Interaction + failure signals that let Hermes learn from real usage over time
// (customer/contractor interactions and "what breaks"). Deterministic and
// human-gated: these feed insights and ramp recommendations, never autonomy.
export type InteractionEventKind =
  | "form_submitted"
  | "form_error"
  | "lead_classified"
  | "approval_decided"
  | "contractor_interaction"
  | "system_error"
  | "experiment_impression"
  | "experiment_conversion";

export type InteractionEvent = {
  id: string;
  createdAt: string;
  kind: InteractionEventKind;
  source: string; // e.g. "Website", "Admin", "Hermes", "API"
  label: string;
  leadType?: LeadType;
  relatedRecordId?: string;
  // Learning signal: what Hermes recommended vs. what the human decided.
  triggeringRule?: string;
  hermesRecommended?: string;
  humanDecision?: string;
  agreed?: boolean;
  metadata?: Record<string, string>;
};

export type ExperimentVariant = {
  id: string;
  label: string;
  weight: number;
  headline: string;
  body: string;
  primaryLabel: string;
  primaryHref: string;
  secondaryLabel: string;
  secondaryHref: string;
  recommendationNote: string;
};

export type WebsiteExperiment = {
  id: string;
  name: string;
  page: string;
  status: "draft" | "active" | "paused" | "complete";
  goal: string;
  variants: ExperimentVariant[];
};

export type KpiSnapshot = {
  id: string;
  createdAt: string;
  newLeads: number;
  emergencyJobsRouted: number;
  averageSpread: number;
  fundsSecuredRate: number;
  contractorsContacted: number;
  approvedContractors: number;
  bookedAudits: number;
};

export type Store = {
  leads: Lead[];
  customers: Customer[];
  contractors: Contractor[];
  jobs: Job[];
  documents: ComplianceDocument[];
  zones: Zone[];
  approvalRequests: ApprovalRequest[];
  hermesActivity: HermesActivity[];
  kpiSnapshots: KpiSnapshot[];
  events: InteractionEvent[];
};
