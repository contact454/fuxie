# Gameplay Polish Sprint 1.5 Readout

Date: 2026-05-14

## Summary

Sprint 1.5 closed the key P2/P3 gameplay findings from Sprint 1 and moves the current gameplay baseline to `green/yellow-ready` for Sprint 2 planning.

The team did not add new game modes or change reward/economy behavior. This sprint only polished the existing gameplay surfaces so the next sprint can start from a cleaner baseline.

## Fix Status

| Finding | Status | Evidence |
| --- | --- | --- |
| GPQA-001 repeated microgame CTA labels | Fixed | CTAs now render as `Chơi Speed Match`, `Chơi Cloze Streak`, and `Chơi Boss Review`. |
| GPQA-002 roleplay unlabeled active controls | Fixed | Close, finish, record, and stop controls now have accessible labels/titles. |
| GPQA-003 unclear roleplay completion/receipt | Fixed for v1 | Briefing states receipt appears after a scored turn; receipt distinguishes scored completion from practice note. |
| GPQA-004 campaign progress confusion | Fixed | Campaign explains path progress vs node learning evidence and clarifies empty evidence state. |
| GPQA-005 passive Badge Album entry | Improved | Dashboard quick actions now include Microgames, Campaign Map, and Badge Album. |

## Files Changed

- `apps/web/src/components/gameplay/VocabularyMicrogameHub.tsx`
- `apps/web/src/components/gameplay/SituationRoleplayClient.tsx`
- `apps/web/src/components/speaking/TurnBasedSpeakingPlayer.tsx`
- `apps/web/src/app/(learn)/campaign/page.tsx`
- `apps/web/src/components/dashboard/dashboard-client.tsx`
- `apps/web/src/lib/gamification/adaptive-quest-pacing.test.ts`
- `docs/gamification/gameplay-polish-sprint-1-5-masterplan.md`
- `docs/gamification/gameplay-polish-sprint-1-5-readout.md`

## Verification

Automated:

- `npx tsc --noEmit --pretty false` in `apps/web`: pass.
- `npm --prefix apps/web test`: pass, 59 files / 229 tests.

Browser smoke:

| Surface | Desktop | Mobile `390x844` |
| --- | --- | --- |
| Vocabulary Microgame Pack | Pass | Pass |
| German Situation Roleplay | Pass | Pass |
| Dashboard gameplay entry points | Pass | Pass |
| Quest Campaign Map | Pass | Pass |
| Admin Gamification readout | Pass | Pass |

## Guardrails

| Guardrail | Status |
| --- | --- |
| No new leaderboard/social expansion | Pass |
| No real gift/voucher/shipping/cash-like reward | Pass |
| No Fucoin cap, shop price, catalog, or spend behavior change | Pass |
| No XP/Fucoin for click, checkpoint, briefing, map, or album view | Pass |
| No new analytics PII/audio/transcript/raw speech/text metadata | Pass |

## Sprint 2 Readiness

Decision: ready to plan Sprint 2.

Recommended Sprint 2 focus:

- Deeper microgame mechanics or richer roleplay evaluation, not more shell pages.
- Keep the Gameplay QA Pod running in parallel.
- Keep economy/reward expansion frozen until the next gameplay readout confirms learners are studying more, not only collecting.

