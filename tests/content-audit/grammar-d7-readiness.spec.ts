import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..')
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']

describe('grammar D7 readiness', () => {
  it('every grammar topic has at least three learner-facing exercises', () => {
    for (const level of LEVELS) {
      const file = path.join(ROOT, 'content', level, 'grammar', 'grammar-topics.json')
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
      for (const topic of parsed.topics ?? []) {
        expect(topic.exercises?.length ?? 0, `${level}/${topic.slug}`).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('every grammar topic keeps CEFR audit and learning outcome metadata', () => {
    for (const level of LEVELS) {
      const file = path.join(ROOT, 'content', level, 'grammar', 'grammar-topics.json')
      const parsed = JSON.parse(fs.readFileSync(file, 'utf8'))
      for (const topic of parsed.topics ?? []) {
        expect(topic.cefrLevel, `${level}/${topic.slug}`).toBe(level.toUpperCase())
        expect(topic.cefrAudit?.verdict, `${level}/${topic.slug}`).toBe('aligned')
        expect(topic.cefrAudit?.targetLevel, `${level}/${topic.slug}`).toBe(level.toUpperCase())
        expect(topic.learningOutcomes?.length ?? 0, `${level}/${topic.slug}`).toBeGreaterThan(0)
      }
    }
  })
})
