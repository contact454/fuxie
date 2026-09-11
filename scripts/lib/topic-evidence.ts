import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { normalizeText, topicKeywords } from './listening-scan'

export interface TopicEvidenceOverride {
  terms: string[]
  rationale: string
  reviewedBy: string
  reviewedAt: string
  nativeSignoff: 'pending' | 'signed'
}

export type TopicEvidenceOverrides = Record<string, TopicEvidenceOverride>

export interface TopicEvidenceResult {
  matches: boolean
  directMatch: boolean
  overrideMatch: boolean
  overrideApplied: boolean
  matchedTerms: string[]
}

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..')
export const DEFAULT_TOPIC_EVIDENCE_PATH = path.join(
  REPO_ROOT,
  'docs',
  'content-quality',
  'audit-2026-06',
  'topic-evidence-overrides.json',
)

function stem(word: string): string {
  return word.length <= 6 ? word : word.slice(0, 6)
}

export function declaredTopicTerms(item: any): string[] {
  return [
    ...topicKeywords(String(item?.topic ?? '')),
    ...topicKeywords(String(
      item?.title
      ?? item?.article?.title
      ?? item?.section_cloze?.title
      ?? item?.opinion_texts?.question
      ?? '',
    )),
  ]
}

function evidenceTerms(terms: readonly string[]): string[] {
  return [...new Set(terms.flatMap((term) => topicKeywords(term)))]
}

function matchingTerms(content: string, terms: readonly string[]): string[] {
  const normalized = normalizeText(content)
  return terms.filter((term) => normalized.includes(stem(term)))
}

export function matchTopicEvidence(
  item: any,
  content: string,
  overrides: TopicEvidenceOverrides = {},
): TopicEvidenceResult {
  const directTerms = declaredTopicTerms(item)
  if (directTerms.length === 0) {
    return {
      matches: true,
      directMatch: true,
      overrideMatch: false,
      overrideApplied: false,
      matchedTerms: [],
    }
  }

  const directHits = matchingTerms(content, directTerms)
  const overrideTerms = evidenceTerms(overrides[String(item?.id ?? '')]?.terms ?? [])
  const overrideHits = matchingTerms(content, overrideTerms)
  const directMatch = directHits.length > 0
  const overrideMatch = overrideHits.length > 0

  return {
    matches: directMatch || overrideMatch,
    directMatch,
    overrideMatch,
    overrideApplied: !directMatch && overrideMatch,
    matchedTerms: directMatch ? directHits : overrideHits,
  }
}

export function loadTopicEvidenceOverrides(
  filePath = DEFAULT_TOPIC_EVIDENCE_PATH,
): TopicEvidenceOverrides {
  if (!fs.existsSync(filePath)) return {}
  const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as TopicEvidenceOverrides
  for (const [id, entry] of Object.entries(parsed)) {
    if (!Array.isArray(entry?.terms) || entry.terms.length === 0) {
      throw new Error(`topic evidence ${id}: terms[] missing/empty`)
    }
    if (!entry.rationale?.trim() || !entry.reviewedBy?.trim() || !entry.reviewedAt?.trim()) {
      throw new Error(`topic evidence ${id}: audit metadata incomplete`)
    }
    if (!['pending', 'signed'].includes(entry.nativeSignoff)) {
      throw new Error(`topic evidence ${id}: invalid nativeSignoff`)
    }
  }
  return parsed
}
