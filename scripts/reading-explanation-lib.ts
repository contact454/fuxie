/**
 * Shared helpers for spec `reading-explanation-regeneration` (RB-P2-02).
 *
 * Pure, read-only utilities: classify a reading question's explanation.de
 * quality (Rich / Templated / Thin) and detect boilerplate explanation.vi.
 * No file writes here — consumed by the classifier verifier, the batch
 * script (dry-run), and the PBT spec.
 */
import fs from 'node:fs'
import path from 'node:path'

export const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const
export type Level = (typeof LEVELS)[number]

export type DeClass = 'rich' | 'templated' | 'thin'

export interface ReadingQuestionRef {
  level: string
  file: string // path relative to repo root, forward slashes
  questionId: string
  index: number
  answer: string | number | null
  de: string
  vi: string
  deClass: DeClass
  viBoilerplate: boolean
}

// Boilerplate VI: starts with "Đáp án đúng là" AND ends with the generic
// "Hãy đối chiếu..." tail. Either signal alone is treated as boilerplate tail.
const VI_BOILERPLATE_TAIL = /Hãy đối chiếu với thông tin then chốt trong bài (đọc|nghe)\.?\s*$/i

export function isBoilerplateVi(vi: string): boolean {
  if (!vi || !vi.trim()) return true // empty counts as needs-fix
  return VI_BOILERPLATE_TAIL.test(vi.trim())
}

export function classifyDe(de: string): DeClass {
  const s = (de ?? '').trim()
  if (s.length < 15) return 'thin'
  if (/^Die richtige Antwort ist/i.test(s)) return 'templated'
  return 'rich'
}

function isSidecar(name: string): boolean {
  return /\.qa\.json$/i.test(name) || /\.meta\.json$/i.test(name)
}

function answerOf(q: any): string | number | null {
  if (q.answer != null) return q.answer
  if (q.correctIndex != null) return q.correctIndex
  if (q.correct != null) return q.correct
  if (q.solution != null) return q.solution
  return null
}

/** Scan all reading questions (optionally one level). Read-only. */
export function scanReadingQuestions(repoRoot: string, level?: string): ReadingQuestionRef[] {
  const out: ReadingQuestionRef[] = []
  const levels = level ? [level] : (LEVELS as readonly string[])
  for (const lv of levels) {
    const dir = path.join(repoRoot, 'content', lv, 'reading')
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json') || isSidecar(name)) continue
      const fp = path.join(dir, name)
      let j: any
      try {
        j = JSON.parse(fs.readFileSync(fp, 'utf8'))
      } catch {
        continue
      }
      if (!Array.isArray(j.questions)) continue
      const rel = path.relative(repoRoot, fp).split(path.sep).join('/')
      j.questions.forEach((q: any, i: number) => {
        const ans = answerOf(q)
        if (ans == null) return // only answer-bearing questions
        const exp = q.explanation ?? {}
        const de = typeof exp.de === 'string' ? exp.de : ''
        const vi = typeof exp.vi === 'string' ? exp.vi : ''
        out.push({
          level: lv,
          file: rel,
          questionId: String(q.id ?? i),
          index: i,
          answer: ans,
          de,
          vi,
          deClass: classifyDe(de),
          viBoilerplate: isBoilerplateVi(vi),
        })
      })
    }
  }
  return out
}

export function summarize(refs: ReadingQuestionRef[]) {
  const byLevel: Record<string, number> = {}
  const byClass: Record<DeClass, number> = { rich: 0, templated: 0, thin: 0 }
  let boilerplate = 0
  for (const r of refs) {
    byLevel[r.level] = (byLevel[r.level] || 0) + 1
    byClass[r.deClass]++
    if (r.viBoilerplate) boilerplate++
  }
  return { total: refs.length, byLevel, byClass, boilerplate }
}
