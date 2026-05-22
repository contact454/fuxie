# Fuxie Learner UI + Design Production Plan

Date: 2026-05-15

## Role Gate

Vai chinh: Product Designer / UX/UI Designer
Vai phoi hop: Design System Designer, Illustrator / 3D Mascot Artist, Gamification Designer

## Summary

This production plan turns the approved Fuxie Learner UI direction into a concrete design backlog. Scope is learner UI only. The intended style is a moderate Fuxie German Village layer: clear study-first workflows, supported by village props, 3D Fuxie, reward art, lightweight frames, and motion only where they clarify an action, feedback state, reward, or empty/error state.

The plan uses existing project assets as continuity references:

- `FUXIE_3D_ASSETS` in `apps/web/src/components/gamification/quest-visuals.tsx`
- `REWARD_ASSETS` in `apps/web/src/components/gamification/reward-assets.ts`
- `FUXIE_WORLD_PROPS`, `FUXIE_MODULE_MASCOTS`, and `FUXIE_MASCOT_STATES` in `apps/web/src/lib/mascot/fuxie-assets.ts`

Image generation is now an active production stream for developing Fuxie into a German-learning village. The generation queue, prompts, output targets, and integration targets are defined in:

- `docs/design/fuxie-german-village-image-generation-strategy.md`
- `docs/design/visual-audit/fuxie-german-village-image-generation-manifest.json`

## Execution Status

Status on 2026-05-15: production planning, evidence capture, QA handoff, and the first German Village asset production pass are complete for learner UI.

- Surface screenshots: 28/28 captured for 14 learner surfaces at desktop and mobile sizes.
- Skill player screenshots: 8/8 supplemental captures for Reading, Listening, Writing, and Speaking players.
- Existing evidence: 18/18 older screenshots are still present for before/after comparison.
- Asset inventory: 53/53 referenced mascot, world prop, reward, and module assets exist as the v1 reference layer.
- Image generation roadmap: 36 planned generation assets across 5 batches, including 22 P0 assets for location plates, UI frames, and high-fidelity mockups.
- Batch A generated: 8/8 P0 location plates exported as source PNGs and 512px runtime WebP assets.
- Batch B generated: 8/8 P0 UI frames/state panels exported as source PNGs and 512px runtime WebP assets.
- Batch C generated: 8/8 mascot learning-moment poses exported as source PNGs and 512px runtime WebP assets.
- Batch D generated: 6/6 village-native reward objects exported as source PNGs and 512px runtime WebP assets.
- Batch E generated: 6/6 high-fidelity UI mockups saved for Dashboard, Course, Vocabulary, Skill Player, Market/Inventory, and Result Receipt.
- Batch A/B QA sheet: `docs/design/asset-generation/fuxie-german-village-batch-a-b-contact-sheet.png`.
- Batch C QA sheet: `docs/design/asset-generation/fuxie-german-village-batch-c-mascot-poses-contact-sheet.png`.
- Batch D QA sheet: `docs/design/asset-generation/fuxie-german-village-batch-d-reward-objects-contact-sheet.png`.
- Batch E QA sheet: `docs/design/visual-audit/mockups/fuxie-german-village-batch-e-ui-mockups-contact-sheet.png`.
- QA seed state: local content/dev seed was refreshed so Course, Listening, Reading, Writing, Speaking, Exam, and learner economy screens render meaningful QA states.
- Implementation hygiene completed during audit: course module mappings are deduped before render, shared mascot images declare stable sizing, and dev speaking seed now matches the speaking player JSON shape.

The final handoff is saved at:

- `docs/design/learner-ui-design-production-handoff.md`
- `docs/design/fuxie-german-village-image-generation-strategy.md`

## Batch 1: Learner Surface Audit Matrix

Baseline evidence comes from current learner routes, existing screenshots in `docs/design/visual-audit/screenshots/`, and the current asset maps. Scores are a production planning baseline, not final browser QA signoff.

| Surface | Route group | Village role | Primary learner job | Current visual anchors | Priority | Screenshot status | Main gap |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Dashboard | `/dashboard` | Village Square + Mission Board | Know what to study next, why it matters, and what reward is near | `dashboardGuide`, `dailyMission`, `missionBoard`, `villageSquare`, Fucoin/XP/Streak art | P0 | Desktop/mobile quest screenshots exist | Needs one consistent first-viewport village snapshot rule |
| Course | `/course` | Course Signpost Path | Choose the next CEFR milestone | `courseGuide`, `courseSignpost`, CEFR badges | P0 | Multiple screenshots exist | Path nodes need one reusable milestone treatment |
| Vocabulary | `/vocabulary`, `/vocabulary/practice/*`, `/vocabulary/microgames` | Collection Book | Pick a collection, practice, and see card/stamp progress | `vocabularyCoach`, `collectionBook`, `phraseStamp`, `postcardFragment` | P0 | Hub and practice screenshots exist | Collection/card frames need consistent hierarchy |
| Grammar | `/grammar`, `/grammar/[topicSlug]`, `/grammar/mocktest` | Grammar Scroll Workshop | Learn a rule and practice without visual overload | `grammarCoach`, `grammarScroll`, Hint Ticket | P1 | Missing current screenshot pass | Needs village role surfaced without hurting dense rule content |
| Reading | `/reading`, `/reading/[exerciseId]` | Library | Read, answer, receive feedback, continue | `librarian`, `library`, `SkillMotivationRail` | P0 | Hub/player screenshots exist | Player reward rail should map to the same reward language as results |
| Listening | `/listening`, `/listening/[lessonId]` | Radio Booth | Listen, answer, repeat, see reward receipt | `radioHost`, `radioBooth`, live mascot layer | P0 | Hub/player screenshots exist | Audio controls need stable village chrome without crowding |
| Speaking | `/speaking`, `/speaking/[lessonId]`, `/speaking/roleplay` | Speaking Stage + Chat Cafe | Practice pronunciation/dialogue and trust feedback | `speakingCoach`, `speakingStage`, `chatCafe` | P0 | Missing current screenshot pass | Needs consistent feedback/reward treatment across players |
| Writing | `/writing`, `/writing/[exerciseId]` | Post Office | Write, submit, understand score and next step | `postOffice`, `postOffice world prop`, `SkillMotivationRail` | P0 | Hub/player screenshots exist | Feedback receipt should feel like a delivered letter, not a generic result |
| Exam | `/exam`, `/exam/[examId]`, `/exam/[examId]/result/*` | Town Hall Challenge | Start formal practice and review pass/fail result | `examGuide`, `townHallExam`, `QuestProgressHero` | P1 | Multiple screenshots exist | Formal tone must stay credible; avoid overplayful rewards |
| Review | `/review`, `/session` | Review Garden | Return to spaced repetition with low pressure | `reviewGuide`, `reviewGarden`, `streakFreezeSaved` | P1 | Hub/session screenshots exist | Needs calm progress ritual and better empty states |
| Shop | `/rewards/shop` | Fuxie Market + Backpack | Understand wallet, item value, ownership, and request state | `shopkeeper`, `marketStall`, `inventoryMarketProp`, shop item art | P0 | Missing current screenshot pass | Inventory shelf/backpack needs a stable frame rule |
| Chat | `/chat` | Chat Cafe | Ask for help and practice conversation | `chatTutor`, `chatCafe`, Hint Ticket | P2 | Missing current screenshot pass | Voice/video states need restrained game layer |
| Badges | `/badges` | Badge Shelf | See earned milestones and next unlock | `badgeEarned`, `badgeShelf`, CEFR badges | P2 | Missing current screenshot pass | Needs ownership/status taxonomy |
| Campaign | `/campaign` | Village Event Board | Follow a time-boxed learning journey | `mission`, `rankUp`, `villageSquare` | P2 | Missing current screenshot pass | Needs event-board pattern, not a separate visual language |

## Batch 2: UI Mockup Board

The production mockup board is saved at:

- `docs/design/visual-audit/learner-ui-production-mockup-board-v1.svg`

The repeatable visual QA runbook and inventory manifest are saved at:

- `docs/design/learner-ui-visual-qa-runbook.md`
- `docs/design/visual-audit/learner-ui-screenshot-manifest.json`
- `docs/design/visual-audit/fuxie-german-village-image-generation-manifest.json`
- `docs/design/learner-ui-design-production-handoff.md`

It covers five P0 views:

| Mockup panel | Target surface | Purpose | Implementation guidance |
| --- | --- | --- | --- |
| Dashboard Village Square | Dashboard | First-viewport hierarchy: mission, CTA, reward preview, village snapshot | Reuse Mission Hub data; village snapshot must stay secondary to CTA |
| Course Path | Course | CEFR milestones as a path without becoming a full map | Reuse CEFR badge art and course signpost prop |
| Vocabulary Collection Book | Vocabulary | Collections, word cards, stamps, practice CTA | Reuse collection book, phrase stamp, postcard fragment props |
| Skill Player Motivation Layer | Reading/Listening/Writing/Speaking | Side/intro rail for progress, coach, reward preview | Use `SkillMotivationRail`, `FuxieRoleMascot`, `RewardPreview` |
| Fuxie Market + Inventory | Shop | Wallet, request state, inventory ownership | Reuse shop item art and inventory market prop |

The SVG is a deterministic design-board artifact. AI raster mockups are part of the generation roadmap and should be saved under `docs/design/visual-audit/mockups/`.

## Batch 3: German Village Image Generation Pack

Generate this pack as an active development roadmap. The manifest is the source of truth for exact prompts, output paths, and integration targets.

Run:

```text
pnpm exec tsx scripts/fuxie-image-generation-plan.ts
```

Current queue summary:

- 5 batches.
- 36 planned image assets.
- 22 P0 assets.
- Runtime targets cover world plates, UI frames, mascot poses, and reward objects.
- Mockup targets cover Dashboard, Course, Vocabulary, Skill Player, Shop, and Result Receipt.

The detailed queue is in `docs/design/fuxie-german-village-image-generation-strategy.md`.

### UI Mockups

| Asset id | Output target | Prompt purpose | Acceptance |
| --- | --- | --- | --- |
| `dashboard-village-square-mockup` | `docs/design/visual-audit/mockups/dashboard-village-square-v1.png` | High-fidelity mobile-first Dashboard Village Square | Mission, CTA, reward preview readable in 3 seconds |
| `course-path-mockup` | `docs/design/visual-audit/mockups/course-path-v1.png` | Course path with CEFR badge nodes and signpost | Path is scannable on mobile and not a full decorative map |
| `vocabulary-collection-book-mockup` | `docs/design/visual-audit/mockups/vocabulary-collection-book-v1.png` | Vocabulary hub as collections/cards/stamps | Practice CTA remains stronger than art |
| `skill-player-motivation-mockup` | `docs/design/visual-audit/mockups/skill-player-motivation-layer-v1.png` | Player layout with motivation rail and result receipt | Player task area stays dominant |
| `market-inventory-mockup` | `docs/design/visual-audit/mockups/market-inventory-v1.png` | Shop and inventory ownership state | Wallet, affordability, pending state, owned items are clear |
| `result-receipt-mockup` | `docs/design/visual-audit/mockups/result-receipt-v1.png` | Shared result loop with earned/receipt reward states | Next CTA and reward state are clearly separated |

### World / Location Props

| Asset id | Runtime target | Prompt purpose | Development role |
| --- | --- | --- | --- |
| `village-square-mission-board-plate` | `/mascot-3d/world/optimized/v2/fuxie-world-village-square-mission-board-512.webp` | Dashboard mission board plate | P0 hero/location anchor |
| `course-signpost-path-plate` | `/mascot-3d/world/optimized/v2/fuxie-world-course-signpost-path-512.webp` | Course path location plate | P0 course path anchor |
| `vocabulary-collection-book-table-plate` | `/mascot-3d/world/optimized/v2/fuxie-world-collection-book-table-512.webp` | Vocabulary collection table | P0 collection identity |
| `reading-library-desk-plate` | `/mascot-3d/world/optimized/v2/fuxie-world-reading-library-desk-512.webp` | Reading library desk | P0 skill location |
| `listening-radio-booth-console-plate` | `/mascot-3d/world/optimized/v2/fuxie-world-radio-booth-console-512.webp` | Listening radio console | P0 audio location |
| `speaking-stage-cafe-corner-plate` | `/mascot-3d/world/optimized/v2/fuxie-world-speaking-stage-cafe-512.webp` | Speaking stage/cafe | P0 speaking location |
| `writing-post-office-counter-plate` | `/mascot-3d/world/optimized/v2/fuxie-world-post-office-counter-512.webp` | Writing post office counter | P0 writing location |
| `market-backpack-stall-plate` | `/mascot-3d/world/optimized/v2/fuxie-world-market-backpack-stall-512.webp` | Market and backpack stall | P0 shop location |

### Mascot / State Poses

Existing mascot assets cover the v1 reference language. The v2 generation pack adds learning-moment poses that make Fuxie feel like part of the village workflow.

| Pose | Runtime target | Purpose |
| --- | --- | --- |
| Quest planner | `/mascot-3d/states/v2/fuxie-state-quest-planner-512.webp` | Dashboard and Course planning |
| Gentle correction | `/mascot-3d/states/v2/fuxie-state-gentle-correction-512.webp` | Wrong/try-again feedback |
| Listening focus | `/mascot-3d/states/v2/fuxie-state-listening-focus-512.webp` | Listening player focus |
| Speaking record | `/mascot-3d/states/v2/fuxie-state-speaking-record-512.webp` | Speaking recording state |
| Writing delivery | `/mascot-3d/states/v2/fuxie-state-writing-delivery-512.webp` | Writing submitted feedback |
| Shop approval | `/mascot-3d/states/v2/fuxie-state-shop-approval-512.webp` | Reward request approval |
| Result celebration | `/mascot-3d/states/v2/fuxie-state-result-celebration-512.webp` | Real earned result moments |
| Calm empty state | `/mascot-3d/states/v2/fuxie-state-calm-empty-512.webp` | Empty/error states without pressure |

### UI Frames / Decorative Panels

These are implementation primitives, not mascot replacements.

| Frame | Surfaces | Rule |
| --- | --- | --- |
| Notice board frame | Dashboard, Campaign | Use for mission status only, never for generic stats |
| Collection card frame | Vocabulary | Use for word/card ownership and theme progress |
| Letter receipt frame | Writing, Result loop | Use for submitted writing/result receipts |
| Audio broadcast panel | Listening | Use around audio prompt/player controls only |
| Market shelf frame | Shop, Inventory | Use for owned/pending reward items |

## Batch 4: Integration Spec

### Component Mapping

Use existing shared components first:

| Need | Existing component / map | Rule |
| --- | --- | --- |
| Mascot coach panel | `FuxieCoach` | One coach job per surface: guide, feedback, reward, locked, or state |
| Role mascot | `FuxieRoleMascot` | Fixed size; transform-only motion; never resize layout |
| Rich mascot moment | `FuxieMascot3D` | Use sparingly on lesson intro or high-value moments |
| Reward preview | `RewardPreview` | Show XP/Fucoin/streak/unlock before the action when possible |
| Reward reveal | `RewardRevealMoment` | Use earned mode only for fresh rewards; receipt mode for capped/repeated rewards |
| Quest hero | `QuestProgressHero` | Exam and Review only unless a route has comparable progression complexity |
| Skill rail | `SkillMotivationRail` | Reading, Listening, Writing, Speaking players |
| Reward art | `REWARD_ASSETS`, `getShopItemAssetSrc`, `getCefrBadgeAssetSrc` | No duplicated item mapping in route components |
| World props | `FUXIE_WORLD_PROPS` | Props support route identity; they do not replace navigation labels |

Add a new reusable village frame component only after at least three P0 surfaces need the same frame anatomy. Until then, keep surface-specific integration small.

### Surface-to-Asset Mapping

| Surface | Mascot | World prop | Reward art | Motion |
| --- | --- | --- | --- | --- |
| Dashboard | `dailyMission`, `dashboardGuide`, `shopkeeper`, `streakFreezeSaved` | `villageSquare`, `missionBoard` | Fucoin, XP Star, Streak Freeze, CEFR Badge | `coach`, `reward`, `idle` |
| Course | `courseGuide` | `courseSignpost` | CEFR Badge, XP Star | `coach` |
| Vocabulary | `vocabularyCoach` | `collectionBook`, `phraseStamp`, `postcardFragment` | XP Star, Fucoin, Badge | `coach`, `reward` |
| Grammar | `grammarCoach` | `grammarScroll` | Hint Ticket, XP Star | `coach` |
| Reading | `librarian` | `library` | XP Star, Fucoin | `coach` |
| Listening | `radioHost` | `radioBooth` | XP Star, Fucoin | `coach`, optional live idle |
| Speaking | `speakingCoach` | `speakingStage`, `chatCafe` | XP Star, Fucoin | `speak`, `reward` |
| Writing | `postOffice` | `postOffice` | XP Star, Fucoin, Letter receipt frame | `coach`, `reward` |
| Exam | `examGuide` | `townHallExam` | Badge, XP Star | `coach` |
| Review | `reviewGuide`, `streakFreezeSaved` | `reviewGarden` | Streak Freeze, XP Star | `idle` |
| Shop | `shopkeeper` | `marketStall`, `badgeShelf` | Shop item art, Fucoin, Inventory prop | `coach`, `reward` |
| Chat | `chatTutor` | `chatCafe` | Hint Ticket | `speak` only during active voice states |
| Badges | `badgeEarned` | `badgeShelf` | CEFR badges, Badge art | `reward` |
| Campaign | `mission`, `rankUp` | `villageSquare`, `missionBoard` | XP Star, Badge, Fucoin | `coach`, `reward` |

## Prompt Pack

Use this shared constraint block for every AI-generated mockup or asset:

```text
Use case: stylized-concept
Asset type: Fuxie German Village learner UI or game asset
Scene/backdrop: original cozy German-learning village world, not based on any existing game IP
Style/medium: polished 3D clay-like mobile game asset mixed with clean education app UI, soft matte forms, crisp readable shapes
Color palette: Fuxie Bright Sky with sky blue #60A8E4, deep blue #3C78A8, teal #2EC4B6, soft sky #F3FBFF, amber #FFB703 only for rewards
Constraints: study-first hierarchy, clear CTA, no watermark, no copied game UI, no external-game characters, no leaf motif, no beige/brown dominance, no dark fantasy
Avoid: Animal Crossing/Nintendo-like design language, clutter, tiny unreadable text, mascot or props that compete with the learning task
```

### Six Mockup Prompts

```text
Primary request: Create a high-fidelity mobile-first UI mockup for Fuxie Dashboard as Village Square. Show one primary daily mission notice board, next quest CTA, XP level, Fucoin wallet, Streak Freeze safety item, and a small village snapshot. The learning hierarchy must read as mission -> action -> reward -> next unlock within 3 seconds.
```

```text
Primary request: Create a high-fidelity Course Path mockup for Fuxie German Village. Show CEFR milestone nodes with badge art, a course signpost, locked/unlocked/current states, and a clear continue CTA. Keep it as a compact path, not a full map.
```

```text
Primary request: Create a high-fidelity Vocabulary Collection Book mockup. Show themed word collections, collectible cards, phrase stamps, postcard fragments, progress by CEFR level, and a strong practice CTA. Art supports recall and ownership without hiding the study action.
```

```text
Primary request: Create a high-fidelity Skill Player Motivation Layer for reading/listening/writing/speaking lessons. Show the main exercise area, a compact Fuxie coach, progress checkpoints, reward preview, and result receipt. The exercise content remains dominant.
```

```text
Primary request: Create a high-fidelity Fuxie Market and Inventory mockup. Show Fucoin balance, shop item cards, affordability, pending request state, owned items, and a backpack or shelf area. Keep operational states clear and learner-safe.
```

```text
Primary request: Create a high-fidelity Result Receipt mockup for the shared Fuxie reward loop. Show earned versus receipt reward states, XP, Fucoin, badge progress, a restrained Fuxie celebration, and one clear next CTA.
```

## QA And Acceptance

### Screenshot Pass

Capture desktop and mobile screenshots for:

- P0: Dashboard, Course, Vocabulary hub/practice, Reading player, Listening player, Speaking hub/player, Writing player, Shop.
- P1: Grammar, Exam, Review.
- P2: Chat, Badges, Campaign.

Use this naming convention:

```text
docs/design/visual-audit/screenshots/<surface>-village-v1-desktop.png
docs/design/visual-audit/screenshots/<surface>-village-v1-mobile.png
```

Supplemental skill-player screenshots use:

```text
docs/design/visual-audit/screenshots/<skill>-player-village-v1-desktop.png
docs/design/visual-audit/screenshots/<skill>-player-village-v1-mobile.png
```

### Visual QA

- Primary action is obvious within 3 seconds.
- Each mascot or prop has a job: guide, reward, feedback, explain, locked, empty, or error.
- Game layer supports study and never competes with dense content.
- Mobile first viewport has no text overlap and no layout shift from mascot images.
- Reward moments distinguish earned, receipt, and pending states.
- Amber remains reward-only; sky/teal remain the brand foundation.
- Reduced motion disables mascot/reward movement safely.
- New production assets have transparent alpha where needed, 512px runtime WebP, clean small-size readability, and predictable filenames.

### Commands

After implementation touches app UI or asset maps, run:

```text
pnpm exec tsx scripts/learner-ui-visual-audit.ts
pnpm qa:text-visual
pnpm check:quick
```

If the implementation only adds design docs and SVG boards, `pnpm qa:text-visual` and `pnpm check:quick` are still useful smoke checks but browser screenshot QA should be treated as a follow-up for the code/UI batch.
