import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

/**
 * Spec `fuxie-content-quality-audit` — Property 3: Finding Evidence Gate.
 *
 * Every row in findings.csv must carry the full required field set with
 * non-empty evidence + recommended_fix, valid severity (P0/P1/P2) and
 * dimension (D1..D9), and a non-empty file_path.
 */

const ROOT = path.resolve(__dirname, '..', '..')
const CSV = path.join(ROOT, 'docs', 'content-quality', 'audit-2026-06', 'findings.csv')

// Minimal RFC-4180-ish CSV parser (handles quoted fields with commas/quotes).
function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++ }
        else inQuotes = false
      } else field += c
    } else if (c === '"') inQuotes = true
    else if (c === ',') { row.push(field); field = '' }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = '' }
    else if (c === '\r') { /* skip */ }
    else field += c
  }
  if (field.length || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.length > 1 || (r.length === 1 && r[0] !== ''))
}

const HEADER = ['finding_id', 'level', 'skill', 'file_path', 'item_id', 'dimension', 'severity', 'evidence', 'recommended_fix']

describe('Property 3: Finding Evidence Gate (content audit)', () => {
  const rows = parseCsv(fs.readFileSync(CSV, 'utf8'))
  const header = rows[0]
  const data = rows.slice(1)

  it('CSV header matches the required field order', () => {
    expect(header).toEqual(HEADER)
  })

  it('every finding is fully evidence-gated', () => {
    for (const r of data) {
      const f = Object.fromEntries(HEADER.map((h, i) => [h, r[i]]))
      expect(f.finding_id, `id on ${JSON.stringify(r)}`).toMatch(/^F-\d{4}$/)
      expect(f.file_path && f.file_path.trim().length, `file_path for ${f.finding_id}`).toBeTruthy()
      expect(f.evidence && f.evidence.trim().length, `evidence for ${f.finding_id}`).toBeTruthy()
      expect(f.recommended_fix && f.recommended_fix.trim().length, `fix for ${f.finding_id}`).toBeTruthy()
      expect(['P0', 'P1', 'P2'], `severity for ${f.finding_id}`).toContain(f.severity)
      expect(f.dimension, `dimension for ${f.finding_id}`).toMatch(/^D[1-9]$/)
    }
  })

  it('finding ids are unique', () => {
    const ids = data.map((r) => r[0])
    expect(new Set(ids).size).toBe(ids.length)
  })
})
