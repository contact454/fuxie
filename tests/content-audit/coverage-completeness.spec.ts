import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Spec `fuxie-content-quality-audit` — Property 2: Coverage Completeness.
 *
 * Every JSON file under content/ is accounted for; total = 1194
 * (1188 skill files + 6 course.json). Each file maps to exactly one
 * level×skill (or course) cell.
 */

const ROOT = path.resolve(__dirname, '..', '..')
const CONTENT = path.join(ROOT, 'content')
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']
const SKILLS = ['grammar', 'listening', 'reading', 'speaking', 'vocabulary', 'writing']

function listJson(dir: string): string[] {
  if (!fs.existsSync(dir)) return []
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listJson(fp))
    else if (entry.name.endsWith('.json')) out.push(fp)
  }
  return out
}

describe('Property 2: Coverage Completeness (content audit)', () => {
  it('total content JSON = 1194 (1188 skill + 6 course.json)', () => {
    const all = listJson(CONTENT)
    expect(all.length).toBe(1194)
  })

  it('every level has a course.json (6 total)', () => {
    const courses = LEVELS.filter((l) => fs.existsSync(path.join(CONTENT, l, 'course.json')))
    expect(courses.length).toBe(6)
  })

  it('every JSON file maps to exactly one level×skill or course cell', () => {
    const all = listJson(CONTENT)
    let mapped = 0
    for (const fp of all) {
      const rel = path.relative(CONTENT, fp).split(path.sep)
      const level = rel[0]
      expect(LEVELS).toContain(level)
      if (rel[1] === 'course.json') {
        mapped++
        continue
      }
      const skill = rel[1]
      // grammar holds grammar-topics.json under content/<level>/grammar/
      expect(SKILLS).toContain(skill)
      mapped++
    }
    expect(mapped).toBe(all.length)
  })
})
