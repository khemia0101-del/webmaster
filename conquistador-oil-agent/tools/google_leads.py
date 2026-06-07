"""Google Places contractor sourcing.

Sources locally rated contractors for a given service via the Google Places
*Text Search* API, filters out any below ``MIN_GOOGLE_RATING``, enriches each
surviving result with a properly formatted phone number from the *Place
Details* API, and returns them sorted by rating (descending).
"""

from __future__ import annotations

import os
from typing import Any, Optional

import requests
from dotenv import load_dotenv

load_dotenv()

_TEXT_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"
_PLACE_DETAILS_URL = "https://maps.googleapis.com/maps/api/place/details/json"

_REQUEST_TIMEOUT = 30


class GoogleLeadsConfigurationError(RuntimeError):
    """Raised when the Google Places API key is missing."""


class GoogleLeadsError(RuntimeError):
    """Raised on transport failure or an API-level error status."""


def _get_api_key() -> str:
    """Return the Google Places API key from the environment."""
    api_key = os.getenv("GOOGLE_PLACES_API_KEY", "").strip()
    if not api_key:
        raise GoogleLeadsConfigurationError(
            "GOOGLE_PLACES_API_KEY is not set in the environment."
        )
    return api_key


def _get_min_rating() -> float:
    """Return the configured minimum rating threshold (defaults to 4.0)."""
    raw = os.getenv("MIN_GOOGLE_RATING", "4.0").strip()
    try:
        return float(raw)
    except ValueError:
        return 4.0


def _places_get(url: str, params: dict[str, Any]) -> dict[str, Any]:
    """Issue a GET against a Places endpoint and validate the envelope.

    Google returns HTTP 200 even for logical failures; the real status lives in
    the ``status`` field of the JSON body.
    """
    try:
        response = requests.get(url, params=params, timeout=_REQUEST_TIMEOUT)
    except requests.RequestException as exc:
        raise GoogleLeadsError(f"Failed to reach Google Places API: {exc}") from exc

    if response.status_code != 200:
        raise GoogleLeadsError(
            f"Google Places API returned HTTP {response.status_code}: "
            f"{response.text[:500]}"
        )

    try:
        body = response.json()
    except ValueError as exc:
        raise GoogleLeadsError("Google Places API returned non-JSON.") from exc

    status = body.get("status", "UNKNOWN")
    # ZERO_RESULTS is a perfectly valid empty outcome, not an error.
    if status not in ("OK", "ZERO_RESULTS"):
        message = body.get("error_message", "no error message provided")
        raise GoogleLeadsError(
            f"Google Places API status '{status}': {message}"
        )

    return body


def _fetch_phone_number(place_id: str, api_key: str) -> Optional[str]:
    """Look up a formatted phone number for a place via Place Details.

    Returns ``None`` when no phone number is published for the place.
    """
    params = {
        "place_id": place_id,
        "fields": "formatted_phone_number,international_phone_number",
        "key": api_key,
    }
    try:
        body = _places_get(_PLACE_DETAILS_URL, params)
    except GoogleLeadsError:
        # A single failed detail lookup should not abort the whole batch.
        return None

    result = body.get("result", {})
    # Prefer the international (E.164-ish) form for downstream dialing.
    return (
        result.get("international_phone_number")
        or result.get("formatted_phone_number")
    )


def get_top_rated_contractors(
    location: str, service_type: str
) -> list[dict[str, Any]]:
    """Return rated contractors for ``service_type`` near ``location``.

    Args:
        location: human-readable area, e.g. ``"Midland, TX"``.
        service_type: trade/service keyword, e.g. ``"oil field maintenance"``.

    Returns:
        A list of vendor dicts, each with ``name``, ``rating``,
        ``user_ratings_total``, ``address``, ``place_id`` and ``phone_number``,
        sorted by ``rating`` descending. Vendors below ``MIN_GOOGLE_RATING`` or
        without a usable phone number are excluded.
    """
    api_key = _get_api_key()
    min_rating = _get_min_rating()

    query = f"{service_type} in {location}".strip()
    search_params = {"query": query, "key": api_key}

    body = _places_get(_TEXT_SEARCH_URL, search_params)
    raw_results = body.get("results", [])

    vendors: list[dict[str, Any]] = []
    for place in raw_results:
        rating = place.get("rating")
        if rating is None:
            continue
        try:
            rating_value = float(rating)
        except (TypeError, ValueError):
            continue
        if rating_value < min_rating:
            continue

        place_id = place.get("place_id")
        if not place_id:
            continue

        phone_number = _fetch_phone_number(place_id, api_key)
        if not phone_number:
            # Without a number we cannot dial the contractor, so skip.
            continue

        vendors.append(
            {
                "name": place.get("name", "Unknown"),
                "rating": rating_value,
                "user_ratings_total": int(place.get("user_ratings_total", 0) or 0),
                "address": place.get("formatted_address", ""),
                "place_id": place_id,
                "phone_number": phone_number,
            }
        )

    vendors.sort(key=lambda v: v["rating"], reverse=True)
    return vendors


if __name__ == "__main__":
    try:
        results = get_top_rated_contractors("Midland, TX", "oil field maintenance")
        print(f"[google_leads] Found {len(results)} qualified contractors.")
        for vendor in results:
            print(
                f"  - {vendor['name']} ({vendor['rating']}*) "
                f"{vendor['phone_number']}"
            )
    except (GoogleLeadsConfigurationError, GoogleLeadsError) as err:
        print(f"[google_leads] Lookup failed: {err}")
