# Final MVP Plan: Conversational Website Builder for Insurance Agents

## 1) Objective
Deliver a polished MVP demo proving that a **non-technical insurance agent** can create and publish a personalized website by chatting with a bot in **under 10 minutes**.

**Demo success outcome:**
- Agent completes chat flow
- Live preview updates during onboarding
- Agent publishes site and gets a sharable URL

## 2) MVP Scope (Strict)

### In Scope (Must Have)
1. Single conversational onboarding flow (7 deterministic steps)
2. One polished website template
3. Live preview panel during onboarding
4. Publish flow that returns unique sharable URL
5. Basic disclaimer support (pre-filled + editable)
6. Skip and edit-previous-answer capabilities

### Out of Scope (Later)
- Multiple templates/themes
- Full state-by-state compliance engine
- CRM integrations
- Multi-language support
- Full analytics dashboard

## 3) Tech Stack
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend/API:** Next.js Route Handlers
- **Database:** PostgreSQL + Prisma
- **AI:** Claude API via pluggable provider abstraction
- **Validation:** Zod

## 4) Deterministic 7-Step Conversation Flow

| Step | Name | Required Fields | Completion Rule |
|---|---|---|---|
| 1 | Welcome | none | User confirms start |
| 2 | Identity | name + (phone or email) | Required fields captured or explicit skip |
| 3 | Services | services[] | At least 1 service or explicit skip |
| 4 | Tone | tone (friendly/professional) | Valid option selected or default applied |
| 5 | About | headline + aboutText | User confirms generated copy |
| 6 | Disclaimer | disclaimerText | User confirms/edit + continue |
| 7 | Review & Publish | none | User approves publish |

**Flow control rule:** app controls step progression; LLM helps with language and extraction only.

## 5) Data Model (Minimal)

### Agent
- id, name, email, phone, officeLocation, createdAt, updatedAt

### WebsiteDraft
- id, agentId, headline, aboutText, services (JSON), tone, disclaimerText, headshotUrl, status, demoUrl, createdAt, updatedAt

### ChatSession
- id, agentId, websiteId, transcript (JSON), currentStep, completedAt, createdAt, updatedAt

## 6) Structured Extraction Contract (JSON)
All extraction responses must follow strict schema:

```json
{
  "step": 2,
  "extracted": {
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": null,
    "officeLocation": "Dallas, TX"
  },
  "shouldAdvance": true,
  "needsConfirmation": false,
  "missingRequired": []
}
```

Rules:
- No extra keys.
- Missing values must be `null`.
- `shouldAdvance` only true when completion rule is satisfied.

## 7) AI Provider Abstraction (Pluggable)
Use one interface (`generateText`, `generateJSON`) and a provider registry using `AI_PROVIDER` env.
- `claude.ts`: implemented provider
- `openai.ts`: stub throwing “not configured”

This keeps future provider swaps low risk.

## 8) Prompt Guardrails (Compliance + UX)
System rules for all steps:
1. Use plain, non-technical language.
2. Ask one question at a time.
3. Offer concise choices when possible.
4. Never generate guaranteed outcomes or prohibited claims.
5. Never invent license numbers or legal facts.
6. Ask follow-up only for missing required fields.

## 9) Failure & Fallback Strategy (Critical for Demo Reliability)
If AI call fails/timeouts:
1. Show friendly message: “I hit a temporary issue. Let’s continue.”
2. Retry once automatically.
3. If retry fails, switch to rule-based fallback prompts for current step.
4. Keep user progress; never reset session.

### Implementation detail (recommended)
Store static fallback prompts directly alongside step definitions (e.g., `src/lib/chat/steps.ts`) so each step has a no-AI backup question.

Example fallback for Step 3 (Services):
> “What types of insurance do you help clients with? For example: auto, home, life, health, or business.”

This approach is trivial to implement and guarantees the flow can continue even if the AI provider is temporarily unavailable.

## 10) API Surface

### `POST /api/chat/start`
Creates Agent + WebsiteDraft + ChatSession, returns initial message and IDs.

### `POST /api/chat`
Input: `{ sessionId, message }`  
Output: `{ reply, currentStep, totalSteps, extractedData, previewReady }`

Server flow:
1. Load session + draft + agent
2. Append user message
3. Run step processor
4. Persist extracted fields
5. Advance step when rules are met
6. Save assistant response
7. Return updated progress

### `GET /api/preview/[websiteId]`
Renders template HTML for iframe preview.

### `POST /api/publish/[websiteId]`
Publishes draft and returns shareable URL.

## 11) UI Requirements

### Builder Screen
- Split view: Chat (left) + Preview (right)
- Mobile: tabbed Chat/Preview
- Progress indicator: “Step X of 7 – {Label}”
- Loading states and inline error states

### Chat UX
- Message bubbles, assistant avatar
- Enter to send, Shift+Enter newline
- “Skip for now” action
- Clickable previous steps for edits

### Preview UX
- Auto-refresh after substantive updates
- Desktop/mobile toggle
- Placeholder until enough data exists

## 12) Publish Strategy for MVP
Use DB-backed rendering for reliability:
- Save `demoUrl` slug on publish
- Serve via `/sites/[slug]` using latest stored data
- Avoid filesystem-only writes that can be fragile in serverless environments

## 13) File Structure (Target)

```text
webmaster/
  .env.example
  docker-compose.yml
  prisma/schema.prisma
  src/
    app/
      page.tsx
      build/page.tsx
      sites/[slug]/page.tsx
      api/chat/route.ts
      api/chat/start/route.ts
      api/preview/[websiteId]/route.ts
      api/publish/[websiteId]/route.ts
    components/chat/*
    components/preview/*
    hooks/useChat.ts
    lib/db.ts
    lib/ai/types.ts
    lib/ai/provider-registry.ts
    lib/ai/providers/claude.ts
    lib/ai/providers/openai.ts
    lib/chat/steps.ts
    lib/chat/prompts.ts
    lib/chat/processor.ts
    lib/templates/renderer.ts
    lib/templates/components/*
    lib/validators/*
```

## 14) Implementation Plan (2 Weeks)

### Week 1
- Scaffold app + DB
- Implement Prisma schema + migrations
- Build chat start/send APIs
- Implement 7-step processor + extraction schema
- Build basic chat UI + progress indicator

### Week 2
- Implement template renderer + preview iframe
- Add publish flow and shareable URLs
- Add fallback mode + retry behavior
- Add skip/edit flows
- Polish UX and error handling
- Run MVP verification tests

## 15) Verification Plan (Must Pass)

### Golden Path Test
- Complete steps 1–7 with realistic profile
- Confirm publish link works
- Total completion time < 10 min

### Skip/Edit Test
- Skip step(s), then return and edit
- Confirm DB and preview update correctly

### Mobile Test
- Complete flow on mobile viewport
- Validate chat/preview tabs and responsive output

### Failure Test
- Simulate AI outage/invalid key
- Confirm fallback prompts allow completion

### Persona Test Set (5)
1. Auto/home agent, professional tone
2. Life agent, friendly tone
3. Commercial specialist, minimal inputs
4. Rural multi-line agent, many skips
5. Agent who edits responses repeatedly

## 16) Demo Day Script (Client Meeting)
1. Open landing page → click **Get Started**
2. Complete chat flow naturally (5–7 minutes)
3. Highlight live preview updating
4. Publish site
5. Open sharable URL on desktop and mobile
6. Close with: “No technical skills required; scalable to 1,000 agents.”

## 17) Go/No-Go Checklist
Proceed to client demo only if all are true:
- 5/5 internal users complete flow without help
- End-to-end flow consistently under 10 minutes
- Publish URL stable across refresh/new browser
- Mobile view clean and readable
- AI failure fallback tested successfully

## 18) Immediate Next Actions
1. Approve this final MVP plan
2. Set up repo + environment variables
3. Build Day 1–3 “golden path” implementation
4. Load 3 sample agent personas for daily test runs
5. Rehearse full demo twice before client presentation

---
Prepared as the final team-shareable MVP execution plan.
