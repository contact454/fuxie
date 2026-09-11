import { describe, it, expect } from 'vitest'

import {
  parseArgs,
  isContentJsonPath,
  collectDiffContentFiles,
  assertReportPathOutsideContent,
  type GitRunner,
} from '../../scripts/content-german-lint'

/**
 * Spec `fuxie-content-review-board` — task 2.3 unit tests.
 *
 * Covers the new CLI seam WITHOUT depending on real repo state:
 *   (a) parseArgs recognizes --diff and --report-path (space + `=` forms)
 *       alongside the existing --skill / --level / --json flags.
 *   (b) collectDiffContentFiles, given an injected git runner, unions the three
 *       git views, keeps only content/**\/*.json, dedupes, sorts, and returns
 *       null on git failure (fall-back-to-full-scan signal).
 *   (c) assertReportPathOutsideContent refuses paths under content/.
 */

// ---------------------------------------------------------------------------
// (a) parseArgs
// ---------------------------------------------------------------------------
describe('parseArgs — task 2.3 flags', () => {
  it('defaults: skill=reading, no diff/json/report-path/level', () => {
    const a = parseArgs([])
    expect(a).toEqual({ skill: 'reading', json: false, diff: false })
  })

  it('recognizes --diff', () => {
    expect(parseArgs(['--diff']).diff).toBe(true)
  })

  it('recognizes --report-path <p> (space form)', () => {
    expect(parseArgs(['--report-path', 'tmp/german-lint-report.json']).reportPath).toBe(
      'tmp/german-lint-report.json',
    )
  })

  it('recognizes --report-path=<p> (equals form)', () => {
    expect(parseArgs(['--report-path=docs/out/r.json']).reportPath).toBe('docs/out/r.json')
  })

  it('still parses --skill / --level / --json together with the new flags', () => {
    const a = parseArgs([
      '--skill',
      'ALL',
      '--level=B1',
      '--json',
      '--diff',
      '--report-path',
      'tmp/r.json',
    ])
    expect(a).toEqual({
      skill: 'all',
      level: 'b1',
      json: true,
      diff: true,
      reportPath: 'tmp/r.json',
    })
  })
})

// ---------------------------------------------------------------------------
// (b) isContentJsonPath
// ---------------------------------------------------------------------------
describe('isContentJsonPath', () => {
  it('accepts content json files (forward or back slashes)', () => {
    expect(isContentJsonPath('content/a1/reading/x.json')).toBe(true)
    expect(isContentJsonPath('content\\b2\\vocabulary\\y.json')).toBe(true)
  })

  it('rejects non-content, non-json, and sidecar files', () => {
    expect(isContentJsonPath('scripts/content-german-lint.ts')).toBe(false)
    expect(isContentJsonPath('content/a1/reading/x.md')).toBe(false)
    expect(isContentJsonPath('docs/content/notes.json')).toBe(false)
    expect(isContentJsonPath('content/a1/reading/x.qa.json')).toBe(false)
    expect(isContentJsonPath('content/a1/reading/x.meta.json')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// (c) collectDiffContentFiles — injected git runner
// ---------------------------------------------------------------------------
function fakeGit(map: Record<string, string>): GitRunner {
  return (args) => {
    const key = args.join(' ')
    if (!(key in map)) throw new Error(`unexpected git invocation: git ${key}`)
    return map[key]
  }
}

describe('collectDiffContentFiles — injected git runner', () => {
  it('unions unstaged + staged + untracked, filters to content json, dedupes, sorts', () => {
    const runner = fakeGit({
      'diff --name-only': ['content/b1/reading/b.json', 'scripts/foo.ts', ''].join('\n'),
      'diff --name-only --staged': ['content/a1/reading/a.json', 'content/b1/reading/b.json'].join(
        '\n',
      ),
      'ls-files --others --exclude-standard': [
        'content/a2/vocabulary/c.json',
        'README.md',
        'content/a1/reading/a.qa.json', // sidecar -> excluded
      ].join('\n'),
    })
    expect(collectDiffContentFiles(runner)).toEqual([
      'content/a1/reading/a.json',
      'content/a2/vocabulary/c.json',
      'content/b1/reading/b.json',
    ])
  })

  it('normalizes backslash paths from git output', () => {
    const runner = fakeGit({
      'diff --name-only': 'content\\a1\\reading\\x.json',
      'diff --name-only --staged': '',
      'ls-files --others --exclude-standard': '',
    })
    expect(collectDiffContentFiles(runner)).toEqual(['content/a1/reading/x.json'])
  })

  it('returns an empty list when nothing relevant changed', () => {
    const runner = fakeGit({
      'diff --name-only': 'scripts/foo.ts',
      'diff --name-only --staged': '',
      'ls-files --others --exclude-standard': 'notes.txt',
    })
    expect(collectDiffContentFiles(runner)).toEqual([])
  })

  it('returns null when git throws (not a repo / git unavailable)', () => {
    const runner: GitRunner = () => {
      throw new Error('not a git repository')
    }
    expect(collectDiffContentFiles(runner)).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// (c) report-path guard
// ---------------------------------------------------------------------------
describe('assertReportPathOutsideContent', () => {
  const root = '/repo'

  it('allows tmp/ and docs/ paths', () => {
    expect(() => assertReportPathOutsideContent(root, 'tmp/german-lint-report.json')).not.toThrow()
    expect(() =>
      assertReportPathOutsideContent(root, 'docs/content-quality/r.json'),
    ).not.toThrow()
  })

  it('rejects paths under content/', () => {
    expect(() => assertReportPathOutsideContent(root, 'content/a1/r.json')).toThrow(/content\//)
    expect(() => assertReportPathOutsideContent(root, './content/x.json')).toThrow(/content\//)
  })
})
