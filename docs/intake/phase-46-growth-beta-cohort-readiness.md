# Phase 46: Growth / Beta Cohort Readiness Plan

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Growth Lead
Vai phoi hop: CEO / General Manager, Customer Success / Community Lead, Data / Analytics Engineer

Growth Lead and CEO / General Manager profiles were read. Customer Success / Community Lead and Data / Analytics Engineer are assigned as support owners for beta operations and measurement.

## Objective

Define the first controlled beta cohort and operating loop using the existing activation, retention, weekly progress, motivation, and AI readouts.

## Target Cohort

| Attribute | Decision |
| --- | --- |
| Segment | Vietnamese learners preparing for German A1-B1 study, work, or migration goals |
| First cohort size | 30-50 learners |
| Duration | 4 weeks |
| Primary promise | Build a weekly German study habit with CEFR-aligned next actions and practice feedback |
| Excluded claim | No official Goethe/Telc/OSD score guarantee |
| Support model | Lightweight community/support intake plus weekly learner feedback form |

## Funnel

| Stage | Metric | Source |
| --- | --- | --- |
| Signup | New learner account | Auth/user records |
| Onboarding | `onboarding_completed` | Analytics event store |
| Activation | first `meaningful_action_completed` within 24h | Activation readout |
| D1/D7/D30 retention | meaningful action after activation | Learning progress readout |
| Weekly progress | 3+ deduped meaningful actions in rolling 7 days | Learning progress readout |
| Motivation health | mission/streak/Fucoin/reward overlap with learning | Motivation loop readout |
| AI quality | generated/failed feedback, score summary, provider failure | AI eval readout |

## Weekly Operating Review

| Review item | Owner | Decision |
| --- | --- | --- |
| Activation rate | Growth Lead | Improve onboarding or dashboard CTA if weak |
| Weekly progress rate | Product Manager EdTech | Adjust next-action hierarchy or lesson availability |
| D1/D7 retention | Growth Lead | Add support/lifecycle experiment if weak |
| Reward-only users | Gamification Designer | Reduce reward noise if not tied to learning |
| AI failure rate | AI / LLM Engineer | Fix provider/fallback behavior |
| Content blockers | German Academic Lead | Hold or revise risky content |
| Support themes | Customer Success / Community Lead | Feed top issues into product backlog |

## Beta Guardrails

- Do not market official exam scoring.
- Do not count reward-only activity as learning progress.
- Do not start paid acquisition until activation and weekly progress have baseline evidence.
- Do not expand to B2B schools until learner beta signal is reviewed.
- Keep support feedback tied to concrete learner blockers.

## Acceptance Criteria

The beta cohort is ready when:

- AI provider eval is either complete or explicitly blocked with accepted fallback wording.
- Speaking/audio smoke is current or excluded from beta claims.
- Content QA has automated pass and human spot-check decisions for first-path content.
- Teacher/admin paths are not required for the B2C beta unless explicitly included.
- Weekly review owner and metric source are defined.

## Next Action

Prepare a 30-50 learner beta recruitment brief and first-week support script after release gates are current.
