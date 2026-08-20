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
    },
    {
      key: "GOOGLE_PLACES_API_KEY",
      label: "Google Places contractor search",
      present: Boolean(process.env.GOOGLE_PLACES_API_KEY),
      requiredForProduction: false
    },
    {
      key: "VAPI_PRIVATE_KEY",
      label: "Vapi private key for outbound calls",
      present: Boolean(process.env.VAPI_PRIVATE_KEY),
      requiredForProduction: false
    },
    {
      key: "VAPI_OUTBOUND_PHONE_NUMBER_ID",
      label: "Vapi outbound phone number",
      present: Boolean(process.env.VAPI_OUTBOUND_PHONE_NUMBER_ID),
      requiredForProduction: false
    },
    {
      key: "VAPI_OUTBOUND_WEBHOOK_SECRET",
      label: "Vapi outbound webhook secret",
      present: Boolean(process.env.VAPI_OUTBOUND_WEBHOOK_SECRET),
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
