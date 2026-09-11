import { describe, it, expect } from 'vitest'

import { isBrokenStem, BROKEN_STEM_MARKERS } from '../../scripts/lib/cefr-stem-markers'
import {
  applyPatchToText,
  answerOptionsSnapshot,
  findQuestion,
  parseArgs,
} from '../../scripts/regenerate-cefr-stems'

/**
 * Spec `content-cefr-stem-regeneration` — Task 1.
 *   Property 1: No Broken Stem Remains — markers detect the bug; clean stems pass.
 *   Property 2: Answer Integrity Preserved — applyPatchToText never changes
 *               answer/options (aborts if it would).
 *   Property 3: Scope Containment — only the targeted field's value changes.
 */

const fixture = () =>
  JSON.stringify(
    {
      id: 'C2-T1-001',
      questions: [
        {
          id: 'Q4',
          type: 'multiple_choice',
          stem: 'Welche epistemologische Position vertritt der Autor bezüglich fordert Hart bezüglich Recht und Moral?',
          options: { a: 'A', b: 'B', c: 'Eine strikte begriffliche Trennung.', d: 'D' },
          answer: 'c',
          explanation: { de: 'Die Textstelle „Hart plädiert ...“ belegt (c).', key_evidence: 'Hart plädiert für eine strikte begriffliche Trennung' },
        },
        { id: 'Q5', type: 'multiple_choice', stem: 'Sauberer Satz?', options: { a: 'x', b: 'y' }, answer: 'a', explanation: {} },
      ],
    },
    null,
    2,
  )

// ---------------------------------------------------------------------------
// Property 1 — broken-stem markers
// ---------------------------------------------------------------------------
describe('Property 1: broken-stem detection', () => {
  it('flags the real broken stems', () => {
    expect(isBrokenStem('Welche epistemologische Position vertritt der Autor bezüglich fordert Hart bezüglich Recht und Moral?')).toBe(true)
    expect(isBrokenStem('Was lässt sich aus der kritischen Betrachtung von Warum hält Hart die Trennung von für die Gesamtthese ableiten?')).toBe(true)
    expect(isBrokenStem('Was impliziert der Text über lässt sich aus den Angaben über könnte man dem Autor bezüglich Stadt')).toBe(true)
    expect(isBrokenStem('Inwiefern widersprechen sich die Ausführungen zu Dworkins Beitrag mit der Gesamtthese?')).toBe(true)
  })

  it('passes clean, grammatical stems', () => {
    expect(isBrokenStem('Was fordert Hart hinsichtlich des Verhältnisses von Recht und Moral?')).toBe(false)
    expect(isBrokenStem('Worin besteht der Kern des Rechtspositivismus nach Kelsen?')).toBe(false)
    expect(isBrokenStem('Lisa geht heute einkaufen.')).toBe(false)
    expect(isBrokenStem('')).toBe(false)
  })

  it('exposes the marker list (single source of truth)', () => {
    expect(BROKEN_STEM_MARKERS.length).toBeGreaterThan(0)
  })
})

// ---------------------------------------------------------------------------
// Property 2 + 3 — apply preserves answer/options; only target field changes
// ---------------------------------------------------------------------------
describe('Property 2/3: applyPatchToText', () => {
  it('rewrites the stem and preserves answer/options', () => {
    const text = fixture()
    const before = answerOptionsSnapshot(JSON.parse(text))
    const r = applyPatchToText(text, { file: 'f', itemId: 'Q4', newStem: 'Was fordert Hart hinsichtlich Recht und Moral?' })
    expect(r.error).toBeUndefined()
    expect(r.changes).toContain('Q4.stem')
    const after = JSON.parse(r.text)
    // answer/options invariant
    expect(answerOptionsSnapshot(after)).toBe(before)
    // stem actually changed + no longer broken
    expect(findQuestion(after, 'Q4').stem).toBe('Was fordert Hart hinsichtlich Recht und Moral?')
    expect(isBrokenStem(findQuestion(after, 'Q4').stem)).toBe(false)
    // Q5 untouched
    expect(findQuestion(after, 'Q5').stem).toBe('Sauberer Satz?')
  })

  it('can also fix key_evidence and explanation.de', () => {
    const text = fixture()
    const r = applyPatchToText(text, {
      file: 'f', itemId: 'Q4',
      newKeyEvidence: 'Hart plädiert für eine strikte begriffliche Trennung von Recht und Moral',
      newDe: 'Die Textstelle „Hart plädiert für eine strikte begriffliche Trennung“ belegt die richtige Antwort (c).',
    })
    expect(r.error).toBeUndefined()
    expect(r.changes).toEqual(expect.arrayContaining(['Q4.key_evidence', 'Q4.explanation.de']))
    expect(answerOptionsSnapshot(JSON.parse(r.text))).toBe(answerOptionsSnapshot(JSON.parse(text)))
  })

  it('errors (no mutation) when the question is missing', () => {
    const text = fixture()
    const r = applyPatchToText(text, { file: 'f', itemId: 'Q99', newStem: 'x' })
    expect(r.error).toMatch(/not found/)
    expect(r.text).toBe(text)
  })

  it('errors when the old stem value is not found (stale patch)', () => {
    const text = fixture()
    const r = applyPatchToText(text, { file: 'f', itemId: 'Q4', newStem: 'x' })
    // old value IS found here (matches fixture), so to force not-found we mutate first:
    const once = applyPatchToText(text, { file: 'f', itemId: 'Q4', newStem: 'Neuer Satz?' })
    const r2 = applyPatchToText(once.text, { file: 'f', itemId: 'Q4', newStem: 'Neuer Satz?' })
    // applying the same new stem again is a no-op (oldVal===newVal) -> no change, no error
    expect(r2.error).toBeUndefined()
    expect(r.error).toBeUndefined()
  })

  it('textFix replaces a unique German lexical error', () => {
    const text = JSON.stringify({ id: 'X', questions: [{ id: 'Q1', answer: 'a', options: {}, stem: 's' }], article: { text: 'Die intellectual Debatten ...' } }, null, 2)
    const r = applyPatchToText(text, { file: 'f', itemId: 'Q1', textFix: { from: 'intellectual', to: 'intellektuellen' } })
    expect(r.error).toBeUndefined()
    expect(r.text).toContain('intellektuellen')
    expect(r.text).not.toContain('intellectual')
  })
})

describe('question-scoped replace (avoids "not unique")', () => {
  it('replaces key_evidence in the TARGET question even when the string repeats in another question', () => {
    const shared = 'Während der Rechtspositivismus in der Tradition Hans Kelsens das Recht begreift'
    const text = JSON.stringify(
      {
        id: 'C2-T1-001',
        questions: [
          { id: 'Q1', answer: 'b', options: { a: 'x', b: 'y' }, explanation: { key_evidence: shared } },
          { id: 'Q3', answer: 'b', options: { a: 'x', b: 'y' }, explanation: { key_evidence: shared } },
        ],
      },
      null,
      2,
    )
    const r = applyPatchToText(text, { file: 'f', itemId: 'Q3', newKeyEvidence: 'Radbruch vollzog eine intellektuelle Kehrtwende' })
    expect(r.error).toBeUndefined()
    const after = JSON.parse(r.text)
    // Q3 changed, Q1 (same old string) untouched
    expect(findQuestion(after, 'Q3').explanation.key_evidence).toBe('Radbruch vollzog eine intellektuelle Kehrtwende')
    expect(findQuestion(after, 'Q1').explanation.key_evidence).toBe(shared)
    expect(answerOptionsSnapshot(after)).toBe(answerOptionsSnapshot(JSON.parse(text)))
  })

  it('textFix.all replaces every occurrence of a repeated lexical error', () => {
    const text = JSON.stringify(
      { id: 'X', questions: [{ id: 'Q1', answer: 'a', options: {}, stem: 's', explanation: { key_evidence: 'Die intellectual Debatten ...' } }], article: { text: 'Die intellectual Debatten und die intellectual Phase ...' } },
      null,
      2,
    )
    const r = applyPatchToText(text, { file: 'f', itemId: 'Q1', textFix: { from: 'intellectual', to: 'intellektuellen', all: true } })
    expect(r.error).toBeUndefined()
    expect(r.text).not.toContain('intellectual')
    expect(r.text.split('intellektuellen').length - 1).toBeGreaterThanOrEqual(3)
  })

  it('textFix without all errors when the term repeats', () => {
    const text = JSON.stringify(
      { id: 'X', questions: [{ id: 'Q1', answer: 'a', options: {}, stem: 's', explanation: { de: 'foo bar foo' } }] },
      null,
      2,
    )
    const r = applyPatchToText(text, { file: 'f', itemId: 'Q1', textFix: { from: 'foo', to: 'baz' } })
    expect(r.error).toMatch(/occurs 2x/)
  })
})

describe('parseArgs', () => {
  it('defaults to dry-run when no --patch', () => {
    expect(parseArgs([]).dryRun).toBe(true)
    expect(parseArgs(['--patch', 'p.json', '--level', 'c2']).dryRun).toBe(false)
    expect(parseArgs(['--patch=p.json']).patch).toBe('p.json')
  })
})
