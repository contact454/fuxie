# Writing Player — Translation Review (vi → de)

**Spec:** learner-copy-localization-backfill
**Reviewed by:** Vietnamese-German Localization Specialist (primary) · German Content Writer (cross-review, optional)
**Date:** 2026-05-16
**Status:** FINAL — signed off by Vietnamese-German Localization Specialist

## Scope

Five learner-facing strings currently hard-coded in `apps/web/src/components/writing/writing-player.tsx` (lines 622, 658, 666, 722, 760) are being lifted into the `WritingPlayer` namespace of `apps/web/messages/{vi,de}.json`. This document records the **German** target values and the rationale that supports the Translation_Review acceptance gate (Requirement 4 of the spec).

The Vietnamese values are taken **verbatim** from the existing source code per Requirement 3.6 — they are not under review here. Decorative glyphs ("📋 " before `contentPointsHeader`, " →" after `submitLabel`) stay inline in JSX and are **not** part of the German value, per Requirements 4.4, 4.6, and 6.

## Register baseline (from `apps/web/messages/de.json`)

The 180 existing keys establish a consistent learner-facing register:

- Informal **"du"** form throughout (e.g. *"Schreibe auf Deutsch"*, *"Hör genau zu, sprich langsamer"*, *"Wähle eine andere Stufe"*).
- **Short noun labels** for headers and buttons (e.g. *"Einstellungen"*, *"Wiederholen"*, *"Tagesziel"*, *"Aussprache"*).
- **No emoji or arrow glyphs** inside translated values — those live in JSX.
- **Compound nouns are accepted** when they are everyday DaF vocabulary (e.g. *"Tagesziel"*, *"Sprechaufgabe"*, *"Leselektionen"*).
- CEFR fit: vocabulary stays inside the **A2–B1** band that the Writing surface targets.

The five proposals below were chosen to match this baseline rather than to introduce a new tone.

## 5 final values

| Key Path | Vietnamese (verbatim) | German (proposal) | CEFR | Justification |
|---|---|---|---|---|
| `WritingPlayer.promptHeader` | Đề bài | **Aufgabenstellung** | A2–B1 | Standard DaF noun used in textbooks and Goethe/Telc materials for the "task statement" of a writing prompt. Single-word header, matches existing header style (*"Tagesziel"*, *"Einstellungen"*). Considered alternatives — *"Aufgabe"* (A1, but ambiguous: covers any task, not specifically the prompt brief) and *"Schreibauftrag"* (B1, slightly heavier). *"Aufgabenstellung"* wins on precision without leaving the A2–B1 band. |
| `WritingPlayer.grafikLabel` | Biểu đồ | **Grafik** | A1 | Single high-frequency noun, identical to the cognate used in Goethe B1 and Telc B1 writing tasks where a chart accompanies the prompt. Source "Biểu đồ" covers chart/diagram broadly; *"Grafik"* is the standard umbrella term in DaF Schreiben surfaces. *"Diagramm"* was considered but is narrower (only chart-type visuals) and slightly more technical. |
| `WritingPlayer.contentPointsHeader` | Ý cần viết: | **Inhaltspunkte:** | A2–B1 | "Inhaltspunkte" is the canonical Goethe/Telc term for the bullet points a learner must address in a writing task — the same framing the source Vietnamese conveys ("the points you need to write about"). Keeps the trailing colon to match the source punctuation and the existing header pattern. The decorative "📋 " glyph stays in JSX (Req 4.4, 6.3). Considered alternative — *"Was du schreiben sollst:"* is more conversational and uses "du", but it is **longer** and drifts away from the noun-header pattern that dominates the rest of `de.json`; the canonical exam term is the better fit on a CEFR-graded Writing surface. |
| `WritingPlayer.draftPlaceholder` | Viết bài của em tại đây... | **Schreibe deinen Text hier...** | A1–A2 | Matches the existing `de.json` "du"-form imperative pattern (*"Schreibe auf Deutsch"*, *"Hör genau zu"*, *"Wähle eine andere Stufe"*). All three lexical items (*schreiben*, *Text*, *hier*) are A1. The Vietnamese source uses the pupil-marker "em"; German renders that warmth through informal "du" rather than a literal age marker, avoiding the false-friend trap of over-translating. Trailing ellipsis preserved to mirror the source placeholder convention. |
| `WritingPlayer.submitLabel` | Nộp bài | **Einreichen** | B1 | Standard German submit-button verb in academic and exam UIs, well within B1 and frequently encountered on Goethe/Telc practice platforms. 10 characters — well under the 20-char ceiling in Requirement 4.6. The trailing " →" arrow stays in JSX (Req 4.6, 6.4). Considered alternatives — *"Abgeben"* (A2, more colloquial — fine but slightly less formal than the writing-task context warrants) and *"Absenden"* (B1, generic "send off" — works but reads more like a form-submit than a homework-submit). *"Einreichen"* maps most cleanly to "Nộp bài" in an exam-prep context. |

## CEFR check

- All five values sit inside the **A2–B1** target band that Requirement 4.7 specifies for the Writing surface. *"Grafik"* and *"Schreibe deinen Text hier..."* anchor at A1–A2; *"Aufgabenstellung"*, *"Inhaltspunkte:"*, and *"Einreichen"* sit at A2–B1.
- **No rare or low-frequency lexicon.** Each item appears in standard Goethe-Institut A2/B1 wordlists or in everyday classroom DaF.
- **No subordinate-clause complexity** anywhere. *"Schreibe deinen Text hier..."* is a flat imperative; the other four are single nouns or compounds.
- **"du" tone applied** on `draftPlaceholder` (informal imperative *Schreibe*), matching the rest of `de.json` and Requirement 4.5. Headers and the submit verb are noun/infinitive forms, which are tone-neutral and consistent with existing button labels in `de.json` (*"Erneut versuchen"*, *"Weiterlernen"*, *"Starten"*).
- **No false friends.** Notably, `grafikLabel` deliberately stays as *"Grafik"* rather than the Vietnamese-tempting *"Diagramm"*, since "Biểu đồ" is the broad chart/diagram label and Writing surfaces typically show heterogeneous visuals.
- **No emoji or arrow glyphs** inside any value. Decorative inline glyphs live in JSX per Requirements 6.3 and 6.4.

## Risks reviewed

- **Over-translation** (risk flagged in the Localization Specialist profile): *"Viết bài của em tại đây..."* could have been rendered as *"Schreibe hier deinen Text als Schüler..."* or with a possessive expansion. The proposed *"Schreibe deinen Text hier..."* keeps the warmth via "deinen + du-imperative" without grafting a Vietnamese age marker into German.
- **Hiding German practice behind Vietnamese**: not applicable here; all five targets are German labels visible to the learner.
- **Compound-noun overload**: *"Aufgabenstellung"* and *"Inhaltspunkte"* are compounds, but both are everyday DaF compounds that learners on a Goethe/Telc preparation surface will already encounter. Neither hides meaning behind unfamiliar morphology.

## Hand-off notes for Phase 2 (JSON edits — Task 3.2)

When `WritingPlayer` is appended to `apps/web/messages/de.json` in Task 3.2, the leaves SHALL be exactly:

```json
"WritingPlayer": {
  "promptHeader": "Aufgabenstellung",
  "grafikLabel": "Grafik",
  "contentPointsHeader": "Inhaltspunkte:",
  "draftPlaceholder": "Schreibe deinen Text hier...",
  "submitLabel": "Einreichen"
}
```

No additional whitespace, no leading/trailing spaces, no emoji or arrow glyphs in any value.

## Sign-off

- [x] Vietnamese-German Localization Specialist (primary): **Fuxie Localization Specialist Agent**, 2026-05-16
- [ ] German Content Writer (cross-review, optional — Task 2.2): _N/A — primary specialist confirmed values match register baseline; cross-review skipped per workflow flexibility (★ optional task)_

## Final 5 values for PR description (markdown table — copy verbatim)

| Key Path | Vietnamese (verbatim) | German (final) | CEFR |
|---|---|---|---|
| WritingPlayer.promptHeader | Đề bài | Aufgabenstellung | A2-B1 |
| WritingPlayer.grafikLabel | Biểu đồ | Grafik | A1 |
| WritingPlayer.contentPointsHeader | Ý cần viết: | Inhaltspunkte: | A2-B1 |
| WritingPlayer.draftPlaceholder | Viết bài của em tại đây... | Schreibe deinen Text hier... | A1-A2 |
| WritingPlayer.submitLabel | Nộp bài | Einreichen | B1 |

**Reviewer sign-off line for PR description:**

> Translation reviewed and signed off by Vietnamese-German Localization Specialist on 2026-05-16. CEFR-A2/B1 register confirmed; informal "du" tone applied to draftPlaceholder; no inline emoji/arrows in JSON values per Req 4.4 + 4.6 (decorative glyphs stay in JSX).
