import { describe, it, expect } from 'vitest'

import {
  type PerItemRecord,
  ESCALATION_COLUMNS,
  PER_ITEM_COLUMNS,
  buildEscalationCsv,
  buildPerItemCsv,
  csvEscape,
  escalationReason,
  filterEscalation,
  groupFindingsByQuestion,
  perItemRow,
  summarizeFindings,
  toCsvLine,
} from '../../scripts/lib/review-board-run'
import {
  type AggregateResult,
  type Tier1Finding,
  buildTier1Result,
  combineLabels,
} from '../../scripts/lib/review-board-contract'

/**
 * Spec `fuxie-content-review-board` — Task 6.1 unit tests (Component 6).
 *
 * Light, in-memory coverage (NOT all 1.282 items, no provider credit, no real
 * content touched):
 *   1. CSV row builder — column order, escaping, header.
 *   2. Escalation filter — only status=escalate, with an escalation_reason.
 *   3. Honesty invariants — never the token "approved" in the output, the
 *      dual-label always carries notReviewedNote, and subjective provenance is
 *      labelled (`subjective_source`).
 *   4. Tier-1 finding attribution + summary helpers.
 */

// --- tiny in-memory record set ----------------------------------------------

function rec(over: Partial<PerItemRecord> = {}): PerItemRecord {
  return {
    file: 'content/a1/reading/A1-T1-001.json',
    itemId: 'Q1',
    level: 'a1',
    type: 'richtig_falsch',
    objectiveVerdict: 'PASS',
    tier1Findings: '',
    subjectiveLabel: 'ok',
    confidence: 'low',
    redFlag: true,
    status: 'escalate',
    subjectiveSource: 'mock',
    ...over,
  }
}

const sampleRecords: PerItemRecord[] = [
  // clean objective, but mock red-team flagged → escalate
  rec({ itemId: 'Q1' }),
  // objective FAIL → escalate (authoritative Tier-1)
  rec({
    itemId: 'Q2',
    objectiveVerdict: 'FAIL',
    tier1Findings: 'E:answerkey:contradictionx1',
    subjectiveLabel: 'fail',
  }),
  // the ONLY advisory-pass shape: PASS + high + no redFlag
  rec({
    itemId: 'Q3',
    objectiveVerdict: 'PASS',
    confidence: 'high',
    redFlag: false,
    subjectiveLabel: 'ok',
    status: 'advisory-pass (low-assurance)',
  }),
]

// --- 1: CSV row builder -----------------------------------------------------

describe('per-item CSV row builder', () => {
  it('emits the documented column order in the header', () => {
    expect([...PER_ITEM_COLUMNS]).toEqual([
      'file',
      'item_id',
      'level',
      'type',
      'objective_verdict',
      'tier1_findings',
      'subjective_label',
      'confidence',
      'red_flag',
      'status',
      'subjective_source',
    ])
  })

  it('perItemRow maps fields in column order', () => {
    const r = rec({ itemId: 'Q9', objectiveVerdict: 'FAIL', redFlag: false })
    expect(perItemRow(r)).toEqual([
      'content/a1/reading/A1-T1-001.json',
      'Q9',
      'a1',
      'richtig_falsch',
      'FAIL',
      '',
      'ok',
      'low',
      'false',
      'escalate',
      'mock',
    ])
  })

  it('csvEscape quotes every field and doubles inner quotes', () => {
    expect(csvEscape('a,b')).toBe('"a,b"')
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""')
    expect(csvEscape(null)).toBe('""')
    expect(toCsvLine(['x', 'y'])).toBe('"x","y"')
  })

  it('buildPerItemCsv has header + one row per record and ends with newline', () => {
    const csv = buildPerItemCsv(sampleRecords)
    const lines = csv.replace(/\n$/, '').split('\n')
    expect(lines.length).toBe(1 + sampleRecords.length)
    expect(lines[0]).toBe(toCsvLine([...PER_ITEM_COLUMNS]))
    expect(csv.endsWith('\n')).toBe(true)
    // item_id reuses the explanation-review scheme (the question id)
    expect(lines[1]).toContain('"Q1"')
  })
})

// --- 2: escalation filter ---------------------------------------------------

describe('escalation queue filter', () => {
  it('keeps only status=escalate rows', () => {
    const escalated = filterEscalation(sampleRecords)
    expect(escalated.map((r) => r.itemId)).toEqual(['Q1', 'Q2'])
    expect(escalated.every((r) => r.status === 'escalate')).toBe(true)
  })

  it('escalation CSV appends an escalation_reason column', () => {
    const csv = buildEscalationCsv(sampleRecords)
    const lines = csv.replace(/\n$/, '').split('\n')
    expect(lines[0]).toBe(toCsvLine([...ESCALATION_COLUMNS]))
    expect(lines[0]).toContain('"escalation_reason"')
    // header + 2 escalated rows (Q3 advisory-pass excluded)
    expect(lines.length).toBe(3)
  })

  it('escalationReason explains objective FAIL, redFlag and low confidence', () => {
    expect(escalationReason(rec({ objectiveVerdict: 'FAIL' }))).toContain('objective=FAIL')
    expect(escalationReason(rec({ redFlag: true, subjectiveSource: 'mock' }))).toContain('PLACEHOLDER')
    expect(escalationReason(rec({ confidence: 'low' }))).toContain('confidence=low')
  })
})

// --- 3: honesty invariants (no "approved" + notReviewedNote + provenance) ----

describe('honesty invariants', () => {
  it('never emits the token "approved" anywhere in the CSV output', () => {
    const blob = (buildPerItemCsv(sampleRecords) + buildEscalationCsv(sampleRecords)).toLowerCase()
    expect(blob).not.toContain('approved')
  })

  it('every row labels subjective provenance via subjective_source', () => {
    for (const r of sampleRecords) {
      expect(['mock', 'provider']).toContain(r.subjectiveSource)
    }
    const csv = buildPerItemCsv(sampleRecords)
    expect(csv).toContain('"mock"')
  })

  it('the dual-label combiner always carries notReviewedNote and never "approved"', () => {
    const findings: Tier1Finding[] = []
    const tier1 = buildTier1Result({ files: 1, deStrings: 0 }, findings)
    const agg: AggregateResult = {
      itemId: 'Q1',
      consensus: 'ok',
      confidence: 'high',
      perDimension: [],
      redFlag: false,
      estimatedCostUsd: 0,
    }
    const label = combineLabels(tier1, agg)
    expect(label.objective).toBe('PASS')
    expect(label.subjective.notReviewedNote.length).toBeGreaterThan(0)
    expect(JSON.stringify(label).toLowerCase()).not.toContain('approved')
  })
})

// --- 4: Tier-1 finding attribution + summary --------------------------------

describe('Tier-1 finding attribution helpers', () => {
  const findings: Tier1Finding[] = [
    {
      file: 'content/a1/reading/x.json',
      jsonPath: 'questions[0].answer',
      rule: 'answerkey:contradiction',
      severity: 'error',
      message: 'contradiction',
    },
    {
      file: 'content/a1/reading/x.json',
      jsonPath: 'questions[0].explanation.de',
      rule: 'hunspell:unknown',
      severity: 'warning',
      message: 'spelling',
    },
    {
      file: 'content/a1/reading/x.json',
      jsonPath: 'questions[2].statement',
      rule: 'hunspell:unknown',
      severity: 'warning',
      message: 'spelling',
    },
  ]

  it('groups findings by the question index in their jsonPath', () => {
    const byQ = groupFindingsByQuestion(findings)
    expect(byQ.get(0)?.length).toBe(2)
    expect(byQ.get(2)?.length).toBe(1)
    expect(byQ.has(1)).toBe(false)
  })

  it('summarizeFindings renders compact severity:rule x count', () => {
    const byQ = groupFindingsByQuestion(findings)
    const s0 = summarizeFindings(byQ.get(0) ?? [])
    expect(s0).toContain('E:answerkey:contradictionx1')
    expect(s0).toContain('W:hunspell:unknownx1')
    expect(summarizeFindings([])).toBe('')
  })
})
