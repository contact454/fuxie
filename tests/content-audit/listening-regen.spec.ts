import { describe, it, expect } from 'vitest'
import path from 'node:path'

import {
  normalizeText,
  overlapScore,
  internalDupRatio,
  transcriptMatchesTopic,
  transcriptDialogueText,
  scanListeningLevel,
  LISTENING_LEVELS,
} from '../../scripts/lib/listening-scan'
import {
  answerValidForType,
  validateListeningPatch,
  applyListeningRegen,
  type ListeningRegenPatch,
} from '../../scripts/apply-listening-regen'

/**
 * Spec `content-listening-regeneration` — Task 1.
 *   Property 1: No Duplicated Transcript Within Level — overlapScore detects
 *               verbatim copies; the scanner documents the current N↔N+10 P0.
 *   Property 2: Transcript Matches Declared Topic.
 *   Property 3: No Fake Looping Segments (internalDupRatio).
 *   Property 4: Answer Verifiable In Transcript (validateListeningPatch).
 *   Property 5: applyListeningRegen keeps schema, replaces only transcript +
 *               questions, marks Audio_Restubbing.
 *
 * The per-level scan assertions are baselines that document the defect today;
 * as each level is regenerated (Tasks 2–5) the counts drop toward 0 and the
 * thresholds below are tightened to the closing gate.
 */

const ROOT = path.resolve(__dirname, '..', '..')

const line = (text: string, role = 'dialogue_speaker', speaker = 'Sprecher') => ({ speaker, speaker_role: role, text })

const goodTranscript = (): ListeningRegenPatch['transcript_lines'] => [
  line('Sie hören eine Radiosendung zum Thema Reformpädagogik.', 'exam_narrator', 'Narrator'),
  line('Die Reformpädagogik entstand zu Beginn des zwanzigsten Jahrhunderts als Gegenbewegung zur autoritären Lernkultur der Kaiserzeit.'),
  line('Maria Montessori und Célestin Freinet entwickelten Konzepte, die das selbsttätige Lernen des Kindes in den Mittelpunkt stellten.'),
  line('In der heutigen Praxis zeigt sich, dass reformpädagogische Ansätze besonders in der Freiarbeit und im Projektunterricht fortwirken.'),
]

const goodPatch = (): ListeningRegenPatch => ({
  transcript_lines: goodTranscript(),
  questions: [
    {
      id: 'q1',
      type: 'ja_nein',
      statement: 'Die Reformpädagogik verstand sich als Gegenbewegung zur autoritären Lernkultur.',
      answer: 'ja',
      explanation: {
        key_evidence: 'als Gegenbewegung zur autoritären Lernkultur der Kaiserzeit',
        de: 'Der Text nennt die Reformpädagogik ausdrücklich eine Gegenbewegung.',
        vi: 'Đáp án "ja": bài nói rõ đây là phong trào phản kháng văn hoá học tập độc đoán.',
      },
    },
  ],
})

const existingFile = () => ({
  id: 'L-C2-GOETHE-013-T1',
  level: 'C2',
  teil: 1,
  teil_name: 'Radiosendungen',
  task_type: 'ja_nein',
  topic: 'Reformpädagogik in der Praxis',
  audio_file: '/audio/x.mp3',
  metadata: { gespraech_count: 5 },
  questions: [{ id: 'old', answer: 'ja', explanation: {} }],
  scoring: { total_points: 3 },
  transcript: { status: 'complete', lines: [line('alt')] },
  cefrAudit: { targetLevel: 'C2', verdict: 'aligned' },
  learningOutcomes: [{ id: 'lo' }],
})

// ---------------------------------------------------------------------------
// Property 1 — overlap detection + per-level baseline
// ---------------------------------------------------------------------------
describe('Property 1: duplicated-transcript detection', () => {
  it('overlapScore flags identical text and clears distinct text', () => {
    const a = normalizeText('Die Berliner Mauer fiel im November neunzehnhundertneunundachtzig nach friedlichen Protesten in Leipzig und anderen Städten der DDR.')
    expect(overlapScore(a, a)).toBeGreaterThanOrEqual(0.95)
    const b = normalizeText('Die Reformpädagogik stellte das selbsttätige Lernen des Kindes in den Mittelpunkt der schulischen Praxis des Projektunterrichts.')
    expect(overlapScore(a, b)).toBeLessThan(0.5)
  })

  it('per-level scan documents the current defect baseline (drops as levels are regenerated)', () => {
    // Closing gate target = 0 for every level. Until then these caps document
    // the known P0 scope; tighten toward 0 as Tasks 2–5 land.
    const caps: Record<string, number> = { b1: 4, b2: 8, c1: 8, c2: 22 }
    for (const lvl of LISTENING_LEVELS) {
      const scan = scanListeningLevel(ROOT, lvl)
      expect(scan.files, `${lvl} should have listening files`).toBeGreaterThan(0)
      expect(
        scan.exactPairs.length,
        `${lvl}: exact-duplicate pairs exceeded documented baseline`,
      ).toBeLessThanOrEqual(caps[lvl])
    }
  })
})

// ---------------------------------------------------------------------------
// Property 2 — topic match
// ---------------------------------------------------------------------------
describe('Property 2: transcript matches declared topic', () => {
  it('passes when a topic keyword appears, fails on mismatch', () => {
    const match = { topic: 'Reformpädagogik in der Praxis', transcript: { lines: goodTranscript() } }
    expect(transcriptMatchesTopic(match)).toBe(true)
    const mismatch = {
      topic: 'Reformpädagogik in der Praxis',
      transcript: { lines: [line('Die Berliner Mauer prägte die deutsche Teilung über Jahrzehnte hinweg.')] },
    }
    expect(transcriptMatchesTopic(mismatch)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Property 3 — no fake looping segments
// ---------------------------------------------------------------------------
describe('Property 3: no fake looping segments', () => {
  it('internalDupRatio is low for distinct paragraphs, high for looped ones', () => {
    expect(internalDupRatio({ transcript: { lines: goodTranscript() } })).toBeLessThan(0.2)
    const looped = [line('Ein und derselbe Absatz wiederholt sich.'), line('Ein und derselbe Absatz wiederholt sich.'), line('Ein und derselbe Absatz wiederholt sich.')]
    expect(internalDupRatio({ transcript: { lines: looped } })).toBeGreaterThanOrEqual(0.5)
  })
})

// ---------------------------------------------------------------------------
// Property 4 — answer verifiable + validation
// ---------------------------------------------------------------------------
describe('Property 4: validateListeningPatch', () => {
  it('accepts a well-formed patch', () => {
    expect(validateListeningPatch(goodPatch(), existingFile()).ok).toBe(true)
  })

  it('answerValidForType handles ja_nein and multiple_choice', () => {
    expect(answerValidForType('ja', 'ja_nein')).toBe(true)
    expect(answerValidForType('vielleicht', 'ja_nein')).toBe(false)
    expect(answerValidForType('b', 'multiple_choice', { a: 'x', b: 'y' })).toBe(true)
    expect(answerValidForType('z', 'multiple_choice', { a: 'x', b: 'y' })).toBe(false)
  })

  it('rejects key_evidence not present in transcript', () => {
    const p = goodPatch(); p.questions[0].explanation.key_evidence = 'etwas das gar nicht im Transkript steht xyz'
    const r = validateListeningPatch(p, existingFile())
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/key_evidence not found/)
  })

  it('rejects trivial filler key_evidence', () => {
    const p = goodPatch(); p.questions[0].explanation.key_evidence = 'Die Berliner Mauer'
    const r = validateListeningPatch(p, existingFile())
    expect(r.ok).toBe(false)
  })

  it('rejects a transcript that does not match the declared topic', () => {
    const p = goodPatch()
    p.transcript_lines = [line('Die Quantenmechanik beschreibt das Verhalten subatomarer Teilchen jenseits der klassischen Physik des Alltags.')]
    p.questions[0].explanation.key_evidence = 'das Verhalten subatomarer Teilchen'
    const r = validateListeningPatch(p, existingFile())
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/does not mention the declared topic/)
  })

  it('rejects fake looping segments', () => {
    const p = goodPatch()
    p.transcript_lines = [line('Reformpädagogik wiederholt sich hier wortwörtlich.'), line('Reformpädagogik wiederholt sich hier wortwörtlich.'), line('Reformpädagogik wiederholt sich hier wortwörtlich.')]
    const r = validateListeningPatch(p, existingFile())
    expect(r.ok).toBe(false)
    expect(r.errors.join(' ')).toMatch(/looping segments/)
  })

  it('rejects wrong question count', () => {
    const ex = existingFile(); ex.questions = [{ id: 'a', answer: 'ja', explanation: {} }, { id: 'b', answer: 'nein', explanation: {} }]
    expect(validateListeningPatch(goodPatch(), ex).ok).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Property 5 — apply keeps schema, marks Audio_Restubbing
// ---------------------------------------------------------------------------
describe('Property 5: applyListeningRegen keeps schema', () => {
  it('replaces transcript + questions, keeps id/level/scoring/learningOutcomes, marks re-record', () => {
    const r = applyListeningRegen(JSON.stringify(existingFile(), null, 2), goodPatch())
    expect(r.error).toBeUndefined()
    const after = JSON.parse(r.text)
    expect(after.id).toBe('L-C2-GOETHE-013-T1')
    expect(after.level).toBe('C2')
    expect(after.scoring.total_points).toBe(3)
    expect(after.learningOutcomes[0].id).toBe('lo')
    expect(after.transcript.status).toBe('complete')
    expect(after.transcript.audio_restub).toBe('pending')
    expect(after.transcript.note).toMatch(/Audio_Restubbing/)
    expect(after.cefrAudit.verdict).toBe('aligned')
    expect(transcriptDialogueText(after)).toMatch(/Reformpädagogik/)
    expect(after.questions[0].id).toBe('q1')
  })

  it('aborts (no output) on an invalid patch', () => {
    const bad = goodPatch(); bad.questions[0].answer = 'vielleicht'
    const text = JSON.stringify(existingFile(), null, 2)
    const r = applyListeningRegen(text, bad)
    expect(r.error).toBeTruthy()
    expect(r.text).toBe(text)
  })
})
