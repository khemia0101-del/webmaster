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
      key: "HERMES_REVENUE_DESK_SECRET",
      label: "Conquistador Revenue Desk webhook secret",
      present: Boolean(process.env.HERMES_REVENUE_DESK_SECRET),
      requiredForProduction: false
    },
    {
      key: "VAPI_WEBHOOK_SECRET",
      label: "Vapi webhook bearer token",
      present: Boolean(process.env.VAPI_WEBHOOK_SECRET),
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
      key: "PHONE_LEAD_NOTIFICATION_EMAIL",
      label: "Internal phone lead notification inbox",
      present: Boolean(process.env.PHONE_LEAD_NOTIFICATION_EMAIL),
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
