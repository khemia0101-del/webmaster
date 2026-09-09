"""Local, zero-cost call history store.

Persists every outbound call outcome to a local SQLite database so the agent can
learn from past calls without any cloud spend. Captures the full record needed
for a cheap "learning" loop:

* the lead context (location, service, the raw SEO keyword used),
* the contractor that was dialed (name, rating, phone),
* the call resolution (Vapi ``endedReason`` code, human/no-human, status),
* the conversational payload (transcript + summary/quote).

Two kinds of read helper support learning:

* :func:`get_successful_examples` -- past calls a human answered *and* that
  produced a summary, suitable for few-shot injection into future call prompts.
* :func:`get_stats` -- aggregate answer-rate metrics (overall, per endedReason,
  per SEO keyword) so the agent can see which keywords actually reach humans.

SQLite is used because it is built into the Python standard library (no extra
dependency, no service to run) and is queryable for the aggregate stats above.
"""

from __future__ import annotations

import json
import os
import sqlite3
from datetime import datetime, timezone
from typing import Any, Optional

# Default on-disk location: <repo>/data/call_history.db
_DEFAULT_DB_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
_DEFAULT_DB_PATH = os.path.join(_DEFAULT_DB_DIR, "call_history.db")

_SCHEMA = """
CREATE TABLE IF NOT EXISTS call_history (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at          TEXT    NOT NULL,
    location            TEXT,
    service             TEXT,
    seo_keyword         TEXT,
    contractor_name     TEXT,
    contractor_phone    TEXT,
    contractor_rating   REAL,
    place_id            TEXT,
    call_id             TEXT,
    status              TEXT,
    ended_reason        TEXT,
    answered_by_human   INTEGER NOT NULL DEFAULT 0,
    summary             TEXT,
    transcript          TEXT,
    raw                 TEXT
);
"""

# Indexes that make the learning queries cheap on a growing table.
_INDEXES = (
    "CREATE INDEX IF NOT EXISTS idx_call_history_human "
    "ON call_history (answered_by_human);",
    "CREATE INDEX IF NOT EXISTS idx_call_history_keyword "
    "ON call_history (seo_keyword);",
)


class CallLoggerError(RuntimeError):
    """Raised when the call history store cannot be opened or written."""


def _resolve_db_path(db_path: Optional[str]) -> str:
    """Pick the DB path: explicit arg > CALL_HISTORY_DB env > default."""
    return db_path or os.getenv("CALL_HISTORY_DB", "").strip() or _DEFAULT_DB_PATH


def _connect(db_path: Optional[str]) -> sqlite3.Connection:
    """Open (and initialize, if new) the SQLite database."""
    path = _resolve_db_path(db_path)
    directory = os.path.dirname(path)
    if directory:
        os.makedirs(directory, exist_ok=True)

    try:
        conn = sqlite3.connect(path)
        conn.row_factory = sqlite3.Row
        conn.execute(_SCHEMA)
        for index_sql in _INDEXES:
            conn.execute(index_sql)
        conn.commit()
        return conn
    except sqlite3.Error as exc:
        raise CallLoggerError(f"Could not open call history DB at '{path}': {exc}") from exc


def record_call(
    *,
    location: str,
    service: str,
    seo_keyword: str,
    contractor: dict[str, Any],
    resolution: dict[str, Any],
    db_path: Optional[str] = None,
) -> int:
    """Persist a single call outcome and return its new row id.

    Args:
        location: the lead's service area.
        service: the requested service/trade.
        seo_keyword: the raw SEO keyword used as call context.
        contractor: the vendor dict that was dialed.
        resolution: the dict returned by ``fetch_call_transcript_and_quote``.
        db_path: optional override of the database file path.

    Returns:
        The autoincrement row id of the stored record.
    """
    record = {
        "created_at": datetime.now(timezone.utc).isoformat(),
        "location": location,
        "service": service,
        "seo_keyword": seo_keyword,
        "contractor_name": contractor.get("name"),
        "contractor_phone": contractor.get("phone_number"),
        "contractor_rating": contractor.get("rating"),
        "place_id": contractor.get("place_id"),
        "call_id": resolution.get("call_id"),
        "status": resolution.get("status"),
        "ended_reason": resolution.get("ended_reason"),
        "answered_by_human": 1 if resolution.get("answered_by_human") else 0,
        "summary": resolution.get("summary"),
        "transcript": resolution.get("transcript"),
        # Keep the full raw resolution for forward-compatibility / debugging.
        "raw": json.dumps(
            {"contractor": contractor, "resolution": resolution},
            ensure_ascii=False,
            default=str,
        ),
    }

    columns = ", ".join(record.keys())
    placeholders = ", ".join(f":{key}" for key in record)
    sql = f"INSERT INTO call_history ({columns}) VALUES ({placeholders})"

    conn = _connect(db_path)
    try:
        cursor = conn.execute(sql, record)
        conn.commit()
        return int(cursor.lastrowid)
    except sqlite3.Error as exc:
        raise CallLoggerError(f"Failed to record call: {exc}") from exc
    finally:
        conn.close()


def get_recent_calls(
    limit: int = 50, db_path: Optional[str] = None
) -> list[dict[str, Any]]:
    """Return the most recent call records (newest first)."""
    conn = _connect(db_path)
    try:
        rows = conn.execute(
            "SELECT * FROM call_history ORDER BY id DESC LIMIT ?",
            (int(limit),),
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_successful_examples(
    service: Optional[str] = None,
    limit: int = 5,
    db_path: Optional[str] = None,
) -> list[dict[str, Any]]:
    """Return past calls a human answered that produced a usable summary.

    These are the few-shot "what worked" examples the agent can inject into
    future call prompts to learn from prior successful conversations.

    Args:
        service: optionally restrict to a single service/trade.
        limit: maximum number of examples to return (newest first).
        db_path: optional override of the database file path.
    """
    clauses = [
        "answered_by_human = 1",
        "summary IS NOT NULL",
        "TRIM(summary) <> ''",
    ]
    params: list[Any] = []
    if service:
        clauses.append("service = ?")
        params.append(service)

    where = " AND ".join(clauses)
    params.append(int(limit))

    conn = _connect(db_path)
    try:
        rows = conn.execute(
            f"SELECT * FROM call_history WHERE {where} ORDER BY id DESC LIMIT ?",
            params,
        ).fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()


def get_stats(db_path: Optional[str] = None) -> dict[str, Any]:
    """Return aggregate answer-rate metrics for the whole call history.

    Returns a dict with:
        ``total_calls``       -- number of recorded calls.
        ``human_answered``    -- count answered by a human.
        ``answer_rate``       -- human_answered / total_calls (0.0 if empty).
        ``by_ended_reason``   -- {endedReason: count}.
        ``by_keyword``        -- {seo_keyword: {"calls", "human", "answer_rate"}}.
    """
    conn = _connect(db_path)
    try:
        total = conn.execute("SELECT COUNT(*) AS c FROM call_history").fetchone()["c"]
        human = conn.execute(
            "SELECT COUNT(*) AS c FROM call_history WHERE answered_by_human = 1"
        ).fetchone()["c"]

        reason_rows = conn.execute(
            "SELECT ended_reason, COUNT(*) AS c FROM call_history "
            "GROUP BY ended_reason"
        ).fetchall()
        by_ended_reason = {
            (row["ended_reason"] or "unknown"): row["c"] for row in reason_rows
        }

        keyword_rows = conn.execute(
            "SELECT seo_keyword, "
            "COUNT(*) AS calls, "
            "SUM(answered_by_human) AS human "
            "FROM call_history GROUP BY seo_keyword"
        ).fetchall()
        by_keyword: dict[str, Any] = {}
        for row in keyword_rows:
            calls = row["calls"] or 0
            humans = row["human"] or 0
            by_keyword[row["seo_keyword"] or "(none)"] = {
                "calls": calls,
                "human": humans,
                "answer_rate": (humans / calls) if calls else 0.0,
            }

        return {
            "total_calls": total,
            "human_answered": human,
            "answer_rate": (human / total) if total else 0.0,
            "by_ended_reason": by_ended_reason,
            "by_keyword": by_keyword,
        }
    finally:
        conn.close()


def format_examples_for_prompt(examples: list[dict[str, Any]]) -> str:
    """Render successful-call examples into a compact block for an LLM prompt.

    Returns an empty string when there are no examples, so callers can safely
    concatenate the result into a system prompt.
    """
    if not examples:
        return ""

    lines = ["Here are summaries of past successful calls to learn from:"]
    for i, ex in enumerate(examples, start=1):
        keyword = ex.get("seo_keyword") or "n/a"
        summary = (ex.get("summary") or "").strip()
        lines.append(f"{i}. (keyword: {keyword}) {summary}")
    return "\n".join(lines)


if __name__ == "__main__":
    stats = get_stats()
    print("[call_logger] Call history stats:")
    print(f"  total calls    : {stats['total_calls']}")
    print(f"  human answered : {stats['human_answered']}")
    print(f"  answer rate    : {stats['answer_rate']:.0%}")
    print(f"  by endedReason : {stats['by_ended_reason']}")
