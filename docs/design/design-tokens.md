# Design Tokens — Bright Sky Palette

Vai chinh: Design System Designer
Vai phoi hop: Frontend Engineer

Source-of-truth file: `apps/web/src/app/globals.css` (`:root` block, declared above the Tailwind `@theme` block).

Authoritative design clauses: `.kiro/specs/gamified-ui-asset-rollout/design.md` §F (Bright Sky palette enforcement) and §H (accessibility).

Authoritative requirements: `.kiro/specs/gamified-ui-asset-rollout/requirements.md` Requirement 16 (Bright Sky palette discipline). Subclauses 16.1, 16.3, 16.4, 16.5 are the contract validated by this token set.

> Renaming, removing, or changing the value of any token in this document requires updating §F of `design.md`, this file, and `requirements.md` Req 16 in the same change. The property test in task 17.2 (Reward Amber Containment) and task 4.5 (`PrimaryCta`) consume these names verbatim.

## Token table

| Token | Value | Purpose | Where it MAY appear | Where it MUST NOT appear | Validates |
| --- | --- | --- | --- | --- | --- |
| `--fuxie-blue-50` | `#F3FBFF` | Page background, soft tint | Page bg, dashboard fallback when `villageSquare` world prop missing | — | Req 3.5 (fallback), Req 16.4 (CTA palette family) |
| `--fuxie-blue-100` | `#E4F0F0` | Panel tint | Card/panel surfaces, subtle dividers | — | Req 16.4 |
| `--fuxie-blue-200` | `#CCE4F0` | Card tint, soft border | Vocabulary card `new` border, scrim soft | — | Req 5.1 (visual indicator), Req 16.4 |
| `--fuxie-blue-400` | `#60A8E4` | Brand secondary | Secondary CTA outline, brand mark wash | — | Req 16.4 |
| `--fuxie-blue-500` | `#54A8E4` | Brand primary | Hero accents, paired with `--fuxie-action` | — | Req 16.4 |
| `--fuxie-blue-600` | `#3C78A8` | Readable text on light | Body text on light surface, secondary headings | — | Req 15.1 (contrast) |
| `--fuxie-blue-700` | `#3078B4` | Pressed state | Active CTA pressed state, focus deep-fill | — | Req 14.1, Req 15.4 |
| `--fuxie-blue-900` | `#173B56` | Deep text / scrim | Body text, exam chrome, `Scrim intensity="strong"` | — | Req 15.1, Req 10.4 (exam neutral palette) |
| `--fuxie-action` | `#54A8E4` | Primary_CTA fill on learning surfaces | Every `data-role="primary-cta"` fill | Energy/reward fill positions | Req 14.1, Req 16.4 |
| `--fuxie-action-hover` | `#3C93D1` | Primary_CTA hover/active fill | Hover/focus state of `data-role="primary-cta"` | — | Req 14.1, Req 15.4 |
| `--fuxie-success` | `#2EC4B6` | Success / CEFR-A1 green | `in-progress` progress bar, mastered border, success toasts | Locked/error subtrees | Req 4.5, Req 5.6 |
| `--fuxie-energy` | `#FF8A3D` | Accent only | Decorative accent strokes, ≤5% of surface area | Primary_CTA fill, body text, ≥5% area coverage | Req 16.3 |
| `--fuxie-reward` | `#FFB703` | Reward amber | Subtrees with `[data-reward-state="preview"\|"earned"\|"receipt"]` or `[data-reward-context="true"]` (streak indicator exception, Req 16.1) | Subtrees with `data-reward-state="locked"\|"pending"`, exam `in-progress`, all `locked\|empty\|error` states (Req 11.7, Req 16.5), Primary_CTA fill | Req 16.1, Req 16.5, Req 6.9, Req 10.4, Req 11.7 |

## Reward-amber containment rule (Req 16.1, 16.5)

`var(--fuxie-reward)` may only resolve in a DOM subtree whose root carries one of:

```css
[data-reward-state="preview"]
[data-reward-state="earned"]
[data-reward-state="receipt"]
[data-reward-context="true"]   /* streak indicator exception */
```

`data-reward-state="locked"` and `data-reward-state="pending"` do NOT permit reward amber.

This rule is enforced at three levels:

1. **CSS comment contract** at the top of the `:root` block in `apps/web/src/app/globals.css`. Every reviewer reading the token file sees the rule next to the declaration. Any new `var(--fuxie-reward)` use without a matching ancestor selector should be rejected at code review.
2. **Property-based runtime test** in task 17.2 (`tests/reward-amber-containment.spec.tsx`) scans the rendered DOM for any node whose computed `color`, `background-color`, `border-color`, or `fill` matches `rgb(255,183,3) ± 5%`. The test fails unless an ancestor matches the allow-list above.
3. **Stylelint hook (future, optional)** can match the regex `var\(--fuxie-reward\b` and require the surrounding selector to include `[data-reward-state]` or `[data-reward-context]`. An allow-comment escape is reserved as `/* fuxie-reward-allow: <reason> */` for legitimate exceptions (none expected at P0). This hook is not required to land with task 4.1; the property test is the authoritative gate.

## Energy-orange budget (Req 16.3)

`var(--fuxie-energy)` is capped at ≤5% of any surface's painted area and is forbidden as a Primary_CTA fill. Property test 17.2 (Property 22: Bright Sky CTA Discipline) verifies the second part. The 5% area budget is enforced by visual QA review during `pnpm check:quick` runs.

## Primary_CTA palette discipline (Req 16.4)

Every `[data-role="primary-cta"]` element MUST resolve its background color to one of `--fuxie-action`, `--fuxie-blue-500`, `--fuxie-blue-600`, or `--fuxie-blue-700`. Borders must resolve to a Bright Sky blue token in the same family. The `PrimaryCta` primitive in task 4.5 is the only sanctioned implementation path.

## Locked / Empty / Error palette discipline (Req 11.7, Req 16.5)

While a surface renders one of those states, none of `--fuxie-reward`, reward-amber-equivalent rgb values, or `Reward_State="earned"` visual treatments may appear in the subtree. State-shell (task 16.1) enforces this contractually.

## Migration notes

The Tailwind `@theme` block in `globals.css` continues to declare `--color-fuxie-sky-*`, `--color-fuxie-energy`, `--color-fuxie-reward`, etc. for utility-class generation. Those are the UTILITY token names; the canonical names in this document are the SEMANTIC token names referenced by component code (`var(--fuxie-action)`, `var(--fuxie-reward)`, etc.). Both sets resolve to the same hex values. New code should prefer the semantic names from this document.
