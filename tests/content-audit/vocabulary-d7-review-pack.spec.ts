import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import {
  buildReviewPack,
  renderCsv,
  validateReviewPack,
} from '../../scripts/vocabulary-d7-review-pack'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..')
const REVIEW_PACK = path.join(ROOT, 'docs', 'content-quality', 'audit-2026-06', 'vocabulary-d7-review-pack.json')
const REVIEW_PACK_CSV = path.join(ROOT, 'docs', 'content-quality', 'audit-2026-06', 'vocabulary-d7-review-pack.csv')
const FIXED_NOW = '2026-06-10T00:00:00.000Z'
const pack = buildReviewPack(FIXED_NOW)

describe('vocabulary D7 review pack', () => {
  it('covers the full vocabulary inventory and the remaining human-review dimensions', () => {
    expect(validateReviewPack(pack)).toEqual([])
    expect(pack.scope.vocabularyFiles).toBe(369)
    expect(pack.scope.entries).toBe(10_461)
    expect(pack.scope.nouns).toBe(6_159)
    expect(pack.summary.vocabularyCellsCovered).toBe(6)
    expect(pack.summary.reviewItems).toBe(1_482)
    expect(pack.summary.byPriority).toEqual({ P1: 626, P2: 443, P3: 413 })
    expect(pack.summary.byFlag.plural_morphology_pending).toBe(906)
    expect(pack.summary.byFlag.article_missing_or_pluralia_policy).toBe(29)
    expect(pack.summary.byFlag.loanword_policy).toBe(1)
  })

  it('keeps generated reviewer fields blank and includes the silencen policy row', () => {
    const loanword = pack.items.find((item) => item.word === 'silencen')

    expect(loanword?.flags).toContain('loanword_policy')
    expect(loanword?.priority).toBe('P1')
    expect(pack.items.every((item) => item.reviewerVerdict === '' && item.reviewerNotes === '')).toBe(true)
  })

  it('keeps the committed JSON and CSV artifacts in sync with the generator', () => {
    const committed = JSON.parse(fs.readFileSync(REVIEW_PACK, 'utf8'))
    const committedStable = { ...committed, generatedAt: FIXED_NOW }

    expect(committedStable).toEqual(pack)
    expect(fs.readFileSync(REVIEW_PACK_CSV, 'utf8')).toBe(renderCsv(pack))
  })
})
