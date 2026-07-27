import { AlertTriangle, BrainCircuit, ClipboardList, FileCheck2, FlaskConical, Fuel, Gauge, Target, UsersRound } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, Section, Stat } from "@/components/ui";
import { getEnvChecks, isProductionReadyEnv } from "@/lib/env";
import { hermesExperimentRecommendation, summarizeExperiment, websiteExperiments } from "@/lib/experiments";
import { contractorReadiness, evaluateJob, recommendDispatch } from "@/lib/hermes";
import { computeLearning } from "@/lib/learning";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function date(value: string) {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));
}

export default async function AdminPage() {
  const store = await getStore();
  const latestKpi = store.kpiSnapshots[0];
  const pendingApprovals = store.approvalRequests.filter((item) => item.status === "pending");
  const activeContractors = store.contractors.filter((item) => item.status === "active");
  const envChecks = getEnvChecks();
  const productionReady = isProductionReadyEnv();
  const learning = computeLearning(store);

  return (
    <Section className="grid gap-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-[#b86a32]">Hermes governed operations</p>
          <h1 className="mt-2 text-4xl font-bold">Admin CRM Dashboard</h1>
          <p className="mt-3 max-w-3xl text-[#5c6570]">
            Hermes drafts, classifies, scores, recommends, and reports. Money, legal terms, dispatch, contractor approval, public publishing, and safety remain human-gated.
          </p>
        </div>
        <Badge tone={pendingApprovals.length ? "warn" : "good"}>{pendingApprovals.length} pending approvals</Badge>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <Stat label="Leads in CRM" value={store.leads.length} />
        <Stat label="Booked revenue" value={money(learning.bookedGrossRevenue)} />
        <Stat label="Active contractors" value={activeContractors.length} />
        <Stat label="Goal progress" value={`${Math.round(learning.revenueProgress * 100)}%`} />
      </div>

      <Panel icon={<Target />} title="Celina Closed Revenue Loop">
        <div className="grid gap-3 md:grid-cols-4">
          <Stat label="Monthly target" value={money(learning.monthlyRevenueTarget)} />
          <Stat label="Booked gross revenue" value={money(learning.bookedGrossRevenue)} />
          <Stat label="Close rate" value={`${Math.round(learning.closeRate * 100)}%`} />
          <Stat label="Follow-up success" value={`${Math.round(learning.followUpSuccessRate * 100)}%`} />
        </div>
        <p className="mt-4 rounded-md bg-[#edf5f8] p-3 text-sm font-semibold text-[#0b2f4a]">
          {learning.biggestBottleneck}
        </p>
        <p className="mt-3 text-sm text-[#5c6570]">
          Loop: Interact - capture signal - score outcome - extract learning - choose action - implement or request approval - measure result - update policy - repeat.
        </p>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Panel icon={<BrainCircuit />} title="Newest Learnings">
          <div className="grid gap-3">
            {learning.learningRecords.slice(0, 5).map((item) => (
              <article className="rounded-md border border-[#d8c2a6] bg-white p-4" key={item.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold">{item.pattern}</h3>
                  <Badge tone={item.autoImplementable ? "good" : item.needsHumanApproval ? "warn" : "neutral"}>{item.actionStatus}</Badge>
                </div>
                <p className="mt-2 text-sm text-[#5c6570]">{item.recommendedAction}</p>
                <div className="mt-3 grid gap-2 text-sm md:grid-cols-3">
                  <span className="rounded bg-[#f4eadb] px-3 py-2">Evidence: {item.evidenceCount}</span>
                  <span className="rounded bg-[#f4eadb] px-3 py-2">Confidence: {Math.round(item.confidence * 100)}%</span>
                  <span className="rounded bg-[#f4eadb] px-3 py-2">Impact: {money(item.estimatedRevenueImpact)}</span>
                </div>
              </article>
            ))}
          </div>
        </Panel>

        <Panel icon={<ClipboardList />} title="Celina Action Queue">
          <div className="grid gap-3">
            {learning.actionQueue.slice(0, 6).map((action) => (
              <article className="rounded-md border border-[#d8c2a6] bg-white p-4" key={action.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold">{action.title}</h3>
                  <Badge tone={action.status === "auto_now" ? "good" : action.status === "approval_required" ? "warn" : action.status === "blocked" ? "bad" : "neutral"}>
                    {action.status}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-[#5c6570]">{action.summary}</p>
                <p className="mt-3 text-xs font-semibold uppercase text-[#0b2f4a]">
                  {action.type.replaceAll("_", " ")} | {action.riskLevel} risk | {money(action.expectedRevenueImpact)} expected impact
                </p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <Panel icon={<Gauge />} title="Production Readiness">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-[#5c6570]">
            Lowest-cost deployment uses persistent local file storage, admin credentials, and a public site URL. Supabase and paid APIs are optional later upgrades.
          </p>
          <Badge tone={productionReady ? "good" : "warn"}>{productionReady ? "Ready" : "Needs env setup"}</Badge>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <a className="rounded-md bg-[#0b2f4a] px-4 py-2 text-sm font-semibold text-white" href="/api/export/leads">
            Export Leads CSV
          </a>
          <a className="rounded-md border border-[#d8c2a6] bg-white px-4 py-2 text-sm font-semibold text-[#101827]" href="/api/export/store">
            Backup JSON
          </a>
        </div>
        <div className="mt-4 grid gap-2 md:grid-cols-3">
          {envChecks.map((check) => (
            <div className="rounded-md border border-[#d8c2a6] bg-white p-3 text-sm" key={check.key}>
              <div className="font-bold">{check.label}</div>
              <div className={check.present ? "mt-1 text-[#0b2f4a]" : "mt-1 text-[#8d2f20]"}>
                {check.present ? "Configured" : "Missing"} {check.requiredForProduction ? "(required)" : ""}
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <Panel icon={<ClipboardList />} title="Leads Inbox">
          <div className="grid gap-3">
            {store.leads.map((lead) => (
              <article className="rounded-md border border-[#d8c2a6] bg-white p-4" key={lead.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="font-bold">{lead.company || lead.name}</h3>
                  <Badge tone={lead.safetyCritical ? "bad" : lead.status === "new" ? "neutral" : "warn"}>{lead.status}</Badge>
                </div>
                <p className="mt-1 text-sm text-[#5c6570]">{lead.type.replaceAll("_", " ")} | {lead.zone} | {date(lead.createdAt)}</p>
                <p className="mt-3 text-sm">{lead.hermesRecommendation}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone={lead.hermesDeliveryStatus === "replied" || lead.hermesDeliveryStatus === "sent" ? "good" : lead.hermesDeliveryStatus === "failed" ? "bad" : "warn"}>
                    Revenue Desk: {lead.hermesDeliveryStatus || "pending"}
                  </Badge>
                  <Badge tone={lead.outboundEmailStatus === "sent" ? "good" : lead.outboundEmailStatus === "failed" ? "bad" : "neutral"}>
                    Email: {lead.outboundEmailStatus || "pending"}
                  </Badge>
                  {lead.phoneRouting ? (
                    <Badge
                      tone={
                        lead.phoneRouting.status === "transferred" || lead.phoneRouting.status === "contractor_notified"
                          ? "good"
                          : lead.phoneRouting.status === "failed" || lead.phoneRouting.status === "exhausted"
                            ? "bad"
                            : "warn"
                      }
                    >
                      Phone: {lead.phoneRouting.status.replaceAll("_", " ")}
                    </Badge>
                  ) : null}
                </div>
                {lead.phoneRouting?.nextAttemptAt ? (
                  <p className="mt-2 text-xs text-[#5c6570]">Next phone follow-up: {date(lead.phoneRouting.nextAttemptAt)}</p>
                ) : null}
                {lead.hermesReplyText ? (
                  <details className="mt-3 rounded-md bg-[#f4eadb] p-3 text-sm">
                    <summary className="cursor-pointer font-semibold text-[#0b2f4a]">Revenue Desk reply</summary>
                    <pre className="mt-2 whitespace-pre-wrap font-sans text-[#263544]">{lead.hermesReplyText}</pre>
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        </Panel>

        <Panel icon={<AlertTriangle />} title="Approval Queue">
          <div className="grid gap-3">
            {store.approvalRequests.map((approval) => (
              <article className="rounded-md border border-[#d8c2a6] bg-white p-4" key={approval.id}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold">{approval.title}</h3>
                  <Badge tone={approval.riskLevel === "critical" || approval.riskLevel === "high" ? "bad" : "warn"}>{approval.riskLevel}</Badge>
                </div>
                <p className="mt-2 text-sm text-[#5c6570]">{approval.summary}</p>
                <p className="mt-3 text-xs font-semibold uppercase text-[#0b2f4a]">{approval.type.replaceAll("_", " ")} | {approval.status}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Panel icon={<UsersRound />} title="Contractors">
          <div className="grid gap-3">
            {store.contractors.map((contractor) => (
              <article className="rounded-md border border-[#d8c2a6] bg-white p-4" key={contractor.id}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold">{contractor.company}</h3>
                  <Badge tone={contractor.status === "active" ? "good" : "warn"}>{contractor.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-[#5c6570]">{contractor.trades.join(", ")} | Score {contractor.score}</p>
                <p className="mt-2 text-sm">{contractorReadiness(contractor)}</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel icon={<Gauge />} title="Zones">
          <div className="grid gap-3">
            {store.zones.map((zone) => (
              <article className="rounded-md border border-[#d8c2a6] bg-white p-4" key={zone.id}>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{zone.name} | {zone.trade}</h3>
                  <Badge tone={zone.status === "Green" || zone.status === "Gold" ? "good" : zone.status === "Yellow" ? "warn" : "bad"}>{zone.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-[#5c6570]">{zone.contractorCount} contractors, {zone.successfulJobs} successful jobs, {Math.round(zone.onTimeRate * 100)}% on-time</p>
              </article>
            ))}
          </div>
        </Panel>

        <Panel icon={<FileCheck2 />} title="Documents">
          <div className="grid gap-3">
            {store.documents.map((doc) => (
              <article className="rounded-md border border-[#d8c2a6] bg-white p-4" key={doc.id}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-bold">{doc.type}</h3>
                  <Badge tone={doc.status === "verified" ? "good" : doc.status === "missing" ? "bad" : "warn"}>{doc.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-[#5c6570]">Contractor {doc.contractorId}{doc.expiresAt ? ` | Expires ${doc.expiresAt}` : ""}</p>
              </article>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <Panel icon={<Fuel />} title="Jobs and Finance Gate">
          <div className="grid gap-3">
            {store.jobs.map((job) => {
              const check = evaluateJob(job);
              return (
                <article className="rounded-md border border-[#d8c2a6] bg-white p-4" key={job.id}>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold">{job.trade} | {job.zone}</h3>
                    <Badge tone={check.canRecommendRouting ? "good" : "bad"}>{job.paymentStatus}</Badge>
                  </div>
                  <p className="mt-2 text-sm text-[#5c6570]">Quote {money(job.quotedPrice)} | Cost {money(job.contractorCost)} | Spread {money(job.spread)}</p>
                  <p className="mt-2 text-sm">{check.summary}</p>
                  <p className="mt-2 text-sm font-semibold text-[#0b2f4a]">{recommendDispatch(job, store.contractors, store.zones)}</p>
                </article>
              );
            })}
          </div>
        </Panel>

        <Panel icon={<Gauge />} title="KPI Dashboard">
          {latestKpi ? (
            <div className="grid gap-3 md:grid-cols-2">
              <Stat label="New leads" value={latestKpi.newLeads} />
              <Stat label="Emergency jobs routed" value={latestKpi.emergencyJobsRouted} />
              <Stat label="Average spread" value={money(latestKpi.averageSpread)} />
              <Stat label="Funds secured rate" value={`${Math.round(latestKpi.fundsSecuredRate * 100)}%`} />
              <Stat label="Contractors contacted" value={latestKpi.contractorsContacted} />
              <Stat label="Approved contractors" value={latestKpi.approvedContractors} />
            </div>
          ) : (
            <p className="text-sm text-[#5c6570]">No KPI snapshot yet.</p>
          )}
        </Panel>
      </div>

      <Panel icon={<FlaskConical />} title="Hermes Experiment Lab">
        <div className="grid gap-4">
          {websiteExperiments.map((experiment) => {
            const rows = summarizeExperiment(experiment, store.events);
            return (
              <article className="rounded-md border border-[#d8c2a6] bg-white p-4" key={experiment.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-[#b86a32]">{experiment.status} | {experiment.page}</p>
                    <h3 className="mt-1 text-lg font-bold">{experiment.name}</h3>
                    <p className="mt-2 text-sm text-[#5c6570]">{experiment.goal}</p>
                  </div>
                  <Badge tone={experiment.status === "active" ? "good" : "neutral"}>{experiment.variants.length} variants</Badge>
                </div>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {rows.map((row) => (
                    <div className="rounded-md border border-[#eadcc8] bg-[#fff9ee] p-4" key={row.id}>
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold">{row.label}</h4>
                        <span className="text-sm font-bold text-[#0b2f4a]">{Math.round(row.conversionRate * 100)}%</span>
                      </div>
                      <p className="mt-2 text-sm text-[#5c6570]">{row.recommendationNote}</p>
                      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                        <span className="rounded bg-[#f4eadb] px-3 py-2">Views: {row.impressions}</span>
                        <span className="rounded bg-[#f4eadb] px-3 py-2">Leads: {row.conversions}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-4 rounded-md bg-[#edf5f8] p-3 text-sm font-semibold text-[#0b2f4a]">
                  {hermesExperimentRecommendation(experiment, store.events)}
                </p>
              </article>
            );
          })}
        </div>
      </Panel>

      <Panel icon={<ClipboardList />} title="Hermes Activity Log">
        <div className="grid gap-3 md:grid-cols-2">
          {store.hermesActivity.map((activity) => (
            <article className="rounded-md border border-[#d8c2a6] bg-white p-4" key={activity.id}>
              <p className="text-xs font-bold uppercase text-[#b86a32]">{activity.module}</p>
              <h3 className="mt-1 font-bold">{activity.action}</h3>
              <p className="mt-2 text-sm text-[#5c6570]">{activity.result}</p>
              <p className="mt-3 text-xs text-[#5c6570]">{date(activity.createdAt)}</p>
            </article>
          ))}
        </div>
      </Panel>
    </Section>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-[#d8c2a6] bg-[#fff9ee] p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-[#0b2f4a]">
        {icon}
        <h2 className="text-xl font-bold text-[#101827]">{title}</h2>
      </div>
      {children}
    </section>
  );
}
