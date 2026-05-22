# Phase 53: Beta Feedback Triage And Targeted Fix Backlog

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: Operations Manager, Product Manager EdTech, CTO / Tech Lead

This phase was implemented under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- Project Manager / Delivery Manager was selected because this phase organizes beta evidence into triage and delivery backlog.
- Operations Manager, Product Manager EdTech, and CTO / Tech Lead profiles were read as support roles.
- No runtime code, schema, content JSON, AI prompt, provider config, or deploy config is changed in this phase.

## Team Acceptance Review

Phase 52 is accepted with dependency. It creates the cohort operations plan, measurement cadence, issue triage rules, and exclusion guardrails, but it does not yet contain live cohort evidence.

| Function | Verdict | Notes |
| --- | --- | --- |
| Project / Delivery | Accepted with dependency | Phase 52 is ready to operate, but Phase 53 needs real evidence before selecting fixes |
| Operations | Accepted | Cohort roster and invite status are the first data inputs needed |
| Product Manager EdTech | Accepted | Learner friction must be ranked by observed behavior and feedback, not assumptions |
| CTO / Tech Lead | Accepted with conditions | Technical fixes require reproducible defects, owner, severity, and verification path |

## Objective

Turn Phase 52 cohort operations into a ready-to-use triage board. Until real cohort evidence exists, this phase is complete as a template and holds status `waiting_for_cohort_data`.

Phase 53 should prevent premature feature expansion by requiring evidence source, severity, owner, next action, and acceptance signal before any targeted fix enters implementation.

## Current Status

| Area | Status | Reason |
| --- | --- | --- |
| Cohort roster | `waiting_for_cohort_data` | No 30-50 learner roster has been recorded in repo docs |
| Learner feedback | `waiting_for_cohort_data` | No learner feedback log has been recorded |
| Issue log | `waiting_for_cohort_data` | No beta P0/P1/P2 issue evidence has been recorded |
| Analytics readout | `waiting_for_cohort_data` | No cohort activation, retention, progress, motivation, or AI readout has been recorded |
| Targeted fix backlog | `waiting_for_cohort_data` | No evidence-backed P0/P1 issue exists yet |

## Evidence Intake Template

### Cohort Roster

| Learner ID or alias | Segment | Level | Status | Invite date | First activity date | Notes | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TBD | Vietnamese German learner | A1-B1 preferred | `invited` / `active` / `responded` / `dropped` / `blocked` | TBD | TBD | TBD | Operations Manager |

### Learner Feedback

| Feedback ID | Source | Learner status | Surface | Quote or summary | Friction category | Severity | Owner | Next action |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TBD | Interview / support / survey / observed behavior | TBD | Onboarding / dashboard / learning action / AI / reward | TBD | TBD | P0/P1/P2 | TBD | TBD |

### Issue Log

| Issue ID | Source | Category | Severity | Repro or evidence | Owner | Next action | Acceptance signal | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TBD | Cohort / analytics / smoke / support | TBD | P0/P1/P2 | TBD | TBD | TBD | TBD | `waiting_for_cohort_data` |

### Analytics Readout

| Metric | Window | Result | Segment | Interpretation | Owner | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| Activation | 24h after onboarding | TBD | Cohort | TBD | Data / Analytics Engineer | TBD |
| D1 retention | Day 1 after activation | TBD | Cohort | TBD | Data / Analytics Engineer | TBD |
| D7 retention | Day 7 after activation | TBD | Cohort | TBD | Data / Analytics Engineer | TBD |
| Weekly meaningful CEFR progress | Rolling 7 days | TBD | Cohort | TBD | Data / Analytics Engineer | TBD |
| Motivation quality | Cohort window | TBD | Cohort | TBD | Data / Analytics Engineer | TBD |
| AI feedback reliability | Cohort window | TBD | Cohort | TBD | Data / Analytics Engineer | TBD |

## Triage Taxonomy

| Category | Definition | Default owner |
| --- | --- | --- |
| `product_friction` | Learner understands the product poorly, gets stuck, or lacks a clear next action | Product Manager EdTech |
| `technical_defect` | Runtime, API, auth, role, performance, or data issue blocks expected behavior | CTO / Tech Lead |
| `content_academic_risk` | German correctness, CEFR fit, exam wording, or learning-quality issue | German Academic Lead |
| `ai_audio_limitation` | AI tutor, grading, speaking, audio, fallback, provider, or confidence issue | AI / LLM Engineer or Speech / Audio Engineer |
| `analytics_gap` | Missing, duplicated, ambiguous, or misleading event/readout evidence | Data / Analytics Engineer |
| `ops_support_issue` | Invite, support, consent, feedback collection, or cohort operations issue | Operations Manager |

## Severity Rules

| Severity | Definition | Backlog rule |
| --- | --- | --- |
| P0 | Blocks login, onboarding, core learning action, data/privacy safety, role boundary, or creates unsafe claim | Always top priority if evidence is real |
| P1 | Blocks major learner flow, materially hurts activation/retention, or creates misleading AI/exam/audio interpretation | Prioritize by activation/retention impact |
| P2 | Usability friction, confusing copy, non-blocking analytics gap, or support issue | Enters backlog only after P0/P1 has owner or accepted disposition |

## Ranked Backlog Scoring

Use this scoring only after evidence exists.

| Score | Scale | Meaning |
| --- | --- | --- |
| Impact | 1-5 | How much the issue affects activation, retention, learning progress, safety, or trust |
| Frequency | 1-5 | How often the issue appears across cohort learners |
| Severity | 1-5 | P0 = 5, P1 = 3-4, P2 = 1-2 |
| Confidence | 1-5 | Strength of evidence from repro, analytics, learner feedback, or smoke |
| Effort | 1-5 | 1 is easiest, 5 is hardest |

Recommended priority score:

```text
(Impact + Frequency + Severity + Confidence) - Effort
```

## Targeted Fix Backlog

| Rank | Issue ID | Category | Severity | Priority score | Owner | Proposed fix slice | Acceptance signal | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TBD | TBD | TBD | TBD | TBD | TBD | TBD | TBD | `waiting_for_cohort_data` |

## First Implementation Slice Selection Rules

- Select exactly one first implementation slice.
- Do not select a slice until at least one evidence-backed P0 or P1 issue exists.
- If multiple P0 issues exist, choose the one that blocks the most learners or creates the highest safety/privacy risk.
- If no P0 exists, choose the P1 with the highest priority score and clearest acceptance signal.
- Do not choose broad redesign, feature expansion, or speculative AI/content work without cohort evidence.
- Keep existing beta exclusions active until provider eval, Academic Lead signoff, speaking/audio smoke, and legal/privacy review close them.

## Empty Board Decision

Because no cohort data has been recorded yet, Phase 53 completes as a triage template and backlog operating model with status **`waiting_for_cohort_data`**.

The next execution should collect cohort evidence through Phase 52 operations before any runtime implementation slice is selected.

## Acceptance Criteria

Phase 53 is complete when:

- Team acceptance review for Phase 52 is documented.
- Evidence intake templates exist for roster, feedback, issue log, and analytics readout.
- Triage taxonomy and P0/P1/P2 severity rules are explicit.
- Backlog scoring and first implementation slice rules are explicit.
- Empty evidence state is recorded as `waiting_for_cohort_data`, not failure.
- README and risk register link this phase.
- Documentation hygiene passes.
