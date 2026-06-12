import { describe, expect, it } from 'vitest'

import {
  assertGeneratedBatchClean,
  validateGeneratedBatch,
} from '../../scripts/content-generation-guard'

const GOOD_ARTICLE_TEXT =
  'Digitale Souveränität Europas verlangt eine sorgfältige Abwägung zwischen Infrastruktur, demokratischer Kontrolle und wirtschaftlicher Abhängigkeit. ' +
  'Digitale Souveränität wird dabei nicht als Abschottung verstanden, sondern als Fähigkeit, Regeln, Datenflüsse und kritische Dienste selbstbestimmt zu gestalten. ' +
  'Gerade europäische Institutionen müssen erklären, welche Kompetenzen zentral gebündelt werden und wo lokale Verantwortung sinnvoll bleibt.'

function cleanItem(id = 'clean') {
  return {
    id,
    topic: 'Digitale Souveränität Europas',
    article: {
      title: 'Digitale Souveränität Europas',
      text: GOOD_ARTICLE_TEXT,
    },
    questions: [
      {
        stem: 'Welche Spannung beschreibt der Text?',
      },
    ],
  }
}

describe('content-generation guard', () => {
  it('passes a clean generated batch', () => {
    const result = validateGeneratedBatch([cleanItem('a')])
    expect(result).toEqual({ ok: true, violations: [] })
    expect(() => assertGeneratedBatchClean([cleanItem('a')])).not.toThrow()
  })

  it('rejects known generic filler openers', () => {
    const result = validateGeneratedBatch([
      {
        ...cleanItem('filler'),
        article: {
          title: 'Wirtschaftsethik',
          text:
            'Der vorliegende Kommentar widmet sich dem Thema Wirtschaftsethik aus einer kritisch-analytischen Perspektive. ' +
            'Wirtschaftsethik '.repeat(60),
        },
      },
    ])
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'D1')).toBe(true)
  })

  it('rejects duplicate bodies inside a generated batch', () => {
    const result = validateGeneratedBatch([cleanItem('a'), cleanItem('b')])
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'D2' && v.id === 'a~b')).toBe(true)
  })

  it('rejects topic mismatch', () => {
    const result = validateGeneratedBatch([
      {
        ...cleanItem('topic-mismatch'),
        topic: 'Architektur und kollektives Gedächtnis',
        article: {
          title: 'Architektur und kollektives Gedächtnis',
          text: GOOD_ARTICLE_TEXT,
        },
      },
    ])
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'D3')).toBe(true)
  })

  it('rejects looped listening transcripts', () => {
    const repeated = {
      speaker: 'Sprecherin',
      speaker_role: 'dialogue_speaker',
      text: 'Algorithmische Empfehlungssysteme ordnen Inhalte nach vermuteten Interessen und beeinflussen dadurch öffentliche Aufmerksamkeit.',
    }
    const result = validateGeneratedBatch([
      {
        id: 'loop',
        topic: 'Algorithmische Empfehlungssysteme',
        transcript: {
          lines: [
            repeated,
            repeated,
            {
              speaker: 'Sprecher',
              speaker_role: 'dialogue_speaker',
              text: 'Algorithmische Empfehlungssysteme sollten transparent geprüft werden.',
            },
          ],
        },
      },
    ])
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'D4')).toBe(true)
  })

  it('rejects broken question stems', () => {
    const result = validateGeneratedBatch([
      {
        ...cleanItem('broken-stem'),
        questions: [
          {
            stem: 'Was impliziert der Text über Schlussfolgerung über Ab welchem Alter kann man am legt der Text nahe?',
          },
        ],
      },
    ])
    expect(result.ok).toBe(false)
    expect(result.violations.some((v) => v.code === 'D5')).toBe(true)
  })
})
