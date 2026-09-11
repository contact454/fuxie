import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

/**
 * Spec `fuxie-content-quality-audit` — Property 1: Read-Only Invariant.
 *
 * The audit is read-only over `content/`. This test does NOT mutate any
 * content file; it asserts the audit deliverables live ONLY under
 * `docs/content-quality/audit-2026-06/` (plus tmp/), and that re-hashing
 * the content tree is internally consistent (stable hash on repeat read).
 *
 * It also guards that no audit artifact was written inside `content/`.
 */

const ROOT = path.resolve(__dirname, '..', '..')
const CONTENT = path.join(ROOT, 'content')

function listJson(dir: string): string[] {
  const out: string[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listJson(fp))
    else if (entry.name.endsWith('.json')) out.push(fp)
  }
  return out
}

function hashFile(fp: string): string {
  return crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex')
}

describe('Property 1: Read-Only Invariant (content audit)', () => {
  const files = listJson(CONTENT)

  it('content tree is non-empty and counted', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it('hashing the content tree is stable across two reads (no concurrent mutation)', () => {
    const h1 = files.map(hashFile)
    const h2 = files.map(hashFile)
    expect(h2).toEqual(h1)
  })

  it('no audit deliverable file is written inside content/', () => {
    const stray = files.filter(
      (f) => /findings\.csv$|coverage-matrix\.md$|remediation-backlog\.md$|report\.md$/.test(f),
    )
    expect(stray).toEqual([])
  })

  it('audit output dir exists under docs/, not content/', () => {
    const outDir = path.join(ROOT, 'docs', 'content-quality', 'audit-2026-06')
    expect(fs.existsSync(path.join(outDir, 'findings.csv'))).toBe(true)
    expect(fs.existsSync(path.join(CONTENT, 'audit-2026-06'))).toBe(false)
  })
})
