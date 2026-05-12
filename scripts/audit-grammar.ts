/**
 * QA Audit Script for Grammar (Grammatik) Module
 * Comprehensive checks: Topics, Rules, Lessons, Exercises
 */
import { PrismaClient } from '../apps/web/generated/prisma'
import * as fs from 'fs'

const prisma = new PrismaClient()

interface AuditIssue {
  id: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  category: string
  detail: string
}
const issues: AuditIssue[] = []
function add(id: string, sev: AuditIssue['severity'], cat: string, detail: string) {
  issues.push({ id, severity: sev, category: cat, detail })
}

const VALID_EX_TYPES = [
  'multiple_choice', 'fill_blanks', 'matching', 'gap_fill_bank',
  'sentence_reorder', 'gap_fill_type', 'error_spotting', 'transformation',
  'cloze', 'sort_words'
]

async function main() {
  console.log('🔍 Starting Grammar Module QA Audit...\n')

  const topics = await prisma.grammarTopic.findMany({
    include: { rules: true, lessons: { include: { topic: true } } },
    orderBy: [{ cefrLevel: 'asc' }, { sortOrder: 'asc' }]
  })
  console.log(`📦 ${topics.length} topics, checking...\n`)

  // ==========================================
  // 1. TOPIC-LEVEL CHECKS
  // ==========================================
  console.log('━━━ 1. TOPIC-LEVEL CHECKS ━━━')

  const byLevel: Record<string, typeof topics> = {}
  for (const t of topics) {
    if (!byLevel[t.cefrLevel]) byLevel[t.cefrLevel] = []
    byLevel[t.cefrLevel].push(t)
  }

  for (const [level, lt] of Object.entries(byLevel)) {
    console.log(`  ${level}: ${lt.length} topics, ${lt.reduce((s, t) => s + t.lessons.length, 0)} lessons, ${lt.reduce((s, t) => s + t.rules.length, 0)} rules`)
  }

  const slugSet = new Set<string>()
  for (const t of topics) {
    if (slugSet.has(t.slug)) add(t.slug, 'CRITICAL', 'DUPLICATE', `Duplicate slug: ${t.slug}`)
    slugSet.add(t.slug)

    if (!t.title || t.title.trim().length < 3) add(t.slug, 'CRITICAL', 'TOPIC', 'Missing or too short title')
    if (!t.description) add(t.slug, 'WARNING', 'TOPIC', 'Missing description')
    if (!t.explanation) add(t.slug, 'INFO', 'TOPIC', 'Missing explanation')
    if (t.status !== 'PUBLISHED') add(t.slug, 'WARNING', 'TOPIC', `Not PUBLISHED (status=${t.status})`)

    // Lesson coverage: Each PUBLISHED topic should have E, V, A
    // Skip DRAFT topics as they are dev/test and intentionally incomplete
    if (t.status === 'PUBLISHED') {
      const lessonTypes = new Set(t.lessons.map(l => l.lessonType))
      if (!lessonTypes.has('E')) add(t.slug, 'CRITICAL', 'COVERAGE', 'Missing E (Einführung) lesson')
      if (!lessonTypes.has('V')) add(t.slug, 'CRITICAL', 'COVERAGE', 'Missing V (Vertiefung) lesson')
      if (!lessonTypes.has('A')) add(t.slug, 'CRITICAL', 'COVERAGE', 'Missing A (Anwendung) lesson')
    }

    // Rules check
    if (t.rules.length === 0) add(t.slug, 'INFO', 'RULES', 'No grammar rules defined')
    for (const r of t.rules) {
      if (!r.ruleText || r.ruleText.trim().length < 10) add(t.slug, 'WARNING', 'RULES', `Rule "${r.title}" has empty/short ruleText`)
      if (!r.examples || (Array.isArray(r.examples) && (r.examples as any[]).length === 0)) add(t.slug, 'WARNING', 'RULES', `Rule "${r.title}" has no examples`)
    }
  }

  // ==========================================
  // 2. LESSON-LEVEL CHECKS
  // ==========================================
  console.log('\n━━━ 2. LESSON-LEVEL CHECKS ━━━')

  const allLessons = topics.flatMap(t => t.lessons)
  let noTheory = 0, emptyExercises = 0, noTranslation = 0

  for (const l of allLessons) {
    // Theory check (E and V lessons should have theory)
    if (l.lessonType !== 'A' && !l.theoryJson) {
      add(l.id, 'WARNING', 'THEORY', 'E/V lesson missing theoryJson')
      noTheory++
    }
    if (l.theoryJson) {
      const theory = l.theoryJson as any
      if (theory.blocks && Array.isArray(theory.blocks)) {
        if (theory.blocks.length === 0) add(l.id, 'WARNING', 'THEORY', 'theoryJson.blocks is empty')
        for (let i = 0; i < theory.blocks.length; i++) {
          const block = theory.blocks[i]
          if (!block.type) add(l.id, 'WARNING', 'THEORY', `Theory block ${i} missing type`)
        }
      }
    }

    // Exercises check
    if (!l.exercisesJson || !Array.isArray(l.exercisesJson)) {
      add(l.id, 'CRITICAL', 'EXERCISES', 'Missing or invalid exercisesJson')
      emptyExercises++
    } else {
      const exs = l.exercisesJson as any[]
      if (exs.length === 0) {
        add(l.id, 'CRITICAL', 'EXERCISES', 'exercisesJson is empty array')
        emptyExercises++
      } else {
        const minEx = l.lessonType === 'A' ? 8 : 4
        if (exs.length < minEx) {
          add(l.id, 'WARNING', 'EXERCISES', `Only ${exs.length} exercises (expected >= ${minEx} for ${l.lessonType}-lesson)`)
        }

        for (let i = 0; i < exs.length; i++) {
          const ex = exs[i]

          // Type validation
          if (!ex.type) {
            add(l.id, 'CRITICAL', 'EXERCISE_TYPE', `Exercise ${i + 1} missing type`)
          } else if (!VALID_EX_TYPES.includes(ex.type)) {
            add(l.id, 'WARNING', 'EXERCISE_TYPE', `Exercise ${i + 1} has unknown type "${ex.type}"`)
          }

          // Type-specific answer validation
          // Each exercise type stores its answer in a different key
          const hasAnswer = (() => {
            switch (ex.type) {
              case 'multiple_choice':
                // Uses `answer` (array) or `correct` (index)
                return (ex.answer !== undefined && ex.answer !== null) || (ex.correct !== undefined && ex.correct !== null)
              case 'gap_fill_type':
                // Uses `answer` array
                return Array.isArray(ex.answer) && ex.answer.length > 0
              case 'matching':
                // Uses `pairs` array
                return Array.isArray(ex.pairs) && ex.pairs.length > 0
              case 'gap_fill_bank':
                // Answer is derived from blanks in stem; check `bank` exists
                return Array.isArray(ex.bank) && ex.bank.length > 0
              case 'sentence_reorder':
              case 'sort_words':
                // Uses `correct_order` array
                return Array.isArray(ex.correct_order) && ex.correct_order.length > 0
              case 'error_spotting':
                // Uses `correct_word` or `correct_sentence`
                return !!ex.correct_word || !!ex.correct_sentence
              case 'transformation':
                // Uses `accepted_answers` array
                return Array.isArray(ex.accepted_answers) && ex.accepted_answers.length > 0
              case 'cloze':
                // Uses `gaps` array
                return Array.isArray(ex.gaps) && ex.gaps.length > 0
              case 'fill_blanks':
                // Uses `blanks` array
                return Array.isArray(ex.blanks) && ex.blanks.length > 0
              default:
                // Fallback: check any answer-like key
                return !!ex.answer || !!ex.correct || !!ex.correctAnswer
            }
          })()

          if (!hasAnswer) {
            add(l.id, 'CRITICAL', 'ANSWER', `Exercise ${i + 1} (${ex.type}) missing answer data`)
          }

          // Question/stem/prompt validation
          const hasPrompt = ex.question_de || ex.question_vi || ex.stem ||
            ex.instruction_de || ex.instruction_vi || ex.sentence ||
            ex.sentences || ex.text || ex.source_sentence || ex.sentence_words || ex.words
          if (!hasPrompt) {
            add(l.id, 'WARNING', 'PROMPT', `Exercise ${i + 1} (${ex.type}) missing question/stem/instruction`)
          }

          // Options for MC
          if (ex.type === 'multiple_choice') {
            if (!ex.options || !Array.isArray(ex.options) || ex.options.length < 2) {
              add(l.id, 'CRITICAL', 'OPTIONS', `MC exercise ${i + 1} has < 2 options`)
            }
            // If using `answer` array, check answer is in options
            if (ex.answer && ex.options && Array.isArray(ex.answer)) {
              for (const a of ex.answer) {
                if (!ex.options.includes(a)) {
                  add(l.id, 'CRITICAL', 'ANSWER_MATCH', `MC ex ${i + 1}: answer "${a}" not found in options`)
                }
              }
            }
          }

          // Matching pairs validation
          if (ex.type === 'matching' && Array.isArray(ex.pairs)) {
            for (let j = 0; j < ex.pairs.length; j++) {
              const pair = ex.pairs[j]
              if (!pair.left && !pair.de && !pair.a) {
                add(l.id, 'WARNING', 'MATCHING', `Matching ex ${i + 1}, pair ${j + 1} missing left/de/a`)
              }
            }
          }

          // Explanation check
          if (!ex.explanation_de && !ex.explanation_vi) {
            add(l.id, 'INFO', 'EXPLANATION', `Exercise ${i + 1} missing explanation`)
          }
        }
      }
    }

    // Translation check
    if (!l.translations) noTranslation++

    // TitleDe check
    if (!l.titleDe || l.titleDe.trim().length < 3) {
      add(l.id, 'WARNING', 'TITLE', 'Missing or too short titleDe')
    }

    // Level consistency
    if (l.level !== l.topic.cefrLevel) {
      add(l.id, 'CRITICAL', 'LEVEL_MISMATCH', `Lesson level ${l.level} != topic level ${l.topic.cefrLevel}`)
    }

    // Status
    if (l.status !== 'PUBLISHED') {
      add(l.id, 'WARNING', 'STATUS', `Lesson not PUBLISHED (status=${l.status})`)
    }
  }

  console.log(`  Total lessons: ${allLessons.length}`)
  console.log(`  Missing theory (E/V): ${noTheory}`)
  console.log(`  Empty exercises: ${emptyExercises}`)
  console.log(`  Missing translations: ${noTranslation}`)

  // ==========================================
  // 3. EXERCISE STATISTICS
  // ==========================================
  console.log('\n━━━ 3. EXERCISE STATISTICS ━━━')

  const exTypeCounts: Record<string, number> = {}
  let totalExercises = 0
  let missingExplanation = 0

  for (const l of allLessons) {
    if (!Array.isArray(l.exercisesJson)) continue
    for (const ex of l.exercisesJson as any[]) {
      totalExercises++
      exTypeCounts[ex.type || 'unknown'] = (exTypeCounts[ex.type || 'unknown'] || 0) + 1
      if (!ex.explanation_de && !ex.explanation_vi) missingExplanation++
    }
  }
  console.log(`  Total exercises: ${totalExercises}`)
  console.log(`  Missing explanations: ${missingExplanation}`)
  console.log('  By type:', exTypeCounts)

  // ==========================================
  // 4. SORT ORDER CHECKS
  // ==========================================
  console.log('\n━━━ 4. SORT ORDER & CONSISTENCY ━━━')

  for (const [level, lt] of Object.entries(byLevel)) {
    const orders = lt.map(t => t.sortOrder)
    const dupeOrders = orders.filter((o, i) => orders.indexOf(o) !== i)
    if (dupeOrders.length > 0) {
      add('GLOBAL', 'WARNING', 'SORT_ORDER', `${level}: Duplicate topic sortOrders: ${[...new Set(dupeOrders)].join(', ')}`)
    }
  }
  console.log('  ✔ Sort order checked')

  // ==========================================
  // SUMMARY
  // ==========================================
  console.log('\n' + '='.repeat(60))

  const criticals = issues.filter(i => i.severity === 'CRITICAL')
  const warnings = issues.filter(i => i.severity === 'WARNING')
  const infos = issues.filter(i => i.severity === 'INFO')

  console.log(`\n📊 SUMMARY`)
  console.log(`  CRITICAL: ${criticals.length}`)
  console.log(`  WARNING:  ${warnings.length}`)
  console.log(`  INFO:     ${infos.length}`)

  if (criticals.length > 0) {
    console.log('\n🚨 CRITICAL ISSUES:')
    for (const i of criticals) console.log(`  [${i.id}] ${i.category}: ${i.detail}`)
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    const warnCats: Record<string, AuditIssue[]> = {}
    for (const i of warnings) { if (!warnCats[i.category]) warnCats[i.category] = []; warnCats[i.category].push(i) }
    for (const [cat, items] of Object.entries(warnCats)) {
      console.log(`  ${cat} (${items.length}):`)
      for (const i of items.slice(0, 5)) console.log(`    [${i.id}] ${i.detail}`)
      if (items.length > 5) console.log(`    ... and ${items.length - 5} more`)
    }
  }

  if (infos.length > 0) {
    console.log('\nℹ️  INFO:')
    const infoCats: Record<string, number> = {}
    for (const i of infos) infoCats[i.category] = (infoCats[i.category] || 0) + 1
    for (const [cat, count] of Object.entries(infoCats)) console.log(`  ${cat}: ${count}`)
  }

  // Save report
  const reportPath = 'apps/web/public/audit-grammar.json'
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total_topics: topics.length,
    total_lessons: allLessons.length,
    total_exercises: totalExercises,
    summary: { critical: criticals.length, warning: warnings.length, info: infos.length },
    issues
  }, null, 2))
  console.log(`\n💾 Full report: ${reportPath}`)

  if (criticals.length === 0) {
    console.log(`\n✅ PASSED — Grammar Module looks great! (${warnings.length} warnings, ${infos.length} info)`)
  } else {
    console.log(`\n❌ FAILED — ${criticals.length} critical issues need fixing`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
