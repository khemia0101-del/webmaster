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
    }
  ];
}

export function missingProductionEnv() {
  return getEnvChecks().filter((check) => check.requiredForProduction && !check.present);
}

export function isProductionReadyEnv() {
  return missingProductionEnv().length === 0;
}
