"""Vapi outbound voice dialing and transcript/quote retrieval.

Places outbound conversational calls through the Vapi phone endpoint, dynamically
authorizing each request with a fresh Codex OAuth bearer token sourced from
:mod:`tools.auth_oauth`. On an HTTP 401 the token cache is flushed and the
request is retried once with a freshly negotiated token.

The :func:`fetch_call_transcript_and_quote` helper reads completed-call metadata
and normalizes Vapi's ``endedReason`` into a simple ``answered_by_human`` flag.
"""

from __future__ import annotations

import os
from typing import Any

import requests
from dotenv import load_dotenv

from tools import auth_oauth

load_dotenv()

_VAPI_CALL_URL = "https://api.vapi.ai/call/phone"
_VAPI_CALL_DETAIL_URL = "https://api.vapi.ai/call"

_REQUEST_TIMEOUT = 45

# Vapi endedReason values that indicate a live human engaged with the call.
_HUMAN_ENDED_REASONS = frozenset({"customer-responded", "normal-clearing"})

# Vapi endedReason values that indicate the call never reached a human.
_UNREACHED_ENDED_REASONS = frozenset({"no-answer", "busy", "voicemail"})


class TelephonyConfigurationError(RuntimeError):
    """Raised when required telephony configuration is missing."""


class TelephonyError(RuntimeError):
    """Raised on transport failure or a non-success Vapi response."""


def _get_phone_number_id() -> str:
    """Return the configured Vapi phone number id."""
    phone_id = os.getenv("VAPI_PHONE_NUMBER_ID", "").strip()
    if not phone_id:
        raise TelephonyConfigurationError(
            "VAPI_PHONE_NUMBER_ID is not set in the environment."
        )
    return phone_id


def _build_assistant_prompt(seo_keyword: str, contractor_name: str) -> str:
    """Construct the conversational assistant system prompt.

    The customer's raw SEO search keyword is injected so the contractor
    immediately understands the context of the inbound work request.
    """
    keyword = (seo_keyword or "general service").strip()
    name = (contractor_name or "there").strip()
    return (
        "You are a professional, courteous procurement assistant calling on "
        "behalf of Conquistador Oil. You are speaking with a representative at "
        f"{name}. Conquistador Oil has an active customer request related to: "
        f"'{keyword}'. Your goal is to (1) confirm the contractor offers this "
        "service, (2) confirm availability, and (3) request a price quote and "
        "earliest available scheduling window. Speak naturally and "
        "conversationally, keep the call concise, and thank them for their "
        "time. If you reach a voicemail system, leave a brief message stating "
        "that Conquistador Oil is seeking a quote and will follow up."
    )


def _vapi_request(
    method: str, url: str, *, json_body: dict[str, Any] | None = None
) -> dict[str, Any]:
    """Issue an authorized Vapi request, retrying once on a 401.

    Args:
        method: HTTP method ("GET" or "POST").
        url: fully-qualified Vapi URL.
        json_body: optional JSON payload for POST requests.

    Returns:
        The parsed JSON response body.
    """
    for attempt in range(2):
        force_refresh = attempt == 1
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            **auth_oauth.get_authorization_header(force_refresh=force_refresh),
        }
        try:
            response = requests.request(
                method,
                url,
                headers=headers,
                json=json_body,
                timeout=_REQUEST_TIMEOUT,
            )
        except requests.RequestException as exc:
            raise TelephonyError(f"Failed to reach Vapi endpoint '{url}': {exc}") from exc

        if response.status_code == 401 and attempt == 0:
            # Token likely expired/revoked: flush cache and retry once.
            auth_oauth.clear_token_cache()
            continue

        if response.status_code >= 400:
            raise TelephonyError(
                f"Vapi returned HTTP {response.status_code} for {url}: "
                f"{response.text[:500]}"
            )

        try:
            return response.json()
        except ValueError as exc:
            raise TelephonyError("Vapi returned a non-JSON response.") from exc

    # Both attempts exhausted on auth failure.
    raise TelephonyError(
        f"Vapi authorization failed for '{url}' after refreshing the token."
    )


def place_outbound_call(
    contractor: dict[str, Any], seo_keyword: str
) -> dict[str, Any]:
    """Initiate an outbound conversational call to a contractor.

    Args:
        contractor: a vendor dict containing at least ``phone_number`` and
            ``name`` (as produced by :mod:`tools.google_leads`).
        seo_keyword: the customer's raw SEO search keyword for call context.

    Returns:
        The Vapi call-creation response (includes the new ``id``).
    """
    phone_number = contractor.get("phone_number")
    if not phone_number:
        raise TelephonyError("Contractor record is missing a phone_number.")

    contractor_name = contractor.get("name", "the contractor")
    payload = {
        "phoneNumberId": _get_phone_number_id(),
        "customer": {"number": phone_number},
        "assistant": {
            "firstMessage": (
                f"Hi, this is the procurement line for Conquistador Oil. "
                f"I'm reaching out to {contractor_name} regarding a service "
                f"request. Do you have a quick moment?"
            ),
            "model": {
                "provider": "openai",
                "model": os.getenv("HERMES_MODEL", "gpt-4o"),
                "temperature": 0.2,
                "messages": [
                    {
                        "role": "system",
                        "content": _build_assistant_prompt(
                            seo_keyword, contractor_name
                        ),
                    }
                ],
            },
        },
        "metadata": {
            "seo_keyword": seo_keyword,
            "contractor_name": contractor_name,
        },
    }

    return _vapi_request("POST", _VAPI_CALL_URL, json_body=payload)


def fetch_call_transcript_and_quote(call_id: str) -> dict[str, Any]:
    """Read completed-call metadata and normalize the outcome.

    Args:
        call_id: the Vapi call identifier returned by :func:`place_outbound_call`.

    Returns:
        A dict with:
            ``call_id``         -- the call id.
            ``status``          -- raw Vapi call status.
            ``ended_reason``    -- raw Vapi ``endedReason``.
            ``answered_by_human`` -- bool derived from ``endedReason``.
            ``transcript``      -- the full call transcript text (may be empty).
            ``summary``         -- Vapi's generated call summary (may be empty).
    """
    if not call_id:
        raise TelephonyError("A call_id is required to fetch transcript data.")

    body = _vapi_request("GET", f"{_VAPI_CALL_DETAIL_URL}/{call_id}")

    ended_reason = (body.get("endedReason") or "").strip().lower()

    if ended_reason in _HUMAN_ENDED_REASONS:
        answered_by_human = True
    elif ended_reason in _UNREACHED_ENDED_REASONS:
        answered_by_human = False
    else:
        # Unknown/empty reasons are treated conservatively as "not reached"
        # so the pipeline advances rather than reporting a phantom success.
        answered_by_human = False

    analysis = body.get("analysis") or {}

    return {
        "call_id": call_id,
        "status": body.get("status", "unknown"),
        "ended_reason": ended_reason,
        "answered_by_human": answered_by_human,
        "transcript": body.get("transcript", "") or "",
        "summary": analysis.get("summary", "") or body.get("summary", "") or "",
    }


if __name__ == "__main__":
    print("[telephony_quotes] Module loaded. Use place_outbound_call() / "
          "fetch_call_transcript_and_quote() from the pipeline.")
