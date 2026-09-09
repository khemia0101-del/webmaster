"""Codex OAuth token manager.

Implements an OAuth 2.0 *client credentials* grant against
``CODEX_OAUTH_TOKEN_URL`` and caches the resulting bearer token in a module
level global. Downstream tools (e.g. :mod:`tools.telephony_quotes`) request the
token via :func:`get_bearer_token`. When a downstream call receives an HTTP 401
the cache should be flushed with :func:`clear_token_cache` so the next request
forces a fresh token negotiation.

The cache is intentionally a simple in-process global: the token is transient,
should never be persisted to disk, and the pipeline is single-process.
"""

from __future__ import annotations

import os
import threading
import time
from typing import Optional

import requests
from dotenv import load_dotenv

# Load environment variables from the local .env once at import time.
load_dotenv()

# Network timeout (seconds) for the token endpoint round-trip.
_TOKEN_REQUEST_TIMEOUT = 30

# Refresh the token this many seconds before its advertised expiry to avoid
# racing the expiry boundary on a slow downstream call.
_EXPIRY_SAFETY_MARGIN = 60

# ---------------------------------------------------------------------------
# Transient cache (module-global).
# ---------------------------------------------------------------------------
_cached_token: Optional[str] = None
_token_expires_at: float = 0.0

# Guards the cache so concurrent callers do not stampede the token endpoint.
_cache_lock = threading.Lock()


class OAuthConfigurationError(RuntimeError):
    """Raised when required OAuth environment variables are missing."""


class OAuthTokenError(RuntimeError):
    """Raised when the token endpoint cannot be reached or returns an error."""


def _load_oauth_config() -> tuple[str, str, str]:
    """Read and validate the OAuth configuration from the environment.

    Returns:
        Tuple of ``(token_url, client_id, client_secret)``.

    Raises:
        OAuthConfigurationError: if any required variable is unset/empty.
    """
    token_url = os.getenv("CODEX_OAUTH_TOKEN_URL", "").strip()
    client_id = os.getenv("CODEX_OAUTH_CLIENT_ID", "").strip()
    client_secret = os.getenv("CODEX_OAUTH_CLIENT_SECRET", "").strip()

    missing = [
        name
        for name, value in (
            ("CODEX_OAUTH_TOKEN_URL", token_url),
            ("CODEX_OAUTH_CLIENT_ID", client_id),
            ("CODEX_OAUTH_CLIENT_SECRET", client_secret),
        )
        if not value
    ]
    if missing:
        raise OAuthConfigurationError(
            "Missing required OAuth environment variables: " + ", ".join(missing)
        )

    return token_url, client_id, client_secret


def _request_new_token() -> tuple[str, float]:
    """Negotiate a brand new bearer token via client credentials grant.

    Returns:
        Tuple of ``(access_token, absolute_expiry_epoch_seconds)``.

    Raises:
        OAuthConfigurationError: if configuration is incomplete.
        OAuthTokenError: on transport failure or a non-success response.
    """
    token_url, client_id, client_secret = _load_oauth_config()

    payload = {
        "grant_type": "client_credentials",
        "client_id": client_id,
        "client_secret": client_secret,
    }
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
    }

    try:
        response = requests.post(
            token_url,
            data=payload,
            headers=headers,
            timeout=_TOKEN_REQUEST_TIMEOUT,
        )
    except requests.RequestException as exc:
        raise OAuthTokenError(
            f"Failed to reach OAuth token endpoint '{token_url}': {exc}"
        ) from exc

    if response.status_code != 200:
        raise OAuthTokenError(
            "OAuth token endpoint returned HTTP "
            f"{response.status_code}: {response.text[:500]}"
        )

    try:
        body = response.json()
    except ValueError as exc:
        raise OAuthTokenError(
            "OAuth token endpoint returned a non-JSON response."
        ) from exc

    access_token = body.get("access_token")
    if not access_token:
        raise OAuthTokenError(
            "OAuth token response did not contain an 'access_token' field."
        )

    # ``expires_in`` is optional; default to a conservative 1 hour if absent.
    try:
        expires_in = int(body.get("expires_in", 3600))
    except (TypeError, ValueError):
        expires_in = 3600

    expires_at = time.time() + max(expires_in - _EXPIRY_SAFETY_MARGIN, 0)
    return access_token, expires_at


def get_bearer_token(force_refresh: bool = False) -> str:
    """Return a valid bearer token, refreshing the cache when necessary.

    Args:
        force_refresh: when ``True``, ignore the cached token and negotiate a
            fresh one (also useful after a downstream 401).

    Returns:
        A bearer token string suitable for an ``Authorization: Bearer`` header.
    """
    global _cached_token, _token_expires_at

    with _cache_lock:
        token_is_valid = (
            _cached_token is not None and time.time() < _token_expires_at
        )
        if not force_refresh and token_is_valid:
            return _cached_token

        token, expires_at = _request_new_token()
        _cached_token = token
        _token_expires_at = expires_at
        return _cached_token


def clear_token_cache() -> None:
    """Flush the cached token.

    Call this when a downstream tool receives an HTTP 401 Unauthorized so the
    next :func:`get_bearer_token` call forces a fresh negotiation.
    """
    global _cached_token, _token_expires_at

    with _cache_lock:
        _cached_token = None
        _token_expires_at = 0.0


def get_authorization_header(force_refresh: bool = False) -> dict[str, str]:
    """Convenience helper returning a ready-to-use Authorization header dict."""
    return {"Authorization": f"Bearer {get_bearer_token(force_refresh=force_refresh)}"}


if __name__ == "__main__":
    # Smoke test: attempt a token negotiation and report the outcome without
    # leaking the secret material to stdout.
    try:
        token = get_bearer_token()
        print(f"[auth_oauth] Acquired bearer token (length={len(token)}).")
    except (OAuthConfigurationError, OAuthTokenError) as err:
        print(f"[auth_oauth] Token acquisition failed: {err}")
