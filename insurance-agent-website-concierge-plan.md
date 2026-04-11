# MVP Plan: Conversational Website Builder for Insurance Agents

## Purpose of This MVP
Create a working demo for your client (the insurance company) that proves one thing clearly:

> An insurance agent can create a personalized website by simply chatting with a bot.

This MVP focuses on speed, clarity, and a polished demo experience—not full enterprise rollout.

## MVP Demo Story (What the Client Should See)
In under 10 minutes, a non-technical agent should be able to:
1. Start a chat with the Website Concierge bot.
2. Answer simple questions in plain language.
3. See a live website preview update from their answers.
4. Click **Publish Demo Site**.
5. Get a sharable link.

## MVP Scope (Must-Have)

### 1) Conversational Onboarding Bot
The bot asks friendly, non-technical questions such as:
- “What’s your name and office location?”
- “What insurance services do you offer most?”
- “How should clients contact you?”
- “Would you like a friendly tone or professional tone?”

**UX requirements**
- One question at a time.
- Progress indicator (e.g., Step 3 of 7).
- “Skip for now” option.
- “Edit previous answer” option.

### 2) Website Generation From Answers
Generate a website using one template with customizable content blocks:
- Agent name + photo
- Hero headline
- Services offered
- About section
- Contact section
- Basic compliance/disclaimer footer

### 3) Live Preview Experience
- Show preview panel during chat.
- Update preview after each major answer.
- Keep visuals clean and mobile-friendly.

### 4) Demo Publish
- “Publish Demo Site” button.
- Create a unique demo URL slug.
- Store generated site data for later review.

## Out of Scope for MVP (Later Phases)
- Multi-template marketplace
- Full state-by-state compliance engine
- CRM integrations
- Full analytics suite
- Multi-language support
- Advanced SEO tooling

## Recommended MVP Tech Stack (Simple + Fast)
- **Frontend**: Next.js or React app with split view (chat + preview)
- **Backend**: Node.js/Express or Next.js API routes
- **LLM orchestration**: Prompt + structured JSON output
- **Database**: Postgres (or Supabase) for agent/session/site data
- **Hosting**: Vercel (frontend/API) + managed DB

## MVP Conversation Flow (7 Steps)
1. Welcome + explain process
2. Agent identity (name, office, contact)
3. Services and specialties
4. Tone selection (friendly/professional)
5. About text generation + confirm edits
6. Disclaimer/contact confirmation
7. Review + publish demo site

## Data Model (Minimal)

### Agent
- id
- name
- office_location
- phone
- email

### WebsiteDraft
- id
- agent_id
- headline
- about_text
- services_json
- tone
- disclaimer_text
- status (draft/published)
- demo_url

### ChatSession
- id
- agent_id
- transcript_json
- current_step
- started_at
- completed_at

## Prompting Strategy for Reliability
Use a strict system prompt that forces structured output:
- Return JSON fields only for known content slots.
- Keep language at ~8th-grade reading level.
- Ask follow-up when required fields are missing.
- Never generate prohibited promises (e.g., “guaranteed approval”).

## Demo-Day Script (For Your Client Meeting)

### Scripted walkthrough
1. “Here’s an agent with no technical skills.”
2. Start chat and answer naturally.
3. Show website preview updating in real-time.
4. Publish the site.
5. Open published URL on desktop + mobile.

### What to emphasize
- Very low training required for agents.
- Faster launch than manual web form processes.
- Consistent brand/compliance scaffolding.
- Easy to scale across many agents.

## 2-Week MVP Build Plan

### Week 1
- Build chat UI + step flow
- Implement one website template
- Add structured generation endpoint
- Save draft data in database

### Week 2
- Add live preview updates
- Add publish flow + unique demo URLs
- Refine copy tone and plain-language prompts
- QA with 3–5 mock agent profiles
- Prepare client demo script

## MVP Success Criteria
- 1 working conversational flow from start to publish.
- 5/5 internal test users can complete without technical help.
- End-to-end completion time under 10 minutes.
- Published demo link works reliably during live walkthrough.

## Immediate Next Actions
1. Approve this MVP scope.
2. Pick stack (Next.js + Supabase recommended).
3. Build one “golden path” conversation flow.
4. Create 3 realistic sample agent profiles for testing.
5. Rehearse the client demo twice before presentation.

---
Prepared as a client-facing MVP execution plan.
