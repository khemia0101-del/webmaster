export type LeadType =
  | "emergency"
  | "commercial_audit"
  | "contractor"
  | "commercial_quote"
  | "fuel"
  | "property_manager"
  | "hiring"
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
  hermesDeliveryStatus?: "pending" | "sent" | "replied" | "failed" | "needs_human";
  hermesReplyText?: string;
  outboundEmailStatus?: "not_applicable" | "pending" | "sent" | "failed" | "skipped";
  chatTranscript?: string;
  lastFollowUpAt?: string;
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
  phoneRouting?: PhoneRoutingState;
};

export type PhoneInquiryKind =
  | "service"
  | "billing"
  | "careers"
  | "supplier"
  | "complaint"
  | "other";

export type PhoneRoutingStatus =
  | "collecting"
  | "logged_only"
  | "queued_coverage"
  | "queued_after_hours"
  | "transfer_ready"
  | "failed";

export type PhoneInquiryHandoffResult = {
  saved: boolean;
  leadId: string;
  routingStatus: PhoneRoutingStatus;
  action: "transfer" | "follow_up" | "logged" | "handoff_failed";
  transferDestinations: string[];
  message: string;
};

export type PhoneRoutingState = {
  vapiCallId: string;
  inquiryKind: PhoneInquiryKind;
  serviceType: string;
  consentToShare: boolean;
  status: PhoneRoutingStatus;
  candidateContractorIds: string[];
  nextAttemptAt?: string;
  failureReason?: string;
  handoffCompletedAt?: string;
  handoffResult?: PhoneInquiryHandoffResult;
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
  routingProfile?: ContractorRoutingProfile;
};

export type BusinessDay = "sun" | "mon" | "tue" | "wed" | "thu" | "fri" | "sat";

export type BusinessHoursWindow = {
  open: string;
  close: string;
};

export type ContractorRoutingProfile = {
  phoneNumber: string;
  timeZone: string;
  businessHours: Partial<Record<BusinessDay, BusinessHoursWindow[]>>;
  acceptingLeads: boolean;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  priority?: number;
  lastAssignedAt?: string;
  assignmentsToday?: number;
  assignmentsDate?: string;
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
  | "revenue_desk_delivery"
  | "revenue_desk_reply"
  | "email_reply_sent"
  | "telegram_command"
  | "call_completed"
  | "quote_sent"
  | "job_booked"
  | "job_lost"
  | "follow_up_sent"
  | "follow_up_failed"
  | "contractor_contacted"
  | "phone_inquiry_logged"
  | "phone_routing_ready"
  | "phone_routing_queued"
  | "approval_decided"
  | "contractor_interaction"
  | "system_error"
  | "experiment_impression"
  | "experiment_conversion";

export type InteractionEvent = {
  id: string;
  createdAt: string;
  kind: InteractionEventKind;
  eventType?: string;
  source: string; // e.g. "Website", "Admin", "Hermes", "API"
  actor?: string;
  label: string;
  leadType?: LeadType;
  relatedRecordId?: string;
  leadId?: string;
  customerId?: string;
  jobId?: string;
  contractorId?: string;
  experimentId?: string;
  // Learning signal: what Hermes recommended vs. what the human decided.
  triggeringRule?: string;
  hermesRecommended?: string;
  recommendation?: string;
  humanDecision?: string;
  outcome?: string;
  revenueImpact?: number;
  confidence?: number;
  riskLevel?: "low" | "medium" | "high" | "critical";
  agreed?: boolean;
  metadata?: Record<string, string>;
};

export type CelinaActionStatus = "auto_now" | "approval_required" | "observe_more" | "blocked" | "implemented";

export type CelinaActionType =
  | "follow_up"
  | "seo_content"
  | "crm_update"
  | "experiment"
  | "vendor_capacity"
  | "pricing"
  | "dispatch"
  | "deploy"
  | "paid_spend"
  | "public_claim"
  | "hiring"
  | "legal_terms"
  | "report";

export type LearningRecord = {
  id: string;
  createdAt: string;
  pattern: string;
  evidenceCount: number;
  estimatedRevenueImpact: number;
  confidence: number;
  recommendedAction: string;
  autoImplementable: boolean;
  needsHumanApproval: boolean;
  implemented: boolean;
  result?: string;
  actionStatus: CelinaActionStatus;
  riskLevel: "low" | "medium" | "high" | "critical";
  sourceEventIds: string[];
};

export type CelinaAction = {
  id: string;
  createdAt: string;
  status: CelinaActionStatus;
  type: CelinaActionType;
  title: string;
  summary: string;
  expectedRevenueImpact: number;
  confidence: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  approvalReason?: string;
  learningRecordId?: string;
  implementedAt?: string;
  result?: string;
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
  bookedGrossRevenue?: number;
  monthlyRevenueTarget?: number;
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
  learningRecords: LearningRecord[];
  celinaActions: CelinaAction[];
};
