import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { buildCelinaLoopReport } from "@/lib/celina-commands";
import { computeLearning } from "@/lib/learning";
import { getStore } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const store = await getStore();
  const learning = computeLearning(store);
  const report = buildCelinaLoopReport(store, learning);

  return NextResponse.json({
    ok: true,
    closedLoop: "Interact -> capture signal -> score outcome -> extract learning -> choose action -> implement or request approval -> measure result -> update policy -> repeat",
    report,
    learningRecords: learning.learningRecords,
    actionQueue: learning.actionQueue
  }, { headers: { "Cache-Control": "no-store" } });
}
