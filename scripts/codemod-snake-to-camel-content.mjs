// Option B codemod — spec content-schema-camel-migration (RB-P2-01, Hướng 2).
// Renames EVERY snake_case object KEY to camelCase across reading/listening
// content JSON. Operates on the PARSED JSON tree, so string VALUES (e.g.
// "richtig_falsch", "ja_nein") are NEVER touched — only keys.
//
// Safety:
//   - default DRY-RUN (writes nothing); pass --apply to write.
//   - --skill reading|listening to scope.
//   - Asserts: same number of keys before/after (no key lost), and the set of
//     leaf VALUES (JSON.stringify of all primitive values) is byte-identical
//     before/after (values invariant).
//
// Usage: node scripts/codemod-snake-to-camel-content.mjs [--skill reading] [--apply]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const args = process.argv.slice(2)
const apply = args.includes('--apply')
const skillArg = (() => { const i = args.indexOf('--skill'); return i >= 0 ? args[i + 1] : null })()
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']
const SKILLS = skillArg ? [skillArg] : ['reading', 'listening']

const SNAKE_KEY = /^[a-z][a-z0-9]*(?:_[a-z0-9]+)+$/

// Keys with KNOWN consumers (seeder reads -> DB, tooling, QA gate, or runtime UI).
// These are DEFERRED to a consumer-synced phase; the codemod must NOT rename them
// yet, otherwise seed/QA/UI would break.
const SKIP_KEYS = new Set([
  'teil_name', 'task_type', 'audio_file', 'topic_id', 'linked_text',
  'key_evidence', 'key_vocabulary', 'speaker_role', 'source_script',
  'word_count', 'word_count_text_a', 'word_count_text_b',
  'total_points', 'pass_threshold', 'target_grammar', 'target_vocabulary',
  // runtime UI / content-qa consumers found via grep:
  'alt_text', 'extra_info', 'target_audience', 'opinion_texts',
  'sentence_cloze', 'section_cloze',
])

function toCamel(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
}

// Recursively rename snake_case KEYS to camelCase, EXCEPT SKIP_KEYS. Values untouched.
function transform(node) {
  if (Array.isArray(node)) return node.map(transform)
  if (node && typeof node === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(node)) {
      const nk = SNAKE_KEY.test(k) && !SKIP_KEYS.has(k) ? toCamel(k) : k
      out[nk] = transform(v)
    }
    return out
  }
  return node
}

// Collect all primitive VALUES (order-independent multiset) for invariance check.
function collectValues(node, acc) {
  if (Array.isArray(node)) { for (const x of node) collectValues(x, acc); return }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) collectValues(v, acc); return }
  acc.push(JSON.stringify(node))
}
function countKeys(node) {
  let n = 0
  if (Array.isArray(node)) { for (const x of node) n += countKeys(x); return n }
  if (node && typeof node === 'object') { for (const [k, v] of Object.entries(node)) { n++; n += countKeys(v) } return n }
  return 0
}

let files = 0, changed = 0, aborted = 0
const renamedKeys = new Set()
for (const lv of LEVELS) {
  for (const sk of SKILLS) {
    const dir = path.join(ROOT, 'content', lv, sk)
    if (!fs.existsSync(dir)) continue
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json')) continue
      const fp = path.join(dir, name)
      const rel = path.relative(ROOT, fp).split(path.sep).join('/')
      const before = fs.readFileSync(fp, 'utf8')
      let json
      try { json = JSON.parse(before) } catch (e) { console.error(`PARSE FAIL ${rel}: ${e.message}`); aborted++; continue }
      files++

      // record which snake keys exist (for reporting)
      const scan = (n) => {
        if (Array.isArray(n)) n.forEach(scan)
        else if (n && typeof n === 'object') for (const k of Object.keys(n)) { if (SNAKE_KEY.test(k) && !SKIP_KEYS.has(k)) renamedKeys.add(k); scan(n[k]) }
      }
      scan(json)

      const out = transform(json)

      // invariance asserts
      const vBefore = []; collectValues(json, vBefore); vBefore.sort()
      const vAfter = []; collectValues(out, vAfter); vAfter.sort()
      if (vBefore.length !== vAfter.length || vBefore.join('\u0001') !== vAfter.join('\u0001')) {
        console.error(`ABORT ${rel}: value multiset changed!`); aborted++; continue
      }
      if (countKeys(json) !== countKeys(out)) {
        console.error(`ABORT ${rel}: key count changed!`); aborted++; continue
      }

      const after = JSON.stringify(out, null, 2) + '\n'
      if (after !== before) {
        changed++
        if (apply) fs.writeFileSync(fp, after, 'utf8')
      }
    }
  }
}

console.log(`[codemod] mode=${apply ? 'APPLY' : 'DRY-RUN'} skill=${skillArg ?? 'reading+listening'}`)
console.log(`  files scanned=${files}, ${apply ? 'written' : 'would change'}=${changed}, aborted=${aborted}`)
console.log(`  distinct snake keys renamed: ${[...renamedKeys].sort().join(', ')}`)
if (aborted > 0) { console.error('  RESULT: ABORTED on at least one file (value/key invariant broke). No partial trust.'); process.exit(1) }
