# Gameplay Experience And Bug Triage Pod

## Purpose

Create a dedicated pod that evaluates Fuxie's lesson gameplay as real learners experience it while also finding, classifying, and routing bugs before pilot expansion.

This pod works in parallel with product/gameplay development. Its job is not only to say "the page works"; it must answer:

- Is this lesson fun enough to make a learner want one more round?
- Does the mechanic reinforce meaningful German study?
- Where does the learner hesitate, feel confused, or feel under-rewarded?
- Which defects block learning, trust, reward integrity, or pilot measurement?

## Mission

By every sprint gate, the pod produces a combined gameplay and QA readout:

- Gameplay score by skill and surface.
- Bug list with severity, owner, reproduction, and release decision.
- Learner-friction notes with screenshots or steps.
- Evidence from admin readout and browser smoke.
- Clear ship / hold / fix-next recommendation.

## Team Shape

### Core Team

| Role | Headcount | Owner Area | Why This Role Exists |
| --- | ---: | --- | --- |
| Gameplay QA Lead | 1 | Pod coordination, final gameplay + bug signoff | Keeps gameplay judgment and QA evidence in one operating rhythm. |
| Gamification Playtester | 1 | Game feel, quest pacing, reward clarity | Judges whether mechanics create motivation without reward farming. |
| Learner Experience Researcher | 1 | Vietnamese learner empathy, friction notes, session observation | Tests if the flow feels clear and encouraging to the target learner. |
| QA Automation Engineer | 1 | Regression tests, route tests, smoke scripts | Turns repeated checks into gates instead of manual memory. |
| Exploratory QA Tester | 1-2 | Edge cases, mobile/browser/device behavior | Finds weird learner paths before real users do. |
| Data / Analytics Reviewer | 0.5 | Event evidence, readout quality, metric sanity | Confirms gameplay claims are measurable and privacy-safe. |
| Product Designer Reviewer | 0.5 | Visual hierarchy, mobile ergonomics, interaction polish | Catches UI issues that tests cannot feel. |

Recommended starting size: 5 full-time equivalents plus fractional Data and Design support.

### Hiring Priority

1. Gameplay QA Lead.
2. Exploratory QA Tester with mobile web experience.
3. Gamification Playtester with language-learning or EdTech game experience.
4. Learner Experience Researcher fluent in Vietnamese learner context.
5. QA Automation Engineer if the current QA owner is already overloaded.

## Candidate Scorecard

Each candidate is scored 1-5 on these criteria.

| Criterion | Weight | Strong Signal |
| --- | ---: | --- |
| Learner empathy | 20% | Can explain where a beginner Vietnamese learner gets confused or encouraged. |
| Gameplay judgment | 20% | Can separate "pretty UI" from motivating game loop. |
| Bug discipline | 20% | Writes minimal repro steps, expected/actual result, severity, and evidence. |
| EdTech / language fit | 15% | Understands vocabulary, listening, speaking, writing, SRS, and CEFR basics. |
| Mobile web testing | 10% | Comfortable testing narrow screens, touch flows, loading states, and auth redirects. |
| Analytics literacy | 10% | Knows events can lie if metadata, denominator, or cohort is wrong. |
| Communication | 5% | Gives concise, actionable feedback without drama. |

Minimum hire bar:

- Average score >= 4.0.
- No score below 3 on learner empathy, bug discipline, or gameplay judgment.
- Must complete a 45-minute Fuxie playtest and submit 3 gameplay findings plus 3 bug findings.

## Gameplay Evaluation Criteria

Each lesson/gameplay surface receives a 1-5 score in these areas.

| Area | Question | Pass Bar |
| --- | --- | --- |
| Clarity | Does the learner know what to do next within 5 seconds? | >= 4 |
| Game loop | Is there a clear start, challenge, feedback, result, and next action? | >= 4 |
| Learning value | Does the mechanic require real German practice, not just clicking? | 5 required |
| Feedback feel | Does feedback feel immediate, fair, and useful? | >= 4 |
| Reward clarity | Does the learner understand XP/Fucoin/streak/badge without confusion? | >= 4 |
| Replay pull | Would the learner naturally want one more round or next node? | >= 3 |
| Mobile comfort | Can it be played comfortably on a small phone viewport? | >= 4 |
| Emotional tone | Encouraging, never shaming, especially on failure. | 5 required |

Gameplay decision:

- Green: all pass bars met, no P0/P1 bugs.
- Yellow: small polish issues, no learning/reward integrity risk.
- Red: unclear objective, weak learning value, broken receipt, broken reward evidence, or high-friction mobile flow.

## Bug Taxonomy

| Severity | Definition | Examples | Release Rule |
| --- | --- | --- | --- |
| P0 | Blocks core learning, auth, wallet, reward integrity, or data safety. | Cannot submit, wallet negative, real gift unlocked, raw text/audio leaked to analytics. | Must fix before release. |
| P1 | Major learner trust or gameplay blocker. | Result receipt wrong, badge duplicated, episode cannot finish, admin readout crashes. | Must fix or explicitly disable affected surface. |
| P2 | Noticeable friction or confusing UX with workaround. | CTA unclear, mobile spacing awkward, missing empty state, slow route. | Can ship with owner and follow-up date. |
| P3 | Minor copy, polish, or non-blocking visual issue. | Small alignment issue, secondary copy improvement. | Backlog unless repeated by learners. |

Every bug ticket must include:

- Surface and URL.
- User role: learner, admin, teacher, guest.
- Device/viewport.
- Steps to reproduce.
- Expected result.
- Actual result.
- Severity and rationale.
- Screenshot or DOM/log evidence when useful.
- Suspected owner: Frontend, Full-stack, Backend, Data, Content, Design, Ops.

## Task Rules

Rules for every gameplay QA task:

1. Test as a learner first, then as QA.
2. Do not reward click-only behavior as success.
3. Always check the next action after result or completion.
4. Always verify mobile for new learner-facing gameplay.
5. Always verify admin evidence when events/readout are part of the feature.
6. Separate "bug" from "gameplay weakness"; both matter, but they route differently.
7. Do not mark a surface green if reward, badge, streak, or analytics receipt is misleading.
8. Do not collect or paste raw learner text, audio, transcript, prompt, or PII into analytics or bug reports.
9. If a task touches shop/economy, recheck guardrails: no real gift, no cap change, no price change, no negative wallet.
10. If a task touches AI/speech/writing, include failure-state testing.

## Required Test Matrix

Each sprint must cover at minimum:

| Surface | Gameplay Check | Bug Check |
| --- | --- | --- |
| Vocabulary microgames | speed, feedback, replay, completion receipt | route load, submit stability, mobile layout |
| Quest episodes | briefing, checkpoints, result receipt, next CTA | invalid metadata, unchanged reward source of truth |
| Speaking roleplay/nachsprechen | safe feedback, retry feel, completion boundary | mic/eval failure, no unsafe metadata |
| Writing episode | draft flow, AI feedback tone, revise CTA | AI failure, no badge/reward on failed grading |
| Badge album | progress clarity, earned/locked distinction | duplicate prevention, empty state |
| Campaign map | node clarity, path motivation, next node | link integrity, progress evidence |
| Admin gamification | actionable readout, warning clarity | auth, aggregation, empty data state |
| Shop/economy guardrail | shop stays secondary to learning | no real gift, no negative wallet, idempotent spend |

## Operating Cadence

Weekly rhythm:

- Monday: PM selects surfaces and risk areas for the week.
- Tuesday-Wednesday: pod runs gameplay pass and bug pass in parallel.
- Thursday: triage with Product, Engineering, Gamification, QA.
- Friday: ship/hold recommendation and evidence pack.

Daily rules:

- P0/P1 bugs are escalated same day.
- Gameplay red findings are reviewed within 24 hours.
- No sprint closes without a QA residual risk note.

## Acceptance Checklist

A gameplay feature can be accepted only when:

- Learner can explain objective, progress, result, and next action.
- Completion is tied to meaningful learning.
- Reward/badge/mastery receipts are truthful.
- Mobile layout is usable.
- Admin/readout evidence exists where promised.
- P0/P1 bugs are closed or feature is disabled.
- P2 bugs have owners and follow-up dates.
- Guardrails remain intact.

## First 2-Week Setup Plan

### Week 1: Pod Setup

- Assign interim Gameplay QA Lead.
- Create bug template and gameplay scorecard in the project board.
- Select first smoke surfaces: microgames, roleplay, badges, campaign, admin gamification.
- Recruit or nominate 2 exploratory testers.
- Run baseline gameplay score pass.

### Week 2: First Parallel Pass

- Run desktop and mobile gameplay QA.
- Log P0-P3 bugs with reproducible evidence.
- Compare findings with admin gamification readout.
- Produce first "Gameplay + Bug Readout" and release recommendation.
- Decide whether the next sprint focuses on polish, bug closure, or deeper scenario expansion.

## Initial Staffing Recommendation

Start lean:

- 1 Gameplay QA Lead.
- 1 QA Automation Engineer.
- 1 Exploratory QA Tester.
- 1 Gamification Playtester.
- 0.5 Product Designer.
- 0.5 Data / Analytics Engineer.

Add a Learner Experience Researcher after the first pilot cohort has at least 5-10 active learners, unless usability issues appear earlier.

