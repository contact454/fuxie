import { describe, it, expect } from 'vitest'

import {
  checkVocabularyWord,
  checkVocabularyFile,
  checkArticleUsage,
  checkPlural,
  checkReadingQuestion,
  checkReadingFile,
  buildTextIndex,
  truthValue,
  evidenceTokens,
  evidenceOverlap,
  EVIDENCE_OVERLAP_THRESHOLD,
} from '../../scripts/lib/german-content-checks'
import { WORD_TYPES, GENDERS } from '../../packages/shared/src/types/index.ts'
import { computeObjectiveVerdict } from '../../scripts/lib/review-board-contract'

/**
 * Spec `fuxie-content-review-board` — task 2.2 unit tests.
 *
 * Covers each deterministic content rule with small in-memory fixtures
 * (a valid case + each violation type) WITHOUT touching the real `content/`
 * tree. Enums are imported from `@fuxie/shared` (single source of truth) so the
 * tests fail loudly if the enum source and the checks ever drift.
 *
 * Rules under test:
 *   Group 1 (vocabulary): enum:article, enum:wordType, genus:article-usage,
 *                         genus:plural
 *   Group 2 (reading)   : answerkey:option-range, answerkey:evidence-missing,
 *                         answerkey:contradiction
 */

const FILE = 'content/a1/vocabulary/x.json'
const RFILE = 'content/a1/reading/x.json'

function rulesOf(findings: { rule: string }[]): string[] {
  return findings.map((f) => f.rule)
}

// ===========================================================================
// Group 1 — vocabulary enums
// ===========================================================================
describe('enum membership — article + wordType (error)', () => {
  it('accepts valid enum values (no enum findings)', () => {
    const findings = checkVocabularyWord(FILE, 0, {
      word: 'Name',
      article: 'MASKULIN',
      plural: 'die Namen',
      wordType: 'NOMEN',
      exampleSentence1: 'Mein Name ist Anna.',
    })
    expect(rulesOf(findings)).not.toContain('enum:article')
    expect(rulesOf(findings)).not.toContain('enum:wordType')
  })

  it('flags an invalid article enum value as error', () => {
    const findings = checkVocabularyWord(FILE, 3, {
      word: 'Adresse',
      article: 'WEIBLICH', // not in GENDERS
      wordType: 'NOMEN',
    })
    const f = findings.find((x) => x.rule === 'enum:article')
    expect(f).toBeDefined()
    expect(f!.severity).toBe('error')
    expect(f!.jsonPath).toBe('words[3].article')
    expect(GENDERS).not.toContain('WEIBLICH')
  })

  it('flags an invalid wordType enum value as error', () => {
    const findings = checkVocabularyWord(FILE, 1, {
      word: 'laufen',
      wordType: 'TUNWORT', // not in WORD_TYPES
    })
    const f = findings.find((x) => x.rule === 'enum:wordType')
    expect(f).toBeDefined()
    expect(f!.severity).toBe('error')
    expect(WORD_TYPES).not.toContain('TUNWORT')
  })

  it('does not flag missing article/wordType (presence is content-qa\u2019s job)', () => {
    const findings = checkVocabularyWord(FILE, 0, { word: 'etwas' })
    expect(rulesOf(findings)).not.toContain('enum:article')
    expect(rulesOf(findings)).not.toContain('enum:wordType')
  })

  it('treats null-sentinel strings as absent, not invalid enum values', () => {
    // The generator emits article:"null" for words with no article (e.g. verbs).
    for (const sentinel of ['null', 'none', '-', 'N/A']) {
      const findings = checkVocabularyWord(FILE, 0, {
        word: 'werben',
        article: sentinel,
        wordType: 'VERB',
      })
      expect(rulesOf(findings)).not.toContain('enum:article')
    }
  })
})

// ===========================================================================
// Group 1 — article ↔ usage consistency (warning)
// ===========================================================================
describe('genus:article-usage (warning)', () => {
  it('passes when the example article matches the gender', () => {
    expect(checkArticleUsage(FILE, 'p', 'Tisch', 'MASKULIN', 'Der Tisch ist groß.')).toHaveLength(0)
  })

  it('flags the unambiguous das↔der mismatch', () => {
    const findings = checkArticleUsage(FILE, 'p', 'Tisch', 'MASKULIN', 'Das Tisch ist groß.')
    expect(findings).toHaveLength(1)
    expect(findings[0].rule).toBe('genus:article-usage')
    expect(findings[0].severity).toBe('warning')
    expect(findings[0].suggestion).toBe('der Tisch')
  })

  it('flags der before a neuter noun', () => {
    const findings = checkArticleUsage(FILE, 'p', 'Kind', 'NEUTRUM', 'Der Kind spielt.')
    expect(rulesOf(findings)).toEqual(['genus:article-usage'])
  })

  it('does NOT flag "der <neuterNoun>" when it is a gen./dat. PLURAL (plural form == singular)', () => {
    // das Produktionsmittel → die Produktionsmittel → "der Besitz der Produktionsmittel"
    // ("der" here is genitive plural, NOT a Genus error).
    expect(
      checkArticleUsage(
        FILE,
        'p',
        'Produktionsmittel',
        'NEUTRUM',
        'Der Konflikt um den Besitz der Produktionsmittel ist zentral.',
        'die Produktionsmittel',
      ),
    ).toHaveLength(0)
  })

  it('still flags "der <neuterNoun>" when the plural form differs (real Genus error)', () => {
    // der Paratext is masculine; field NEUTRUM is wrong. plural "die Paratexte" != singular.
    const findings = checkArticleUsage(
      FILE,
      'p',
      'Paratext',
      'NEUTRUM',
      'Der Paratext steuert die Erwartung.',
      'die Paratexte',
    )
    expect(rulesOf(findings)).toEqual(['genus:article-usage'])
  })

  it('does NOT flag the ambiguous "die" (feminine sing / plural)', () => {
    // "die" before a masculine word is left alone (could be plural) — conservative.
    expect(checkArticleUsage(FILE, 'p', 'Tisch', 'MASKULIN', 'Die Tische sind da.')).toHaveLength(0)
    expect(checkArticleUsage(FILE, 'p', 'Tisch', 'MASKULIN', 'Die Tisch.')).toHaveLength(0)
  })

  it('does NOT flag "der" before a feminine noun (valid dative/genitive)', () => {
    expect(checkArticleUsage(FILE, 'p', 'Frau', 'FEMININ', 'Ich gebe der Frau das Buch.')).toHaveLength(0)
  })
})

// ===========================================================================
// Group 1 — plural well-formedness (warning)
// ===========================================================================
describe('genus:plural (warning)', () => {
  it('accepts the correct plural article "die"', () => {
    expect(checkPlural(FILE, 'p', 'die Namen')).toHaveLength(0)
  })

  it('accepts a plural with no leading article (nothing determinable)', () => {
    expect(checkPlural(FILE, 'p', 'Namen')).toHaveLength(0)
  })

  it('flags a plural that leads with "der"/"das"', () => {
    const der = checkPlural(FILE, 'p', 'der Namen')
    expect(der).toHaveLength(1)
    expect(der[0].rule).toBe('genus:plural')
    expect(der[0].severity).toBe('warning')
    expect(der[0].suggestion).toBe('die Namen')

    expect(rulesOf(checkPlural(FILE, 'p', 'das Häuser'))).toEqual(['genus:plural'])
  })

  it('only runs plural/article checks for NOMEN entries', () => {
    const verb = checkVocabularyWord(FILE, 0, {
      word: 'laufen',
      wordType: 'VERB',
      plural: 'der Unsinn',
      exampleSentence1: 'Das laufen.',
    })
    expect(rulesOf(verb)).not.toContain('genus:plural')
    expect(rulesOf(verb)).not.toContain('genus:article-usage')
  })
})

describe('checkVocabularyFile — file-level aggregation', () => {
  it('aggregates findings across words and ignores non-object entries', () => {
    const findings = checkVocabularyFile(FILE, {
      words: [
        { word: 'Name', article: 'MASKULIN', wordType: 'NOMEN', plural: 'die Namen' },
        { word: 'X', article: 'BAD', wordType: 'NOMEN' },
        null,
        'not-an-object',
      ],
    })
    expect(rulesOf(findings)).toContain('enum:article')
  })

  it('returns nothing for a file without a words array', () => {
    expect(checkVocabularyFile(FILE, { theme: {} })).toHaveLength(0)
  })
})

// ===========================================================================
// Group 2 — truth-value + token helpers
// ===========================================================================
describe('truthValue + evidence helpers', () => {
  it('canonicalizes richtig/falsch synonyms', () => {
    expect(truthValue('richtig')).toBe('richtig')
    expect(truthValue('R')).toBe('richtig')
    expect(truthValue('falsch')).toBe('falsch')
    expect(truthValue('wahr')).toBe('richtig')
    expect(truthValue('maybe')).toBeNull()
  })

  it('tokenizes dropping punctuation, ellipsis and short tokens', () => {
    expect(evidenceTokens('ich gehe heute in den Supermarkt...')).toEqual([
      'ich',
      'gehe',
      'heute',
      'den',
      'supermarkt',
    ])
  })

  it('computes paraphrase-tolerant overlap', () => {
    const source = 'Ich gehe heute Nachmittag in den Supermarkt. Wir brauchen Brot.'
    expect(evidenceOverlap('ich gehe heute in den Supermarkt', source)).toBeGreaterThanOrEqual(
      EVIDENCE_OVERLAP_THRESHOLD,
    )
    expect(evidenceOverlap('völlig anderer Satz über Katzen', source)).toBeLessThan(
      EVIDENCE_OVERLAP_THRESHOLD,
    )
  })
})

// ===========================================================================
// Group 2 — answer-key consistency
// ===========================================================================
const TEXTS = {
  texts: [
    { id: 'TextA', content: 'Ich gehe heute in den Supermarkt. Ich bin um 18 Uhr zu Hause.' },
  ],
}

describe('answerkey:option-range (error)', () => {
  it('passes a valid richtig/falsch answer', () => {
    const q = {
      type: 'richtig_falsch',
      answer: 'richtig',
      explanation: { key_evidence: 'ich gehe heute in den Supermarkt' },
      linked_text: 'TextA',
    }
    const findings = checkReadingQuestion(RFILE, 0, q, buildTextIndex(TEXTS))
    expect(rulesOf(findings)).not.toContain('answerkey:option-range')
  })

  it('flags correctIndex out of range', () => {
    const q = { type: 'multiple_choice', options: ['a', 'b'], correctIndex: 5 }
    const findings = checkReadingQuestion(RFILE, 2, q, buildTextIndex(TEXTS))
    const f = findings.find((x) => x.rule === 'answerkey:option-range')
    expect(f).toBeDefined()
    expect(f!.severity).toBe('error')
    expect(f!.jsonPath).toBe('questions[2].correctIndex')
  })

  it('flags an array-options answer that matches no option', () => {
    const q = { type: 'multiple_choice', options: ['Berlin', 'Wien'], answer: 'Paris' }
    const findings = checkReadingQuestion(RFILE, 0, q, buildTextIndex(TEXTS))
    expect(rulesOf(findings)).toContain('answerkey:option-range')
  })

  it('accepts an array-options answer by value or by index', () => {
    const byValue = checkReadingQuestion(
      RFILE,
      0,
      { type: 'multiple_choice', options: ['Berlin', 'Wien'], answer: 'Wien' },
      buildTextIndex(TEXTS),
    )
    const byIndex = checkReadingQuestion(
      RFILE,
      0,
      { type: 'multiple_choice', options: ['Berlin', 'Wien'], answer: 1 },
      buildTextIndex(TEXTS),
    )
    expect(rulesOf(byValue)).not.toContain('answerkey:option-range')
    expect(rulesOf(byIndex)).not.toContain('answerkey:option-range')
  })

  it('flags an invalid truth-value answer for a richtig_falsch question', () => {
    const q = { type: 'richtig_falsch', answer: 'vielleicht' }
    expect(rulesOf(checkReadingQuestion(RFILE, 0, q, buildTextIndex(TEXTS)))).toContain(
      'answerkey:option-range',
    )
  })

  it('does NOT duplicate content-qa for keyed-object option membership', () => {
    // Keyed-object answer membership is content-qa\u2019s INVALID_ANSWER_OPTION — skipped here.
    const q = { type: 'multiple_choice', options: { a: 'x', b: 'y' }, answer: 'z' }
    expect(rulesOf(checkReadingQuestion(RFILE, 0, q, buildTextIndex(TEXTS)))).not.toContain(
      'answerkey:option-range',
    )
  })
})

describe('answerkey:evidence-missing (warning)', () => {
  it('passes when key_evidence is grounded in the linked text', () => {
    const q = {
      type: 'richtig_falsch',
      answer: 'richtig',
      linked_text: 'TextA',
      explanation: { key_evidence: 'ich gehe heute in den Supermarkt' },
    }
    expect(rulesOf(checkReadingQuestion(RFILE, 0, q, buildTextIndex(TEXTS)))).not.toContain(
      'answerkey:evidence-missing',
    )
  })

  it('flags key_evidence that is not found in the linked text', () => {
    const q = {
      type: 'richtig_falsch',
      answer: 'richtig',
      linked_text: 'TextA',
      explanation: { key_evidence: 'Der Hund läuft schnell durch den Wald' },
    }
    const f = checkReadingQuestion(RFILE, 4, q, buildTextIndex(TEXTS)).find(
      (x) => x.rule === 'answerkey:evidence-missing',
    )
    expect(f).toBeDefined()
    expect(f!.severity).toBe('warning')
  })
})

describe('answerkey:contradiction (error, conservative)', () => {
  it('flags a VN verdict marker that disagrees with the answer', () => {
    const q = {
      type: 'richtig_falsch',
      answer: 'richtig',
      explanation: {
        key_evidence: 'ich gehe heute in den Supermarkt',
        vi: 'Đáp án: falsch (SAI). Nhận định không khớp với bài.',
      },
      linked_text: 'TextA',
    }
    const f = checkReadingQuestion(RFILE, 0, q, buildTextIndex(TEXTS)).find(
      (x) => x.rule === 'answerkey:contradiction',
    )
    expect(f).toBeDefined()
    expect(f!.severity).toBe('error')
  })

  it('does NOT flag when the marker agrees with the answer', () => {
    const q = {
      type: 'richtig_falsch',
      answer: 'richtig',
      explanation: {
        key_evidence: 'ich gehe heute in den Supermarkt',
        vi: 'Đáp án: richtig (ĐÚNG). Bằng chứng trong bài.',
      },
      linked_text: 'TextA',
    }
    expect(rulesOf(checkReadingQuestion(RFILE, 0, q, buildTextIndex(TEXTS)))).not.toContain(
      'answerkey:contradiction',
    )
  })

  it('does NOT flag when there is no unambiguous marker', () => {
    const q = {
      type: 'richtig_falsch',
      answer: 'falsch',
      explanation: {
        key_evidence: 'ich bin um 18 Uhr zu Hause',
        vi: 'Lisa kommt um 18 Uhr, nicht um 20 Uhr.',
      },
      linked_text: 'TextA',
    }
    expect(rulesOf(checkReadingQuestion(RFILE, 0, q, buildTextIndex(TEXTS)))).not.toContain(
      'answerkey:contradiction',
    )
  })
})

describe('checkReadingFile — file-level aggregation + verdict wiring', () => {
  it('an error finding drives a FAIL objective verdict', () => {
    const findings = checkReadingFile(RFILE, {
      ...TEXTS,
      questions: [{ type: 'multiple_choice', options: ['a', 'b'], correctIndex: 9 }],
    })
    expect(rulesOf(findings)).toContain('answerkey:option-range')
    expect(computeObjectiveVerdict(findings)).toBe('FAIL')
  })

  it('a warning-only file keeps a PASS objective verdict', () => {
    const findings = checkReadingFile(RFILE, {
      ...TEXTS,
      questions: [
        {
          type: 'richtig_falsch',
          answer: 'richtig',
          linked_text: 'TextA',
          explanation: { key_evidence: 'etwas ganz anderes über Katzen und Hunde' },
        },
      ],
    })
    expect(rulesOf(findings)).toEqual(['answerkey:evidence-missing'])
    expect(computeObjectiveVerdict(findings)).toBe('PASS')
  })
})
