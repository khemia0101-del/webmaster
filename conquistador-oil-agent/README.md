# Conquistador Oil — Autonomous Operations Agent

An autonomous outbound-operations pipeline for Conquistador Oil. It turns an
inbound website lead into a sequence of authorized AI voice calls to local
contractors, captures the outcome of every call, and learns from its own
history — all while keeping secrets and call data local.

## What it does

1. **Sources contractors** for a lead via the Google Places API, filtered by a
   minimum rating and enriched with a dialable phone number.
2. **Places outbound AI voice calls** through Vapi, authorized with a dynamic
   Codex OAuth bearer token, injecting the customer's SEO keyword for context.
3. **Polls each call to resolution** and maps Vapi's `endedReason` into a simple
   "did a human answer?" decision, advancing to the next contractor on
   voicemail / busy / no-answer.
4. **Records every call** to a local SQLite store and exposes "what worked"
   examples + answer-rate stats so the agent can learn from past calls.

## Project layout

```
conquistador-oil-agent/
├── .env                  # secrets & config (gitignored — never committed)
├── agent_config.yaml     # operations-manager system instructions
├── run.py                # master pipeline + runnable mock simulation
├── docs/
│   └── HERMES-SETUP.md   # ECC/Hermes plugin setup guide
└── tools/
    ├── auth_oauth.py     # Codex OAuth client-credentials token manager
    ├── google_leads.py   # Google Places contractor sourcing
    ├── telephony_quotes.py  # Vapi outbound dialing + transcript mapping
    ├── ecc_bridge.py     # delegation into the ECC Claude Code CLI
    └── call_logger.py    # local SQLite call-history + learning helpers
```

## Setup

1. **Install dependencies:**
   ```bash
   pip install requests python-dotenv pyyaml
   ```
2. **Fill in `.env`** (copy the keys below and replace the placeholders):

   | Variable | Purpose |
   | --- | --- |
   | `GOOGLE_PLACES_API_KEY` | Google Places lead sourcing |
   | `CODEX_OAUTH_CLIENT_ID` / `CODEX_OAUTH_CLIENT_SECRET` / `CODEX_OAUTH_TOKEN_URL` | OAuth bearer token for Vapi auth |
   | `VAPI_PHONE_NUMBER_ID` | the Vapi number used for outbound calls |
   | `OPENAI_API_KEY` / `HERMES_MODEL` | the conversational model for calls |
   | `MIN_GOOGLE_RATING` | minimum contractor rating (default `4.0`) |
   | `CLAUDE_CODE_ENV_PATH` | path to the `claude` CLI for the ECC bridge |
   | `CALL_HISTORY_DB` | optional override for the call-history DB path |

## Running

**Mock simulation (no credentials, no cost):**
```bash
python run.py
```
This exercises the full pipeline end-to-end against scripted contractors and
calls, then prints a learning snapshot (answer rate, outcome codes, and the
successful-call examples the agent would reuse). It writes to a throwaway
`data/call_history_mock.db` so it never pollutes real data.

**Live run** (requires real credentials in `.env`):
```python
from run import process_new_website_lead

process_new_website_lead(
    location="Midland, TX",
    service="oil field maintenance",
    seo_metadata={"keyword": "emergency oil rig pump repair near me"},
)
```

## Cost notes

- The **mock simulation is free.** Validate all pipeline logic there first.
- Live cost drivers: Vapi voice minutes (highest), the call LLM, Google Places
  requests, and (if used) the ECC bridge — each `claude -c` spawn is a separate
  billed session.
- Biggest lever: set `HERMES_MODEL=gpt-4o-mini` and a low-cost TTS voice to
  roughly halve per-minute call cost.

## Privacy & data handling

- **Secrets** live only in `.env`, which is gitignored — never committed.
- **Call history** (transcripts, quotes) is stored locally in `data/`, which is
  gitignored. Text records are tiny (~KB per call).
- **Unavoidably external:** the phone carrier that physically places the call,
  and whichever LLM / speech provider powers the conversation. A fully
  closed-loop, zero-leak system is not possible for outbound phone calling.

## The learning loop

`tools/call_logger.py` provides:
- `record_call(...)` — persist a call outcome (wired into `run.py`).
- `get_successful_examples(...)` — past human-answered calls with a real quote,
  ready to inject as few-shot examples into future call prompts.
- `get_stats()` — answer rate overall, per `endedReason` code, and per SEO
  keyword.
- `format_examples_for_prompt(...)` — render examples into a prompt block.

This is retrieval-based learning (reuse what worked) — it does **not** fine-tune
any model, so it adds only a handful of tokens per call.
