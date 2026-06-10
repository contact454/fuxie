import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..', '..')
const LEVEL_FILE_COUNTS: Record<string, number> = {
  a1: 21,
  a2: 26,
  b1: 42,
  b2: 60,
  c1: 75,
  c2: 145,
}
const LEVEL_ENTRY_COUNTS: Record<string, number> = {
  a1: 728,
  a2: 768,
  b1: 1194,
  b2: 2100,
  c1: 2638,
  c2: 3033,
}
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
const ARTICLES = new Set(['MASKULIN', 'FEMININ', 'NEUTRUM'])
const PRESENT_KEYS = [
  ['ich', 'du', 'er_sie_es', 'wir', 'ihr', 'sie_Sie'],
  ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie'],
]

type PresentForms = Record<string, string>

type VocabularyWord = {
  word: string
  wordType: string
  article?: string | null
  plural?: string | null
  meaningVi: string
  meaningDe: string
  exampleSentence1: string
  exampleTranslation1: string
  conjugation?: {
    praesens?: PresentForms | string
    reviewStatus?: string
  }
}

type VocabularyFile = {
  words: VocabularyWord[]
  cefrAudit: { verdict: string; targetLevel: string }
  learningOutcomes: unknown[]
}

function vocabularyRecords(): { file: string; level: string; data: VocabularyFile }[] {
  return Object.keys(LEVEL_FILE_COUNTS).flatMap((level) => {
    const dir = path.join(ROOT, 'content', level, 'vocabulary')
    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => ({
        file: path.join(dir, name),
        level,
        data: JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')) as VocabularyFile,
      }))
  })
}

function readVocabularyFile(relativeFile: string): VocabularyFile {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativeFile), 'utf8')) as VocabularyFile
}

function findWord(relativeFile: string, label: string): VocabularyWord {
  const word = readVocabularyFile(relativeFile).words.find((item) => item.word === label)
  expect(word, `${relativeFile}/${label}`).toBeTruthy()
  return word!
}

describe('vocabulary D7 readiness', () => {
  it('covers the complete 369-file and 10,461-entry inventory', () => {
    const records = vocabularyRecords()
    let totalEntries = 0

    for (const [level, expectedFiles] of Object.entries(LEVEL_FILE_COUNTS)) {
      const levelRecords = records.filter((record) => record.level === level)
      const levelEntries = levelRecords.reduce((sum, record) => sum + record.data.words.length, 0)
      expect(levelRecords, `${level}/files`).toHaveLength(expectedFiles)
      expect(levelEntries, `${level}/entries`).toBe(LEVEL_ENTRY_COUNTS[level])
      totalEntries += levelEntries
    }

    expect(records).toHaveLength(369)
    expect(totalEntries).toBe(10_461)
  })

  it('keeps learner-facing fields, CEFR metadata, outcomes, and enum integrity', () => {
    for (const { file, level, data } of vocabularyRecords()) {
      const label = path.relative(ROOT, file)
      const expectedLevel = level.toUpperCase()

      expect(data.cefrAudit?.verdict, `${label}/verdict`).toBe('aligned')
      expect(data.cefrAudit?.targetLevel, `${label}/targetLevel`).toBe(expectedLevel)
      expect(data.learningOutcomes?.length ?? 0, `${label}/learningOutcomes`).toBeGreaterThan(0)
      expect(data.words?.length ?? 0, `${label}/words`).toBeGreaterThan(0)

      for (const [index, word] of data.words.entries()) {
        const wordLabel = `${label}/word-${index + 1}/${word.word}`
        for (const field of [
          'word',
          'wordType',
          'meaningVi',
          'meaningDe',
          'exampleSentence1',
          'exampleTranslation1',
        ] as const) {
          expect(word[field]?.trim(), `${wordLabel}/${field}`).toBeTruthy()
        }
        expect(WORD_TYPES.has(word.wordType), `${wordLabel}/wordType`).toBe(true)
        if (word.article != null) {
          expect(ARTICLES.has(word.article), `${wordLabel}/article`).toBe(true)
        }
        expect(word.article, `${wordLabel}/literal-null-article`).not.toBe('null')
        expect(word.plural, `${wordLabel}/literal-null-plural`).not.toBe('null')
      }
    }
  })

  it('keeps a complete present-tense payload for every verb', () => {
    for (const { file, data } of vocabularyRecords()) {
      const label = path.relative(ROOT, file)
      for (const word of data.words.filter((item) => item.wordType === 'VERB')) {
        const present = word.conjugation?.praesens
        expect(present, `${label}/${word.word}/praesens`).toBeTruthy()
        if (typeof present === 'string') {
          expect(present.trim(), `${label}/${word.word}/praesens-string`).toBeTruthy()
          continue
        }

        const matchingKeys = PRESENT_KEYS.find((keys) =>
          keys.every((key) => typeof present?.[key] === 'string' && present[key].trim()),
        )
        expect(matchingKeys, `${label}/${word.word}/praesens-forms`).toBeTruthy()
      }
    }
  })

  it('preserves the advisory review boundary for remediated and unresolved conjugations', () => {
    const statuses: Record<string, number> = {}
    for (const { data } of vocabularyRecords()) {
      for (const word of data.words) {
        const status = word.conjugation?.reviewStatus
        if (status) statuses[status] = (statuses[status] ?? 0) + 1
      }
    }

    expect(statuses.lexicon_aligned_needs_native_signoff).toBe(1113)
    expect(statuses.corpus_canonicalized_needs_native_signoff).toBe(3)
    expect(statuses.regular_rule_needs_native_signoff).toBe(137)
    expect(statuses.auto_generated_needs_spot_check).toBe(2)
  })

  it('locks the confirmed lexical, semantic, and conjugation corrections', () => {
    const numbers = readVocabularyFile('content/a1/vocabulary/15-zahlen.json').words.filter(
      (word) => word.wordType === 'NUMERALE',
    )
    expect(numbers).toHaveLength(31)

    expect(findWord('content/a1/vocabulary/15-zahlen.json', 'zählen').meaningDe).toBe(
      'Zahlen der Reihe nach nennen.',
    )
    expect(findWord('content/a2/vocabulary/06-essen-restaurant.json', 'scharf').meaningVi).toBe(
      'cay, sắc',
    )
    expect(findWord('content/b1/vocabulary/32-handwerk-reparatur.json', 'Säge').meaningDe).not.toMatch(
      /^Säge ist/u,
    )
    expect(
      findWord('content/b2/vocabulary/07-konsumverhalten-werbung.json', 'werben').conjugation
        ?.praesens,
    ).toEqual({
      ich: 'werbe',
      du: 'wirbst',
      er_sie_es: 'wirbt',
      wir: 'werben',
      ihr: 'werbt',
      sie_Sie: 'werben',
    })
    expect(
      findWord('content/b2/vocabulary/07-konsumverhalten-werbung.json', 'ansprechen').conjugation
        ?.praesens,
    ).toEqual({
      ich: 'spreche an',
      du: 'sprichst an',
      er_sie_es: 'spricht an',
      wir: 'ansprechen',
      ihr: 'sprecht an',
      sie_Sie: 'ansprechen',
    })
    expect(
      findWord('content/b1/vocabulary/14-feste-traditionen.json', 'zusammenkommen').conjugation
        ?.praesens,
    ).toEqual({
      ich: 'komme zusammen',
      du: 'kommst zusammen',
      er_sie_es: 'kommt zusammen',
      wir: 'kommen zusammen',
      ihr: 'kommt zusammen',
      sie_Sie: 'kommen zusammen',
    })
    expect(
      findWord('content/b1/vocabulary/10-beruf-karriere.json', 'sich weiterbilden').conjugation
        ?.praesens,
    ).toEqual({
      ich: 'bilde mich weiter',
      du: 'bildest dich weiter',
      er_sie_es: 'bildet sich weiter',
      wir: 'bilden uns weiter',
      ihr: 'bildet euch weiter',
      sie_Sie: 'bilden sich weiter',
    })
  })

  it('rejects uppercase single-token verbs, adjectives, and adverbs', () => {
    for (const { file, data } of vocabularyRecords()) {
      const label = path.relative(ROOT, file)
      for (const word of data.words) {
        if (
          ['VERB', 'ADJEKTIV', 'ADVERB'].includes(word.wordType) &&
          !word.word.includes(' ')
        ) {
          expect(word.word, `${label}/${word.word}`).not.toMatch(/^[A-ZÄÖÜ]/u)
        }
      }
    }
  })
})
