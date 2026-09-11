import { describe, it, expect } from 'vitest'

import {
  REVIEWER_PROMPT_VERSION,
  BOARD_REVIEWER_IDS,
  REVIEWER_ALLOWED_DIMENSIONS,
  REVIEWER_RUBRICS,
  normalizeReadingItem,
  buildReviewerPrompt,
  buildBoardPrompts,
  buildReviewBoardCases,
  validateReviewerOutput,
  reviewerModelDiffers,
  assertReviewerModelDiffers,
  createMockReviewerRunner,
  buildMockReviewerOutput,
  runReviewBoardItem,
  type ReviewBoardItem,
  type BoardReviewerId,
} from '../../scripts/lib/review-board-reviewers'

/**
 * Spec `fuxie-content-review-board` — task 4.1 unit tests.
 *
 * Covers the THREE non-red-team reviewers + the structured ReviewerOutput
 * schema validator + the injectable (credit-free) harness seam:
 *   (a) prompt builder embeds the rubric + the item fields and respects the
 *       per-reviewer allowed dimensions (German / pedagogy+CEFR / VN).
 *   (b) validateReviewerOutput accepts valid outputs and rejects each malformed
 *       variant (free-text-only / missing / out-of-set / wrong dimension).
 *   (c) model-must-differ guard (Req 2.2) and the deterministic mock runner
 *       (Req 2.6) — no real provider is ever called.
 */

const ITEM: ReviewBoardItem = {
  itemId: 'a1/reading/markt#3',
  level: 'a1',
  type: 'richtig_falsch',
  stem: 'Anna geht heute in den Supermarkt.',
  options: ['richtig', 'falsch'],
  answer: 'richtig',
  de: 'Die Aussage ist richtig, weil im Text steht, dass Anna einkaufen geht.',
  vi: 'Đáp án đúng là "richtig" vì trong bài Anna đi siêu thị.',
  keyEvidence: 'Anna geht heute in den Supermarkt',
}

function validOutputFor(reviewer: BoardReviewerId) {
  return {
    reviewer,
    dimension: REVIEWER_ALLOWED_DIMENSIONS[reviewer][0],
    verdict: 'ok' as const,
    severity: 'none' as const,
    rationale: 'German is grammatical and matches the A1 level.',
    evidence: 'explanation.de: "Die Aussage ist richtig..."',
  }
}

// ---------------------------------------------------------------------------
// (a) reviewers + dimensions
// ---------------------------------------------------------------------------
describe('board reviewers cover German / pedagogy+CEFR / VN', () => {
  it('exposes exactly the 3 non-red-team reviewers', () => {
    expect([...BOARD_REVIEWER_IDS]).toEqual(['german_linguist', 'cefr_pedagogy', 'vn_localization'])
    expect(BOARD_REVIEWER_IDS).not.toContain('redteam_blind')
  })

  it('maps each reviewer to its dimension set', () => {
    expect(REVIEWER_ALLOWED_DIMENSIONS.german_linguist).toEqual(['German'])
    expect(REVIEWER_ALLOWED_DIMENSIONS.cefr_pedagogy).toEqual(['pedagogy', 'CEFR'])
    expect(REVIEWER_ALLOWED_DIMENSIONS.vn_localization).toEqual(['VN'])
  })

  it('every rubric cites its source docs (provenance, Req 2.5)', () => {
    for (const reviewer of BOARD_REVIEWER_IDS) {
      const rubric = REVIEWER_RUBRICS[reviewer]
      expect(rubric.checklist.length).toBeGreaterThan(0)
      expect(rubric.sources.length).toBeGreaterThan(0)
    }
    // Each reviewer is grounded in the expected primary doc.
    expect(REVIEWER_RUBRICS.german_linguist.sources.join(' ')).toMatch(/bilingual-style-guide/)
    expect(REVIEWER_RUBRICS.cefr_pedagogy.sources.join(' ')).toMatch(/cefr-audit-checklist/)
    expect(REVIEWER_RUBRICS.vn_localization.sources.join(' ')).toMatch(
      /vietnamese-german-localization/,
    )
  })
})

// ---------------------------------------------------------------------------
// normalizeReadingItem
// ---------------------------------------------------------------------------
describe('normalizeReadingItem', () => {
  it('maps statement/stem/situation + explanation fields without mutating input', () => {
    const raw = {
      type: 'richtig_falsch',
      statement: 'Anna geht einkaufen.',
      options: ['richtig', 'falsch'],
      answer: 'richtig',
      explanation: { de: 'Begründung', vi: 'Giải thích', key_evidence: 'Anna geht' },
    }
    const before = JSON.stringify(raw)
    const item = normalizeReadingItem(raw, { itemId: 'x#0', level: 'a1' })
    expect(item.stem).toBe('Anna geht einkaufen.')
    expect(item.de).toBe('Begründung')
    expect(item.vi).toBe('Giải thích')
    expect(item.keyEvidence).toBe('Anna geht')
    expect(item.answer).toBe('richtig')
    expect(JSON.stringify(raw)).toBe(before) // read-only
  })

  it('derives answer from correctIndex when answer is absent', () => {
    const item = normalizeReadingItem(
      { stem: 'q', correctIndex: 2, options: ['a', 'b', 'c'] },
      { itemId: 'y#1', level: 'b1' },
    )
    expect(item.answer).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// (a) prompt builder
// ---------------------------------------------------------------------------
describe('buildReviewerPrompt', () => {
  it('embeds the prompt version, persona, every rubric line and the item fields', () => {
    const p = buildReviewerPrompt('german_linguist', ITEM)
    expect(p.promptVersion).toBe(REVIEWER_PROMPT_VERSION)
    expect(p.prompt).toContain(REVIEWER_PROMPT_VERSION)
    for (const line of REVIEWER_RUBRICS.german_linguist.checklist) {
      expect(p.prompt).toContain(line)
    }
    // Item fields are present (these 3 reviewers ARE allowed to see answer/explanation).
    expect(p.prompt).toContain(ITEM.stem)
    expect(p.prompt).toContain(ITEM.de!)
    // vi is JSON-escaped in the prompt (inner quotes), so assert a quote-free slice.
    expect(p.prompt).toContain('vì trong bài Anna đi siêu thị')
    expect(p.prompt).toContain(ITEM.keyEvidence!)
    expect(p.prompt).toContain('explanation.vi')
    expect(p.prompt).toContain('"richtig"')
  })

  it('restricts the JSON dimension scope to the reviewer allowed set', () => {
    const ped = buildReviewerPrompt('cefr_pedagogy', ITEM)
    expect(ped.dimensionScope).toEqual(['pedagogy', 'CEFR'])
    expect(ped.prompt).toContain('"pedagogy" | "CEFR"')
    expect(ped.prompt).not.toContain('"answer"') // red-team only (task 4.2)
  })

  it('buildBoardPrompts returns one independent prompt per reviewer', () => {
    const prompts = buildBoardPrompts(ITEM)
    expect(prompts.map((p) => p.reviewer)).toEqual([...BOARD_REVIEWER_IDS])
    // Independent contexts: distinct prompt strings, no shared mutable state.
    const texts = new Set(prompts.map((p) => p.prompt))
    expect(texts.size).toBe(prompts.length)
  })
})

// ---------------------------------------------------------------------------
// (c) model-must-differ (Req 2.2)
// ---------------------------------------------------------------------------
describe('model-must-differ guard (Req 2.2)', () => {
  it('reviewerModelDiffers is case/whitespace-insensitive', () => {
    expect(reviewerModelDiffers('model-A', 'model-B')).toBe(true)
    expect(reviewerModelDiffers('Model-A', ' model-a ')).toBe(false)
  })

  it('assertReviewerModelDiffers throws when reviewer model equals content model', () => {
    expect(() =>
      assertReviewerModelDiffers({ reviewerModel: 'gemma', contentModel: 'gemma' }),
    ).toThrow(/DIFFER/)
  })

  it('buildReviewerPrompt enforces the differ constraint when a model config is given', () => {
    expect(() =>
      buildReviewerPrompt('vn_localization', ITEM, {
        model: { reviewerModel: 'reviewer-x', contentModel: 'content-y' },
      }),
    ).not.toThrow()
    expect(() =>
      buildReviewerPrompt('vn_localization', ITEM, {
        model: { reviewerModel: 'same', contentModel: 'same' },
      }),
    ).toThrow(/DIFFER/)
  })
})

// ---------------------------------------------------------------------------
// (b) schema validator (Req 2.4)
// ---------------------------------------------------------------------------
describe('validateReviewerOutput — accepts valid', () => {
  it('accepts a well-formed output for each reviewer', () => {
    for (const reviewer of BOARD_REVIEWER_IDS) {
      const res = validateReviewerOutput(validOutputFor(reviewer), { expectedReviewer: reviewer })
      expect(res).toEqual({ ok: true, errors: [] })
    }
  })

  it('accepts cefr_pedagogy emitting either pedagogy or CEFR', () => {
    for (const dimension of ['pedagogy', 'CEFR'] as const) {
      const res = validateReviewerOutput(
        {
          reviewer: 'cefr_pedagogy',
          dimension,
          verdict: 'concern',
          severity: 'P2',
          rationale: 'r',
          evidence: 'e',
        },
        { expectedReviewer: 'cefr_pedagogy' },
      )
      expect(res.ok).toBe(true)
    }
  })
})

describe('validateReviewerOutput — rejects malformed', () => {
  it('rejects free-text-only / non-object', () => {
    expect(validateReviewerOutput('looks good to me').ok).toBe(false)
    expect(validateReviewerOutput(null).ok).toBe(false)
    expect(validateReviewerOutput([validOutputFor('german_linguist')]).ok).toBe(false)
  })

  it('rejects missing required fields', () => {
    const { reviewer, dimension, verdict, severity } = validOutputFor('german_linguist')
    const res = validateReviewerOutput({ reviewer, dimension, verdict, severity })
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/rationale/)
    expect(res.errors.join(' ')).toMatch(/evidence/)
  })

  it('rejects empty rationale/evidence (whitespace only)', () => {
    const res = validateReviewerOutput({
      ...validOutputFor('german_linguist'),
      rationale: '   ',
      evidence: '',
    })
    expect(res.ok).toBe(false)
  })

  it('rejects out-of-set verdict and severity', () => {
    expect(
      validateReviewerOutput({ ...validOutputFor('german_linguist'), verdict: 'approved' }).ok,
    ).toBe(false)
    expect(
      validateReviewerOutput({ ...validOutputFor('german_linguist'), severity: 'critical' }).ok,
    ).toBe(false)
  })

  it('rejects a dimension outside the reviewer allowed set', () => {
    const res = validateReviewerOutput(
      { ...validOutputFor('german_linguist'), dimension: 'VN' },
      { expectedReviewer: 'german_linguist' },
    )
    expect(res.ok).toBe(false)
    expect(res.errors.join(' ')).toMatch(/not allowed for german_linguist/)
  })

  it('rejects the reserved red-team "answer" dimension for these reviewers', () => {
    const res = validateReviewerOutput(
      { ...validOutputFor('cefr_pedagogy'), dimension: 'answer' },
      { expectedReviewer: 'cefr_pedagogy' },
    )
    expect(res.ok).toBe(false)
  })

  it('rejects verdict/severity incoherence (ok must be none)', () => {
    expect(
      validateReviewerOutput({ ...validOutputFor('german_linguist'), verdict: 'ok', severity: 'P1' })
        .ok,
    ).toBe(false)
    expect(
      validateReviewerOutput({
        ...validOutputFor('german_linguist'),
        verdict: 'fail',
        severity: 'none',
      }).ok,
    ).toBe(false)
  })

  it('rejects a mismatched reviewer id when expectedReviewer is set', () => {
    const res = validateReviewerOutput(validOutputFor('vn_localization'), {
      expectedReviewer: 'german_linguist',
    })
    expect(res.ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// (c) injectable runner + deterministic mock (Req 2.6) — no provider credit
// ---------------------------------------------------------------------------
describe('harness seam — injectable runner + dry-run mock', () => {
  it('buildReviewBoardCases yields one case per reviewer with a stable caseId', () => {
    const cases = buildReviewBoardCases(ITEM)
    expect(cases.map((c) => c.reviewer)).toEqual([...BOARD_REVIEWER_IDS])
    expect(cases.map((c) => c.caseId)).toEqual(
      BOARD_REVIEWER_IDS.map((r) => `${ITEM.itemId}::${r}`),
    )
  })

  it('mock outputs are valid against the schema for their reviewer', () => {
    for (const reviewer of BOARD_REVIEWER_IDS) {
      const out = buildMockReviewerOutput(reviewer)
      expect(validateReviewerOutput(out, { expectedReviewer: reviewer })).toEqual({
        ok: true,
        errors: [],
      })
    }
  })

  it('runReviewBoardItem uses the injected runner and validates every output (no provider call)', async () => {
    let calls = 0
    const runner = createMockReviewerRunner()
    const spyRunner = async (c: Parameters<typeof runner>[0]) => {
      calls += 1
      return runner(c)
    }
    const results = await runReviewBoardItem(ITEM, spyRunner)
    expect(calls).toBe(3)
    expect(results).toHaveLength(3)
    for (const r of results) {
      expect(r.validation.ok).toBe(true)
      expect(r.output).not.toBeNull()
    }
  })

  it('runReviewBoardItem surfaces validation failure from a bad runner without throwing', async () => {
    const badRunner = async () => ({ reviewer: 'german_linguist', note: 'free text only' })
    const results = await runReviewBoardItem(ITEM, badRunner)
    expect(results.every((r) => r.output === null)).toBe(true)
    expect(results.every((r) => !r.validation.ok)).toBe(true)
  })
})
