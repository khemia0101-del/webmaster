import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { readinessReport } from "@/lib/readiness";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAdmin(request);
  if (denied) return denied;
  const report = await readinessReport();
  return NextResponse.json(report, { status: report.ready ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
