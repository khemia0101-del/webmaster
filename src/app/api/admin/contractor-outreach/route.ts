import { startContractorOutreach } from "@/lib/contractor-outreach";
import type { ContractorProspectInput } from "@/lib/vapi-outbound-policy";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  let input: ContractorProspectInput;
  try {
    input = (await request.json()) as ContractorProspectInput;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    const result = await startContractorOutreach(input);
    return Response.json({
      ok: true,
      ...result,
      message: "Vapi accepted one contractor qualification call."
    }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The outbound call could not be started.";
    const clientError =
      /required|valid|confirm|consent|calling window|timezone|do-not-call|already queued/i.test(message);
    return Response.json({ error: message }, { status: clientError ? 400 : 502 });
  }
}
