export type ContractorSearchInput = {
  service: string;
  location: string;
  minimumRating?: number;
};

export type ValidatedContractorSearch = {
  service: string;
  location: string;
  minimumRating: number;
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
  const minimumRating = Number(input.minimumRating ?? 4);

  if (service.length < 2) {
    return { ok: false, error: "Enter the contractor service to search for." };
  }
  if (location.length < 2) {
    return { ok: false, error: "Enter a U.S. city, ZIP code, or service area." };
  }
  if (!Number.isFinite(minimumRating) || minimumRating < 0 || minimumRating > 5) {
    return { ok: false, error: "Minimum rating must be between 0 and 5." };
  }

  return {
    ok: true,
    search: {
      service,
      location,
      minimumRating: Math.ceil(minimumRating * 2) / 2
    }
  };
}
