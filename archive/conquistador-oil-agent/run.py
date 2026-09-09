"""Conquistador Oil — master operations pipeline.

Entry point that turns an inbound website lead into a sequence of authorized
outbound contractor calls:

1. Parse the inbound lead and its SEO metadata.
2. Source ranked local contractors via Google Places.
3. Dial each contractor in turn through Vapi (authorized with a Codex OAuth
   bearer token).
4. Poll the call to resolution and inspect ``endedReason``.
5. If a human answered, print the call summary and stop; otherwise advance to
   the next contractor down the list.

Run directly (``python run.py``) to exercise the full pipeline against a mock
simulation that requires no live credentials.
"""

from __future__ import annotations

import time
from typing import Any, Callable, Optional

from tools import call_logger, google_leads, telephony_quotes
from tools.telephony_quotes import TelephonyError

# How many times to poll a call for a terminal resolution, and the delay
# between polls (seconds).
_MAX_POLL_ATTEMPTS = 30
_POLL_INTERVAL_SECONDS = 5

# Vapi statuses that mean the call has reached a terminal state.
_TERMINAL_STATUSES = frozenset({"ended", "completed", "failed"})


def _extract_seo_keyword(seo_metadata: dict[str, Any]) -> str:
    """Pull the customer's raw SEO search keyword out of the lead metadata."""
    if not isinstance(seo_metadata, dict):
        return ""
    for key in ("keyword", "search_keyword", "query", "term"):
        value = seo_metadata.get(key)
        if value:
            return str(value).strip()
    return ""


def _poll_call_resolution(
    call_id: str,
    *,
    transcript_fetcher: Callable[[str], dict[str, Any]],
    sleeper: Callable[[float], None] = time.sleep,
    max_attempts: int = _MAX_POLL_ATTEMPTS,
    interval: float = _POLL_INTERVAL_SECONDS,
) -> dict[str, Any]:
    """Poll a call until it reaches a terminal state or attempts are exhausted.

    The ``transcript_fetcher`` and ``sleeper`` are injected so the simulation
    block (and tests) can drive resolution deterministically without real I/O.
    """
    last_result: dict[str, Any] = {}
    for _ in range(max_attempts):
        last_result = transcript_fetcher(call_id)
        status = str(last_result.get("status", "")).lower()
        if status in _TERMINAL_STATUSES:
            return last_result
        sleeper(interval)
    return last_result


def process_new_website_lead(
    location: str,
    service: str,
    seo_metadata: dict[str, Any],
    *,
    contractor_fetcher: Callable[[str, str], list[dict[str, Any]]] = (
        google_leads.get_top_rated_contractors
    ),
    call_initiator: Callable[[dict[str, Any], str], dict[str, Any]] = (
        telephony_quotes.place_outbound_call
    ),
    transcript_fetcher: Callable[[str], dict[str, Any]] = (
        telephony_quotes.fetch_call_transcript_and_quote
    ),
    sleeper: Callable[[float], None] = time.sleep,
    call_recorder: Optional[Callable[..., Any]] = call_logger.record_call,
) -> Optional[dict[str, Any]]:
    """Run the full lead-to-quote pipeline for a single inbound website lead.

    Args:
        location: service area for the lead, e.g. ``"Midland, TX"``.
        service: requested service/trade, e.g. ``"oil field maintenance"``.
        seo_metadata: dict carrying the customer's raw SEO search keyword.
        contractor_fetcher: dependency-injected contractor sourcing function.
        call_initiator: dependency-injected outbound-call function.
        transcript_fetcher: dependency-injected transcript/quote function.
        sleeper: dependency-injected sleep used while polling.
        call_recorder: dependency-injected call-history writer. Every resolved
            call is persisted via this callable so the agent can learn from its
            own history. Pass ``None`` to disable recording.

    Returns:
        The resolved call record of the first contractor reached by a human,
        or ``None`` if no contractor was successfully reached.
    """
    seo_keyword = _extract_seo_keyword(seo_metadata)

    print("=" * 70)
    print("Conquistador Oil — New Website Lead")
    print(f"  Location    : {location}")
    print(f"  Service     : {service}")
    print(f"  SEO keyword : {seo_keyword or '(none provided)'}")
    print("=" * 70)

    try:
        contractors = contractor_fetcher(location, service)
    except Exception as exc:  # noqa: BLE001 - surface any sourcing failure cleanly
        print(f"[run] Failed to source contractors: {exc}")
        return None

    if not contractors:
        print("[run] No qualified contractors found for this lead.")
        return None

    print(f"[run] Sourced {len(contractors)} qualified contractor(s).\n")

    for index, contractor in enumerate(contractors, start=1):
        name = contractor.get("name", "Unknown")
        rating = contractor.get("rating", "n/a")
        phone = contractor.get("phone_number", "n/a")
        print(f"[{index}/{len(contractors)}] Calling {name} "
              f"({rating}*) at {phone} ...")

        try:
            call = call_initiator(contractor, seo_keyword)
        except TelephonyError as exc:
            print(f"    -> Could not initiate call: {exc}. Advancing.\n")
            continue
        except Exception as exc:  # noqa: BLE001
            print(f"    -> Unexpected dialing error: {exc}. Advancing.\n")
            continue

        call_id = call.get("id")
        if not call_id:
            print("    -> Vapi did not return a call id. Advancing.\n")
            continue

        try:
            resolution = _poll_call_resolution(
                call_id,
                transcript_fetcher=transcript_fetcher,
                sleeper=sleeper,
            )
        except Exception as exc:  # noqa: BLE001
            print(f"    -> Failed to resolve call: {exc}. Advancing.\n")
            continue

        # Persist every resolved call (answered or not) so the agent builds a
        # history it can learn from. A logging failure must never abort outreach.
        if call_recorder is not None:
            try:
                call_recorder(
                    location=location,
                    service=service,
                    seo_keyword=seo_keyword,
                    contractor=contractor,
                    resolution=resolution,
                )
            except Exception as exc:  # noqa: BLE001
                print(f"    -> (warning) failed to record call: {exc}")

        ended_reason = resolution.get("ended_reason", "unknown")
        if resolution.get("answered_by_human"):
            print(f"    -> HUMAN ANSWERED (endedReason='{ended_reason}').")
            summary = resolution.get("summary") or "(no summary available)"
            transcript = resolution.get("transcript") or "(no transcript)"
            print("    --- Call Summary ------------------------------------")
            print(f"    {summary}")
            print("    --- Transcript --------------------------------------")
            print(f"    {transcript}")
            print("    -----------------------------------------------------\n")
            print(f"[run] Lead handled by {name}. Stopping outreach.")
            return resolution

        print(f"    -> Not reached (endedReason='{ended_reason}'). "
              "Advancing to next contractor.\n")

    print("[run] Exhausted contractor list without reaching a human.")
    return None


# ---------------------------------------------------------------------------
# Mock simulation: lets you exercise the entire pipeline with no live creds.
# ---------------------------------------------------------------------------
def _build_mock_simulation() -> dict[str, Callable[..., Any]]:
    """Return mock implementations of the three external dependencies."""

    mock_contractors = [
        {
            "name": "Apex Oilfield Services",
            "rating": 4.9,
            "user_ratings_total": 212,
            "address": "100 Derrick Rd, Midland, TX",
            "place_id": "mock-apex",
            "phone_number": "+15550000001",
        },
        {
            "name": "Permian Pump & Maintenance",
            "rating": 4.6,
            "user_ratings_total": 88,
            "address": "42 Wellhead Ave, Midland, TX",
            "place_id": "mock-permian",
            "phone_number": "+15550000002",
        },
        {
            "name": "Lone Star Rig Repair",
            "rating": 4.3,
            "user_ratings_total": 41,
            "address": "7 Pipeline Blvd, Midland, TX",
            "place_id": "mock-lonestar",
            "phone_number": "+15550000003",
        },
    ]

    # Scripted outcomes keyed by phone number: the first two contractors are
    # "unreached" (busy / voicemail), the third is answered by a human.
    scripted_outcomes = {
        "+15550000001": {
            "ended_reason": "busy",
            "answered_by_human": False,
            "summary": "",
            "transcript": "",
        },
        "+15550000002": {
            "ended_reason": "voicemail",
            "answered_by_human": False,
            "summary": "",
            "transcript": "",
        },
        "+15550000003": {
            "ended_reason": "customer-responded",
            "answered_by_human": True,
            "summary": (
                "Lone Star Rig Repair confirmed availability for oil field "
                "maintenance and quoted $4,200 with a 3-day lead time."
            ),
            "transcript": (
                "Assistant: Hi, this is Conquistador Oil's procurement line... "
                "Contractor: Yes, we handle that. We can do it for $4,200, "
                "starting in three days."
            ),
        },
    }

    # Map each created call_id back to the contractor's scripted outcome.
    call_registry: dict[str, dict[str, Any]] = {}
    counter = {"n": 0}

    def mock_contractor_fetcher(location: str, service: str) -> list[dict[str, Any]]:
        return list(mock_contractors)

    def mock_call_initiator(
        contractor: dict[str, Any], seo_keyword: str
    ) -> dict[str, Any]:
        counter["n"] += 1
        call_id = f"mock-call-{counter['n']}"
        outcome = dict(scripted_outcomes[contractor["phone_number"]])
        outcome["status"] = "ended"
        outcome["call_id"] = call_id
        call_registry[call_id] = outcome
        return {"id": call_id, "status": "queued"}

    def mock_transcript_fetcher(call_id: str) -> dict[str, Any]:
        return dict(call_registry[call_id])

    def mock_sleeper(_seconds: float) -> None:
        # No real waiting during the simulation.
        return None

    return {
        "contractor_fetcher": mock_contractor_fetcher,
        "call_initiator": mock_call_initiator,
        "transcript_fetcher": mock_transcript_fetcher,
        "sleeper": mock_sleeper,
    }


if __name__ == "__main__":
    import os

    print("\n### Conquistador Oil pipeline — MOCK SIMULATION ###\n")

    # Record the simulation into a SEPARATE, throwaway DB so demo runs never
    # pollute real call history. Recreate it each run for a clean demo.
    sim_db = os.path.join(
        os.path.dirname(__file__), "data", "call_history_mock.db"
    )
    if os.path.exists(sim_db):
        os.remove(sim_db)

    def _sim_recorder(**kwargs: Any) -> int:
        return call_logger.record_call(db_path=sim_db, **kwargs)

    mocks = _build_mock_simulation()
    result = process_new_website_lead(
        location="Midland, TX",
        service="oil field maintenance",
        seo_metadata={"keyword": "emergency oil rig pump repair near me"},
        contractor_fetcher=mocks["contractor_fetcher"],
        call_initiator=mocks["call_initiator"],
        transcript_fetcher=mocks["transcript_fetcher"],
        sleeper=mocks["sleeper"],
        call_recorder=_sim_recorder,
    )

    print("\n### SIMULATION RESULT ###")
    if result:
        print(f"Reached: {result.get('call_id')} "
              f"(endedReason='{result.get('ended_reason')}')")
    else:
        print("No contractor was reached by a human.")

    # Demonstrate the learning layer: stats + the "what worked" examples that
    # would be fed back into future call prompts.
    print("\n### LEARNING SNAPSHOT (from recorded calls) ###")
    stats = call_logger.get_stats(db_path=sim_db)
    print(f"Total calls recorded : {stats['total_calls']}")
    print(f"Human answer rate    : {stats['answer_rate']:.0%}")
    print(f"Outcomes by code     : {stats['by_ended_reason']}")

    examples = call_logger.get_successful_examples(
        service="oil field maintenance", db_path=sim_db
    )
    print("\nExamples the agent would learn from:")
    print(call_logger.format_examples_for_prompt(examples) or "  (none yet)")
