# Phase 28: AI Coach Product Brief

Date: 2026-05-12

## Role-Gate Compliance

Vai chinh: Product Manager EdTech
Vai phoi hop: AI / LLM Engineer, German Academic Lead

This Phase 28 brief was started under the mandatory role-gate workflow:

- `task-startup-checklist.md` was read.
- `task-role-router.md` was read.
- The Product Manager EdTech, AI / LLM Engineer, and German Academic Lead profiles were read.
- The task domain is product scope, AI coaching behavior, CEFR learning quality, fallback boundaries, and acceptance criteria.

## Objective

Close `P19-C1`: define the AI coach product brief for Fuxie's Vietnamese self-study German learners.

This brief sets product scope for AI tutor, writing feedback, speaking support, grading, fallback behavior, scope boundaries, and non-goals before the AI eval plan begins.

## Product Context

Fuxie's North Star is weekly meaningful CEFR progress for Vietnamese German learners. The AI coach supports that goal by helping learners understand what to do next, receive useful feedback, and retry with more confidence.

The coach is not a replacement for CEFR curriculum, content QA, or teacher judgment. It is a guided feedback layer that must be measurable, level-aware, and safe under provider failure.

## Target Users

| User | Need | AI coach value |
| --- | --- | --- |
| Vietnamese self-study learner | Understand mistakes and know the next step | Bilingual, level-aware feedback and encouragement |
| Exam-focused learner | Practice Goethe/Telc/OSD-style writing and speaking | Rubric-based feedback without overstated pass/fail claims |
| Returning learner | Resume progress after missed days or weak skills | Short guidance tied to dashboard next action and prior study state |
| Teacher/admin future channel | Review student progress later | Aggregated signals, not raw private chat or audio in this phase |

## Problem

Fuxie has AI surfaces, but product quality risk remains open because coach behavior, grading scope, fallback rules, and success measures are not yet explicit.

The learner-facing question is:

```text
Can Fuxie explain my German mistake and help me improve today without pretending the AI is a human teacher?
```

## Product Promise

Fuxie's AI coach gives short, level-appropriate German learning feedback in Vietnamese or simple German, helps learners retry, and connects feedback to a real study action.

## AI Coach Surfaces

| Surface | Primary job | Must do | Must not do |
| --- | --- | --- | --- |
| Tutor chat | Help learner understand a concept or next action | Explain simply, adapt to CEFR level, suggest a concrete next step | Become open-ended generic chat detached from study progress |
| Writing feedback | Review short learner writing | Mark key issues, explain 1-3 priority corrections, invite retry | Over-correct beyond level or invent exam scores |
| Speaking feedback | Support speaking confidence | Give permission-safe fallback, summarize pronunciation/fluency status when evidence exists | Claim precise pronunciation scoring without validated signal |
| Grading | Assess practice submissions | Use rubric labels and uncertainty states | Present unverified scores as official Goethe/Telc/OSD results |
| Hint generation | Help when stuck | Give scaffolded hint before answer | Leak full answer when practice intent is active |
| Weak-skill guidance | Recommend follow-up | Tie advice to level, skill, and dashboard next action | Create a parallel curriculum outside approved CEFR path |

## Must-Have Scope

| ID | Requirement | Acceptance criteria |
| --- | --- | --- |
| AC-001 | AI coach has a clear learner job | Each AI entry point maps to tutor, writing, speaking, grading, hint, or weak-skill guidance |
| AC-002 | Feedback is CEFR-aware | Response length, correction depth, and examples fit the learner's current level |
| AC-003 | Vietnamese learner support is explicit | Feedback can explain common Vietnamese learner mistakes in Vietnamese when useful |
| AC-004 | Retry loop exists | Writing/speaking feedback ends with a concrete retry or next action |
| AC-005 | Fallback behavior is defined | Provider failure, low confidence, unavailable audio, and missing learner profile have safe states |
| AC-006 | AI claims are bounded | No official exam score, diagnosis, legal/visa advice, or teacher replacement claim |
| AC-007 | Measurement handoff exists | Phase 29 eval plan can test quality, cost, latency, and provider failure |

## Should-Have Scope

| ID | Requirement | Acceptance signal |
| --- | --- | --- |
| AC-008 | Tone adapts to learner confidence | Feedback is encouraging without hiding important errors |
| AC-009 | Coach can reference dashboard next action | Advice points learner back to one useful study action |
| AC-010 | Cost guardrails are product-visible | AI-heavy actions can be rate-limited, summarized, or downgraded gracefully |
| AC-011 | Teacher/admin output can be summarized later | Future summaries use aggregate progress signals, not raw private submissions by default |

## Out Of Scope

- New AI provider migration.
- Autonomous curriculum generation.
- Official Goethe/Telc/OSD score prediction.
- Legal, visa, medical, or employment advice.
- Teacher replacement claims.
- Storing raw audio, transcripts, or free-text submissions in analytics events by default.
- Monetization or AI credit mechanics.

## Fallback Rules

| Scenario | Learner-facing behavior | Product status |
| --- | --- | --- |
| Provider unavailable | Show short retryable error and offer non-AI study action | Block AI output; continue learning flow |
| Missing level/profile | Use A1-safe explanation and ask learner to finish profile setup | Degraded but usable |
| Low confidence grading | Say feedback is approximate and ask for retry or teacher review when relevant | Do not show definitive score |
| Audio permission denied | Offer text-based speaking prompt or self-check fallback | Keep practice path open |
| Unsafe or off-scope request | Refuse briefly and redirect to German learning task | Protect learner trust |
| Cost/rate limit reached | Offer cached summary, shorter feedback, or non-AI next action | Preserve daily progress |

## Academic Guardrails

- A1/A2 feedback should prioritize clarity, core grammar, word order, verb forms, and confidence.
- B1/B2 feedback may include cohesion, register, argument structure, and exam task fit.
- C1/C2 behavior remains advanced but must not be used for official exam scoring without separate validation.
- Corrections should not overload learners; prioritize the few errors that improve the next retry.
- Exam labels must say "exam-style" or "practice rubric" unless validated official scoring exists.

## AI Engineering Guardrails

- AI outputs need structured quality categories for eval: correctness, level fit, helpfulness, safety, and retry usefulness.
- Prompt design should include learner level, target skill, target exam when available, and output format.
- Provider failure must not block the learner from completing a meaningful non-AI study action.
- Cost, latency, retry count, and model/provider errors must be measurable without logging private learner content in analytics.

## Success Metrics

| Metric | Definition | Owner |
| --- | --- | --- |
| AI feedback usefulness rating | Learner rates coach feedback as useful after AI feedback action | Product Manager EdTech |
| Retry improvement | Learner retries writing/speaking and improves rubric category or completes next action | AI / LLM Engineer |
| AI cost per active learner | Provider cost divided by active learners using AI coach in reporting window | AI / LLM Engineer |
| Eval pass rate | AI responses pass defined eval cases by level/skill/failure mode | QA Automation Engineer |
| AI fallback completion | Learner can continue study flow when AI provider is unavailable | Product Manager EdTech |

## Dependencies

| Follow-up | Owner | Dependency |
| --- | --- | --- |
| Phase 29: AI Eval Plan | AI / LLM Engineer | This product brief |
| Phase 30: Weekly Meaningful CEFR Progress Metric Spec | Data / Analytics Engineer | Activation event map and AI coach action definitions |
| AI QA plan | QA Automation Engineer | Eval cases and fallback expectations |
| AI implementation slice | Full-stack Engineer or AI / LLM Engineer | Approved eval plan and release gate |

## Release Acceptance Criteria

The AI coach scope is accepted when:

- Tutor, writing, speaking, grading, hint, and weak-skill surfaces are separated.
- Must-have scope and non-goals are explicit.
- Fallback rules cover provider, profile, audio, confidence, safety, and cost limits.
- Academic guardrails protect CEFR and exam claims.
- Phase 29 has enough scope to define eval cases for A1/A2/B1/B2, Vietnamese learner mistakes, cost, latency, and provider failure.

## Residual Risks

| Risk | Mitigation |
| --- | --- |
| AI feedback may be fluent but wrong | Phase 29 eval set must include German correctness and CEFR fit |
| Learners may over-trust AI scores | Use practice rubric labels and uncertainty states |
| Cost may grow with open chat | Limit coach jobs, response size, retries, and heavy actions |
| Speaking signal may be unavailable | Keep text/self-check fallback and avoid precise claims |
| Vietnamese explanations may oversimplify | Academic review samples common Vietnamese learner errors |

## Next Planned Step: Phase 29 AI Eval Plan

Phase 29 should handle `P19-C2`:

1. Route through AI / LLM Engineer with QA Automation Engineer and German Academic Lead support.
2. Define eval cases for A1/A2/B1/B2 tutor, writing, speaking, grading, fallback, and safety.
3. Include Vietnamese learner error patterns, cost, latency, and provider failure.
4. Keep provider migration and runtime implementation out of scope until eval criteria are accepted.
