import { NextResponse } from "next/server";
import { decideApproval } from "@/lib/store";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await request.json().catch(() => ({}))) as { decision?: string; note?: string; decidedBy?: string };
  const decision = body.decision === "rejected" ? "rejected" : "approved";
  const note = typeof body.note === "string" ? body.note : "";
  const decidedBy = typeof body.decidedBy === "string" && body.decidedBy ? body.decidedBy : "Operator";

  const ok = await decideApproval(id, decision, note, decidedBy);
  if (!ok) {
    return NextResponse.json({ error: "Approval not found." }, { status: 404 });
  }
  return NextResponse.json({ ok: true, id, decision });
}
