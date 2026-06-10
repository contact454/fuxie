import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const
const AUTO_REVIEW = 'auto_generated_needs_spot_check'
const LEXICON_REVIEW = 'lexicon_aligned_needs_native_signoff'
const CORPUS_REVIEW = 'corpus_canonicalized_needs_native_signoff'

type PresentForms = {
  ich: string
  du: string
  er_sie_es: string
  wir: string
  ihr: string
  sie_Sie: string
}

type Conjugation = {
  praesens?: PresentForms | string
  isIrregular?: boolean
  isSeparable?: boolean
  reviewStatus?: string
  [key: string]: unknown
}

type VocabularyWord = {
  word: string
  article?: string | null
  plural?: string | null
  wordType: string
  meaningVi: string
  meaningDe: string
  conjugation?: Conjugation
  [key: string]: unknown
}

type VocabularyFile = {
  words: VocabularyWord[]
  cefrAudit?: { notes?: string }
  [key: string]: unknown
}

type LexiconRow = {
  infinitive: string
  ich: string
  du: string
  erSieEs: string
  praeteritumIch: string
  partizip2: string
  konjunktiv2Ich: string
  imperativSingular: string
  imperativPlural: string
  auxiliary: string
}

type RecordItem = {
  file: string
  level: string
  data: VocabularyFile
}

const KNOWN_CONTENT_FIXES: Record<string, Partial<VocabularyWord>> = {
  'content/a1/vocabulary/15-zahlen.json::zählen': {
    meaningDe: 'Zahlen der Reihe nach nennen.',
  },
  'content/a2/vocabulary/06-essen-restaurant.json::scharf': {
    meaningVi: 'cay, sắc',
  },
  'content/b1/vocabulary/32-handwerk-reparatur.json::Säge': {
    meaningDe: 'Ein Werkzeug mit gezahntem Blatt zum Schneiden von Holz oder Metall.',
  },
}

function vocabularyFiles(): string[] {
  return LEVELS.flatMap((level) => {
    const dir = path.join(ROOT, 'content', level, 'vocabulary')
    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => path.join(dir, name))
  })
}

function relativeFile(file: string): string {
  return path.relative(ROOT, file).replaceAll('\\', '/')
}

function normalizeVerbLabel(label: string): string {
  const stripped = label
    .toLocaleLowerCase('de-DE')
    .replace(/\([^)]*\)/gu, ' ')
    .replace(/[;,]/gu, ' ')
    .replace(
      /\b(sich|etw\.?|etwas|jdn\.?|jdm\.?|jemanden|jemandem|auf|an|mit|von|für|gegen|als)\b/gu,
      ' ',
    )
    .replace(/\s+/gu, ' ')
    .trim()
  const tokens = stripped.split(' ').filter(Boolean)
  const verbCandidates = tokens.filter((token) => /(en|eln|ern)$/u.test(token))
  return verbCandidates.at(-1) ?? tokens.at(-1) ?? stripped
}

function isPresentForms(value: unknown): value is PresentForms {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const forms = value as Record<string, unknown>
  return ['ich', 'du', 'er_sie_es', 'wir', 'ihr', 'sie_Sie'].every(
    (key) => typeof forms[key] === 'string' && forms[key].trim(),
  )
}

function parseLexicon(file: string | undefined): Map<string, LexiconRow> {
  const rows = new Map<string, LexiconRow>()
  if (!file) return rows
  const absolute = path.resolve(ROOT, file)
  if (!fs.existsSync(absolute)) throw new Error(`Vocabulary lexicon not found: ${absolute}`)

  const lines = fs.readFileSync(absolute, 'utf8').split(/\r?\n/u).slice(1)
  for (const line of lines) {
    if (!line.trim()) continue
    const fields = line.split(',')
    if (fields.length !== 10) continue
    const [
      infinitive,
      ich,
      du,
      erSieEs,
      praeteritumIch,
      partizip2,
      konjunktiv2Ich,
      imperativSingular,
      imperativPlural,
      auxiliary,
    ] = fields.map((field) => field.trim())
    rows.set(infinitive.toLocaleLowerCase('de-DE'), {
      infinitive,
      ich,
      du,
      erSieEs,
      praeteritumIch,
      partizip2,
      konjunktiv2Ich,
      imperativSingular,
      imperativPlural,
      auxiliary,
    })
  }
  return rows
}

function addReflexive(form: string, pronoun: string): string {
  const [finite, ...remainder] = form.trim().split(/\s+/u)
  return [finite, pronoun, ...remainder].filter(Boolean).join(' ')
}

function presentForms(row: LexiconRow, reflexive: boolean): PresentForms {
  const forms: PresentForms = {
    ich: row.ich,
    du: row.du,
    er_sie_es: row.erSieEs,
    wir: row.infinitive,
    ihr: row.imperativPlural,
    sie_Sie: row.infinitive,
  }
  if (!reflexive) return forms
  return {
    ich: addReflexive(forms.ich, 'mich'),
    du: addReflexive(forms.du, 'dich'),
    er_sie_es: addReflexive(forms.er_sie_es, 'sich'),
    wir: addReflexive(forms.wir, 'uns'),
    ihr: addReflexive(forms.ihr, 'euch'),
    sie_Sie: addReflexive(forms.sie_Sie, 'sich'),
  }
}

function buildCanonicalMap(records: RecordItem[]): Map<string, Conjugation> {
  const canonical = new Map<string, Conjugation>()
  for (const record of records) {
    for (const word of record.data.words) {
      if (
        word.wordType === 'VERB' &&
        word.conjugation &&
        !word.conjugation.reviewStatus &&
        isPresentForms(word.conjugation.praesens)
      ) {
        const key = word.word.toLocaleLowerCase('de-DE')
        if (!canonical.has(key)) canonical.set(key, structuredClone(word.conjugation))
      }
    }
  }
  return canonical
}

function lowerInitial(value: string): string {
  return value.charAt(0).toLocaleLowerCase('de-DE') + value.slice(1)
}

function applyKnownFixes(
  file: string,
  word: VocabularyWord,
  reasons: Record<string, number>,
): boolean {
  let changed = false
  const key = `${relativeFile(file)}::${word.word}`
  const fix = KNOWN_CONTENT_FIXES[key]
  if (fix) {
    for (const [field, value] of Object.entries(fix)) {
      if (word[field] !== value) {
        word[field] = value
        changed = true
      }
    }
    if (changed) reasons['known-content-fix'] = (reasons['known-content-fix'] ?? 0) + 1
  }
  return changed
}

function validate(records: RecordItem[]) {
  const errors: string[] = []
  let files = 0
  let entries = 0
  for (const record of records) {
    files++
    for (const [index, word] of record.data.words.entries()) {
      entries++
      const label = `${relativeFile(record.file)}#${index}/${word.word}`
      if (word.article === 'null') errors.push(`${label}: article is the string "null"`)
      if (word.plural === 'null') errors.push(`${label}: plural is the string "null"`)
      if (
        ['VERB', 'ADJEKTIV', 'ADVERB'].includes(word.wordType) &&
        !word.word.includes(' ') &&
        /^[A-ZÄÖÜ]/u.test(word.word)
      ) {
        errors.push(`${label}: single-token ${word.wordType} starts uppercase`)
      }
    }
  }
  if (files !== 369) errors.push(`Vocabulary inventory has ${files} files, expected 369`)
  if (entries !== 10_461) errors.push(`Vocabulary inventory has ${entries} entries, expected 10461`)
  if (errors.length) throw new Error(`Vocabulary D7 validation failed:\n${errors.slice(0, 50).join('\n')}`)
}

function main() {
  const write = process.argv.includes('--write')
  const lexiconArgIndex = process.argv.indexOf('--lexicon')
  const lexiconPath = lexiconArgIndex >= 0 ? process.argv[lexiconArgIndex + 1] : undefined
  const lexicon = parseLexicon(lexiconPath)
  const records: RecordItem[] = vocabularyFiles().map((file) => ({
    file,
    level: relativeFile(file).split('/')[1].toUpperCase(),
    data: JSON.parse(fs.readFileSync(file, 'utf8')) as VocabularyFile,
  }))
  const canonical = buildCanonicalMap(records)
  const reasons: Record<string, number> = {}
  const touchedFiles = new Set<string>()
  const byLevel: Record<string, number> = Object.fromEntries(LEVELS.map((level) => [level.toUpperCase(), 0]))

  for (const record of records) {
    let fileChanged = false
    for (const word of record.data.words) {
      let changed = false

      if (word.article === 'null') {
        word.article = null
        reasons['string-null-article'] = (reasons['string-null-article'] ?? 0) + 1
        changed = true
      }
      if (word.plural === 'null') {
        word.plural = word.wordType === 'NOMEN' ? '-' : null
        reasons['string-null-plural'] = (reasons['string-null-plural'] ?? 0) + 1
        changed = true
      }
      if (
        word.wordType === 'NOMEN' &&
        word.plural == null &&
        typeof word.pluralStatus !== 'string'
      ) {
        word.plural = '-'
        reasons['no-plural-marker'] = (reasons['no-plural-marker'] ?? 0) + 1
        changed = true
      }
      if (
        ['VERB', 'ADJEKTIV', 'ADVERB'].includes(word.wordType) &&
        !word.word.includes(' ') &&
        /^[A-ZÄÖÜ]/u.test(word.word)
      ) {
        word.word = lowerInitial(word.word)
        reasons['lowercase-lexeme'] = (reasons['lowercase-lexeme'] ?? 0) + 1
        changed = true
      }
      if (
        relativeFile(record.file) === 'content/a1/vocabulary/15-zahlen.json' &&
        word.wordType === 'NOMEN' &&
        !word.article &&
        /^[a-zäöüß]/u.test(word.word)
      ) {
        word.wordType = 'NUMERALE'
        reasons['number-word-type'] = (reasons['number-word-type'] ?? 0) + 1
        changed = true
      }
      if (applyKnownFixes(record.file, word, reasons)) changed = true

      if (word.wordType === 'VERB' && word.conjugation?.reviewStatus === AUTO_REVIEW) {
        const base = normalizeVerbLabel(word.word)
        const row = lexicon.get(base)
        const canonicalConjugation = canonical.get(word.word.toLocaleLowerCase('de-DE'))
        if (row) {
          const reflexive = /(^|\s)sich(\s|$)|\(sich\)/iu.test(word.word)
          word.conjugation = {
            ...word.conjugation,
            praesens: presentForms(row, reflexive),
            isSeparable: row.ich.includes(' '),
            reviewStatus: LEXICON_REVIEW,
          }
          reasons['lexicon-conjugation'] = (reasons['lexicon-conjugation'] ?? 0) + 1
          changed = true
        } else if (canonicalConjugation) {
          word.conjugation = {
            ...structuredClone(canonicalConjugation),
            reviewStatus: CORPUS_REVIEW,
          }
          reasons['corpus-conjugation'] = (reasons['corpus-conjugation'] ?? 0) + 1
          changed = true
        }
      }

      if (changed) fileChanged = true
    }

    if (fileChanged) {
      touchedFiles.add(record.file)
      byLevel[record.level]++
      const note =
        'Vocabulary D7 advisory remediation: objective schema, lexeme, semantic, or conjugation blockers were corrected; final native signoff remains pending.'
      if (record.data.cefrAudit && !record.data.cefrAudit.notes?.includes(note)) {
        record.data.cefrAudit.notes = [record.data.cefrAudit.notes?.trim(), note].filter(Boolean).join(' ')
      }
    }
  }

  validate(records)
  if (write) {
    for (const record of records) {
      if (touchedFiles.has(record.file)) {
        fs.writeFileSync(record.file, `${JSON.stringify(record.data, null, 2)}\n`, 'utf8')
      }
    }
  }

  const remainingAutoReview = records.reduce(
    (total, record) =>
      total +
      record.data.words.filter(
        (word) => word.wordType === 'VERB' && word.conjugation?.reviewStatus === AUTO_REVIEW,
      ).length,
    0,
  )
  console.log(
    JSON.stringify(
      {
        mode: write ? 'write' : 'dry-run',
        totalVocabularyFiles: records.length,
        totalEntries: records.reduce((sum, record) => sum + record.data.words.length, 0),
        lexiconEntries: lexicon.size,
        touchedFiles: touchedFiles.size,
        byLevel,
        reasons,
        remainingAutoReview,
      },
      null,
      2,
    ),
  )
}

main()
