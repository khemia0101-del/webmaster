import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/store";
import { guardPublicRequest, publicJson, stringFields, validExperiment, impressionId, PublicRequestError, publicErrorResponse } from "@/lib/public-request";

export async function POST(request: Request) {
  try {
    await guardPublicRequest(request, "impressions");
    const body = stringFields(await publicJson(request, 2048), ["experimentId", "variantId", "page"]);
    if (!validExperiment(body.experimentId, body.variantId, body.page, request)) {
      throw new PublicRequestError("Invalid experiment assignment.");
    }
    await recordEvent({
      id: impressionId(request, body.experimentId),
      kind: "experiment_impression",
      source: "Website",
      label: `${body.experimentId}:${body.variantId} impression`,
      metadata: {
        experimentId: body.experimentId,
        variantId: body.variantId,
        page: body.page ?? "/"
      }
    });
  } catch (error) {
    return publicErrorResponse(error) ?? NextResponse.json({ error: "Impression could not be recorded." }, { status: 503 });
  }

  return NextResponse.json({ ok: true });
}
