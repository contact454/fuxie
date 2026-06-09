/**
 * Spec `content-program-quality` — Task 1.
 * Unified content QA gate engine (D1–D6) — READ-ONLY, reuses SSOT.
 *
 * Vai chinh: Content QA / Linguistic Reviewer
 * Vai phoi hop: AI / LLM Engineer, German Academic Lead
 *
 * One canonical engine that runs the deterministic gates on a single content
 * item by REUSING the single-source-of-truth helpers/validators (no re-defined
 * markers). D3 (topic-match) is ADVISORY (warn). D1/D2/D4/D5/D6 are hard gates.
 * Used by the status-board generator + CI. Never writes to content/.
 */
import { overlapScore, internalDupRatio, transcriptDialogueText, transcriptMatchesTopic, normalizeText } from './lib/listening-scan'
import { isBrokenStem } from './lib/cefr-stem-markers'
import { hasGenericOpener } from './apply-c2-article-regen'
import { hasGenericOpenerT2 } from './apply-c2-teil2-regen'

export type GateVerdict = 'pass' | 'fail' | 'warn' | 'n/a'

export interface ItemGateResult {
  d1: GateVerdict // opener filler
  d3: GateVerdict // topic-match (advisory)
  d4: GateVerdict // fake looping segments
  d5: GateVerdict // broken-stem
  d6: GateVerdict // answer-integrity
  notes: string[]
}

/** Main learning text of an item (module-aware), same extraction as the board. */
export function itemContentText(j: any): string {
  if (j?.transcript?.lines) return transcriptDialogueText(j)
  if (typeof j?.article?.text === 'string') return j.article.text
  if (typeof j?.section_cloze?.text === 'string') return j.section_cloze.text
  const parts: string[] = []
  const rec = (o: any, k: string) => {
    if (o == null) return
    if (typeof o === 'string') { if (o.length >= 120 && !['prompt', 'instruction', 'task', 'aufgabe'].includes(k)) parts.push(o); return }
    if (Array.isArray(o)) { o.forEach((v) => rec(v, k)); return }
    if (typeof o === 'object') for (const [kk, vv] of Object.entries(o)) rec(vv, kk)
  }
  rec(j, '')
  return parts.join(' ')
}

function stemsOf(j: any): string[] {
  if (!Array.isArray(j?.questions)) return []
  return j.questions.map((q: any) => String(q?.stem ?? q?.statement ?? q?.question ?? '')).filter(Boolean)
}

/** D6: every question's key_evidence is a substring of the item content. */
function answerIntegrity(j: any, contentNorm: string): GateVerdict {
  if (!Array.isArray(j?.questions) || j.questions.length === 0) return 'n/a'
  let checked = 0
  for (const q of j.questions) {
    const ev = q?.explanation?.key_evidence
    if (typeof ev !== 'string' || !ev.trim()) continue
    checked++
    const probe = normalizeText(ev).slice(0, 60)
    if (probe.length > 0 && !contentNorm.includes(probe)) return 'fail'
  }
  return checked === 0 ? 'n/a' : 'pass'
}

/** Run the per-item gates (pure). `cellTexts` enables D2 (cross-item dup) at cell level elsewhere. */
export function runItemGates(j: any): ItemGateResult {
  const raw = itemContentText(j)
  const norm = normalizeText(raw)
  const res: ItemGateResult = { d1: 'n/a', d3: 'n/a', d4: 'n/a', d5: 'n/a', d6: 'n/a', notes: [] }

  // D1 opener
  res.d1 = (hasGenericOpener(raw) || hasGenericOpenerT2(raw)) ? 'fail' : 'pass'

  // D3 topic-match (advisory) — only when a topic/title exists
  if ((j?.topic ?? j?.title ?? j?.section_cloze?.title)) {
    res.d3 = transcriptMatchesTopic(j) ? 'pass' : 'warn'
  }

  // D4 fake-segment (listening)
  if (j?.transcript?.lines) res.d4 = internalDupRatio(j) >= 0.2 ? 'fail' : 'pass'

  // D5 broken-stem
  const stems = stemsOf(j)
  if (stems.length) res.d5 = stems.some((s) => isBrokenStem(s)) ? 'fail' : 'pass'

  // D6 answer-integrity
  res.d6 = answerIntegrity(j, norm)

  return res
}

/** D2 cross-item duplicate within a set of items (cell). Returns pairs over threshold. */
export function cellDuplicatePairs(items: any[], threshold = 0.5): Array<{ a: string; b: string; overlap: number }> {
  const texts = items.map((j) => ({ id: String(j?.id ?? ''), t: normalizeText(itemContentText(j)) }))
  const pairs: Array<{ a: string; b: string; overlap: number }> = []
  for (let i = 0; i < texts.length; i++) for (let k = i + 1; k < texts.length; k++) {
    if (texts[i].t.length < 200 || texts[k].t.length < 200) continue
    const o = overlapScore(texts[i].t, texts[k].t)
    if (o >= threshold) pairs.push({ a: texts[i].id, b: texts[k].id, overlap: +o.toFixed(2) })
  }
  return pairs
}

/** Aggregate hard verdict (D1/D2/D4/D5/D6; D3 advisory excluded). */
export function hardVerdict(item: ItemGateResult, hasCellDup: boolean): GateVerdict {
  const hard = [item.d1, item.d4, item.d5, item.d6].filter((d) => d !== 'n/a') as GateVerdict[]
  if (hasCellDup) return 'fail'
  if (hard.length === 0) return 'n/a'
  return hard.every((d) => d === 'pass') ? 'pass' : 'fail'
}
