import { NextResponse } from "next/server";
import { getEnvChecks, isProductionReadyEnv } from "@/lib/env";

export async function GET() {
  const ready = isProductionReadyEnv();
  return NextResponse.json(
    {
      ready,
      checks: getEnvChecks()
    },
    { status: ready ? 200 : 503 }
  );
}
