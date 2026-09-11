import { describe, it, expect, afterEach } from 'vitest'
import http from 'node:http'
import type { AddressInfo } from 'node:net'

import {
  ltSeverity,
  mapLtMatchToFinding,
  pingLanguageTool,
  checkWithLanguageTool,
  checkStringWithLanguageTool,
  parseHunspellOutput,
  tokenizeGerman,
  checkWithHunspell,
  runGermanChecks,
  type DeStringRef,
  type LtMatch,
  type LtResponse,
  type HunspellRunner,
} from '../../scripts/lib/german-lint-checks'
import { buildTier1Result, tier1ExitCode } from '../../scripts/lib/review-board-contract'

/**
 * Spec `fuxie-content-review-board` — task 2.1 unit tests.
 *
 * Verifies the LanguageTool + hunspell wiring WITHOUT requiring a real
 * LanguageTool server / hunspell binary:
 *   (a) LanguageTool matches map to citeable Tier1Findings (offset/excerpt/rule).
 *   (b) Severity mapping: spelling/grammar/casing -> error; style/typography -> warning.
 *   (c) Server-unreachable -> infraError + exit code 2 + verdict != PASS (Req 1.9).
 *
 * A tiny node:http fake stands in for the LanguageTool server so the request
 * shape (POST /v2/check, GET /v2/languages) is exercised end-to-end.
 */

// --- fake LanguageTool server fixture --------------------------------------

interface FakeServer {
  url: string
  close: () => Promise<void>
  requests: { method: string; path: string; body: string }[]
}

function startFakeLanguageTool(handler: (text: string) => LtResponse): Promise<FakeServer> {
  const requests: { method: string; path: string; body: string }[] = []
  const server = http.createServer((req, res) => {
    const chunks: Buffer[] = []
    req.on('data', (c) => chunks.push(c as Buffer))
    req.on('end', () => {
      const body = Buffer.concat(chunks).toString('utf8')
      requests.push({ method: req.method ?? '', path: req.url ?? '', body })
      if ((req.url ?? '').startsWith('/v2/languages')) {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify([{ name: 'German', code: 'de', longCode: 'de-DE' }]))
        return
      }
      if ((req.url ?? '').startsWith('/v2/check')) {
        const params = new URLSearchParams(body)
        const text = params.get('text') ?? ''
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify(handler(text)))
        return
      }
      res.writeHead(404)
      res.end()
    })
  })
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address() as AddressInfo
      resolve({
        url: `http://127.0.0.1:${port}`,
        requests,
        close: () =>
          new Promise<void>((res) => {
            server.close(() => res())
          }),
      })
    })
  })
}

let active: FakeServer | null = null
afterEach(async () => {
  if (active) {
    await active.close()
    active = null
  }
})

function ref(text: string): DeStringRef {
  return { file: 'content/a1/reading/x.json', jsonPath: 'questions[0].explanation.de', text }
}

function ltMatch(partial: Partial<LtMatch> & { offset: number; length: number }): LtMatch {
  return {
    message: 'msg',
    replacements: [],
    rule: { id: 'RULE', category: { id: 'MISC' } },
    ...partial,
  }
}

// ---------------------------------------------------------------------------
// (b) Severity mapping
// ---------------------------------------------------------------------------
describe('ltSeverity — error vs warning mapping', () => {
  it('spelling (TYPOS) maps to error', () => {
    expect(ltSeverity(ltMatch({ offset: 0, length: 1, rule: { id: 'GERMAN_SPELLER_RULE', category: { id: 'TYPOS' } } }))).toBe('error')
  })
  it('grammar maps to error', () => {
    expect(ltSeverity(ltMatch({ offset: 0, length: 1, rule: { id: 'DE_AGREEMENT', category: { id: 'GRAMMAR' } } }))).toBe('error')
  })
  it('German casing maps to error', () => {
    expect(ltSeverity(ltMatch({ offset: 0, length: 1, rule: { id: 'DE_CASE', category: { id: 'CASING' } } }))).toBe('error')
  })
  it('issueType=misspelling maps to error even with unknown category', () => {
    expect(ltSeverity(ltMatch({ offset: 0, length: 1, rule: { id: 'X', issueType: 'misspelling', category: { id: 'SOMETHING' } } }))).toBe('error')
  })
  it('typography maps to warning', () => {
    expect(ltSeverity(ltMatch({ offset: 0, length: 1, rule: { id: 'WHITESPACE_RULE', category: { id: 'TYPOGRAPHY' } } }))).toBe('warning')
  })
  it('style maps to warning', () => {
    expect(ltSeverity(ltMatch({ offset: 0, length: 1, rule: { id: 'STYLE_X', category: { id: 'STYLE' } } }))).toBe('warning')
  })
  it('unknown category defaults to warning (do not over-block)', () => {
    expect(ltSeverity(ltMatch({ offset: 0, length: 1, rule: { id: 'X', category: { id: 'UNHEARD_OF' } } }))).toBe('warning')
  })
})

// ---------------------------------------------------------------------------
// (a) LT match -> citeable Tier1Finding
// ---------------------------------------------------------------------------
describe('mapLtMatchToFinding — citeable mapping', () => {
  it('computes offset {start,end,excerpt} against the source text + first suggestion', () => {
    const text = 'Das ist ein Feler im Satz.'
    const start = text.indexOf('Feler')
    const finding = mapLtMatchToFinding(
      ref(text),
      ltMatch({
        offset: start,
        length: 'Feler'.length,
        message: 'Möglicher Tippfehler',
        replacements: [{ value: 'Fehler' }, { value: 'Feler' }],
        rule: { id: 'GERMAN_SPELLER_RULE', category: { id: 'TYPOS' } },
      }),
    )
    expect(finding.rule).toBe('languagetool:GERMAN_SPELLER_RULE')
    expect(finding.severity).toBe('error')
    expect(finding.offset).toEqual({ start, end: start + 5, excerpt: 'Feler' })
    expect(finding.suggestion).toBe('Fehler')
    expect(finding.file).toBe('content/a1/reading/x.json')
    expect(finding.jsonPath).toBe('questions[0].explanation.de')
  })

  it('falls back to UNKNOWN rule id and omits suggestion when none', () => {
    const finding = mapLtMatchToFinding(ref('abc'), { message: 'm', offset: 0, length: 3 })
    expect(finding.rule).toBe('languagetool:UNKNOWN')
    expect(finding.suggestion).toBeUndefined()
    expect(finding.offset?.excerpt).toBe('abc')
  })

  it('clamps offsets that exceed the string length', () => {
    const finding = mapLtMatchToFinding(ref('hi'), ltMatch({ offset: 1, length: 99 }))
    expect(finding.offset).toEqual({ start: 1, end: 2, excerpt: 'i' })
  })
})

// ---------------------------------------------------------------------------
// LanguageTool client against the fake server
// ---------------------------------------------------------------------------
describe('checkWithLanguageTool — against fake server', () => {
  it('POSTs language=de-DE + text and maps matches to findings', async () => {
    active = await startFakeLanguageTool((text) => {
      const idx = text.indexOf('Feler')
      return idx >= 0
        ? { matches: [ltMatch({ offset: idx, length: 5, rule: { id: 'GERMAN_SPELLER_RULE', category: { id: 'TYPOS' } }, replacements: [{ value: 'Fehler' }] })] }
        : { matches: [] }
    })
    const findings = await checkStringWithLanguageTool(ref('Ein Feler hier'), { url: active.url })
    expect(findings).toHaveLength(1)
    expect(findings[0].rule).toBe('languagetool:GERMAN_SPELLER_RULE')
    expect(findings[0].severity).toBe('error')
    expect(findings[0].suggestion).toBe('Fehler')

    const checkReq = active.requests.find((r) => r.path.startsWith('/v2/check'))!
    const params = new URLSearchParams(checkReq.body)
    expect(checkReq.method).toBe('POST')
    expect(params.get('language')).toBe('de-DE')
    expect(params.get('text')).toBe('Ein Feler hier')
  })

  it('scans multiple strings preserving order', async () => {
    active = await startFakeLanguageTool((text) =>
      text.includes('bad') ? { matches: [ltMatch({ offset: 0, length: 3, rule: { id: 'R', category: { id: 'GRAMMAR' } } })] } : { matches: [] },
    )
    const findings = await checkWithLanguageTool(
      [ref('clean'), ref('bad'), ref('also clean')],
      { url: active.url },
    )
    expect(findings).toHaveLength(1)
    expect(findings[0].severity).toBe('error')
  })
})

// ---------------------------------------------------------------------------
// (c) Health-check / infraError — Req 1.9 (CRITICAL)
// ---------------------------------------------------------------------------
describe('pingLanguageTool + infraError path (Req 1.9)', () => {
  it('reports ok against a live fake server', async () => {
    active = await startFakeLanguageTool(() => ({ matches: [] }))
    const health = await pingLanguageTool({ url: active.url })
    expect(health.ok).toBe(true)
  })

  it('reports not-ok (with reason) when the server is unreachable', async () => {
    // Port 1 is not listening — fetch rejects.
    const health = await pingLanguageTool({ url: 'http://127.0.0.1:1' })
    expect(health.ok).toBe(false)
    expect(health.error).toMatch(/unreachable/i)
  })

  it('runGermanChecks returns infraError (no false PASS) when LT is down', async () => {
    const out = await runGermanChecks([ref('Irgendein Satz.')], {
      languageTool: { url: 'http://127.0.0.1:1' },
      skipHunspell: true,
    })
    expect(out.infraError).toBeTruthy()
    expect(out.findings).toHaveLength(0)

    // The infraError must propagate to a non-PASS verdict + exit code 2.
    const result = buildTier1Result({ files: 1, deStrings: 1 }, out.findings, out.infraError)
    expect(result.objectiveVerdict).not.toBe('PASS')
    expect(tier1ExitCode(result)).toBe(2)
  })

  it('runGermanChecks runs LT scan when the server is reachable', async () => {
    active = await startFakeLanguageTool((text) =>
      text.includes('Feler')
        ? { matches: [ltMatch({ offset: text.indexOf('Feler'), length: 5, rule: { id: 'GERMAN_SPELLER_RULE', category: { id: 'TYPOS' } } })] }
        : { matches: [] },
    )
    const out = await runGermanChecks([ref('Ein Feler')], {
      languageTool: { url: active.url },
      skipHunspell: true,
    })
    expect(out.infraError).toBeUndefined()
    expect(out.findings).toHaveLength(1)
    expect(out.findings[0].severity).toBe('error')
    // hunspell skipped by option -> recorded note, not an infra failure.
    expect(out.notes.join(' ')).toMatch(/hunspell skipped/i)
  })
})

// ---------------------------------------------------------------------------
// hunspell — tokenization, output parsing, finding mapping (injected runner)
// ---------------------------------------------------------------------------
describe('hunspell sub-check', () => {
  it('tokenizes German words keeping umlauts and ß with offsets', () => {
    const tokens = tokenizeGerman('Die Straße ist schön.')
    expect(tokens.map((t) => t.word)).toEqual(['Die', 'Straße', 'ist', 'schön'])
    expect(tokens[1].start).toBe('Die '.length)
  })

  it('parses hunspell -a pipe output into per-word results', () => {
    const stdout = [
      '@(#) International Ispell Version 3.2.06',
      '*', // Die -> ok
      '& Strase 2 4: Straße, Strasse', // miss with suggestions
      '*', // ist -> ok
      '# Schoen 12', // miss no suggestions
      '',
    ].join('\n')
    const results = parseHunspellOutput(stdout, ['Die', 'Strase', 'ist', 'Schoen'])
    expect(results[0]).toEqual({ word: 'Die', correct: true })
    expect(results[1]).toEqual({ word: 'Strase', correct: false, suggestions: ['Straße', 'Strasse'] })
    expect(results[2]).toEqual({ word: 'ist', correct: true })
    expect(results[3]).toEqual({ word: 'Schoen', correct: false, suggestions: [] })
  })

  it('emits hunspell:unknown error findings for unknown tokens via injected runner', () => {
    const runner: HunspellRunner = (words) =>
      words.map((word) =>
        word === 'Feler'
          ? { word, correct: false, suggestions: ['Fehler'] }
          : { word, correct: true },
      )
    const text = 'Das ist ein Feler.'
    const findings = checkWithHunspell([ref(text)], { runner })
    expect(findings).toHaveLength(1)
    expect(findings[0].rule).toBe('hunspell:unknown')
    expect(findings[0].severity).toBe('error')
    expect(findings[0].suggestion).toBe('Fehler')
    expect(findings[0].offset).toEqual({
      start: text.indexOf('Feler'),
      end: text.indexOf('Feler') + 5,
      excerpt: 'Feler',
    })
  })
})
