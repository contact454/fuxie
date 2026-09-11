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
  articleStatus?: string
  pluralStatus?: string
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

    expect(statuses.lexicon_aligned_needs_native_signoff).toBe(1114)
    expect(statuses.corpus_canonicalized_needs_native_signoff).toBe(3)
    expect(statuses.regular_rule_needs_native_signoff).toBe(138)
    expect(statuses.auto_generated_needs_spot_check ?? 0).toBe(0)
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
      findWord('content/c2/vocabulary/116-digitaler-humanismus.json', 'Digitaler Humanismus')
        .word,
    ).toBe('Digitaler Humanismus')
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
    expect(
      findWord('content/c2/vocabulary/113-epigenetik.json', 'silencen').conjugation
        ?.praesens,
    ).toEqual({
      ich: 'silence',
      du: 'silencst',
      er_sie_es: 'silenct',
      wir: 'silencen',
      ihr: 'silenct',
      sie_Sie: 'silencen',
    })
    expect(
      findWord('content/c2/vocabulary/114-technikphilosophie.json', 'entbergen').conjugation
        ?.praesens,
    ).toEqual({
      ich: 'entberge',
      du: 'entbirgst',
      er_sie_es: 'entbirgt',
      wir: 'entbergen',
      ihr: 'entbergt',
      sie_Sie: 'entbergen',
    })
  })

  it('keeps A1 month morphology aligned with Duden', () => {
    const expectedMonths = new Map([
      ['Januar', 'die Januare'],
      ['Februar', 'die Februare'],
      ['März', 'die Märze'],
      ['April', 'die Aprile'],
      ['Mai', 'die Maie'],
      ['Juni', 'die Junis'],
      ['Juli', 'die Julis'],
      ['August', 'die Auguste'],
      ['September', 'die September'],
      ['Oktober', 'die Oktober'],
      ['November', 'die November'],
      ['Dezember', 'die Dezember'],
    ])

    for (const [month, plural] of expectedMonths) {
      const word = findWord('content/a1/vocabulary/14-zeitangaben.json', month)
      expect(word.article).toBe('MASKULIN')
      expect(word.plural).toBe(plural)
      expect(word.articleStatus).toBe('duden_aligned_needs_native_signoff')
      expect(word.pluralStatus).toBe('duden_aligned_needs_native_signoff')
    }
  })

  it('keeps plural lexemes and their singular genus policy explicit', () => {
    const genderedPluralLexemes = [
      ['content/a1/vocabulary/02-familie-freunde.json', 'Geschwister', 'NEUTRUM', 'die Geschwister'],
      ['content/a1/vocabulary/03-koerper-gesundheit.json', 'Schmerzen', 'MASKULIN', 'die Schmerzen'],
      ['content/a1/vocabulary/04-wohnen.json', 'Möbel', 'NEUTRUM', 'die Möbel'],
      ['content/a2/vocabulary/04-wohnen-haushalt.json', 'Möbel', 'NEUTRUM', 'die Möbel'],
      ['content/a2/vocabulary/08-dienstleistungen-amt.json', 'Steuern', 'FEMININ', 'die Steuern'],
      ['content/a2/vocabulary/09-bildung-berufsleben.json', 'Kenntnisse', 'FEMININ', 'die Kenntnisse'],
      ['content/a2/vocabulary/10-arbeit-wirtschaft.json', 'Überstunden', 'FEMININ', 'die Überstunden'],
      ['content/a2/vocabulary/12-kommunikation-medien.json', 'Daten', 'NEUTRUM', 'die Daten'],
      ['content/a2/vocabulary/18-geld-finanzen.json', 'Schulden', 'FEMININ', 'die Schulden'],
      ['content/c1/vocabulary/33-migrationsdebatte.json', 'Ressentiments', 'NEUTRUM', 'die Ressentiments'],
    ] as const

    for (const [file, label, article, plural] of genderedPluralLexemes) {
      const word = findWord(file, label)
      expect(word.article).toBe(article)
      expect(word.plural).toBe(plural)
      expect(word.articleStatus).toBe('duden_aligned_needs_native_signoff')
      expect(word.pluralStatus).toBe('duden_aligned_needs_native_signoff')
    }

    const pluralWords = [
      ['content/a1/vocabulary/01-person.json', 'Leute', 'die Leute', 'duden_pluralword_needs_native_signoff'],
      ['content/a1/vocabulary/02-familie-freunde.json', 'Leute', 'die Leute', 'duden_pluralword_needs_native_signoff'],
      ['content/a1/vocabulary/02-familie-freunde.json', 'Eltern', 'die Eltern', 'duden_pluralword_needs_native_signoff'],
      ['content/a1/vocabulary/11-freizeit.json', 'Ferien', 'die Ferien', 'duden_pluralword_needs_native_signoff'],
      ['content/a1/vocabulary/17-laender-nationalitaeten.json', 'USA', 'die USA', 'duden_pluralword_needs_native_signoff'],
      ['content/a2/vocabulary/04-wohnen-haushalt.json', 'Nebenkosten', 'die Nebenkosten', 'duden_pluralword_needs_native_signoff'],
      ['content/c2/vocabulary/87-institutionelle-oekonomie.json', 'Informationskosten', 'die Informationskosten', 'duden_compound_pluralword_needs_native_signoff'],
    ] as const

    for (const [file, label, plural, status] of pluralWords) {
      const word = findWord(file, label)
      expect(word.article).toBeNull()
      expect(word.plural).toBe(plural)
      expect(word.articleStatus).toBe(status)
      expect(word.pluralStatus).toBe(status)
    }
  })

  it('keeps source-backed advanced academic plural morphology explicit', () => {
    const corpusCanonicalized = [
      ['content/c2/vocabulary/04-literaturwissenschaft-hermeneutik.json', 'Sinnkonstitution', 'die Sinnkonstitutionen'],
      ['content/c2/vocabulary/108-atonalitaet-schoenberg.json', 'Klangfarbenmelodie', 'die Klangfarbenmelodien'],
      ['content/c2/vocabulary/108-atonalitaet-schoenberg.json', 'Dodekaphonie', 'die Dodekaphonien'],
      ['content/c2/vocabulary/33-wissenschaftssoziologie.json', 'Wissenssoziologie', 'die Wissenssoziologien'],
      ['content/c2/vocabulary/48-deontologie-konsequentialismus.json', 'Verbindlichkeit', 'die Verbindlichkeiten'],
      ['content/c2/vocabulary/54-religionsphilosophie.json', 'Eschatologie', 'die Eschatologien'],
      ['content/c2/vocabulary/84-netzwerkgesellschaft-castells.json', 'Mediatisierung', 'die Mediatisierungen'],
      ['content/c2/vocabulary/23-poststrukturalismus.json', 'Textualit\u00e4t', 'die Textualit\u00e4ten'],
      ['content/c2/vocabulary/41-verhaltens\u00f6konomie.json', 'Anreizkompatibilit\u00e4t', 'die Anreizkompatibilit\u00e4ten'],
      ['content/c2/vocabulary/42-oekologische-oekonomie.json', 'Kreislaufwirtschaft', 'die Kreislaufwirtschaften'],
      ['content/c2/vocabulary/116-digitaler-humanismus.json', 'Datenhoheit', 'die Datenhoheiten'],
      ['content/c2/vocabulary/27-uebersetzungswissenschaft.json', 'Pragmatik', 'die Pragmatiken'],
      ['content/c2/vocabulary/27-uebersetzungswissenschaft.json', 'Intertextualit\u00e4t', 'die Intertextualit\u00e4ten'],
      ['content/c2/vocabulary/61-phenomenologie.json', 'Intentionalit\u00e4t', 'die Intentionalit\u00e4ten'],
      ['content/c2/vocabulary/27-uebersetzungswissenschaft.json', 'Rezeptions\u00e4sthetik', 'die Rezeptions\u00e4sthetiken'],
      ['content/c2/vocabulary/96-ueberwachungsstaat.json', '\u00dcberwachungskapitalismus', 'die \u00dcberwachungskapitalismen'],
      ['content/c2/vocabulary/41-verhaltens\u00f6konomie.json', 'Verhaltens\u00f6konomie', 'die Verhaltens\u00f6konomien'],
      ['content/c2/vocabulary/48-deontologie-konsequentialismus.json', 'Pr\u00e4ferenzutilitarismus', 'die Pr\u00e4ferenzutilitarismen'],
      ['content/c2/vocabulary/14-biopolitik-transhumanismus.json', 'Autopoiesis', 'die Autopoiesen'],
      ['content/c2/vocabulary/65-anarchismus-libertarismus.json', 'F\u00f6deralismus', '-'],
      ['content/c1/vocabulary/17-verfassungsrecht-staatstheorie.json', 'F\u00f6deralismus', '-'],
      ['content/c2/vocabulary/40-ordoliberalismus.json', 'Verteilungsgerechtigkeit', '-'],
      ['content/c2/vocabulary/63-utilitarismus.json', 'Verteilungsgerechtigkeit', '-'],
      ['content/c2/vocabulary/99-avantgarde-dadaismus.json', 'Intermediale', '-'],
      ['content/c1/vocabulary/49-theaterwissenschaft.json', 'Intermediale', '-'],
      ['content/c2/vocabulary/86-entwicklungsoekonomie.json', 'Humankapital', '-'],
      ['content/c1/vocabulary/60-arbeitssoziologie-prekaritaet.json', 'Humankapital', '-'],
      ['content/c2/vocabulary/143-lacan-lacanian.json', 'Unbewusste', '-'],
      ['content/c2/vocabulary/07-psychoanalyse-tiefenpsychologie.json', 'Unbewusste', '-'],
      ['content/c2/vocabulary/14-biopolitik-transhumanismus.json', 'Kybernetik', '-'],
      ['content/c2/vocabulary/94-kybernetik-informationstheorie.json', 'Kybernetik', '-'],
      ['content/c2/vocabulary/143-lacan-lacanian.json', 'Imagin\u00e4re', '-'],
      ['content/c2/vocabulary/92-orientalismus-said.json', 'Imagin\u00e4re', '-'],
      ['content/c2/vocabulary/40-ordoliberalismus.json', 'Sozialstaatlichkeit', '-'],
      ['content/c2/vocabulary/63-utilitarismus.json', 'Sozialstaatlichkeit', '-'],
    ] as const

    for (const [file, label, plural] of corpusCanonicalized) {
      const word = findWord(file, label)
      expect(word.plural).toBe(plural)
      expect(word.pluralStatus).toBe('corpus_canonicalized_needs_native_signoff')
    }

    const regularRuleSingularOnly = [
      ['content/c2/vocabulary/107-dekonstruktivismus-architektur.json', 'Ineinandergreifen'],
      ['content/c2/vocabulary/108-atonalitaet-schoenberg.json', 'Schaffen'],
      ['content/c2/vocabulary/109-elektronische-musik.json', 'Oszillieren'],
      ['content/c2/vocabulary/112-palliativmedizin.json', 'Sterbefasten'],
      ['content/c2/vocabulary/114-technikphilosophie.json', 'Entbergen'],
      ['content/c2/vocabulary/135-geschichtsphilosophie.json', 'Verstehen'],
      ['content/c2/vocabulary/137-musiksemiotik.json', 'Verorten'],
      ['content/c2/vocabulary/41-verhaltens\u00f6konomie.json', 'Prokrastinieren'],
      ['content/c2/vocabulary/49-tugendethik-aristoteles.json', 'Streben'],
      ['content/c2/vocabulary/93-gender-studies-butler.json', 'Begehren'],
      ['content/c2/vocabulary/104-interreligioeser-dialog.json', 'Konvergenzstreben'],
      ['content/c2/vocabulary/104-interreligioeser-dialog.json', 'Ringen'],
      ['content/c2/vocabulary/114-technikphilosophie.json', 'Wahrheitsgeschehen'],
      ['content/c2/vocabulary/117-tiefen\u00f6kologie.json', 'Artensterben'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Erkenntnisstreben'],
      ['content/c2/vocabulary/134-ethnomethodologie.json', 'Alltagswissen'],
      ['content/c2/vocabulary/25-diskursanalyse.json', 'Weltwissen'],
      ['content/c2/vocabulary/32-empirismus-rationalismus.json', 'Erfahrungswissen'],
      ['content/c2/vocabulary/88-bindungstheorie-bowlby.json', 'Internalisierungsgeschehen'],
      ['content/c2/vocabulary/88-bindungstheorie-bowlby.json', 'Bindungsverhalten'],
      ['content/c2/vocabulary/114-technikphilosophie.json', 'Dasein'],
      ['content/c2/vocabulary/117-tiefen\u00f6kologie.json', 'In-der-Welt-Sein'],
      ['content/c2/vocabulary/118-anthropozaen.json', 'Biodiversit\u00e4tssterben'],
      ['content/c2/vocabulary/131-dialektik-der-aufklaerung.json', 'Identit\u00e4tsdenken'],
      ['content/c2/vocabulary/135-geschichtsphilosophie.json', 'Geschichtsbewusstsein'],
      ['content/c2/vocabulary/136-utopieforschung.json', 'Epochenbewusstsein'],
      ['content/c2/vocabulary/38-klassentheorie-ungleichheit.json', 'Klassenbewusstsein'],
      ['content/c2/vocabulary/52-historiographie-methodik.json', 'Geschichtsbewusstsein'],
      ['content/c2/vocabulary/62-dialektik-hegel.json', 'Werden'],
      ['content/c2/vocabulary/66-generative-grammatik.json', 'angeborenes Wissen'],
      ['content/c2/vocabulary/100-konzeptkunst-minimalismus.json', 'Immaterielle'],
      ['content/c2/vocabulary/104-interreligioeser-dialog.json', 'Immanente'],
      ['content/c2/vocabulary/107-dekonstruktivismus-architektur.json', 'Ersch\u00fcttern'],
      ['content/c2/vocabulary/110-strukturalismus-levi-strauss.json', 'Entschl\u00fcsseln'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Epistemische'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Ganzheitliche'],
      ['content/c2/vocabulary/130-erhabene-sublime.json', 'Erhabene'],
      ['content/c2/vocabulary/130-erhabene-sublime.json', 'Scheitern'],
      ['content/c2/vocabulary/130-erhabene-sublime.json', 'Unfassbare'],
      ['content/c2/vocabulary/143-lacan-lacanian.json', 'Symbolische'],
      ['content/c2/vocabulary/143-lacan-lacanian.json', 'Reale'],
      ['content/c2/vocabulary/144-trauma-forschung.json', 'Verdr\u00e4ngen'],
      ['content/c2/vocabulary/17-musikwissenschaft-kulturindustrie.json', 'Epigonentum'],
      ['content/c2/vocabulary/22-existenzphilosophie.json', 'Nichts'],
      ['content/c2/vocabulary/45-analytische-psychologie.json', 'Kollektive Unbewusste'],
      ['content/c2/vocabulary/47-existenzielle-psychotherapie.json', 'Vergegenw\u00e4rtigen'],
      ['content/c2/vocabulary/47-existenzielle-psychotherapie.json', 'Autotelische'],
      ['content/c2/vocabulary/50-kulturkritik-postmoderne.json', 'Postfaktische'],
      ['content/c2/vocabulary/77-postkoloniale-literatur.json', 'Postkoloniale'],
      ['content/c2/vocabulary/99-avantgarde-dadaismus.json', 'Absurde'],
      ['content/c2/vocabulary/02-rechtsphilosophie-justiz.json', 'Apodiktizit\u00e4t'],
      ['content/c2/vocabulary/06-anthropologie-ethnografie.json', 'Transkulturalit\u00e4t'],
      ['content/c2/vocabulary/103-kolonialgeschichte.json', 'Transkulturalit\u00e4t'],
      ['content/c2/vocabulary/105-religionskritik-feuerbach.json', 'Heilsgewissheit'],
      ['content/c2/vocabulary/106-bauhaus-modernismus.json', 'Materialgerechtigkeit'],
      ['content/c2/vocabulary/106-bauhaus-modernismus.json', 'Raum\u00f6konomie'],
      ['content/c2/vocabulary/108-atonalitaet-schoenberg.json', 'Klanglichkeit'],
      ['content/c2/vocabulary/114-technikphilosophie.json', 'Seinsvergessenheit'],
      ['content/c2/vocabulary/114-technikphilosophie.json', 'Zuhandenheit'],
      ['content/c2/vocabulary/114-technikphilosophie.json', 'Vorhandenheit'],
      ['content/c2/vocabulary/61-phenomenologie.json', 'Apodiktizit\u00e4t'],
      ['content/c2/vocabulary/116-digitaler-humanismus.json', 'Digitaler Humanismus'],
      ['content/c2/vocabulary/06-anthropologie-ethnografie.json', 'Postkolonialismusforschung'],
      ['content/c2/vocabulary/101-aufklaerung-kant.json', 'Metaphysik der Sitten'],
      ['content/c2/vocabulary/106-bauhaus-modernismus.json', '\u00c4sthetik der Sachlichkeit'],
      ['content/c2/vocabulary/107-dekonstruktivismus-architektur.json', '\u00c4sthetik des Unvollendeten'],
      ['content/c2/vocabulary/107-dekonstruktivismus-architektur.json', 'Atektonik'],
      ['content/c2/vocabulary/109-elektronische-musik.json', 'Akusmatik'],
      ['content/c2/vocabulary/111-neuroethik.json', 'Neuroethik'],
      ['content/c2/vocabulary/111-neuroethik.json', 'Konnektomik'],
      ['content/c2/vocabulary/114-technikphilosophie.json', 'Technikphilosophie'],
      ['content/c2/vocabulary/117-tiefen\u00f6kologie.json', 'Tiefen\u00f6kologie'],
      ['content/c2/vocabulary/117-tiefen\u00f6kologie.json', 'intrinsische Werthaftigkeit'],
      ['content/c2/vocabulary/119-klimagerechtigkeit.json', 'Zirkularit\u00e4t'],
      ['content/c2/vocabulary/119-klimagerechtigkeit.json', 'Indigenit\u00e4t'],
      ['content/c2/vocabulary/12-religionswissenschaft-saekularisierung.json', 'Entzauberung der Welt'],
      ['content/c2/vocabulary/121-populismus-forschung.json', 'Postfaktizit\u00e4t'],
      ['content/c2/vocabulary/121-populismus-forschung.json', 'Elitenverachtung'],
      ['content/c2/vocabulary/123-eigentumstheorie.json', 'Gemeinwohlorientierung'],
      ['content/c2/vocabulary/123-eigentumstheorie.json', 'Inklusivit\u00e4t'],
      ['content/c2/vocabulary/123-eigentumstheorie.json', 'Ressourcengovernance'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Autodidaktik'],
      ['content/c2/vocabulary/106-bauhaus-modernismus.json', 'Reduktion auf das Wesentliche'],
      ['content/c2/vocabulary/108-atonalitaet-schoenberg.json', 'Formaufl\u00f6sung'],
      ['content/c2/vocabulary/108-atonalitaet-schoenberg.json', 'Reihenkomposition'],
      ['content/c2/vocabulary/108-atonalitaet-schoenberg.json', 'Emanzipation der Dissonanz'],
      ['content/c2/vocabulary/112-palliativmedizin.json', 'Letztentscheidungskompetenz'],
      ['content/c2/vocabulary/114-technikphilosophie.json', 'Widerst\u00e4ndigkeit'],
      ['content/c2/vocabulary/121-populismus-forschung.json', 'Populismusforschung'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Humanismusrezeption'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Wissensgenerierung'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Geistesbildung'],
      ['content/c2/vocabulary/02-rechtsphilosophie-justiz.json', 'Konsensualismus'],
      ['content/c2/vocabulary/103-kolonialgeschichte.json', 'Kolonialrevisionismus'],
      ['content/c2/vocabulary/111-neuroethik.json', 'Pr\u00e4diktive Genetik'],
      ['content/c2/vocabulary/116-digitaler-humanismus.json', 'Datenkapitalismus'],
      ['content/c2/vocabulary/116-digitaler-humanismus.json', 'Recht auf Vergessenwerden'],
      ['content/c2/vocabulary/117-tiefen\u00f6kologie.json', 'Biozentrismus'],
      ['content/c2/vocabulary/117-tiefen\u00f6kologie.json', 'Regenerationsf\u00e4higkeit'],
      ['content/c2/vocabulary/117-tiefen\u00f6kologie.json', 'Biokapazit\u00e4t'],
      ['content/c2/vocabulary/119-klimagerechtigkeit.json', 'Umweltrassismus'],
      ['content/c2/vocabulary/12-religionswissenschaft-saekularisierung.json', 'Glaubenspluralismus'],
      ['content/c2/vocabulary/08-politische-rhetorik-demagogie.json', 'Appellcharakter'],
      ['content/c2/vocabulary/121-populismus-forschung.json', 'Demokratieverfall'],
      ['content/c2/vocabulary/123-eigentumstheorie.json', 'Kollektiveigentum'],
      ['content/c2/vocabulary/123-eigentumstheorie.json', 'Ressourcenbewirtschaftung'],
      ['content/c2/vocabulary/123-eigentumstheorie.json', 'Tragik der Allmende'],
      ['content/c2/vocabulary/131-dialektik-der-aufklaerung.json', 'Instrumentelle Vernunft'],
      ['content/c2/vocabulary/131-dialektik-der-aufklaerung.json', 'Fetischcharakter'],
      ['content/c2/vocabulary/131-dialektik-der-aufklaerung.json', 'Unvers\u00f6hntheit'],
      ['content/c2/vocabulary/131-dialektik-der-aufklaerung.json', '\u00c4sthetische Theorie'],
      ['content/c2/vocabulary/131-dialektik-der-aufklaerung.json', 'Identit\u00e4tszwang'],
      ['content/c2/vocabulary/131-dialektik-der-aufklaerung.json', 'Immanente Kritik'],
      ['content/c2/vocabulary/134-ethnomethodologie.json', 'Ethnomethodologie'],
      ['content/c2/vocabulary/134-ethnomethodologie.json', 'Unhintergehbarkeit'],
      ['content/c2/vocabulary/134-ethnomethodologie.json', 'Indexikalit\u00e4t'],
      ['content/c2/vocabulary/134-ethnomethodologie.json', 'Lebensweltbezug'],
      ['content/c2/vocabulary/136-utopieforschung.json', 'Utopieforschung'],
      ['content/c2/vocabulary/21-metaphysik-ontologie.json', 'Welthaftigkeit'],
      ['content/c2/vocabulary/23-poststrukturalismus.json', 'Logozentrismus'],
      ['content/c2/vocabulary/23-poststrukturalismus.json', 'Hyperrealit\u00e4t'],
      ['content/c2/vocabulary/23-poststrukturalismus.json', 'Unentscheidbarkeit'],
      ['content/c2/vocabulary/23-poststrukturalismus.json', 'Diff\u00e9rance'],
      ['content/c2/vocabulary/24-kritische-theorie.json', 'Dialektik der Aufkl\u00e4rung'],
      ['content/c2/vocabulary/24-kritische-theorie.json', 'Totalitarismusforschung'],
      ['content/c2/vocabulary/24-kritische-theorie.json', 'mimetische Angleichung'],
      ['content/c2/vocabulary/24-kritische-theorie.json', 'Kommunikationsrationalit\u00e4t'],
      ['content/c2/vocabulary/24-kritische-theorie.json', 'normativ-kritische Ausrichtung'],
      ['content/c2/vocabulary/27-uebersetzungswissenschaft.json', 'Idiomatizit\u00e4t'],
      ['content/c2/vocabulary/27-uebersetzungswissenschaft.json', 'Interlingualit\u00e4t'],
      ['content/c2/vocabulary/28-rechtshermeneutik.json', 'Verfassungskonformit\u00e4t'],
      ['content/c2/vocabulary/29-staatsphilosophie-vertieft.json', 'Diskursethik'],
      ['content/c2/vocabulary/27-uebersetzungswissenschaft.json', 'Deixis'],
      ['content/c2/vocabulary/27-uebersetzungswissenschaft.json', 'Polysemie'],
      ['content/c2/vocabulary/28-rechtshermeneutik.json', 'Systematik'],
      ['content/c2/vocabulary/29-staatsphilosophie-vertieft.json', 'Konstitutionalismus'],
      ['content/c2/vocabulary/29-staatsphilosophie-vertieft.json', 'Verfasstheit'],
      ['content/c2/vocabulary/30-menschenrechte-voelkerrecht.json', 'Schutzverantwortung'],
      ['content/c2/vocabulary/30-menschenrechte-voelkerrecht.json', 'V\u00f6lkerstrafrecht'],
      ['content/c2/vocabulary/33-wissenschaftssoziologie.json', 'Wissensproduktion'],
      ['content/c2/vocabulary/33-wissenschaftssoziologie.json', 'Akteur-Netzwerk-Theorie'],
      ['content/c2/vocabulary/33-wissenschaftssoziologie.json', 'Positivismusstreit'],
      ['content/c2/vocabulary/33-wissenschaftssoziologie.json', 'Wissenschaftlichkeit'],
      ['content/c2/vocabulary/37-machttheorie-herrschaft.json', 'Strukturgewalt'],
      ['content/c2/vocabulary/38-klassentheorie-ungleichheit.json', 'Sozialkapital'],
      ['content/c2/vocabulary/39-zivilisationstheorie.json', 'Akzeleration'],
      ['content/c2/vocabulary/39-zivilisationstheorie.json', 'Ambiguit\u00e4tstoleranz'],
      ['content/c2/vocabulary/39-zivilisationstheorie.json', 'Beharrungsverm\u00f6gen'],
      ['content/c2/vocabulary/40-ordoliberalismus.json', 'Pareto-Effizienz'],
      ['content/c2/vocabulary/41-verhaltens\u00f6konomie.json', 'Nudging'],
      ['content/c2/vocabulary/41-verhaltens\u00f6konomie.json', 'Selbstkontrolle'],
      ['content/c2/vocabulary/41-verhaltens\u00f6konomie.json', 'Ambiguit\u00e4tsaversion'],
      ['content/c2/vocabulary/41-verhaltens\u00f6konomie.json', 'Verlustaversion'],
      ['content/c2/vocabulary/42-oekologische-oekonomie.json', 'Konvivialit\u00e4t'],
      ['content/c2/vocabulary/42-oekologische-oekonomie.json', 'Postwachstums\u00f6konomie'],
      ['content/c2/vocabulary/42-oekologische-oekonomie.json', 'Ressourcenproduktivit\u00e4t'],
      ['content/c2/vocabulary/44-filmtheorie-auteur.json', 'Filmhistorizit\u00e4t'],
      ['content/c2/vocabulary/46-gestaltpsychologie.json', 'Reizverarbeitung'],
      ['content/c2/vocabulary/46-gestaltpsychologie.json', 'Ganzheitlichkeit'],
      ['content/c2/vocabulary/48-deontologie-konsequentialismus.json', 'Wohlfahrtsmaximierung'],
      ['content/c2/vocabulary/48-deontologie-konsequentialismus.json', 'Heteronomie'],
      ['content/c2/vocabulary/48-deontologie-konsequentialismus.json', 'Zurechenbarkeit'],
    ] as const

    for (const [file, label] of regularRuleSingularOnly) {
      const word = findWord(file, label)
      expect(word.plural).toBe('-')
      expect(word.pluralStatus).toBe('regular_rule_needs_native_signoff')
    }

    const dudenAligned = [
      ['content/c1/vocabulary/01-gesellschaftskritik-diskurs.json', 'Meinungsbildung', 'die Meinungsbildungen'],
      ['content/c1/vocabulary/03-bioethik-gentechnik.json', 'Autonomie', 'die Autonomien'],
      ['content/c1/vocabulary/03-bioethik-gentechnik.json', 'Reproduktionsmedizin', 'die Reproduktionsmedizinen'],
      ['content/c1/vocabulary/03-bioethik-gentechnik.json', 'Vererbung', 'die Vererbungen'],
      ['content/c1/vocabulary/04-urbanisierung-raumplanung.json', 'Landflucht', 'die Landfluchten'],
      ['content/c1/vocabulary/04-urbanisierung-raumplanung.json', 'Partizipation', 'die Partizipationen'],
      ['content/c1/vocabulary/05-klimapolitik-nachhaltigkeit.json', 'Eindämmung', 'die Eindämmungen'],
      ['content/c1/vocabulary/05-klimapolitik-nachhaltigkeit.json', 'Biodiversität', 'die Biodiversitäten'],
      ['content/c1/vocabulary/10-arbeitsrecht-sozialpartnerschaft.json', 'Fürsorgepflicht', 'die Fürsorgepflichten'],
      ['content/c1/vocabulary/10-arbeitsrecht-sozialpartnerschaft.json', 'Tarifautonomie', 'die Tarifautonomien'],
      ['content/c1/vocabulary/10-arbeitsrecht-sozialpartnerschaft.json', 'Mitbestimmung', 'die Mitbestimmungen'],
      ['content/c1/vocabulary/18-finanzmaerkte-regulierung.json', 'Rechnungslegung', 'die Rechnungslegungen'],
      ['content/c1/vocabulary/18-finanzmaerkte-regulierung.json', 'Kapitalflucht', 'die Kapitalfluchten'],
      ['content/c1/vocabulary/19-verkehrswende-infrastruktur.json', 'Akzeptanz', 'die Akzeptanzen'],
      ['content/c1/vocabulary/21-voelkerrecht-souveraenitaet.json', 'Rechenschaftspflicht', 'die Rechenschaftspflichten'],
      ['content/c1/vocabulary/22-verwaltungsrecht-behörden.json', 'Subsidiarität', 'die Subsidiaritäten'],
      ['content/c1/vocabulary/22-verwaltungsrecht-behörden.json', 'Amtshilfe', 'die Amtshilfen'],
      ['content/c1/vocabulary/22-verwaltungsrecht-behörden.json', 'Verhältnismäßigkeit', 'die Verhältnismäßigkeiten'],
      ['content/c1/vocabulary/22-verwaltungsrecht-behörden.json', 'Exekutive', 'die Exekutiven'],
      ['content/c1/vocabulary/23-grundrechte-verfassung.json', 'Souveränität', 'die Souveränitäten'],
      ['content/c1/vocabulary/24-justizwesen-strafvollzug.json', 'Strafverfolgung', 'die Strafverfolgungen'],
      ['content/c1/vocabulary/24-justizwesen-strafvollzug.json', 'Resozialisierung', 'die Resozialisierungen'],
      ['content/c1/vocabulary/25-geldpolitik-zentralbank.json', 'Fiskalpolitik', 'die Fiskalpolitiken'],
      ['content/c1/vocabulary/25-geldpolitik-zentralbank.json', 'Kapitalflucht', 'die Kapitalfluchten'],
      ['content/c1/vocabulary/25-geldpolitik-zentralbank.json', 'Kaufkraft', 'die Kaufkräfte'],
      ['content/c1/vocabulary/28-steuerpolitik-haushalt.json', 'Fiskalpolitik', 'die Fiskalpolitiken'],
      ['content/c1/vocabulary/28-steuerpolitik-haushalt.json', 'Fiskus', 'die Fisken'],
      ['content/c1/vocabulary/28-steuerpolitik-haushalt.json', 'Steueraufkommen', 'die Steueraufkommen'],
      ['content/c1/vocabulary/28-steuerpolitik-haushalt.json', 'Staatsverschuldung', 'die Staatsverschuldungen'],
      ['content/c1/vocabulary/28-steuerpolitik-haushalt.json', 'Neuverschuldung', 'die Neuverschuldungen'],
      ['content/c1/vocabulary/28-steuerpolitik-haushalt.json', 'Steuerhinterziehung', 'die Steuerhinterziehungen'],
      ['content/c1/vocabulary/29-quantenphysik-grundlagen.json', 'Kausalität', 'die Kausalitäten'],
      ['content/c1/vocabulary/30-genetik-evolution.json', 'Phylogenese', 'die Phylogenesen'],
      ['content/c1/vocabulary/32-klimaforschung-modellierung.json', 'Sensitivität', 'die Sensitivitäten'],
      ['content/c1/vocabulary/32-klimaforschung-modellierung.json', 'Interdependenz', 'die Interdependenzen'],
      ['content/c1/vocabulary/32-klimaforschung-modellierung.json', 'Resilienz', 'die Resilienzen'],
      ['content/c1/vocabulary/32-klimaforschung-modellierung.json', 'Evidenz', 'die Evidenzen'],
      ['content/c1/vocabulary/34-geschlechtergerechtigkeit.json', 'Vereinbarkeit', 'die Vereinbarkeiten'],
      ['content/c1/vocabulary/34-geschlechtergerechtigkeit.json', 'Patriarchat', 'die Patriarchate'],
      ['content/c1/vocabulary/35-urbanisierung-smart-city.json', 'Konnektivität', 'die Konnektivitäten'],
      ['content/c1/vocabulary/35-urbanisierung-smart-city.json', 'Resilienz', 'die Resilienzen'],
      ['content/c1/vocabulary/36-generationenkonflikt.json', 'Resilienz', 'die Resilienzen'],
      ['content/c1/vocabulary/36-generationenkonflikt.json', 'Demografie', 'die Demografien'],
      ['content/c1/vocabulary/38-pressefreiheit-zensur.json', 'Transparenz', 'die Transparenzen'],
      ['content/c1/vocabulary/39-algorithmen-filterblasen.json', 'Transparenz', 'die Transparenzen'],
      ['content/c1/vocabulary/41-entwicklungspsychologie.json', 'Resilienz', 'die Resilienzen'],
      ['content/c1/vocabulary/09-forschungsmethodik-akademie.json', 'Evidenz', 'die Evidenzen'],
      ['content/c1/vocabulary/22-verwaltungsrecht-behörden.json', 'Entbürokratisierung', 'die Entbürokratisierungen'],
      ['content/c1/vocabulary/25-geldpolitik-zentralbank.json', 'Überschuldung', 'die Überschuldungen'],
      ['content/c1/vocabulary/25-geldpolitik-zentralbank.json', 'quantitative Lockerung', 'die quantitativen Lockerungen'],
      ['content/c1/vocabulary/26-handelsabkommen-zoll.json', 'Reziprozität', 'die Reziprozitäten'],
      ['content/c1/vocabulary/28-steuerpolitik-haushalt.json', 'Bruttoinlandsprodukt (BIP)', 'die Bruttoinlandsprodukte'],
      ['content/c1/vocabulary/44-biotechnologie-pharma.json', 'Bioethik', 'die Bioethiken'],
      ['content/c1/vocabulary/45-nanotechnologie.json', 'Adhäsion', 'die Adhäsionen'],
      ['content/c1/vocabulary/46-wirtschaftsethik.json', 'Rechenschaftspflicht', 'die Rechenschaftspflichten'],
      ['content/c1/vocabulary/46-wirtschaftsethik.json', 'Verhältnismäßigkeit', 'die Verhältnismäßigkeiten'],
      ['content/c1/vocabulary/47-medizinethik-patientenrecht.json', 'Fürsorgepflicht', 'die Fürsorgepflichten'],
      ['content/c1/vocabulary/47-medizinethik-patientenrecht.json', 'Verhältnismäßigkeit', 'die Verhältnismäßigkeiten'],
      ['content/c1/vocabulary/47-medizinethik-patientenrecht.json', 'Transparenz', 'die Transparenzen'],
      ['content/c1/vocabulary/49-theaterwissenschaft.json', 'Mimesis', 'die Mimesen'],
      ['content/c1/vocabulary/51-filmtheorie-analyse.json', 'Mimesis', 'die Mimesen'],
      ['content/c1/vocabulary/51-filmtheorie-analyse.json', 'Ästhetik', 'die Ästhetiken'],
      ['content/c1/vocabulary/51-filmtheorie-analyse.json', 'Kausalität', 'die Kausalitäten'],
      ['content/c1/vocabulary/52-sicherheitspolitik-nato.json', 'Resilienz', 'die Resilienzen'],
      ['content/c1/vocabulary/52-sicherheitspolitik-nato.json', 'Rüstungskontrolle', 'die Rüstungskontrollen'],
      ['content/c1/vocabulary/52-sicherheitspolitik-nato.json', 'Entspannungspolitik', 'die Entspannungspolitiken'],
      ['content/c1/vocabulary/53-entwicklungshilfe-ngos.json', 'Resilienz', 'die Resilienzen'],
      ['content/c1/vocabulary/53-entwicklungshilfe-ngos.json', 'Rechenschaftspflicht', 'die Rechenschaftspflichten'],
      ['content/c1/vocabulary/53-entwicklungshilfe-ngos.json', 'Partizipation', 'die Partizipationen'],
      ['content/c1/vocabulary/53-entwicklungshilfe-ngos.json', 'Expertise', 'die Expertisen'],
      ['content/c1/vocabulary/53-entwicklungshilfe-ngos.json', 'Dezentralisierung', 'die Dezentralisierungen'],
      ['content/c1/vocabulary/53-entwicklungshilfe-ngos.json', 'Marginalisierung', 'die Marginalisierungen'],
      ['content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json', 'Verfügbarkeit', 'die Verfügbarkeiten'],
      ['content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json', 'Zuschreibung', 'die Zuschreibungen'],
      ['content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json', 'Entschlüsselung', 'die Entschlüsselungen'],
      ['content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json', 'Detektion', 'die Detektionen'],
      ['content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json', 'Resilienz', 'die Resilienzen'],
      ['content/c1/vocabulary/62-logistik-lieferkette.json', 'Resilienz', 'die Resilienzen'],
      ['content/c1/vocabulary/63-musiktherapie.json', 'Partizipation', 'die Partizipationen'],
      ['content/c1/vocabulary/63-musiktherapie.json', 'Inklusion', 'die Inklusionen'],
      ['content/c1/vocabulary/63-musiktherapie.json', 'Empathie', 'die Empathien'],
      ['content/c1/vocabulary/61-forensik-kriminalistik.json', 'Modus Operandi', 'die Modi Operandi'],
      ['content/c1/vocabulary/63-musiktherapie.json', 'Heilpädagogik', 'die Heilpädagogiken'],
      ['content/c1/vocabulary/65-lebensmittelrecht.json', 'Beweislast', 'die Beweislasten'],
      ['content/c1/vocabulary/71-neuroplastizitaet.json', 'Konnektivität', 'die Konnektivitäten'],
      ['content/c1/vocabulary/71-neuroplastizitaet.json', 'Resilienz', 'die Resilienzen'],
      ['content/c1/vocabulary/72-verhaltensforschung.json', 'Empathie', 'die Empathien'],
      ['content/c1/vocabulary/72-verhaltensforschung.json', 'Domestikation', 'die Domestikationen'],
      ['content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json', 'Plausibilität', 'die Plausibilitäten'],
      ['content/c2/vocabulary/04-literaturwissenschaft-hermeneutik.json', 'Mimesis', 'die Mimesen'],
      ['content/c2/vocabulary/14-biopolitik-transhumanismus.json', 'Souveränität', 'die Souveränitäten'],
      ['content/c2/vocabulary/70-europaeisches-recht.json', 'Subsidiarität', 'die Subsidiaritäten'],
      ['content/c2/vocabulary/70-europaeisches-recht.json', 'Verhältnismäßigkeit', 'die Verhältnismäßigkeiten'],
      ['content/c2/vocabulary/112-palliativmedizin.json', 'Empathie', 'die Empathien'],
      ['content/c2/vocabulary/102-kalter-krieg-bipolaritaet.json', 'Hochrüstung', 'die Hochrüstungen'],
      ['content/c2/vocabulary/103-kolonialgeschichte.json', 'Hybridität', 'die Hybriditäten'],
      ['content/c2/vocabulary/103-kolonialgeschichte.json', 'Entwicklungshilfe', 'die Entwicklungshilfen'],
      ['content/c2/vocabulary/103-kolonialgeschichte.json', 'Vergangenheitsbewältigung', 'die Vergangenheitsbewältigungen'],
      ['content/c2/vocabulary/108-atonalitaet-schoenberg.json', 'Atonalität', 'die Atonalitäten'],
      ['content/c2/vocabulary/108-atonalitaet-schoenberg.json', 'Entfremdung', 'die Entfremdungen'],
      ['content/c2/vocabulary/111-neuroethik.json', 'Willensfreiheit', 'die Willensfreiheiten'],
      ['content/c2/vocabulary/112-palliativmedizin.json', 'Spiritualit\u00e4t', 'die Spiritualit\u00e4ten'],
      ['content/c2/vocabulary/112-palliativmedizin.json', 'Lebensqualit\u00e4t', 'die Lebensqualit\u00e4ten'],
      ['content/c2/vocabulary/121-populismus-forschung.json', 'Apologetik', 'die Apologetiken'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Pers\u00f6nlichkeitsentfaltung', 'die Pers\u00f6nlichkeitsentfaltungen'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Verinnerlichung', 'die Verinnerlichungen'],
    ] as const

    for (const [file, label, plural] of dudenAligned) {
      const word = findWord(file, label)
      expect(word.plural).toBe(plural)
      expect(word.pluralStatus).toBe('duden_aligned_needs_native_signoff')
    }

    const singularOnly = [
      ['content/c1/vocabulary/01-gesellschaftskritik-diskurs.json', 'Legitimität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/03-bioethik-gentechnik.json', 'Dignität', 'duden_sense_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/03-bioethik-gentechnik.json', 'Eugenik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/03-bioethik-gentechnik.json', 'Ethos', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/04-urbanisierung-raumplanung.json', 'Daseinsvorsorge', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/04-urbanisierung-raumplanung.json', 'Ressourcenschonung', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/05-klimapolitik-nachhaltigkeit.json', 'Klimaneutralität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/06-sprachwissenschaft-linguistik.json', 'Sprachwandel', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/06-sprachwissenschaft-linguistik.json', 'Sprachgebrauch', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/06-sprachwissenschaft-linguistik.json', 'Mehrsprachigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/12-medientheorie-propaganda.json', 'Glaubwürdigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/18-finanzmaerkte-regulierung.json', 'Systemrelevanz', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/18-finanzmaerkte-regulierung.json', 'Compliance', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/19-verkehrswende-infrastruktur.json', 'Klimaneutralität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/20-energiepolitik-ressourcen.json', 'Nachhaltigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/20-energiepolitik-ressourcen.json', 'Emissionshandel', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/20-energiepolitik-ressourcen.json', 'Klimaneutralität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/21-voelkerrecht-souveraenitaet.json', 'Völkerrecht', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/21-voelkerrecht-souveraenitaet.json', 'Exterritorialität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/21-voelkerrecht-souveraenitaet.json', 'Selbstbestimmung', 'duden_sense_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/23-grundrechte-verfassung.json', 'Rechtsstaatlichkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/23-grundrechte-verfassung.json', 'Gewaltenteilung', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/23-grundrechte-verfassung.json', 'Inkrafttreten', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/23-grundrechte-verfassung.json', 'Würde', 'duden_sense_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/24-justizwesen-strafvollzug.json', 'Jurisprudenz', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/24-justizwesen-strafvollzug.json', 'Kriminalität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/24-justizwesen-strafvollzug.json', 'Strafvollzug', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/26-handelsabkommen-zoll.json', 'Inkrafttreten', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/26-handelsabkommen-zoll.json', 'Protektionismus', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/27-konjunktur-wirtschaftskrise.json', 'Protektionismus', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/30-genetik-evolution.json', 'Epigenetik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/34-geschlechtergerechtigkeit.json', 'Selbstbestimmung', 'duden_sense_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/35-urbanisierung-smart-city.json', 'Nachhaltigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/35-urbanisierung-smart-city.json', 'Daseinsvorsorge', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/36-generationenkonflikt.json', 'Agilität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/34-geschlechtergerechtigkeit.json', 'Intersektionalität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/34-geschlechtergerechtigkeit.json', 'Chancengleichheit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/35-urbanisierung-smart-city.json', 'Intermodalität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/39-algorithmen-filterblasen.json', 'Mündigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/41-entwicklungspsychologie.json', 'Urvertrauen', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/16-datenschutz-digitalethik.json', 'Nachvollziehbarkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/39-algorithmen-filterblasen.json', 'Nachvollziehbarkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/31-kuenstliche-intelligenz-ml.json', 'Künstliche Intelligenz', 'duden_sense_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/11-literaturkritik-textanalyse.json', 'Hermeneutik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/44-biotechnologie-pharma.json', 'Biokompatibilität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/45-nanotechnologie.json', 'Haptik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/46-wirtschaftsethik.json', 'Gemeinwohl', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/46-wirtschaftsethik.json', 'Integrität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/46-wirtschaftsethik.json', 'Glaubwürdigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/47-medizinethik-patientenrecht.json', 'Menschenwürde', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/47-medizinethik-patientenrecht.json', 'Selbstbestimmung', 'duden_sense_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/47-medizinethik-patientenrecht.json', 'Interdisziplinarität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/49-theaterwissenschaft.json', 'Hermeneutik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/49-theaterwissenschaft.json', 'Semiotik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/50-kunstgeschichte-epochen.json', 'Hermeneutik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/50-kunstgeschichte-epochen.json', 'Semiotik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/51-filmtheorie-analyse.json', 'Hermeneutik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/51-filmtheorie-analyse.json', 'Semiotik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/52-sicherheitspolitik-nato.json', 'Koexistenz', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/53-entwicklungshilfe-ngos.json', 'Nachhaltigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/56-psychosomatik.json', 'Compliance', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/56-psychosomatik.json', 'Wohlbefinden', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/56-psychosomatik.json', 'Achtsamkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json', 'Integrität', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json', 'Vertraulichkeit', 'duden_sense_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/61-forensik-kriminalistik.json', 'Ballistik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/61-forensik-kriminalistik.json', 'Toxikologie', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/61-forensik-kriminalistik.json', 'Forensik', 'duden_sense_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/61-forensik-kriminalistik.json', 'Viktimologie', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/61-forensik-kriminalistik.json', 'Kriminaltechnik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/63-musiktherapie.json', 'Achtsamkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/63-musiktherapie.json', 'Sensorik', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/63-musiktherapie.json', 'Selbstwirksamkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/68-krisenmanagement.json', 'Daseinsvorsorge', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/75-steuerberatung.json', 'Compliance', 'duden_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/70-energiespeicherung.json', 'Dekarbonisierung', 'duden_sense_singular_only_needs_native_signoff'],
      ['content/c1/vocabulary/72-verhaltensforschung.json', 'Altruismus', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json', 'Hermeneutik', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json', 'Rekursivität', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json', 'Inhärenz', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json', 'Falsifizierbarkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json', 'Kohärenz', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/02-rechtsphilosophie-justiz.json', 'Jurisprudenz', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/02-rechtsphilosophie-justiz.json', 'Rechtspositivismus', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/02-rechtsphilosophie-justiz.json', 'Normativität', 'duden_sense_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/04-literaturwissenschaft-hermeneutik.json', 'Semiotik', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/04-literaturwissenschaft-hermeneutik.json', 'Epistemologie', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/04-literaturwissenschaft-hermeneutik.json', 'Narratologie', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/05-aesthetik-kunstkritik.json', 'Immanenz', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/06-anthropologie-ethnografie.json', 'Deutungshoheit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/06-anthropologie-ethnografie.json', 'Interkulturalität', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/06-anthropologie-ethnografie.json', 'Heterogenität', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/06-anthropologie-ethnografie.json', 'Intersubjektivität', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/06-anthropologie-ethnografie.json', 'Subalternität', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/28-rechtshermeneutik.json', 'Jurisprudenz', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/29-staatsphilosophie-vertieft.json', 'Gemeinwohl', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/70-europaeisches-recht.json', 'Rechtsstaatlichkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/85-spieltheorie-nash.json', 'Glaubwürdigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/89-positive-psychologie.json', 'Wohlbefinden', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/101-aufklaerung-kant.json', 'Mündigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/101-aufklaerung-kant.json', 'Rechtsstaatlichkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/101-aufklaerung-kant.json', 'Urteilsvermögen', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/101-aufklaerung-kant.json', 'Erkenntnisvermögen', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/103-kolonialgeschichte.json', 'Neokolonialismus', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/103-kolonialgeschichte.json', 'Subalternität', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/104-interreligioeser-dialog.json', 'Kohärenz', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/111-neuroethik.json', 'Chancengleichheit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/117-tiefenökologie.json', 'Koexistenz', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Mündigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/105-religionskritik-feuerbach.json', 'Diesseitigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/105-religionskritik-feuerbach.json', 'Jenseitigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/110-strukturalismus-levi-strauss.json', 'Strukturalismus', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/114-technikphilosophie.json', 'Weltlichkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/117-tiefen\u00f6kologie.json', 'Anthropoz\u00e4n', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/118-anthropozaen.json', 'Ressourcenverbrauch', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/119-klimagerechtigkeit.json', 'Klimagerechtigkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/12-religionswissenschaft-saekularisierung.json', 'Synkretismus', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/136-utopieforschung.json', 'Transhumanismus', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Wissenschaftsfreiheit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/120-republikanismus.json', 'Machtf\u00fclle', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/125-bildungsbegriff-humboldt.json', 'Bildungsb\u00fcrgertum', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/134-ethnomethodologie.json', 'Hintergrundwissen', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/135-geschichtsphilosophie.json', 'Geschichtlichkeit', 'duden_singular_only_needs_native_signoff'],
      ['content/c2/vocabulary/79-literarische-gattungen.json', 'Narratologie', 'duden_singular_only_needs_native_signoff'],
    ] as const

    for (const [file, label, status] of singularOnly) {
      const word = findWord(file, label)
      expect(word.plural).toBe('-')
      expect(word.pluralStatus).toBe(status)
    }

    const compoundHeadwordAligned = [
      ['content/c1/vocabulary/04-urbanisierung-raumplanung.json', 'urbane Resilienz', 'die urbanen Resilienzen'],
      ['content/c1/vocabulary/21-voelkerrecht-souveraenitaet.json', 'Präzedenzfallwirkung', 'die Präzedenzfallwirkungen'],
      ['content/c1/vocabulary/22-verwaltungsrecht-behörden.json', 'Sachverhaltsaufklärung', 'die Sachverhaltsaufklärungen'],
      ['content/c1/vocabulary/28-steuerpolitik-haushalt.json', 'Abgabenlast', 'die Abgabenlasten'],
      ['content/c1/vocabulary/47-medizinethik-patientenrecht.json', 'Ressourcenallokation', 'die Ressourcenallokationen'],
      ['content/c1/vocabulary/47-medizinethik-patientenrecht.json', 'Schutzbedarf', 'die Schutzbedarfe'],
      ['content/c1/vocabulary/53-entwicklungshilfe-ngos.json', 'Ressourcenallokation', 'die Ressourcenallokationen'],
      ['content/c1/vocabulary/29-quantenphysik-grundlagen.json', 'Welle-Teilchen-Dualismus', 'die Welle-Teilchen-Dualismen'],
      ['content/c2/vocabulary/116-digitaler-humanismus.json', 'zivilgesellschaftliche Partizipation', 'die zivilgesellschaftlichen Partizipationen'],
      ['content/c2/vocabulary/116-digitaler-humanismus.json', 'digitale Resilienz', 'die digitalen Resilienzen'],
      ['content/c2/vocabulary/116-digitaler-humanismus.json', 'digitale Inklusion', 'die digitalen Inklusionen'],
    ] as const

    for (const [file, label, plural] of compoundHeadwordAligned) {
      const word = findWord(file, label)
      expect(word.plural).toBe(plural)
      expect(word.pluralStatus).toBe('duden_compound_headword_needs_native_signoff')
    }

    const compoundHeadwordSingularOnly = [
      ['content/c1/vocabulary/04-urbanisierung-raumplanung.json', 'demografischer Wandel'],
      ['content/c1/vocabulary/05-klimapolitik-nachhaltigkeit.json', 'Ressourcenknappheit'],
      ['content/c1/vocabulary/22-verwaltungsrecht-behörden.json', 'Aktenführung'],
      ['content/c1/vocabulary/24-justizwesen-strafvollzug.json', 'Strafmündigkeit'],
      ['content/c1/vocabulary/41-entwicklungspsychologie.json', 'Objektpermanenz'],
      ['content/c1/vocabulary/47-medizinethik-patientenrecht.json', 'Patientenwohl'],
      ['content/c1/vocabulary/20-energiepolitik-ressourcen.json', 'Netzausbau'],
      ['content/c1/vocabulary/20-energiepolitik-ressourcen.json', 'Infrastrukturausbau'],
      ['content/c1/vocabulary/16-datenschutz-digitalethik.json', 'informationelle Selbstbestimmung'],
      ['content/c2/vocabulary/116-digitaler-humanismus.json', 'informationelle Selbstbestimmung'],
      ['content/c1/vocabulary/16-datenschutz-digitalethik.json', 'digitale M\u00fcndigkeit'],
      ['content/c2/vocabulary/116-digitaler-humanismus.json', 'digitale M\u00fcndigkeit'],
      ['content/c2/vocabulary/136-utopieforschung.json', 'Systemimmanenz'],
      ['content/c2/vocabulary/28-rechtshermeneutik.json', 'Rechtshermeneutik'],
      ['content/c2/vocabulary/74-wissenschaftliche-revolution.json', 'intersubjektive Nachvollziehbarkeit'],
    ] as const

    for (const [file, label] of compoundHeadwordSingularOnly) {
      const word = findWord(file, label)
      expect(word.plural).toBe('-')
      expect(word.pluralStatus).toBe('duden_compound_headword_singular_only_needs_native_signoff')
    }
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
