import { NextResponse } from "next/server";
import { createLead, recordEvent } from "@/lib/store";
import type { LeadType } from "@/lib/types";

const allowed: LeadType[] = ["emergency", "commercial_audit", "contractor", "commercial_quote", "fuel", "property_manager", "other"];

export async function POST(request: Request) {
  let fallbackType: LeadType = "other";
  try {
    const form = await request.formData();
    fallbackType = String(form.get("fallbackType") || "other") as LeadType;
    if (!allowed.includes(fallbackType)) {
      await recordEvent({
        kind: "form_error",
        source: "Website",
        label: `Unknown intake type: ${fallbackType}`
      });
      return NextResponse.json({ error: "Unknown intake type." }, { status: 400 });
    }
    const lead = await createLead(form, fallbackType);
    return NextResponse.json({
      id: lead.id,
      message: lead.safetyCritical
        ? "Saved. Hermes flagged this for immediate human safety review."
        : "Saved. Hermes classified the lead and queued the next approval step."
    });
  } catch (err) {
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
