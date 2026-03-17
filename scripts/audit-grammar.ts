import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

interface Issue {
  level: string
  topic: string
  lesson: string
  type: string
  severity: 'critical' | 'warning' | 'info'
  message: string
}

async function main() {
  const issues: Issue[] = []
  
  const all = await p.grammarLesson.findMany({
    include: { topic: true },
    orderBy: [{ topic: { cefrLevel: 'asc' } }, { topic: { sortOrder: 'asc' } }, { sortOrder: 'asc' }]
  })

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  🔍 GRAMMAR DEEP AUDIT — ${all.length} lessons`)
  console.log(`${'═'.repeat(60)}\n`)

  // ═══ CHECK 1: Theory Block Structure ═══
  console.log('📋 CHECK 1: Theory Block Structure')
  for (const l of all) {
    const theory = l.theoryJson as any
    const blocks = Array.isArray(theory?.blocks) ? theory.blocks : []
    const label = `${l.topic.cefrLevel}|${l.lessonType}|${l.topic.slug}`

    if (l.lessonType === 'E') {
      if (blocks.length < 8) {
        issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'theory', severity: 'critical', message: `E lesson has only ${blocks.length} theory blocks (need ≥8)` })
      }
      // Check required block types
      const types = new Set(blocks.map((b: any) => b.type))
      const required = ['situation', 'discovery', 'rule', 'examples', 'key_takeaway']
      for (const r of required) {
        if (!types.has(r)) {
          issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'theory', severity: 'critical', message: `E lesson missing required block: ${r}` })
        }
      }
    }
    if (l.lessonType === 'V' && blocks.length === 0) {
      issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'theory', severity: 'warning', message: `V lesson has 0 theory blocks` })
    }
  }

  // ═══ CHECK 2: Exercise Quality ═══
  console.log('📋 CHECK 2: Exercise Quality')
  for (const l of all) {
    const exercises = l.exercisesJson as any[]
    const label = `${l.topic.cefrLevel}|${l.lessonType}|${l.topic.slug}`

    if (!Array.isArray(exercises) || exercises.length === 0) {
      issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'exercises', severity: 'critical', message: `No exercises` })
      continue
    }
    if (exercises.length < 8) {
      issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'exercises', severity: 'warning', message: `Only ${exercises.length} exercises (need ≥8)` })
    }

    // Check exercise type diversity
    const types = new Set(exercises.map((e: any) => e.type))
    if (types.size < 3) {
      issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'exercises', severity: 'warning', message: `Low exercise diversity: only ${types.size} types (${[...types].join(',')})` })
    }

    // Check each exercise has required fields
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i]
      if (!ex.id) {
        issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'exercises', severity: 'warning', message: `Exercise ${i+1} missing id` })
      }
      if (!ex.instruction_vi) {
        issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'exercises', severity: 'warning', message: `Exercise ${ex.id || i+1} missing instruction_vi` })
      }

      // Type-specific checks
      if (ex.type === 'multiple_choice') {
        if (!ex.options || ex.options.length < 3) issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'exercises', severity: 'critical', message: `MC ${ex.id}: < 3 options` })
        if (ex.correct === undefined || ex.correct < 0 || ex.correct >= (ex.options?.length || 0)) issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'exercises', severity: 'critical', message: `MC ${ex.id}: invalid correct index` })
      }
      if (ex.type === 'matching' && (!ex.pairs || ex.pairs.length < 3)) {
        issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'exercises', severity: 'warning', message: `Matching ${ex.id}: < 3 pairs` })
      }
      if (ex.type === 'gap_fill_bank' && (!ex.bank || ex.bank.length === 0)) {
        issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'exercises', severity: 'critical', message: `GapFillBank ${ex.id}: empty bank` })
      }
    }
  }

  // ═══ CHECK 3: Content Completeness ═══
  console.log('📋 CHECK 3: Content Completeness')
  const topics = await p.grammarTopic.findMany({
    include: { lessons: { select: { lessonType: true } } },
    orderBy: [{ cefrLevel: 'asc' }, { sortOrder: 'asc' }]
  })
  for (const t of topics) {
    const types = new Set(t.lessons.map(l => l.lessonType))
    if (!types.has('E')) issues.push({ level: t.cefrLevel, topic: t.slug, lesson: '-', type: 'completeness', severity: 'critical', message: 'Missing E lesson' })
    if (!types.has('V')) issues.push({ level: t.cefrLevel, topic: t.slug, lesson: '-', type: 'completeness', severity: 'warning', message: 'Missing V lesson' })
    if (!types.has('A')) issues.push({ level: t.cefrLevel, topic: t.slug, lesson: '-', type: 'completeness', severity: 'warning', message: 'Missing A lesson' })
  }

  // ═══ CHECK 4: Empty/null content ═══
  console.log('📋 CHECK 4: Empty/null Fields')
  for (const l of all) {
    if (!l.titleDe || l.titleDe.trim() === '') issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'fields', severity: 'warning', message: 'Empty titleDe' })
    if (!l.titleVi || l.titleVi.trim() === '') issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'fields', severity: 'warning', message: 'Empty titleVi' })
    if (!l.tags || l.tags.length === 0) issues.push({ level: l.topic.cefrLevel, topic: l.topic.slug, lesson: l.id, type: 'fields', severity: 'info', message: 'No tags' })
  }

  // ═══ SUMMARY ═══
  const critical = issues.filter(i => i.severity === 'critical')
  const warnings = issues.filter(i => i.severity === 'warning')
  const infos = issues.filter(i => i.severity === 'info')

  console.log(`\n${'═'.repeat(60)}`)
  console.log(`  📊 AUDIT RESULTS`)
  console.log(`${'═'.repeat(60)}`)

  if (critical.length > 0) {
    console.log(`\n🔴 CRITICAL (${critical.length}):`)
    critical.forEach(i => console.log(`  ❌ ${i.level} | ${i.topic} | ${i.lesson} — ${i.message}`))
  }
  if (warnings.length > 0) {
    console.log(`\n🟡 WARNINGS (${warnings.length}):`)
    warnings.forEach(i => console.log(`  ⚠️ ${i.level} | ${i.topic} | ${i.lesson} — ${i.message}`))
  }
  if (infos.length > 0) {
    console.log(`\n🔵 INFO (${infos.length}):`)
    infos.forEach(i => console.log(`  ℹ️  ${i.level} | ${i.topic} — ${i.message}`))
  }

  // Per-level stats
  console.log(`\n${'─'.repeat(60)}`)
  console.log('📊 PER-LEVEL STATS:')
  const levels = ['A1','A2','B1','B2','C1','C2']
  for (const lv of levels) {
    const lvLessons = all.filter(l => l.topic.cefrLevel === lv)
    const lvTopics = topics.filter(t => t.cefrLevel === lv)
    const lvIssues = issues.filter(i => i.level === lv)
    const avgTheory = lvLessons.filter(l => l.lessonType === 'E').map(l => {
      const t = l.theoryJson as any
      return Array.isArray(t?.blocks) ? t.blocks.length : 0
    })
    const avgEx = lvLessons.map(l => {
      const e = l.exercisesJson as any
      return Array.isArray(e) ? e.length : 0
    })
    const avgT = avgTheory.length > 0 ? (avgTheory.reduce((a,b)=>a+b,0)/avgTheory.length).toFixed(1) : '0'
    const avgE = avgEx.length > 0 ? (avgEx.reduce((a,b)=>a+b,0)/avgEx.length).toFixed(1) : '0'
    
    console.log(`  ${lv}: ${lvTopics.length} topics, ${lvLessons.length} lessons | avg theory(E):${avgT} | avg ex:${avgE} | issues:${lvIssues.length}`)
  }

  console.log(`\n${'═'.repeat(60)}`)
  const verdict = critical.length === 0 ? '✅ READY FOR LAUNCH' : '❌ NOT READY — fix critical issues first'
  console.log(`  VERDICT: ${verdict}`)
  console.log(`  Total: ${all.length} lessons | ${critical.length} critical | ${warnings.length} warnings | ${infos.length} info`)
  console.log(`${'═'.repeat(60)}\n`)

  await p.$disconnect()
}

main().catch(console.error)
