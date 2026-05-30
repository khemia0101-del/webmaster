import type { InteractionEvent, WebsiteExperiment } from "@/lib/types";

export const websiteExperiments: WebsiteExperiment[] = [
  {
    id: "home-hero-v1",
    name: "Homepage Hero Offer",
    page: "/",
    status: "active",
    goal: "Increase service-request and quote-form submissions from the homepage.",
    variants: [
      {
        id: "service-first",
        label: "Service First",
        weight: 50,
        headline: "Conquistador Oil",
        body: "Heating oil, commercial fuel delivery, HVAC service requests, emergency heating help, and commercial account support across Lancaster and Central Pennsylvania.",
        primaryLabel: "Request Service",
        primaryHref: "/emergency-service",
        secondaryLabel: "Request Fuel Quote",
        secondaryHref: "/commercial-quote",
        recommendationNote: "Broad offer for mixed residential, commercial, HVAC, and fuel demand."
      },
      {
        id: "hvac-urgent",
        label: "HVAC Urgency",
        weight: 50,
        headline: "Fuel Delivery and HVAC Service",
        body: "Need heating, cooling, oil burner, or fuel help? Request HVAC service, emergency heating support, or commercial fuel delivery from one local team.",
        primaryLabel: "Request HVAC Service",
        primaryHref: "/hvac-services",
        secondaryLabel: "Emergency Heating Help",
        secondaryHref: "/emergency-service",
        recommendationNote: "More direct HVAC offer intended to improve engagement from service-needed visitors."
      }
    ]
  }
];

export function getExperiment(id: string) {
  return websiteExperiments.find((experiment) => experiment.id === id);
}

export function getVariant(experimentId: string, variantId?: string) {
  const experiment = getExperiment(experimentId) ?? websiteExperiments[0];
  return (
    experiment.variants.find((variant) => variant.id === variantId) ??
    experiment.variants[0]
  );
}

export function summarizeExperiment(experiment: WebsiteExperiment, events: InteractionEvent[]) {
  return experiment.variants.map((variant) => {
    const impressions = events.filter(
      (event) =>
        event.kind === "experiment_impression" &&
        event.metadata?.experimentId === experiment.id &&
        event.metadata?.variantId === variant.id
    ).length;
    const conversions = events.filter(
      (event) =>
        event.kind === "experiment_conversion" &&
        event.metadata?.experimentId === experiment.id &&
        event.metadata?.variantId === variant.id
    ).length;
    return {
      ...variant,
      impressions,
      conversions,
      conversionRate: impressions > 0 ? conversions / impressions : 0
    };
  });
}

export function hermesExperimentRecommendation(experiment: WebsiteExperiment, events: InteractionEvent[]) {
  const rows = summarizeExperiment(experiment, events);
  const enoughData = rows.every((row) => row.impressions >= 25);
  const winner = [...rows].sort((a, b) => b.conversionRate - a.conversionRate)[0];
  if (!winner) return "No active variants are configured.";
  if (!enoughData) {
    return `Keep ${experiment.name} running. Hermes needs at least 25 impressions per variant before recommending a winner.`;
  }
  return `Recommend reviewing ${winner.label} for promotion. It is currently converting at ${Math.round(
    winner.conversionRate * 100
  )}% based on recorded submissions.`;
}
