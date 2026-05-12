# Phase 24: Onboarding UX Spec

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Product Designer
Vai phoi hop: Product Manager EdTech, Frontend Engineer

This Phase 24 UX spec was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Product Designer, Product Manager EdTech, and Frontend Engineer profiles were read.
- The task domain is onboarding UX flow, screen structure, interaction states, mobile behavior, and implementation-ready design acceptance criteria.

## Objective

Close `P19-B2`: specify onboarding UX for the learner activation path defined in Phase 23.

This is a UX/spec phase only. It does not change runtime code.

## UX Goal

Onboarding should help a Vietnamese self-study German learner answer:

```text
What is my current level, what am I aiming for, and what should Fuxie recommend first?
```

The flow must produce enough profile data for dashboard personalization without feeling like a long form.

## Current Starting Point

Current onboarding already has:

- Welcome screen.
- Goal screen with exam choice and target CEFR level.
- Placement test.
- Result screen.
- Save to `/api/v1/auth/onboarding`.
- Redirect to dashboard.

Main UX gaps for activation:

- Daily study time is not captured.
- The learner's goal reason is implicit, not explicit.
- Save failure redirects to dashboard without visible recovery.
- Result screen does not clearly preview the first recommended action.

## Proposed Flow

| Step | Screen | Primary question | Output |
| --- | --- | --- | --- |
| 1 | Welcome | "Ready to set your German path?" | Learner understands this is short and useful |
| 2 | Goal | "Why are you learning German?" | Goal type and optional exam path |
| 3 | Target | "What level are you aiming for?" | Target CEFR level and exam provider/date if relevant |
| 4 | Daily Time | "How much can you study each day?" | Daily time preference |
| 5 | Placement | "Let's estimate your current level." | Estimated CEFR level |
| 6 | Result | "Here is your path and first action." | Current level, target, first action preview |
| 7 | Handoff | "Go to dashboard." | Dashboard receives enough context for next action |

## Screen Specifications

### 1. Welcome

Purpose:

- Build trust.
- Set expectation that onboarding is short.
- Avoid marketing copy.

Required UI:

- Fuxie mascot.
- One headline.
- One short supporting sentence.
- Primary CTA: `Bắt đầu`.

Acceptance criteria:

- Learner understands onboarding sets a learning path.
- CTA is visible without scrolling on mobile.
- No secondary CTA competes with start.

### 2. Goal

Purpose:

- Capture why the learner is studying.
- Keep exam and non-exam learners supported.

Options:

- Exam preparation.
- Work/career.
- Study/visa/family.
- General communication.
- Not sure yet.

If exam preparation is selected:

- Show provider choices: Goethe, Telc, OESD.
- Optional exam date can be deferred if date is unknown.

Acceptance criteria:

- Learner can continue without choosing an exam.
- Exam-focused learner sees exam relevance.
- Copy stays learner-friendly and not bureaucratic.

### 3. Target Level

Purpose:

- Capture target CEFR level.
- Help learner choose without needing expert knowledge.

Required UI:

- CEFR segmented control or cards from A1-C2.
- Each level has one short Vietnamese explanation.
- Suggested default can be based on goal, but must be changeable.

Acceptance criteria:

- Long level descriptions do not overflow on mobile.
- Current selection is visually obvious.
- If target is lower than estimated result later, result screen explains the mismatch.

### 4. Daily Time

Purpose:

- Let dashboard recommend a realistic first action.

Options:

- 5 minutes.
- 10 minutes.
- 20 minutes.
- 30+ minutes.

Behavior:

- Default to 10 minutes if skipped or unavailable.
- Use the value for recommendation copy, not hard blocking.

Acceptance criteria:

- Learner can pick with one tap.
- Daily time is framed as flexible, not pressure.
- If implementation cannot persist this value yet, use it as a local UX requirement and add backend/data follow-up.

### 5. Placement

Purpose:

- Estimate current CEFR level.
- Make the test feel lightweight and motivating.

Required UI:

- Question count and progress.
- Current difficulty badge.
- Immediate feedback after answer.
- Clear disabled state while feedback is showing.

Acceptance criteria:

- Learner always knows how far they are in the test.
- Feedback is readable on mobile.
- Question state cannot cause layout jumps that hide answer options.

### 6. Result

Purpose:

- Confirm current level and target.
- Translate result into first action.

Required UI:

- Estimated current CEFR level.
- Target level and goal summary.
- Daily time summary if captured.
- First recommended action preview.
- Primary CTA: `Đến dashboard`.

Recommended first-action preview order:

1. Due review if due cards exist.
2. Vocabulary starter at estimated/current level.
3. Skill starter if goal implies a skill.
4. AI tutor orientation if no content/action exists.

Acceptance criteria:

- Result does not stop at "your level is X"; it tells learner what happens next.
- If estimated level is higher than target, the screen suggests adjusting target or maintaining level.
- CTA indicates dashboard will continue the path.

### 7. Save / Error Handoff

Purpose:

- Save profile context safely.
- Avoid silent failure.

States:

| State | UX behavior |
| --- | --- |
| Saving | Disable CTA and show `Đang lưu lộ trình...` |
| Success | Redirect to dashboard |
| Save failure | Show inline error and offer retry; allow dashboard fallback only as secondary |
| Network offline | Show connection message and retry |

Acceptance criteria:

- No console-only onboarding save failure.
- Learner does not lose confidence if save fails.
- Dashboard fallback uses safe default level and prompts profile completion later.

## Mobile Behavior

- All steps fit a `390x844` viewport without CTA overlap.
- Primary CTA remains reachable near the bottom of each screen.
- Cards use stable dimensions so selection states do not shift layout.
- Long Vietnamese/German words wrap instead of overflowing.
- Placement answer options remain tappable with at least comfortable touch height.

## Desktop Behavior

- Centered onboarding panel with constrained width.
- Mascot supports context but does not dominate the form.
- Progress indicator remains visible.
- Keyboard navigation works through interactive controls.

## Accessibility

- Each step has a single H1/H2-level task heading.
- Segmented/card selections expose selected state.
- Error messages use `role="alert"` or equivalent.
- Buttons have disabled states that are visually and programmatically clear.
- Images are decorative or meaningfully labeled; do not use emoji-only labels for critical choices.

## Data Needed

| Field | Required for activation | Current status |
| --- | --- | --- |
| `estimatedLevel` | Yes | Existing |
| `targetLevel` | Yes | Existing |
| `targetExam` | Optional | Existing |
| `targetExamDate` | Optional | Existing API field |
| `goalType` | Useful | New product requirement |
| `dailyStudyMinutes` | Useful | New product requirement |

Implementation note:

- If `goalType` and `dailyStudyMinutes` do not exist in schema yet, Phase 24 does not require schema changes. Product and engineering should decide whether to persist them in Phase 26/implementation planning.

## Non-Goals

- No new placement engine logic.
- No new exam calendar workflow.
- No pricing or subscription capture.
- No teacher/admin onboarding.
- No analytics implementation before event map.

## UX Acceptance Criteria

Phase 24 is accepted when:

- Onboarding screens cover goal, target level, exam target, daily time, placement, result, and save/error states.
- Mobile and desktop behavior are specified.
- Error states are learner-facing.
- Data gaps are named without forcing schema changes in this phase.
- The result screen hands off to a dashboard next action.

## Next Planned Step: Phase 25 Dashboard Next-Action UX Spec

Phase 25 should handle `P19-B3`:

1. Route through Product Designer with Product Manager EdTech and Frontend Engineer support.
2. Specify dashboard hierarchy for the primary next action, progress signal, empty states, and mobile behavior.
3. Use Phase 23 activation PRD and this onboarding UX spec as inputs.
