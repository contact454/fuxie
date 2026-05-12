# Phase 27: Learner Activation Test Plan

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: QA Automation Engineer
Vai phoi hop: Product Manager EdTech, Frontend Engineer

This Phase 27 test plan was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The QA Automation Engineer, Product Manager EdTech, and Frontend Engineer profiles were read.
- The task domain is activation QA, regression scope, smoke strategy, and release acceptance.

## Objective

Close `P19-B4`: define the learner activation test plan for the onboarding-to-dashboard-to-first-action journey.

This is a QA/spec phase only. It does not add or change tests yet.

## Inputs

- Phase 23 Learner Activation PRD.
- Phase 24 Onboarding UX Spec.
- Phase 25 Dashboard Next-Action UX Spec.
- Phase 26 Activation Event Map.

## Test Goal

Protect the first learner activation loop:

```text
Learner completes onboarding, sees one dashboard next action, starts it, completes it, and receives visible progress/reward/feedback.
```

## Test Levels

| Level | Scope | Purpose |
| --- | --- | --- |
| Unit/component | Onboarding step state, dashboard recommendation rendering | Catch UI logic regressions cheaply |
| Route/API | `/api/v1/auth/onboarding`, first-action APIs | Verify save/response/failure behavior |
| Integration | Onboarding save to dashboard next action | Verify profile data influences dashboard |
| E2E/smoke | Register/login, onboarding, dashboard, first meaningful action | Release confidence for activation path |
| Analytics validation | Event emit points and required properties | Verify measurement readiness without collecting sensitive content |

## Priority Test Cases

### P0: Activation Happy Path

| ID | Scenario | Acceptance |
| --- | --- | --- |
| QA-ACT-001 | New learner starts onboarding | Welcome, goal, placement, result, and dashboard handoff are reachable |
| QA-ACT-002 | Learner completes onboarding save | Profile stores estimated level, target level, exam preference where selected |
| QA-ACT-003 | Dashboard shows one primary next action | One dominant CTA is visible before secondary modules |
| QA-ACT-004 | Learner clicks primary next action | Learner reaches the intended study surface |
| QA-ACT-005 | Learner completes first meaningful action | Progress/reward/feedback is visible after completion |

### P0: Auth And Role Boundary

| ID | Scenario | Acceptance |
| --- | --- | --- |
| QA-ACT-006 | Learner role accesses onboarding/dashboard | Allowed |
| QA-ACT-007 | Teacher/admin role is excluded from learner activation metric | Events or dashboard filters do not count teacher/admin as B2C activation |
| QA-ACT-008 | Unauthenticated user hits onboarding/dashboard | Redirects to auth flow or safe login path |

### P1: Onboarding Edge Cases

| ID | Scenario | Acceptance |
| --- | --- | --- |
| QA-ACT-009 | Learner chooses no exam | Flow continues and dashboard still recommends CEFR action |
| QA-ACT-010 | Learner chooses exam path | Result/dashboard can label exam relevance without replacing daily action |
| QA-ACT-011 | Target level lower than placement estimate | Result explains mismatch or allows target adjustment |
| QA-ACT-012 | Onboarding save fails | Inline error and retry are visible; no silent dashboard redirect as primary behavior |
| QA-ACT-013 | Network offline during save | Learner sees connection/retry message |

### P1: Dashboard Next-Action States

| ID | Scenario | Acceptance |
| --- | --- | --- |
| QA-ACT-014 | Fresh start learner | Dashboard frames 0 progress as beginning and shows starter action |
| QA-ACT-015 | Due SRS cards exist | Review is primary next action |
| QA-ACT-016 | No due review exists | Current-level vocabulary or skill starter is primary |
| QA-ACT-017 | Primary action already completed today | Completion state and optional next action are shown |
| QA-ACT-018 | Dashboard data partially unavailable | Safe default or recovery CTA appears; no blank panel |

### P1: Mobile And Responsive

| ID | Scenario | Acceptance |
| --- | --- | --- |
| QA-ACT-019 | Onboarding at `390x844` | CTA and answer options do not overlap or overflow |
| QA-ACT-020 | Dashboard at `390x844` | Primary next-action CTA appears before dense secondary modules |
| QA-ACT-021 | Long Vietnamese/German labels | Text wraps cleanly and controls remain usable |

### P1: Analytics Readiness

| ID | Scenario | Acceptance |
| --- | --- | --- |
| QA-ACT-022 | Onboarding starts/completes | Events contain required metadata and no raw answer text |
| QA-ACT-023 | Dashboard primary CTA renders/clicks | `dashboard_next_action_viewed` and clicked equivalent can be asserted |
| QA-ACT-024 | Meaningful action completes | Completion event has action type, level, skill, timing, and no raw submissions |
| QA-ACT-025 | Activation is derived once per learner | Duplicate completion does not duplicate activation |

## Automation Strategy

Recommended order:

1. Add route/API tests for onboarding save success and validation failure.
2. Add component or integration tests for dashboard next-action state selection where logic is isolated.
3. Add one E2E smoke for the activation happy path once seed data and stable selectors are available.
4. Add analytics contract tests after event transport is chosen.

Selector guidance:

- Prefer accessible names and roles for onboarding controls and primary CTA.
- Add stable `data-testid` only when accessible selectors are not stable enough.
- Avoid brittle CSS selectors.

## Test Data Requirements

| Data set | Needed for |
| --- | --- |
| New learner without onboarding | Fresh onboarding path |
| Learner with no due SRS | Vocabulary/starter next action |
| Learner with due SRS | Review priority |
| Exam-focused learner | Exam relevance labels |
| Completed-today learner | Completed state |
| Partial dashboard data | Fallback/recovery state |

## Release Gate Recommendation

Before releasing the activation implementation slice:

- `pnpm check:quick` passes.
- Existing `pnpm test:core` passes.
- Focused onboarding/dashboard tests pass.
- One learner activation smoke passes when local services are available.
- Analytics privacy checks pass if instrumentation is included.

## Residual Risks

| Risk | Mitigation |
| --- | --- |
| Analytics transport not chosen yet | Keep analytics tests as contract/spec until implementation exists |
| Dashboard recommendation logic may remain coupled to existing plan builder | Test observable behavior first; isolate pure decision logic when feasible |
| End-to-end activation may require seed data | Define seed fixtures before automating full E2E |
| Save failure currently may redirect silently | Treat learner-facing retry as implementation acceptance requirement |

## Acceptance Criteria

Phase 27 is accepted when:

- Happy path, auth, onboarding edge cases, dashboard states, mobile, and analytics readiness are covered.
- Test levels and automation order are explicit.
- Test data requirements are named.
- Release gate recommendation is clear.
- Residual risks are stated.

## Next Planned Step: Phase 28 AI Coach Product Brief

Phase 28 should handle `P19-C1`:

1. Route through Product Manager EdTech with AI / LLM Engineer and German Academic Lead support.
2. Define AI coach scope, fallback behavior, non-goals, and acceptance criteria.
3. Use activation PRD so AI coach supports, but does not replace, meaningful study actions.
