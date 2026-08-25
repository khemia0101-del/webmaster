export type ContractorSearchInput = {
  service: string;
  location: string;
};

export type ValidatedContractorSearch = {
  service: string;
  location: string;
};

function clean(value: unknown, maximum: number) {
  return String(value ?? "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maximum);
}

export function validateContractorSearch(
  input: ContractorSearchInput
): { ok: true; search: ValidatedContractorSearch } | { ok: false; error: string } {
  const service = clean(input.service, 100);
  const location = clean(input.location, 120);

  if (service.length < 2) {
    return { ok: false, error: "Enter the contractor service to search for." };
  }
  if (location.length < 2) {
    return { ok: false, error: "Enter a U.S. city, ZIP code, or service area." };
  }
  return {
    ok: true,
    search: {
      service,
      location
    }
  };
}
