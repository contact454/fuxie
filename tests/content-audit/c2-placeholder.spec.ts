import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

import {
  hasGenericOpener,
  validatePatch,
  applyArticleRegen,
  type ArticleRegenPatch,
} from '../../scripts/apply-c2-article-regen'

/**
 * Spec `content-c2-placeholder-regeneration` — Task 1.
 *   Property 1: No Placeholder — generic-filler opener is detected; the 8
 *               worklist files currently DO carry it (documents the P0 defect).
 *   Property 2: Answer Verifiable — validatePatch enforces answer∈options +
 *               key_evidence⊂article.text + non-broken stem.
 *   Property 3: Scope/schema — applyArticleRegen keeps the file schema and only
 *               replaces article + questions.
 */

const ROOT = path.resolve(__dirname, '..', '..')
const WORKLIST = [
  'C2-T1-005', 'C2-T1-006', 'C2-T1-007', 'C2-T1-008',
  'C2-T1-009', 'C2-T1-010', 'C2-T1-011', 'C2-T1-012',
]
// Files already regenerated with real, on-topic C2 articles (Task 2.x).
// Extend this as each wave lands; the closing gate (Task 3) is when this
// equals WORKLIST and `withOpener` reaches 0.
const REGENERATED = [
  'C2-T1-005', 'C2-T1-006', 'C2-T1-007', 'C2-T1-008',
  'C2-T1-009', 'C2-T1-010', 'C2-T1-011', 'C2-T1-012',
]

// Spec content-c2-teil3-regeneration: 12 Teil-3 files share the same filler
// ("Der wissenschaftliche Diskurs um das Thema ...").
const WORKLIST_T3 = [
  'C2-T3-001', 'C2-T3-002', 'C2-T3-003', 'C2-T3-004', 'C2-T3-005', 'C2-T3-006',
  'C2-T3-007', 'C2-T3-008', 'C2-T3-009', 'C2-T3-010', 'C2-T3-011', 'C2-T3-012',
]
// Extend as each Teil-3 wave lands; closing gate = equals WORKLIST_T3, opener -> 0.
const REGENERATED_T3: string[] = [
  'C2-T3-001', 'C2-T3-002', 'C2-T3-003', 'C2-T3-004', 'C2-T3-005', 'C2-T3-006',
  'C2-T3-007', 'C2-T3-008', 'C2-T3-009', 'C2-T3-010', 'C2-T3-011', 'C2-T3-012',
]

const goodPatch = (): ArticleRegenPatch => ({
  title: 'Rawls’ Theorie der Gerechtigkeit',
  text:
    'John Rawls entwickelt in seiner Theorie der Gerechtigkeit das Gedankenexperiment des Urzustands. ' +
    'Hinter einem Schleier des Nichtwissens kennen die Beteiligten ihre eigene gesellschaftliche Position nicht. ' +
    'Daraus leitet Rawls zwei Grundsätze ab, darunter das Differenzprinzip, das soziale Ungleichheiten nur dann ' +
    'rechtfertigt, wenn sie den am schlechtesten Gestellten zugutekommen.',
  questions: [
    {
      id: 'Q1',
      type: 'multiple_choice',
      stem: 'Welches Gedankenexperiment steht im Zentrum von Rawls’ Theorie?',
      options: { a: 'Der Naturzustand', b: 'Der Urzustand', c: 'Das Höhlengleichnis', d: 'Der kategorische Imperativ' },
      answer: 'b',
      explanation: {
        key_evidence: 'das Gedankenexperiment des Urzustands',
        de: 'Der Text nennt „das Gedankenexperiment des Urzustands“ als zentral.',
        vi: 'Đáp án (b): bài nêu rõ thí nghiệm tư duy "Urzustand" là trung tâm.',
      },
    },
  ],
})

// ---------------------------------------------------------------------------
// Property 1 — generic-filler opener detection
// ---------------------------------------------------------------------------
describe('Property 1: generic-filler opener', () => {
  it('detects the templated opener and passes real text', () => {
    expect(hasGenericOpener('Der vorliegende Kommentar widmet sich dem Thema Wirtschaftsethik aus einer kritisch-analytischen Perspektive.')).toBe(true)
    expect(hasGenericOpener('John Rawls entwickelt in seiner Theorie der Gerechtigkeit ...')).toBe(false)
  })

  it('tracks placeholder regeneration progress: regenerated files are clean, the rest still carry the P0 opener', () => {
    const stillPlaceholder: string[] = []
    const regeneratedClean: string[] = []
    for (const id of WORKLIST) {
      const fp = path.join(ROOT, 'content', 'c2', 'reading', `${id}.json`)
      if (!fs.existsSync(fp)) continue
      const j = JSON.parse(fs.readFileSync(fp, 'utf8'))
      const opener = hasGenericOpener(j?.article?.text ?? '')
      if (REGENERATED.includes(id)) {
        // A regenerated file must NOT carry the placeholder opener anymore.
        expect(opener, `${id} was regenerated but still has the placeholder opener`).toBe(false)
        if (!opener) regeneratedClean.push(id)
      } else if (opener) {
        stillPlaceholder.push(id)
      }
    }
    // Every regenerated file is clean.
    expect(regeneratedClean.sort()).toEqual([...REGENERATED].sort())
    // Remaining placeholders == worklist minus regenerated (documents P0 until all done).
    expect(stillPlaceholder.length).toBe(WORKLIST.length - REGENERATED.length)
  })

  it('tracks Teil-3 filler regeneration: regenerated files are clean, the rest still carry the filler opener', () => {
    const stillPlaceholder: string[] = []
    const regeneratedClean: string[] = []
    for (const id of WORKLIST_T3) {
      const fp = path.join(ROOT, 'content', 'c2', 'reading', `${id}.json`)
      if (!fs.existsSync(fp)) continue
      const j = JSON.parse(fs.readFileSync(fp, 'utf8'))
      const opener = hasGenericOpener(j?.article?.text ?? '')
      if (REGENERATED_T3.includes(id)) {
        expect(opener, `${id} was regenerated but still has the filler opener`).toBe(false)
        if (!opener) regeneratedClean.push(id)
      } else if (opener) {
        stillPlaceholder.push(id)
      }
    }
    expect(regeneratedClean.sort()).toEqual([...REGENERATED_T3].sort())
    expect(stillPlaceholder.length).toBe(WORKLIST_T3.length - REGENERATED_T3.length)
  })
})

// ---------------------------------------------------------------------------
// Property 2 — validation: answer verifiable + non-broken stem
// ---------------------------------------------------------------------------
describe('Property 2: validatePatch', () => {
  it('accepts a well-formed patch', () => {
    expect(validatePatch(goodPatch(), 1).ok).toBe(true)
  })

  it('rejects answer not in options', () => {
    const p = goodPatch(); p.questions[0].answer = 'z'
    const r = validatePatch(p, 1)
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/answer not in options/)
  })

  it('rejects key_evidence not present in article.text', () => {
    const p = goodPatch(); p.questions[0].explanation.key_evidence = 'etwas das gar nicht im Text steht xyz'
    const r = validatePatch(p, 1)
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/key_evidence not found/)
  })

  it('rejects a broken stem', () => {
    const p = goodPatch(); p.questions[0].stem = 'Welche epistemologische Position vertritt der Autor bezüglich fordert Rawls bezüglich Gerechtigkeit?'
    const r = validatePatch(p, 1)
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/Broken_Stem/)
  })

  it('rejects an article that still uses the generic opener', () => {
    const p = goodPatch(); p.text = 'Der vorliegende Kommentar widmet sich dem Thema Wirtschaftsethik aus einer kritisch-analytischen Perspektive. ' + p.text
    const r = validatePatch(p, 1)
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/generic-filler opener/)
  })

  it('rejects wrong question count', () => {
    expect(validatePatch(goodPatch(), 10).ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Property 3 — apply keeps schema, replaces only article + questions
// ---------------------------------------------------------------------------
describe('Property 3: applyArticleRegen keeps schema', () => {
  const fileText = () =>
    JSON.stringify(
      {
        id: 'C2-T1-008', level: 'C2', teil: 1,
        article: { title: 'old', source: 'Kommentar', text: 'Der vorliegende Kommentar widmet sich dem Thema Wirtschaftsethik ...' },
        questions: [{ id: 'Q1', stem: 'alt', options: { a: 'x', b: 'y' }, answer: 'a', explanation: {} }],
        scoring: { total_points: 10 }, qa: { passed: true }, cefrAudit: { targetLevel: 'C2' }, learningOutcomes: [{ id: 'lo' }],
      },
      null, 2,
    )

  it('replaces article + questions but keeps scoring/qa/cefrAudit/learningOutcomes/id', () => {
    const r = applyArticleRegen(fileText(), goodPatch())
    expect(r.error).toBeUndefined()
    const after = JSON.parse(r.text)
    expect(after.id).toBe('C2-T1-008')
    expect(after.level).toBe('C2')
    expect(after.scoring.total_points).toBe(10)
    expect(after.qa.passed).toBe(true)
    expect(after.cefrAudit.targetLevel).toBe('C2')
    expect(after.learningOutcomes[0].id).toBe('lo')
    expect(after.article.text).not.toMatch(/Der vorliegende Kommentar/)
    expect(after.questions[0].stem).toBe('Welches Gedankenexperiment steht im Zentrum von Rawls’ Theorie?')
  })

  it('aborts (no output) on an invalid patch', () => {
    const bad = goodPatch(); bad.questions[0].answer = 'z'
    const text = fileText()
    const r = applyArticleRegen(text, bad)
    expect(r.error).toBeTruthy()
    expect(r.text).toBe(text)
  })
})
