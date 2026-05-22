# Generation Prompt — 00-style-master

## Visual intent
Style_Master design system tokens reference board — calm, clear, didactic. Friendly Fuxie sky-blue + teal identity, polished 3D clay-like illustration style at small sizes, không marketing-y, không parody.

## Module identity cues
Token reference board với palette swatches có nhãn HEX, typography ladder, spacing ladder, radius ladder, shadow ladder, icon family ≥ 6, mascot Fuxie pose friendly, illustration sample ≥ 2, isometric staging convention sample. Không có nội dung học cụ thể của 17 module downstream.

## Positive prompt
```text
Create an original Fuxie German-learning village asset for an educational game UI. Use a polished 3D clay-like mobile game style with soft matte forms, clean silhouettes, and readable shapes at small sizes. The world should feel like a cozy German-learning village with study tools, signs, books, post, radio, market, badges, and learning rewards. Use Fuxie Bright Sky colors: sky blue #60A8E4, deep blue #3C78A8, teal #2EC4B6, soft sky #F3FBFF, and amber #FFB703 only for reward emphasis. Keep the design original, not based on any existing game IP. Avoid clutter, dark fantasy, beige/brown dominance, leaf motifs, unreadable text, and decorative props that compete with the learning task.

Module: 00-style-master. Visual intent: Style_Master design system tokens reference board — calm, clear, didactic. Friendly Fuxie sky-blue + teal identity, polished 3D clay-like illustration style at small sizes, không marketing-y, không parody.. Identity cues: Token reference board với palette swatches có nhãn HEX, typography ladder, spacing ladder, radius ladder, shadow ladder, icon family ≥ 6, mascot Fuxie pose friendly, illustration sample ≥ 2, isometric staging convention sample. Không có nội dung học cụ thể của 17 module downstream..

Render three viewports as separate images:
- Mock_Desktop viewport 1440×900 px: token reference board hiển thị 10 yếu tố visual (palette chính + phụ, typography ladder, spacing ladder, radius ladder, shadow ladder, icon family, mascot tone, illustration sample, isometric staging convention) với nhãn nhận diện rõ.
- Mock_Mobile viewport 390×844 px: cùng 10 yếu tố ở compact vertical stack, header ≤ 64 px.
- Mock_State: trạng thái "interaction primary" với CTA hover/focus + chip selected + state swatches (success/warning/danger).

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
- Render type: 3D clay-like Fuxie village style; runtime exports 512px WebP for asset use, but Mocktest_Pack uses full-resolution PNG (1440×900 desktop / 390×844 mobile / state sub-state).

## Reviewer + date
- Reviewer (Pack_Owner): Pack_Owner (delegated sign-off via Kiro on 2026-05-17 based on Codex QC report).
- Reviewer (QA_Owner): QA_Owner (delegated sign-off via Kiro on 2026-05-17 — score adopted from Codex QC 2026-05-17, Pack_Owner authorized on 2026-05-17).
- Co-review (Illustrator / 3D Mascot Artist): Originality co-review delegated and confirmed via Codex QC pass-candidate verdict 2026-05-17.
- Date (ISO 8601): 2026-05-17.

(Provenance refresh rule — Requirement 12 AC 6: file này được cập nhật trong cùng change set với formal sign-off; render PNG đã được Codex pipeline ghi đè placeholder ở change set trước; QC report tại [`codex-style-master-visual-qc-2026-05-17.md`](../../../.kiro/specs/fuxie-visual-mocktest-pack/codex-style-master-visual-qc-2026-05-17.md).)
