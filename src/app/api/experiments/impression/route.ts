import { NextResponse } from "next/server";
import { recordEvent } from "@/lib/store";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    experimentId?: string;
    variantId?: string;
    page?: string;
  };

  if (!body.experimentId || !body.variantId) {
    return NextResponse.json({ error: "Missing experiment data." }, { status: 400 });
  }

  try {
    await recordEvent({
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
    console.warn("Experiment impression could not be recorded", error);
  }

  return NextResponse.json({ ok: true });
}
