# Hermes + Everything Claude Code (ECC) Setup

This guide captures the standard plugin setup directives for running
**Everything Claude Code (ECC)** inside a **Hermes** instance, so the
Conquistador Oil operations agent can delegate deep coding sub-tasks via
`tools/ecc_bridge.py`.

---

## Prerequisites

- A working **Hermes** instance with terminal access.
- The **Claude Code** CLI installed and reachable on `PATH` (or referenced via
  `CLAUDE_CODE_ENV_PATH` in `.env`).
- Network access to the plugin marketplace.

Verify the CLI is available:

```bash
claude --version
```

---

## Step 1 — Install the ECC plugin

From inside the Hermes Claude Code session, install the plugin from its
marketplace channel:

```
/plugin install everything-claude-code@everything-claude-code
```

This pulls the full ECC plugin bundle (skills, slash commands, and the
`/ecc:*` command namespace).

---

## Step 2 — Configure ECC

Run the interactive configuration command to initialize ECC for this instance:

```
/configure-ecc
```

During configuration, align the answers with the values in `.env`:

| Prompt                | `.env` variable           | Suggested value |
| --------------------- | ------------------------- | --------------- |
| Profile type          | `ECC_PROFILE_TYPE`        | `full`          |
| Security scanning      | `ECC_SECURITY_SCANNING`   | `true`          |
| Claude binary path    | `CLAUDE_CODE_ENV_PATH`    | `/usr/local/bin/claude` |

---

## Step 3 — Import existing Hermes context

Bring any existing Hermes project context, memory, and configuration into ECC:

```
/ecc:hermes-import
```

This synchronizes the Hermes workspace state so subsequent `/ecc:plan`
invocations operate with full project awareness.

---

## Step 4 — Verify delegation works

The operations agent delegates engineering work through:

```
claude -c "/ecc:plan '<task description>'"
```

You can confirm the bridge end-to-end from the repository root:

```bash
python -m tools.ecc_bridge
```

A successful run prints `[ecc_bridge] ECC task completed.` followed by the
plan output. If you see `Claude Code CLI not found`, fix `CLAUDE_CODE_ENV_PATH`
in `.env` or ensure `claude` is on your `PATH`.

---

## Command reference

| Command                                              | Purpose                                  |
| ---------------------------------------------------- | ---------------------------------------- |
| `/plugin install everything-claude-code@everything-claude-code` | Install the ECC plugin bundle.   |
| `/configure-ecc`                                     | Initialize/adjust ECC configuration.      |
| `/ecc:hermes-import`                                 | Import Hermes context into ECC.           |
| `/ecc:plan '<task>'`                                 | Generate an implementation plan for a task. |
