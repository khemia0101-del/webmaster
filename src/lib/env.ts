import "server-only";

export type EnvCheck = {
  key: string;
  label: string;
  present: boolean;
  requiredForProduction: boolean;
};

export function getEnvChecks(): EnvCheck[] {
  return [
    {
      key: "DATA_DIR",
      label: "Persistent local data directory",
      present: true,
      requiredForProduction: true
    },
    {
      key: "ADMIN_USERNAME",
      label: "Admin username",
      present: Boolean(process.env.ADMIN_USERNAME),
      requiredForProduction: true
    },
    {
      key: "ADMIN_PASSWORD",
      label: "Admin password",
      present: Boolean(process.env.ADMIN_PASSWORD),
      requiredForProduction: true
    },
    {
      key: "NEXT_PUBLIC_SITE_URL",
      label: "Public site URL",
      present: Boolean(process.env.NEXT_PUBLIC_SITE_URL),
      requiredForProduction: true
    },
    {
      key: "HERMES_REVENUE_DESK_WEBHOOK_URL",
      label: "Conquistador Revenue Desk webhook",
      present: Boolean(process.env.HERMES_REVENUE_DESK_WEBHOOK_URL),
      requiredForProduction: false
    },
    {
      key: "NEXT_PUBLIC_SUPABASE_URL",
      label: "Supabase URL for durable Vercel lead queues",
      present: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      requiredForProduction: false
    },
    {
      key: "SUPABASE_SERVICE_ROLE_KEY",
      label: "Supabase service role for durable Vercel lead queues",
      present: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      requiredForProduction: false
    },
    {
      key: "CRON_SECRET",
      label: "Vercel phone follow-up cron authentication",
      present: Boolean(process.env.CRON_SECRET),
      requiredForProduction: false
    },
    {
      key: "VAPI_WEBHOOK_SECRET",
      label: "Vapi webhook bearer token",
      present: Boolean(process.env.VAPI_WEBHOOK_SECRET),
      requiredForProduction: false
    },
    {
      key: "VAPI_API_KEY",
      label: "Vapi server API key",
      present: Boolean(process.env.VAPI_API_KEY),
      requiredForProduction: false
    },
    {
      key: "VAPI_SERVER_CREDENTIAL_ID",
      label: "Vapi custom credential for authenticated callbacks",
      present: Boolean(process.env.VAPI_SERVER_CREDENTIAL_ID),
      requiredForProduction: false
    },
    {
      key: "VAPI_PHONE_NUMBER_ID",
      label: "Vapi outbound phone number ID",
      present: Boolean(process.env.VAPI_PHONE_NUMBER_ID),
      requiredForProduction: false
    },
    {
      key: "ZOHO_SMTP_USER",
      label: "Zoho email account",
      present: Boolean(process.env.ZOHO_SMTP_USER),
      requiredForProduction: false
    },
    {
      key: "ZOHO_SMTP_PASS",
      label: "Zoho email app password",
      present: Boolean(process.env.ZOHO_SMTP_PASS),
      requiredForProduction: false
    }
  ];
}

export function missingProductionEnv() {
  return getEnvChecks().filter((check) => check.requiredForProduction && !check.present);
}

export function isProductionReadyEnv() {
  return missingProductionEnv().length === 0;
}
