# Gameplay Experience And Bug Triage Masterplan

Date: 2026-05-14

## Team Meeting Summary

The Gameplay Experience And Bug Triage Pod agrees to start as a parallel quality lane for Fuxie's gamified learning experience.

The team's first operating principle is simple: Fuxie gameplay is not accepted just because routes load and tests pass. It is accepted only when a real learner can understand the objective, feel a satisfying loop, complete meaningful German practice, receive truthful progress/reward evidence, and continue to the next action without confusion.

The team will evaluate gameplay and bugs together because the learner does not separate them. A confusing reward receipt, a dead CTA, weak replay pull, a missing mobile state, or wrong admin evidence can all reduce trust in the game loop.

## Sprint Goal

Set up and run the first structured gameplay QA cycle for the current gamification surfaces:

- Vocabulary Microgame Pack.
- German Situation Roleplay.
- Badge Album.
- Quest Campaign Map.
- Existing Quest Episodes across six skills.
- Admin Gamification readout.
- Economy/shop guardrails.

Outcome: a prioritized gameplay + bug report that tells the product team what to polish, what to fix, and what is safe to pilot.

## Roles And Responsibilities

| Role | Person / Seat | Main Responsibility | Output |
| --- | --- | --- | --- |
| Project Manager / Delivery Manager | Interim pod lead | Cadence, task board, risk log, release recommendation | Weekly execution tracker |
| Gameplay QA Lead | Hire / assign first | Combined gameplay + bug signoff | Gameplay QA report |
| Gamification Playtester | Hire / assign | Game loop, reward clarity, replay pull, anti-farming risk | Gameplay scorecard |
| QA Automation Engineer | Existing QA / hire if overloaded | Automated and repeatable regression coverage | Smoke checklist, test gaps |
| Exploratory QA Tester | Hire 1-2 | Edge cases, device/browser flows, auth redirects | Bug tickets with repro |
| Product Designer | Fractional support | Visual hierarchy, mobile ergonomics, UX friction | Design QA notes |
| Data / Analytics Engineer | Fractional support | Event/readout evidence, metadata safety | Analytics evidence check |
| Full-stack Engineer | On-call support | Fix triaged product/runtime issues | P0/P1 fixes or estimates |

## RACI

| Workstream | Responsible | Accountable | Consulted | Informed |
| --- | --- | --- | --- | --- |
| Gameplay scorecard | Gamification Playtester | Gameplay QA Lead | Product Designer | PM |
| Bug triage | Exploratory QA Tester | QA Automation Engineer | Full-stack Engineer | PM |
| Mobile visual QA | Product Designer | Gameplay QA Lead | QA Automation Engineer | PM |
| Admin readout verification | Data / Analytics Engineer | QA Automation Engineer | Full-stack Engineer | PM |
| Release recommendation | Gameplay QA Lead | PM / Delivery Manager | Gamification, QA, Design | Product/Engineering |
| P0/P1 escalation | QA Automation Engineer | PM / Delivery Manager | Full-stack Engineer | Product |

## Workstreams

### 1. Gameplay Experience Pass

Scope:

- Play each surface as a learner.
- Score clarity, loop, learning value, feedback, reward clarity, replay pull, mobile comfort, and emotional tone.
- Mark each finding as `gameplay_blocker`, `gameplay_polish`, or `delight_opportunity`.

Acceptance:

- Every learner surface has a 1-5 score.
- Any score under pass bar has a concrete recommendation.
- No surface is accepted if learning value is below 5.

### 2. Bug And Regression Pass

Scope:

- Verify route load, auth, mobile layout, submit/result states, receipts, links, admin readout, and guardrails.
- Log P0-P3 bugs with steps, expected/actual, severity rationale, and evidence.

Acceptance:

- P0/P1 has owner and same-day escalation.
- P2 has owner and target sprint.
- P3 can go to backlog.

### 3. Analytics And Evidence Pass

Scope:

- Confirm gameplay events appear with safe metadata.
- Confirm admin `/admin/gamification` can explain starts, completions, drop-off, badge unlocks, roleplay/microgame/campaign evidence.
- Check that no analytics include raw text, audio, transcript, prompt, or PII.

Acceptance:

- Evidence exists for each promised readout.
- Metadata is minimal and safe.
- Missing denominator or misleading metric is marked as release risk.

### 4. Economy And Reward Guardrail Pass

Scope:

- Confirm no gameplay-only click awards XP/Fucoin.
- Confirm shop remains secondary.
- Confirm real gift/cash-like reward remains locked.
- Confirm no Fucoin cap/price/catalog/spend behavior changed.

Acceptance:

- Any reward-integrity issue is P0/P1.
- No gameplay surface can ship if it encourages reward farming over study.

## Task Rules

Every task must have:

- One owner.
- One surface.
- One test role: learner, admin, teacher, or guest.
- One expected outcome.
- One evidence artifact: screenshot, bug ticket, scorecard, test result, or readout note.
- One release decision: green, yellow, red, or blocked.

No task can close with "looks fine" only. It must include what was checked and what remains risky.

## First Sprint Task Board

| ID | Task | Owner | Support | Output | Priority |
| --- | --- | --- | --- | --- | --- |
| GPQA-001 | Create gameplay scorecard template from pod criteria | Gameplay QA Lead | Gamification Designer | Reusable scorecard | P0 |
| GPQA-002 | Create bug report template with P0-P3 taxonomy | QA Automation Engineer | PM | Bug template | P0 |
| GPQA-003 | Baseline playtest: Vocabulary Microgame Pack | Gamification Playtester | Exploratory QA | Score + bugs | P0 |
| GPQA-004 | Baseline playtest: German Situation Roleplay | Gamification Playtester | Product Designer | Score + bugs | P0 |
| GPQA-005 | Baseline playtest: Badge Album | Product Designer | Data | Score + evidence notes | P1 |
| GPQA-006 | Baseline playtest: Quest Campaign Map | Gamification Playtester | Product Designer | Score + path friction | P1 |
| GPQA-007 | Admin gamification evidence check | Data / Analytics Engineer | QA Automation | Readout evidence note | P0 |
| GPQA-008 | Mobile smoke pass for all new gameplay surfaces | Exploratory QA Tester | Product Designer | Mobile QA notes | P0 |
| GPQA-009 | Guardrail verification: shop/reward/economy unchanged | QA Automation Engineer | Full-stack Engineer | Guardrail checklist | P0 |
| GPQA-010 | Weekly gameplay + bug triage readout | PM | Gameplay QA Lead | Ship/hold/fix-next decision | P0 |

## 2-Week Execution Plan

### Week 1: Setup And Baseline

Day 1:

- Confirm team owners.
- Publish scorecard and bug template.
- Confirm test environment: local DB, Redis, dev-auth, web server.
- Select browser widths: desktop `1280x720`, mobile `390x844`.

Day 2:

- Run Vocabulary Microgame Pack and Roleplay gameplay pass.
- Log first wave of gameplay blockers and P0/P1 bugs.

Day 3:

- Run Badge Album and Campaign Map gameplay pass.
- Run admin readout evidence pass.

Day 4:

- Run mobile smoke across all new gameplay surfaces.
- Recheck economy/reward guardrails.

Day 5:

- Hold triage.
- Decide green/yellow/red per surface.
- Create Week 2 fix/polish backlog.

### Week 2: Fix Validation And Pilot Recommendation

Day 1-2:

- Engineering fixes P0/P1.
- Design/Gamification refines top gameplay blockers.

Day 3:

- QA reruns affected surfaces.
- Data confirms readout still valid.

Day 4:

- Run final desktop/mobile smoke.
- Check reward/economy guardrails again.

Day 5:

- Publish first Gameplay + Bug Readout.
- Recommendation: pilot, pilot with restrictions, or hold.

## Gameplay Scorecard Template

Each surface receives:

- Surface and URL.
- User role.
- Viewport.
- Test date.
- Clarity score.
- Game loop score.
- Learning value score.
- Feedback feel score.
- Reward clarity score.
- Replay pull score.
- Mobile comfort score.
- Emotional tone score.
- Top 3 learner friction points.
- Top 3 delight opportunities.
- Final decision: green, yellow, red, or blocked.

## Bug Ticket Template

Required fields:

- ID.
- Surface and URL.
- Role.
- Viewport/device.
- Severity: P0, P1, P2, P3.
- Steps to reproduce.
- Expected result.
- Actual result.
- Evidence.
- Suspected owner.
- Release decision.
- Retest status.

## Release Decision Rules

Green:

- Gameplay pass bars met.
- No P0/P1 bugs.
- Admin/readout evidence is not misleading.
- Reward/economy guardrails intact.

Yellow:

- No P0/P1 bugs.
- P2 issues have owner and follow-up date.
- Gameplay weakness does not block learning or trust.

Red:

- Learner objective unclear.
- Learning value below required bar.
- Reward, badge, mastery, or analytics evidence is wrong.
- Mobile flow blocks completion.

Blocked:

- Local environment cannot run required smoke.
- Auth/DB route prevents validation.
- Missing seed/fixture makes required flow untestable.

## Coordination Cadence

Daily 15-minute pod standup:

- What surface did we test?
- What P0/P1 appeared?
- What gameplay score dropped below pass bar?
- What is blocked?

Twice-weekly triage:

- PM facilitates.
- QA owns bug severity.
- Gamification owns game-feel severity.
- Product Design owns UX friction severity.
- Engineering estimates fix path.

Weekly decision review:

- Review scorecard summary.
- Review P0/P1/P2 counts.
- Review admin evidence and guardrails.
- Decide pilot readiness.

## Definition Of Done

The first pod cycle is done when:

- Scorecard template exists and is used on all priority surfaces.
- Bug template exists and at least one pass has been run.
- Desktop and mobile smoke results are recorded.
- P0/P1 bugs are closed or feature is disabled.
- P2 bugs have owners.
- Admin readout evidence has been checked.
- Reward/economy guardrails have been checked.
- Final readout says green/yellow/red/blocked for every surface.

## Immediate Next Action

Start GPQA-001 through GPQA-004 first. These create the operating tools and immediately test the two most game-like learner surfaces: Vocabulary Microgame Pack and German Situation Roleplay.

After that, run GPQA-005 through GPQA-009, then close the sprint with GPQA-010.

