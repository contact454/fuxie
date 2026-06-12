import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  type CalibrationInfra,
  type DetectionResult,
  type MutationCase,
  BAD_TRANSLATION_VI,
  LEVEL_VIOLATION_CLAUSE,
  MUTATION_TYPES,
  applyMutation,
  assertContentUnchanged,
  computeRecall,
  deepClone,
  diffTrees,
  dropFirstUmlaut,
  hashTree,
  isCleanDiff,
  mutateBadTranslation,
  mutateGenus,
  mutateLevelViolation,
  mutateUmlautDrop,
  mutateWrongAnswer,
  mulberry32,
  newErrorFindingKeys,
  seededShuffle,
} from '../../scripts/lib/review-board-calibrate'
import {
  type Tier1Finding,
  buildTier1Result,
} from '../../scripts/lib/review-board-contract'
import { checkVocabularyFile, checkReadingFile } from '../../scripts/lib/german-content-checks'

/**
 * Spec `fuxie-content-review-board` — Task 5.1 unit tests.
 *
 * Covers (all deterministic, no provider credit, no real content touched):
 *   1. Each mutator changes EXACTLY the field it claims (and only that field).
 *   2. Ground-truth recording (jsonPath / before / after) is accurate.
 *   3. Mutators feed the real Tier-1 checks (genus → enum:article,
 *      wrong_answer → answerkey:contradiction).
 *   4. Recall computation math + tier attribution + honesty flags.
 *   5. Content-hash read-only invariant guard (on a temp fixture, NOT content/).
 *   6. Deterministic, seedable selection.
 */

// --- fixtures ---------------------------------------------------------------

function vocabFixture(): Record<string, unknown> {
  return {
    theme: { slug: 'a1-test', name: 'Test' },
    words: [
      {
        word: 'Straße',
        article: 'FEMININ',
        plural: 'die Straßen',
        wordType: 'NOMEN',
        meaningVi: 'đường phố',
        meaningDe: 'ein Weg, auf dem Autos fahren',
        exampleSentence1: 'Die Straße ist lang.',
      },
      {
        word: 'lernen',
        wordType: 'VERB',
        meaningVi: 'học',
        exampleSentence1: 'Ich lerne Deutsch.',
      },
    ],
  }
}

function readingFixture(): Record<string, unknown> {
  return {
    id: 'A1-TEST-001',
    level: 'A1',
    texts: [{ id: 'TextA', content: 'Am Samstag habe ich Geburtstag.' }],
    questions: [
      {
        id: 'Q1',
        type: 'richtig_falsch',
        linked_text: 'TextA',
        statement: 'Anna hat am Sonntag Geburtstag.',
        answer: 'falsch',
        explanation: {
          de: "Im Text steht: 'am Samstag habe ich Geburtstag!'",
          key_evidence: 'am Samstag habe ich Geburtstag',
          vi: 'Đáp án: falsch (SAI). Bằng chứng trong bài.',
        },
      },
    ],
  }
}

/** Deep-diff: list of dot/bracket paths whose leaf values differ. */
function changedPaths(a: unknown, b: unknown, prefix = ''): string[] {
  if (a === b) return []
  if (typeof a !== typeof b || a === null || b === null || typeof a !== 'object') {
    return [prefix || '(root)']
  }
  const out: string[] = []
  if (Array.isArray(a) && Array.isArray(b)) {
    const max = Math.max(a.length, b.length)
    for (let i = 0; i < max; i++) out.push(...changedPaths(a[i], b[i], `${prefix}[${i}]`))
    return out
  }
  const ao = a as Record<string, unknown>
  const bo = b as Record<string, unknown>
  for (const k of new Set([...Object.keys(ao), ...Object.keys(bo)])) {
    const p = prefix ? `${prefix}.${k}` : k
    out.push(...changedPaths(ao[k], bo[k], p))
  }
  return out
}

// --- 1 + 2: mutators change exactly the claimed field -----------------------

describe('mutators change exactly one field + record accurate ground truth', () => {
  it('mutateGenus flips one article to an invalid enum value', () => {
    const original = vocabFixture()
    const res = mutateGenus(deepClone(original))!
    expect(res).not.toBeNull()
    expect(res.jsonPath).toBe('words[0].article')
    expect(res.before).toBe('FEMININ')
    expect(res.after).toBe('FEMINUM')
    expect(changedPaths(original, res.mutated)).toEqual(['words[0].article'])
  })

  it('mutateUmlautDrop drops one umlaut in one German field', () => {
    const original = vocabFixture()
    const res = mutateUmlautDrop(deepClone(original), 'vocabulary')!
    expect(res).not.toBeNull()
    // first German de-string with an umlaut is words[0].word "Straße"
    expect(res.jsonPath).toBe('words[0].word')
    expect(res.before).toBe('Straße')
    expect(res.after).toBe('Strasse')
    expect(changedPaths(original, res.mutated)).toEqual(['words[0].word'])
  })

  it('mutateWrongAnswer flips a richtig_falsch answer (keeps explanation)', () => {
    const original = readingFixture()
    const res = mutateWrongAnswer(deepClone(original))!
    expect(res).not.toBeNull()
    expect(res.jsonPath).toBe('questions[0].answer')
    expect(res.before).toBe('falsch')
    expect(res.after).toBe('richtig')
    expect(res.questionIndex).toBe(0)
    // ONLY the answer changed — the explanation (with its "Đáp án: falsch"
    // marker) is intentionally left intact so it now contradicts the answer.
    expect(changedPaths(original, res.mutated)).toEqual(['questions[0].answer'])
  })

  it('mutateLevelViolation appends an above-level clause to one passage', () => {
    const original = readingFixture()
    const res = mutateLevelViolation(deepClone(original), 'reading')!
    expect(res).not.toBeNull()
    expect(res.jsonPath).toBe('texts[0].content')
    expect(String(res.after)).toContain(LEVEL_VIOLATION_CLAUSE.trim())
    expect(changedPaths(original, res.mutated)).toEqual(['texts[0].content'])
  })

  it('mutateBadTranslation corrupts one Vietnamese explanation', () => {
    const original = readingFixture()
    const res = mutateBadTranslation(deepClone(original), 'reading')!
    expect(res).not.toBeNull()
    expect(res.jsonPath).toBe('questions[0].explanation.vi')
    expect(res.after).toBe(BAD_TRANSLATION_VI)
    expect(changedPaths(original, res.mutated)).toEqual(['questions[0].explanation.vi'])
  })

  it('applyMutation dispatches by type and never mutates the input', () => {
    const original = vocabFixture()
    const snapshot = JSON.stringify(original)
    const res = applyMutation('genus', original)!
    expect(res.jsonPath).toBe('words[0].article')
    // input untouched (mutators clone)
    expect(JSON.stringify(original)).toBe(snapshot)
  })

  it('dropFirstUmlaut maps each umlaut/ß and returns null when none', () => {
    expect(dropFirstUmlaut('Müller')).toBe('Muller')
    expect(dropFirstUmlaut('Städte')).toBe('Stadte')
    expect(dropFirstUmlaut('groß')).toBe('gross')
    expect(dropFirstUmlaut('Haus')).toBeNull()
  })
})

// --- 3: mutators feed the real Tier-1 deterministic checks -------------------

describe('mutations are caught by the real Tier-1 deterministic checks', () => {
  it('genus mutation produces an enum:article error', () => {
    const res = mutateGenus(vocabFixture())!
    const findings = checkVocabularyFile('content/a1/vocabulary/test.json', res.mutated)
    const enumErr = findings.find((f) => f.rule === 'enum:article' && f.severity === 'error')
    expect(enumErr).toBeTruthy()
    expect(enumErr!.jsonPath).toBe('words[0].article')
  })

  it('wrong_answer mutation produces an answerkey:contradiction error', () => {
    const res = mutateWrongAnswer(readingFixture())!
    const findings = checkReadingFile('content/a1/reading/test.json', res.mutated)
    const contra = findings.find(
      (f) => f.rule === 'answerkey:contradiction' && f.severity === 'error',
    )
    expect(contra).toBeTruthy()
  })

  it('newErrorFindingKeys reports only NEW error findings introduced by a mutation', () => {
    const original = readingFixture()
    const baseline = checkReadingFile('content/a1/reading/test.json', original)
    const res = mutateWrongAnswer(deepClone(original))!
    const mutated = checkReadingFile('content/a1/reading/test.json', res.mutated)
    const keys = newErrorFindingKeys(baseline, mutated)
    expect(keys.length).toBeGreaterThan(0)
    expect(keys.some((k) => k.startsWith('answerkey:contradiction|'))).toBe(true)
  })
})

// --- 4: recall computation math ---------------------------------------------

describe('computeRecall math + tier attribution + honesty flags', () => {
  const infraOffline: CalibrationInfra = {
    hunspellAvailable: false,
    languageToolUsed: false,
    tier2Live: false,
  }

  function caseOf(type: MutationCase['type'], i: number): MutationCase {
    return {
      id: `${type}-${i}`,
      type,
      skill: type === 'genus' || type === 'umlaut_drop' ? 'vocabulary' : 'reading',
      sourceFile: 'content/x.json',
      itemId: 'x',
      jsonPath: 'p',
      before: 'a',
      after: 'b',
    }
  }
  function det(
    caseId: string,
    type: MutationCase['type'],
    tier1: boolean,
    tier2: boolean,
  ): DetectionResult {
    return {
      caseId,
      type,
      tier1Caught: tier1,
      tier2Caught: tier2,
      tier2Applicable: type !== 'genus' && type !== 'umlaut_drop',
      newTier1Rules: tier1 ? ['rule|p'] : [],
      redFlag: tier2,
    }
  }

  it('computes recall = caught/injected and labels caughtBy correctly', () => {
    const cases: MutationCase[] = [
      caseOf('genus', 1),
      caseOf('genus', 2),
      caseOf('wrong_answer', 1),
      caseOf('wrong_answer', 2),
      caseOf('umlaut_drop', 1),
    ]
    const detections: DetectionResult[] = [
      det('genus-1', 'genus', true, false),
      det('genus-2', 'genus', false, false), // missed
      det('wrong_answer-1', 'wrong_answer', true, true),
      det('wrong_answer-2', 'wrong_answer', false, true),
      det('umlaut_drop-1', 'umlaut_drop', false, false), // missed (no hunspell)
    ]
    const byType = computeRecall(cases, detections, infraOffline)

    expect(byType.genus.injected).toBe(2)
    expect(byType.genus.caught).toBe(1)
    expect(byType.genus.recall).toBeCloseTo(0.5)
    expect(byType.genus.caughtBy).toBe('tier1')

    expect(byType.wrong_answer.injected).toBe(2)
    expect(byType.wrong_answer.caught).toBe(2)
    expect(byType.wrong_answer.recall).toBe(1)
    expect(byType.wrong_answer.caughtBy).toBe('both')

    expect(byType.umlaut_drop.caught).toBe(0)
    expect(byType.umlaut_drop.caughtBy).toBe('none')
  })

  it('flags umlaut_drop / level_violation / bad_translation as unmeasurable offline', () => {
    const cases: MutationCase[] = [
      caseOf('umlaut_drop', 1),
      caseOf('level_violation', 1),
      caseOf('bad_translation', 1),
    ]
    const detections = cases.map((c) => det(c.id, c.type, false, false))
    const byType = computeRecall(cases, detections, infraOffline)

    expect(byType.umlaut_drop.measurable).toBe(false)
    expect(byType.umlaut_drop.note).toMatch(/CHƯA ĐÁNG TIN/)
    expect(byType.level_violation.measurable).toBe(false)
    expect(byType.bad_translation.measurable).toBe(false)
  })

  it('genus + wrong_answer are measurable offline (deterministic Tier-1)', () => {
    const cases: MutationCase[] = [caseOf('genus', 1), caseOf('wrong_answer', 1)]
    const detections = [
      det('genus-1', 'genus', true, false),
      det('wrong_answer-1', 'wrong_answer', true, true),
    ]
    const byType = computeRecall(cases, detections, infraOffline)
    expect(byType.genus.measurable).toBe(true)
    expect(byType.wrong_answer.measurable).toBe(true)
    expect(byType.genus.note).toMatch(/Đáng tin/)
  })

  it('umlaut_drop becomes measurable when hunspell is available', () => {
    const infraHunspell: CalibrationInfra = { ...infraOffline, hunspellAvailable: true }
    const cases = [{ ...({} as MutationCase), id: 'umlaut_drop-1', type: 'umlaut_drop' as const, skill: 'vocabulary' as const, sourceFile: 'x', itemId: 'x', jsonPath: 'p', before: 'a', after: 'b' }]
    const detections = [det('umlaut_drop-1', 'umlaut_drop', true, false)]
    const byType = computeRecall(cases, detections, infraHunspell)
    expect(byType.umlaut_drop.measurable).toBe(true)
    expect(byType.umlaut_drop.recall).toBe(1)
  })
})

// --- 5: content read-only hash guard (on a temp fixture) --------------------

describe('content read-only hash invariant guard', () => {
  it('detects no change when nothing is mutated, and a change when a file edits', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'calib-hash-'))
    try {
      const f = path.join(dir, 'a.json')
      fs.writeFileSync(f, JSON.stringify({ a: 1 }))
      const before = hashTree(dir)

      // unchanged → clean diff, assert passes
      const afterSame = hashTree(dir)
      expect(isCleanDiff(diffTrees(before, afterSame))).toBe(true)
      expect(() => assertContentUnchanged(before, afterSame)).not.toThrow()

      // mutate the file → diff detects it, assert throws loudly
      fs.writeFileSync(f, JSON.stringify({ a: 2 }))
      const afterDiff = hashTree(dir)
      const diff = diffTrees(before, afterDiff)
      expect(diff.changed).toEqual(['a.json'])
      expect(() => assertContentUnchanged(before, afterDiff)).toThrow(/read-only invariant/)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })

  it('detects added and removed files', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'calib-hash-'))
    try {
      fs.writeFileSync(path.join(dir, 'keep.json'), '{}')
      fs.writeFileSync(path.join(dir, 'remove.json'), '{}')
      const before = hashTree(dir)
      fs.rmSync(path.join(dir, 'remove.json'))
      fs.writeFileSync(path.join(dir, 'new.json'), '{}')
      const after = hashTree(dir)
      const diff = diffTrees(before, after)
      expect(diff.removed).toEqual(['remove.json'])
      expect(diff.added).toEqual(['new.json'])
      expect(isCleanDiff(diff)).toBe(false)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})

// --- 6: deterministic seeding -----------------------------------------------

describe('deterministic seedable selection', () => {
  it('mulberry32 is stable for a given seed and differs across seeds', () => {
    const a = mulberry32(1)
    const b = mulberry32(1)
    const c = mulberry32(2)
    const seqA = [a(), a(), a()]
    const seqB = [b(), b(), b()]
    const seqC = [c(), c(), c()]
    expect(seqA).toEqual(seqB)
    expect(seqA).not.toEqual(seqC)
  })

  it('seededShuffle is deterministic for the same seed', () => {
    const items = [1, 2, 3, 4, 5, 6, 7, 8]
    const s1 = seededShuffle(items, mulberry32(42))
    const s2 = seededShuffle(items, mulberry32(42))
    const s3 = seededShuffle(items, mulberry32(7))
    expect(s1).toEqual(s2)
    expect(s1.sort()).toEqual(items) // permutation, no loss
    expect(s1).not.toEqual(s3)
  })
})

// --- sanity: a built Tier1Result from mutated findings is FAIL --------------

describe('mutated-item Tier1Result integration sanity', () => {
  it('genus mutation drives objectiveVerdict to FAIL', () => {
    const res = mutateGenus(vocabFixture())!
    const findings: Tier1Finding[] = checkVocabularyFile('content/x.json', res.mutated)
    const result = buildTier1Result({ files: 1, deStrings: 0 }, findings)
    expect(result.objectiveVerdict).toBe('FAIL')
  })
})
