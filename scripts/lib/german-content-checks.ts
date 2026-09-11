/**
 * Tier-1 deterministic content checks — Genus/plural + wordType/enum + answer-key.
 * Spec `fuxie-content-review-board`, Component 1 (task 2.2).
 *
 * Vai chinh: QA Automation Engineer
 * Vai phoi hop: Content QA / Linguistic Reviewer, Full-stack Engineer
 *
 * Deterministic, local, network-free German-language content checks that
 * complement the LanguageTool/hunspell wiring from task 2.1
 * (`german-lint-checks.ts`). Everything here runs WITHOUT a server, so it is
 * computable even when LanguageTool is unavailable (it is local + free). The
 * orchestrator (`content-german-lint.ts`) merges these findings into the same
 * `Tier1Result` finding stream.
 *
 * Three check groups, all emitting the shared `Tier1Finding` contract type
 * (imported from `review-board-contract.ts`, never redefined):
 *
 *   1. Genus / plural + wordType / enum  (scope content/<level>/vocabulary/*.json)
 *      - enum:article          (error)   article ∉ GENDERS
 *      - enum:wordType         (error)   wordType ∉ WORD_TYPES
 *      - genus:article-usage   (warning) example sentence uses a definite
 *                                        article that contradicts the noun's
 *                                        gender (conservative: only the
 *                                        unambiguous der↔das mismatches)
 *      - genus:plural          (warning) plural field is malformed (wrong
 *                                        plural article — German plural article
 *                                        is always "die")
 *
 *   2. Answer-key consistency  (scope content/<level>/reading/*.json questions[])
 *      - answerkey:option-range    (error)   correctIndex out of range, or
 *                                            answer does not map to a valid
 *                                            option / truth-value
 *      - answerkey:evidence-missing(warning) explanation.key_evidence is
 *                                            non-empty but is not grounded in
 *                                            the linked text (token-overlap,
 *                                            paraphrase-tolerant)
 *      - answerkey:contradiction   (error)   richtig/falsch explanation states
 *                                            the opposite of `answer` via an
 *                                            UNAMBIGUOUS structured marker
 *                                            (kept very conservative — subjective
 *                                            contradiction detection is Tier-2)
 *
 * The single source of truth for the enums is `@fuxie/shared`
 * (`WORD_TYPES`, `GENDERS`, `GENDER_ARTICLES`). We CALL them, never copy them.
 * Resolved via the package source path because the workspace package is not
 * symlinked at the repo root for tsx/vitest (verified to resolve under both).
 *
 * ── Intentional NON-duplication of `scripts/content-qa.ts` (Req 1.8, 7.2) ──
 * `content-qa.ts` already covers (and we DO NOT repeat):
 *   - presence/required-field checks: MISSING_WORD, MISSING_WORD_TYPE,
 *     MISSING_NOUN_ARTICLE, MISSING_NOUN_PLURAL, MISSING_ANSWER,
 *     MISSING_ANSWER_EVIDENCE, MISSING_QUESTION_ID, …
 *   - keyed-OBJECT answer membership: INVALID_ANSWER_OPTION (answer ∉ options
 *     object). We therefore SKIP keyed-object answer membership here and only
 *     ADD the array-options / correctIndex / truth-value validity that
 *     content-qa does not handle.
 * content-qa does NOT validate enum MEMBERSHIP of article/wordType, article↔usage
 * consistency, plural well-formedness, evidence groundedness, or answer↔explanation
 * contradiction — those German-language-specific checks are the new value here.
 *
 * READ-ONLY: nothing in this module writes under `content/`.
 */
import fs from 'node:fs'
import path from 'node:path'

import {
  WORD_TYPES,
  GENDERS,
  GENDER_ARTICLES,
} from '../../packages/shared/src/types/index.ts'
import type { Gender } from '../../packages/shared/src/types/index.ts'
import type { Tier1Finding } from './review-board-contract'

// ---------------------------------------------------------------------------
// Shared enum sets (derived from @fuxie/shared — single source of truth)
// ---------------------------------------------------------------------------

const WORD_TYPE_SET: ReadonlySet<string> = new Set<string>(WORD_TYPES)
const GENDER_SET: ReadonlySet<string> = new Set<string>(GENDERS)

export const CONTENT_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

/**
 * Null-sentinel strings the content generator uses to mean "no value here"
 * (e.g. a VERB carries `article: "null"`). These are ABSENT values, not invalid
 * enum members — flagging them as `enum:*` errors would be a false-positive that
 * blocks the gate on a sentinel. Presence/absence is `content-qa.ts`'s job; we
 * only validate enum MEMBERSHIP of genuinely-present values. (Discovered while
 * running the check against real content/, task 2.2 verification.)
 */
const ENUM_NULL_SENTINELS: ReadonlySet<string> = new Set(['null', 'none', 'n/a', '-', '—', '–'])

/** A present, non-sentinel enum candidate (else null → treated as absent). */
function presentEnumValue(value: unknown): string | null {
  const s = asString(value)
  if (s === null) return null
  return ENUM_NULL_SENTINELS.has(s.trim().toLowerCase()) ? null : s
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function relPath(repoRoot: string, fp: string): string {
  return path.relative(repoRoot, fp).split(path.sep).join('/')
}

function isSidecar(name: string): boolean {
  return /\.qa\.json$/i.test(name) || /\.meta\.json$/i.test(name)
}

// ===========================================================================
// GROUP 1 — Vocabulary: Genus / plural + wordType / enum
// ===========================================================================

/** German definite plural article is ALWAYS "die", regardless of gender. */
const PLURAL_ARTICLE = 'die'

/**
 * Conservative article↔usage check. We scan an example sentence for a definite
 * article placed DIRECTLY before the exact (capitalized) singular word, and
 * only flag the UNAMBIGUOUS mismatches:
 *   - "das <Word>" when the gender is MASKULIN or FEMININ
 *       ("das" is strictly neuter nom/acc — never masc/fem)
 *   - "der <Word>" when the gender is NEUTRUM
 *       ("der" before a neuter singular is wrong; the only valid "der"+neuter
 *        form is plural genitive, which uses the plural form, not the singular)
 *
 * We deliberately DO NOT flag "die <Word>" (ambiguous: feminine sing OR plural)
 * nor "der <FeminineWord>" (valid feminine dative/genitive). Hence: warning, not
 * error. Declension/context can still surprise us, so this never blocks.
 */
export function checkArticleUsage(
  file: string,
  jsonPath: string,
  word: string,
  gender: Gender,
  sentence: string,
  plural?: string | null,
): Tier1Finding[] {
  const findings: Tier1Finding[] = []
  const expected = GENDER_ARTICLES[gender] // der | die | das
  // "der <neuterNoun>" is a valid GENITIVE/DATIVE PLURAL when the plural noun
  // form equals the singular (e.g. das Mittel → die Mittel → gen. "der Mittel").
  // In that case the "der" usage is NOT a Genus error, so we must not flag it.
  const pluralEqualsSingular =
    typeof plural === 'string' &&
    plural.trim().toLowerCase() === `die ${word}`.toLowerCase()
  const re = new RegExp(`\\b(der|die|das)\\s+(${escapeRegExp(word)})\\b`, 'gi')
  let m: RegExpExecArray | null
  while ((m = re.exec(sentence)) !== null) {
    const usedArticle = m[1].toLowerCase()
    if (usedArticle === expected) continue
    const unambiguousMismatch =
      (usedArticle === 'das' && (expected === 'der' || expected === 'die')) ||
      (usedArticle === 'der' && expected === 'das')
    if (!unambiguousMismatch) continue
    // Skip the der+neuter case when it is plausibly a gen./dat. plural form.
    if (usedArticle === 'der' && expected === 'das' && pluralEqualsSingular) continue
    const start = m.index
    const end = m.index + m[0].length
    findings.push({
      file,
      jsonPath,
      rule: 'genus:article-usage',
      severity: 'warning',
      message:
        `Quán từ trong ví dụ ("${m[0]}") không khớp giống của danh từ ` +
        `(${gender} → "${expected} ${word}"). Kiểm tra lại Genus hoặc câu ví dụ.`,
      offset: { start, end, excerpt: m[0] },
      suggestion: `${expected} ${word}`,
    })
  }
  return findings
}

/**
 * Conservative plural well-formedness check (warning). German plural definite
 * article is always "die"; a plural string that LEADS with "der"/"das" is
 * malformed. We never error here — plurals that cannot be dictionary-verified
 * stay as warnings to avoid false positives (design §"Error Handling").
 */
export function checkPlural(file: string, jsonPath: string, plural: string): Tier1Finding[] {
  const leading = /^\s*(der|die|das)\b/i.exec(plural)
  if (!leading) return [] // no leading article → nothing determinable, skip
  const article = leading[1].toLowerCase()
  if (article === PLURAL_ARTICLE) return []
  return [
    {
      file,
      jsonPath,
      rule: 'genus:plural',
      severity: 'warning',
      message:
        `Dạng số nhiều "${plural.trim()}" dùng quán từ "${article}"; quán từ số nhiều ` +
        `trong tiếng Đức luôn là "die". Kiểm tra lại dạng số nhiều.`,
      offset: { start: 0, end: leading[0].length, excerpt: leading[0].trim() },
      suggestion: plural.replace(/^\s*(der|das)\b/i, PLURAL_ARTICLE),
    },
  ]
}

/** Run all vocabulary checks for a single `words[i]` entry. */
export function checkVocabularyWord(
  file: string,
  index: number,
  word: Record<string, unknown>,
): Tier1Finding[] {
  const findings: Tier1Finding[] = []
  const base = `words[${index}]`

  const wordText = asString(word.word) ?? ''
  const wordType = presentEnumValue(word.wordType)
  const article = presentEnumValue(word.article)

  // enum:wordType (error) — membership only; presence is content-qa's job.
  if (wordType !== null && !WORD_TYPE_SET.has(wordType)) {
    findings.push({
      file,
      jsonPath: `${base}.wordType`,
      rule: 'enum:wordType',
      severity: 'error',
      message:
        `wordType "${wordType}" không hợp lệ. Giá trị hợp lệ: ${WORD_TYPES.join(', ')}.`,
      offset: { start: 0, end: wordType.length, excerpt: wordType },
    })
  }

  // enum:article (error) — membership only; presence is content-qa's job.
  if (article !== null && !GENDER_SET.has(article)) {
    findings.push({
      file,
      jsonPath: `${base}.article`,
      rule: 'enum:article',
      severity: 'error',
      message:
        `article "${article}" không hợp lệ. Giá trị hợp lệ: ${GENDERS.join(', ')}.`,
      offset: { start: 0, end: article.length, excerpt: article },
    })
  }

  const isNoun = wordType === 'NOMEN'
  const validGender = article !== null && GENDER_SET.has(article)

  // genus:article-usage (warning) — only when we have a valid gender + a word.
  if (isNoun && validGender && wordText) {
    for (const field of ['exampleSentence1', 'exampleSentence2'] as const) {
      const sentence = asString(word[field])
      if (!sentence) continue
      findings.push(
        ...checkArticleUsage(file, `${base}.${field}`, wordText, article as Gender, sentence, asString(word.plural)),
      )
    }
  }

  // genus:plural (warning) — only when a plural string is present.
  if (isNoun) {
    const plural = asString(word.plural)
    if (plural) findings.push(...checkPlural(file, `${base}.plural`, plural))
  }

  return findings
}

/** Run vocabulary checks across an entire parsed vocabulary file. */
export function checkVocabularyFile(file: string, data: unknown): Tier1Finding[] {
  if (!isObject(data) || !Array.isArray(data.words)) return []
  const findings: Tier1Finding[] = []
  data.words.forEach((entry, index) => {
    if (isObject(entry)) findings.push(...checkVocabularyWord(file, index, entry))
  })
  return findings
}

// ===========================================================================
// GROUP 2 — Reading: answer-key consistency
// ===========================================================================

const TRUTH_QUESTION_TYPES: ReadonlySet<string> = new Set([
  'richtig_falsch',
  'true_false',
  'wahr_falsch',
  'ja_nein',
])

/** Map a richtig/falsch-style answer token to its canonical truth value. */
export function truthValue(answer: unknown): 'richtig' | 'falsch' | null {
  const a = String(answer ?? '').trim().toLowerCase()
  if (['richtig', 'r', 'wahr', 'true', 'ja'].includes(a)) return 'richtig'
  if (['falsch', 'f', 'false', 'nein'].includes(a)) return 'falsch'
  return null
}

/** Build the {id → content} text map + a combined-passage fallback for a file. */
export function buildTextIndex(data: Record<string, unknown>): {
  byId: Map<string, string>
  combined: string
} {
  const byId = new Map<string, string>()
  const parts: string[] = []
  if (Array.isArray(data.texts)) {
    for (const t of data.texts) {
      if (!isObject(t)) continue
      const content = asString(t.content)
      if (!content) continue
      const id = asString(t.id)
      if (id) byId.set(id, content)
      parts.push(content)
    }
  }
  // Fallback single-string passages some reading shapes use.
  for (const key of ['text', 'passage', 'content'] as const) {
    const v = asString(data[key])
    if (v) parts.push(v)
  }
  return { byId, combined: parts.join('\n') }
}

/**
 * Normalize a German string into comparable tokens (lowercased, punctuation
 * stripped, trailing ellipsis removed, very short tokens dropped). Used for the
 * paraphrase-tolerant evidence-overlap check.
 */
export function evidenceTokens(s: string): string[] {
  return s
    .replace(/[…]|\.\.\.+/g, ' ')
    .toLowerCase()
    .replace(/[.,;:!?„“”"'»«()\[\]\-–—/]/g, ' ')
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 3)
}

/** Fraction of evidence tokens that also appear in the source text [0..1]. */
export function evidenceOverlap(evidence: string, source: string): number {
  const evTokens = evidenceTokens(evidence)
  if (evTokens.length === 0) return 1 // nothing determinable → treat as grounded
  const sourceSet = new Set(evidenceTokens(source))
  const hits = evTokens.filter((t) => sourceSet.has(t)).length
  return hits / evTokens.length
}

/** Minimum overlap below which key_evidence is considered ungrounded. */
export const EVIDENCE_OVERLAP_THRESHOLD = 0.6

/** Determine the option count for a question's `options` (array OR keyed object). */
function optionCount(options: unknown): number | null {
  if (Array.isArray(options)) return options.length
  if (isObject(options)) return Object.keys(options).length
  return null
}

/** Run answer-key checks for a single reading question. */
export function checkReadingQuestion(
  file: string,
  index: number,
  question: Record<string, unknown>,
  textIndex: { byId: Map<string, string>; combined: string },
): Tier1Finding[] {
  const findings: Tier1Finding[] = []
  const base = `questions[${index}]`
  const type = (asString(question.type) ?? '').toLowerCase()
  const options = question.options
  const answer = question.answer

  // --- answerkey:option-range (error) ------------------------------------
  // correctIndex must land inside the options collection (array or object).
  if (typeof question.correctIndex === 'number') {
    const count = optionCount(options)
    if (count === null || question.correctIndex < 0 || question.correctIndex >= count) {
      findings.push({
        file,
        jsonPath: `${base}.correctIndex`,
        rule: 'answerkey:option-range',
        severity: 'error',
        message:
          `correctIndex=${question.correctIndex} nằm ngoài phạm vi options ` +
          `(${count ?? 0} lựa chọn).`,
      })
    }
  }

  if (answer !== undefined && answer !== null && String(answer).length > 0) {
    if (Array.isArray(options)) {
      // ARRAY options (content-qa only handles keyed-OBJECT membership).
      const values = options.map((o) => String(o))
      const asIndex = Number(answer)
      const validIndex =
        Number.isInteger(asIndex) && asIndex >= 0 && asIndex < options.length
      const validValue = values.includes(String(answer))
      if (!validIndex && !validValue) {
        findings.push({
          file,
          jsonPath: `${base}.answer`,
          rule: 'answerkey:option-range',
          severity: 'error',
          message:
            `answer "${String(answer)}" không trỏ tới option hợp lệ ` +
            `(mảng ${options.length} lựa chọn).`,
        })
      }
    } else if (!isObject(options) && TRUTH_QUESTION_TYPES.has(type)) {
      // No options + truth-value question → answer must be a truth marker.
      if (truthValue(answer) === null) {
        findings.push({
          file,
          jsonPath: `${base}.answer`,
          rule: 'answerkey:option-range',
          severity: 'error',
          message:
            `answer "${String(answer)}" không phải giá trị đúng/sai hợp lệ ` +
            `cho câu hỏi "${type}" (mong đợi richtig/falsch).`,
        })
      }
    }
    // keyed-OBJECT options + string answer membership → content-qa's job (skip).
  }

  // --- explanation-derived checks ----------------------------------------
  const explanation = question.explanation
  if (isObject(explanation)) {
    const keyEvidence = asString(explanation.key_evidence)
    const linkedId = asString(question.linked_text)
    const source =
      (linkedId && textIndex.byId.get(linkedId)) || textIndex.combined || ''

    // answerkey:evidence-missing (warning) — groundedness, not presence.
    if (keyEvidence && source) {
      const overlap = evidenceOverlap(keyEvidence, source)
      if (overlap < EVIDENCE_OVERLAP_THRESHOLD) {
        findings.push({
          file,
          jsonPath: `${base}.explanation.key_evidence`,
          rule: 'answerkey:evidence-missing',
          severity: 'warning',
          message:
            `key_evidence ("${keyEvidence.slice(0, 60)}${keyEvidence.length > 60 ? '…' : ''}") ` +
            `không khớp với văn bản liên kết${linkedId ? ` (${linkedId})` : ''} ` +
            `(độ trùng token ${(overlap * 100).toFixed(0)}% < ${(EVIDENCE_OVERLAP_THRESHOLD * 100).toFixed(0)}%).`,
        })
      }
    }

    // answerkey:contradiction (error) — VERY conservative: only when an
    // UNAMBIGUOUS structured verdict marker ("Đáp án: richtig/falsch") in the
    // VN explanation disagrees with the stored richtig/falsch answer.
    if (TRUTH_QUESTION_TYPES.has(type)) {
      const answerTruth = truthValue(answer)
      const vi = asString(explanation.vi) ?? ''
      const marker = /đáp\s*án\s*[:：]\s*(richtig|falsch|wahr|r|f)\b/i.exec(vi)
      if (answerTruth && marker) {
        const markerTruth = truthValue(marker[1])
        if (markerTruth && markerTruth !== answerTruth) {
          findings.push({
            file,
            jsonPath: `${base}.explanation.vi`,
            rule: 'answerkey:contradiction',
            severity: 'error',
            message:
              `Giải thích nêu "Đáp án: ${marker[1]}" nhưng trường answer là "${String(answer)}" ` +
              `(${answerTruth}). Đáp án và giải thích mâu thuẫn.`,
            offset: {
              start: marker.index,
              end: marker.index + marker[0].length,
              excerpt: marker[0],
            },
          })
        }
      }
    }
  }

  return findings
}

/** Run answer-key checks across an entire parsed reading file. */
export function checkReadingFile(file: string, data: unknown): Tier1Finding[] {
  if (!isObject(data) || !Array.isArray(data.questions)) return []
  const textIndex = buildTextIndex(data)
  const findings: Tier1Finding[] = []
  data.questions.forEach((q, index) => {
    if (isObject(q)) findings.push(...checkReadingQuestion(file, index, q, textIndex))
  })
  return findings
}

// ===========================================================================
// Read-only scanners (wired by the orchestrator)
// ===========================================================================

export interface ContentScanResult {
  files: string[]
  findings: Tier1Finding[]
}

function readJson(fp: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'))
  } catch {
    return null
  }
}

function scanSkill(
  repoRoot: string,
  skill: 'vocabulary' | 'reading',
  level: string | undefined,
  check: (rel: string, data: unknown) => Tier1Finding[],
): ContentScanResult {
  const files: string[] = []
  const findings: Tier1Finding[] = []
  const levels = level ? [level] : (CONTENT_LEVELS as readonly string[])
  for (const lv of levels) {
    const dir = path.join(repoRoot, 'content', lv, skill)
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json') || isSidecar(name)) continue
      const fp = path.join(dir, name)
      const data = readJson(fp)
      if (data === null) continue
      const rel = relPath(repoRoot, fp)
      files.push(rel)
      findings.push(...check(rel, data))
    }
  }
  return { files, findings }
}

/** Scan vocabulary content (Group 1). Read-only. */
export function scanVocabularyFindings(repoRoot: string, level?: string): ContentScanResult {
  return scanSkill(repoRoot, 'vocabulary', level, checkVocabularyFile)
}

/** Scan reading content for answer-key findings (Group 2). Read-only. */
export function scanReadingAnswerKeyFindings(repoRoot: string, level?: string): ContentScanResult {
  return scanSkill(repoRoot, 'reading', level, checkReadingFile)
}
