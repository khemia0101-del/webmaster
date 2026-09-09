"""Conquistador Oil autonomous operations toolset.

This package bundles the integration modules used by the operations manager
pipeline:

* :mod:`tools.auth_oauth`        -- Codex OAuth client-credentials token manager.
* :mod:`tools.google_leads`      -- Google Places contractor sourcing.
* :mod:`tools.telephony_quotes`  -- Vapi outbound voice dialing + transcript mapping.
* :mod:`tools.ecc_bridge`        -- Delegation bridge into the ECC Claude Code CLI.
* :mod:`tools.call_logger`       -- Local SQLite call-history store + learning helpers.
"""

from __future__ import annotations

__all__ = [
    "auth_oauth",
    "google_leads",
    "telephony_quotes",
    "ecc_bridge",
    "call_logger",
]

__version__ = "1.0.0"
