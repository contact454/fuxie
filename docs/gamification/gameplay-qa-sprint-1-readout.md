# Gameplay QA Sprint 1 Readout

Date: 2026-05-14

## Scope

Sprint 1 executed the first Gameplay Experience And Bug Triage Pod pass for:

- Vocabulary Microgame Pack.
- German Situation Roleplay.
- Badge Album.
- Quest Campaign Map.
- Admin Gamification readout.

Environment:

- Web: `http://localhost:3012`.
- Auth: dev-auth learner/admin.
- DB/cache: Docker Postgres `5434` and Redis `6380`, both healthy.
- Browser viewports: desktop default, mobile `390x844`.

## Executive Decision

Overall decision: yellow.

The current gameplay surfaces are safe to continue internal pilot validation. They should not yet be treated as fully polished learner gameplay because the first pass found several P2 issues around accessible CTA clarity, roleplay completion clarity, and campaign progress explanation.

No P0/P1 release blockers were found in this sprint pass.

## Smoke Evidence

| Surface | Desktop | Mobile | Runtime Error | Notes |
| --- | --- | --- | --- | --- |
| Vocabulary Microgame Pack | Pass | Pass | No | Speed Match, Cloze Streak, Boss Review render with practice CTAs. |
| German Situation Roleplay | Pass | Pass | No | Start button opens roleplay session; safe metadata copy is visible. |
| Badge Album | Pass | Pass | No | Earned/Locked states render; badge catalog visible. |
| Quest Campaign Map | Pass | Pass | No | A1 Starter Path and nodes render with next-node links. |
| Admin Gamification | Pass | Pass | No | Lesson Gameplay Expansion metrics render. |

## Gameplay Scorecards

Scores use 1-5. Required bars follow the pod charter: learning value and emotional tone must be 5 for green; core usability areas should be at least 4.

### Vocabulary Microgame Pack

| Area | Score | Notes |
| --- | ---: | --- |
| Clarity | 4 | Objective and three game choices are visible. Repeated CTA labels reduce scan clarity. |
| Game loop | 3 | It frames microgames well, but the page is mostly a hub into existing practice routes. |
| Learning value | 5 | Routes lead to meaningful vocabulary practice; no click-only reward. |
| Feedback feel | 3 | Feedback happens after entering practice, not on the hub. |
| Reward clarity | 4 | Copy explains reward only on completion. |
| Replay pull | 4 | Three short formats create "one more round" potential. |
| Mobile comfort | 4 | Mobile render passes; theme and game choices are reachable. |
| Emotional tone | 5 | Encouraging and not shaming. |

Decision: yellow.

Required follow-up: make repeated `Choi van nay` CTAs more specific for accessibility and learner scanning.

### German Situation Roleplay

| Area | Score | Notes |
| --- | ---: | --- |
| Clarity | 4 | Scenario objective and start button are visible. |
| Game loop | 3 | Start state works, but completion boundary and end-state receipt are not obvious from the first pass. |
| Learning value | 4 | It encourages speaking practice, but v1 still needs stronger completion evidence than the shell. |
| Feedback feel | 3 | Feedback quality cannot be fully judged without a completed speaking turn. |
| Reward clarity | 4 | Shows completion receipt only, no click reward, and safe metadata copy. |
| Replay pull | 3 | Other scenario links exist, but the loop feels less game-like than vocabulary. |
| Mobile comfort | 4 | Mobile render passes. |
| Emotional tone | 5 | Safe, non-shaming roleplay framing. |

Decision: yellow.

Required follow-up: clarify roleplay completion state and add accessible labels to unnamed controls inside the active roleplay session.

### Badge Album

| Area | Score | Notes |
| --- | ---: | --- |
| Clarity | 4 | Earned, ready, and locked states are visible. |
| Game loop | 3 | Works as long-term collection support, not a standalone game loop. |
| Learning value | 5 | Badge copy ties unlocks to meaningful completion. |
| Feedback feel | 3 | Stronger when paired with result receipts; album itself is mostly static. |
| Reward clarity | 4 | Earned/locked distinction is clear. |
| Replay pull | 3 | "Find next badge" exists, but collection pull is still early. |
| Mobile comfort | 4 | Mobile render passes. |
| Emotional tone | 5 | Encouraging, no shame loop. |

Decision: yellow.

Required follow-up: add clearer "next badge action" hierarchy in dashboard or album so collection drives learning, not passive browsing.

### Quest Campaign Map

| Area | Score | Notes |
| --- | ---: | --- |
| Clarity | 4 | A1 Starter Path and nodes are clear. |
| Game loop | 4 | Node path gives progression and next action. |
| Learning value | 5 | Nodes point to real practice, writing, and roleplay activities. |
| Feedback feel | 3 | Progress evidence is visible but may feel abstract with low data. |
| Reward clarity | 4 | The map does not over-promote shop/reward. |
| Replay pull | 4 | The path structure encourages continuing to the next node. |
| Mobile comfort | 4 | Mobile render passes. |
| Emotional tone | 5 | Encouraging journey framing. |

Decision: green with P2 polish.

Required follow-up: explain why "1/5 path progress" can appear while a node says `0 learning signals` to avoid learner confusion.

### Admin Gamification

| Area | Score | Notes |
| --- | ---: | --- |
| Clarity | 4 | Lesson Gameplay Expansion section is visible in the admin readout. |
| Game loop | 4 | Admin can inspect gameplay evidence across starts/completions. |
| Learning value | 5 | Readout remains tied to meaningful learning evidence. |
| Feedback feel | 4 | Metrics are actionable enough for internal pilot. |
| Reward clarity | 4 | Economy guardrails remain represented. |
| Replay pull | 3 | Not learner-facing. |
| Mobile comfort | 3 | Mobile render does not crash, but admin mobile density is secondary. |
| Emotional tone | 5 | Neutral operational copy. |

Decision: green for internal admin use.

Required follow-up: keep admin mobile as smoke-only unless admins will operate primarily on phone.

## Bug And Friction Log

| ID | Severity | Surface | Finding | Owner | Release Decision |
| --- | --- | --- | --- | --- | --- |
| GPQA-001 | P2 | Vocabulary Microgame Pack | Three game links share the same visible label `Choi van nay`, making scanning and accessible names ambiguous. | Product Design + Frontend | Ship with follow-up. |
| GPQA-002 | P2 | German Situation Roleplay | Active roleplay session exposes an unnamed button after start, likely a control without accessible label. | Frontend | Ship with follow-up; fix before wider pilot. |
| GPQA-003 | P2 | German Situation Roleplay | Completion boundary and receipt are not obvious from first-pass start flow. | Gamification + Full-stack | Ship with follow-up; validate completed turn flow next. |
| GPQA-004 | P2 | Quest Campaign Map | Path progress can show `1/5` while a node reports `0 learning signal(s)`, which may confuse learners. | Gamification + Data | Ship with follow-up. |
| GPQA-005 | P3 | Badge Album | Album is clear but still passive; stronger next-action hierarchy would increase collection pull. | Product Design | Backlog polish. |

## Guardrail Check

| Guardrail | Status | Evidence |
| --- | --- | --- |
| No leaderboard/social expansion | Pass | No new competitive surface tested in this sprint. |
| No real gift/voucher/shipping/cash-like reward | Pass | Gameplay surfaces do not expose real gift redemption. |
| No Fucoin cap/price/catalog/spend behavior change | Pass | Sprint is QA/playtest and docs; no economy code edited. |
| No XP/Fucoin for click/checkpoint/opening surface | Pass | Microgame and roleplay copy state no click reward / completion receipt only. |
| Analytics safe metadata | Pass for visible copy | Roleplay page states no raw speech/audio/transcript in analytics. |

## Sprint Task Status

| Task | Status | Evidence |
| --- | --- | --- |
| GPQA-001 scorecard template | Done | `docs/gamification/templates/gameplay-scorecard-template.md` |
| GPQA-002 bug template | Done | `docs/gamification/templates/bug-report-template.md` |
| GPQA-003 Vocabulary baseline | Done | Desktop/mobile pass; scorecard yellow. |
| GPQA-004 Roleplay baseline | Done | Desktop/mobile pass; scorecard yellow. |
| GPQA-005 Badge Album baseline | Done | Desktop/mobile pass; scorecard yellow. |
| GPQA-006 Campaign Map baseline | Done | Desktop/mobile pass; scorecard green with P2 polish. |
| GPQA-007 Admin evidence check | Done | Admin readout renders Lesson Gameplay Expansion. |
| GPQA-008 Mobile smoke | Done | `390x844` pass for all scoped surfaces. |
| GPQA-009 Guardrail verification | Done | No guardrail breach observed. |
| GPQA-010 Weekly readout | Done | This document. |

## Next Fix Backlog

1. Make microgame CTA labels specific: `Play Speed Match`, `Play Cloze Streak`, `Play Boss Review`.
2. Add accessible labels to active roleplay controls.
3. Add a clear roleplay completion/receipt state after an end action or successful speaking turn.
4. Clarify campaign progress copy when path-level progress and node-level evidence differ.
5. Add dashboard entry points for Badge Album and Campaign Map after gameplay surfaces are polished.

## Final Sprint 1 Recommendation

Recommendation: continue pilot validation with restrictions.

Restrictions:

- Do not present Vocabulary Microgames and Roleplay as fully polished gameplay yet.
- Keep them in internal/controlled pilot until P2 accessibility and completion-clarity issues are fixed.
- Continue using admin readout as the evidence source.
- Keep economy/reward expansion frozen.

## Sprint 1.5 Follow-Up

Sprint 1.5 closed the P2/P3 findings from this readout. See `docs/gamification/gameplay-polish-sprint-1-5-readout.md`.
