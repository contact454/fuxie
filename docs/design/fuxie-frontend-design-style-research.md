# Fuxie Frontend Design Style Research

Date: 2026-05-17

Vai chinh: Product Designer / UX/UI Designer
Vai phoi hop: Design System Designer, Frontend Engineer, Gamification Designer

## Executive Direction

Fuxie should move from a card-heavy learning dashboard to a **Learning World UI**:

- The first impression is a living German-learning village/world, not a list of cards.
- The learning task remains dominant: read, listen, speak, write, review.
- World art explains progress, place, reward, and identity.
- UI controls are compact, tactile, and game-like only where they improve action clarity.
- Mobile must feel like a polished handheld learning game, not a compressed desktop dashboard.

Reference repo reviewed:

- `boona13/mykonos-island-voxels`
- GitHub: https://github.com/boona13/mykonos-island-voxels
- Demo: https://mykonos-island-voxels.netlify.app

The reference is useful because it creates immediate wow through a coherent world: isometric grid, handcrafted asset palette, soft shadows, tactile tools, and a canvas-first composition. Fuxie should borrow the principles, not the Greek island theme.

## What Mykonos Gets Right

1. **World First, UI Second**
   - The world/canvas is the main character.
   - Toolbars and palettes sit around the world, not over-explaining it.
   - Fuxie translation: dashboard/course should feel like a real learning village map, while skill screens use smaller "scene panels" so study remains first.

2. **Strong Art Direction**
   - Whitewashed buildings, cobalt accents, bougainvillea, warm cream background, soft shadows.
   - Everything belongs to the same visual universe.
   - Fuxie translation: pick one strong visual grammar, such as "Fuxie German Learning Village": timber-framed study houses, signposts, exam town hall, radio booth, post office, library, market, review garden.

3. **Tactile Interaction**
   - Place/fill/erase/pan tools are physical and obvious.
   - Small elastic placement animations create joy without requiring a tutorial.
   - Fuxie translation: answer selection, audio play, record, submit, reward reveal, and course node unlock need tactile micro-interactions.

4. **Palette Discipline**
   - Limited colors: cream/paper, cobalt, sea, terrain, bougainvillea.
   - Fuxie should stop using many unrelated pastel cards and standardize: sky/teal foundation, ink, reward amber, success green, danger red, and one warm paper surface.

5. **Performance-Minded Visuals**
   - The repo uses layered canvas caching and high-DPI prerendering.
   - Fuxie translation: large world plates should be static optimized assets; only small UI state changes should animate.

## Recommended Style System for Fuxie

### Primary Style: Fuxie Learning World UI

Use this as the main design direction.

Visual ingredients:

- Isometric or pseudo-isometric location plates for each learning area.
- Compact world map on Dashboard/Course.
- Skill-specific scene headers: Library, Radio Booth, Speaking Stage, Post Office.
- Tactile controls with depth: press, snap, reveal, unlock.
- Reward objects as physical inventory items, not generic badges floating in cards.

Best surfaces:

- Dashboard: mission board in village square.
- Course: learning path as a village trail.
- Vocabulary: collection book/table.
- Listening: radio booth console.
- Speaking: stage/cafe.
- Writing: post office desk and receipt.
- Shop: market shelf and backpack.

Rules:

- Use full world treatment on Dashboard/Course only.
- Use compact scene treatment in skill players.
- Never put the exercise inside a decorative world card.
- The world explains "where am I and why next?", not "look how pretty this is."

### Secondary Style: Editorial Learning Cards

Use for dense academic content.

Best surfaces:

- Grammar.
- Exam.
- Reading long text.
- Writing feedback.

Rules:

- Clean white/paper panels.
- Strong type hierarchy.
- Minimal props.
- World identity appears as a small location marker or side illustration only.

### Supporting Style: Game HUD

Use for progression and reward, not for all content.

Elements:

- XP/Fucoin/streak wallet.
- Mission progress rail.
- Node status.
- Reward receipt.
- Item state badges.

Rules:

- HUD must be compact and predictable.
- Avoid multiple CTAs in one state.
- Reward amber appears only inside reward objects or reward receipts.

## Design Course for Kiro

### Module 1: Art Direction and World Grammar

Goal:

- Define the single Fuxie visual universe.

Exercises:

- Create a one-page moodboard: German village, cozy school, learning tools, Fuxie mascot, reward inventory.
- Define forbidden references: copied game IP, generic fantasy, dark RPG, combat/hunting metaphors.
- Define core scene vocabulary: village square, path, library, radio booth, stage, post office, market, review garden.

Deliverables:

- `Fuxie Learning World` art board.
- Color/token sheet.
- Surface-to-location map.

Acceptance:

- A screenshot is recognizable as Fuxie without reading nav text.

### Module 2: Spatial UI and Isometric Composition

Goal:

- Use depth and world visuals without hurting readability.

Exercises:

- Redesign Dashboard as one first-viewport composition: mission board, next CTA, reward preview, world snapshot.
- Redesign Course as responsive path: desktop is horizontal/isometric, mobile is vertical/stepped.
- Create one `SceneHeader` component rule for skill players.

Deliverables:

- Dashboard mockup.
- Course path mockup.
- Skill scene header spec.

Acceptance:

- On mobile, CTA and current learning task are visible without scrolling.

### Module 3: Tactile Controls and Motion

Goal:

- Make interactions feel premium without distracting.

Exercises:

- Define motion for: answer select, audio play, mic record, submit, reward reveal, unlock.
- Keep motion functional: communicates state, progress, or cause/effect.
- Add reduced-motion equivalents.

Deliverables:

- Motion tokens: duration, easing, distance, opacity rules.
- Interaction storyboard for each skill.

Acceptance:

- Every animation answers: "what changed, why, and what should I do next?"

### Module 4: Skill Player Redesign

Goal:

- Make learning content dominate each player.

Exercises:

- Reading: put text/question above reward rail.
- Listening: audio controls and answer choices in first viewport.
- Speaking: mic state is central; feedback is trustworthy.
- Writing: prompt and textarea appear in first viewport.

Deliverables:

- Four mobile-first player layouts.
- One shared `SkillPlayerShell` spec.

Acceptance:

- The learner's task is visible in 3 seconds.
- No bottom nav overlaps controls.

### Module 5: Reward Economy UI

Goal:

- Make XP/Fucoin/shop feel delightful and trustworthy.

Exercises:

- Redesign reward receipt.
- Redesign shop item states: affordable, unaffordable, owned, pending, locked.
- Redesign inventory/backpack as a physical collection.

Deliverables:

- `RewardReceipt` component spec.
- `ShopItemCard` state matrix.
- Inventory shelf mockup.

Acceptance:

- A learner can tell why a reward is or is not claimable within 3 seconds.

### Module 6: Implementation Handoff

Goal:

- Turn visuals into reusable frontend rules.

Deliverables:

- Token map.
- Component map.
- Surface migration order.
- Visual QA checklist.

Implementation order:

1. Shared tokens and scene surfaces.
2. Dashboard/Course as flagship wow pass.
3. Skill player shell.
4. Shop/reward receipt.
5. Grammar/Exam restraint pass.

## Concrete Redesign Recommendations

### Dashboard

Current problem:

- It has the right pieces, but it still reads as stacked cards.

Direction:

- Replace stacked hero/card composition with a single "Village Mission Board" first viewport.
- Put next action as a physical button on the board.
- Keep XP/Fucoin/streak as HUD chips.

### Course

Current strength:

- Desktop path is already close to the desired direction.

Fix:

- Mobile should not use a clipped horizontal path.
- Use a vertical checkpoint trail with current node, next node, locked gate, boss exam.

### Skill Players

Current problem:

- Reward/briefing layer often appears before the exercise.

Fix:

- Top: compact scene header.
- Middle: actual task.
- Bottom: one sticky CTA or answer/submit control.
- Reward preview becomes a small side/inline receipt.

### Writing

Highest priority fix:

- The prompt and textarea must move above reward panels.
- Tone must become academic and encouraging, not combat-like.

### Listening

Fix:

- Audio control, play count, answer options, and submit must be visible before reward blocks.
- Replace hunting metaphors with signal/listening metaphors.

### Shop

Fix:

- Make item states explicit.
- Disabled buttons should explain why.
- Use real inventory/backpack feeling, not pale generic cards.

## Style Options Considered

### Option A: Pure SaaS EdTech

Pros:

- Fast, clean, credible.

Cons:

- Not wow enough.
- Fuxie mascot and reward economy feel decorative.

Verdict:

- Use only for admin/teacher, not learner flagship.

### Option B: Duolingo-like Bright Mobile Game

Pros:

- Familiar, highly motivational.

Cons:

- Easy to look derivative.
- Can feel childish for Goethe/Telc preparation.

Verdict:

- Borrow clarity of progression, not the exact visual language.

### Option C: Cozy Isometric Learning World

Pros:

- Distinct, memorable, fits Fuxie village assets.
- Supports course map, rewards, locations, and mascot.

Cons:

- Needs strict rules so it does not bury content.

Verdict:

- Recommended.

### Option D: 3D Mascot-First UI

Pros:

- Strong brand.

Cons:

- Mascot can compete with tasks.
- Performance and layout risks.

Verdict:

- Use as accent, not primary layout.

## Immediate Backlog for Kiro

1. Create `SceneHeader` component for skill players.
2. Create `WorldMissionBoard` for Dashboard.
3. Create mobile `CourseCheckpointTrail`.
4. Create `RewardReceipt` with earned/receipt/pending modes.
5. Refactor Writing player so prompt/textarea are first-viewport.
6. Refactor Listening active state so audio/options/submit are first-viewport.
7. Clean learner copy tone: no combat/hunting metaphors.
8. Add bottom safe-area padding to all learner shells.
9. Fix missing manifest asset refs.
10. Add image priority/valid fill-parent positioning for above-fold world plates.

## Sources

- Mykonos repo: https://github.com/boona13/mykonos-island-voxels
- Mykonos demo: https://mykonos-island-voxels.netlify.app
- Apple HIG spatial layout: https://developer.apple.com/design/human-interface-guidelines/spatial-layout/
- Material motion: https://m1.material.io/motion/material-motion.html
- Material duration/easing: https://m1.material.io/motion/duration-easing.html
- Fuxie QA report: `tmp/browser-qa/kiro-learning-ui-2026-05-17/fuxie-learning-ui-browser-qa-report.md`
