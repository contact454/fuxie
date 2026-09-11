import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..')
const LEVEL_FILE_COUNTS: Record<string, number> = {
  a1: 10,
  a2: 8,
  b1: 6,
  b2: 10,
  c1: 8,
  c2: 6,
}
const REQUIRED_CRITERIA = ['accuracy', 'fluency', 'pronunciation', 'task_completion']
const IPA_SIGNAL = /[ɐ-ʶɑ-ʯəɛɪʊɔœøçχʁʃʒŋɡʔːˈˌ̩̯]/u

function speakingFiles(level: string): string[] {
  const dir = path.join(ROOT, 'content', level, 'speaking')
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => path.join(dir, name))
}

describe('speaking D7 readiness', () => {
  it('covers the complete 48-file speaking inventory', () => {
    const total = Object.entries(LEVEL_FILE_COUNTS).reduce((sum, [level, expected]) => {
      const files = speakingFiles(level)
      expect(files, level).toHaveLength(expected)
      return sum + files.length
    }, 0)

    expect(total).toBe(48)
  })

  it('keeps eight lessons and six complete speaking sentences per file', () => {
    for (const level of Object.keys(LEVEL_FILE_COUNTS)) {
      for (const file of speakingFiles(level)) {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
        const label = path.relative(ROOT, file)

        expect(parsed.lessons, label).toHaveLength(8)
        for (const [index, lesson] of parsed.lessons.entries()) {
          expect(lesson.lessonNumber, `${label}/lesson-${index + 1}`).toBe(index + 1)
          expect(lesson.topicSlug, `${label}/lesson-${index + 1}`).toBe(parsed.topicSlug)
          expect(lesson.sentences, `${label}/lesson-${index + 1}`).toHaveLength(6)

          const ids = new Set<string>()
          for (const sentence of lesson.sentences) {
            const sentenceLabel = `${label}/lesson-${index + 1}/${sentence.id}`
            for (const field of ['id', 'textDe', 'textVi', 'ipa', 'pronunciationNotes']) {
              expect(sentence[field]?.trim(), `${sentenceLabel}/${field}`).toBeTruthy()
            }
            expect(ids.has(sentence.id), `${sentenceLabel}/duplicate-id`).toBe(false)
            ids.add(sentence.id)
          }
        }
      }
    }
  })

  it('rejects blank, pseudo-Latin, or corrupted IPA guidance', () => {
    for (const level of Object.keys(LEVEL_FILE_COUNTS)) {
      for (const file of speakingFiles(level)) {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
        const label = path.relative(ROOT, file)

        for (const lesson of parsed.lessons) {
          for (const sentence of lesson.sentences) {
            const sentenceLabel = `${label}/lesson-${lesson.lessonNumber}/${sentence.id}`
            const ipa = sentence.ipa.trim()
            const inner = ipa.replace(/^[/[]|[/\]]$/g, '')

            expect(IPA_SIGNAL.test(ipa), sentenceLabel).toBe(true)
            expect(/^[\x00-\x7F]+$/.test(inner), `${sentenceLabel}/ascii-pseudo-ipa`).toBe(false)
            expect(ipa, `${sentenceLabel}/corrupt-ipa`).not.toMatch(/\?\?|\uFFFD|[\r\n]/u)
          }
        }
      }
    }
  })

  it('keeps CEFR metadata, outcomes, and the four-part scoring rubric', () => {
    for (const level of Object.keys(LEVEL_FILE_COUNTS)) {
      for (const file of speakingFiles(level)) {
        const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
        const label = path.relative(ROOT, file)
        const expectedLevel = level.toUpperCase()

        expect(parsed.cefrLevel, label).toBe(expectedLevel)
        expect(parsed.cefrAudit?.verdict, label).toBe('aligned')
        expect(parsed.cefrAudit?.targetLevel, label).toBe(expectedLevel)
        expect(parsed.learningOutcomes?.length ?? 0, label).toBeGreaterThan(0)
        expect(
          parsed.evaluationCriteria.map((criterion: { id: string }) => criterion.id).sort(),
          label,
        ).toEqual(REQUIRED_CRITERIA)
      }
    }
  })
})
