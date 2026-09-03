import { NextResponse } from "next/server";
import { routeLeadToRevenueDesk } from "@/lib/revenue-desk";
import { createLead, recordEvent } from "@/lib/store";
import type { LeadType } from "@/lib/types";
import { guardPublicRequest, publicForm, publicErrorResponse } from "@/lib/public-request";

export async function POST(request: Request) {
  let fallbackType: LeadType = "other";
  try {
    await guardPublicRequest(request, "leads");
    const form = await publicForm(request);
    fallbackType = String(form.get("fallbackType") || "other") as LeadType;
    const lead = await createLead(form, fallbackType);
    await routeLeadToRevenueDesk(lead).catch((err) =>
      recordEvent({
        kind: "system_error",
        source: "Conquistador Revenue Desk",
        label: `Revenue Desk routing failed for ${lead.id}`,
        relatedRecordId: lead.id,
        metadata: { message: err instanceof Error ? err.message : String(err) }
      }).catch(() => undefined)
    );
    return NextResponse.json({
      id: lead.id,
      message: lead.safetyCritical
        ? "Saved. Hermes flagged this for immediate human safety review."
        : "Saved. Hermes classified the lead and queued the next approval step."
    });
  } catch (err) {
    const rejected = publicErrorResponse(err);
    if (rejected) return rejected;
    // Capture "what breaks" so the learning loop can surface friction hotspots.
    await recordEvent({
      kind: "system_error",
      source: "API",
      label: `Intake failed (${fallbackType})`,
      metadata: { message: err instanceof Error ? err.message : String(err) }
    }).catch(() => undefined);
    return NextResponse.json({ error: "The intake could not be saved." }, { status: 500 });
  }
}
