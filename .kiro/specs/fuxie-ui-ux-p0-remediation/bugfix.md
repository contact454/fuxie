# Requirements Document - Fuxie Learner P0 Remediation

Vai chinh: Project Manager / Delivery Manager
Vai phoi hop: CTO / Tech Lead, QA Automation Engineer, Product Designer / UX/UI Designer

## Introduction

This spec turns the Claude UI/UX audit and the Codex takeover notes into an executable Sprint 1 remediation pack for the Fuxie learner app. The working rule is:

1. Codex owns requirements, design contracts, mockups/assets, QA plan, and handoff prompts.
2. Antigravity owns application code implementation.
3. Codex reviews Antigravity's diff and writes follow-up prompts instead of directly patching product code.

The four P0 areas remain release-blocking because they affect mobile learning completion, accessibility, reward-token integrity, or learner trust in AI grading:

| Ticket | Area | Severity | Primary owner |
| --- | --- | --- | --- |
| TICKET-01 | WCAG AA contrast on learner surfaces | P0 | Antigravity implementation, Codex QC |
| TICKET-02 | Reward amber containment and keyboard focus | P0 | Antigravity implementation, Codex QC |
| TICKET-03 | German long-word overflow and grammar-table clipping | P0/P1 | Antigravity implementation, Codex design/QC |
| TICKET-04 | Exit safeguards and AI fail-open behavior | P0 | Antigravity implementation, Codex QC |

Current takeover status on 2026-06-04:

- Design decisions for nav contrast, XP chip color, focus token, German overflow, and flow safeguards are locked.
- A partial implementation already exists in the current worktree from the earlier Codex pass.
- Remaining delivery work must be treated as QC hardening plus any gaps Antigravity finds while reviewing the current diff.
- `apps/web/public/sw.js` was dirty before this remediation work and is out of scope unless Antigravity proves it is related.

## Scope

In scope:

- Learner app UI under `apps/web/src/components/**` and relevant locale files under `apps/web/messages/*.json`.
- Confirm-exit component behavior for active session, grammar lesson, and writing draft.
- Fail-open handling for grammar AI grading and video-call pronunciation feedback parsing.
- Visual and interaction contracts for mobile viewports 360x640, 375x667, and 414x896.
- Focus visibility and contrast verification.
- Focused automated or manual smoke tests for the four P0 tickets.

Out of scope:

- Replacing mascot or reward art assets. Forward to `gamified-ui-asset-rollout`.
- Broad copy/localization rewrite beyond required i18n keys. Forward to `learner-copy-localization-backfill`.
- Full screenshot-diff infrastructure. Forward to `visual-qa-screenshot-capture`.
- Backend grading algorithm changes. This spec only changes UI behavior on unavailable grading.
- Desktop redesign. Desktop must be preserved.

## Glossary

- **Reward amber**: `#FFB703` or a computed color within the existing reward-amber detector threshold.
- **Reward subtree**: a DOM subtree whose ancestor has `data-reward-state="preview"`, `data-reward-state="earned"`, `data-reward-state="receipt"`, or `data-reward-context="true"`.
- **AA contrast**: WCAG text contrast of at least 4.5:1 for normal text or 3:1 for large text.
- **Fail-open grading**: network, parse, or service errors do not mark the learner wrong; the learner can retry.
- **Active learning state**: a session, lesson, or writing flow where the learner has started work and navigation away can lose progress.
- **German content slot**: learner-facing German word, phrase, sentence, example, table cell, dialogue, tile option, or theme title.
- **Antigravity prompt**: a ready-to-run engineering brief Codex writes for Antigravity, containing scope, forbidden changes, acceptance criteria, and verification steps.

## Requirement 1: Contrast must pass WCAG AA on primary learner surfaces

**User Story:** As a mobile learner, I want all labels, badges, and navigation states to be readable, so that I can study without visual strain or missing important status information.

### Acceptance Criteria

1. WHEN the dashboard CEFR badge renders, THE badge SHALL use `getCefrTheme(level).bg` as background and `getCefrTheme(level).text` as foreground.
2. THE dashboard CEFR badge SHALL NOT use white text on `getCefrTheme(level).css`.
3. WHEN sidebar active nav and mobile bottom-nav active state render, THE two surfaces SHALL use the same locked pair: `#2EC4B6` background and `var(--fuxie-blue-900)` foreground.
4. THE active nav foreground/background pair SHALL measure at least 4.5:1 contrast for text.
5. Text nodes that carry real content SHALL NOT use `text-gray-400`, `text-slate-400`, or equivalent low-contrast gray if computed contrast is below 4.5:1 on the current background.
6. Decorative non-text icons MAY keep low-contrast gray when they do not communicate required learner information.
7. A contrast check over learner routes at 360, 375, and 414 px widths SHALL produce zero release-blocking contrast findings for the touched surfaces.

## Requirement 2: Reward amber must stay inside reward moments

**User Story:** As a learner, I want amber to consistently mean reward or achievement, so that the app's gamification signals stay trustworthy and not visually noisy.

### Acceptance Criteria

1. EVERY node whose computed color is reward amber SHALL have a Reward subtree ancestor.
2. Mission cards with claimable or just-claimed rewards SHALL expose `data-reward-state` matching the reward moment.
3. Always-mounted XP header chips SHALL use brand blue plus white text, not reward amber.
4. Non-reward metadata icons or labels SHALL use brand blue or neutral tokens, not reward amber.
5. The existing reward-amber containment property test or equivalent static detector SHALL report zero non-exempt amber violations for the touched surfaces.
6. This requirement SHALL NOT change mascot art, reward art, or reward economy behavior.

## Requirement 3: Keyboard focus must be visible on primary navigation

**User Story:** As a keyboard or assistive-technology user, I want to see where focus is, so that I can navigate the learner app without guessing.

### Acceptance Criteria

1. Every primary navigation `MeasuredLink` SHALL show a visible focus ring on `:focus-visible`.
2. The default focus ring SHALL be `2px` outline with `2px` offset using `var(--fuxie-blue-700)`.
3. On dark sidebar chrome, the implementation MAY use `var(--fuxie-blue-200)` if visual QA shows the default ring is too quiet.
4. Focus indicators SHALL not be removed by `outline-none` unless replaced by an equally visible `focus-visible` style.
5. Keyboard tab smoke on sidebar and bottom-nav SHALL show a visible focus state at every nav link.

## Requirement 4: German long words must not clip or break learner tasks

**User Story:** As a learner studying German, I want long compound words and grammar tables to remain readable on my phone, so that I do not lose key learning content.

### Acceptance Criteria

1. Grammar paradigm tables SHALL scroll horizontally on small screens instead of clipping columns.
2. Grammar table columns SHALL remain reachable at 360 px width.
3. German text slots SHALL allow wrapping with `overflow-wrap:anywhere` or an equivalent safe contract.
4. German learner content SHOULD be rendered in or below an element with `lang="de"` where practical for Sprint 1.
5. Vocabulary theme titles SHALL use two-line clamp plus full `title` text instead of one-line truncation.
6. Exercise options, pair cards, and tokens SHALL have safe wrapping and `min-width:0` protection where needed.
7. Synthetic German long-word smoke using `Geschwindigkeitsbegrenzungsschild` SHALL not create unrecoverable horizontal overflow on the targeted surfaces.
8. This requirement SHALL NOT shorten German copy or alter academic content.

## Requirement 5: Active exits must be guarded by confirmation

**User Story:** As a learner, I want the app to warn me before leaving an in-progress task, so that one accidental tap does not erase my work.

### Acceptance Criteria

1. WHEN a session is active and the learner requests exit, THE app SHALL show a confirm dialog before navigating away.
2. WHEN a grammar lesson is in progress and not at hero/results state, THE app SHALL show a confirm dialog before navigating away.
3. WHEN a writing flow has unsaved draft text or form input, THE app SHALL show a confirm dialog before navigating away.
4. Choosing the stay/cancel action SHALL keep the learner on the current screen with state preserved.
5. Choosing the exit action SHALL navigate to the intended destination.
6. The confirm dialog SHALL focus the safe/stay action when opened.
7. `Escape` SHALL dismiss the dialog and keep the learner on the current screen.
8. All confirm-exit copy SHALL go through `useTranslations`; hardcoded English labels such as `Quit session` SHALL be removed.

## Requirement 6: AI grading and pronunciation feedback must fail open

**User Story:** As a learner, I want technical grading failures to be shown as retryable system states, so that I am not punished for an unavailable AI response.

### Acceptance Criteria

1. IF `/api/v1/grade` returns non-success, malformed payload, network error, or parse error, THE exercise SHALL NOT call `onAnswer(false)` for that attempt.
2. IF grading is unavailable, THE UI SHALL show a neutral retry state, not an incorrect-answer state.
3. The learner SHALL be able to retry grading after an unavailable state without losing their input.
4. Changing the answer after an unavailable state SHALL clear the unavailable message.
5. Video-call summary SHALL distinguish three states: feedback ready with errors, feedback ready with no errors, and feedback unavailable.
6. Video-call summary SHALL NEVER display "no errors" when pronunciation feedback parsing failed.
7. All new messages SHALL exist in `vi`, `de`, and `en` locale files or follow the repo's locale fallback policy if one exists.

## Requirement 7: Verification must be explicit and traceable

**User Story:** As a delivery manager, I want every P0 fix tied to a verification step, so that we can sign off without relying on visual guesswork.

### Acceptance Criteria

1. Each ticket SHALL have at least one implementation task owned by Antigravity and at least one verification task owned by Codex/QC.
2. The task list SHALL identify the exact file areas Antigravity should inspect or edit.
3. The task list SHALL include commands or manual smoke steps for verification.
4. Known baseline blockers SHALL be documented instead of hidden.
5. Current known baseline blocker: TypeScript fails in `apps/web/src/components/listening/lesson-player.tsx` because `DEFAULT_SPEEDS[cefrLevel]` can be `undefined`.
6. No task may be marked done solely because a code pass exists; it must satisfy the acceptance criteria and verification step.
7. Antigravity handoff SHALL include a ready-to-use prompt.

## Release Readiness Criteria

The spec is ready for release only when:

1. Requirements 1 through 6 pass acceptance checks.
2. Locale parity for `vi` and `de` passes.
3. Visual audit pack check passes.
4. TypeScript either passes or the only remaining failure is documented as an unrelated baseline blocker with an owner.
5. Antigravity implementation diff is reviewed by Codex/QC.
6. Desktop at 768 px and above has no obvious regression on the touched surfaces.
