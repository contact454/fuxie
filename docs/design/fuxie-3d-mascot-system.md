# Fuxie 3D Mascot System v1

## Summary

Fuxie 3D becomes the new canonical mascot direction for Fuxie German Village. The goal is to make Fuxie feel like a real learning-game companion while preserving the current brand: bright sky-blue identity, friendly coach personality, and clean education-first UX.

Batch 44 creates the visual system and concept pose packs only. Production UI replacement should happen in the next batch after creating single-pose app-ready PNG/WebP assets.

## Canonical 3D Fuxie

### Character Rules

- **Species/personality**: friendly fox-like learning coach.
- **Core color**: bright sky blue fur.
- **Accent color**: teal hoodie/accessories.
- **Face/chest**: soft white, high contrast for small UI use.
- **Eyes**: large, warm, expressive, supportive.
- **Shape language**: rounded 3D clay-like, mobile-game friendly, not realistic fur.
- **Tone**: cute but not childish; credible for A1-B1 learners and exam prep.
- **Brand anchor**: Fuxie icon mark can appear on scarf/hoodie/badge.

### Avoid

- Orange fox dominance that moves away from Fuxie Bright Sky.
- Realistic fur, sharp features, or animal-photo style.
- Any external-game/IP resemblance, leaf motifs, copied UI/item shapes, or Nintendo-like characters.
- Overdecorated costumes that reduce readability in small cards.

## Generated Concept Assets

These files are project-bound concept sheets copied from Codex image generation output:

| File | Purpose | Production status |
| --- | --- | --- |
| `/mascot-3d/concept/fuxie-3d-master-style-sheet.png` | Canonical proportions, color, face, views | Reference only |
| `/mascot-3d/concept/fuxie-3d-coach-pose-pack.png` | Coach/learning base poses | Reference only |
| `/mascot-3d/concept/fuxie-3d-learning-role-pack.png` | Shopkeeper, librarian, radio, post office, exam guide | Reference only |
| `/mascot-3d/concept/fuxie-3d-reward-state-pack.png` | Fucoin, Streak Freeze, level up, empty, error states | Reference only |

## Pose Taxonomy

### Core Coach

| Pose | Use |
| --- | --- |
| Happy wave | Dashboard greeting, onboarding, empty success state |
| Thinking | AI coach, hint, reflection, weak-skill guidance |
| Studying | Lesson intro, reading/writing setup |
| Celebration | Correct answer, result reward loop, mission completed |
| Gentle correction | Wrong answer, low score, retry encouragement |
| Daily mission pointing | Dashboard mission CTA, next quest |

### Learning Roles

| Role | Route/surface |
| --- | --- |
| Shopkeeper | `/rewards/shop`, inventory, Fucoin economy |
| Librarian | Reading hub/player |
| Radio host | Listening hub/player |
| Post office helper | Writing hub/player |
| Town Hall exam guide | Exam hub/result |

### Reward/State

| Pose | Use |
| --- | --- |
| Fucoin reward | Wallet, result reward, mission claim |
| Streak Freeze saved | Streak safety, result receipt, inventory timeline |
| Level up | XP level bar, dashboard, result loop |
| Empty encouragement | Empty states and fresh-start flows |
| Gentle error | Error boundaries and failed actions |

## App-Ready Asset Pipeline

1. Generate or crop **single-pose assets**, not full sheets, before production use.
2. Use flat chroma-key source or native transparency pipeline for clean PNG/WebP cutouts.
3. Save app-ready output under `/apps/web/public/mascot-3d/<category>/`.
4. Use stable filenames:
   - `fuxie-3d-core-happy-wave.png`
   - `fuxie-3d-core-thinking.png`
   - `fuxie-3d-game-fucoin-reward.png`
   - `fuxie-3d-game-streak-freeze-saved.png`
   - `fuxie-3d-role-shopkeeper.png`
   - `fuxie-3d-role-librarian.png`
   - `fuxie-3d-role-radio-host.png`
   - `fuxie-3d-role-post-office.png`
   - `fuxie-3d-role-exam-guide.png`
5. Optimize final assets for web:
   - PNG with alpha for crisp mascot cutouts.
   - WebP variants for large decorative panels if needed.
   - Keep dimensions predictable: 512px square for most UI poses, 768px for hero poses.

## Production Replacement Map

### P0: First Safe Rollout

- Dashboard hero/mission coach: replace current small 2D mascot with `happy-wave` or `daily-mission-pointing`.
- Shop/Inventory coach: use `shopkeeper` and `fucoin-reward`.
- Streak safety panel: use `streak-freeze-saved`.
- Result reward loop: use `celebration` and `gentle-correction`.

### P1: Skill Roles

- Reading: `librarian`.
- Listening: `radio-host`.
- Writing: `post-office`.
- Exam: `exam-guide`.

### P2: Global States

- Loading: subtle 3D Fuxie idle/static image first; animation later.
- Empty: `empty-encouragement`.
- Error: `gentle-error`.
- Sidebar: keep current compact icons for now; consider mini 3D only after testing visual density.

## Replacement Rules

- Replace high-impact mascot surfaces first, not every tiny icon.
- Do not mix too many pose styles on one screen.
- A 3D Fuxie must have a job: guide, reward, feedback, explain, or state.
- Keep learning CTA stronger than mascot art.
- Keep card layout stable; mascot should not resize containers or push text awkwardly.

## Prompt Library

### Single-Pose Transparent-Ready Prompt Template

```text
Use case: stylized-concept
Asset type: app-ready 3D Fuxie mascot single pose
Primary request: Create one full-body 3D Fuxie mascot in the <pose> pose for a German-learning mobile app.
Scene/backdrop: perfectly flat solid #ff00ff chroma-key background for removal; no floor, no shadow, no gradient.
Subject: bright sky-blue fox-like Fuxie coach with teal hoodie, white face/chest, warm expressive eyes, soft rounded ears, small paws, friendly learning personality.
Style/medium: polished rounded 3D clay-like mobile game mascot, soft matte material, crisp silhouette.
Composition/framing: centered full-body pose, generous padding, no cropped ears/tail/paws.
Lighting/mood: bright soft studio lighting, supportive and cheerful.
Color palette: sky blue #60A8E4, deep blue #3C78A8, teal #2EC4B6, white accents, amber #FFB703 only for reward props.
Text: no text.
Constraints: use the same canonical Fuxie proportions and outfit, no watermark, no external-game/IP resemblance, no Animal Crossing/Nintendo-like elements, do not use #ff00ff in the subject.
Avoid: realistic fur, orange fox dominance, beige/brown dominance, leaf motifs, clutter, copied mascot IP.
```

### Hero Pose Prompt

```text
Create one full-body 3D Fuxie mascot waving happily and pointing toward a daily mission CTA. Fuxie is a bright sky-blue fox-like coach with teal hoodie, white face/chest, warm eyes, soft rounded ears, and friendly learning-game personality. Use a polished rounded 3D clay-like style, soft matte material, crisp silhouette. Put the subject on a flat #ff00ff chroma-key background with no shadow, no text, no watermark, no external-game/IP resemblance, and no #ff00ff in the character.
```

### Streak Freeze Saved Prompt

```text
Create one full-body 3D Fuxie mascot holding a glowing teal-blue Streak Freeze shield charm, looking relieved and encouraging. Fuxie is a bright sky-blue fox-like German-learning coach with teal hoodie and white face/chest. Rounded 3D clay-like mobile game style, soft matte material, crisp silhouette. Flat #ff00ff chroma-key background, no floor, no shadow, no text, no watermark, no external-game/IP resemblance, no #ff00ff in the subject.
```

## QA Checklist

- Reads clearly at small UI sizes.
- Keeps Fuxie blue/teal brand identity.
- Looks original and not tied to external game IP.
- Pose emotion matches its UI state.
- Transparent cutout has no color fringe.
- Does not increase layout clutter.
- Does not weaken primary learning CTA.

## Batch 45: Single-Pose Production Pack v1

### Goal

Batch 45 moves the 3D Fuxie direction from concept sheets into a first production-safe asset pack. The focus is single-pose PNG cutouts with transparent backgrounds, then a limited rollout to high-impact mascot surfaces.

### Prompt Engineer

```text
Create individual full-body 3D Fuxie mascot poses for production UI use. Each image must use the canonical Fuxie Bright Sky identity: sky-blue character, teal hoodie/accessories, white face/chest, rounded clay-like mobile game style, cheerful coach personality, and amber only for reward props.
Use one clear pose per image on a flat #ff00ff chroma-key background with no floor, shadow, text, watermark, copied external-game/IP elements, or #ff00ff inside the character.
Acceptance: each output can be chroma-keyed into a clean transparent PNG and remains readable inside small dashboard/result/shop cards.
```

### App-Ready Assets

| File | UI role | Status |
| --- | --- | --- |
| `/mascot-3d/core/fuxie-3d-core-happy-wave.png` | greeting, empty state, fallback coach | App-ready PNG alpha |
| `/mascot-3d/core/fuxie-3d-core-daily-mission.png` | dashboard mission coach | App-ready PNG alpha |
| `/mascot-3d/core/fuxie-3d-game-fucoin-reward.png` | Fucoin/reward coach | App-ready PNG alpha |
| `/mascot-3d/core/fuxie-3d-game-streak-freeze-saved.png` | streak safety receipt/coach | App-ready PNG alpha |
| `/mascot-3d/core/fuxie-3d-role-shopkeeper.png` | shop/Fucoin catalog coach | App-ready PNG alpha |
| `/mascot-3d/core/fuxie-3d-core-celebration.png` | successful result loop, mission win | App-ready PNG alpha |

Raw chroma-key sources are retained under `/mascot-3d/raw/` so future cleanup or resizing can be repeated without regenerating the art.

### Rollout Map Applied

- `FuxieCoach` now accepts an optional `mascotSrc` override.
- Default `FuxieCoach` roles use 3D Fuxie assets:
  - `coach` -> daily mission,
  - `feedback` -> happy wave,
  - `reward` -> Fucoin reward,
  - `locked` -> happy wave.
- Dashboard first-viewport greeting uses happy wave.
- Dashboard Mission Control shop coach uses shopkeeper.
- Dashboard Streak Freeze safety coach uses streak-freeze-saved when a freeze is available or recently used.
- Dashboard Today Plan compact mascot uses daily mission.
- Result reward loop uses celebration for successful graded results and happy wave for retry/feedback.
- Quest progress hero uses celebration for exam and streak-freeze-saved for review.

### QA Notes

- Generated assets are 1024x1536 PNGs.
- Alpha validation passed: all four corners are fully transparent after chroma-key removal.
- The transparent background may appear black in some local viewers; this is a viewer background, not baked pixels.
- Next optimization batch should create 512px/WebP derivatives for web weight before broad rollout.

## Batch 46: 3D Fuxie Asset Optimization v1

### Goal

Batch 46 makes the 3D mascot pack lighter before broader rollout. The 1024x1536 PNG cutouts remain the master app assets, while UI surfaces use 512x512 WebP derivatives for faster delivery and lower processing cost.

### Prompt Engineer

```text
Feature: optimize the Batch 45 3D Fuxie production pack for daily app use.
Asset rule: preserve transparent mascot silhouette, readable small-card pose, Fuxie Bright Sky colors, and original 1024px master PNGs.
Performance rule: create 512px square derivatives with transparent padding, save both PNG fallback and WebP delivery assets, and wire production UI to WebP through a central asset map.
Acceptance: dashboard/result mascot paths no longer point directly at heavy master PNGs, optimized assets validate with transparent corners, and QA stays green.
```

### Optimized Asset Outputs

| Master asset | Optimized WebP | WebP size |
| --- | --- | --- |
| `fuxie-3d-core-happy-wave.png` | `/mascot-3d/optimized/fuxie-3d-core-happy-wave-512.webp` | 28.0 KB |
| `fuxie-3d-core-daily-mission.png` | `/mascot-3d/optimized/fuxie-3d-core-daily-mission-512.webp` | 25.2 KB |
| `fuxie-3d-game-fucoin-reward.png` | `/mascot-3d/optimized/fuxie-3d-game-fucoin-reward-512.webp` | 27.5 KB |
| `fuxie-3d-game-streak-freeze-saved.png` | `/mascot-3d/optimized/fuxie-3d-game-streak-freeze-saved-512.webp` | 30.7 KB |
| `fuxie-3d-role-shopkeeper.png` | `/mascot-3d/optimized/fuxie-3d-role-shopkeeper-512.webp` | 29.3 KB |
| `fuxie-3d-core-celebration.png` | `/mascot-3d/optimized/fuxie-3d-core-celebration-512.webp` | 31.3 KB |

PNG fallback derivatives are also saved in the same folder with `-512.png` suffix. The WebP delivery files reduce mascot source weight by roughly 97% compared with the 0.9-1.2 MB master PNGs.

### Code Rollout

- Added `FUXIE_3D_ASSETS` as the central optimized asset map in `quest-visuals.tsx`.
- `FuxieCoach`, `QuestProgressHero`, Dashboard mascot surfaces, and `ResultRewardLoop` now use the centralized WebP paths.
- Direct production references to `/mascot-3d/core/` were removed from app TS/TSX code.

### QA Notes

- Optimized outputs are 512x512 with transparent padding.
- WebP alpha is preserved for mascot cutouts.
- Original raw and master PNG assets remain in project for future regeneration and quality review.

## Batch 47: Skill Role Pack v1

### Goal

Batch 47 expands 3D Fuxie from generic coach/reward poses into clear learning roles. Each core skill now has a mascot identity that matches the Fuxie German Village metaphor while staying learning-first.

### Prompt Engineer

```text
Create single-pose app-ready 3D Fuxie role mascots for Reading, Listening, Writing, and Exam surfaces.
Keep the canonical Fuxie Bright Sky character: sky-blue fox-like coach, teal hoodie/accessories, white face/chest, warm eyes, rounded clay-like mobile-game style, and crisp silhouette.
Use flat #ff00ff chroma-key background for local transparency removal. No floor, no shadow, no text, no watermark, no external-game/IP resemblance.
Each prop should explain the learning role at a glance: book for Reading, headphones/mic for Listening, postcard/pencil for Writing, checklist/trophy badge for Exam.
```

### Role Assets

| Role | Master PNG | Runtime WebP | Use |
| --- | --- | --- | --- |
| Reading librarian | `/mascot-3d/core/fuxie-3d-role-librarian.png` | `/mascot-3d/optimized/fuxie-3d-role-librarian-512.webp` | Reading hub, Reading intro, reading result feedback |
| Listening radio host | `/mascot-3d/core/fuxie-3d-role-radio-host.png` | `/mascot-3d/optimized/fuxie-3d-role-radio-host-512.webp` | Listening hub, Listening lesson intro, listening result feedback |
| Writing post office helper | `/mascot-3d/core/fuxie-3d-role-post-office.png` | `/mascot-3d/optimized/fuxie-3d-role-post-office-512.webp` | Writing hub, writing feedback |
| Exam guide | `/mascot-3d/core/fuxie-3d-role-exam-guide.png` | `/mascot-3d/optimized/fuxie-3d-role-exam-guide-512.webp` | Exam hub, exam empty state, exam result pass state |

### Code Rollout

- Added role assets to `FUXIE_3D_ASSETS`.
- `ResultRewardLoop` now uses skill-specific Fuxie mascots for feedback states:
  - Listening -> radio host,
  - Reading -> librarian,
  - Writing -> post office,
  - Exam -> exam guide.
- `QuestProgressHero` accepts `mascotSrc` for role-specific hero overrides.
- Reading, Listening, and Writing hubs now use role mascots in the hero area.
- Reading and Listening lesson intro screens now use the role mascot.
- Writing feedback uses the post office helper.
- Exam hub, exam empty state, and exam result pass indicator use the exam guide.

### QA Notes

- All role assets have 512x512 WebP runtime versions around 27-30 KB.
- Raw generated sources are retained under `/mascot-3d/raw/`.
- Role rollout intentionally avoids global sidebar icons for now; tiny nav icons stay compact to protect scan density.

## Batch 48: Speaking Role + Mascot Motion Layer v1

### Goal

Batch 48 completes the first core-skill role set by adding a Speaking coach, then introduces a restrained mascot motion system. Motion should make Fuxie feel alive without shifting layout, distracting from study tasks, or harming accessibility.

### Prompt Engineer

```text
Create one app-ready 3D Fuxie mascot for Speaking practice.
Fuxie should be the canonical bright sky-blue fox-like coach with teal hoodie, white face/chest, warm eyes, rounded clay-like style, and a friendly pronunciation-coach pose.
Use a small microphone and blank speech bubble prop so the role reads as speaking at small UI sizes.
Generate on flat #ff00ff chroma-key background for local transparency removal. No text, no watermark, no copied external-game/IP elements.
```

### Speaking Asset

| Role | Master PNG | Runtime WebP | Use |
| --- | --- | --- | --- |
| Speaking coach | `/mascot-3d/core/fuxie-3d-role-speaking-coach.png` | `/mascot-3d/optimized/fuxie-3d-role-speaking-coach-512.webp` | Speaking hub, speaking lesson intro, speaking result feedback |

### Motion Rules

- `idle`: slow float for neutral mascot moments.
- `coach`: gentle nudge for guidance surfaces.
- `reward`: small bounce for success/reward states.
- `speak`: subtle talking-energy pulse for speaking practice.
- `none`: available for dense or static surfaces.
- `prefers-reduced-motion: reduce` disables all mascot motion.

### Code Rollout

- Added `speakingCoach` to `FUXIE_3D_ASSETS`.
- Added `FuxieRoleMascot` as the shared wrapper for role images and motion.
- Added shared mascot motion CSS classes in `globals.css`.
- `FuxieCoach` and `QuestProgressHero` now animate through the shared motion classes.
- Reading, Listening, Writing role surfaces use `FuxieRoleMascot` instead of raw `Image` usage.
- Speaking hub, Speaking lesson intro, Speaking summary, and Nachsprechen result now use the 3D Speaking coach.
- `ResultRewardLoop` now supports `speaking` as a future skill type.

### QA Notes

- Runtime Speaking WebP is about 30 KB.
- Transparent alpha corners validate cleanly.
- Motion is transform-only and does not affect layout dimensions.

## Batch 49: Reward Claim Micro-interactions v1

### Goal

Batch 49 makes mission reward claiming feel like a real game moment without changing the economy engine. The learner should immediately understand that a mission reward was received, what was received, and which mission card changed state.

### Interaction Rules

- Keep all Fucoin, XP, mission, ledger, and API behavior unchanged.
- Use the existing Fucoin reward Fuxie asset for the success panel.
- Keep motion short, transform-only, and non-blocking.
- Disable the reward panel, card pop, gift pulse, and coin burst under `prefers-reduced-motion: reduce`.
- Amber remains reward-only; teal/sky stays the default Fuxie brand foundation.

### Code Rollout

- Dashboard Mission Control now stores a typed claim celebration object instead of only a success text string.
- Successful mission claims render a reward panel with:
  - 3D Fucoin Fuxie mascot,
  - mission title,
  - Fucoin chip,
  - XP chip.
- The just-claimed card receives a short pop animation and deterministic coin burst.
- Claimable gift icons use a subtle pulse to make available rewards easier to notice.
- The claim button shows a spinner and clearer loading text while the existing claim request is pending.

### QA Notes

- No new image generation was needed; this batch reused the optimized Fucoin reward asset.
- No database, schema, ledger, scoring, XP, streak, or mission API changes.
- Motion is purely CSS and layout dimensions remain fixed.

## Batch 50: Shop Request Micro-interactions v1

### Goal

Batch 50 extends the same game-feel into Fuxie Market. Requesting a shop item should feel like placing an item into a reward queue, not merely submitting a form.

### Interaction Rules

- Keep shop API, redeem request state machine, Fucoin spend rules, fulfillment, wallet, and inventory logic unchanged.
- Reuse the optimized `shopkeeper` mascot for successful request moments.
- Use amber only for afford/request reward states; use sky/teal for guidance and brand surfaces.
- Keep all motion CSS-only, transform/light shadow based, and disabled under `prefers-reduced-motion: reduce`.

### Code Rollout

- Added a learner-facing shop request celebration panel after a successful request is created or reused.
- The panel uses the 3D Fuxie shopkeeper, item title, cost, and request status.
- Shop item cards now highlight afford-ready items with a restrained glow.
- Recently requested item cards receive a short pop and deterministic coin burst.
- Pending request mini cards pulse subtly so the queue feels alive.
- Redeem preview modal and success feedback now enter with a short polished transition.

### Asset Plan

No new image generation was used in Batch 50. The next image batch should generate app-ready item art for:

- Fucoin icon,
- Streak Freeze charm,
- Hint Ticket,
- Unlock Key,
- XP Star,
- Fuxie Sky Outfit,
- German postcard collectible,
- small Fuxie Market shelf/backpack props.

## Batch 56: Living Fuxie Blender Prototype v1

### Goal

Batch 56 starts turning Fuxie from a static 3D image into a living game mascot. The first production-safe target is a Blender-authored prototype that can run in the web app without adding a heavy runtime dependency.

### Prompt Engineer

```text
Create a living Fuxie 3D mascot prototype for a German-learning game app.
Fuxie should feel alive through a small idle/wave loop: soft body bob, hand wave, tail sway, and friendly coach energy.
Use Fuxie Bright Sky colors: sky blue fur, teal hoodie, soft white face/chest, amber Fucoin accent.
Export both a future-ready GLB and lightweight app-ready sprite frames so the web app can animate Fuxie without adding Three.js yet.
Keep the first rollout scoped to one learning screen and preserve static fallback/reduced motion behavior.
```

### Backlog Before Code

P0:

- Verify Blender CLI on the machine.
- Add a versioned Blender generation script.
- Generate source `.blend`, future-ready `.glb`, runtime poster PNG, and 4 WebP sprite frames.
- Add a shared `FuxieMascot3D` component.
- Add CSS frame loop with `prefers-reduced-motion` fallback.
- Roll out first to Listening lesson intro.

P1:

- Replace primitive prototype with a refined rig closer to the approved generated Fuxie 3D style.
- Add separate clips for `idle`, `coach`, `reward`, and `tryAgain`.
- Add optional Three.js live runtime after dependency approval.

P2:

- Roll out to Dashboard Mission Hub, Reward Result Loop, Shopkeeper, and Course milestones.
- Add Fucoin particle bursts and outfit/cosmetic hooks.

### Generated Assets

| Asset | Path | Notes |
| --- | --- | --- |
| Blender source | `/assets/fuxie-3d-source/fuxie-living-prototype.blend` | Regenerable source file |
| GLB model | `/apps/web/public/mascot-3d/live/fuxie-living-prototype.glb` | Future live Three.js/model-viewer runtime |
| Poster | `/apps/web/public/mascot-3d/live/fuxie-living-prototype-poster.png` | Static fallback |
| Sprite frames | `/apps/web/public/mascot-3d/live/fuxie-living-prototype-frame-1.webp` through `frame-4.webp` | Lightweight runtime loop |

### Code Rollout

- Added `FUXIE_LIVING_3D_ASSETS`.
- Added `FuxieMascot3D` as a shared component.
- Production mode uses the approved existing Fuxie 3D role assets, then adds a live motion layer: soft float, shadow breathing, and tiny sparkle cues.
- Prototype mode can still loop Blender-rendered sprite frames for future rig testing.
- Added `fuxie-live-asset-*` and `fuxie-live-3d-frame-*` CSS animation classes.
- Reduced motion freezes/removes live animation safely.
- Listening lesson intro now uses the existing Fuxie 3D radio-host asset through `FuxieMascot3D`.

### QA Notes

- No new npm dependency was added in this batch.
- Blender 5.1.1 was verified and used through CLI.
- The GLB is available for the future Three.js phase.
- Runtime sprite frames are small, about 7-8 KB each.
- Important design decision: the Blender primitive rig is not used as the production mascot visual. It is only a pipeline proof. Production rollout should keep using the approved generated Fuxie 3D assets until a refined Blender rig matches that quality.
