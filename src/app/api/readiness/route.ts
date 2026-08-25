import { NextResponse } from "next/server";
import { getEnvChecks, isProductionReadyEnv } from "@/lib/env";
import { checkSupabaseConnection } from "@/lib/supabase-store";

export async function GET() {
  const envReady = isProductionReadyEnv();
  let database: { connected: boolean; backend: string; leadCount?: number } = {
    connected: false,
    backend: "supabase"
  };

  if (envReady) {
    try {
      const result = await checkSupabaseConnection();
      database = { connected: true, ...result };
    } catch {
      database = { connected: false, backend: "supabase" };
    }
  }

  const ready = envReady && database.connected;
  return NextResponse.json(
    {
      ready,
      checks: getEnvChecks(),
      database
    },
    { status: ready ? 200 : 503 }
  );
}
