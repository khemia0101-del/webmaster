import { getEnvChecks, isProductionReadyEnv } from "@/lib/env";
import { checkSupabaseConnection, checkPublicRateLimitSchema } from "@/lib/supabase-store";

export async function readinessReport() {
  let connected = false;
  let abuseProtection = false;
  if (isProductionReadyEnv()) {
    try {
      await checkSupabaseConnection();
      connected = true;
      await checkPublicRateLimitSchema();
      abuseProtection = true;
    } catch { /* Fail closed without returning database errors or customer counts. */ }
  }
  return { ready: connected && abuseProtection, checks: getEnvChecks(), database: { connected }, abuseProtection };
}
