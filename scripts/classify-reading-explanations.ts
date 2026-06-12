/**
 * Verifier for spec `reading-explanation-regeneration` (RB-P2-02), Task 1.
 *
 * READ-ONLY. Classifies every answer-bearing reading question into
 * Rich/Templated/Thin (explanation.de quality) and counts boilerplate
 * explanation.vi. Prints a per-level breakdown and writes a work-list
 * JSON to tmp/reading-explanation-worklist.json for the content team.
 *
 * Usage:
 *   tsx scripts/classify-reading-explanations.ts [--level a1] [--json <path>]
 */
import fs from 'node:fs'
import path from 'node:path'
import { scanReadingQuestions, summarize, LEVELS } from './reading-explanation-lib'

const repoRoot = process.cwd()
const args = process.argv.slice(2)
const levelArg = (() => {
  const i = args.indexOf('--level')
  return i >= 0 ? args[i + 1] : undefined
})()
const jsonArg = (() => {
  const i = args.indexOf('--json')
  return i >= 0 ? args[i + 1] : path.join('tmp', 'reading-explanation-worklist.json')
})()

const refs = scanReadingQuestions(repoRoot, levelArg)
const s = summarize(refs)

console.log(`[classify-reading-explanations] scope=${levelArg ?? 'all levels'}`)
console.log(`  total answer-bearing reading questions = ${s.total}`)
console.log(`  explanation.de class: rich=${s.byClass.rich} templated=${s.byClass.templated} thin=${s.byClass.thin}`)
console.log(`  boilerplate explanation.vi = ${s.boilerplate}`)
console.log('  per level:')
for (const lv of LEVELS) if (s.byLevel[lv]) console.log(`    ${lv}: ${s.byLevel[lv]}`)

fs.mkdirSync(path.dirname(jsonArg), { recursive: true })
fs.writeFileSync(
  jsonArg,
  JSON.stringify(
    refs.map((r) => ({
      level: r.level,
      file: r.file,
      questionId: r.questionId,
      index: r.index,
      deClass: r.deClass,
      viBoilerplate: r.viBoilerplate,
      // work: 'translate' (rich de -> vi) | 'rewrite-de' (templated/thin) 
      work: r.deClass === 'rich' ? 'translate' : 'rewrite-de',
    })),
    null,
    2,
  ),
  'utf8',
)
console.log(`  work-list written: ${jsonArg}`)
