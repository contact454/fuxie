# Phase 39: AI Module Acceptance And Master Plan

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: AI / LLM Engineer
Vai phoi hop: Head of German Pedagogy / Academic Lead, QA Automation Engineer, Data / Analytics Engineer

This implementation was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The AI / LLM Engineer, German Academic Lead, QA Automation Engineer, and Data / Analytics Engineer profiles were read.
- The task domain is AI module acceptance, AI coach quality planning, academic signoff, QA gates, and privacy-safe AI analytics.

## Summary

The team accepts the Fuxie AI Module as **accepted with conditions**.

The technical foundation is now strong enough to continue product development:

- AI service routes exist for chat, grading, generation, audio, and health.
- Web integrations exist for tutor chat, writing submit, speaking flows, and AI analytics readout.
- Offline AI eval, CI gate, artifact readout, academic review pack, signoff workflow, fixture expansion, and controlled fixture patch tooling exist.
- AI feedback analytics are designed around safe metadata, not raw learner content.

The module is not yet cleared for strong public claims such as:

- "AI grading is accurate."
- "Official Goethe/Telc/OSD score prediction."
- "Official exam readiness certification."

Those claims remain blocked until provider-backed eval evidence, final German Academic Lead signoff, speaking/audio smoke, and cost/latency baseline are complete.

## Team Acceptance Review

| Role | Acceptance conclusion | Missing condition |
| --- | --- | --- |
| AI / LLM Engineer | AI architecture, eval workflow, and controlled fixture tooling are ready for continued development | Provider-backed eval, prompt backlog, and cost baseline |
| Head of German Pedagogy / Academic Lead | CEFR, exam-claim, and academic signoff guardrails are explicit | Final signoff on A1-B2 samples generated from current provider behavior |
| QA Automation Engineer | Offline eval and AI service tests have usable gates | Provider/audio/fallback smoke before beta |
| Data / Analytics Engineer | AI feedback event direction and admin readout are usable for v1 | AI quality metric and cost/latency readout v1 |

## Module Boundary

The AI Module includes:

- `apps/ai-service` routes: `/chat`, `/grade`, `/generate`, `/audio`, `/health`.
- Web learner AI surfaces: tutor chat, writing submit, speaking support, grammar/progress handoff.
- AI eval tooling: `eval:ai`, `check:ai-eval`, academic review, academic signoff, fixture expansion, controlled fixture patch.
- AI analytics: generated/failed feedback events and admin AI eval readout.
- Academic governance: German Academic Lead signoff before stronger learning or exam claims.

The AI Module does not include:

- External AI warehouse or BI dashboard.
- Provider migration.
- Official Goethe/Telc/OSD scoring claims.
- Teacher/admin AI summaries for v1.
- Raw learner text, transcript, audio, prompt, provider payload, token, or secret storage in analytics.

## Surface Acceptance Status

| Surface | Status | Acceptance note | Remaining blocker |
| --- | --- | --- | --- |
| Tutor chat | Accepted with conditions | CEFR-aware tutor behavior and chat surfaces exist | Provider-backed quality sample and fallback smoke |
| Writing feedback | Accepted with conditions | Practice rubric flow, analytics success/failure events, and eval cases exist | Academic signoff and provider cost/latency baseline |
| Speaking support | Conditional | Speaking/audio routes and support expectations exist | Browser permission, provider, transcript/audio quality smoke |
| Grammar grading | Conditional | AI service grammar grading route exists | Learner-facing fallback and eval coverage need hardening |
| TTS/pronunciation | Conditional | Audio routes exist for TTS and pronunciation | Provider/audio smoke and claim boundaries |
| Generation | Conditional | Generation route exists | Must remain behind eval and content QA before learner-critical use |
| Fallback/safety | Accepted as guardrail, not complete | Provider failure, missing profile, rate limit, audio denied, and low confidence are documented | Runtime smoke and user-facing consistency checks |
| Analytics/readout | Accepted for v1 evidence | `ai_feedback_generated` and `ai_feedback_failed` are the core events | Cost/latency fields and quality metric readout |

## Operating Rules

- AI grading is practice feedback only until Academic Lead validates stronger claims.
- No official exam score, guarantee, or pass/fail claim may be shown from AI output.
- Prompt changes must pass offline eval before release.
- Provider-backed eval must be completed or explicitly blocked with reason before beta claims.
- Academic review pack and final signoff are required before stronger AI tutor/grading promises.
- Speaking/audio claims must stay conservative until browser/provider smoke is current.
- Analytics may log safe metadata only; never raw learner submissions, transcripts, audio, prompts, provider payloads, tokens, or secrets.
- Controlled fixture patch may mutate `baseline.json` only with explicit `--apply` and an unblocked proposal plan.

## Provider-Backed Eval And Academic Signoff Plan

The AI quality acceptance chain is:

1. Run automated gate:

```bash
pnpm check:ai-eval
```

2. Run provider-backed eval when `GEMINI_API_KEY` or `GOOGLE_AI_API_KEY` is available:

```bash
pnpm eval:ai -- --provider --allow-provider-blocked
```

3. Generate academic review pack:

```bash
pnpm eval:ai:academic-review
```

4. Academic Lead completes signoff JSON and validates it:

```bash
pnpm eval:ai:academic-signoff -- --signoff <file> --require-final
```

5. If `changes_requested` exists, convert it into proposal-only fixture backlog:

```bash
pnpm eval:ai:fixture-expansion -- --signoff <file> --require-final
```

6. Preview controlled fixture patch:

```bash
pnpm eval:ai:controlled-fixture-patch
```

7. Apply fixture patch only after explicit approval:

```bash
pnpm eval:ai:controlled-fixture-patch -- --apply
```

## Runtime AI Coach V1 Plan

| Surface | V1 behavior | Release requirement |
| --- | --- | --- |
| Tutor chat | Explain German concepts at CEFR level, with Vietnamese support and one next action | Provider fallback and safe analytics event |
| Writing feedback | Return practice rubric, 1-3 priority corrections, retry plan | No official exam claim; success/failure analytics |
| Speaking support | Confidence-building feedback and retry suggestion | Audio permission fallback and no precise claim without signal |
| Grammar grading | Targeted correction, rule explanation, next exercise suggestion | Eval coverage and learner-safe failure state |
| Fallback | Continue learning with non-AI study action | Smoke proves AI outage does not block meaningful study |

## AI Analytics V1 Plan

Core events:

- `ai_feedback_generated`
- `ai_feedback_failed`

Required safe dimensions:

- flow: `chat`, `writing`, `speaking`, `grammar`
- action type
- CEFR level
- skill
- score percent when applicable
- estimated level when applicable
- criteria count
- correction count
- provider status
- error type
- latency and cost when available

Admin readout should show:

- generated events and users
- failed events and users
- failure rate
- score summary by flow
- provider failure split
- cost/latency baseline when available

## Beta-Ready Gates

Module AI becomes beta-ready only when:

- `pnpm --filter @fuxie/ai-service test` passes.
- `pnpm check:ai-eval` passes or provider run is blocked with a documented reason.
- Final Academic Lead signoff has no pending case or dimension.
- Writing submit success/failure analytics paths are tested.
- Speaking/audio smoke has a current result or explicitly accepted blocker.
- Cost/latency baseline report exists.
- R-007 and R-008 are closed, downgraded, or accepted by owner.

## Test Plan

| Layer | Required checks |
| --- | --- |
| Unit | Eval harness, artifact readout, academic review pack, signoff, fixture expansion, controlled fixture patch |
| API | Writing submit AI success/failure, chat event logging, speaking evaluate/progress, admin AI eval readout auth/date validation |
| Smoke | AI health, web-to-AI writing grading, chat tutor response, provider missing-key fallback, speaking/audio permission fallback |
| Governance | Review pack omits raw provider output; signoff omits raw learner data; controlled fixture patch does not mutate baseline unless `--apply` |

## 90-Day AI Roadmap

| Window | Goal | Output |
| --- | --- | --- |
| Days 1-14 | Close acceptance blockers | Provider eval, final signoff, AI acceptance doc |
| Days 15-30 | Ship AI Coach V1 safely | Tutor/writing/speaking fallback hardened, admin readout usable |
| Days 31-60 | Improve quality loop | Academic feedback updates fixtures/prompts, cost/latency tracked |
| Days 61-90 | Beta AI learning outcomes | AI retry improvement, weekly progress impact, failure rate under control |

## Residual Risks

| Risk | Status | Owner | Closure signal |
| --- | --- | --- | --- |
| R-007 provider AI quality remains unverified with real provider behavior | Open | AI / LLM Engineer | Provider-backed eval and academic signoff complete |
| R-008 speaking/live audio may fail in browser/provider edge cases | Open | Speech / Audio Engineer with AI / LLM Engineer support | Speaking/audio smoke result documented |
| AI cost may grow with chat/writing usage | Open | AI / LLM Engineer | Cost baseline and cap policy documented |
| Learners may over-trust AI grades | Controlled but open | German Academic Lead | Product copy and AI output stay practice-only |
| Analytics may drift into unsafe content logging | Controlled | Data / Analytics Engineer | Event sanitizer and readout tests remain current |

## Acceptance Decision

Decision: **accepted with conditions**.

Accepted for:

- Continued AI coach implementation.
- Internal eval and academic review workflow.
- Practice feedback experiments for Vietnamese German learners.
- Admin/internal quality readout v1.

Not accepted for:

- Public claims of official exam scoring.
- Strong grading accuracy claims.
- Unreviewed prompt changes.
- Speaking/pronunciation precision claims without smoke evidence.

## Next Planned Step

The next implementation cycle should be **AI Eval Prompt Backlog From Fixture Patch Slice**:

1. Convert controlled fixture patch changes into prompt backlog items.
2. Keep prompt implementation separate from fixture evidence.
3. Re-run eval, review pack, signoff, and controlled fixture patch after prompt changes.
