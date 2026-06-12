import { describe, it, expect } from 'vitest'

import {
  type GenerateText,
  type ProviderRunnerStats,
  callWithRetry,
  createProviderRedTeamRunner,
  createProviderReviewerRunner,
  newProviderRunnerStats,
} from '../../scripts/lib/review-board-provider-runner'
import { buildReviewerPrompt, validateReviewerOutput, type ReviewBoardItem } from '../../scripts/lib/review-board-reviewers'
import { buildRedTeamCase, validateRedTeamOutput, type ReadingQuestion } from '../../scripts/lib/review-board-redteam'
import { buildReviewBoardCases } from '../../scripts/lib/review-board-reviewers'

/**
 * Spec `fuxie-content-review-board` — provider-runner follow-up.
 *
 * Verifies the REAL provider runners WITHOUT any network call, by injecting a
 * fake `generate`:
 *   - valid JSON from the model → parsed object that PASSES the caller's validator
 *   - malformed text / thrown error → invalid object that FAILS validation →
 *     caller escalates conservatively (no fabricated pass)
 *   - retry/backoff counts on retryable errors
 */

const item: ReviewBoardItem = {
  itemId: 'Q1',
  level: 'a1',
  type: 'richtig_falsch',
  stem: 'Lisa geht heute einkaufen.',
  answer: 'richtig',
  de: "Im Text steht: 'ich gehe heute in den Supermarkt'.",
  keyEvidence: 'ich gehe heute in den Supermarkt',
  vi: 'Đáp án: richtig.',
}

const question: ReadingQuestion = {
  stem: 'Lisa geht heute einkaufen.',
  options: ['richtig', 'falsch'],
  answer: 'richtig',
}

const noSleep = (_ms: number) => Promise.resolve()

function reviewerCaseFor(reviewer: 'german_linguist' | 'cefr_pedagogy' | 'vn_localization') {
  const cases = buildReviewBoardCases(item)
  return cases.find((c) => c.reviewer === reviewer)!
}

describe('createProviderReviewerRunner', () => {
  it('valid model JSON → object passing validateReviewerOutput', async () => {
    const stats = newProviderRunnerStats()
    const generate: GenerateText = async () =>
      JSON.stringify({
        reviewer: 'german_linguist',
        dimension: 'German',
        verdict: 'ok',
        severity: 'none',
        rationale: 'Grammatical and natural German.',
        evidence: 'explanation.de: "Im Text steht..."',
      })
    const runner = createProviderReviewerRunner({ generate, stats, sleep: noSleep })
    const c = reviewerCaseFor('german_linguist')
    const raw = await runner(c)
    expect(validateReviewerOutput(raw, { expectedReviewer: 'german_linguist' }).ok).toBe(true)
    expect(stats.reviewerCalls).toBe(1)
    expect(stats.reviewerFailures).toBe(0)
  })

  it('handles markdown-fenced JSON (parseGeminiJson)', async () => {
    const generate: GenerateText = async () =>
      '```json\n{"reviewer":"vn_localization","dimension":"VN","verdict":"concern","severity":"P2","rationale":"awkward","evidence":"explanation.vi: \\"...\\""}\n```'
    const runner = createProviderReviewerRunner({ generate, sleep: noSleep })
    const raw = await runner(reviewerCaseFor('vn_localization'))
    expect(validateReviewerOutput(raw, { expectedReviewer: 'vn_localization' }).ok).toBe(true)
  })

  it('malformed model text → invalid object → validation fails (conservative)', async () => {
    const stats = newProviderRunnerStats()
    const generate: GenerateText = async () => 'I cannot answer that.'
    const runner = createProviderReviewerRunner({ generate, stats, sleep: noSleep })
    const raw = await runner(reviewerCaseFor('german_linguist'))
    expect(validateReviewerOutput(raw, { expectedReviewer: 'german_linguist' }).ok).toBe(false)
    expect(stats.reviewerFailures).toBe(1)
  })

  it('thrown error (non-retryable) → invalid object → validation fails', async () => {
    const generate: GenerateText = async () => {
      throw new Error('401 unauthorized')
    }
    const runner = createProviderReviewerRunner({ generate, sleep: noSleep })
    const raw = await runner(reviewerCaseFor('cefr_pedagogy'))
    expect(validateReviewerOutput(raw, { expectedReviewer: 'cefr_pedagogy' }).ok).toBe(false)
  })
})

describe('createProviderRedTeamRunner', () => {
  it('valid JSON → passes validateRedTeamOutput', async () => {
    const generate: GenerateText = async () =>
      JSON.stringify({ predictedAnswer: 'richtig', confidence: 'high', rationale: 'matches text' })
    const runner = createProviderRedTeamRunner({ generate, sleep: noSleep })
    const c = buildRedTeamCase('Q1', question)
    const raw = await runner(c)
    expect(validateRedTeamOutput(raw).ok).toBe(true)
  })

  it('failure → invalid object → validateRedTeamOutput fails (item will escalate)', async () => {
    const stats = newProviderRunnerStats()
    const generate: GenerateText = async () => {
      throw new Error('403 forbidden')
    }
    const runner = createProviderRedTeamRunner({ generate, stats, sleep: noSleep })
    const raw = await runner(buildRedTeamCase('Q1', question))
    expect(validateRedTeamOutput(raw).ok).toBe(false)
    expect(stats.redTeamFailures).toBe(1)
  })
})

describe('callWithRetry backoff', () => {
  it('retries on retryable errors then succeeds, counting attempts', async () => {
    const stats = newProviderRunnerStats()
    let n = 0
    const generate: GenerateText = async () => {
      n++
      if (n < 3) throw new Error('429 Too Many Requests')
      return 'ok'
    }
    const out = await callWithRetry(generate, 'm', 'p', { stats, sleep: noSleep, baseDelayMs: 1 })
    expect(out).toBe('ok')
    expect(stats.providerAttempts).toBe(3)
    expect(stats.retries).toBe(2)
  })

  it('does NOT retry on non-retryable errors', async () => {
    const stats = newProviderRunnerStats()
    const generate: GenerateText = async () => {
      throw new Error('400 bad request')
    }
    await expect(callWithRetry(generate, 'm', 'p', { stats, sleep: noSleep })).rejects.toThrow(/400/)
    expect(stats.providerAttempts).toBe(1)
    expect(stats.retries).toBe(0)
  })

  it('gives up after maxRetries on persistent retryable errors', async () => {
    const stats = newProviderRunnerStats()
    const generate: GenerateText = async () => {
      throw new Error('503 overloaded')
    }
    await expect(
      callWithRetry(generate, 'm', 'p', { stats, sleep: noSleep, maxRetries: 2, baseDelayMs: 1 }),
    ).rejects.toThrow(/503/)
    expect(stats.providerAttempts).toBe(3) // 1 + 2 retries
    expect(stats.retries).toBe(2)
  })
})
