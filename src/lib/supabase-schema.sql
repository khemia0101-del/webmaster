create table if not exists leads (
  id text primary key,
  "createdAt" timestamptz not null,
  source text not null,
  type text not null,
  status text not null,
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
  source text not null,
  label text not null,
  "leadType" text,
  "relatedRecordId" text,
  "triggeringRule" text,
  "hermesRecommended" text,
  "humanDecision" text,
  agreed boolean,
  metadata jsonb
);
