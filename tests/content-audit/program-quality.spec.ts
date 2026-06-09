import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

import { runItemGates, cellDuplicatePairs, itemContentText, hardVerdict } from '../../scripts/content-quality-gate'
import { isBrokenStem } from '../../scripts/lib/cefr-stem-markers'
import { hasGenericOpener } from '../../scripts/apply-c2-article-regen'

/**
 * Spec `content-program-quality` — Task 1/2/3 properties.
 *   Property 1: Board Completeness — status-board.json has 36 cells + 1187 items.
 *   Property 2: Gate Reuses SSOT — D1/D5 verdict matches the underlying markers.
 *   Property 3: No Machine Auto-Signoff — any "Done (đủ)" cell ⇒ manifest signed.
 */

const ROOT = path.resolve(__dirname, '..', '..')
const BOARD = path.join(ROOT, 'docs', 'content-quality', 'audit-2026-06', 'status-board.json')
const MANIFEST = path.join(ROOT, 'docs', 'content-quality', 'audit-2026-06', 'signoff-manifest.json')

describe('Property 1: board completeness', () => {
  it('status-board.json lists 36 cells and 1187 items', () => {
    expect(fs.existsSync(BOARD)).toBe(true)
    const b = JSON.parse(fs.readFileSync(BOARD, 'utf8'))
    expect(b.totalCells).toBe(36)
    expect(b.totalFiles).toBe(1187)
    expect(Array.isArray(b.cells)).toBe(true)
    expect(b.cells.length).toBe(36)
  })
})

describe('Property 2: gate reuses SSOT', () => {
  it('D1 verdict matches hasGenericOpener on a filler article', () => {
    const filler = { id: 'x', article: { text: 'Der vorliegende Kommentar widmet sich dem Thema Wirtschaftsethik aus einer kritisch-analytischen Perspektive. ' + 'x'.repeat(200) } }
    const g = runItemGates(filler)
    expect(g.d1).toBe('fail')
    expect(hasGenericOpener(itemContentText(filler))).toBe(true)
  })

  it('D5 verdict matches isBrokenStem on a broken stem', () => {
    const broken = { id: 'y', article: { text: 'Ein ganz normaler Sachtext über ein Thema mit genügend Länge. ' + 'y'.repeat(200) }, questions: [{ stem: 'Was impliziert der Text über Schlussfolgerung über Ab welchem Alter kann man am legt der Text nahe?' }] }
    const g = runItemGates(broken)
    expect(g.d5).toBe('fail')
    expect(broken.questions.some((q) => isBrokenStem(q.stem))).toBe(true)
  })

  it('clean item passes D1/D5 and answer-integrity D6', () => {
    const clean = {
      id: 'z',
      topic: 'Rawls',
      article: { text: 'John Rawls entwickelt das Gedankenexperiment des Urzustands hinter einem Schleier des Nichtwissens. ' + 'Rawls '.repeat(40) },
      questions: [{ stem: 'Welches Experiment nennt der Text?', explanation: { key_evidence: 'das Gedankenexperiment des Urzustands' } }],
    }
    const g = runItemGates(clean)
    expect(g.d1).toBe('pass')
    expect(g.d5).toBe('pass')
    expect(g.d6).toBe('pass')
  })

  it('D6 fails when key_evidence not in content', () => {
    const bad = {
      id: 'w', article: { text: 'Ein Text über etwas ganz anderes. ' + 'w'.repeat(200) },
      questions: [{ stem: 'Frage?', explanation: { key_evidence: 'dieser Satz kommt im Text gar nicht vor xyz' } }],
    }
    expect(runItemGates(bad).d6).toBe('fail')
  })

  it('cellDuplicatePairs flags identical content', () => {
    const a = { id: 'a', article: { text: 'Identischer Inhalt zum Testen der Duplikaterkennung. ' + 'dup '.repeat(60) } }
    const b = { id: 'b', article: { text: 'Identischer Inhalt zum Testen der Duplikaterkennung. ' + 'dup '.repeat(60) } }
    expect(cellDuplicatePairs([a, b]).length).toBeGreaterThan(0)
    expect(hardVerdict(runItemGates(a), true)).toBe('fail')
  })
})

describe('Property 3: no machine auto-signoff', () => {
  it('every "Done (đủ)" cell has signed manifest', () => {
    if (!fs.existsSync(BOARD) || !fs.existsSync(MANIFEST)) return
    const b = JSON.parse(fs.readFileSync(BOARD, 'utf8'))
    const m = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'))
    for (const c of b.cells) {
      if (c.status === 'Done (đủ)') {
        expect(m[c.cell]?.signoff, `${c.cell} marked Done(đủ) without manifest signoff`).toBe('signed')
      }
    }
  })
})
