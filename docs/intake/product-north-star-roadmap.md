# Fuxie Product North Star And Roadmap

Date: 2026-05-12

## North Star

Fuxie helps Vietnamese learners make measurable progress in German faster and more confidently by combining CEFR learning paths, AI tutoring, exam-aware practice, and motivating daily study loops.

Phase 3 working North Star metric: weekly meaningful CEFR progress by Vietnamese German learners.

A meaningful progress week means the learner completes at least three meaningful study actions tied to level, skill, and goal. Meaningful actions include SRS review, vocabulary practice, reading/listening task, writing/speaking submission, AI tutor feedback loop, or exam practice.

## Target Users

| Segment | Primary need | Product promise |
| --- | --- | --- |
| Self-study learner | Know what to study every day and get feedback | A clear daily path with AI coaching and CEFR progress |
| Exam-focused learner | Prepare for Goethe/Telc/OSD-style tasks | Skill practice, mock tests, rubrics, and targeted feedback |
| Teacher/class operator | Track students and assign/intervene | Classrooms, assignments, analytics, and intervention signals |
| Admin/operator | Manage content, users, rewards, and health | Safe operational dashboards and QA controls |

## Product Pillars

### 1. Learn

Personalized CEFR learning path across vocabulary, grammar, reading, listening, writing, speaking, and review.

Success metrics:

- Daily active learners completing at least one meaningful study session.
- Weekly CEFR progress actions per learner.
- SRS review completion and retention trend.

### 2. Coach

AI tutor and feedback layer for chat, writing, speaking, generation, grading, hints, and weak-skill guidance.

Success metrics:

- AI feedback usefulness rating.
- Writing/speaking retry improvement.
- AI cost per active learner within budget.
- Grading consistency on eval set.

### 3. Motivate

Game-feel through missions, XP, streaks, Fucoin, rewards, Fuxie mascot, and teacher/community encouragement.

Success metrics:

- Day 1, Day 7, Day 30 retention.
- Daily mission completion rate.
- Streak recovery rate without discouraging learners.
- Reward redemption satisfaction.

## 90-Day Roadmap

| Window | Theme | Key outcomes | Owner |
| --- | --- | --- | --- |
| Days 0-30 | Stabilize, reposition, and prepare | Baseline accepted or explicitly risk-accepted, learner activation PRD ready, onboarding/dashboard UX spec ready, AI coach eval plan ready | Project Manager / Delivery Manager |
| Days 31-60 | Improve learning core | Onboarding/dashboard slice, AI feedback eval, speaking fallback, content QA pipeline, teacher/admin support confidence | Product Manager EdTech |
| Days 61-90 | Beta launch motion | Beta cohort, retention instrumentation, conversion funnel, quality dashboard, AI cost tracking, release candidate | CEO / General Manager |

## Phase 4 Milestone Guardrails

| Milestone | Owner | Release dependency |
| --- | --- | --- |
| Baseline acceptance readiness | Project Manager / Delivery Manager | R-003, R-004, R-005 closed, downgraded, or explicitly accepted |
| Learner activation PRD | Product Manager EdTech | Phase 3 positioning approved |
| Onboarding/dashboard UX spec | Product Designer | Learner activation PRD |
| AI coach brief and eval plan | AI / LLM Engineer | AI scope, fallback, and cost constraints defined |
| Motivation loop brief | Gamification Designer | Study-action mapping for missions, rewards, and mascot |
| Beta release candidate | CTO / Tech Lead | Release checklist and QA residual risk statement |

## Phase 5 Backlog Links

| Product area | Backlog items | Expected output |
| --- | --- | --- |
| Learner activation | PR-001, PR-002, PR-003, DA-001, DA-002 | PRD, onboarding/dashboard UX spec, North Star and activation metric definitions |
| AI coach | PR-004, PR-005, QA-004, DA-004 | Product brief, eval plan, QA plan, cost/usefulness reporting spec |
| Motivation loop | PR-006, DA-003 | Missions/rewards/mascot brief and retention event map |
| Teacher/admin support | PR-007, BL-002, QA-002 | Support scope and authenticated smoke readiness |

## P0 Product Decisions

- Default GTM focus: B2C Vietnamese learners first, with teacher/admin preserved as operational support and future B2B channel.
- Default learning promise: daily CEFR progress, not generic chat.
- Default AI promise: helpful tutor and feedback, not fully autonomous teacher replacement.
- Default gamification rule: rewards must support real study behavior.
- Default release guardrail: product strategy may continue while Phase 2 P0 blockers are open, but feature implementation and release candidates must wait until blockers are closed or explicitly accepted by CTO + Operations.

## Phase 3 Product Repositioning Decisions

| Decision | Choice | Product impact |
| --- | --- | --- |
| Primary segment | Vietnamese self-study German learners | Learner onboarding, dashboard, daily path, and feedback are first priority |
| Secondary segment | Exam-focused Goethe/Telc/OSD learners | Exam readiness is visible in roadmap but does not replace daily CEFR progress |
| Teacher/admin | Supporting surface and future B2B channel | Keep workflows useful, but avoid competing with B2C activation focus |
| AI role | Coach and feedback layer | Tutor, writing, speaking, grading, and weak-skill guidance need evals and cost control |
| Motivation role | Missions, XP, streak, Fucoin, rewards, mascot | Game mechanics must reinforce real study actions |

## Phase 3 Acceptance Metrics

| Pillar | Metric | Why it matters |
| --- | --- | --- |
| Learn | First meaningful study action completed | Measures activation |
| Learn | Three meaningful weekly study actions | Measures repeated learning progress |
| Coach | AI feedback usefulness rating | Measures perceived coaching value |
| Coach | Writing/speaking retry improvement | Measures learning impact, not just usage |
| Coach | AI cost per active learner | Keeps product viable |
| Motivate | Daily mission completion | Measures motivation loop |
| Motivate | Day 1, Day 7, Day 30 retention | Measures habit formation |
| Motivate | Reward interactions tied to study completion | Prevents decorative gamification |

## P1 Product Backlog Themes

- Onboarding that identifies level, goal, exam target, and daily time.
- Dashboard that answers "what should I study now?"
- AI writing feedback with clear rubric and retry path.
- Speaking practice with permission-safe fallback and confidence-building feedback.
- Content QA workflow with level, answer, and semantic checks.
- Teacher/admin analytics for real class support.

## Non-Goals During Intake

- No broad redesign before UX audit.
- No new monetization mechanics before core activation is measured.
- No new AI provider migration before current provider behavior is benchmarked.
- No expansion beyond German during this planning cycle.

## Product Acceptance Criteria

- Every roadmap item names target user, owner, metric, and release gate.
- P0/P1/P2 priorities are separated.
- Learning quality is reviewed by German Academic Lead for core study surfaces.
- AI claims are backed by evals or labeled as assumptions.

## Phase 23 Update

Learner Activation PRD is complete in `phase-23-learner-activation-prd.md`.

Activation definition:

```text
Activated learner = completes onboarding and completes one meaningful study action within 24 hours.
```

The next product dependencies are onboarding UX spec, dashboard next-action UX spec, activation event map, and learner activation test plan.

## Phase 24 Update

Onboarding UX spec is complete in `phase-24-onboarding-ux-spec.md`.

Design decisions:

- Onboarding should capture goal, target CEFR level, optional exam path, daily study time, placement result, and dashboard handoff.
- Save errors must be learner-facing with retry, not console-only.
- Daily time and goal type are product/data gaps to resolve during implementation planning.

## Phase 25 Update

Dashboard next-action UX spec is complete in `phase-25-dashboard-next-action-ux-spec.md`.

Design decisions:

- Dashboard first viewport must answer "What should I study now?"
- One primary next-action CTA should dominate secondary modules.
- Fresh start, due review, no due review, exam focus, completed today, and data-error states are defined.

## Phase 26 Update

Activation event map is complete in `phase-26-activation-event-map.md`.

Measurement decisions:

- Activation rate is measured by onboarding completion plus one meaningful study action within 24 hours.
- Events cover onboarding, dashboard next action, meaningful action start/completion, and derived activation completion.
- Privacy boundaries exclude raw learner submissions, transcripts, audio, and AI chat content.

## Phase 27 Update

Learner activation test plan is complete in `phase-27-learner-activation-test-plan.md`.

QA decisions:

- Activation implementation must cover onboarding, dashboard next action, first meaningful action, visible completion feedback, and analytics privacy.
- One full activation smoke should be added once seed data and stable selectors are available.

## Phase 28 Update

AI coach product brief is complete in `phase-28-ai-coach-product-brief.md`.

Product decisions:

- AI coach surfaces are separated into tutor chat, writing feedback, speaking feedback, grading, hints, and weak-skill guidance.
- The coach is a feedback and retry layer, not an official exam scorer, autonomous curriculum generator, or teacher replacement.
- Fallback rules cover provider failure, missing profile, low-confidence grading, audio permission denial, off-scope requests, and cost/rate limits.
- Phase 29 must convert the scope into eval cases for quality, CEFR fit, Vietnamese learner mistakes, cost, latency, and provider failure.

## Phase 29 Update

AI eval plan is complete in `phase-29-ai-eval-plan.md`.

AI quality decisions:

- Eval coverage now spans tutor chat, writing feedback, speaking support, grading, hints, weak-skill guidance, fallback, and safety.
- A1/A2/B1/B2 cases include German correctness, CEFR fit, Vietnamese learner usefulness, retry behavior, cost, latency, and provider failure.
- Strong AI grading claims remain blocked until provider-backed evals and German Academic Lead sampled review are complete.

## Phase 30 Update

Weekly meaningful CEFR progress metric spec is complete in `phase-30-weekly-cefr-progress-metric.md`.

Measurement decisions:

- Primary North Star metric is the rate of eligible B2C learners completing at least 3 meaningful CEFR progress actions in a rolling 7-day window.
- AI feedback loops can count only when tied to German learning and are capped at 1 of the 3 required actions.
- Companion non-AI progress rate prevents coach usage from masking weak core learning behavior.
- Initial beta target is 25% of active onboarded learners reaching weekly progress, to be recalibrated after two beta cohorts.

## Phase 31 Update

Motivation loop brief is complete in `phase-31-motivation-loop-brief.md`.

Motivation decisions:

- Missions, XP, streak, Fucoin, rewards, and mascot moments must reinforce completed meaningful study actions.
- Streaks advance only from real study completion and use freeze/soft restart patterns to avoid shame.
- Reward-only engagement is explicitly tracked as a risk signal, not treated as learning progress.
- Mascot moments support next action, feedback, recovery, and milestone celebration without competing with the study flow.
