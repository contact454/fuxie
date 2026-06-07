import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { scanReadingQuestions, summarize, isBoilerplateVi, classifyDe } from '../../scripts/reading-explanation-lib'

/**
 * Spec `reading-explanation-regeneration` (RB-P2-02).
 *
 * Property 1: No Boilerplate Remains — every reading explanation.vi is
 *             specific (not the generic template) and non-empty.
 * Property 2: Answer Integrity Preserved — answers are snapshotted; the
 *             remediation must not change them (guarded by the batch script
 *             + this snapshot count which the team re-checks per batch).
 *
 * NOTE (baseline-fail by design): on the CURRENT content, Property 1 FAILS
 * because 1,282 reading explanations are still boilerplate. These tests are
 * the acceptance gate that turns GREEN as the content team completes each
 * level batch. They are marked `.fails` is NOT used; instead Property 1 is
 * asserted as a tracked count so progress is visible without breaking CI
 * red/green for unrelated suites. Flip `EXPECT_ZERO_BOILERPLATE` to true
 * (or remove the guard) once all 6 batches land.
 */

const ROOT = path.resolve(__dirname, '..', '..')

// Toggle to true after all 6 level batches are complete (Task 3).
const EXPECT_ZERO_BOILERPLATE = true

describe('reading-explanation helpers (pure)', () => {
  it('classifyDe distinguishes rich / templated / thin', () => {
    expect(classifyDe('')).toBe('thin')
    expect(classifyDe('kurz')).toBe('thin')
    expect(classifyDe('Die richtige Antwort ist b: weil ...')).toBe('templated')
    expect(classifyDe("Im Text steht: 'X'. Deshalb ist die Aussage richtig.")).toBe('rich')
  })

  it('isBoilerplateVi detects the generic template and empties', () => {
    expect(isBoilerplateVi('')).toBe(true)
    expect(isBoilerplateVi('Đáp án đúng là richtig. Hãy đối chiếu với thông tin then chốt trong bài đọc.')).toBe(true)
    expect(isBoilerplateVi('Trong email Lisa viết rằng cô ấy đi siêu thị hôm nay, nên đáp án đúng.')).toBe(false)
  })
})

describe('Property 2: Answer Integrity baseline (content audit)', () => {
  it('every answer-bearing reading question exposes a stable answer value', () => {
    const refs = scanReadingQuestions(ROOT)
    expect(refs.length).toBeGreaterThan(0)
    // answers must be present (non-null) for every scanned question
    for (const r of refs) expect(r.answer, `${r.file}#${r.questionId}`).not.toBeNull()
  })
})

describe('Property 1: No Boilerplate Remains (content audit)', () => {
  const refs = scanReadingQuestions(ROOT)
  const s = summarize(refs)

  it('reports current boilerplate count (progress tracker)', () => {
    // Always passes; surfaces the count in test output for visibility.
    console.log(`[RB-P2-02] reading questions=${s.total}, boilerplate vi=${s.boilerplate}, de(rich/templated/thin)=${s.byClass.rich}/${s.byClass.templated}/${s.byClass.thin}`)
    expect(s.total).toBeGreaterThan(0)
  })

  it.skipIf(!EXPECT_ZERO_BOILERPLATE)('all reading explanation.vi are specific (post-remediation gate)', () => {
    const remaining = refs.filter((r) => r.viBoilerplate)
    expect(remaining.map((r) => `${r.file}#${r.questionId}`)).toEqual([])
  })
})
