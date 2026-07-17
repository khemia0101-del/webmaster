import type { InteractionEvent, Store } from "@/lib/types";

// A small synthetic interaction history so the Learning & Insights panel is
// meaningful on first run. In production these accrue from real usage.
const seedEvents: InteractionEvent[] = [
  ...Array.from({ length: 18 }).map((_, i) => ({
    id: `evt-exp-service-view-${i + 1}`,
    createdAt: `2026-05-${String(24 + (i % 5)).padStart(2, "0")}T10:00:00.000Z`,
    kind: "experiment_impression" as const,
    source: "Website",
    label: "home-hero-v1:service-first impression",
    metadata: { experimentId: "home-hero-v1", variantId: "service-first", page: "/" }
  })),
  ...Array.from({ length: 3 }).map((_, i) => ({
    id: `evt-exp-service-conv-${i + 1}`,
    createdAt: `2026-05-${String(25 + i).padStart(2, "0")}T11:00:00.000Z`,
    kind: "experiment_conversion" as const,
    source: "Website",
    label: "home-hero-v1:service-first conversion",
    leadType: "emergency" as const,
    metadata: { experimentId: "home-hero-v1", variantId: "service-first", conversion: "form_submitted" }
  })),
  ...Array.from({ length: 16 }).map((_, i) => ({
    id: `evt-exp-hvac-view-${i + 1}`,
    createdAt: `2026-05-${String(24 + (i % 5)).padStart(2, "0")}T12:00:00.000Z`,
    kind: "experiment_impression" as const,
    source: "Website",
    label: "home-hero-v1:hvac-urgent impression",
    metadata: { experimentId: "home-hero-v1", variantId: "hvac-urgent", page: "/" }
  })),
  ...Array.from({ length: 4 }).map((_, i) => ({
    id: `evt-exp-hvac-conv-${i + 1}`,
    createdAt: `2026-05-${String(25 + i).padStart(2, "0")}T13:00:00.000Z`,
    kind: "experiment_conversion" as const,
    source: "Website",
    label: "home-hero-v1:hvac-urgent conversion",
    leadType: "emergency" as const,
    metadata: { experimentId: "home-hero-v1", variantId: "hvac-urgent", conversion: "form_submitted" }
  })),
  // 9 consistently-approved "Emergency dispatch gate" decisions -> ramp candidate.
  ...Array.from({ length: 9 }).map((_, i) => ({
    id: `evt-ed-${i + 1}`,
    createdAt: `2026-05-${String(20 + (i % 9)).padStart(2, "0")}T14:00:00.000Z`,
    kind: "approval_decided" as const,
    source: "Admin",
    label: "approved Emergency dispatch gate",
    triggeringRule: "Emergency dispatch gate",
    hermesRecommended: "Emergency dispatch approval required",
    humanDecision: "approved",
    agreed: true
  })),
  // Pricing & terms gate: mixed -> not a candidate; demonstrates override signal.
  {
    id: "evt-pt-1",
    createdAt: "2026-05-26T15:00:00.000Z",
    kind: "approval_decided",
    source: "Admin",
    label: "approved Pricing & terms gate",
    triggeringRule: "Pricing & terms gate",
    hermesRecommended: "Commercial quote approval required",
    humanDecision: "approved",
    agreed: true
  },
  {
    id: "evt-pt-2",
    createdAt: "2026-05-27T15:00:00.000Z",
    kind: "approval_decided",
    source: "Admin",
    label: "approved Pricing & terms gate",
    triggeringRule: "Pricing & terms gate",
    hermesRecommended: "Commercial quote approval required",
    humanDecision: "approved",
    agreed: true
  },
  {
    id: "evt-pt-3",
    createdAt: "2026-05-28T15:00:00.000Z",
    kind: "approval_decided",
    source: "Admin",
    label: "rejected Pricing & terms gate",
    triggeringRule: "Pricing & terms gate",
    hermesRecommended: "Commercial quote approval required",
    humanDecision: "rejected",
    agreed: false
  },
  // A couple of breakages -> "what breaks" hotspot.
  {
    id: "evt-err-1",
    createdAt: "2026-05-27T11:00:00.000Z",
    kind: "form_error",
    source: "Website",
    label: "Commercial quote intake missing volume"
  },
    {
      id: "evt-err-2",
      createdAt: "2026-05-28T09:30:00.000Z",
      kind: "form_error",
      source: "Website",
      label: "Commercial quote intake missing volume"
    },
    {
      id: "evt-booked-1",
      createdAt: "2026-05-30T16:15:00.000Z",
      kind: "job_booked",
      eventType: "job_booked",
      source: "Admin",
      actor: "Operator",
      label: "Booked completed HVAC service job",
      customerId: "cust-001",
      jobId: "job-001",
      outcome: "completed",
      revenueImpact: 850,
      confidence: 1,
      riskLevel: "low"
    }
  ];

export const seedStore: Store = {
  leads: [
    {
      id: "lead-001",
      createdAt: "2026-05-30T09:00:00.000Z",
      source: "Website",
      type: "commercial_audit",
      status: "qualified",
      name: "Jordan Miller",
      company: "Red Rose Property Group",
      phone: "(717) 555-0199",
      email: "jmiller@example.com",
      siteAddress: "Lancaster, PA",
      zone: "Lancaster",
      details: {
        facility: "12 multi-tenant buildings",
        fuelType: "Heating oil and diesel",
        annualGallons: "42000",
        painPoints: "Vendor spread, winter response, invoice consolidation"
      },
      paymentRequirement: "No payment needed for audit",
      hermesRecommendation: "Schedule a 15-minute vendor audit and prepare property manager desk notes.",
      safetyCritical: false
    },
    {
      id: "lead-002",
      createdAt: "2026-05-30T10:30:00.000Z",
      source: "Phone",
      type: "emergency",
      status: "human_escalation",
      name: "Avery Thompson",
      company: "Lancaster Cold Storage",
      phone: "(717) 555-0164",
      email: "ops@example.com",
      siteAddress: "Lancaster, PA",
      zone: "Lancaster",
      details: {
        issue: "No heat in office wing",
        buildingType: "Commercial warehouse",
        occupancy: "Day shift staff on site"
      },
      paymentRequirement: "Card or ACH authorization before dispatch unless safety-critical.",
      hermesRecommendation: "Escalate to operator, collect payment status, then recommend approved heating contractor.",
      safetyCritical: true
    }
  ],
  customers: [
    {
      id: "cust-001",
      name: "Red Rose Property Group",
      segment: "Property manager",
      contact: "Jordan Miller",
      sites: ["Lancaster", "Lititz", "Manheim"],
      paymentMethodOnFile: false,
      terms: "Audit stage",
      renewalDate: "2026-09-01"
    }
  ],
  contractors: [
    {
      id: "con-001",
      company: "Keystone Heat Service",
      trades: ["HVAC", "Oil burner"],
      zones: ["Lancaster", "Lititz"],
      status: "active",
      score: 91,
      insuranceExpires: "2027-01-15",
      permitExpires: "2026-12-01",
      missingDocuments: [],
      successfulJobs: 14,
      onTimeRate: 0.93,
      lastVerified: "2026-05-22",
      verificationStatus: "verified",
      verificationConfidence: "high"
    },
    {
      id: "con-002",
      company: "Susquehanna Fuel Hauling",
      trades: ["Fuel delivery", "Off-road diesel"],
      zones: ["Lancaster", "Columbia"],
      status: "vetting",
      score: 68,
      insuranceExpires: "2026-08-20",
      missingDocuments: ["W-9", "Three commercial references"],
      successfulJobs: 0,
      onTimeRate: 0,
      lastVerified: "2026-03-01",
      verificationStatus: "pending",
      verificationConfidence: "low"
    }
  ],
  jobs: [
    {
      id: "job-001",
      customerId: "cust-001",
      contractorId: "con-001",
      trade: "HVAC",
      zone: "Lancaster",
      quotedPrice: 850,
      contractorCost: 575,
      spread: 275,
      paymentStatus: "authorized",
      slaPhase: "same-day approved",
      proofOfService: "Technician notes and customer confirmation received.",
      status: "completed"
    }
  ],
  documents: [
    {
      id: "doc-001",
      contractorId: "con-001",
      type: "Commercial general liability COI",
      status: "verified",
      expiresAt: "2027-01-15"
    },
    {
      id: "doc-002",
      contractorId: "con-002",
      type: "W-9",
      status: "missing"
    }
  ],
  zones: [
    {
      id: "zone-001",
      name: "Lancaster",
      trade: "HVAC",
      status: "Green",
      contractorCount: 2,
      successfulJobs: 18,
      onTimeRate: 0.91
    },
    {
      id: "zone-002",
      name: "York",
      trade: "Fuel delivery",
      status: "Red",
      contractorCount: 0,
      successfulJobs: 0,
      onTimeRate: 0
    },
    {
      id: "zone-003",
      name: "Columbia",
      trade: "Fuel delivery",
      status: "Yellow",
      contractorCount: 2,
      successfulJobs: 4,
      onTimeRate: 0.86
    }
  ],
  approvalRequests: [
    {
      id: "appr-001",
      createdAt: "2026-05-30T10:31:00.000Z",
      type: "safety_escalation",
      title: "Potential no-heat safety escalation",
      summary: "Emergency lead from Lancaster Cold Storage flagged for immediate operator review.",
      status: "pending",
      relatedRecordId: "lead-002",
      riskLevel: "critical",
      triggeringRule: "Safety carve-out (no-heat / vulnerable occupants / safety incident)",
      riskScore: 100,
      explanation:
        "Lead contains safety-critical signals. Escalated to a human immediately. Welfare response is decoupled from payment and approval and is never placed on the autonomy ramp."
    }
  ],
  hermesActivity: [
    {
      id: "act-001",
      createdAt: "2026-05-30T09:01:00.000Z",
      module: "Lead Intake",
      action: "Classified commercial audit lead",
      result: "Recommended audit scheduling and property manager desk preparation.",
      relatedRecordId: "lead-001"
    },
    {
      id: "act-002",
      createdAt: "2026-05-30T10:31:00.000Z",
      module: "Safety Gate",
      action: "Escalated emergency lead",
      result: "Human review required immediately. Welfare response is not gated by payment.",
      relatedRecordId: "lead-002"
    }
  ],
  kpiSnapshots: [
    {
      id: "kpi-001",
      createdAt: "2026-05-30T17:00:00.000Z",
      bookedGrossRevenue: 850,
      monthlyRevenueTarget: 500000,
      newLeads: 7,
      emergencyJobsRouted: 2,
      averageSpread: 245,
      fundsSecuredRate: 0.86,
      contractorsContacted: 23,
      approvedContractors: 1,
      bookedAudits: 3
    }
  ],
  events: seedEvents,
  learningRecords: [
    {
      id: "learn-commercial-follow-up",
      createdAt: "2026-05-30T17:05:00.000Z",
      pattern: "Commercial property-manager leads show higher revenue potential than one-off residential requests.",
      evidenceCount: 2,
      estimatedRevenueImpact: 13000,
      confidence: 0.7,
      recommendedAction: "Prioritize commercial account follow-up and next-page experiments.",
      autoImplementable: true,
      needsHumanApproval: false,
      implemented: false,
      actionStatus: "auto_now",
      riskLevel: "low",
      sourceEventIds: ["lead-001", "evt-booked-1"]
    }
  ],
  celinaActions: [
    {
      id: "actq-commercial-follow-up",
      createdAt: "2026-05-30T17:05:00.000Z",
      status: "auto_now",
      type: "follow_up",
      title: "Draft commercial account follow-up package",
      summary: "Use commercial lead evidence to move property-manager and recurring fuel accounts faster.",
      expectedRevenueImpact: 13000,
      confidence: 0.7,
      riskLevel: "low",
      learningRecordId: "learn-commercial-follow-up"
    }
  ]
};
