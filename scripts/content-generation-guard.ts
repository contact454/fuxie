/**
 * Spec `content-program-quality` — Task 6 guard foundation.
 * Fail-fast guard for generated content candidates.
 *
 * This module is intentionally pure: generators can call it before writing
 * content/ to reject known filler/duplicate/topic-loop failures. It reuses the
 * existing single-source helpers instead of redefining markers.
 */
import { hasGenericOpener } from './apply-c2-article-regen'
import { hasGenericOpenerT2 } from './apply-c2-teil2-regen'
import { itemContentText, cellDuplicatePairs } from './content-quality-gate'
import { isBrokenStem } from './lib/cefr-stem-markers'
import { internalDupRatio, normalizeText, topicKeywords } from './lib/listening-scan'

export interface GeneratedCandidate {
  id?: string
  topic?: string
  title?: string
  article?: { title?: string; text?: string }
  section_cloze?: { title?: string; text?: string }
  transcript?: { lines?: Array<{ speaker_role?: string; text?: string }> }
  questions?: Array<{ stem?: string; question?: string; statement?: string }>
}

export interface GenerationGuardViolation {
  code: 'D1' | 'D2' | 'D3' | 'D4' | 'D5'
  id: string
  message: string
}

export interface GenerationGuardResult {
  ok: boolean
  violations: GenerationGuardViolation[]
}

function candidateId(item: GeneratedCandidate, index?: number): string {
  return String(item.id ?? (index == null ? '<unknown>' : `<candidate:${index}>`))
}

function stemsOf(item: GeneratedCandidate): string[] {
  return (item.questions ?? [])
    .map((q) => String(q.stem ?? q.question ?? q.statement ?? ''))
    .filter(Boolean)
}

function declaredTopicText(item: GeneratedCandidate): string {
  return [item.topic, item.title, item.article?.title, item.section_cloze?.title]
    .filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    .join(' ')
}

function hasTopicEvidence(item: GeneratedCandidate): boolean {
  const kws = topicKeywords(declaredTopicText(item))
  if (!kws.length) return true
  const body = normalizeText(itemContentText(item))
  return kws.some((kw) => {
    const stem = kw.length <= 6 ? kw : kw.slice(0, 6)
    return body.includes(stem)
  })
}

export function validateGeneratedItem(item: GeneratedCandidate, index?: number): GenerationGuardViolation[] {
  const id = candidateId(item, index)
  const body = itemContentText(item)
  const violations: GenerationGuardViolation[] = []

  if (hasGenericOpener(body) || hasGenericOpenerT2(body)) {
    violations.push({
      code: 'D1',
      id,
      message: 'generated body matches a known generic filler opener',
    })
  }

  if (!hasTopicEvidence(item)) {
    violations.push({
      code: 'D3',
      id,
      message: 'generated body does not mention the declared topic/title keywords',
    })
  }

  if (item.transcript?.lines && internalDupRatio(item) >= 0.2) {
    violations.push({
      code: 'D4',
      id,
      message: 'generated transcript has repeated dialogue segments (internalDupRatio >= 0.2)',
    })
  }

  const brokenStem = stemsOf(item).find((stem) => isBrokenStem(stem))
  if (brokenStem) {
    violations.push({
      code: 'D5',
      id,
      message: `generated question stem matches a broken-stem marker: ${brokenStem}`,
    })
  }

  return violations
}

export function validateGeneratedBatch(items: GeneratedCandidate[]): GenerationGuardResult {
  const violations: GenerationGuardViolation[] = []
  items.forEach((item, index) => violations.push(...validateGeneratedItem(item, index)))

  for (const pair of cellDuplicatePairs(items)) {
    violations.push({
      code: 'D2',
      id: `${pair.a}~${pair.b}`,
      message: `generated bodies overlap above threshold (${pair.overlap})`,
    })
  }

  return { ok: violations.length === 0, violations }
}

export function assertGeneratedBatchClean(items: GeneratedCandidate[]): void {
  const result = validateGeneratedBatch(items)
  if (!result.ok) {
    const detail = result.violations.map((v) => `${v.code} ${v.id}: ${v.message}`).join('; ')
    throw new Error(`Generated content rejected by content-generation guard: ${detail}`)
  }
}
