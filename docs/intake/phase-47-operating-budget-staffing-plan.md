# Phase 47: Operating Budget And Staffing Plan

Date: 2026-05-13

## Role-Gate Compliance

Vai chinh: Finance / Admin Officer
Vai phoi hop: HR / Talent Partner, CEO / General Manager, CTO / Tech Lead

Finance / Admin Officer, HR / Talent Partner, CEO / General Manager, and CTO / Tech Lead profiles were read before this cycle.

## Objective

Create a conservative 90-day budget and staffing map for the next Fuxie implementation window.

## 90-Day Budget Buckets

| Bucket | Cost driver | Control rule | Owner |
| --- | --- | --- | --- |
| AI provider usage | Chat, writing feedback, speaking support, eval runs | Track latency/cost by flow before scaling usage | AI / LLM Engineer |
| Infrastructure | Vercel, Postgres, Redis, storage, monitoring | Keep beta environment small and observable | DevOps / Cloud Engineer |
| Content QA | Academic review, linguistic spot checks, exam-prep validation | Prioritize A1-B2 learner path before broad C1-C2 polish | German Academic Lead |
| QA and release | Test maintenance, smoke time, regression support | Gate release candidates, not every draft | QA Automation Engineer |
| Design and mascot | Dashboard/onboarding, mascot learning moments, rewards | Fund only behavior-supporting design work | Product Designer |
| Growth beta | Cohort recruitment, support tools, feedback collection | No paid scale until activation/retention baseline exists | Growth Lead |
| Legal/privacy | Terms, privacy, AI/audio/data claim review | Review before public beta claims | Legal / Compliance Advisor |

## Staffing Sequence

| Priority | Role | Engagement model | Reason |
| --- | --- | --- | --- |
| 1 | Full-stack Engineer | Core team | Own learner activation and dashboard/onboarding iteration |
| 2 | AI / LLM Engineer | Core or senior contractor | Close provider eval, fallback, cost, and prompt quality |
| 3 | German Academic Lead + Content QA | Part-time expert bench | Approve CEFR, content, and AI feedback claims |
| 4 | QA Automation Engineer | Part-time to core as beta nears | Keep release gates current and smoke repeatable |
| 5 | Product Designer | Part-time/core | Keep first action, onboarding, and mobile learning UX polished |
| 6 | Growth Lead | Part-time until beta signal | Run cohort and lifecycle experiments after instrumentation is usable |
| 7 | DevOps/Security support | Fractional | Review env, secrets, backups, provider data, and smoke readiness |

## Hiring Controls

- Do not hire broad teams before beta signal.
- Prefer senior fractional specialists for academic, legal, security, and DevOps needs.
- Keep first full-time capacity focused on product engineering and AI quality.
- Every hire or contractor must map to one of the current beta blockers or learner outcome metrics.

## Cost Controls

- AI usage must have per-flow cost and latency reporting before scale.
- Provider keys must stay out of repo and docs.
- Content production should not outrun content QA capacity.
- Paid growth spend waits until activation and D7 retention have baseline evidence.
- Reward/shop economics should stay capped until motivation loop readout proves learning overlap.

## Acceptance Criteria

This plan is accepted as a rough operating plan, not a final finance model. A final budget requires:

- Current provider price assumptions.
- Expected beta cohort size and usage.
- Hosting and database plan.
- Compensation or contractor rate ranges.
- Legal/privacy review scope.
- Runway target from CEO / General Manager.

## Next Action

Finance / Admin Officer should turn this into a spreadsheet budget once CEO confirms runway target and beta cohort size.
