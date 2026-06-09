/**
 * Spec `content-listening-regeneration` — Task 1.
 * Listening defect scanner library (single source of truth) — READ-ONLY.
 *
 * Vai chinh: Content QA / Linguistic Reviewer
 * Vai phoi hop: German Academic Lead, German Content Writer, AI / LLM Engineer
 *
 * The Goethe listening generator produced three defect families across levels
 * B1/B2/C1/C2:
 *   A. Duplicated transcripts between IDs (N ↔ N+10 verbatim copies).
 *   B. Topic mismatch (declared topic/title ≠ transcript content).
 *   C. Fake "N Sendungen/Gespräche" structure (a few looping paragraphs).
 * These pure helpers + the per-level scanner detect those defects and act as
 * the closing gate (Property 1/2/3). Scanning never writes to content/.
 */
import fs from 'node:fs'
import path from 'node:path'

/** Normalize text for overlap/substring comparison. */
export function normalizeText(s: string): string {
  return (s ?? '')
    .toLowerCase()
    .replace(/[^a-zäöüß0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

interface TranscriptLine {
  speaker?: string
  speaker_role?: string
  text?: string
}

/** Dialogue text of a listening item (excludes exam-narrator scaffolding). */
export function transcriptDialogueText(item: any): string {
  const lines: TranscriptLine[] = item?.transcript?.lines ?? []
  return lines
    .filter((l) => l?.speaker_role !== 'exam_narrator')
    .map((l) => l?.text ?? '')
    .join(' ')
}

/**
 * Approximate verbatim-overlap ratio of two texts in [0,1] using fixed 60-char
 * windows over the shorter (normalized) string. 1.0 ≈ one text fully contains
 * the other's content. This is a screening signal, not a formal diff.
 */
export function overlapScore(a: string, b: string): number {
  if (!a || !b) return 0
  const win = 60
  const shorter = a.length <= b.length ? a : b
  const longer = a.length <= b.length ? b : a
  let matched = 0
  let total = 0
  for (let i = 0; i + win <= shorter.length; i += win) {
    total++
    if (longer.includes(shorter.substr(i, win))) matched++
  }
  return total ? matched / total : 0
}

/**
 * Internal duplication ratio of dialogue paragraphs (repeated / total). High
 * value ⇒ a "fake N segments" structure where the same paragraphs loop.
 */
export function internalDupRatio(item: any): number {
  const lines: TranscriptLine[] = item?.transcript?.lines ?? []
  const dlg = lines
    .filter((l) => l?.speaker_role !== 'exam_narrator')
    .map((l) => normalizeText(l?.text ?? ''))
    .filter(Boolean)
  if (!dlg.length) return 0
  const uniq = new Set(dlg)
  return 1 - uniq.size / dlg.length
}

const TOPIC_STOPWORDS = new Set([
  'der', 'die', 'das', 'und', 'in', 'im', 'an', 'am', 'von', 'zu', 'mit',
  'fuer', 'für', 'den', 'des', 'ein', 'eine', 'als', 'praxis',
])

/** Content keywords (>=5 chars, non-stopword) of a declared topic/title. */
export function topicKeywords(topic: string): string[] {
  return normalizeText(topic)
    .split(' ')
    .filter((w) => w.length >= 5 && !TOPIC_STOPWORDS.has(w))
}

/**
 * True iff at least one topic/title keyword appears in the transcript. When the
 * topic has no usable keyword we conservatively return true (cannot judge).
 */
export function transcriptMatchesTopic(item: any): boolean {
  const kws = [
    ...topicKeywords(item?.topic ?? ''),
    ...topicKeywords(item?.title ?? ''),
  ]
  if (!kws.length) return true
  const tt = normalizeText(transcriptDialogueText(item))
  return kws.some((k) => tt.includes(k))
}

export interface DupPair {
  a: string
  b: string
  overlap: number
}

export interface LevelScan {
  level: string
  files: number
  dupPairs: DupPair[] // overlap >= dupThreshold
  exactPairs: DupPair[] // overlap >= 0.95
  topicMismatch: string[]
  internalLoop: string[] // internalDupRatio >= idupThreshold
}

const SIDE_CAR = /\.(qa|meta)\.json$/i

/** Scan one level's listening folder for the three defect families (read-only). */
export function scanListeningLevel(
  repoRoot: string,
  level: string,
  opts: { dupThreshold?: number; idupThreshold?: number } = {},
): LevelScan {
  const dupThreshold = opts.dupThreshold ?? 0.5
  const idupThreshold = opts.idupThreshold ?? 0.3
  const dir = path.join(repoRoot, 'content', level, 'listening')
  const result: LevelScan = {
    level,
    files: 0,
    dupPairs: [],
    exactPairs: [],
    topicMismatch: [],
    internalLoop: [],
  }
  if (!fs.existsSync(dir)) return result

  const recs: { id: string; text: string }[] = []
  for (const name of fs.readdirSync(dir).sort()) {
    if (!name.endsWith('.json') || SIDE_CAR.test(name)) continue
    let j: any
    try {
      j = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'))
    } catch {
      continue
    }
    result.files++
    const id = String(j?.id ?? name.replace(/\.json$/, ''))
    recs.push({ id, text: normalizeText(transcriptDialogueText(j)) })
    if (!transcriptMatchesTopic(j)) result.topicMismatch.push(id)
    if (internalDupRatio(j) >= idupThreshold) result.internalLoop.push(id)
  }

  for (let i = 0; i < recs.length; i++) {
    for (let k = i + 1; k < recs.length; k++) {
      if (recs[i].text.length < 200 || recs[k].text.length < 200) continue
      const o = overlapScore(recs[i].text, recs[k].text)
      if (o >= dupThreshold) {
        const pair: DupPair = { a: recs[i].id, b: recs[k].id, overlap: +o.toFixed(2) }
        result.dupPairs.push(pair)
        if (o >= 0.95) result.exactPairs.push(pair)
      }
    }
  }
  return result
}

export const LISTENING_LEVELS = ['b1', 'b2', 'c1', 'c2'] as const
