import { findContractorCandidates } from "@/lib/contractor-discovery";
import type { ContractorSearchInput } from "@/lib/contractor-discovery-policy";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(request: Request) {
  let input: ContractorSearchInput;
  try {
    input = (await request.json()) as ContractorSearchInput;
  } catch {
    return Response.json({ error: "Invalid JSON." }, { status: 400 });
  }

  try {
    const result = await findContractorCandidates(input);
    return Response.json({ ok: true, ...result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Contractor search failed.";
    const clientError = /enter|required/i.test(message);
    return Response.json({ error: message }, { status: clientError ? 400 : 502 });
  }
}
