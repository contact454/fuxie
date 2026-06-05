# Fuxie P0 Token Sheet - Learner Remediation

Owner: Codex  
Implementation owner: Antigravity  
Spec: `.kiro/specs/fuxie-ui-ux-p0-remediation/`

## Purpose

This sheet locks the small set of visual tokens needed for Sprint 1 P0 remediation. Antigravity should apply these values exactly unless existing code exposes an equivalent token with the same computed value.

## Locked Tokens

| Use | Background | Foreground | Notes |
| --- | --- | --- | --- |
| Sidebar active nav | `#2EC4B6` | `var(--fuxie-blue-900)` | Same pair as bottom nav |
| Bottom-nav active | `#2EC4B6` | `var(--fuxie-blue-900)` | Label inherits current color |
| Header XP chip | `var(--fuxie-blue-500)` | `#FFFFFF` | Always mounted, therefore not amber |
| CEFR badge | `getCefrTheme(level).bg` | `getCefrTheme(level).text` | Use `border` too |
| Focus ring default | transparent | `var(--fuxie-blue-700)` outline | 2 px outline, 2 px offset |
| Focus ring dark chrome | transparent | `var(--fuxie-blue-200)` outline | Use only where default is too quiet |
| Real muted text | page/card bg | `#64748B` or token equivalent | Avoid `gray-400` for real text |
| Reward amber | reward subtree only | `#FFB703` | Never for always-mounted chrome |

## Reward Amber Rules

Allowed ancestors:

```html
data-reward-state="preview"
data-reward-state="earned"
data-reward-state="receipt"
data-reward-context="true"
```

Decision rule:

| Situation | Use amber? | Treatment |
| --- | --- | --- |
| Claimable reward card | Yes | Add smallest valid `data-reward-state` wrapper |
| Just-claimed reward receipt | Yes | `data-reward-state="earned"` or `receipt` |
| Always-visible XP in header | No | Brand blue chip |
| Generic assignment metadata | No | Brand blue or neutral |
| Decorative coin burst inside reward card | Yes | Must be inside reward subtree |

## Focus Ring Rules

Required class intent:

```text
outline-none
focus-visible:outline
focus-visible:outline-2
focus-visible:outline-offset-2
focus-visible:outline-[var(--fuxie-blue-700)]
```

Dark sidebar override, only where needed:

```text
focus-visible:outline-[var(--fuxie-blue-200)]
```

Rules:

- Do not rely on hover state for keyboard focus.
- Do not remove outline without replacement.
- Prefer centralizing through `MeasuredLink`.
- Keep ring visible against both white cards and dark sidebar chrome.

## German Overflow Rules

Default long-word treatment:

```text
min-w-0
whitespace-normal
[overflow-wrap:anywhere]
hyphens-auto where lang="de" is available
```

Grammar tables:

```text
overflow-x-auto
overflow-y-hidden
-webkit-overflow-scrolling: touch
min-width: max-content
td/th min-width: 8rem
```

Vocabulary titles:

```text
line-clamp-2
[overflow-wrap:anywhere]
title={fullText}
```

Synthetic QA string:

```text
Geschwindigkeitsbegrenzungsschild
```

## Contrast QA Cheatsheet

| Pair | Expected |
| --- | --- |
| `#2EC4B6` + `var(--fuxie-blue-900)` | Pass AA for normal nav text |
| `theme.bg` + `theme.text` from CEFR constants | Pass AA by design |
| `#FFB703` outside reward subtree | Fail containment even if visible |
| `text-gray-400` on white for real text | Treat as suspect until measured |

## QC Checklist

- Active sidebar item is teal with navy text.
- Active bottom-nav item is teal with navy text.
- XP chip is blue, not amber.
- CEFR badge uses pale background and dark text.
- Keyboard focus is visible on nav links.
- Reward amber appears only under allowed data attributes.
- Long German words wrap or table-scroll; they do not clip silently.
