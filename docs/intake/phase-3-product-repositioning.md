# Phase 3: Product Repositioning

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Product Manager EdTech
Vai phoi hop: CEO / General Manager, Product Designer / UX/UI Designer, AI / LLM Engineer

This Phase 3 product repositioning pass was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Product Manager EdTech, CEO / General Manager, Product Designer / UX/UI Designer, and AI / LLM Engineer profiles were read.
- The task domain is product strategy, roadmap prioritization, learner experience, and AI product direction.
- Phase 3 is planning and product definition only while Phase 2 P0 blockers remain open.

## Phase Objective

Phase 3 runs on Day 15-21. The objective is to reposition Fuxie from a broad German-learning app into an AI-powered German learning platform for Vietnamese learners, with a crisp product promise, focused pillars, measurable success criteria, and a roadmap that does not overload the team before baseline stability is accepted.

## Product Repositioning Statement

Fuxie helps Vietnamese learners progress through German CEFR levels with a daily guided path, AI coaching, exam-aware practice, and motivating study loops.

The product is not positioned as generic language chat, a content library, or a decorative gamified app. Fuxie should feel like a practical learning companion that tells the learner what to do next, gives useful feedback, and keeps progress visible.

## Target Segment Priority

| Priority | Segment | Job to be done | Phase 3 decision |
| --- | --- | --- | --- |
| Primary | Vietnamese self-study German learners | Know what to study today and improve consistently | Design the learner path first |
| Secondary | Exam-focused learners for Goethe/Telc/OSD | Practice skill tasks and receive targeted feedback | Make exam readiness visible in roadmap |
| Supporting | Teachers / class operators | Track progress and intervene | Preserve teacher/admin as support and future B2B channel |
| Supporting | Admin / operators | Manage content, users, rewards, and system health | Keep admin utility practical, not a product showcase |

## North Star

Fuxie's North Star is weekly meaningful CEFR progress by Vietnamese German learners.

Working metric definition:

- A learner completes at least three meaningful study actions in a week.
- Meaningful actions include SRS review, vocabulary practice, reading/listening task, writing/speaking submission, AI tutor feedback loop, or exam practice.
- Progress must be tied to level, skill, and learner goal.

## Product Pillars

### 1. Learn

The learner gets a personal CEFR path and a clear next study action.

Must-have outcomes:

- Learner level, goal, exam target, and daily time are captured or inferred.
- Dashboard answers: "What should I study now?"
- Vocabulary, grammar, review, reading, listening, writing, speaking, and exam practice are connected to progress.

Success metrics:

- Activation: learner completes first meaningful study action.
- Weekly study completion: learner completes three meaningful actions.
- SRS completion: due reviews completed on time.
- CEFR skill coverage: learner studies across at least two skills per week.

### 2. Coach

The AI layer helps learners understand mistakes, retry, and improve.

Must-have outcomes:

- AI tutor gives level-appropriate bilingual support for Vietnamese learners.
- Writing feedback has rubric, correction, explanation, and retry path.
- Speaking feedback has safe fallback when browser/provider audio fails.
- AI behavior is evaluated with test cases, not only ad hoc examples.

Success metrics:

- AI feedback usefulness rating.
- Writing or speaking retry improvement.
- AI cost per active learner.
- Eval pass rate for level-appropriate feedback.

### 3. Motivate

Game mechanics support real study behavior.

Must-have outcomes:

- Missions, XP, streak, Fucoin, rewards, and mascot moments reinforce learning actions.
- Rewards do not distract from study completion.
- Streak recovery should encourage return without punishing learners too harshly.
- Mascot appears at learning moments, feedback, milestones, and recovery prompts.

Success metrics:

- Daily mission completion.
- Day 1, Day 7, Day 30 retention.
- Streak recovery rate.
- Reward interaction tied to completed study actions.

## Day 15-21 Work Plan

| Day | Focus | Owner | Output | Acceptance signal |
| --- | --- | --- | --- | --- |
| Day 15 | Confirm positioning and user priority | Product Manager EdTech + CEO / General Manager | Product positioning decision | Primary segment and non-goals are explicit |
| Day 16 | Define learner journey | Product Manager EdTech + Product Designer | Learner journey map | Onboarding, dashboard, study action, feedback, and review loop are mapped |
| Day 17 | Audit dashboard and onboarding | Product Designer | UX priority list | Learner can identify next best action and progress signal |
| Day 18 | Define AI coach product scope | Product Manager EdTech + AI / LLM Engineer | AI coach brief | Tutor, writing, speaking, grading, fallback, eval, and cost constraints are explicit |
| Day 19 | Define motivation loop | Product Manager EdTech + Product Designer | Motivation loop brief | Missions, XP, streak, Fucoin, rewards, and mascot support study actions |
| Day 20 | Map teacher/admin support role | Product Manager EdTech | Teacher/admin support brief | Teacher/admin remain scoped to support and future B2B channel |
| Day 21 | Synthesize roadmap implications | Product Manager EdTech + CEO / General Manager | Updated product roadmap | 30/60/90 priorities remain focused and measurable |

## Product Scope Decisions

| Decision | Phase 3 choice | Rationale |
| --- | --- | --- |
| GTM focus | B2C Vietnamese learners first | Keeps product activation simple and measurable |
| Teacher/admin | Supporting surface and future B2B channel | Avoids splitting the first growth motion |
| AI promise | Coach and feedback layer | Avoids overclaiming autonomous teaching quality before evals |
| Game promise | Motivation for real study | Keeps rewards tied to learning outcomes |
| Exam prep | Roadmap pillar, not the only product identity | Exam readiness matters, but daily CEFR progress is broader |
| Product expansion | No new feature implementation during open P0 baseline blockers | Protects baseline discipline |

## UX Audit Targets

| Surface | Question | Owner | Acceptance signal |
| --- | --- | --- | --- |
| Onboarding | Does Fuxie capture level, goal, exam target, and time? | Product Designer | Onboarding gap list ready |
| Dashboard | Does the learner know the next best study action? | Product Designer | Primary CTA and progress hierarchy are clear |
| Vocabulary / review | Are practice and SRS connected to progress? | Product Manager EdTech | Study action maps to retention metric |
| Writing / speaking | Is feedback actionable and retryable? | AI / LLM Engineer | Feedback loop and fallback states defined |
| Rewards / mascot | Do rewards reinforce study instead of decorating the page? | Product Designer | Motivation loop supports learning action |
| Teacher/admin | Are support workflows coherent and bounded? | Product Manager EdTech | Future B2B support scope documented |

## AI Coach Scope

Phase 3 defines the AI coach at product level only. Implementation waits for baseline readiness and AI eval planning.

Included:

- Tutor chat for level-appropriate explanations.
- Writing feedback with rubric and retry path.
- Speaking feedback with permission/provider fallback.
- Weak-skill guidance based on learner activity.
- Eval cases for A1/A2/B1/B2 and common Vietnamese learner mistakes.
- Cost, latency, and provider failure constraints.

Not included:

- Unbounded autonomous curriculum generation.
- Medical, visa, legal, or guaranteed exam outcome claims.
- Provider migration before current behavior is benchmarked.
- Voice-first rebuild before speech/audio status is known.

## Roadmap Implications

| Window | Product outcome | Owner | Release guardrail |
| --- | --- | --- | --- |
| Days 15-30 | Repositioning approved; onboarding/dashboard PRD ready; AI coach brief ready | Product Manager EdTech | No feature implementation until Phase 2 P0 blockers are closed or accepted |
| Days 31-60 | Learning core upgrade: daily path, AI feedback, content QA, teacher/admin analytics confidence | Product Manager EdTech | Must have current gates and role smoke results before release candidate |
| Days 61-90 | Beta motion: measured cohort, retention loop, AI/content quality metrics, conversion assumption | CEO / General Manager | Beta release requires stable baseline and accepted P0 risk status |

## Acceptance Criteria

Phase 3 is complete when:

- Target user and primary product promise are explicit.
- Product pillars Learn, Coach, and Motivate each have outcomes and metrics.
- Learner onboarding/dashboard priorities are defined.
- AI coach scope has eval, fallback, and cost constraints.
- Teacher/admin are intentionally scoped as support/future B2B, not competing primary focus.
- Roadmap implications are updated without opening new feature implementation.
- Remaining Phase 2 P0 blockers are visible as release guardrails.

## Open Risks

| Risk | Impact on Phase 3 | Owner | Required before release |
| --- | --- | --- | --- |
| R-003 Redis/service readiness open | Prevents reliable full local smoke | DevOps / Cloud Engineer | Service audit warning cleared or accepted |
| R-004 role smoke blocked | Prevents confidence in learner/teacher/admin separation | QA Automation Engineer | `pnpm smoke:full-local` result captured |
| R-005 Prisma generate failing | Prevents clean DB/client baseline confidence | Backend Engineer | `pnpm db:generate` passes |
| R-007 AI quality unverified | Limits strength of AI coach claims | AI / LLM Engineer | Eval plan and initial benchmark |
| R-011 product spread risk | Could dilute team focus | CEO / General Manager | One primary growth motion approved |
| R-012 mascot/game decorative risk | Could distract from learning | Product Designer | Mascot/reward usage rules tied to study actions |

## Next Planned Step: Phase 4 30/60/90 Execution Plan Refresh

After Phase 3, refresh the 30/60/90 execution plan so it translates the new positioning into sequenced work:

1. Lock the first learner activation milestone.
2. Split product requirements into onboarding, dashboard, AI coach, motivation loop, and teacher/admin support.
3. Define owners, acceptance criteria, and release gates per milestone.
4. Keep Phase 2 P0 technical blockers as release blockers until closed or explicitly accepted.
