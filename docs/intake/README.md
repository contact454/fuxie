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
| Phase 22: GitHub Actions Node 20 Deprecation Follow-Up | `phase-22-github-actions-node-deprecation-follow-up.md` | In progress; `P19-A3` workflow opt-in implemented pending PR CI |

## Day 30 Exit Criteria

- Working tree is classified into intentional groups.
- P0 risk register items have owners and dates.
- Minimum release gates are documented and runnable.
- Product North Star and 90-day roadmap are approved.
- Technical baseline identifies what is stable, blocked, and unknown.
- Fuxie can resume feature development through the company role model.
