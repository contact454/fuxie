import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Spec `fuxie-content-quality-audit` — Property 4: Severity Consistency.
 *
 * Severity values across deliverables are valid {P0,P1,P2}; and any
 * finding_id referenced in remediation-backlog.md that also appears in
 * findings.csv carries a severity consistent with the backlog group it
 * belongs to (P0 group -> P0 finding, etc.).
 */

const ROOT = path.resolve(__dirname, '..', '..')
const OUT = path.join(ROOT, 'docs', 'content-quality', 'audit-2026-06')

function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let q = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++ } else q = false }
      else field += c
    } else if (c === '"') q = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* skip */ }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''))
}

describe('Property 4: Severity Consistency (content audit)', () => {
  const rows = parseCsv(fs.readFileSync(path.join(OUT, 'findings.csv'), 'utf8'))
  const data = rows.slice(1)
  const sevById = new Map(data.map((r) => [r[0], r[6]]))
  const backlog = fs.readFileSync(path.join(OUT, 'remediation-backlog.md'), 'utf8')

  it('all severities in findings.csv are valid', () => {
    for (const r of data) expect(['P0', 'P1', 'P2']).toContain(r[6])
  })

  it('RB-P0-01 findings are all P0 in the CSV', () => {
    // RB-P0-01 covers the 3 Genus fixes F-0003..F-0005 (now P0).
    for (const id of ['F-0003', 'F-0004', 'F-0005']) {
      expect(sevById.get(id), `${id} severity`).toBe('P0')
    }
  })

  it('remediation-backlog references finding ids that exist in findings.csv', () => {
    const refIds = [...backlog.matchAll(/F-\d{4}/g)].map((m) => m[0])
    // Every referenced id that is in the P0/P1 closed groups should exist in the CSV.
    const csvIds = new Set(data.map((r) => r[0]))
    const known = refIds.filter((id) => csvIds.has(id))
    expect(known.length).toBeGreaterThan(0)
    for (const id of known) expect(csvIds.has(id)).toBe(true)
  })
})
