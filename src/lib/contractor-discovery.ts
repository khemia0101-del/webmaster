import "server-only";

import {
  validateContractorSearch,
  type ContractorSearchInput
} from "@/lib/contractor-discovery-policy";

const GOOGLE_PLACES_TEXT_SEARCH_URL = "https://places.googleapis.com/v1/places:searchText";
const GOOGLE_PLACES_FIELD_MASK = [
  "searchUri",
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.googleMapsUri",
  "places.internationalPhoneNumber",
  "places.nationalPhoneNumber",
  "places.rating",
  "places.userRatingCount",
  "places.businessStatus"
].join(",");

type GooglePlace = {
  id?: string;
  displayName?: { text?: string };
  formattedAddress?: string;
  googleMapsUri?: string;
  internationalPhoneNumber?: string;
  nationalPhoneNumber?: string;
  rating?: number;
  userRatingCount?: number;
  businessStatus?: string;
};

type GoogleTextSearchResponse = {
  places?: GooglePlace[];
  searchUri?: string;
  error?: { message?: string };
};

export type ContractorCandidate = {
  placeId: string;
  company: string;
  phone: string;
  address: string;
  rating: number | null;
  ratingCount: number;
  googleMapsUri: string;
};

export async function findContractorCandidates(input: ContractorSearchInput) {
  const validated = validateContractorSearch(input);
  if (!validated.ok) throw new Error(validated.error);

  const apiKey = process.env.GOOGLE_PLACES_API_KEY?.trim();
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY is not configured.");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);
  let response: Response;

  try {
    response = await fetch(GOOGLE_PLACES_TEXT_SEARCH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": GOOGLE_PLACES_FIELD_MASK
      },
      body: JSON.stringify({
        textQuery: `${validated.search.service} in ${validated.search.location}`,
        languageCode: "en",
        regionCode: "US",
        minRating: validated.search.minimumRating,
        pageSize: 10,
        rankPreference: "RELEVANCE",
        includePureServiceAreaBusinesses: true
      }),
      cache: "no-store",
      signal: controller.signal
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Google Places contractor search timed out.");
    }
    throw new Error("Google Places contractor search could not be reached.");
  } finally {
    clearTimeout(timeout);
  }

  const body = (await response.json().catch(() => ({}))) as GoogleTextSearchResponse;
  if (!response.ok) {
    throw new Error(body.error?.message || `Google Places search failed with HTTP ${response.status}.`);
  }

  const candidates: ContractorCandidate[] = (body.places ?? [])
    .filter((place) => place.businessStatus !== "CLOSED_PERMANENTLY")
    .map((place) => ({
      placeId: String(place.id ?? "").trim(),
      company: String(place.displayName?.text ?? "").trim(),
      phone: String(place.internationalPhoneNumber ?? place.nationalPhoneNumber ?? "").trim(),
      address: String(place.formattedAddress ?? "").trim(),
      rating: typeof place.rating === "number" ? place.rating : null,
      ratingCount: typeof place.userRatingCount === "number" ? place.userRatingCount : 0,
      googleMapsUri: String(place.googleMapsUri ?? "").trim()
    }))
    .filter((place) => place.placeId && place.company && place.phone && place.googleMapsUri);

  return {
    candidates,
    query: validated.search,
    searchUri: String(body.searchUri ?? "").trim()
  };
}
