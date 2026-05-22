# Generation Prompt — 11-exam

## Visual intent
Exam hall calm-but-serious — accurate, fair, time-aware

## Module identity cues
Timer banner + question paginator, palette crimson + neutral, prop timer/clock xác định module exam

## Positive prompt
```text
Create an original Fuxie German-learning village asset for an educational game UI. Use a polished 3D clay-like mobile game style with soft matte forms, clean silhouettes, and readable shapes at small sizes. The world should feel like a cozy German-learning village with study tools, signs, books, post, radio, market, badges, and learning rewards. Use Fuxie Bright Sky colors: sky blue #60A8E4, deep blue #3C78A8, teal #2EC4B6, soft sky #F3FBFF, and amber #FFB703 only for reward emphasis. Keep the design original, not based on any existing game IP. Avoid clutter, dark fantasy, beige/brown dominance, leaf motifs, unreadable text, and decorative props that compete with the learning task.

Module: 11-exam. Visual intent: Exam hall calm-but-serious — accurate, fair, time-aware. Identity cues: Timer banner + question paginator, palette crimson + neutral, prop timer/clock xác định module exam.

Render three viewports as separate images:
- Mock_Desktop viewport 1440×900 px: Mock test A2 — Q3 of 30, navigation đầy đủ, vùng nội dung chính ≥ 60% chiều rộng viewport, đúng 1 CTA chính enabled, ít nhất 1 dấu hiệu Module_Identity (logo / tên module / icon đặc trưng "timer / clock") trong vùng nhìn đầu.
- Mock_Mobile viewport 390×844 px: cùng flow, header ≤ 64 px, không tràn ngang, body ≥ 14 px / caption ≥ 12 px hiệu dụng, đúng 1 CTA chính enabled.
- Mock_State: error state — hết giờ trước khi nộp, hiện retry/submit options. Module_Identity vẫn nhận diện được. Nếu là error state, phải có thông điệp lỗi đầy đủ + ≥ 1 lối thoát (retry/back/contact).

Compose with Fuxie Bright Sky primary palette as base; use module secondary palette (see Module identity cues) for accent surfaces, chips, and state indicators only. Mascot pose (if visible) is Fuxie sky-blue + teal, friendly, learner-supportive. Layout follows Style_Master spacing/radius/shadow tiers. Reading order is obvious in 3 seconds; CTA chính nổi bật hơn các control khác về kích thước hoặc tương phản.
```

## Negative prompt
```text
photorealism, photorealistic violence, gore, NSFW, copyrighted character likenesses, marketing-y commercial atmosphere, parody campus comedy, cluttered backgrounds, dark fantasy palette, beige/brown dominance, leaf motifs, unreadable text, decorative props that compete with the learning task, pixel-art (unless explicitly part of style intent — not the case here), Mykonos Greek-island visuals, Aegean white-blue palette, Cycladic architecture, white-blue domed buildings, Mediterranean village motifs, Two Point Campus characters, Two Point Campus place names, Two Point Campus themed props, campus parody buildings, mascot caricatures, signature campus visual gags.
```

## Originality guardrails (forbidden IP references)

- **Mykonos asset names**: Greek-island visuals, Aegean palette, Cycladic architecture, white-blue domed buildings, Mediterranean village motifs.
- **Two Point Campus**: characters, place names, themed props (campus parody buildings, mascot caricatures, signature campus visual gags).
- **Any other third-party IP cited in the prompt**: None cited.

(Danh sách này phải đủ chi tiết để Originality_Guardrail trở nên auditable ở mức từng mock — Requirement 12 AC 3.)

## Model / tool / seed (if available)
- External Codex image-generation pipeline; tool/seed assigned at render time. See [docs/design/fuxie-german-village-image-generation-strategy.md](../../fuxie-german-village-image-generation-strategy.md) for the canonical Fuxie Bright Sky prompt block + integration rules.
- Actual render provenance: built-in `image_gen` via Codex imagegen skill / GPT image pipeline. Source renders generated on 2026-05-21, then deterministically cropped/resized to the required PNG dimensions in place.
- Render type: 3D clay-like Fuxie village style; runtime exports 512px WebP for asset use, but Mocktest_Pack uses full-resolution PNG (1440×900 desktop / 390×844 mobile / state sub-state).

## Reviewer + date
- Reviewer: Illustrator / 3D Mascot Artist render pass via Codex built-in `image_gen`; Pack_Owner originality co-review + QA_Owner Visual_Target_Score sign-off complete via Codex QC.
- Date (ISO 8601): 2026-05-21.

(Provenance refresh rule — Requirement 12 AC 6: khi Codex/pipeline render thật, file này phải được cập nhật Reviewer + Date trong **cùng change set** với render output.)
