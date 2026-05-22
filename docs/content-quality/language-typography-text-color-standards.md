# Fuxie Language, Typography & Text Color Standards

Owner: Content QA / Linguistic Reviewer  
Review partners: Vietnamese-German Localization Specialist, Design System Designer, German Content Writer

## Purpose

This guide is the source of truth for learner-facing writing, typography, and text color in Fuxie. It applies to `apps/web`, `apps/web/messages`, `content`, and design/content docs used for release review.

## Voice And Tone

- Default tone: high-energy quest coach, friendly and motivating, but still credible for Goethe/telc exam preparation.
- Vietnamese copy should be natural, short, and action-oriented. Avoid literal translation, mixed pronouns, and filler encouragement that does not help the learner act.
- German copy must be natural, CEFR-fit, and teachable. A1-A2 copy should stay concrete; B1+ copy may be more nuanced but must not become obscure.
- UI copy should make the next action obvious. Empty states must explain the next useful step, and error states must say what the learner can do next.
- Mascot/reward language is allowed for motivation, but it must not cover academic content or make exam workflows feel childish.

## Typography Standard

- UI font: `Inter`, via `--font-sans`.
- German and multi-diacritic learning text fallback: `Noto Sans`, via `--font-german`.
- Use the shared text scale before adding arbitrary sizes: `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`.
- Use `font-semibold` or `font-bold` for emphasis. Reserve `font-black` for short labels, scores, rewards, and hero-like module headers.
- Use `tracking-normal` for sentences and learner content. Use `tracking-wide` only for short uppercase labels, never for Vietnamese/German paragraphs.
- Keep learner text line-height relaxed enough for mobile reading: body and explanation text should be at least `leading-relaxed` or equivalent.

## Text Color Standard

- Prefer semantic text tokens over raw hex values in new UI work:
  - `text-text-primary`: primary headings and important body text.
  - `text-text-secondary`: brand-supporting labels and secondary headings.
  - `text-text-muted`: descriptions, helper text, metadata.
  - `text-text-subtle`: low-priority captions only.
  - `text-text-inverse`: text on dark/brand surfaces.
  - `text-text-success`, `text-text-warning`, `text-text-danger`: feedback states.
  - `text-text-reward`: reward, Fucoin, streak, badge, and game-loop text.
- CEFR and skill colors keep their existing role, but must not replace feedback colors. Green can mean A1 only when presented as CEFR; success feedback should use success tokens.
- New components should not introduce raw hex text colors unless the color has first been added to tokens.
- Text contrast must be readable on mobile and desktop. Do not place muted text on tinted backgrounds without a contrast check.

## Glossary

| Concept    | Vietnamese standard | German/English reference | Notes                                                   |
| ---------- | ------------------- | ------------------------ | ------------------------------------------------------- |
| Daily goal | Mục tiêu ngày       | Daily goal               | Keep short in nav/sidebar.                              |
| Review     | Ôn tập              | Review / Wiederholung    | Use `Ôn tập SRS` only when the SRS system matters.      |
| Course     | Khóa học            | Course / Kurs            | Avoid `Lộ trình` unless the UI is a path/map.           |
| Mission    | Nhiệm vụ            | Mission                  | Use for gamified actions.                               |
| Quest      | Nhiệm vụ            | Quest                    | Do not mix `quest` and `nhiệm vụ` in the same sentence. |
| Reward     | Phần thưởng         | Reward                   | Use for XP, Fucoin, badges, unlocks.                    |
| Streak     | Chuỗi ngày học      | Streak                   | Avoid untranslated `streak` in learner UI.              |
| Listening  | Nghe                | Hören                    | Navigation label stays `Nghe`.                          |
| Reading    | Đọc hiểu            | Lesen                    | Navigation label stays `Đọc hiểu`.                      |
| Writing    | Viết                | Schreiben                | Navigation label stays `Viết`.                          |
| Speaking   | Nói                 | Sprechen                 | Navigation label stays `Nói`.                           |
| Vocabulary | Từ vựng             | Wortschatz               | Navigation label stays `Từ vựng`.                       |
| Grammar    | Ngữ pháp            | Grammatik                | Navigation label stays `Ngữ pháp`.                      |

## Error Taxonomy

| Code                       | Owner                                     | Release impact                                |
| -------------------------- | ----------------------------------------- | --------------------------------------------- |
| `MOJIBAKE`                 | Vietnamese-German Localization Specialist | Blocker for learner-facing text.              |
| `INVALID_JSON`             | Content QA / Linguistic Reviewer          | Blocker.                                      |
| `MISSING_REQUIRED_LEARNER_TEXT` | Content QA / Linguistic Reviewer     | Blocker for localized learner UI.             |
| `UNNATURAL_VI`             | Vietnamese-German Localization Specialist | Revise before release.                        |
| `WRONG_DE_MEANING`         | German Content Writer                     | Blocker if it teaches a wrong meaning.        |
| `CEFR_MISMATCH`            | Content QA / Linguistic Reviewer          | Revise or block by severity.                  |
| `TYPOGRAPHY_INCONSISTENCY` | Design System Designer                    | Revise for new work; backlog for legacy.      |
| `RAW_HEX_TEXT_COLOR`       | Design System Designer                    | Warning unless contrast or meaning is broken. |
| `LOW_CONTRAST_TEXT`        | Design System Designer                    | Blocker on learner-critical text.             |

## Release Checklist

- No mojibake, replacement characters, or mixed encoding in learner-facing text.
- No required localized learner-facing message is missing or empty.
- Vietnamese copy is natural, concise, and consistent with the glossary.
- German content is correct, natural, and plausible for the declared CEFR level.
- UI states have a clear next action, especially errors and empty states.
- New typography uses shared font families, scale, and tracking rules.
- New text colors use semantic tokens or documented CEFR/skill tokens.
- Content QA report lists owner, severity, code, file, and release recommendation.
