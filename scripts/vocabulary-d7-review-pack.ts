/**
 * Vocabulary D7 plural/genus/semantic review pack.
 *
 * Vai chinh: German Academic Lead
 * Vai phoi hop: Content QA / Linguistic Reviewer, German Content Writer
 *
 * This script does not sign or mutate content. It builds a deterministic
 * review queue for the human/native vocabulary decisions that remain after
 * objective D7 remediation: plural morphology, article/genus policy, loanword
 * policy, and semantic/example naturalness.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const AUDIT_DIR = path.join(ROOT, 'docs', 'content-quality', 'audit-2026-06')
const OUTPUT_JSON = path.join(AUDIT_DIR, 'vocabulary-d7-review-pack.json')
const OUTPUT_MD = path.join(AUDIT_DIR, 'vocabulary-d7-review-pack.md')
const OUTPUT_CSV = path.join(AUDIT_DIR, 'vocabulary-d7-review-pack.csv')

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const
const LEVEL_ORDER = new Map(LEVELS.map((level, index) => [level.toUpperCase(), index]))
const WORD_TYPES = new Set([
  'NOMEN',
  'VERB',
  'ADJEKTIV',
  'ADVERB',
  'PRAEPOSITION',
  'KONJUNKTION',
  'PRONOMEN',
  'ARTIKEL',
  'PARTIKEL',
  'NUMERALE',
  'PHRASE',
])

type ReviewFlag =
  | 'plural_morphology_pending'
  | 'no_plural_marker_needs_policy'
  | 'article_missing_or_pluralia_policy'
  | 'loanword_policy'
  | 'semantic_definition_needs_review'
  | 'example_lexeme_presence_needs_review'

type Priority = 'P1' | 'P2' | 'P3'

interface VocabularyWord {
  word: string
  article?: string | null
  plural?: string | null
  pluralStatus?: string
  wordType: string
  meaningVi: string
  meaningEn?: string
  meaningDe: string
  exampleSentence1: string
  exampleSentence2?: string
  exampleTranslation1: string
  exampleTranslation2?: string
  conjugation?: {
    reviewStatus?: string
  }
}

interface VocabularyFile {
  words: VocabularyWord[]
  cefrAudit?: {
    targetLevel?: string
    verdict?: string
  }
}

interface ReviewItem {
  id: string
  priority: Priority
  level: string
  file: string
  index: number
  word: string
  wordType: string
  article: string | null
  plural: string | null
  pluralStatus: string | null
  flags: ReviewFlag[]
  reviewerPrompt: string
  meaningVi: string
  meaningDe: string
  exampleSentence1: string
  reviewerVerdict: ''
  reviewerNotes: ''
}

interface ReviewPack {
  generatedAt: string
  scope: {
    vocabularyFiles: number
    entries: number
    nouns: number
  }
  summary: {
    reviewItems: number
    byPriority: Record<Priority, number>
    byLevel: Record<string, number>
    byFlag: Record<ReviewFlag, number>
    vocabularyCellsCovered: number
    csvColumns: string[]
  }
  rules: string[]
  items: ReviewItem[]
}

function rel(filePath: string): string {
  return path.relative(ROOT, filePath).replace(/\\/g, '/')
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

function normalize(value: string): string {
  return value
    .toLocaleLowerCase('de-DE')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/ß/gu, 'ss')
}

function baseLexeme(word: string): string {
  return word
    .replace(/\([^)]*\)/gu, ' ')
    .split(/\s+/u)
    .find((token) => /[\p{L}]/u.test(token)) ?? word
}

function hasLexemeInExample(word: VocabularyWord): boolean {
  const lexeme = normalize(baseLexeme(word.word))
  if (lexeme.length < 5) return true
  const examples = [word.exampleSentence1, word.exampleSentence2].filter(Boolean).map((value) => normalize(String(value)))
  return examples.some((example) => example.includes(lexeme))
}

function hasCircularDefinition(word: VocabularyWord): boolean {
  const lexeme = normalize(baseLexeme(word.word))
  if (lexeme.length < 5) return false
  const definition = normalize(word.meaningDe)
  return new RegExp(`\\b${lexeme}\\b`, 'u').test(definition)
}

function isKnownLoanwordPolicyItem(word: VocabularyWord): boolean {
  return word.word === 'silencen'
}

function flagsFor(word: VocabularyWord): ReviewFlag[] {
  const flags = new Set<ReviewFlag>()

  if (word.wordType === 'NOMEN') {
    if (typeof word.pluralStatus === 'string' || word.plural == null) {
      flags.add('plural_morphology_pending')
    }
    if (word.plural === '-') {
      flags.add('no_plural_marker_needs_policy')
    }
    if (word.article == null) {
      flags.add('article_missing_or_pluralia_policy')
    }
  }

  if (isKnownLoanwordPolicyItem(word)) flags.add('loanword_policy')
  if (hasCircularDefinition(word)) flags.add('semantic_definition_needs_review')
  if (!hasLexemeInExample(word)) flags.add('example_lexeme_presence_needs_review')

  return [...flags].sort()
}

function priorityFor(flags: ReviewFlag[], level: string): Priority {
  if (
    flags.includes('article_missing_or_pluralia_policy') ||
    flags.includes('loanword_policy') ||
    flags.includes('semantic_definition_needs_review')
  ) {
    return 'P1'
  }
  if (['C1', 'C2'].includes(level) && flags.includes('plural_morphology_pending')) return 'P1'
  if (flags.includes('plural_morphology_pending') || flags.includes('no_plural_marker_needs_policy')) return 'P2'
  return 'P3'
}

function reviewerPromptFor(flags: ReviewFlag[]): string {
  const prompts: string[] = []
  if (flags.includes('plural_morphology_pending')) {
    prompts.push('Confirm plural form or mark the noun as normally singular-only/uncountable.')
  }
  if (flags.includes('no_plural_marker_needs_policy')) {
    prompts.push('Verify whether "-" is pedagogically correct for this noun.')
  }
  if (flags.includes('article_missing_or_pluralia_policy')) {
    prompts.push('Confirm article/genus policy, especially plural-only nouns.')
  }
  if (flags.includes('loanword_policy')) {
    prompts.push('Decide whether to keep the loanword or replace it with a German equivalent.')
  }
  if (flags.includes('semantic_definition_needs_review')) {
    prompts.push('Check that the German definition is not circular and matches the Vietnamese meaning.')
  }
  if (flags.includes('example_lexeme_presence_needs_review')) {
    prompts.push('Check that examples clearly demonstrate the target lexeme or an acceptable inflected form.')
  }
  return prompts.join(' ')
}

function buildReviewPack(now = new Date().toISOString()): ReviewPack {
  const files = vocabularyFiles()
  const items: ReviewItem[] = []
  let entries = 0
  let nouns = 0

  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8')) as VocabularyFile
    const relativeFile = rel(file)
    const level = relativeFile.split('/')[1].toUpperCase()
    for (const [index, word] of data.words.entries()) {
      entries++
      if (word.wordType === 'NOMEN') nouns++
      if (!WORD_TYPES.has(word.wordType)) continue
      const flags = flagsFor(word)
      if (!flags.length) continue
      items.push({
        id: `${relativeFile}#words[${index}]`,
        priority: priorityFor(flags, level),
        level,
        file: relativeFile,
        index,
        word: word.word,
        wordType: word.wordType,
        article: word.article ?? null,
        plural: word.plural ?? null,
        pluralStatus: word.pluralStatus ?? null,
        flags,
        reviewerPrompt: reviewerPromptFor(flags),
        meaningVi: word.meaningVi,
        meaningDe: word.meaningDe,
        exampleSentence1: word.exampleSentence1,
        reviewerVerdict: '',
        reviewerNotes: '',
      })
    }
  }

  items.sort((a, b) => {
    const priority = a.priority.localeCompare(b.priority)
    if (priority) return priority
    const level = (LEVEL_ORDER.get(a.level) ?? 99) - (LEVEL_ORDER.get(b.level) ?? 99)
    if (level) return level
    return a.id.localeCompare(b.id)
  })

  const byPriority = { P1: 0, P2: 0, P3: 0 }
  const byLevel = Object.fromEntries(LEVELS.map((level) => [level.toUpperCase(), 0]))
  const byFlag = {
    plural_morphology_pending: 0,
    no_plural_marker_needs_policy: 0,
    article_missing_or_pluralia_policy: 0,
    loanword_policy: 0,
    semantic_definition_needs_review: 0,
    example_lexeme_presence_needs_review: 0,
  }
  for (const item of items) {
    byPriority[item.priority]++
    byLevel[item.level]++
    for (const flag of item.flags) byFlag[flag]++
  }

  return {
    generatedAt: now,
    scope: {
      vocabularyFiles: files.length,
      entries,
      nouns,
    },
    summary: {
      reviewItems: items.length,
      byPriority,
      byLevel,
      byFlag,
      vocabularyCellsCovered: LEVELS.length,
      csvColumns: [
        'id',
        'priority',
        'level',
        'file',
        'index',
        'word',
        'wordType',
        'article',
        'plural',
        'pluralStatus',
        'flags',
        'reviewerPrompt',
        'meaningVi',
        'meaningDe',
        'exampleSentence1',
        'reviewerVerdict',
        'reviewerNotes',
      ],
    },
    rules: [
      'This pack is a reviewer queue, not a signoff artifact.',
      'Rows with blank reviewerVerdict are pending human/native review.',
      'Any accepted correction must be applied to content and guarded by tests before signoff-manifest.json changes.',
      'Loanword and pluralia-tantum decisions are pedagogical policy decisions, not automatic fixes.',
    ],
    items,
  }
}

function csvCell(value: unknown): string {
  const text = Array.isArray(value) ? value.join(';') : String(value ?? '')
  return `"${text.replace(/"/g, '""')}"`
}

function renderCsv(pack: ReviewPack): string {
  const columns = pack.summary.csvColumns
  const lines = [columns.join(',')]
  for (const item of pack.items) {
    lines.push(columns.map((column) => csvCell(item[column as keyof ReviewItem])).join(','))
  }
  return `${lines.join('\n')}\n`
}

function renderMarkdown(pack: ReviewPack): string {
  const lines: string[] = []
  lines.push('# Vocabulary D7 Review Pack')
  lines.push('')
  lines.push(`Generated: ${pack.generatedAt}`)
  lines.push('')
  lines.push('## Scope')
  lines.push('')
  lines.push(`- Vocabulary files: ${pack.scope.vocabularyFiles}; entries: ${pack.scope.entries}; nouns: ${pack.scope.nouns}.`)
  lines.push(`- Review queue rows: ${pack.summary.reviewItems}.`)
  lines.push(`- Priority split: P1=${pack.summary.byPriority.P1}, P2=${pack.summary.byPriority.P2}, P3=${pack.summary.byPriority.P3}.`)
  lines.push(`- Vocabulary cells covered: ${pack.summary.vocabularyCellsCovered}/6.`)
  lines.push('')
  lines.push('## Flag Counts')
  lines.push('')
  lines.push('| Flag | Rows |')
  lines.push('| --- | ---: |')
  for (const [flag, count] of Object.entries(pack.summary.byFlag)) {
    lines.push(`| ${flag} | ${count} |`)
  }
  lines.push('')
  lines.push('## Level Counts')
  lines.push('')
  lines.push('| Level | Rows |')
  lines.push('| --- | ---: |')
  for (const [level, count] of Object.entries(pack.summary.byLevel)) {
    lines.push(`| ${level} | ${count} |`)
  }
  lines.push('')
  lines.push('## First P1 Rows')
  lines.push('')
  lines.push('| Level | Word | Flags | File | Prompt |')
  lines.push('| --- | --- | --- | --- | --- |')
  for (const item of pack.items.filter((row) => row.priority === 'P1').slice(0, 30)) {
    lines.push(`| ${item.level} | ${item.word} | ${item.flags.join(', ')} | \`${item.file}\` | ${item.reviewerPrompt} |`)
  }
  lines.push('')
  lines.push('## Reviewer Workflow')
  lines.push('')
  lines.push('- Work from `vocabulary-d7-review-pack.csv`; fill `reviewerVerdict` with `pass`, `fix`, or `reject` and add `reviewerNotes`.')
  lines.push('- Do not update `signoff-manifest.json` from this pack alone; apply accepted fixes first, rerun gates, then sign by cell.')
  lines.push('- Keep `silencen` under loanword policy review until a German Academic Lead decides whether it belongs in the lesson.')
  return `${lines.join('\n')}\n`
}

function validateReviewPack(pack: ReviewPack): string[] {
  const errors: string[] = []
  if (pack.scope.vocabularyFiles !== 369) errors.push(`expected 369 vocabulary files, got ${pack.scope.vocabularyFiles}`)
  if (pack.scope.entries !== 10_461) errors.push(`expected 10461 vocabulary entries, got ${pack.scope.entries}`)
  if (pack.scope.nouns !== 6_159) errors.push(`expected 6159 nouns, got ${pack.scope.nouns}`)
  if (pack.summary.vocabularyCellsCovered !== 6) errors.push(`expected 6 vocabulary cells, got ${pack.summary.vocabularyCellsCovered}`)
  if (pack.items.length !== pack.summary.reviewItems) errors.push('reviewItems summary does not match items length')
  if (!pack.items.some((item) => item.word === 'silencen' && item.flags.includes('loanword_policy'))) {
    errors.push('silencen loanword policy row is missing')
  }
  const ids = new Set<string>()
  for (const item of pack.items) {
    if (ids.has(item.id)) errors.push(`duplicate review id: ${item.id}`)
    ids.add(item.id)
    if (item.reviewerVerdict !== '' || item.reviewerNotes !== '') {
      errors.push(`${item.id}: reviewer fields must remain blank in generated pack`)
    }
  }
  return errors
}

function main(): void {
  const check = process.argv.includes('--check')
  const pack = buildReviewPack()
  const errors = validateReviewPack(pack)
  if (errors.length) {
    for (const error of errors) process.stderr.write(`[vocabulary-d7-review-pack] ${error}\n`)
    process.exitCode = 1
    return
  }

  const json = `${JSON.stringify(pack, null, 2)}\n`
  const md = renderMarkdown(pack)
  const csv = renderCsv(pack)

  if (check) {
    const stableJson = (value: string) => value.replace(/"generatedAt": ".*?"/, '"generatedAt": "<timestamp>"')
    const stableMd = (value: string) => value.replace(/^Generated: .+$/m, 'Generated: <timestamp>')
    const currentJson = fs.existsSync(OUTPUT_JSON) ? fs.readFileSync(OUTPUT_JSON, 'utf8') : ''
    const currentMd = fs.existsSync(OUTPUT_MD) ? fs.readFileSync(OUTPUT_MD, 'utf8') : ''
    const currentCsv = fs.existsSync(OUTPUT_CSV) ? fs.readFileSync(OUTPUT_CSV, 'utf8') : ''
    if (stableJson(currentJson) !== stableJson(json) || stableMd(currentMd) !== stableMd(md) || currentCsv !== csv) {
      process.stderr.write('[vocabulary-d7-review-pack] generated files are stale\n')
      process.exitCode = 1
    }
    return
  }

  fs.writeFileSync(OUTPUT_JSON, json, 'utf8')
  fs.writeFileSync(OUTPUT_MD, md, 'utf8')
  fs.writeFileSync(OUTPUT_CSV, csv, 'utf8')
  process.stdout.write(`[vocabulary-d7-review-pack] ${rel(OUTPUT_JSON)}\n`)
  process.stdout.write(`[vocabulary-d7-review-pack] ${rel(OUTPUT_MD)}\n`)
  process.stdout.write(`[vocabulary-d7-review-pack] ${rel(OUTPUT_CSV)}\n`)
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (invokedDirectly) main()

export {
  buildReviewPack,
  renderCsv,
  renderMarkdown,
  validateReviewPack,
}
