import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { itemContentText } from '../../scripts/content-quality-gate'
import {
  loadTopicEvidenceOverrides,
  matchTopicEvidence,
} from '../../scripts/lib/topic-evidence'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..')

function findContentItem(id: string): any {
  const contentRoot = path.join(ROOT, 'content')
  for (const level of fs.readdirSync(contentRoot)) {
    const levelDir = path.join(contentRoot, level)
    if (!fs.statSync(levelDir).isDirectory()) continue
    for (const module of fs.readdirSync(levelDir)) {
      const moduleDir = path.join(levelDir, module)
      if (!fs.statSync(moduleDir).isDirectory()) continue
      for (const name of fs.readdirSync(moduleDir)) {
        if (!name.endsWith('.json') || /\.(qa|meta)\.json$/i.test(name)) continue
        const item = JSON.parse(fs.readFileSync(path.join(moduleDir, name), 'utf8'))
        if (item?.id === id) return item
      }
    }
  }
  throw new Error(`content item not found: ${id}`)
}

describe('topic evidence overrides', () => {
  it('prefers direct declared-topic evidence', () => {
    const item = { id: 'direct', topic: 'Digitale Souveränität' }
    const result = matchTopicEvidence(
      item,
      'Digitale Souveränität verlangt transparente Regeln.',
      {},
    )
    expect(result.directMatch).toBe(true)
    expect(result.overrideApplied).toBe(false)
  })

  it('accepts only an override term that occurs in the content', () => {
    const item = { id: 'functional', topic: 'Sich vorstellen und begrüßen' }
    const overrides = {
      functional: {
        terms: ['willkommen'],
        rationale: 'Functional communicative act.',
        reviewedBy: 'German Academic Lead',
        reviewedAt: '2026-06-10',
        nativeSignoff: 'pending' as const,
      },
    }
    expect(matchTopicEvidence(item, 'Willkommen, ich heiße Mina.', overrides).overrideApplied).toBe(true)
    expect(matchTopicEvidence(item, 'Der Zug fährt um neun Uhr.', overrides).matches).toBe(false)
  })

  it('verifies every audited override against the real content item', () => {
    const overrides = loadTopicEvidenceOverrides()
    for (const id of Object.keys(overrides)) {
      const item = findContentItem(id)
      const result = matchTopicEvidence(item, itemContentText(item), overrides)
      expect(result.overrideApplied, id).toBe(true)
      expect(result.matchedTerms.length, id).toBeGreaterThan(0)
    }
  })
})
