// Inverse of codemod-snake-to-camel-content.mjs (Bước 1 of git-hygiene work-order).
// Reverts ONLY the 2a key-rename: maps the camelCase forms back to their
// original snake_case for the EXACT 45 keys 2a renamed. Operates on parsed JSON
// (keys only; values like "richtig_falsch" never touched). Explanation regen
// (explanation.vi/de/key_evidence content) is in VALUES -> preserved.
//
// Usage: node scripts/revert-2a-camel-to-snake.mjs [--apply]
import fs from 'node:fs'
import path from 'node:path'

const ROOT = process.cwd()
const apply = process.argv.includes('--apply')
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']
const SKILLS = ['reading', 'listening']

// EXACT set of snake keys that 2a renamed to camelCase (from the 2a apply report).
const RENAMED_SNAKE = [
  'all_answers_verifiable', 'all_gaps_have_4_options', 'all_gaps_match', 'all_sections_match',
  'all_signs_different_types', 'all_situations_unambiguous', 'anzeigen_different_enough',
  'anzeigen_same_category', 'block_details', 'exercise_file', 'gate1_auto', 'generated_at',
  'gespraech_count', 'grammar_a1_only', 'grammar_a2_only', 'grammar_b1_appropriate',
  'grammar_b2_appropriate', 'grammar_c1_appropriate', 'grammar_c2_appropriate', 'image_count',
  'image_text_matches_json', 'image_text_matches_sign', 'ja_nein_balanced', 'linked_anzeige',
  'linked_schild', 'matching_no_duplicate_answers', 'mc_distractors_plausible', 'null_matches',
  'null_matches_correct', 'regenerated_at', 'reviewed_at', 'reviewed_by', 'richtig_falsch_balanced',
  'schedule_data_consistent', 'six_ads_present', 'validated_at', 'vocab_in_a1_list',
  'vocab_in_a2_list', 'vocab_in_b1_list', 'vocab_in_b2_list', 'vocab_in_c1_list', 'vocab_in_c2_list',
  'warning_details', 'word_count_in_range', 'word_count_per_sign_valid',
]

function toCamel(key) {
  return key.replace(/_([a-z0-9])/g, (_, c) => c.toUpperCase())
}

// camelCase -> snake_case map for the exact renamed set.
const CAMEL_TO_SNAKE = new Map(RENAMED_SNAKE.map((s) => [toCamel(s), s]))

function transform(node) {
  if (Array.isArray(node)) return node.map(transform)
  if (node && typeof node === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(node)) {
      const nk = CAMEL_TO_SNAKE.has(k) ? CAMEL_TO_SNAKE.get(k) : k
      out[nk] = transform(v)
    }
    return out
  }
  return node
}

function collectValues(node, acc) {
  if (Array.isArray(node)) { for (const x of node) collectValues(x, acc); return }
  if (node && typeof node === 'object') { for (const v of Object.values(node)) collectValues(v, acc); return }
  acc.push(JSON.stringify(node))
}
function countKeys(node) {
  let n = 0
  if (Array.isArray(node)) { for (const x of node) n += countKeys(x); return n }
  if (node && typeof node === 'object') { for (const [, v] of Object.entries(node)) { n++; n += countKeys(v) } return n }
  return 0
}

let files = 0, changed = 0, aborted = 0
const revertedKeys = new Set()
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

      const scan = (n) => {
        if (Array.isArray(n)) n.forEach(scan)
        else if (n && typeof n === 'object') for (const k of Object.keys(n)) { if (CAMEL_TO_SNAKE.has(k)) revertedKeys.add(CAMEL_TO_SNAKE.get(k)); scan(n[k]) }
      }
      scan(json)

      const out = transform(json)

      const vB = []; collectValues(json, vB); vB.sort()
      const vA = []; collectValues(out, vA); vA.sort()
      if (vB.length !== vA.length || vB.join('\u0001') !== vA.join('\u0001')) { console.error(`ABORT ${rel}: value multiset changed!`); aborted++; continue }
      if (countKeys(json) !== countKeys(out)) { console.error(`ABORT ${rel}: key count changed!`); aborted++; continue }

      const after = JSON.stringify(out, null, 2) + '\n'
      if (after !== before) { changed++; if (apply) fs.writeFileSync(fp, after, 'utf8') }
    }
  }
}

console.log(`[revert-2a] mode=${apply ? 'APPLY' : 'DRY-RUN'}`)
console.log(`  files scanned=${files}, ${apply ? 'written' : 'would change'}=${changed}, aborted=${aborted}`)
console.log(`  camel keys reverted to snake: ${[...revertedKeys].sort().join(', ')}`)
if (aborted > 0) { console.error('  RESULT: ABORTED (value/key invariant broke). No partial trust.'); process.exit(1) }
