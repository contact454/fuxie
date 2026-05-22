# Phase 40: Company-Wide Project Reassessment

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Operations Manager
Vai phoi hop: CEO / General Manager, CTO / Tech Lead, Product Manager EdTech

This reassessment was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Operations Manager was selected as the primary role because this is a company-wide coordination and reassessment task.
- CEO / General Manager, CTO / Tech Lead, and Product Manager EdTech were selected as support roles for strategic, technical, and product judgement.
- The selected personnel profiles were read before execution.

## Executive Verdict

Fuxie is now assessed as **post-baseline, implementation-ready with conditions**.

The project has moved beyond raw handover. Governance, intake phases, release baseline, learner activation planning, activation analytics, retention/progress readouts, motivation loop instrumentation, and AI module acceptance planning are in place.

The project is not yet ready for broad beta claims. The strongest open conditions remain:

- Provider-backed AI quality evidence and final academic signoff.
- Speaking/audio browser and provider smoke evidence.
- Broad content QA and CEFR claim confidence across large content changes.
- Teacher/admin UI smoke and analytics verification.
- Growth, budget, staffing, and beta cohort operating plan.

The company should continue implementation, but every cycle must stay bounded by the role-gate, release gates, privacy rules, and one primary product motion: helping Vietnamese German learners make weekly meaningful CEFR progress.

## Current Project Acceptance Status

| Area | Status | Evidence source | Owner |
| --- | --- | --- | --- |
| Governance and role model | Accepted | `AGENTS.md`, `.agents/workflows/`, intake board | Operations Manager |
| Baseline and release process | Accepted | Phases 0-18, baseline acceptance note, PR #2 merge evidence | Project Manager / Delivery Manager |
| Learner activation foundation | Accepted with continued iteration | Phases 23-27 and implementation cycles | Product Manager EdTech |
| Analytics event store and internal readouts | Accepted for v1 | Activation, retention, progress, and motivation slices | Data / Analytics Engineer |
| AI module | Accepted with conditions | Phase 39 AI module acceptance | AI / LLM Engineer |
| Content and CEFR confidence | Conditional | R-006 and content QA requirements | German Academic Lead |
| Speaking/audio | Conditional | R-008 and Phase 39 speaking/audio gates | Speech / Audio Engineer |
| Teacher/admin | Conditional | R-010 UI smoke requirement | Product Manager EdTech |
| Growth and business readiness | Conditional | R-011 and roadmap focus evidence | CEO / General Manager |
| Budget, staffing, legal, privacy | Needs structured plan | Intake ownership exists, but operating numbers are not final | Finance / Admin Officer, Legal / Compliance Advisor, HR / Talent Partner |

## All-Hands Assessment Roster

| Personnel role | Review focus | Current status | Required output |
| --- | --- | --- | --- |
| CEO / General Manager | Strategic priority, beta claims, budget tradeoffs | Focus is B2C Vietnamese learners first | Approve next 90-day company focus and claim boundaries |
| CTO / Tech Lead | Architecture, release gates, technical risk | Baseline is stable; AI/audio and UI smoke risks remain | Maintain engineering standards and beta-ready gates |
| Product Manager EdTech | Learner activation, roadmap, acceptance criteria | North Star and activation path are defined | Keep next cycles tied to weekly CEFR progress |
| Project Manager / Delivery Manager | Delivery sequencing, dependencies, release slicing | Phase history and evidence are organized | Keep implementation slices small, owned, and testable |
| Growth Lead | Activation, retention, beta cohort, channels | Metrics foundation exists; GTM plan is not final | Define first beta cohort and acquisition loop |
| Sales / Partnership Manager | School/teacher pipeline and partnerships | Future B2B path is acknowledged, not primary | Defer heavy B2B until learner beta has signal |
| Customer Success / Community Lead | Learner support, feedback loops, community health | Not yet operationalized | Create beta support and feedback intake process |
| Full-stack Engineer | End-to-end learner implementation | Activation slices are in motion | Keep learner flows cohesive across API and UI |
| Backend Engineer | Auth, DB, analytics, server-side events | DB generate and smoke were stabilized | Protect event quality, auth boundaries, and data integrity |
| Frontend Engineer | Dashboard, onboarding, learner surfaces | Dashboard next-action work is the first activation path | Keep primary CTA clear and mobile-safe |
| AI / LLM Engineer | AI coach, eval, provider quality, cost | AI module accepted with conditions | Close provider eval, prompt backlog, and cost baseline |
| Speech / Audio Engineer | Speaking, STT/TTS, browser permissions | Speaking/audio remains conditional | Run speaking/audio smoke and fallback validation |
| DevOps / Cloud Engineer | Env, CI/CD, deploy, monitoring, backups | Local baseline was stabilized | Maintain service readiness and deploy smoke evidence |
| QA Automation Engineer | Gates, smoke, regression confidence | Core gates and smoke process exist | Keep focused tests tied to touched surfaces |
| Data / Analytics Engineer | Activation, retention, progress, motivation readouts | Internal analytics v1 exists | Prevent metric pollution and add cohort readouts carefully |
| Security / Privacy Consultant | Secrets, PII, audio, provider data | Privacy rules are documented | Verify analytics and AI flows avoid raw sensitive data |
| Head of German Pedagogy / Academic Lead | CEFR, pedagogy, exam claim validity | AI/content claims remain guarded | Complete AI and content academic signoff |
| German Curriculum Designer | CEFR lesson path and content structure | Content base exists | Convert content risk into curriculum QA backlog |
| German Content Writer | Lesson copy and exercises | Not central in current cycle | Produce content only after QA rules are accepted |
| Vietnamese-German Localization Specialist | Vietnamese learner wording and localization | Product direction depends on this audience | Review AI feedback and onboarding language |
| Exam Prep Specialist | Goethe/Telc/OSD alignment | Exam claims are explicitly limited | Define practice-only exam prep boundaries |
| Content QA / Linguistic Reviewer | German correctness and release readiness | R-006 remains P1 | Run focused CEFR/content QA sweeps |
| Audio Script & Voice Producer | Listening/speaking scripts and audio quality | Audio is conditional | Support speaking/listening smoke with reviewed scripts |
| Product Designer / UX/UI Designer | Learner UX, dashboard clarity, mobile usability | Activation UX is defined | Validate dashboard and onboarding under real states |
| Design System Designer | UI consistency and reusable patterns | Needs ongoing governance | Keep analytics/admin surfaces consistent without redesign sprawl |
| Illustrator / 3D Mascot Artist | Fuxie mascot identity and assets | Mascot use is accepted when tied to learning moments | Avoid decorative mascot usage that distracts from study |
| Motion Designer | Micro-interactions and feedback | Not yet a blocker | Add motion only where it clarifies learning progress |
| Gamification Designer | Missions, streaks, Fucoin, reward loop | Motivation instrumentation exists | Ensure rewards reinforce meaningful learning actions |
| Operations Manager | Company workflow, documentation, handoff | Role-gate and intake process are active | Maintain owner matrix, decision logs, and review cadence |
| Finance / Admin Officer | Budget, provider cost, headcount | Cost model is incomplete | Create 90-day rough budget for AI, infra, content, and staffing |
| Legal / Compliance Advisor | Privacy, user data, education claims | Rules exist, formal review still needed | Review learner data, audio, AI claims, and terms impact |
| HR / Talent Partner | Staffing plan and hiring sequence | Personnel model exists | Map hires/contractors to the 90-day roadmap |

## Workstream Assessment

### Product / Strategy

Status: **Accepted with focus guardrails**.

Fuxie has a clear North Star: weekly meaningful CEFR progress for Vietnamese German learners. The company should resist expanding equally into learner app, teacher/admin, AI, mascot, school sales, and content at the same time. The next cycles should stay learner-first until activation, retention, AI quality, and content confidence have evidence.

Required next output: approved 90-day product focus and beta cohort definition.

### Engineering / Architecture

Status: **Accepted with continuing release discipline**.

The baseline was stabilized through the intake phases, release gates, smoke evidence, and PR handoff. Engineering can continue implementation, but new work must stay slice-based and tested. Schema changes are allowed only when the slice requires them and they are reviewed through CTO and QA gates.

Required next output: current technical risk list before each beta candidate.

### AI Module

Status: **Accepted with conditions**.

The AI module has service routes, web integration, eval tooling, CI gate, academic review workflow, controlled fixture patch process, and analytics direction. It cannot yet make strong claims about official grading, exam readiness, or pronunciation precision.

Required next output: provider-backed eval, final academic signoff, speaking/audio smoke, and cost/latency baseline.

### Learning / Content

Status: **Conditional**.

The CEFR content base exists, but large content changes still need linguistic and pedagogical review. Content should not be released as exam-authoritative unless reviewed by Academic Lead and Content QA.

Required next output: content QA sweep for A1-B2 priority content and exam-claim wording.

### UX / Design / Game Experience

Status: **Accepted for activation direction, conditional for broader brand/game system**.

The dashboard and onboarding direction now center on a primary next action. Motivation and mascot work is valid only when it supports study behavior. Decorative or reward-only engagement must be treated as a diagnostic risk, not progress.

Required next output: dashboard/onboarding visual QA under fresh-start, due-review, completed-today, and mobile states.

### QA / Release

Status: **Accepted as operating model**.

Core gates, smoke expectations, content QA, AI eval, and privacy checks are defined. QA should continue to protect slice boundaries: focused tests for touched files, full gates before release candidates, and documented blockers instead of guessed pass/fail.

Required next output: beta release gate checklist with current pass/fail/blocked status.

### DevOps / Security / Privacy

Status: **Accepted with recurring verification**.

Local service readiness and CI hygiene were improved. Privacy rules are especially important for analytics and AI: no raw learner text, transcript, audio, prompt, provider payload, token, or secret in analytics.

Required next output: beta env/secrets/provider readiness review.

### Data / Analytics / Growth

Status: **Accepted for internal v1 metrics**.

Activation, retention, weekly progress, motivation loop, and AI feedback readouts now form a usable internal measurement stack. These metrics should stay learning-centered and should not count page views, reward-only behavior, or dashboard clicks as progress.

Required next output: beta cohort readout plan and weekly operating review format.

### Operations / Finance / Legal / HR

Status: **Needs structured operating plan**.

The company model exists, but the next maturity step is operating capacity: budget, legal/privacy review, staffing plan, support process, and decision cadence.

Required next output: 90-day operating plan covering people, cost, legal/privacy, support, and beta governance.

## Open Priority Register

| Priority | Item | Owner | Acceptance signal |
| --- | --- | --- | --- |
| P0 | Maintain release gate currency before any beta candidate | QA Automation Engineer | `check:quick`, focused tests, AI/content/security gates documented |
| P0 | Prevent unsafe analytics or AI data logging | Security / Privacy Consultant | Sanitizer/tests prove no raw text/audio/prompt/provider payload is stored |
| P1 | Close R-007 AI provider quality | AI / LLM Engineer | Provider eval, academic review pack, final signoff, cost baseline |
| P1 | Close R-008 speaking/audio confidence | Speech / Audio Engineer | Browser/provider smoke and fallback behavior documented |
| P1 | Close R-006 content QA confidence | German Academic Lead | Priority CEFR/content QA blockers cleared or listed |
| P1 | Verify teacher/admin UI and analytics flows | Product Manager EdTech | Role-scoped smoke result exists |
| P1 | Define beta cohort and GTM loop | Growth Lead | Target cohort, channel, onboarding support, retention review cadence approved |
| P2 | Mature mascot and game-feel system | Gamification Designer | Reward loop improves meaningful learning, not reward-only activity |
| P2 | Create 90-day budget and staffing map | Finance / Admin Officer, HR / Talent Partner | Headcount, contractor, AI/provider, infra, and content budget draft |

## Recommended Next Implementation Cycles

1. **AI Eval Prompt Backlog From Fixture Patch Slice**
   - Owner: AI / LLM Engineer
   - Support: German Academic Lead, QA Automation Engineer
   - Output: prompt backlog from approved fixture/signoff evidence, no unreviewed prompt changes.

2. **Speaking / Audio Smoke And Fallback Slice**
   - Owner: Speech / Audio Engineer
   - Support: AI / LLM Engineer, QA Automation Engineer
   - Output: browser permission, provider availability, denied-audio fallback, and speaking confidence evidence.

3. **Content QA Academic Signoff Sweep**
   - Owner: German Academic Lead
   - Support: Content QA / Linguistic Reviewer, German Curriculum Designer
   - Output: prioritized A1-B2 CEFR/content risk list and release decisions.

4. **Teacher / Admin Analytics UI Smoke Slice**
   - Owner: Product Manager EdTech
   - Support: QA Automation Engineer, Data / Analytics Engineer
   - Output: teacher/admin role smoke and analytics readout confidence.

5. **Growth / Beta Cohort Readiness Plan**
   - Owner: Growth Lead
   - Support: CEO / General Manager, Customer Success / Community Lead, Data / Analytics Engineer
   - Output: first beta cohort, onboarding support loop, weekly metrics review.

6. **Operating Budget And Staffing Plan**
   - Owner: Finance / Admin Officer
   - Support: HR / Talent Partner, CEO / General Manager, CTO / Tech Lead
   - Output: 90-day budget and staffing map for AI, infra, content, QA, and growth.

## 30/60/90 Company Plan

| Window | Company goal | Main outputs |
| --- | --- | --- |
| Days 1-30 | Close beta blockers | AI provider eval, speaking/audio smoke, content QA sweep, teacher/admin smoke, beta release gate |
| Days 31-60 | Improve learner outcomes | AI Coach V1 hardening, dashboard activation polish, retention/progress readout review, content iteration |
| Days 61-90 | Run controlled beta | Beta cohort, weekly operating review, AI cost/quality tracking, support process, growth experiment |

## Company Operating Rules

- Every task starts with the mandatory role-gate.
- One task has exactly one primary owner and up to three support roles.
- Learning progress means meaningful learner action, not page views, reward-only activity, or dashboard clicks.
- AI feedback is practice support until academic signoff allows stronger wording.
- Exam claims stay conservative unless Academic Lead approves the exact claim.
- Runtime changes require focused tests and release gate evidence.
- Analytics and AI logs must never store raw learner submissions, transcripts, audio, prompts, provider payloads, tokens, or secrets.
- Feature expansion must not outrun QA, content, privacy, or release evidence.

## Acceptance Decision

Decision: **Fuxie accepted for continued implementation with company-wide conditions**.

Approved to continue:

- Learner activation and retention implementation.
- AI Coach V1 evidence work.
- Internal analytics/readout improvements.
- Motivation loop and mascot work tied to study behavior.
- Content QA and academic signoff.
- Beta readiness planning.

Not approved yet:

- Public beta claims without release gate evidence.
- Strong AI grading or official exam scoring claims.
- Speaking/pronunciation precision claims without smoke evidence.
- Broad B2B teacher/school expansion before learner beta signal.
- Reward-only growth loops counted as learning progress.

## Next Planned Step

The recommended next cycle is **AI Eval Prompt Backlog From Fixture Patch Slice**, unless the company chooses to prioritize speaking/audio risk first. Both are P1 beta-readiness blockers; AI eval should start first if provider access is available, while speaking/audio should start first if browser/provider smoke is the current release blocker.
