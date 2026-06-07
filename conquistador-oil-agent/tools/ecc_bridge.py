"""Delegation bridge into the ECC (Everything Claude Code) CLI.

Provides :func:`execute_ecc_coding_task`, a thin subprocess wrapper that hands a
complex engineering sub-task down to the underlying terminal Claude Code engine
via the ``/ecc:plan`` slash command. This lets the operations manager keep
control of high-level orchestration while delegating deep coding, file
modification, and pull-request work to ECC.
"""

from __future__ import annotations

import os
import shlex
import subprocess
from typing import Any

from dotenv import load_dotenv

load_dotenv()

# Default timeout (seconds) for an ECC planning invocation.
_ECC_TIMEOUT = 900


class ECCBridgeError(RuntimeError):
    """Raised when the ECC CLI cannot be invoked or exits with an error."""


def _resolve_claude_binary() -> str:
    """Locate the Claude Code CLI executable.

    Honors ``CLAUDE_CODE_ENV_PATH`` when set, otherwise falls back to ``claude``
    on the system ``PATH``.
    """
    return os.getenv("CLAUDE_CODE_ENV_PATH", "").strip() or "claude"


def execute_ecc_coding_task(
    task_description: str, timeout: int = _ECC_TIMEOUT
) -> dict[str, Any]:
    """Delegate a coding sub-task to the ECC Claude Code engine.

    Builds and runs the CLI sequence::

        claude -c "/ecc:plan '<task_description>'"

    Args:
        task_description: a natural-language description of the engineering task
            to delegate (e.g. "Add retry logic to the Vapi client").
        timeout: maximum seconds to wait for the CLI to complete.

    Returns:
        A dict with ``returncode``, ``stdout``, ``stderr`` and the resolved
        ``command`` list.

    Raises:
        ECCBridgeError: if the task description is empty, the binary is missing,
            the call times out, or the CLI exits non-zero.
    """
    if not task_description or not task_description.strip():
        raise ECCBridgeError("task_description must be a non-empty string.")

    binary = _resolve_claude_binary()

    # The slash command and its single-quoted argument are passed as one string
    # so the CLI parses it as a single -c continuation prompt. shlex.quote keeps
    # any embedded quotes/spaces from breaking the inner command.
    sanitized = task_description.strip().replace("'", "\\'")
    ecc_command = f"/ecc:plan '{sanitized}'"
    command = [binary, "-c", ecc_command]

    try:
        completed = subprocess.run(
            command,
            capture_output=True,
            text=True,
            timeout=timeout,
            check=False,
        )
    except FileNotFoundError as exc:
        raise ECCBridgeError(
            f"Claude Code CLI not found at '{binary}'. "
            "Set CLAUDE_CODE_ENV_PATH or ensure 'claude' is on PATH."
        ) from exc
    except subprocess.TimeoutExpired as exc:
        raise ECCBridgeError(
            f"ECC task timed out after {timeout}s: {shlex.join(command)}"
        ) from exc
    except OSError as exc:
        raise ECCBridgeError(f"Failed to launch ECC CLI: {exc}") from exc

    if completed.returncode != 0:
        raise ECCBridgeError(
            f"ECC task exited with code {completed.returncode}: "
            f"{completed.stderr.strip()[:500]}"
        )

    return {
        "returncode": completed.returncode,
        "stdout": completed.stdout,
        "stderr": completed.stderr,
        "command": command,
    }


if __name__ == "__main__":
    try:
        result = execute_ecc_coding_task(
            "Summarize the repository structure and propose a test plan."
        )
        print("[ecc_bridge] ECC task completed.")
        print(result["stdout"])
    except ECCBridgeError as err:
        print(f"[ecc_bridge] Delegation failed: {err}")
