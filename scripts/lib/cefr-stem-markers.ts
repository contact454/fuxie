/**
 * Spec `content-cefr-stem-regeneration` — Task 1.
 * Broken-stem marker detector (single source of truth) + read-only scanner.
 *
 * Vai chinh: German Content Writer
 * Vai phoi hop: German Academic Lead, Content QA / Linguistic Reviewer, AI / LLM Engineer
 *
 * The CEFR reading question-generator (Teil "Kommentar verstehen") concatenated
 * a generic question frame with a raw sub-prompt, producing `stem`s that are
 * ungrammatical and/or mismatched to the answer. These high-precision markers
 * detect that defect. They are the SAME markers used to build
 * `cefr-stem-worklist.csv`, and act as the closing gate (0 remaining) after the
 * stems are rewritten (Property 1 / Req 1.5).
 *
 * READ-ONLY: scanning never writes to content/.
 */
import fs from 'node:fs'
import path from 'node:path'

/** High-precision markers of the template-concatenation bug. */
export const BROKEN_STEM_MARKERS: readonly RegExp[] = [
  /bezüglich\s+[a-zäöüß]+t\b/i, // "bezüglich fordert/steht ..." (finite verb after bezüglich)
  /\bvon\s+(Warum|Worin|Worauf|Wie|Was|Wodurch|Inwiefern)\b/i, // "Betrachtung von Warum ..."
  /\bvon\s+sich\b/i, // "Analyse von sich die ..."
  /\bvon\s+bot\b/i,
  /Ausführungen zu .+ mit der Gesamtthese/i, // frame mismatched to a recall answer
  /Darstellung von .+ (primär|die Gesamt)/i,
  /\baus der kritischen Betrachtung von\b/i,
  /über .+ über .+/i, // double "über ... über ..." concatenation
] as const

/** True iff the stem matches any broken-stem marker. */
export function isBrokenStem(stem: string): boolean {
  if (!stem || !stem.trim()) return false
  return BROKEN_STEM_MARKERS.some((re) => re.test(stem))
}

export interface StemRef {
  file: string // content-relative, forward slashes
  itemId: string
  level: string
  type: string
  stem: string
}

const DEFAULT_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const

function isSidecar(name: string): boolean {
  return /\.(qa|meta)\.json$/i.test(name)
}

function stemOf(q: any): string {
  return String(q?.stem ?? q?.statement ?? q?.situation ?? '')
}

/**
 * Scan reading questions for broken stems (read-only). Defaults to the
 * affected levels b2/c1/c2 (a1/a2/b1 are clean) but accepts any subset.
 */
export function scanBrokenStems(
  repoRoot: string,
  levels: readonly string[] = ['b2', 'c1', 'c2'],
): StemRef[] {
  const out: StemRef[] = []
  for (const lv of levels) {
    const dir = path.join(repoRoot, 'content', lv, 'reading')
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir).sort()) {
      if (!name.endsWith('.json') || isSidecar(name)) continue
      let j: any
      try {
        j = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))
      } catch {
        continue
      }
      if (!Array.isArray(j.questions)) continue
      const rel = `content/${lv}/reading/${name}`
      for (const q of j.questions) {
        const stem = stemOf(q)
        if (stem && isBrokenStem(stem)) {
          out.push({ file: rel, itemId: String(q.id ?? ''), level: lv, type: String(q.type ?? ''), stem })
        }
      }
    }
  }
  return out
}

export { DEFAULT_LEVELS }
