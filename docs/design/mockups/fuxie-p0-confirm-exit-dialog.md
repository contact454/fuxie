# Fuxie P0 Mockup - Confirm Exit Dialog

Owner: Codex  
Implementation owner: Antigravity  
Spec: `.kiro/specs/fuxie-ui-ux-p0-remediation/`

## Purpose

Protect active learner progress from one-tap exits in session, grammar lesson, and writing flows. This is a calm prevention dialog, not an alarm state.

## Visual Direction

- Tone: neutral, protective, low drama.
- Primary learner goal: stay in the task unless the learner explicitly chooses to leave.
- Visual hierarchy: title first, consequence second, safe action first.
- No reward amber, no red error styling.

## Mobile Wireframe

Viewport target: 360 px width.

```text
+--------------------------------------+
| dimmed page overlay                   |
|                                      |
|    +----------------------------+    |
|    | Leave this activity?       |    |
|    |                            |    |
|    | Your current progress may  |    |
|    | not be saved if you leave. |    |
|    |                            |    |
|    | [Stay here]                |    |
|    | [Leave activity]           |    |
|    +----------------------------+    |
|                                      |
+--------------------------------------+
```

Desktop adapts to centered modal with max width 28 rem. Mobile uses side margin 16 px and full-width stacked buttons.

## Anatomy

| Part | Requirement |
| --- | --- |
| Overlay | `rgba(15, 23, 42, 0.38)` or existing neutral overlay token |
| Dialog surface | White or existing card surface, 20 px radius, subtle shadow |
| Title | 18-20 px bold, `var(--color-text-primary)` |
| Description | 14-15 px, `var(--color-text-muted)`, line-height 1.5 |
| Safe action | Primary button, brand blue, receives initial focus |
| Exit action | Secondary/ghost button, neutral text, not red |
| Focus ring | 2 px `var(--fuxie-blue-700)`, 2 px offset |

## Interaction States

| Trigger | Expected behavior |
| --- | --- |
| Open dialog | Focus moves to "Stay here" |
| Press `Escape` | Dialog closes, learner stays |
| Click overlay | Do not exit. Either no-op or stay/cancel |
| Click "Stay here" | Dialog closes, state preserved |
| Click "Leave activity" | Original navigation executes |
| Tab key | Focus cycles inside dialog while open |

## Flow Copy Slots

Use i18n. Copy below is semantic guidance, not final localization.

| Flow | Title intent | Description intent |
| --- | --- | --- |
| Session | Leave this session? | Progress from this attempt may be lost. |
| Grammar | Leave this lesson? | Your current step will not be completed. |
| Writing | Leave this draft? | Unsaved writing may be lost. |

Generic buttons:

- Safe action: Stay here
- Exit action: Leave activity

## Accessibility Checklist

- Dialog root uses `role="dialog"` and `aria-modal="true"`.
- Dialog has an accessible name through `aria-label` or `aria-labelledby`.
- Safe button is first in tab order and receives initial focus.
- Focus returns to the triggering exit button when dialog closes if practical.
- `Escape` is non-destructive.
- Destructive action is not the default focus.

## QA Notes

- Verify active session exit shows dialog.
- Verify grammar lesson in progress shows dialog.
- Verify writing draft with content shows dialog.
- Verify writing with no content can exit directly.
- Verify cancel/stay preserves local input and progress.
- Verify desktop page chrome behind the dialog is not keyboard reachable while modal is open.
