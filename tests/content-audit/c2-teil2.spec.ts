import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

import {
  hasGenericOpenerT2,
  gapMarkers,
  validateClozePatch,
  applyClozeRegen,
  type ClozeRegenPatch,
} from '../../scripts/apply-c2-teil2-regen'
import { normalizeText, overlapScore } from '../../scripts/lib/listening-scan'

/**
 * Spec `content-c2-teil2-regeneration` — Task 1.
 *   Property 1: No Placeholder — generic-filler opener detected; the 12
 *               worklist files currently DO carry it (documents the P0).
 *   Property 2: Cloze Structure Integrity — validateClozePatch enforces 8 gaps,
 *               answers map ⊂ sections, distractor ∉ answers.
 *   Property 3: No Duplicate Cloze — overlap of cloze bodies < 0.5 (today the
 *               worklist is one shared filler, so it FAILS until regenerated).
 *   Property 4: Scope — applyClozeRegen keeps schema, replaces only cloze.
 */

const ROOT = path.resolve(__dirname, '..', '..')
const WORKLIST = [
  'C2-T2-001', 'C2-T2-002', 'C2-T2-003', 'C2-T2-004', 'C2-T2-005', 'C2-T2-006',
  'C2-T2-007', 'C2-T2-008', 'C2-T2-009', 'C2-T2-010', 'C2-T2-011', 'C2-T2-012',
]
// Extend as each file lands; closing gate (Task 3) = equals WORKLIST + opener 0.
const REGENERATED: string[] = []

const goodPatch = (): ClozeRegenPatch => ({
  title: 'Die Legitimation staatlicher Gewalt',
  text:
    'Die Frage nach der Legitimation staatlicher Gewalt zählt zu den ältesten Problemen der Rechtsphilosophie. {1} ' +
    'Bereits in der Antike wurde diskutiert, worauf sich die Autorität des Gesetzgebers gründet. {2} ' +
    'Die Vertragstheoretiker der Neuzeit verlegten den Ursprung der Legitimität in einen fiktiven Gesellschaftsvertrag. {3} ' +
    'Im Gegensatz dazu betonte die naturrechtliche Tradition überpositive Maßstäbe. {4} ' +
    'Der Rechtspositivismus wiederum trennte die Geltung des Rechts strikt von seiner moralischen Begründung. {5} ' +
    'Moderne Demokratietheorien verknüpfen Legitimität mit Verfahren und Partizipation. {6} ' +
    'Die internationale Dimension wirft die Frage nach übernationaler Rechtsetzung auf. {7} ' +
    'Insgesamt bleibt die Legitimation staatlicher Gewalt ein bestrittenes und dynamisches Feld. {8}',
  sections: [
    { id: 'A', text: 'Hobbes etwa begründete die Notwendigkeit eines starken Souveräns mit dem Naturzustand des Krieges aller gegen alle.' },
    { id: 'B', text: 'Diese Auffassung trennt die Frage der Rechtsgeltung von jener der Gerechtigkeit.' },
    { id: 'C', text: 'Hier wird die Zustimmung der Regierten zum entscheidenden Kriterium erhoben.' },
    { id: 'D', text: 'Schon Platon und Aristoteles fragten nach dem Verhältnis von Macht und Recht.' },
    { id: 'E', text: 'Dabei gelten Normen nur dann als legitim, wenn sie aus einem fairen Verfahren hervorgehen.' },
    { id: 'F', text: 'Supranationale Ordnungen wie die Europäische Union stellen klassische Souveränitätsbegriffe infrage.' },
    { id: 'G', text: 'Naturrechtler beriefen sich auf eine dem positiven Gesetz vorgelagerte Ordnung.' },
    { id: 'H', text: 'Die Debatte verschiebt sich somit fortlaufend mit den gesellschaftlichen Verhältnissen.' },
    { id: 'I', text: 'Eine rein machtbezogene Deutung greift dabei zu kurz und verfehlt die normative Dimension.' },
  ],
  answers: { '1': 'D', '2': 'A', '3': 'C', '4': 'G', '5': 'B', '6': 'E', '7': 'F', '8': 'H' },
  distractor: 'I',
})

const fileText = () =>
  JSON.stringify(
    {
      id: 'C2-T2-001', level: 'C2', teil: 2, teil_name: 'Lückentext (Textabschnitte)',
      topic: 'Rechtsphilosophie',
      metadata: { word_count: 247 },
      section_cloze: {
        title: 'old', text: "Der folgende Bericht untersucht das Thema 'X' aus interdisziplinärer Perspektive. {1}",
        sections: [{ id: 'A', text: 'x' }], answers: { '1': 'A' }, distractor: 'B',
      },
      images: [{ id: 'IMG1' }], scoring: { total_points: 8 }, qa: { passed: true },
      cefrAudit: { targetLevel: 'C2', verdict: 'aligned' }, learningOutcomes: [{ id: 'lo' }],
    },
    null, 2,
  )

// ---------------------------------------------------------------------------
// Property 1 — generic-filler opener + per-file baseline
// ---------------------------------------------------------------------------
describe('Property 1: generic-filler opener (Teil 2)', () => {
  it('detects the templated opener and passes real text', () => {
    expect(hasGenericOpenerT2("Der folgende Bericht untersucht das Thema 'Rechtsphilosophie' aus interdisziplinärer Perspektive.")).toBe(true)
    expect(hasGenericOpenerT2('Die Frage nach der Legitimation staatlicher Gewalt ...')).toBe(false)
  })

  it('tracks regeneration progress: regenerated files are clean, the rest still carry the P0 opener', () => {
    const stillPlaceholder: string[] = []
    const regeneratedClean: string[] = []
    for (const id of WORKLIST) {
      const fp = path.join(ROOT, 'content', 'c2', 'reading', `${id}.json`)
      if (!fs.existsSync(fp)) continue
      const j = JSON.parse(fs.readFileSync(fp, 'utf8'))
      const opener = hasGenericOpenerT2(j?.section_cloze?.text ?? '')
      if (REGENERATED.includes(id)) {
        expect(opener, `${id} regenerated but still has the placeholder opener`).toBe(false)
        if (!opener) regeneratedClean.push(id)
      } else if (opener) {
        stillPlaceholder.push(id)
      }
    }
    expect(regeneratedClean.sort()).toEqual([...REGENERATED].sort())
    expect(stillPlaceholder.length).toBe(WORKLIST.length - REGENERATED.length)
  })
})

// ---------------------------------------------------------------------------
// Property 2 — cloze structure integrity
// ---------------------------------------------------------------------------
describe('Property 2: validateClozePatch', () => {
  it('accepts a well-formed cloze patch', () => {
    expect(validateClozePatch(goodPatch(), 'Rechtsphilosophie').ok).toBe(true)
  })

  it('gapMarkers counts distinct {n}', () => {
    expect(gapMarkers('a {1} b {2} c {3}')).toEqual([1, 2, 3])
  })

  it('rejects wrong number of gaps', () => {
    const p = goodPatch(); p.text = p.text.replace('{8}', '')
    const r = validateClozePatch(p, 'Rechtsphilosophie')
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/gap markers/)
  })

  it('rejects answers pointing to a non-existent section', () => {
    const p = goodPatch(); p.answers['1'] = 'Z'
    const r = validateClozePatch(p, 'Rechtsphilosophie')
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/not in sections/)
  })

  it('rejects a distractor that is also used as an answer', () => {
    const p = goodPatch(); p.distractor = 'A'
    const r = validateClozePatch(p, 'Rechtsphilosophie')
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/also an answer/)
  })

  it('rejects text that still uses the generic opener', () => {
    const p = goodPatch()
    p.text = "Der folgende Bericht untersucht das Thema 'Rechtsphilosophie' aus interdisziplinärer Perspektive. " + p.text
    const r = validateClozePatch(p, 'Rechtsphilosophie')
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/generic-filler opener/)
  })

  it('rejects text that does not mention the topic', () => {
    const p = goodPatch()
    p.title = 'Etwas Anderes'
    p.text = p.text.replace(/Legitimation staatlicher Gewalt|Rechtsphilosophie/g, 'Quantenmechanik')
    const r = validateClozePatch(p, 'Rechtsphilosophie')
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/does not mention the declared topic/)
  })
})

// ---------------------------------------------------------------------------
// Property 3 — no duplicate cloze (documents current shared-filler state)
// ---------------------------------------------------------------------------
describe('Property 3: duplicate-cloze detection', () => {
  it('overlapScore flags the shared filler and clears distinct bodies', () => {
    const a = normalizeText('Die Komplexität des Gegenstandes erfordert eine differenzierte Betrachtung, die historische Entwicklungslinien berücksichtigt.')
    expect(overlapScore(a, a)).toBeGreaterThanOrEqual(0.95)
    const b = normalizeText('Die Frage nach der Legitimation staatlicher Gewalt zählt zu den ältesten Problemen der Rechtsphilosophie der Antike.')
    expect(overlapScore(a, b)).toBeLessThan(0.5)
  })
})

// ---------------------------------------------------------------------------
// Property 4 — apply keeps schema, replaces only section_cloze
// ---------------------------------------------------------------------------
describe('Property 4: applyClozeRegen keeps schema', () => {
  it('replaces section_cloze but keeps id/level/metadata/scoring/qa/learningOutcomes', () => {
    const r = applyClozeRegen(fileText(), goodPatch())
    expect(r.error).toBeUndefined()
    const after = JSON.parse(r.text)
    expect(after.id).toBe('C2-T2-001')
    expect(after.level).toBe('C2')
    expect(after.metadata.word_count).toBe(247)
    expect(after.scoring.total_points).toBe(8)
    expect(after.qa.passed).toBe(true)
    expect(after.learningOutcomes[0].id).toBe('lo')
    expect(after.cefrAudit.verdict).toBe('pending_reaudit')
    expect(after.section_cloze.text).not.toMatch(/Der folgende Bericht untersucht/)
    expect(Object.keys(after.section_cloze.answers)).toHaveLength(8)
  })

  it('aborts (no output) on an invalid patch', () => {
    const bad = goodPatch(); bad.answers['1'] = 'Z'
    const text = fileText()
    const r = applyClozeRegen(text, bad)
    expect(r.error).toBeTruthy()
    expect(r.text).toBe(text)
  })
})
