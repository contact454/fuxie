import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { normalizeText, overlapScore } from '../../scripts/lib/listening-scan'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..')
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']
const EXPECTED_COUNTS: Record<string, number> = {
  'A1/T1': 15,
  'A1/T2': 20,
  'A2/T1': 15,
  'A2/T2': 20,
  'B1/T1': 15,
  'B1/T2': 15,
  'B1/T3': 20,
  'B2/T1': 20,
  'B2/T2': 20,
  'C1/T1': 15,
  'C1/T2': 20,
  'C2/T1': 15,
  'C2/T2': 20,
}
const META_TEMPLATE = /^(In diesem Text geht es um|Der vorliegende Schreibauftrag verlangt)/u
const BANNED_MODEL_TEXT = /ich schreibe wegen|Profe\u00df|akt\u00fcll|das Thema|Gruesse|Gruessen/u

type WritingItem = {
  id: string
  cefrLevel: string
  teil: number
  teilName: string
  textType: string
  register: string
  topic: string
  instruction: string
  situation: string
  contentPoints: string[]
  minWords: number
  maxWords?: number
  modelAnswer: string
  rubric: { criteria: { id: string }[] }
  cefrAudit: { verdict: string; targetLevel: string }
  learningOutcomes: unknown[]
}

function writingRecords(): { file: string; item: WritingItem }[] {
  return LEVELS.flatMap((level) => {
    const dir = path.join(ROOT, 'content', level, 'writing')
    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => {
        const file = path.join(dir, name)
        return { file, item: JSON.parse(fs.readFileSync(file, 'utf8')) as WritingItem }
      })
  })
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length
}

describe('writing D7 readiness', () => {
  it('covers the complete 230-file inventory by CEFR level and Teil', () => {
    const counts: Record<string, number> = {}
    const records = writingRecords()

    for (const { item } of records) {
      const key = `${item.cefrLevel}/T${item.teil}`
      counts[key] = (counts[key] ?? 0) + 1
    }

    expect(records).toHaveLength(230)
    expect(counts).toEqual(EXPECTED_COUNTS)
  })

  it('keeps the writing schema, CEFR metadata, outcomes, and scoring rubric', () => {
    for (const { file, item } of writingRecords()) {
      const label = path.relative(ROOT, file)
      const expectedCriteria =
        item.cefrLevel === 'A1' || item.cefrLevel === 'A2'
          ? ['angemessenheit', 'inhalt', 'korrektheit']
          : ['angemessenheit', 'inhalt', 'kohaerenz', 'korrektheit', 'spektrum']

      for (const field of [
        'id',
        'cefrLevel',
        'teilName',
        'textType',
        'register',
        'topic',
        'instruction',
        'situation',
        'modelAnswer',
      ] as const) {
        expect(item[field]?.trim(), `${label}/${field}`).toBeTruthy()
      }
      expect(item.contentPoints?.length ?? 0, `${label}/contentPoints`).toBeGreaterThan(0)
      expect(item.learningOutcomes?.length ?? 0, `${label}/learningOutcomes`).toBeGreaterThan(0)
      expect(item.cefrAudit?.verdict, `${label}/verdict`).toBe('aligned')
      expect(item.cefrAudit?.targetLevel, `${label}/targetLevel`).toBe(item.cefrLevel)
      expect(
        item.rubric?.criteria.map((criterion) => criterion.id).sort(),
        `${label}/rubric`,
      ).toEqual(expectedCriteria)
    }
  })

  it('keeps every model answer within its declared word range and removes known templates', () => {
    for (const { file, item } of writingRecords()) {
      const label = path.relative(ROOT, file)
      const words = wordCount(item.modelAnswer)

      expect(words, `${label}/minWords`).toBeGreaterThanOrEqual(item.minWords)
      if (typeof item.maxWords === 'number') {
        expect(words, `${label}/maxWords`).toBeLessThanOrEqual(item.maxWords)
      }
      expect(item.modelAnswer, `${label}/meta-template`).not.toMatch(META_TEMPLATE)
      expect(item.modelAnswer, `${label}/banned-model-text`).not.toMatch(BANNED_MODEL_TEXT)
    }
  })

  it('rejects exact and near-exact model answers within each CEFR level', () => {
    const byLevel = new Map<string, { id: string; text: string }[]>()
    for (const { item } of writingRecords()) {
      const bucket = byLevel.get(item.cefrLevel) ?? []
      bucket.push({ id: item.id, text: normalizeText(item.modelAnswer) })
      byLevel.set(item.cefrLevel, bucket)
    }

    for (const [level, items] of byLevel.entries()) {
      for (let left = 0; left < items.length; left++) {
        for (let right = left + 1; right < items.length; right++) {
          const label = `${level}/${items[left].id}/${items[right].id}`
          expect(items[left].text, `${label}/exact`).not.toBe(items[right].text)

          if (items[left].text.length >= 300 && items[right].text.length >= 300) {
            expect(overlapScore(items[left].text, items[right].text), `${label}/overlap`).toBeLessThan(
              0.95,
            )
          }
        }
      }
    }
  })
})
