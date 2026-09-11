# Fuxie Quality, Acceptance and Release Gates

Version: bootstrap v0.1 — 2026-09-11

This document defines the minimum evidence needed to call work verified or releasable. It complements existing `.kiro/specs`, tests, content sign-off and CI; it does not replace them.

## 1. Evidence vocabulary

Use exactly one state per required check:

- `NOT_RUN` — not executed.
- `BLOCKED` — could not execute because an access/dependency/provider/environment was unavailable.
- `FAIL` — executed and acceptance was not met.
- `PASS` — executed against the named scope/ref/environment and acceptance was met.
- `ACCEPTED_WITH_RISK` — owner/authorized role explicitly accepts a known gap. The underlying check remains FAIL/BLOCKED/NOT_RUN.
- `NOT_APPLICABLE` — documented reason it does not apply.

A result is invalid if the tested commit/tree, environment or provider/model changed in a way that can affect it.

## 2. Universal Definition of Done

A task is not `Verified` until all applicable items are true:

1. Target user/system problem and expected outcome are explicit.
2. Scope and non-goals are explicit.
3. Existing spec/ticket was reused or mapped before creating a new one.
4. Base and head refs are recorded.
5. Changed files match the approved scope, or scope expansion is documented.
6. Acceptance criteria are binary and testable.
7. Positive-path and relevant negative-path tests exist or have an explicit rationale.
8. Required automated gates passed on the current tree.
9. Security/privacy checks applicable to the change passed.
10. Learning/content checks applicable to learner-facing content passed.
11. No fake data is presented as real user data.
12. No placeholder/dead action is presented as a finished feature.
13. Error states are learner/operator-facing when recovery is required.
14. Sensitive values are not committed or logged.
15. Rollback/recovery path is known for runtime/data changes.
16. Evidence links or artifacts are recorded.
17. Reviewer/QC conclusion is recorded separately from executor self-report.
18. `Released` is only set after deployment/runtime evidence confirms the intended ref is active.

## 3. Governance and delivery gates

- One primary role owns each task; zero to three support roles.
- Product priority is not silently changed by an implementation agent.
- High-risk production, legal, billing and sensitive-access decisions use the required authority level.
- No second roadmap/risk register/QC log/launch program is created when the canonical source exists.
- Conflicting sources are surfaced; the correct authority is chosen by domain and exact ref.
- A work order names dependencies, owner, executor, reviewer, acceptance, evidence and rollback.
- Blocked work does not get reported as complete.
- Historical checkmarks are not reused as evidence for a changed ref.
- PR size/scope is reviewable; oversized change sets are split or explicitly risk-managed.
- Branch/PR workflow is used for non-trivial repository changes unless an approved exception exists.

## 4. Product and learner-value gates

- Target learner/persona is identified.
- The feature answers a real learner/operator need rather than copying a competitor pattern.
- Must-have vs nice-to-have is separated.
- A success metric or observable outcome exists.
- Critical edge cases and non-goals are documented.
- Learner activation flow keeps a clear next action.
- The product does not claim an outcome that has not been evaluated.
- Gamification reinforces study behavior rather than becoming an independent objective.
- Teacher/admin scope does not displace the current B2C learner priority without an explicit decision.

## 5. Runtime/data integrity gates

- Request input is schema-validated where user-controlled input affects state.
- Server-authoritative outcomes are not blindly accepted from the client when they change XP, completion, grading, money-like rewards or progress.
- Object ownership/authorization is enforced for every mutable user-scoped resource.
- Cross-user mutation/read tests exist for sensitive resource APIs.
- Duplicate/retry/idempotency behavior is defined for state-changing endpoints.
- Concurrent requests do not create invalid duplicate progress/reward records.
- Transactions cover multi-record invariants where partial commit would corrupt state.
- SRS state transitions are consistent across entry points that represent the same review action.
- Cache invalidation is tested after mutations that affect learner/operator views.
- Timezone/day-boundary behavior is defined for streaks, daily activity and scheduled reviews.
- Test/dev accounts and fixtures are distinguishable from real learner data.
- Destructive migrations have backup/restore and rollback reasoning.

## 6. Authentication, security and privacy gates

- Authentication proves identity; authorization separately proves permission to act on the object/role.
- Learner/teacher/admin cross-role access is tested for protected surfaces.
- Development auth cannot be enabled on a production path by normal configuration drift.
- Secrets audit passes and secrets are stored outside the repository.
- Provider/service endpoints are authenticated or network-protected according to their exposure model.
- Rate limiting/abuse controls exist for costly AI/audio endpoints.
- Logs avoid credentials and unnecessary personal/audio data.
- Data sent to AI/STT/TTS providers is minimized and documented.
- New external processors/providers require privacy/security review before sending personal data.
- Account deletion/retention obligations are represented in the product/legal plan before public launch.
- Security findings are risk-ranked with an owner and mitigation.

## 7. QA and CI gates

- Unit tests cover core deterministic business logic.
- API tests cover success, invalid input, unauthorized/forbidden and not-found conditions where relevant.
- Property tests are used for invariants that benefit from generated cases.
- Integration/E2E covers the critical learner loop and release smoke path.
- Flaky/timeout/provider-unavailable is not classified as PASS.
- Test data is reproducible and safe.
- CI installs from the locked dependency set successfully.
- Typecheck and build pass for release candidate changes.
- `pnpm check:quick` passes where relevant.
- `pnpm test:core` passes where relevant.
- Content QA and secret audit pass for release candidate changes that touch those domains.
- Production-hardening smoke runs on the actual release-candidate tree/environment before public release.
- CI result is tied to exact commit SHA.

## 8. Academic/content gates

- CEFR target and skill are explicit for learner-facing learning content.
- German grammar, spelling and lexical morphology are valid.
- Answer keys are semantically correct, not just schema-valid.
- Distractors are plausible but unambiguously wrong according to the task.
- Explanations are grounded in the item/evidence rather than boilerplate.
- Vietnamese localization is accurate and natural for the intended learner level.
- Difficulty/level fit is reviewed, not inferred from topic sophistication alone.
- Goethe/telc/OSD-style tasks name the correct exam family/level and follow the intended blueprint.
- Scoring/rubrics are versioned and not mixed across exam providers.
- Generated content that affects assessment is traceable to its generator/version and review state.
- Machine QA does not substitute for human/native sign-off where the release policy requires it.
- Copyright/licensing/source restrictions are respected.
- Content sign-off coverage is machine-readable by level/skill or equivalent cell structure.

## 9. Audio/speech gates

- Listening transcript and delivered audio are parity-checked after script changes.
- Missing/stale audio is learner-safe and clearly handled.
- STT/TTS/pronunciation provider failures have fallback/recovery behavior.
- Microphone denied/unavailable is handled without trapping the learner.
- Audio payload size/type/duration limits are validated.
- The product distinguishes speech recognition accuracy from pronunciation quality.
- Speaking evaluation rubrics are calibrated against reviewed examples.
- Browser/mobile target coverage is explicit for recording/playback.
- Personal voice/audio retention is minimized and documented.

## 10. AI/evaluation gates

- AI task objective and failure mode are defined.
- Prompt/model/provider versions are traceable for eval evidence.
- Structured outputs are schema-validated before state changes.
- Hallucinated academic claims/grades are constrained by rubric/evidence where applicable.
- Prompt injection/untrusted content boundaries are considered for tool-using or retrieval flows.
- Provider-real eval runs separately from offline/mock tests.
- Eval set contains representative CEFR/skill cases and hard/negative cases.
- Grading consistency and usefulness thresholds are documented before the feature is called ready.
- Cost per request/active learner is measurable for provider-dependent features.
- Latency/timeouts/retry/fallback are measured or explicitly bounded.
- Provider outage does not silently corrupt learner progress.

## 11. UX/accessibility/design gates

- Loading, empty, error and success states are intentional.
- Keyboard/focus behavior is usable for interactive surfaces.
- Contrast and controls follow the project's accessibility target.
- Responsive behavior is verified on target mobile and desktop widths.
- Vietnamese/German/English locale changes do not overflow or hide required actions.
- User-entered work is preserved or recovery is explicit on retryable failures.
- Destructive actions require appropriate confirmation.
- Success messaging reflects confirmed server state, not optimistic fiction.
- Existing design tokens/components/assets are reused before introducing alternatives.
- Mascot/brand assets use approved source/registry rules.
- Motion does not block task completion and respects reduced-motion requirements where applicable.

## 12. Deployment/operations gates

- Release candidate commit is identified.
- Preview/staging/production environment identity is explicit.
- Deployed commit can be traced from the platform.
- Environment configuration audit passes or each exception is accepted with risk.
- Database/Redis/AI provider dependencies are health-checked for the intended environment.
- Observability captures learner-safe error signals without leaking secrets.
- Alert owner/route exists for critical production failures.
- Rollback procedure is documented and has been drilled for public-launch readiness.
- Backup/restore path exists for production data before risky migration.
- Performance/bundle budgets are checked on critical learner surfaces.
- Public release is blocked if required smoke/eval/security/content gates are FAIL/BLOCKED/NOT_RUN unless authorized acceptance policy explicitly permits otherwise.

## 13. Analytics and business gates

- Each key metric has numerator, denominator, time window, timezone and test-account exclusions.
- `NOT_MEASURED` is used instead of zero when instrumentation/data is absent.
- Activation, retention and meaningful-study definitions remain stable enough for cohort comparison.
- Analytics events represent server-confirmed meaningful actions where state integrity matters.
- AI/audio/infra cost can be attributed at a useful unit (request/session/active learner).
- Vanity metrics such as total XP, file count or generated assets do not substitute for learning/product outcomes.
- Growth experiments define hypothesis, audience, stop condition and safety constraints.

## 14. Management-system smoke cases

Before the project is considered fully handed over to the management control plane, verify at least these cases:

1. New session can discover canonical sources without owner re-explaining the project.
2. Old green CI for an older SHA is rejected as evidence for a newer SHA.
3. PR implementation is reported as code-fixed, not released.
4. Merge without deployment is not reported as production.
5. Executor "done" report without logs/evidence remains unverified.
6. Conflicting docs are resolved by authority/domain/ref rather than recency alone.
7. Duplicate proposed task maps to an existing spec/ticket instead of creating parallel work.
8. Missing connector/provider access becomes BLOCKED, not a request for the owner to perform QA manually.
9. Secret/personal-data material is excluded from repository/project sources.
10. AI reviewer output is not mislabeled as human/native academic sign-off.
11. Skipped provider eval is not PASS.
12. A high-risk action routes to owner approval before execution.
13. A safe bounded repository change can be executed on a branch, read back and reviewed.
14. A failed test produces a blocker/fix loop rather than a bypass.
15. A rollback/recovery path is recorded for a runtime/data change.
16. One end-to-end slice reaches Verified with commit-tied evidence.

## 15. Public launch relationship

The existing `.kiro/specs/fuxie-public-launch-readiness/` program remains the launch authority. This document supplies reusable gate semantics and evidence rules. It must be mapped into the existing R/M milestones rather than replacing them.