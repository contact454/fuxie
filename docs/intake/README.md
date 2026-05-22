# Fuxie Project Intake Board

Date: 2026-05-12

## Operating Context

Fuxie is being handed to the newly formed internal software company model. The first 30 days are an intake and stabilization window, not a feature expansion window.

Default product direction: Fuxie becomes an AI-powered German learning platform for Vietnamese learners, combining CEFR learning paths, AI tutor, exam preparation, teacher/admin operations, gamification, mascot identity, and content quality operations.

## Mandatory Role-Gate Governance

The role-gate is a governance rule for the whole Fuxie project. Codex must complete it before every task, including planning, code, content, review, QA, design, operations, and business work. If the role profile has not been read, the task has not started.

Use `.agents/workflows/task-startup-checklist.md` as the short SOP.

## Intake Rule

Every task must follow the repository operating model:

1. Read `.agents/workflows/task-role-router.md`.
2. Identify the task domain.
3. Select exactly one primary role and up to three support roles.
4. Read the primary role profile in `.agents/personnel/`.
5. Read support profiles when the task crosses domains.
6. Start work with `Vai chinh` and `Vai phoi hop`.
7. Apply the primary role checklist before final output.

## Project Freeze

Until the baseline is accepted:

- Do not start broad refactors.
- Do not add new product features.
- Do not change database schema unless a P0 blocker requires it.
- Do not mix content-only changes with runtime app changes.
- Do not print or commit secrets.
- Classify every working-tree change before commit or release.
- Phase 0 must verify that each intake task follows the mandatory role-gate before work begins.

## Intake Streams

| Stream | Primary owner | Support roles | Day 30 outcome |
| --- | --- | --- | --- |
| Product | Product Manager EdTech | CEO / General Manager, Product Designer, Data / Analytics Engineer | North Star, 3-month roadmap, acceptance metrics |
| Engineering | CTO / Tech Lead | Full-stack Engineer, Backend Engineer, Frontend Engineer | Technical baseline and P0 stabilization list |
| AI | AI / LLM Engineer | German Academic Lead, Backend Engineer, Security / Privacy Consultant | AI tutor/grading/generation audit and eval plan |
| Content | German Academic Lead | German Curriculum Designer, Content QA / Linguistic Reviewer | CEFR/content risk report and QA workflow |
| Design | Product Designer | Gamification Designer, Illustrator / 3D Mascot Artist | UX/mascot/game-feel audit and design priorities |
| QA | QA Automation Engineer | DevOps / Cloud Engineer, Content QA / Linguistic Reviewer | Release gate matrix and regression plan |
| DevOps/Security | DevOps / Cloud Engineer | Security / Privacy Consultant, Backend Engineer | Env/deploy/security readiness report |
| Business/Growth | CEO / General Manager | Growth Lead, Sales / Partnership Manager, Finance / Admin Officer | GTM priority, staffing and budget assumptions |

## Handover Control Sheet

| Area | Current status | Owner | First action | Acceptance signal |
| --- | --- | --- | --- | --- |
| Working tree | Dirty; runtime UI files, `.gitignore`, `.agents/`, and `AGENTS.md` are present in status | Project Manager / Delivery Manager | Classify changes into commit groups | No unknown high-risk diff remains |
| Web app | Next.js learner, teacher, admin surfaces exist | CTO / Tech Lead | Audit protected routes and high-traffic learner flows | Learner/teacher/admin smoke documented |
| AI service | `apps/ai-service` exists with chat, generation, audio, grading routes | AI / LLM Engineer | Audit provider, queue, cost, eval, failure behavior | AI health and provider-dependent status documented |
| Database | `packages/database` exists with Prisma workflow scripts | Backend Engineer | Verify schema/generate/migration state | DB drift status documented |
| SRS engine | `packages/srs-engine` exists and is part of `test:core` | QA Automation Engineer | Run or schedule focused core tests | SRS test status documented |
| Content | CEFR content exists across levels; prior audit notes large content diffs | German Academic Lead | Spot-check A1, B2, C1, C2 and run content QA | Content blockers listed or cleared |
| Mascot/brand | 3D mascot direction and assets exist | Product Designer | Audit production use vs design guidance | Mascot use map documented |
| DevOps/security | Env audit, secret audit, smoke scripts exist | DevOps / Cloud Engineer | Re-run environment and secret gates | Gate results logged |
| Growth/business | Not yet formalized in repo docs | CEO / General Manager | Define first GTM segment and metrics | GTM assumption sheet approved |

## Required Intake Documents

- `phase-0-project-freeze-handover.md`
- `phase-1-full-audit.md`
- `phase-2-stabilize-baseline.md`
- `phase-3-product-repositioning.md`
- `phase-4-30-60-90-execution-refresh.md`
- `phase-5-implementation-ready-backlog.md`
- `phase-6-first-backlog-execution.md`
- `phase-7-baseline-blocker-closure.md`
- `phase-8-release-candidate-governance.md`
- `phase-9-rc-packaging-and-commit-grouping.md`
- `phase-10-visual-qa-final-rc-signoff.md`
- `phase-11-final-staging-and-rc-branch-preparation.md`
- `phase-12-approved-staging-and-commit-execution.md`
- `phase-13-cto-swjs-decision-and-rc-finalization.md`
- `phase-14-pr-release-handoff.md`
- `phase-15-push-and-pr-creation.md`
- `phase-16-review-response-and-merge-readiness.md`
- `phase-18-post-merge-release-verification.md`
- `phase-19-post-merge-backlog-kickoff.md`
- `phase-20-first-post-rc-polish-implementation.md`
- `phase-21-dashboard-mascot-priority-review.md`
- `phase-22-github-actions-node-deprecation-follow-up.md`
- `phase-23-learner-activation-prd.md`
- `phase-24-onboarding-ux-spec.md`
- `phase-25-dashboard-next-action-ux-spec.md`
- `phase-26-activation-event-map.md`
- `phase-27-learner-activation-test-plan.md`
- `phase-28-ai-coach-product-brief.md`
- `phase-29-ai-eval-plan.md`
- `phase-30-weekly-cefr-progress-metric.md`
- `phase-31-motivation-loop-brief.md`
- `phase-32-retention-event-map.md`
- `phase-33-backlog-closure-review.md`
- `phase-34-ai-eval-ci-gate.md`
- `phase-35-ai-eval-academic-review-pack.md`
- `phase-36-ai-eval-academic-signoff-workflow.md`
- `phase-37-ai-eval-fixture-expansion-from-academic-feedback.md`
- `phase-38-ai-eval-controlled-fixture-patch.md`
- `phase-39-ai-module-acceptance-and-master-plan.md`
- `phase-40-company-wide-project-reassessment.md`
- `phase-41-recommended-cycles-execution-tracker.md`
- `phase-42-ai-eval-prompt-backlog-slice.md`
- `phase-43-speaking-audio-smoke-fallback-slice.md`
- `phase-44-content-qa-academic-signoff-sweep.md`
- `phase-45-teacher-admin-analytics-ui-smoke.md`
- `phase-46-growth-beta-cohort-readiness.md`
- `phase-47-operating-budget-staffing-plan.md`
- `phase-48-company-wide-reassessment-refresh.md`
- `phase-49-beta-readiness-blocker-closure-masterplan.md`
- `phase-50-beta-readiness-blocker-closure-sprint.md`
- `phase-51-controlled-beta-exclusion-closure-launch-pack.md`
- `phase-52-controlled-beta-cohort-operations.md`
- `phase-53-beta-feedback-triage-targeted-fix-backlog.md`
- `phase-54-controlled-beta-evidence-intake-sprint.md`
- `phase-55-controlled-beta-evidence-capture-system.md`
- `phase-56-evidence-backed-first-fix-slice-selection.md`
- `phase-57-controlled-beta-evidence-collection-follow-up.md`
- `phase-58-controlled-beta-evidence-readiness-recheck.md`
- `phase-59-controlled-beta-operations-blocker-closure-plan.md`
- `phase-60-beta-operations-escalation-review.md`
- `phase-61-controlled-beta-recruitment-execution-plan.md`
- `phase-62-beta-recruitment-blocker-escalation.md`
- `phase-63-controlled-beta-invite-batch-and-evidence-intake.md`
- `phase-64-controlled-beta-outreach-execution-tracker.md`
- `phase-65-controlled-beta-outreach-response-review.md`
- `phase-66-first-fix-selection-rerun-from-cohort-evidence.md`
- `phase-67-first-fix-verified.md`
- `baseline-acceptance-note.md`
- `current-state-audit.md`
- `risk-register.md`
- `product-north-star-roadmap.md`
- `technical-baseline-report.md`
- `execution-plan-30-60-90.md`

## Intake Phase Plans

| Phase | Document | Status |
| --- | --- | --- |
| Phase 0: Project Freeze & Handover Setup | `phase-0-project-freeze-handover.md` | Complete as governance/documentation baseline |
| Phase 1: Full Audit & Baseline Evidence | `phase-1-full-audit.md` | Complete with current gate evidence |
| Phase 2: Stabilize The Baseline | `phase-2-stabilize-baseline.md` | Complete with DB/env/service/smoke readiness evidence |
| Phase 3: Product Repositioning | `phase-3-product-repositioning.md` | Complete as product strategy and roadmap guardrail |
| Phase 4: 30/60/90 Execution Plan Refresh | `phase-4-30-60-90-execution-refresh.md` | Complete as delivery plan with owners, dependencies, and release gates |
| Phase 5: Implementation-Ready Backlog | `phase-5-implementation-ready-backlog.md` | Complete as backlog with owners, dependencies, acceptance signals, and sequencing |
| Phase 6: First Backlog Execution | `phase-6-first-backlog-execution.md` | Complete as initial execution record; remaining blockers were closed in Phase 7 |
| Phase 7: Baseline Blocker Closure | `phase-7-baseline-blocker-closure.md` | Complete; Prisma generate, service readiness, dev-auth, AI health, and full local smoke passed |
| Phase 8: Release Candidate Governance | `phase-8-release-candidate-governance.md` | Complete; release gates passed, runtime UI conditionally accepted, `sw.js` policy documented |
| Phase 9: RC Packaging And Commit Grouping | `phase-9-rc-packaging-and-commit-grouping.md` | Complete; commit groups, release notes, rollback owners, and baseline acceptance note prepared |
| Phase 10: Visual QA And Final RC Signoff | `phase-10-visual-qa-final-rc-signoff.md` | Complete; runtime UI visual signoff passed with P2 follow-ups, final `sw.js` decision remains pending |
| Phase 11: Final Staging And RC Branch Preparation | `phase-11-final-staging-and-rc-branch-preparation.md` | Complete as staging/branch plan; no git staging performed, `sw.js` decision and git approval remain pending |
| Phase 12: Approved Staging And Commit Execution | `phase-12-approved-staging-and-commit-execution.md` | Complete; approved groups committed separately, `sw.js` remains pending |
| Phase 13: CTO `sw.js` Decision And RC Finalization | `phase-13-cto-swjs-decision-and-rc-finalization.md` | Complete; `pnpm build` passed and generated `sw.js` committed separately |
| Phase 14: PR / Release Handoff | `phase-14-pr-release-handoff.md` | Complete; PR title/body and release handoff prepared, push/PR pending approval |
| Phase 15: Push And PR Creation | `phase-15-push-and-pr-creation.md` | Complete; branch pushed and PR #2 created |
| Phase 16: Review Response And Merge Readiness | `phase-16-review-response-and-merge-readiness.md` | Complete; PR #2 is mergeable with CI and Vercel passing |
| Phase 18: Post-Merge Release Verification | `phase-18-post-merge-release-verification.md` | Complete; PR #2 merged into `master` and master CI passed |
| Phase 19: Post-Merge Product / Engineering Backlog Kickoff | `phase-19-post-merge-backlog-kickoff.md` | Complete; next-cycle backlog and first post-RC task selected |
| Phase 20: First Post-RC Polish Implementation | `phase-20-first-post-rc-polish-implementation.md` | Complete; `P19-A1` vocabulary CTA error feedback implemented and `pnpm check:quick` passed |
| Phase 21: Dashboard Mascot Priority Review | `phase-21-dashboard-mascot-priority-review.md` | Complete; `P19-A2` dashboard mascot priority implemented and `pnpm check:quick` passed |
| Phase 22: GitHub Actions Node 20 Deprecation Follow-Up | `phase-22-github-actions-node-deprecation-follow-up.md` | Complete; `P19-A3` action major updates and Node 24 opt-in passed PR CI |
| Phase 23: Learner Activation PRD | `phase-23-learner-activation-prd.md` | Complete; `P19-B1` defines target learner, first meaningful action, metric, non-goals, and edge cases |
| Phase 24: Onboarding UX Spec | `phase-24-onboarding-ux-spec.md` | Complete; `P19-B2` specifies onboarding screens, daily time, mobile behavior, and error states |
| Phase 25: Dashboard Next-Action UX Spec | `phase-25-dashboard-next-action-ux-spec.md` | Complete; `P19-B3` specifies primary next-action hierarchy, states, responsive behavior, and analytics handoff |
| Phase 26: Activation Event Map | `phase-26-activation-event-map.md` | Complete; activation metric, events, properties, privacy boundaries, and data quality checks defined |
| Phase 27: Learner Activation Test Plan | `phase-27-learner-activation-test-plan.md` | Complete; `P19-B4` covers activation happy path, auth, edge cases, mobile, analytics readiness, and release gates |
| Phase 28: AI Coach Product Brief | `phase-28-ai-coach-product-brief.md` | Complete; `P19-C1` defines AI coach surfaces, scope, fallback rules, non-goals, academic guardrails, and eval handoff |
| Phase 29: AI Eval Plan | `phase-29-ai-eval-plan.md` | Complete; `P19-C2` defines A1/A2/B1/B2 eval cases, Vietnamese learner mistakes, fallback cases, rubric, cost, latency, and provider-failure gates |
| Phase 30: Weekly Meaningful CEFR Progress Metric Spec | `phase-30-weekly-cefr-progress-metric.md` | Complete; `P19-C3` defines numerator, denominator, scope, events, AI cap, data quality, dashboard, and interpretation |
| Phase 31: Motivation Loop Brief | `phase-31-motivation-loop-brief.md` | Complete; `P19-D1` maps missions, XP, streak, Fucoin, rewards, and mascot moments to real study actions |
| Phase 32: Retention Event Map | `phase-32-retention-event-map.md` | Complete; `P19-D2` defines D1/D7/D30 retention, mission, streak, reward, weekly progress, lifecycle, and privacy-safe events |
| Phase 33: Backlog Closure Review | `phase-33-backlog-closure-review.md` | Complete; all `P19-*` items have phase outputs and the open phase sequence is closed |
| Phase 34: AI Eval CI Gate | `phase-34-ai-eval-ci-gate.md` | Complete; offline AI eval now gates CI and optional provider evidence is read out without requiring secrets |
| Phase 35: AI Eval Academic Review Pack | `phase-35-ai-eval-academic-review-pack.md` | Complete; automated eval evidence can now be packaged for German Academic Lead signoff without exposing raw provider output |
| Phase 36: AI Eval Academic Signoff Workflow | `phase-36-ai-eval-academic-signoff-workflow.md` | Complete; Academic Lead decisions can now be captured as structured signoff evidence without changing runtime AI behavior |
| Phase 37: AI Eval Fixture Expansion From Academic Feedback | `phase-37-ai-eval-fixture-expansion-from-academic-feedback.md` | Complete; Academic Lead follow-up actions can now generate proposal-only fixture expansion backlog without mutating the baseline fixture |
| Phase 38: AI Eval Controlled Fixture Patch | `phase-38-ai-eval-controlled-fixture-patch.md` | Complete; approved fixture expansion proposals can now be previewed or explicitly applied with blocked-plan safeguards |
| Phase 39: AI Module Acceptance And Master Plan | `phase-39-ai-module-acceptance-and-master-plan.md` | Complete; Module AI is accepted with conditions and has beta-ready gates, analytics rules, and a 90-day roadmap |
| Phase 40: Company-Wide Project Reassessment | `phase-40-company-wide-project-reassessment.md` | Complete; all personnel workstreams have reassessed Fuxie as post-baseline, implementation-ready with company-wide conditions |
| Phase 41: Recommended Cycles Execution Tracker | `phase-41-recommended-cycles-execution-tracker.md` | Complete; all Phase 40 recommended cycles have owner, evidence, status, blocker, and next gate |
| Phase 42: AI Eval Prompt Backlog From Fixture Patch Slice | `phase-42-ai-eval-prompt-backlog-slice.md` | Complete with provider blocker; offline eval and tooling passed, prompt backlog waits for Academic Lead final signoff |
| Phase 43: Speaking / Audio Smoke And Fallback Slice | `phase-43-speaking-audio-smoke-fallback-slice.md` | Complete with environment blocker; AI tests passed, speaking/audio smoke remains blocked by local service/provider prerequisites |
| Phase 44: Content QA Academic Signoff Sweep | `phase-44-content-qa-academic-signoff-sweep.md` | Complete with human signoff pending; content QA scanned 1193 files with 0 errors and 0 warnings |
| Phase 45: Teacher / Admin Analytics UI Smoke Slice | `phase-45-teacher-admin-analytics-ui-smoke.md` | Complete with environment blocker; smoke reached role surfaces but DB/Redis/AI prerequisites blocked final pass |
| Phase 46: Growth / Beta Cohort Readiness Plan | `phase-46-growth-beta-cohort-readiness.md` | Complete; first beta cohort, funnel metrics, weekly review, and guardrails are defined |
| Phase 47: Operating Budget And Staffing Plan | `phase-47-operating-budget-staffing-plan.md` | Complete; 90-day budget buckets, staffing sequence, hiring controls, and cost controls are defined |
| Phase 48: Company-Wide Reassessment Refresh | `phase-48-company-wide-reassessment-refresh.md` | Complete; all workstreams reassessed Fuxie after Phase 41-47 and confirmed beta-readiness blockers before feature expansion |
| Phase 49: Beta Readiness Blocker Closure Masterplan | `phase-49-beta-readiness-blocker-closure-masterplan.md` | Complete as closure sprint masterplan; seven blocker groups have owners, dependencies, command checklist, evidence log, and beta decision rules |
| Phase 50: Beta Readiness Blocker Closure Sprint | `phase-50-beta-readiness-blocker-closure-sprint.md` | Complete; local services restored, core gates and full local smoke passed, and Fuxie is controlled beta-ready with exclusions |
| Phase 51: Controlled Beta Exclusion Closure And Launch Pack | `phase-51-controlled-beta-exclusion-closure-launch-pack.md` | Complete as launch pack; Phase 50 accepted with conditions, exclusions have owners, and Phase 52 cohort operations is planned |
| Phase 52: Controlled Beta Cohort Operations | `phase-52-controlled-beta-cohort-operations.md` | Complete as operations and measurement plan; first 30-50 learner cohort has owners, metrics, cadence, issue triage, and exclusion guardrails |
| Phase 53: Beta Feedback Triage And Targeted Fix Backlog | `phase-53-beta-feedback-triage-targeted-fix-backlog.md` | Complete as triage template; evidence intake, taxonomy, severity rules, scoring, and first-fix selection rules are ready while cohort data is pending |
| Phase 54: Controlled Beta Evidence Intake Sprint | `phase-54-controlled-beta-evidence-intake-sprint.md` | Complete as evidence intake check; no real cohort data is recorded yet, so first fix slice selection remains blocked by missing evidence |
| Phase 55: Controlled Beta Evidence Capture System | `phase-55-controlled-beta-evidence-capture-system.md` | Complete as evidence capture system; canonical beta templates now exist under `docs/beta/controlled-beta/` |
| Phase 56: Evidence-Backed First Fix Slice Selection | `phase-56-evidence-backed-first-fix-slice-selection.md` | Complete as selection gate; current decision is `blocked_by_missing_evidence`, so no runtime implementation slice is selected yet |
| Phase 57: Controlled Beta Evidence Collection Follow-Up | `phase-57-controlled-beta-evidence-collection-follow-up.md` | Complete as evidence follow-up; shortfall is documented with owners and 2026-05-20 follow-up, while runtime implementation remains blocked |
| Phase 58: Controlled Beta Evidence Readiness Recheck | `phase-58-controlled-beta-evidence-readiness-recheck.md` | Complete as recheck gate; missing cohort evidence is escalated to `controlled_beta_operations_blocker`, and runtime implementation remains blocked |
| Phase 59: Controlled Beta Operations Blocker Closure Plan | `phase-59-controlled-beta-operations-blocker-closure-plan.md` | Complete as operations blocker closure plan; recruitment source, invite/consent flow, feedback capture, owner cadence, and minimum evidence package are defined |
| Phase 60: Beta Operations Escalation Review | `phase-60-beta-operations-escalation-review.md` | Complete as escalation review; recruitment paths remain blocked without confirmed source, so first-fix selection is still blocked |
| Phase 61: Controlled Beta Recruitment Execution Plan | `phase-61-controlled-beta-recruitment-execution-plan.md` | Complete as recruitment execution plan; channel options, alias intake rules, invite/feedback handoff, outreach constraints, and evidence cadence are defined |
| Phase 62: Beta Recruitment Blocker Escalation | `phase-62-beta-recruitment-blocker-escalation.md` | Complete as blocker escalation; no recruitment channel is selected yet, so invite batch and first-fix selection remain blocked |
| Phase 63: Controlled Beta Invite Batch And Evidence Intake | `phase-63-controlled-beta-invite-batch-and-evidence-intake.md` | Complete as source decision and invite-batch readiness; `community_outreach_selected`, but learner aliases, feedback, analytics, and first-fix selection remain blocked until real cohort evidence exists |
| Phase 64: Controlled Beta Outreach Execution Tracker | `phase-64-controlled-beta-outreach-execution-tracker.md` | Complete as outreach execution tracker; first community/manual outreach is ready to send, while learner evidence and first-fix selection remain blocked until real response/activity exists |
| Phase 65: Controlled Beta Outreach Response Review | `phase-65-controlled-beta-outreach-response-review.md` | Complete as outreach state review; currently `blocked_pending_owner_action` until Operations confirms real sent evidence and response |
| Phase 66: First Fix Selection Rerun From Cohort Evidence | `phase-66-first-fix-selection-rerun-from-cohort-evidence.md` | Complete as selection gate; `ISSUE-BETA-001` (Dev Auth) selected as first fix based on verified smoke test evidence |
| Phase 67: First Fix Verified | `phase-67-first-fix-verified.md` | Complete as verification record; `ISSUE-BETA-001` successfully resolved via port conflict remediation, unblocking local development |

## Day 30 Exit Criteria

- Working tree is classified into intentional groups.
- P0 risk register items have owners and dates.
- Minimum release gates are documented and runnable.
- Product North Star and 90-day roadmap are approved.
- Technical baseline identifies what is stable, blocked, and unknown.
- Fuxie can resume feature development through the company role model.
