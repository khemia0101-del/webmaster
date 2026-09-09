import { NextResponse } from "next/server";
import { routeLeadToRevenueDesk } from "@/lib/revenue-desk";
import { createLead, recordEvent } from "@/lib/store";
import { guardPublicRequest, publicJson, stringFields, publicErrorResponse } from "@/lib/public-request";

export async function POST(request: Request) {
  try {
    await guardPublicRequest(request, "leads");
    const body = stringFields(await publicJson(request), ["name", "email", "phone", "serviceType", "zone", "urgency", "question", "website"]);
    const question = String(body.question || "").trim();
    if (!question) {
      return NextResponse.json({ error: "Please enter your question." }, { status: 400 });
    }

    const form = new FormData();
    form.set("source", "Website Chat");
    form.set("fallbackType", body.urgency?.toLowerCase().includes("urgent") ? "emergency" : "other");
    form.set("name", body.name || "Website chat visitor");
    form.set("email", body.email || "");
    form.set("phone", body.phone || "");
    form.set("serviceType", body.serviceType || "General inquiry");
    form.set("zone", body.zone || "Lancaster");
    form.set("urgency", body.urgency || "Not specified");
    form.set("issue", question);
    form.set(
      "chatTranscript",
      [
        `Name: ${body.name || "Website chat visitor"}`,
        `Email: ${body.email || ""}`,
        `Phone: ${body.phone || ""}`,
        `Service: ${body.serviceType || "General inquiry"}`,
        `Location: ${body.zone || "Lancaster"}`,
        `Urgency: ${body.urgency || "Not specified"}`,
        `Question: ${question}`
      ].join("\n")
    );

    const lead = await createLead(form, String(form.get("fallbackType")) === "emergency" ? "emergency" : "other");
    await routeLeadToRevenueDesk(lead).catch((err) =>
      recordEvent({
        kind: "system_error",
        source: "Conquistador Revenue Desk",
        label: `Revenue Desk chat routing failed for ${lead.id}`,
        relatedRecordId: lead.id,
        metadata: { message: err instanceof Error ? err.message : String(err) }
      }).catch(() => undefined)
    );

    return NextResponse.json({
      id: lead.id,
      message:
        "Thanks. Conquistador Oil received your message. If this is urgent or involves no heat, please call (717) 397-9800."
    });
  } catch (err) {
    const rejected = publicErrorResponse(err);
    if (rejected) return rejected;
    await recordEvent({
      kind: "system_error",
      source: "API",
      label: "Chat intake failed",
      metadata: { message: err instanceof Error ? err.message : String(err) }
    }).catch(() => undefined);
    return NextResponse.json({ error: "The chat message could not be saved." }, { status: 500 });
  }
}
