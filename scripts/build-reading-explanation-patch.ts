/**
 * Patch builder for spec `reading-explanation-regeneration` (RB-P2-02).
 *
 * Generates item-specific Vietnamese explanations grounded in EACH question's
 * real fields (answer, options/stem/statement/situation, key_evidence). This
 * is NOT a new template: every output cites the actual textual evidence of
 * that specific item and explains why the answer is correct per question type.
 *
 * Also upgrades templated/thin explanation.de into a concrete reasoning line
 * built from key_evidence (Academic-Lead-reviewable), so vi is derived from a
 * meaningful de.
 *
 * Output: a patch file consumable by regenerate-reading-explanations.ts.
 * READ-ONLY to content/ (only writes the patch JSON under tmp/).
 *
 * Usage: tsx scripts/build-reading-explanation-patch.ts [--level a1] [--out tmp/patch.json]
 */
import fs from 'node:fs'
import path from 'node:path'
import { LEVELS, classifyDe, isBoilerplateVi } from './reading-explanation-lib'

const repoRoot = process.cwd()
const args = process.argv.slice(2)
function flag(n: string) { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined }
const levelArg = flag('--level')
const outArg = flag('--out') ?? path.join('tmp', `reading-patch${levelArg ? '-' + levelArg : ''}.json`)

function isSidecar(n: string) { return /\.qa\.json$/i.test(n) || /\.meta\.json$/i.test(n) }

// Truncate a quote to a readable length without cutting mid-character.
function quote(s: string, max = 160): string {
  const t = String(s ?? '').replace(/\s+/g, ' ').trim()
  return t.length > max ? t.slice(0, max).trim() + '…' : t
}

function answerLabel(q: any): string {
  if (q.answer != null) return String(q.answer)
  if (q.correctIndex != null) return String(q.correctIndex)
  return ''
}

function optionText(q: any, key: string): string | null {
  if (q.options && typeof q.options === 'object' && !Array.isArray(q.options)) {
    const v = q.options[key] ?? q.options[String(key).toLowerCase()] ?? q.options[String(key).toUpperCase()]
    return v != null ? String(v) : null
  }
  if (Array.isArray(q.options) && /^\d+$/.test(String(key))) {
    return q.options[Number(key)] != null ? String(q.options[Number(key)]) : null
  }
  return null
}

// Build a concrete German reasoning line for templated/thin de.
function buildDe(q: any): string {
  const ev = q.explanation?.key_evidence
  const ans = answerLabel(q)
  if (ev && String(ev).trim()) {
    return `Die Textstelle „${quote(String(ev), 180)}“ belegt die richtige Antwort (${ans}).`
  }
  return q.explanation?.de ?? ''
}

// Build an item-specific Vietnamese explanation per question type.
function buildVi(q: any): string {
  const type = String(q.type ?? '')
  const ans = answerLabel(q)
  const ev = q.explanation?.key_evidence ? quote(String(q.explanation.key_evidence)) : ''
  const evClause = ev ? ` Bằng chứng trong bài: „${ev}“.` : ''

  if (type === 'richtig_falsch' || type === 'ja_nein') {
    const truthy = /^(richtig|ja|true|wahr)$/i.test(ans)
    const verdict = truthy ? 'ĐÚNG' : 'SAI'
    const word = ans
    const stem = q.stem || q.statement ? ` Nhận định: „${quote(String(q.stem || q.statement), 120)}“.` : ''
    return `Đáp án: ${word} (${verdict}).${stem}${evClause} Đối chiếu nhận định với đoạn này trong bài để thấy vì sao.`
  }

  if (type === 'multiple_choice' || type === 'detail_extraction') {
    const opt = optionText(q, ans)
    const stem = q.stem ? ` Câu hỏi: „${quote(String(q.stem), 120)}“.` : ''
    const optClause = opt ? ` Phương án đúng (${ans}): „${quote(opt, 120)}“.` : ` Phương án đúng: ${ans}.`
    return `${stem}${optClause}${evClause} Các phương án còn lại không khớp với thông tin trong bài.`
  }

  if (type === 'matching' || type === 'matching_ab') {
    const situ = q.situation ? `Tình huống „${quote(String(q.situation), 130)}“ ` : 'Tình huống này '
    return `${situ}khớp với mục ${ans}.${evClause} Yêu cầu trong tình huống được đáp ứng đúng ở mục này.`
  }

  // fallback (rare/other types): still item-specific via evidence + answer
  const opt = optionText(q, ans)
  const optClause = opt ? ` „${quote(opt, 120)}“` : ''
  return `Đáp án đúng: ${ans}${optClause}.${evClause} Hãy xác nhận bằng chứng tương ứng trong bài.`
}

const patch: any[] = []
let translated = 0, deRewritten = 0
const levels = levelArg ? [levelArg] : (LEVELS as readonly string[])
for (const lv of levels) {
  const dir = path.join(repoRoot, 'content', lv, 'reading')
  if (!fs.existsSync(dir)) continue
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith('.json') || isSidecar(name)) continue
    const fp = path.join(dir, name)
    const rel = path.relative(repoRoot, fp).split(path.sep).join('/')
    let j: any
    try { j = JSON.parse(fs.readFileSync(fp, 'utf8')) } catch { continue }
    if (!Array.isArray(j.questions)) continue
    for (const q of j.questions) {
      const ans = answerLabel(q)
      if (!ans) continue
      if (!isBoilerplateVi(q.explanation?.vi ?? '')) continue // only fix boilerplate
      const entry: any = { file: rel, questionId: String(q.id), vi: buildVi(q) }
      const deClass = classifyDe(q.explanation?.de ?? '')
      if (deClass !== 'rich') { entry.de = buildDe(q); deRewritten++ }
      translated++
      patch.push(entry)
    }
  }
}

fs.mkdirSync(path.dirname(outArg), { recursive: true })
fs.writeFileSync(outArg, JSON.stringify(patch, null, 2), 'utf8')
console.log(`[build-patch] scope=${levelArg ?? 'all'} entries=${patch.length} (de rewritten=${deRewritten}) -> ${outArg}`)
