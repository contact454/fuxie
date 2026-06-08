/**
 * READ-ONLY scanner: tìm placeholder/filler + nội dung trùng lặp trên TOÀN BỘ content/.
 *
 * Vai chinh: Content QA / Linguistic Reviewer
 * Vai phoi hop: German Academic Lead, AI / LLM Engineer
 *
 * Phát hiện 2 họ defect đã thấy ở C2 reading, quét rộng ra mọi skill/level:
 *   1. Generic-filler opener (khuôn template lặp).
 *   2. Near-duplicate text body (nhiều file dùng chung 1 đoạn văn — chỉ thay
 *      danh từ chủ đề), dấu hiệu của filler do generator.
 *
 * KHÔNG ghi vào content/. Chỉ in báo cáo. Dùng để xác định phạm vi remediation.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO_ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const CONTENT = path.join(REPO_ROOT, 'content')

/** Khuôn opener generic đã biết (mở rộng dần khi phát hiện thêm). */
const GENERIC_OPENERS: RegExp[] = [
  /Der vorliegende (Kommentar|Text|Artikel) widmet sich dem Thema/i,
  /Der wissenschaftliche Diskurs um das Thema/i,
]

function norm(s: string): string {
  return (s ?? '').toLowerCase().replace(/[\u201e\u201c\u201d\u2018\u2019"'`]/g, '').replace(/\s+/g, ' ').trim()
}

/** Lấy mọi chuỗi văn bản "thân bài" đáng kể từ một item content (đệ quy). */
function bodyStrings(obj: any, out: string[] = []): string[] {
  if (obj == null) return out
  if (typeof obj === 'string') {
    if (obj.length >= 200) out.push(obj)
    return out
  }
  if (Array.isArray(obj)) {
    for (const v of obj) bodyStrings(v, out)
    return out
  }
  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      // Bỏ qua field rõ ràng không phải nội dung học
      if (k === 'prompt' || k === 'alt_text' || k === 'filename') continue
      bodyStrings(v, out)
    }
  }
  return out
}

function* walk(dir: string): Generator<string> {
  for (const name of fs.readdirSync(dir).sort()) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) yield* walk(p)
    else if (name.endsWith('.json') && !/\.(qa|meta)\.json$/i.test(name)) yield p
  }
}

interface OpenerHit { file: string; opener: string }
interface DupGroup { sig: string; files: string[]; sample: string }

function main(): void {
  const openerHits: OpenerHit[] = []
  // sig (80 ký tự normalized đầu của body) -> danh sách file
  const bySig = new Map<string, Set<string>>()
  const sigSample = new Map<string, string>()
  let scanned = 0

  for (const file of walk(CONTENT)) {
    let j: any
    try { j = JSON.parse(fs.readFileSync(file, 'utf8')) } catch { continue }
    scanned++
    const rel = path.relative(REPO_ROOT, file).replace(/\\/g, '/')
    for (const body of bodyStrings(j)) {
      for (const re of GENERIC_OPENERS) {
        if (re.test(body)) { openerHits.push({ file: rel, opener: re.source.slice(0, 40) }); break }
      }
      const n = norm(body)
      if (n.length < 200) continue
      const sig = n.slice(0, 80)
      if (!bySig.has(sig)) { bySig.set(sig, new Set()); sigSample.set(sig, body.slice(0, 90)) }
      bySig.get(sig)!.add(rel)
    }
  }

  const dupGroups: DupGroup[] = []
  for (const [sig, files] of bySig) {
    if (files.size >= 2) dupGroups.push({ sig, files: [...files].sort(), sample: sigSample.get(sig)! })
  }
  dupGroups.sort((a, b) => b.files.length - a.files.length)

  process.stdout.write(`\n[scan-content-placeholders] scanned ${scanned} JSON files under content/\n`)
  process.stdout.write(`\n== Generic-filler opener hits: ${openerHits.length} ==\n`)
  for (const h of openerHits) process.stdout.write(`  FILLER  ${h.file}\n`)

  const dupFileCount = new Set(dupGroups.flatMap((g) => g.files)).size
  process.stdout.write(`\n== Near-duplicate body groups: ${dupGroups.length} (involving ${dupFileCount} files) ==\n`)
  for (const g of dupGroups) {
    process.stdout.write(`  DUP x${g.files.length}: "${g.sample.replace(/\s+/g, ' ').trim()}…"\n`)
    for (const f of g.files) process.stdout.write(`        ${f}\n`)
  }

  // Skill/level breakdown of dup-involved files.
  const bySkill = new Map<string, number>()
  for (const f of new Set(dupGroups.flatMap((g) => g.files))) {
    const m = f.match(/content\/([a-z0-9]+)\/([a-z]+)\//)
    if (m) { const k = `${m[1]}/${m[2]}`; bySkill.set(k, (bySkill.get(k) ?? 0) + 1) }
  }
  process.stdout.write(`\n== Dup-involved files by skill/level ==\n`)
  for (const [k, v] of [...bySkill.entries()].sort((a, b) => b[1] - a[1])) {
    process.stdout.write(`  ${k}: ${v}\n`)
  }
  process.stdout.write(`\nSUMMARY opener=${openerHits.length} dupGroups=${dupGroups.length} dupFiles=${dupFileCount}\n`)
}

main()
