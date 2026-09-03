import { NextResponse } from "next/server";
import { readinessReport } from "@/lib/readiness";

export const dynamic = "force-dynamic";

export async function GET() {
  const { ready } = await readinessReport();
  return NextResponse.json({ ready }, { status: ready ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
