/**
 * Spec `fuxie-content-review-board` — Task 5.1
 * Mutation gold-set calibration: inject KNOWN errors into TEMP copies of real
 * content, run the two-tier board on the mutated copies, and measure
 * `Recall_By_Type` (caught / injected) per mutation type, attributing each catch
 * to Tier-1 (deterministic, authoritative) vs Tier-2 (advisory).
 *
 * Vai chinh: AI / LLM Engineer
 * Vai phoi hop: QA Automation Engineer, Content QA / Linguistic Reviewer, DevOps
 *
 * This is the pure + injectable core behind the thin CLI
 * `scripts/content-review-board-calibrate.ts`. It is split out so every piece
 * (mutators, recall math, the content read-only hash guard) is unit-testable
 * WITHOUT touching real `content/` and WITHOUT spending any provider credit.
 *
 * ── Honesty contract (Req 4.4 / 4.6, design §"Decision 4") ──────────────────
 * Not every mutation type is measurable with the same authority, and the report
 * MUST say so plainly:
 *
 *   | type            | who catches it             | measurable offline?              |
 *   | --------------- | -------------------------- | -------------------------------- |
 *   | genus           | Tier-1 enum:article        | YES — deterministic, free        |
 *   | wrong_answer    | Tier-1 answerkey:contra.   | YES — deterministic, free        |
 *   |                 | (+ Tier-2 red-team)        | red-team catch is MODELLED       |
 *   | umlaut_drop     | Tier-1 hunspell/LanguageT. | ONLY if hunspell/LT available    |
 *   | level_violation | Tier-2 CEFR reviewer       | NO — needs a LIVE provider       |
 *   | bad_translation | Tier-2 VN reviewer         | NO — needs a LIVE provider       |
 *
 * The default offline run therefore produces REAL recall numbers for `genus`
 * and `wrong_answer` (Tier-1 deterministic), a REAL number for `umlaut_drop`
 * IFF hunspell/LanguageTool is present, and `0` (explicitly flagged "chưa đáng
 * tin — cần provider thật") for the two purely-subjective types whose detection
 * requires a live Tier-2 model. The red-team catch of `wrong_answer` is produced
 * by a deterministic "competent blind solver" model (it predicts the
 * originally-correct answer) — it represents the HARNESS WIRING, not a real
 * model's recall, and the report labels it as such.
 *
 * READ-ONLY content (Property 5, Req 4.5): mutations exist ONLY in the temp dir;
 * `content/` is hashed before + after and asserted byte-identical, then the temp
 * dir is deleted. Any drift aborts loudly.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'

import { GENDERS } from '../../packages/shared/src/types/index.ts'
import {
  type Tier1Finding,
  type Tier1Result,
  type ReadingQuestion,
  buildTier1Result,
} from './review-board-contract'
import {
  checkVocabularyFile,
  checkReadingFile,
} from './german-content-checks'
import {
  type DeStringRef,
  type GermanChecksOptions,
  type HunspellOptions,
  type LanguageToolOptions,
  detectHunspell,
  runGermanChecks,
} from './german-lint-checks'
import {
  type ReviewBoardItem,
  type RawReadingQuestion,
  type ReviewerRunner,
  createMockReviewerRunner,
  normalizeReadingItem,
} from './review-board-reviewers'
import {
  type RedTeamRunner,
  type RedTeamOutput,
  REDTEAM_REVIEWER_ID,
} from './review-board-redteam'
import {
  type BoardItemInput,
  executeBoard,
} from './review-board-aggregator'

// ===========================================================================
// Types
// ===========================================================================

export type MutationType =
  | 'genus'
  | 'umlaut_drop'
  | 'wrong_answer'
  | 'level_violation'
  | 'bad_translation'

export const MUTATION_TYPES: readonly MutationType[] = [
  'genus',
  'umlaut_drop',
  'wrong_answer',
  'level_violation',
  'bad_translation',
] as const

export type Skill = 'vocabulary' | 'reading'

/** A single applied mutation on a deep-cloned item (pure mutator output). */
export interface MutationResult {
  /** JSON path of the SINGLE field that changed. */
  jsonPath: string
  /** Value before the mutation. */
  before: unknown
  /** Value after the mutation. */
  after: unknown
  /** Deep-cloned item carrying exactly the one change. */
  mutated: Record<string, unknown>
  /**
   * For reading mutations: index of the question the board should review
   * (the mutated question, or the question whose answer the red-team solves).
   */
  questionIndex?: number
}

/** Ground-truth record of one injected mutation case. */
export interface MutationCase {
  id: string
  type: MutationType
  skill: Skill
  /** content-relative path of the ORIGINAL source item (forward slashes). */
  sourceFile: string
  itemId: string
  jsonPath: string
  before: unknown
  after: unknown
  questionIndex?: number
  /** Absolute path of the temp file the mutated copy was written to. */
  tempFile?: string
}

/** Per-case detection outcome after running the board on the mutated copy. */
export interface DetectionResult {
  caseId: string
  type: MutationType
  tier1Caught: boolean
  tier2Caught: boolean
  /** True when this case's type is even in scope for Tier-2 (reading only). */
  tier2Applicable: boolean
  /** New Tier-1 error findings introduced by the mutation (rule keys). */
  newTier1Rules: string[]
  redFlag: boolean
}

export type CaughtBy = 'tier1' | 'tier2' | 'both' | 'none'

export interface RecallByTypeEntry {
  injected: number
  caught: number
  recall: number
  caughtBy: CaughtBy
  /** Whether the recall figure is a REAL measurement vs needs-live-infra. */
  measurable: boolean
  /** Honest note about trustworthiness / required infra. */
  note: string
}

export interface CalibrationInfra {
  hunspellAvailable: boolean
  hunspellReason?: string
  languageToolUsed: boolean
  tier2Live: boolean
}

export interface RecallReport {
  params: { n: number; seed: number; perType: number; level?: string }
  infra: CalibrationInfra
  byType: Record<MutationType, RecallByTypeEntry>
  /** Overall honesty note (which numbers are real vs need live infra). */
  note: string
  /** Property 5 outcome: content/ byte-identical before+after. */
  contentReadOnly: boolean
  /** Whether the temp dir was removed after measuring. */
  tempCleaned: boolean
  totalInjected: number
  totalCaught: number
}

/**
 * Recall at or above which a type is considered "đáng tin" (trustworthy).
 * Types below this — or whose detection needs infra that was not available —
 * are flagged "chưa đáng tin" in the report (Req 4.4).
 */
export const RECALL_TRUSTWORTHY_THRESHOLD = 0.8

// ===========================================================================
// Deterministic PRNG (seedable) — keeps selection reproducible
// ===========================================================================

/** mulberry32 — tiny deterministic PRNG so calibration runs are reproducible. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic in-place-free shuffle driven by a seeded PRNG. */
export function seededShuffle<T>(items: readonly T[], rng: () => number): T[] {
  const out = [...items]
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

// ===========================================================================
// Small helpers
// ===========================================================================

export function deepClone<T>(value: T): T {
  return structuredClone(value)
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function asString(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null
}

const UMLAUT_MAP: Record<string, string> = {
  ä: 'a',
  ö: 'o',
  ü: 'u',
  Ä: 'A',
  Ö: 'O',
  Ü: 'U',
  ß: 'ss',
}

/** Drop the FIRST umlaut/ß in a string. Returns null if there is none. */
export function dropFirstUmlaut(text: string): string | null {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (ch in UMLAUT_MAP) {
      return text.slice(0, i) + UMLAUT_MAP[ch] + text.slice(i + 1)
    }
  }
  return null
}

const GENDER_SET: ReadonlySet<string> = new Set<string>(GENDERS)

/**
 * Map a valid Genus enum value to a deliberately-INVALID look-alike so the
 * deterministic enum check (`enum:article`) flags it. (Req 4.2 example
 * FEMININ→FEMINUM.)
 */
const INVALID_GENUS: Record<string, string> = {
  MASKULIN: 'MASKULINUM',
  FEMININ: 'FEMINUM',
  NEUTRUM: 'NEUTRO',
}

/** Truthy/falsy flip for richtig_falsch answers. */
function flipTruth(answer: string): string | null {
  const a = answer.trim().toLowerCase()
  if (['richtig', 'r', 'wahr', 'true', 'ja'].includes(a)) return 'falsch'
  if (['falsch', 'f', 'false', 'nein'].includes(a)) return 'richtig'
  return null
}

const TRUTH_TYPES: ReadonlySet<string> = new Set([
  'richtig_falsch',
  'true_false',
  'wahr_falsch',
  'ja_nein',
])

/**
 * A clearly above-A1 German clause (rare C1/C2 vocabulary + nested structure)
 * that is grammatically correct German — so it is a LEVEL violation, not a
 * spelling/grammar error. Detection therefore requires the Tier-2 CEFR
 * reviewer, not Tier-1.
 */
export const LEVEL_VIOLATION_CLAUSE =
  ' Nichtsdestotrotz erfordert die diesbezügliche sozioökonomische ' +
  'Problematik eine differenzierte, interdisziplinäre Auseinandersetzung.'

/** A deliberately wrong Vietnamese translation unrelated to the German. */
export const BAD_TRANSLATION_VI =
  'Bản dịch này hoàn toàn sai và không liên quan gì đến câu tiếng Đức.'

// ===========================================================================
// Mutators (pure) — each changes EXACTLY ONE field of a deep-cloned item
// ===========================================================================

/** genus — flip a vocabulary noun's `article` to an invalid Genus value. */
export function mutateGenus(item: Record<string, unknown>): MutationResult | null {
  if (!Array.isArray(item.words)) return null
  for (let i = 0; i < item.words.length; i++) {
    const w = item.words[i]
    if (!isObject(w)) continue
    const article = asString(w.article)
    if (article && GENDER_SET.has(article) && INVALID_GENUS[article]) {
      const mutated = deepClone(item)
      const mw = (mutated.words as Record<string, unknown>[])[i]
      const after = INVALID_GENUS[article]
      mw.article = after
      return { jsonPath: `words[${i}].article`, before: article, after, mutated }
    }
  }
  return null
}

/** umlaut_drop — drop the first umlaut/ß in a German string field. */
export function mutateUmlautDrop(
  item: Record<string, unknown>,
  skill: Skill,
): MutationResult | null {
  const refs = collectDeStringRefs(skill, 'item', item)
  for (const ref of refs) {
    const dropped = dropFirstUmlaut(ref.text)
    if (dropped && dropped !== ref.text) {
      const mutated = deepClone(item)
      setByJsonPath(mutated, ref.jsonPath, dropped)
      return { jsonPath: ref.jsonPath, before: ref.text, after: dropped, mutated }
    }
  }
  return null
}

/**
 * wrong_answer — flip a reading richtig_falsch answer (keeps the explanation,
 * so it now contradicts the stored answer → Tier-1 answerkey:contradiction, and
 * disagrees with a competent blind solver → Tier-2 red-team red flag).
 */
export function mutateWrongAnswer(item: Record<string, unknown>): MutationResult | null {
  if (!Array.isArray(item.questions)) return null
  for (let i = 0; i < item.questions.length; i++) {
    const q = item.questions[i]
    if (!isObject(q)) continue
    const type = String(q.type ?? '').toLowerCase()
    const answer = asString(q.answer)
    if (type && TRUTH_TYPES.has(type) && answer) {
      const flipped = flipTruth(answer)
      if (flipped) {
        const mutated = deepClone(item)
        const mq = (mutated.questions as Record<string, unknown>[])[i]
        mq.answer = flipped
        return {
          jsonPath: `questions[${i}].answer`,
          before: answer,
          after: flipped,
          mutated,
          questionIndex: i,
        }
      }
    }
  }
  return null
}

/**
 * level_violation — append a clearly above-level German clause to the first
 * reading passage (or vocabulary example). Grammatical German, wrong level →
 * only a Tier-2 CEFR reviewer can catch it.
 */
export function mutateLevelViolation(
  item: Record<string, unknown>,
  skill: Skill,
): MutationResult | null {
  if (skill === 'reading') {
    if (Array.isArray(item.texts)) {
      for (let i = 0; i < item.texts.length; i++) {
        const t = item.texts[i]
        if (isObject(t) && asString(t.content)) {
          const before = t.content as string
          const after = before + LEVEL_VIOLATION_CLAUSE
          const mutated = deepClone(item)
          ;(mutated.texts as Record<string, unknown>[])[i].content = after
          return { jsonPath: `texts[${i}].content`, before, after, mutated, questionIndex: 0 }
        }
      }
    }
    return null
  }
  // vocabulary fallback: extend the first example sentence
  if (Array.isArray(item.words)) {
    for (let i = 0; i < item.words.length; i++) {
      const w = item.words[i]
      if (isObject(w) && asString(w.exampleSentence1)) {
        const before = w.exampleSentence1 as string
        const after = before + LEVEL_VIOLATION_CLAUSE
        const mutated = deepClone(item)
        ;(mutated.words as Record<string, unknown>[])[i].exampleSentence1 = after
        return { jsonPath: `words[${i}].exampleSentence1`, before, after, mutated }
      }
    }
  }
  return null
}

/**
 * bad_translation — corrupt a Vietnamese translation so it no longer matches
 * the German. Reading: the first question's explanation.vi; vocabulary: the
 * first word's meaningVi. Tier-1 has no de↔vi semantic check → only a Tier-2 VN
 * reviewer can catch it.
 */
export function mutateBadTranslation(
  item: Record<string, unknown>,
  skill: Skill,
): MutationResult | null {
  if (skill === 'reading') {
    if (Array.isArray(item.questions)) {
      for (let i = 0; i < item.questions.length; i++) {
        const q = item.questions[i]
        if (!isObject(q)) continue
        const exp = q.explanation
        if (isObject(exp) && asString(exp.vi)) {
          const before = exp.vi as string
          const mutated = deepClone(item)
          const mexp = (mutated.questions as Record<string, unknown>[])[i]
            .explanation as Record<string, unknown>
          mexp.vi = BAD_TRANSLATION_VI
          return {
            jsonPath: `questions[${i}].explanation.vi`,
            before,
            after: BAD_TRANSLATION_VI,
            mutated,
            questionIndex: i,
          }
        }
      }
    }
    return null
  }
  if (Array.isArray(item.words)) {
    for (let i = 0; i < item.words.length; i++) {
      const w = item.words[i]
      if (isObject(w) && asString(w.meaningVi)) {
        const before = w.meaningVi as string
        const mutated = deepClone(item)
        ;(mutated.words as Record<string, unknown>[])[i].meaningVi = BAD_TRANSLATION_VI
        return { jsonPath: `words[${i}].meaningVi`, before, after: BAD_TRANSLATION_VI, mutated }
      }
    }
  }
  return null
}

/** Dispatch table: which mutator + which skill each type targets. */
export const MUTATION_PLAN: Record<MutationType, { skill: Skill }> = {
  genus: { skill: 'vocabulary' },
  umlaut_drop: { skill: 'vocabulary' },
  wrong_answer: { skill: 'reading' },
  level_violation: { skill: 'reading' },
  bad_translation: { skill: 'reading' },
}

/** Apply the mutator for a given type to a parsed item. */
export function applyMutation(
  type: MutationType,
  item: Record<string, unknown>,
): MutationResult | null {
  const skill = MUTATION_PLAN[type].skill
  switch (type) {
    case 'genus':
      return mutateGenus(item)
    case 'umlaut_drop':
      return mutateUmlautDrop(item, skill)
    case 'wrong_answer':
      return mutateWrongAnswer(item)
    case 'level_violation':
      return mutateLevelViolation(item, skill)
    case 'bad_translation':
      return mutateBadTranslation(item, skill)
  }
}

// ===========================================================================
// JSON path get/set (supports `a.b[2].c` used by our mutators)
// ===========================================================================

interface PathSeg {
  key: string
  index?: number
}

function parseJsonPath(jsonPath: string): PathSeg[] {
  const segs: PathSeg[] = []
  for (const raw of jsonPath.split('.')) {
    const m = /^([^[]+)(\[(\d+)\])?$/.exec(raw)
    if (!m) {
      segs.push({ key: raw })
      continue
    }
    const seg: PathSeg = { key: m[1] }
    if (m[3] !== undefined) seg.index = Number(m[3])
    segs.push(seg)
  }
  return segs
}

export function setByJsonPath(obj: Record<string, unknown>, jsonPath: string, value: unknown): void {
  const segs = parseJsonPath(jsonPath)
  let cur: any = obj
  for (let i = 0; i < segs.length; i++) {
    const seg = segs[i]
    const last = i === segs.length - 1
    let target = cur[seg.key]
    if (seg.index !== undefined) {
      if (last) {
        target[seg.index] = value
        return
      }
      cur = target[seg.index]
    } else {
      if (last) {
        cur[seg.key] = value
        return
      }
      cur = target
    }
  }
}

// ===========================================================================
// German-string collection (for hunspell/LanguageTool over a single item)
// ===========================================================================

/** Collect citeable German strings out of a single parsed item. Read-only. */
export function collectDeStringRefs(
  skill: Skill,
  file: string,
  data: Record<string, unknown>,
): DeStringRef[] {
  const out: DeStringRef[] = []
  const push = (jsonPath: string, value: unknown) => {
    if (typeof value === 'string' && value.trim().length > 0) out.push({ file, jsonPath, text: value })
  }
  if (skill === 'vocabulary' && Array.isArray(data.words)) {
    data.words.forEach((w, i) => {
      if (!isObject(w)) return
      push(`words[${i}].word`, w.word)
      push(`words[${i}].plural`, w.plural)
      push(`words[${i}].exampleSentence1`, w.exampleSentence1)
      push(`words[${i}].exampleSentence2`, w.exampleSentence2)
      push(`words[${i}].meaningDe`, w.meaningDe)
    })
  }
  if (skill === 'reading') {
    if (Array.isArray(data.texts)) {
      data.texts.forEach((t, i) => {
        if (isObject(t)) push(`texts[${i}].content`, t.content)
      })
    }
    if (Array.isArray(data.questions)) {
      data.questions.forEach((q, i) => {
        if (!isObject(q)) return
        push(`questions[${i}].statement`, q.statement)
        push(`questions[${i}].stem`, q.stem)
        push(`questions[${i}].situation`, q.situation)
        const exp = q.explanation
        if (isObject(exp)) {
          push(`questions[${i}].explanation.de`, exp.de)
          push(`questions[${i}].explanation.key_evidence`, exp.key_evidence)
        }
      })
    }
  }
  return out
}

// ===========================================================================
// Tier-1 over a single in-memory / temp item
// ===========================================================================

export interface Tier1RunOptions {
  useLanguageTool?: boolean
  languageTool?: LanguageToolOptions
  hunspell?: HunspellOptions
}

export interface Tier1RunResult {
  findings: Tier1Finding[]
  infraError?: string
  notes: string[]
}

/** Run the Tier-1 deterministic + (optional) hunspell/LT checks on one item. */
export async function runTier1OnItem(
  skill: Skill,
  file: string,
  data: Record<string, unknown>,
  opts: Tier1RunOptions = {},
): Promise<Tier1RunResult> {
  const findings: Tier1Finding[] =
    skill === 'vocabulary' ? checkVocabularyFile(file, data) : checkReadingFile(file, data)

  const refs = collectDeStringRefs(skill, file, data)
  const checks: GermanChecksOptions = {
    skipLanguageTool: !opts.useLanguageTool,
    languageTool: opts.languageTool,
    hunspell: opts.hunspell,
  }
  const german = await runGermanChecks(refs, checks)
  return {
    findings: [...findings, ...german.findings],
    infraError: german.infraError,
    notes: german.notes,
  }
}

/** Stable key for diffing findings between baseline and mutated. */
function findingKey(f: Tier1Finding): string {
  return `${f.rule}|${f.jsonPath}`
}

/** Error-severity finding keys introduced by the mutation (mutated − baseline). */
export function newErrorFindingKeys(
  baseline: readonly Tier1Finding[],
  mutated: readonly Tier1Finding[],
): string[] {
  const baseKeys = new Set(baseline.filter((f) => f.severity === 'error').map(findingKey))
  const out = new Set<string>()
  for (const f of mutated) {
    if (f.severity !== 'error') continue
    const k = findingKey(f)
    if (!baseKeys.has(k)) out.add(k)
  }
  return [...out]
}

// ===========================================================================
// Recall computation (pure)
// ===========================================================================

/** Detection expectation per type — drives the "measurable?" honesty flag. */
const TYPE_EXPECTATION: Record<
  MutationType,
  { detector: string; needs: 'none' | 'hunspell-or-lt' | 'tier2-provider' }
> = {
  genus: { detector: 'Tier-1 enum:article (deterministic)', needs: 'none' },
  wrong_answer: {
    detector: 'Tier-1 answerkey:contradiction (deterministic) + Tier-2 red-team (modelled)',
    needs: 'none',
  },
  umlaut_drop: { detector: 'Tier-1 hunspell/LanguageTool spelling', needs: 'hunspell-or-lt' },
  level_violation: { detector: 'Tier-2 CEFR/Pedagogy reviewer', needs: 'tier2-provider' },
  bad_translation: { detector: 'Tier-2 VN localization reviewer', needs: 'tier2-provider' },
}

function isMeasurable(type: MutationType, infra: CalibrationInfra): boolean {
  const need = TYPE_EXPECTATION[type].needs
  if (need === 'none') return true
  if (need === 'hunspell-or-lt') return infra.hunspellAvailable || infra.languageToolUsed
  if (need === 'tier2-provider') return infra.tier2Live
  return true
}

function attribute(tiers: { tier1: boolean; tier2: boolean }): CaughtBy {
  if (tiers.tier1 && tiers.tier2) return 'both'
  if (tiers.tier1) return 'tier1'
  if (tiers.tier2) return 'tier2'
  return 'none'
}

/** Compute Recall_By_Type from cases + detection results (pure). */
export function computeRecall(
  cases: readonly MutationCase[],
  detections: readonly DetectionResult[],
  infra: CalibrationInfra,
): Record<MutationType, RecallByTypeEntry> {
  const byId = new Map(detections.map((d) => [d.caseId, d]))
  const out = {} as Record<MutationType, RecallByTypeEntry>

  for (const type of MUTATION_TYPES) {
    const typeCases = cases.filter((c) => c.type === type)
    const injected = typeCases.length
    let caught = 0
    let anyTier1 = false
    let anyTier2 = false
    for (const c of typeCases) {
      const d = byId.get(c.id)
      if (!d) continue
      if (d.tier1Caught || d.tier2Caught) caught++
      if (d.tier1Caught) anyTier1 = true
      if (d.tier2Caught) anyTier2 = true
    }
    const recall = injected > 0 ? caught / injected : 0
    const measurable = isMeasurable(type, infra)
    const caughtBy = attribute({ tier1: anyTier1, tier2: anyTier2 })
    out[type] = {
      injected,
      caught,
      recall,
      caughtBy,
      measurable,
      note: recallNote(type, recall, measurable, infra),
    }
  }
  return out
}

function recallNote(
  type: MutationType,
  recall: number,
  measurable: boolean,
  infra: CalibrationInfra,
): string {
  const exp = TYPE_EXPECTATION[type]
  if (!measurable) {
    if (exp.needs === 'hunspell-or-lt') {
      return `CHƯA ĐÁNG TIN — cần hunspell/LanguageTool (không có trong lần chạy này) để đo recall thật cho "${type}".`
    }
    if (exp.needs === 'tier2-provider') {
      return `CHƯA ĐÁNG TIN — "${type}" chỉ Tier-2 (provider thật) mới bắt được; lần chạy mock không đo được recall thật.`
    }
  }
  if (recall < RECALL_TRUSTWORTHY_THRESHOLD) {
    return `CHƯA ĐÁNG TIN — recall ${(recall * 100).toFixed(0)}% < ngưỡng ${(RECALL_TRUSTWORTHY_THRESHOLD * 100).toFixed(0)}% (${exp.detector}).`
  }
  return `Đáng tin — ${exp.detector}; recall ${(recall * 100).toFixed(0)}%.`
}

// ===========================================================================
// Content read-only hash guard (Property 5, Req 4.5)
// ===========================================================================

function listFilesRecursive(dir: string): string[] {
  const out: string[] = []
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, entry.name)
    if (entry.isDirectory()) out.push(...listFilesRecursive(fp))
    else out.push(fp)
  }
  return out
}

/** Hash every file under `dir` → Map<relPath, sha256>. */
export function hashTree(dir: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const fp of listFilesRecursive(dir)) {
    const rel = path.relative(dir, fp).split(path.sep).join('/')
    map.set(rel, crypto.createHash('sha256').update(fs.readFileSync(fp)).digest('hex'))
  }
  return map
}

export interface TreeDiff {
  changed: string[]
  added: string[]
  removed: string[]
}

/** Compare two tree hashes; empty diff ⇒ byte-identical. */
export function diffTrees(before: Map<string, string>, after: Map<string, string>): TreeDiff {
  const changed: string[] = []
  const added: string[] = []
  const removed: string[] = []
  for (const [rel, h] of before) {
    if (!after.has(rel)) removed.push(rel)
    else if (after.get(rel) !== h) changed.push(rel)
  }
  for (const rel of after.keys()) {
    if (!before.has(rel)) added.push(rel)
  }
  return { changed: changed.sort(), added: added.sort(), removed: removed.sort() }
}

export function isCleanDiff(diff: TreeDiff): boolean {
  return diff.changed.length === 0 && diff.added.length === 0 && diff.removed.length === 0
}

/** Throw loudly when the content tree changed (aborts calibration). */
export function assertContentUnchanged(before: Map<string, string>, after: Map<string, string>): void {
  const diff = diffTrees(before, after)
  if (!isCleanDiff(diff)) {
    throw new Error(
      '[calibrate] CONTENT MUTATED — read-only invariant violated (Property 5). ' +
        `changed=${JSON.stringify(diff.changed)} added=${JSON.stringify(diff.added)} ` +
        `removed=${JSON.stringify(diff.removed)}`,
    )
  }
}

// ===========================================================================
// Source loading (read-only) — pick real items eligible for each mutation type
// ===========================================================================

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const

function isSidecar(name: string): boolean {
  return /\.qa\.json$/i.test(name) || /\.meta\.json$/i.test(name)
}

export interface SourceItem {
  skill: Skill
  file: string // content-relative, forward slashes
  itemId: string
  level: string
  data: Record<string, unknown>
}

function readJson(fp: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(fs.readFileSync(fp, 'utf8'))
    return isObject(parsed) ? parsed : null
  } catch {
    return null
  }
}

/** Load all eligible source items for a skill (read-only over content/). */
export function loadSources(repoRoot: string, skill: Skill, level?: string): SourceItem[] {
  const out: SourceItem[] = []
  const levels = level ? [level] : (LEVELS as readonly string[])
  for (const lv of levels) {
    const dir = path.join(repoRoot, 'content', lv, skill)
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json') || isSidecar(name)) continue
      const fp = path.join(dir, name)
      const data = readJson(fp)
      if (!data) continue
      const rel = path.relative(repoRoot, fp).split(path.sep).join('/')
      const itemId = String(data.id ?? (isObject(data.theme) ? data.theme.slug : '') ?? name)
      out.push({ skill, file: rel, itemId, level: lv, data })
    }
  }
  return out
}

// ===========================================================================
// Calibration runners (no provider credit) — model the Tier-2 board offline
// ===========================================================================

/**
 * A "competent blind solver" red-team runner for calibration. It predicts the
 * ORIGINALLY-correct answer for the case (looked up by case id), modelling a
 * careful test-taker who solves the item correctly. When a `wrong_answer`
 * mutation has flipped the stored answer, this prediction disagrees → red flag.
 *
 * This is HARNESS WIRING, not a real model's recall — the report says so.
 */
export function createCalibrationRedTeamRunner(
  originalAnswerByCaseId: ReadonlyMap<string, string | number>,
): RedTeamRunner {
  return async (request) => {
    const orig = originalAnswerByCaseId.get(request.itemId)
    const out: RedTeamOutput = {
      reviewer: REDTEAM_REVIEWER_ID,
      predictedAnswer: orig != null ? String(orig) : 'unknown',
      confidence: 'high',
      rationale:
        '[calibration] modelled competent blind solver — predicts the originally-correct answer.',
    }
    return out
  }
}

// ===========================================================================
// Full calibration run
// ===========================================================================

export interface CalibrationOptions {
  repoRoot: string
  /** Total target number of mutation cases (≈ N). Default 20. */
  n?: number
  /** Seed for deterministic selection. Default 1. */
  seed?: number
  /** Restrict source items to a single CEFR level. */
  level?: string
  /** Temp dir for mutated copies. Default `<repoRoot>/tmp/review-board-calibration`. */
  tempDir?: string
  /** Opt-in LanguageTool (default off → fully local). */
  useLanguageTool?: boolean
  languageTool?: LanguageToolOptions
  hunspell?: HunspellOptions
  /** Injected board runners (default: offline mock reviewers + calibration red-team). */
  reviewerRunner?: ReviewerRunner
  /**
   * Marks the run as using a LIVE Tier-2 provider so subjective-only recall
   * (level_violation, bad_translation) is treated as measurable. Default false.
   */
  tier2Live?: boolean
}

export interface CalibrationRunResult {
  report: RecallReport
  cases: MutationCase[]
  detections: DetectionResult[]
}

/**
 * Run the full mutation calibration:
 *   1. hash content/ (before)
 *   2. select real items + inject one known mutation per case into a TEMP copy
 *   3. run Tier-1 (+ optional hunspell/LT) and Tier-2 (reading only) on the
 *      mutated TEMP copies, attributing each catch to a tier
 *   4. compute Recall_By_Type with honest "chưa đáng tin" notes
 *   5. delete the temp dir, hash content/ (after), assert byte-identical
 */
export async function runCalibration(opts: CalibrationOptions): Promise<CalibrationRunResult> {
  const repoRoot = opts.repoRoot
  const n = opts.n ?? 20
  const seed = opts.seed ?? 1
  const perType = Math.max(1, Math.ceil(n / MUTATION_TYPES.length))
  const tempDir = opts.tempDir ?? path.join(repoRoot, 'tmp', 'review-board-calibration')
  const contentDir = path.join(repoRoot, 'content')

  // 1. content hash BEFORE
  const before = hashTree(contentDir)

  // infra detection (honest reporting)
  const hunspellDetected = detectHunspell(opts.hunspell)
  const infra: CalibrationInfra = {
    hunspellAvailable: hunspellDetected.available,
    hunspellReason: hunspellDetected.reason,
    languageToolUsed: Boolean(opts.useLanguageTool),
    tier2Live: Boolean(opts.tier2Live),
  }

  const rng = mulberry32(seed)
  const vocabSources = seededShuffle(loadSources(repoRoot, 'vocabulary', opts.level), rng)
  const readingSources = seededShuffle(loadSources(repoRoot, 'reading', opts.level), rng)

  // 2. build cases (one mutation per case) into temp files
  fs.rmSync(tempDir, { recursive: true, force: true })
  const cases: MutationCase[] = []
  const originalAnswerByCaseId = new Map<string, string | number>()

  for (const type of MUTATION_TYPES) {
    const skill = MUTATION_PLAN[type].skill
    const pool = skill === 'vocabulary' ? vocabSources : readingSources
    let made = 0
    for (const src of pool) {
      if (made >= perType) break
      const mutation = applyMutation(type, src.data)
      if (!mutation) continue
      const id = `${type}-${made + 1}`
      const tempFile = path.join(tempDir, type, `${id}.json`)
      fs.mkdirSync(path.dirname(tempFile), { recursive: true })
      fs.writeFileSync(tempFile, JSON.stringify(mutation.mutated, null, 2), { encoding: 'utf8' })

      // record the original (pre-mutation) stored answer for the red-team model
      if (skill === 'reading' && mutation.questionIndex !== undefined) {
        const q = (src.data.questions as Record<string, unknown>[])[mutation.questionIndex]
        const orig = q?.answer ?? q?.correctIndex ?? q?.solution
        if (orig != null && (typeof orig === 'string' || typeof orig === 'number')) {
          originalAnswerByCaseId.set(id, orig)
        }
      }

      cases.push({
        id,
        type,
        skill,
        sourceFile: src.file,
        itemId: src.itemId,
        jsonPath: mutation.jsonPath,
        before: mutation.before,
        after: mutation.after,
        questionIndex: mutation.questionIndex,
        tempFile,
      })
      made++
    }
  }

  // 3. run the board on the mutated TEMP copies
  const reviewerRunner = opts.reviewerRunner ?? createMockReviewerRunner()
  const redTeamRunner = createCalibrationRedTeamRunner(originalAnswerByCaseId)
  const detections: DetectionResult[] = []

  // group reading cases for a single executeBoard call
  const boardInputs: BoardItemInput[] = []
  const caseBySourceForBoard = new Map<string, MutationCase>()

  for (const c of cases) {
    const src =
      (c.skill === 'vocabulary' ? vocabSources : readingSources).find((s) => s.file === c.sourceFile) ??
      null
    if (!src) continue

    // baseline Tier-1 on the ORIGINAL item (in-memory, read-only)
    const baseline = await runTier1OnItem(c.skill, c.sourceFile, src.data, {
      useLanguageTool: opts.useLanguageTool,
      languageTool: opts.languageTool,
      hunspell: opts.hunspell,
    })

    // mutated Tier-1 on the TEMP file (actually re-read from disk)
    const mutatedData = readJson(c.tempFile as string)
    const mutated = mutatedData
      ? await runTier1OnItem(c.skill, c.sourceFile, mutatedData, {
          useLanguageTool: opts.useLanguageTool,
          languageTool: opts.languageTool,
          hunspell: opts.hunspell,
        })
      : { findings: [] as Tier1Finding[], notes: [] as string[] }

    const newRules = newErrorFindingKeys(baseline.findings, mutated.findings)
    const tier1Caught = newRules.length > 0

    detections.push({
      caseId: c.id,
      type: c.type,
      tier1Caught,
      tier2Caught: false, // filled in for reading cases below
      tier2Applicable: c.skill === 'reading',
      newTier1Rules: newRules,
      redFlag: false,
    })

    // queue reading cases for the Tier-2 board
    if (c.skill === 'reading' && mutatedData) {
      const qIndex = c.questionIndex ?? 0
      const questions = Array.isArray(mutatedData.questions)
        ? (mutatedData.questions as RawReadingQuestion[])
        : []
      const rawQ = questions[qIndex]
      if (rawQ) {
        const reviewItem: ReviewBoardItem = normalizeReadingItem(rawQ, {
          itemId: c.id,
          level: src.level,
        })
        const question: ReadingQuestion = rawQ as ReadingQuestion
        const tier1Result: Tier1Result = buildTier1Result(
          { files: 1, deStrings: 0 },
          mutated.findings,
          mutated.infraError,
        )
        boardInputs.push({
          itemId: c.id,
          level: src.level,
          reviewItem,
          question,
          tier1: tier1Result,
        })
        caseBySourceForBoard.set(c.id, c)
      }
    }
  }

  // run Tier-2 board once over all reading inputs (no provider credit)
  if (boardInputs.length > 0) {
    const boardResult = await executeBoard(boardInputs, {
      dryRun: false,
      reviewerRunner,
      redTeamRunner,
    })
    const byId = new Map(boardResult.items.map((it) => [it.itemId, it]))
    for (const d of detections) {
      const item = byId.get(d.caseId)
      if (!item) continue
      const redFlag = item.aggregate.redFlag
      const subjectiveConcern = item.aggregate.consensus !== 'ok'
      d.redFlag = redFlag
      d.tier2Caught = redFlag || subjectiveConcern
    }
  }

  // 4. recall
  const byType = computeRecall(cases, detections, infra)
  const totalInjected = cases.length
  const totalCaught = detections.filter((d) => d.tier1Caught || d.tier2Caught).length

  // 5. cleanup temp + assert content read-only
  fs.rmSync(tempDir, { recursive: true, force: true })
  const tempCleaned = !fs.existsSync(tempDir)
  const after = hashTree(contentDir)
  assertContentUnchanged(before, after)

  const report: RecallReport = {
    params: { n, seed, perType, level: opts.level },
    infra,
    byType,
    note: buildOverallNote(infra),
    contentReadOnly: true,
    tempCleaned,
    totalInjected,
    totalCaught,
  }

  return { report, cases, detections }
}

function buildOverallNote(infra: CalibrationInfra): string {
  const lines: string[] = []
  lines.push(
    'Số recall THẬT (deterministic, miễn phí): genus + wrong_answer do Tier-1 bắt.',
  )
  lines.push(
    infra.hunspellAvailable || infra.languageToolUsed
      ? 'umlaut_drop: ĐO ĐƯỢC qua hunspell/LanguageTool trong lần chạy này.'
      : 'umlaut_drop: KHÔNG đo được (thiếu hunspell/LanguageTool) → chưa đáng tin trong lần chạy này.',
  )
  lines.push(
    infra.tier2Live
      ? 'level_violation + bad_translation: đo bằng Tier-2 provider thật.'
      : 'level_violation + bad_translation: chỉ Tier-2 (provider thật) mới bắt; lần chạy mock KHÔNG đo recall thật → chưa đáng tin.',
  )
  lines.push(
    'Tín hiệu red-team cho wrong_answer được tạo bởi bộ giải mù "mô phỏng" (harness wiring), không phải recall của model thật.',
  )
  return lines.join(' ')
}

// ===========================================================================
// Report formatting
// ===========================================================================

/** Render the recall report as Markdown (the `recall-report.md` deliverable). */
export function formatRecallReport(report: RecallReport): string {
  const pct = (n: number) => `${(n * 100).toFixed(0)}%`
  const lines: string[] = []
  lines.push('# Mutation Gold-Set Calibration — Recall Report')
  lines.push('')
  lines.push('Spec: `fuxie-content-review-board` · Task 5.1 · Component 5 (mutation calibration).')
  lines.push('')
  lines.push('Vai chinh: AI / LLM Engineer · Vai phoi hop: QA Automation Engineer, Content QA, DevOps')
  lines.push('')
  lines.push('## Run parameters')
  lines.push('')
  lines.push(`- N (target cases): ${report.params.n}`)
  lines.push(`- per-type cases: ${report.params.perType}`)
  lines.push(`- seed: ${report.params.seed}`)
  lines.push(`- level scope: ${report.params.level ?? '(all)'}`)
  lines.push(`- total injected: ${report.totalInjected}`)
  lines.push(`- total caught: ${report.totalCaught}`)
  lines.push('')
  lines.push('## Infrastructure availability (affects what is REAL vs unmeasured)')
  lines.push('')
  lines.push(`- hunspell: ${report.infra.hunspellAvailable ? 'available' : `unavailable (${report.infra.hunspellReason ?? 'not detected'})`}`)
  lines.push(`- LanguageTool: ${report.infra.languageToolUsed ? 'used' : 'not used (offline run)'}`)
  lines.push(`- Tier-2 provider: ${report.infra.tier2Live ? 'LIVE' : 'mock (no credit spent)'}`)
  lines.push('')
  lines.push('## Recall by mutation type')
  lines.push('')
  lines.push('| Type | Injected | Caught | Recall | Caught by | Tin cậy? |')
  lines.push('| --- | ---: | ---: | ---: | --- | --- |')
  for (const type of MUTATION_TYPES) {
    const e = report.byType[type]
    const trust = e.measurable && e.recall >= RECALL_TRUSTWORTHY_THRESHOLD ? '✅ đáng tin' : '⚠️ chưa đáng tin'
    lines.push(
      `| ${type} | ${e.injected} | ${e.caught} | ${pct(e.recall)} | ${e.caughtBy} | ${trust} |`,
    )
  }
  lines.push('')
  lines.push('## Per-type notes (honesty — Req 4.4 / 4.6)')
  lines.push('')
  for (const type of MUTATION_TYPES) {
    lines.push(`- **${type}**: ${report.byType[type].note}`)
  }
  lines.push('')
  lines.push('## What is REAL vs what needs live infrastructure')
  lines.push('')
  lines.push(report.note)
  lines.push('')
  lines.push('## Tier authority (Req 4.6)')
  lines.push('')
  lines.push('- **Tier-1 (deterministic, authoritative, free):** genus (`enum:article`), wrong_answer (`answerkey:contradiction`), umlaut_drop (`hunspell`/LanguageTool spelling).')
  lines.push('- **Tier-2 (advisory, needs provider):** level_violation (CEFR reviewer), bad_translation (VN reviewer), and a red-team cross-check of wrong_answer.')
  lines.push('')
  lines.push('## Content read-only invariant (Property 5, Req 4.5)')
  lines.push('')
  lines.push(`- content/ byte-identical before+after: ${report.contentReadOnly ? '✅ yes' : '❌ NO — aborted'}`)
  lines.push(`- temp dir removed after measuring: ${report.tempCleaned ? '✅ yes' : '❌ no'}`)
  lines.push('')
  return lines.join('\n')
}
