# Fuxie Learner UI + Design Production Handoff

Date: 2026-05-15

## Scope

Learner UI only. The working direction remains a moderate "Fuxie German Village" layer: learning CTA first, village prop second, mascot/reward/motion only when it supports action, feedback, reward, locked, empty, or error states.

## Completed Artifacts

| Artifact | Path | Status |
| --- | --- | --- |
| Production plan | `docs/design/learner-ui-design-production-plan.md` | Complete |
| QA runbook | `docs/design/learner-ui-visual-qa-runbook.md` | Complete |
| Screenshot manifest | `docs/design/visual-audit/learner-ui-screenshot-manifest.json` | Complete |
| Image generation strategy | `docs/design/fuxie-german-village-image-generation-strategy.md` | Complete |
| Image generation manifest | `docs/design/visual-audit/fuxie-german-village-image-generation-manifest.json` | 36 assets queued |
| Image generation queue script | `scripts/fuxie-image-generation-plan.ts` | Complete |
| Batch A/B generated asset sheet | `docs/design/asset-generation/fuxie-german-village-batch-a-b-contact-sheet.png` | 16 generated assets |
| Batch C mascot pose sheet | `docs/design/asset-generation/fuxie-german-village-batch-c-mascot-poses-contact-sheet.png` | 8 generated mascot pose assets |
| Batch D reward object sheet | `docs/design/asset-generation/fuxie-german-village-batch-d-reward-objects-contact-sheet.png` | 6 generated reward object assets |
| Batch E UI mockup sheet | `docs/design/visual-audit/mockups/fuxie-german-village-batch-e-ui-mockups-contact-sheet.png` | 6 generated UI mockups |
| Mockup board | `docs/design/visual-audit/learner-ui-production-mockup-board-v1.svg` | Complete |
| Inventory script | `scripts/learner-ui-visual-audit.ts` | Complete |
| Surface screenshot report | `tmp/learner-ui-screenshot-capture.md` | 28/28 OK |
| Skill player screenshot report | `tmp/learner-ui-player-screenshot-capture.md` | 8/8 OK |
| Inventory report | `tmp/learner-ui-visual-audit.md` | 28/28 screenshots, 53/53 assets |
| Image generation report | `tmp/fuxie-image-generation-plan.md` | 5 batches, 36 source assets generated, 30 runtime assets generated |

## Evidence Set

Surface screenshots:

- Dashboard, Course, Vocabulary, Grammar, Reading, Listening, Speaking, Writing, Exam, Review, Shop, Chat, Badges, Campaign.
- Desktop: 1440 x 1100.
- Mobile: 390 x 844.
- Naming: `docs/design/visual-audit/screenshots/<surface>-village-v1-<viewport>.png`.

Supplemental skill-player screenshots:

- Reading player: `/reading/R-A1-DEV-001`.
- Listening player: `/listening/L-A1-DEV-001`.
- Writing player: `/writing/W-A1-DEV-001`.
- Speaking player: `/speaking/dev-a1-begruessung-01`.
- Naming: `docs/design/visual-audit/screenshots/<skill>-player-village-v1-<viewport>.png`.

Note: screenshots are from local `next dev`, so the small Next dev indicator can appear in the bottom-left corner. Ignore it during product UI scoring.

## Image Generation Strategy

Generate new Fuxie German Village assets as a planned production stream. The current inventory proves the v1 visual language exists; it does not replace the need for a v2 village system.

Current production queue:

- 5 batches.
- 36 planned generated assets.
- 22 P0 assets.
- 8 P0 location plates.
- 8 UI frames/state panels.
- 8 mascot learning-moment poses.
- 6 reward objects.
- 6 UI mockups.
- Generated so far: Batch A 8/8 location plates, Batch B 8/8 UI frames/state panels, Batch C 8/8 mascot learning-moment poses, Batch D 6/6 reward objects, and Batch E 6/6 UI mockups.
- Frontend map updated: `FUXIE_WORLD_PROPS` now exposes v2 P0 location plates, `FUXIE_UI_FRAMES` exposes generated frame assets, `FUXIE_MASCOT_STATES` exposes Batch C v2 mascot poses, and `REWARD_ASSETS` exposes Batch D village reward objects. Batch E mockups are design references, not runtime assets.

Generate in this order:

1. P0 location plates: Dashboard, Course, Vocabulary, Reading, Listening, Speaking, Writing, Shop.
2. P0 UI frames: notice board, checkpoint node, collection card, audio panel, letter receipt, result reveal, market shelf, empty signpost.
3. Mascot poses for learning states: quest planner, gentle correction, listening focus, speaking record, writing delivery, shop approval, result celebration, calm empty state.
4. Reward objects: XP token, Fucoin token, Streak Freeze snowglobe, CEFR badge node set, Hint Ticket coupon, Unlock Key charm.
5. UI mockups for implementation direction.

The manifest defines output paths, prompts, and integration targets. Use it as the production backlog for image generation, not as a permission gate.

## QA Notes

Manual planning score, 1 to 5. These scores prioritize the next implementation slice; they are not final design signoff.

| Surface | Priority | Score | Main reason | Next action |
| --- | --- | ---: | --- | --- |
| Dashboard | P0 | 4.2 | Mission, CTA, and reward loop are clear. | Keep village snapshot secondary to CTA. |
| Course | P0 | 4.1 | Seeded path and CEFR badges read as progression. | Tighten mobile path visibility below hero. |
| Vocabulary | P0 | 4.0 | Collection/reward language is strong. | Standardize collection-card frame hierarchy. |
| Reading | P0 | 4.0 | Player intro has briefing, strategy, and reward preview. | Capture result-state after completion. |
| Listening | P0 | 4.0 | Radio booth role and lesson CTA are clear. | Recheck audio-control density on mobile. |
| Speaking | P0 | 4.0 | Speaking quest, checkpoint path, and rewards are visible after seed fix. | Recheck recording state and feedback state. |
| Writing | P0 | 4.0 | Writing player has task framing and reward preview. | Make submitted-feedback receipt feel more postal. |
| Shop | P0 | 4.1 | Wallet, pending, ownership, and inventory language are visible. | Keep market shelf decorative layer restrained. |
| Grammar | P1 | 3.8 | Grammar scroll role exists but dense topic content dominates. | Add light workshop treatment without color noise. |
| Exam | P1 | 4.1 | Town Hall/formal challenge tone is credible. | Preserve formal readiness tone in reward moments. |
| Review | P1 | 4.0 | Review Garden supports calm progress. | Strengthen empty/due-card distinction. |
| Chat | P2 | 3.7 | Chat Cafe role is visible but help flow needs restraint. | Audit voice/video states separately. |
| Badges | P2 | 3.9 | Badge shelf supports ownership. | Clarify earned/locked/next taxonomy. |
| Campaign | P2 | 3.8 | Event board can share mission language. | Avoid separate campaign-only visual language. |

P0 average: 4.05.

P0 strengths:

- Dashboard now has a clear mission -> CTA -> reward loop.
- Course path renders with real A1 data after seed and uses CEFR badge nodes.
- Vocabulary, Reading, Listening, Writing, and Speaking player screens have usable reward/motivation evidence.
- Shop shows wallet, pending, ownership, and inventory language in one market/backpack surface.

Watch items for UI implementation:

- Mobile first viewport can be tight near the bottom nav on long hero/reward sections.
- Player screenshots are intro-state captures; result-state comparison should be repeated after completing one exercise per skill.
- Speaking player seed now has 3 sentences, but audio URLs are placeholder dev paths; do not judge audio playback from this evidence.
- Content seed reports known vocabulary warnings outside the learner UI design scope.

## Implementation Hygiene Included

- `apps/web/src/lib/content/course-data.ts`: dedupes course mapping arrays before render so duplicate grammar slugs do not create React key issues.
- `apps/web/src/components/shared/sidebar.tsx`, `apps/web/src/components/shared/mobile-shell.tsx`, `apps/web/src/components/ui/mascot.tsx`, and `apps/web/src/components/gamification/quest-visuals.tsx`: shared mascot/reward images now declare stable sizing for Next Image QA.
- `scripts/seed-dev-data.ts`: speaking dev seed now matches the player JSON shape and produces a meaningful Speaking player intro.
- `apps/web/src/components/gamification/quest-visuals.tsx`: generated village UI frames now appear in shared reward reveal, checkpoint rail, and skill motivation rail components.
- Dashboard mission cards, Vocabulary selected-theme panels, and Shop item cards now consume generated frame assets with state-specific roles.
- Course path nodes and the shared Result reward loop now consume generated checkpoint, result reveal, and letter receipt frames.
- `scripts/seed-dev-data.ts`: local Listening dev fixture now uses an existing public A1 MP3, so `/listening/L-A1-DEV-001` no longer produces an audio 404 during browser QA.

## Browser QA After Docker DB

- Local Docker DB on `127.0.0.1:5434` was seeded with `pnpm db:seed:dev` after forcing `DATABASE_URL` and `DATABASE_URL_UNPOOLED` from the root `.env`.
- Chrome/CDP screenshots were captured under `tmp/browser-qa/cdp/` for Reading, Listening, Writing, and Speaking player desktop/mobile states.
- Confirmed player routes render with local seed IDs: `/reading/R-A1-DEV-001`, `/listening/L-A1-DEV-001`, `/writing/W-A1-DEV-001`, `/speaking/dev-a1-begruessung-01`.
- After the listening audio fixture fix, player CDP smoke showed no runtime errors for Reading, Listening, Writing, or Speaking.
- `pnpm smoke:full-local` passed web DB, learner pages/APIs, teacher page/API, and admin page/API; AI health failed only because the AI service was not running locally.

## Next UI Slice

Start with P0 only:

- Dashboard Village Square hierarchy polish.
- Course Path node/checkpoint treatment.
- Vocabulary Collection Book frame rules.
- Shared Skill Player Motivation Layer result-state QA.
- Fuxie Market/Inventory operational states.

No teacher/admin expansion in this slice.
