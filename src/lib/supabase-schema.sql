create table if not exists leads (
  id text primary key,
  "createdAt" timestamptz not null,
  source text not null,
  type text not null,
  status text not null,
  "hermesDeliveryStatus" text,
  "hermesReplyText" text,
  "outboundEmailStatus" text,
  "chatTranscript" text,
  "lastFollowUpAt" timestamptz,
  name text not null,
  company text,
  phone text not null,
  email text,
  "siteAddress" text,
  zone text not null,
  details jsonb not null default '{}',
  "paymentRequirement" text not null,
  "hermesRecommendation" text not null,
  "safetyCritical" boolean not null default false
);

create table if not exists customers (
  id text primary key,
  name text not null,
  segment text not null,
  contact text not null,
  sites jsonb not null default '[]',
  "paymentMethodOnFile" boolean not null default false,
  terms text not null,
  "renewalDate" text
);

create table if not exists contractors (
  id text primary key,
  company text not null,
  trades jsonb not null default '[]',
  zones jsonb not null default '[]',
  status text not null,
  score numeric not null default 0,
  "insuranceExpires" text,
  "permitExpires" text,
  "missingDocuments" jsonb not null default '[]',
  "successfulJobs" numeric not null default 0,
  "onTimeRate" numeric not null default 0,
  -- Reliability fields (Technical Review Rec #3)
  "lastVerified" text,
  "verificationStatus" text,
  "verificationConfidence" text
);

create table if not exists jobs (
  id text primary key,
  "customerId" text not null,
  "contractorId" text,
  trade text not null,
  zone text not null,
  "quotedPrice" numeric not null,
  "contractorCost" numeric not null,
  spread numeric not null,
  "paymentStatus" text not null,
  "slaPhase" text not null,
  "proofOfService" text,
  status text not null
);

create table if not exists documents (
  id text primary key,
  "contractorId" text not null,
  type text not null,
  status text not null,
  "expiresAt" text
);

create table if not exists zones (
  id text primary key,
  name text not null,
  trade text not null,
  status text not null,
  "contractorCount" numeric not null default 0,
  "successfulJobs" numeric not null default 0,
  "onTimeRate" numeric not null default 0
);

create table if not exists approval_requests (
  id text primary key,
  "createdAt" timestamptz not null,
  type text not null,
  title text not null,
  summary text not null,
  status text not null,
  "relatedRecordId" text,
  "riskLevel" text not null,
  -- Approval transparency (Technical Review Rec #4)
  "triggeringRule" text,
  "riskScore" numeric,
  explanation text,
  -- Human-in-the-loop decision record
  "decidedAt" timestamptz,
  "decidedBy" text,
  "decisionNote" text
);

create table if not exists hermes_activity (
  id text primary key,
  "createdAt" timestamptz not null,
  module text not null,
  action text not null,
  result text not null,
  "relatedRecordId" text
);

create table if not exists kpi_snapshots (
  id text primary key,
  "createdAt" timestamptz not null,
  "bookedGrossRevenue" numeric,
  "monthlyRevenueTarget" numeric,
  "newLeads" numeric not null,
  "emergencyJobsRouted" numeric not null,
  "averageSpread" numeric not null,
  "fundsSecuredRate" numeric not null,
  "contractorsContacted" numeric not null,
  "approvedContractors" numeric not null,
  "bookedAudits" numeric not null
);

-- Interaction + failure signals powering the learning loop (Phase B). Hermes
-- aggregates these to recommend where autonomy can safely increase; behavior is
-- never changed autonomously.
create table if not exists events (
  id text primary key,
  "createdAt" timestamptz not null,
  kind text not null,
  "eventType" text,
  source text not null,
  actor text,
  label text not null,
  "leadType" text,
  "relatedRecordId" text,
  "leadId" text,
  "customerId" text,
  "jobId" text,
  "contractorId" text,
  "experimentId" text,
  "triggeringRule" text,
  "hermesRecommended" text,
  recommendation text,
  "humanDecision" text,
  outcome text,
  "revenueImpact" numeric,
  confidence numeric,
  "riskLevel" text,
  agreed boolean,
  metadata jsonb
);

create table if not exists learning_records (
  id text primary key,
  "createdAt" timestamptz not null,
  pattern text not null,
  "evidenceCount" numeric not null,
  "estimatedRevenueImpact" numeric not null,
  confidence numeric not null,
  "recommendedAction" text not null,
  "autoImplementable" boolean not null default false,
  "needsHumanApproval" boolean not null default false,
  implemented boolean not null default false,
  result text,
  "actionStatus" text not null,
  "riskLevel" text not null,
  "sourceEventIds" jsonb not null default '[]'
);

create table if not exists celina_actions (
  id text primary key,
  "createdAt" timestamptz not null,
  status text not null,
  type text not null,
  title text not null,
  summary text not null,
  "expectedRevenueImpact" numeric not null,
  confidence numeric not null,
  "riskLevel" text not null,
  "approvalReason" text,
  "learningRecordId" text,
  "implementedAt" timestamptz,
  result text
);
