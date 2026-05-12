/**
 * QA Audit Script for Writing (Schreiben) Module
 * Checks data integrity, content quality, and completeness
 */
import { PrismaClient } from '../apps/web/generated/prisma'
import * as fs from 'fs'

const prisma = new PrismaClient()

interface AuditIssue {
  exerciseId: string
  severity: 'CRITICAL' | 'WARNING' | 'INFO'
  category: string
  detail: string
}

const issues: AuditIssue[] = []

function addIssue(exerciseId: string, severity: AuditIssue['severity'], category: string, detail: string) {
  issues.push({ exerciseId, severity, category, detail })
}

// Expected structure per level based on Goethe exam format
const EXPECTED_STRUCTURE: Record<string, { teils: number; minExercises: number }> = {
  A1: { teils: 2, minExercises: 30 },
  A2: { teils: 2, minExercises: 30 },
  B1: { teils: 3, minExercises: 30 },
  B2: { teils: 2, minExercises: 30 },
  C1: { teils: 2, minExercises: 30 },
  C2: { teils: 2, minExercises: 30 },
}

// Word count ranges per level (calibrated to Goethe exam specs)
const WORD_RANGES: Record<string, { minMin: number; maxMin: number; minMax: number; maxMax: number }> = {
  A1: { minMin: 10, maxMin: 40, minMax: 20, maxMax: 80 },
  A2: { minMin: 20, maxMin: 60, minMax: 40, maxMax: 120 },
  B1: { minMin: 60, maxMin: 120, minMax: 100, maxMax: 200 },
  B2: { minMin: 80, maxMin: 200, minMax: 120, maxMax: 350 },  // B2 T2 Nachricht = 150 is standard
  C1: { minMin: 150, maxMin: 300, minMax: 200, maxMax: 450 },
  C2: { minMin: 200, maxMin: 400, minMax: 250, maxMax: 650 },  // C2 T1 akademischer Text up to 600
}

async function main() {
  console.log('🔍 Starting Writing Module QA Audit...\n')

  const exercises = await prisma.writingExercise.findMany({
    orderBy: [{ cefrLevel: 'asc' }, { teil: 'asc' }, { sortOrder: 'asc' }]
  })

  console.log(`📦 Total exercises: ${exercises.length}\n`)

  // ==========================================
  // 1. STRUCTURAL CHECKS
  // ==========================================
  console.log('━━━ 1. STRUCTURAL CHECKS ━━━')

  // 1a. Level distribution
  const byLevel: Record<string, typeof exercises> = {}
  for (const ex of exercises) {
    if (!byLevel[ex.cefrLevel]) byLevel[ex.cefrLevel] = []
    byLevel[ex.cefrLevel].push(ex)
  }

  for (const [level, expected] of Object.entries(EXPECTED_STRUCTURE)) {
    const levelExs = byLevel[level] || []
    if (levelExs.length < expected.minExercises) {
      addIssue('GLOBAL', 'WARNING', 'DISTRIBUTION', `${level}: Only ${levelExs.length} exercises (expected >= ${expected.minExercises})`)
    }
    const teils = new Set(levelExs.map(e => e.teil))
    if (teils.size < expected.teils) {
      addIssue('GLOBAL', 'CRITICAL', 'DISTRIBUTION', `${level}: Only ${teils.size} Teils found (expected ${expected.teils})`)
    }
    console.log(`  ${level}: ${levelExs.length} exercises, ${teils.size} Teils`)
  }

  // 1b. ExerciseId format & uniqueness
  const idSet = new Set<string>()
  for (const ex of exercises) {
    if (idSet.has(ex.exerciseId)) {
      addIssue(ex.exerciseId, 'CRITICAL', 'DUPLICATE', `Duplicate exerciseId: ${ex.exerciseId}`)
    }
    idSet.add(ex.exerciseId)

    // Validate format: W-{LEVEL}-T{N}-{NNN}
    const idRegex = /^W-[A-C][12]-T\d+-\d{3}$/
    if (!idRegex.test(ex.exerciseId)) {
      addIssue(ex.exerciseId, 'WARNING', 'FORMAT', `Non-standard exerciseId format: ${ex.exerciseId}`)
    }
  }

  // 1c. SortOrder gaps
  for (const [level, levelExs] of Object.entries(byLevel)) {
    const byTeil: Record<number, typeof exercises> = {}
    for (const ex of levelExs) {
      if (!byTeil[ex.teil]) byTeil[ex.teil] = []
      byTeil[ex.teil].push(ex)
    }
    for (const [teil, teilExs] of Object.entries(byTeil)) {
      const orders = teilExs.map(e => e.sortOrder).sort((a, b) => a - b)
      for (let i = 0; i < orders.length - 1; i++) {
        if (orders[i] === orders[i + 1]) {
          addIssue('GLOBAL', 'WARNING', 'SORT_ORDER', `${level}-T${teil}: Duplicate sortOrder ${orders[i]}`)
        }
      }
    }
  }

  // ==========================================
  // 2. CONTENT COMPLETENESS CHECKS
  // ==========================================
  console.log('\n━━━ 2. CONTENT COMPLETENESS CHECKS ━━━')

  let missingInstruction = 0, missingSituation = 0, missingContentPts = 0, missingSample = 0
  let missingRubric = 0, missingFormFields = 0, missingSourceText = 0

  for (const ex of exercises) {
    // 2a. Core fields
    if (!ex.instruction || ex.instruction.trim().length < 10) {
      addIssue(ex.exerciseId, 'CRITICAL', 'CONTENT', 'Missing or too short instruction')
      missingInstruction++
    }

    if (!ex.situation || ex.situation.trim().length < 10) {
      addIssue(ex.exerciseId, 'CRITICAL', 'CONTENT', 'Missing or too short situation')
      missingSituation++
    }

    // 2b. Content Points
    if (!ex.contentPoints || !Array.isArray(ex.contentPoints) || ex.contentPoints.length === 0) {
      addIssue(ex.exerciseId, 'CRITICAL', 'CONTENT', 'Missing contentPoints')
      missingContentPts++
    } else {
      const pts = ex.contentPoints as string[]
      if (pts.length < 2) {
        addIssue(ex.exerciseId, 'WARNING', 'CONTENT', `Only ${pts.length} content point(s) — too few`)
      }
      for (const pt of pts) {
        if (typeof pt !== 'string' || pt.trim().length < 3) {
          addIssue(ex.exerciseId, 'WARNING', 'CONTENT', `Empty or too-short content point`)
          break
        }
      }
    }

    // 2c. Rubric
    if (!ex.rubricJson) {
      addIssue(ex.exerciseId, 'CRITICAL', 'RUBRIC', 'Missing rubricJson')
      missingRubric++
    } else {
      const rubric = ex.rubricJson as any
      if (!rubric.criteria || !Array.isArray(rubric.criteria) || rubric.criteria.length === 0) {
        addIssue(ex.exerciseId, 'CRITICAL', 'RUBRIC', 'rubricJson has no criteria array')
      } else {
        for (const c of rubric.criteria) {
          if (!c.id || !c.name) {
            addIssue(ex.exerciseId, 'WARNING', 'RUBRIC', `Rubric criterion missing id or name`)
          }
          if (typeof c.maxScore !== 'number' || c.maxScore < 1) {
            addIssue(ex.exerciseId, 'WARNING', 'RUBRIC', `Rubric criterion "${c.id}" has invalid maxScore`)
          }
          if (typeof c.weight !== 'number' || c.weight <= 0) {
            addIssue(ex.exerciseId, 'WARNING', 'RUBRIC', `Rubric criterion "${c.id}" has invalid weight`)
          }
        }
        // Check maxScore consistency
        const rubricMax = rubric.maxScore || rubric.criteria.reduce((s: number, c: any) => s + (c.maxScore || 0), 0)
        if (rubricMax !== ex.maxScore) {
          addIssue(ex.exerciseId, 'WARNING', 'RUBRIC', `maxScore mismatch: exercise=${ex.maxScore} rubric=${rubricMax}`)
        }
      }
    }

    // 2d. Sample Response
    if (!ex.sampleResponse) {
      missingSample++
    }

    // 2e. Form fields (for Formular type)
    if (ex.textType === 'Formular') {
      if (!ex.formFields || !Array.isArray(ex.formFields) || (ex.formFields as any[]).length === 0) {
        addIssue(ex.exerciseId, 'CRITICAL', 'FORM', 'Formular type but missing formFields')
        missingFormFields++
      } else {
        for (const field of ex.formFields as any[]) {
          if (!field.label || !field.type) {
            addIssue(ex.exerciseId, 'WARNING', 'FORM', 'Form field missing label or type')
          }
        }
      }
    }

    // 2f. Source text (for Textumwandlung teil)
    if (ex.teilName.includes('Textumwandlung') || ex.teilName.includes('Umwandlung')) {
      if (!ex.sourceText || ex.sourceText.trim().length < 50) {
        addIssue(ex.exerciseId, 'CRITICAL', 'SOURCE_TEXT', 'Textumwandlung type but missing/short sourceText')
        missingSourceText++
      }
    }

    // 2g. Grafik (for Argumentation type at C1)
    if (ex.textType === 'Argumentation' && ex.cefrLevel === 'C1') {
      if (!ex.grafikDesc && !ex.grafikUrl) {
        addIssue(ex.exerciseId, 'WARNING', 'GRAFIK', 'C1 Argumentation type but no grafikDesc or grafikUrl')
      }
    }
  }

  console.log(`  Missing instruction: ${missingInstruction}`)
  console.log(`  Missing situation: ${missingSituation}`)
  console.log(`  Missing contentPoints: ${missingContentPts}`)
  console.log(`  Missing sample response: ${missingSample}/${exercises.length}`)
  console.log(`  Missing rubric: ${missingRubric}`)
  console.log(`  Missing formFields (Formular): ${missingFormFields}`)
  console.log(`  Missing sourceText (Umwandlung): ${missingSourceText}`)

  // ==========================================
  // 3. WORD COUNT VALIDATION
  // ==========================================
  console.log('\n━━━ 3. WORD COUNT VALIDATION ━━━')

  for (const ex of exercises) {
    const range = WORD_RANGES[ex.cefrLevel]
    if (!range) continue

    if (ex.minWords < range.minMin || ex.minWords > range.maxMin) {
      addIssue(ex.exerciseId, 'WARNING', 'WORD_COUNT', `minWords=${ex.minWords} outside expected range [${range.minMin}-${range.maxMin}] for ${ex.cefrLevel}`)
    }
    if (ex.maxWords && (ex.maxWords < range.minMax || ex.maxWords > range.maxMax)) {
      addIssue(ex.exerciseId, 'WARNING', 'WORD_COUNT', `maxWords=${ex.maxWords} outside expected range [${range.minMax}-${range.maxMax}] for ${ex.cefrLevel}`)
    }
    if (ex.maxWords && ex.minWords >= ex.maxWords) {
      addIssue(ex.exerciseId, 'CRITICAL', 'WORD_COUNT', `minWords (${ex.minWords}) >= maxWords (${ex.maxWords})`)
    }
  }
  console.log('  ✔ Word count ranges validated')

  // ==========================================
  // 4. TEXT QUALITY CHECKS
  // ==========================================
  console.log('\n━━━ 4. TEXT QUALITY CHECKS ━━━')

  for (const ex of exercises) {
    // 4a. Instruction quality
    if (ex.instruction) {
      if (ex.instruction.length < 20) {
        addIssue(ex.exerciseId, 'WARNING', 'QUALITY', `Instruction very short (${ex.instruction.length} chars)`)
      }
      // Check for Umlauts encoded as ae/oe/ue (check all text fields)
      const allText = [ex.instruction, ex.situation, ex.teilName, ex.topic].join(' ')
      if (/(?:ue|ae|oe)(?:ll|ss|nd|ng|ch|rn|ck|ff|tt|nn|mm|pp|rr|nk|nz|tz)/i.test(allText) && !/[äöüÄÖÜ]/.test(allText)) {
        addIssue(ex.exerciseId, 'INFO', 'ENCODING', 'Text fields use ae/oe/ue instead of Umlauts')
      }
    }

    // 4b. Situation quality
    if (ex.situation) {
      if (ex.situation.length < 20) {
        addIssue(ex.exerciseId, 'WARNING', 'QUALITY', `Situation very short (${ex.situation.length} chars)`)
      }
    }

    // 4c. Source text quality (for Textumwandlung)
    // A1/A2 stimuli are intentionally short (SMS, notes)
    // B1 T3 Formeller Brief uses reference docs (receipts, confirmations) — also short by design
    if (ex.sourceText && ex.sourceText.trim().length > 0) {
      const wordCount = ex.sourceText.split(/\s+/).length
      const isShortByDesign = ['A1', 'A2'].includes(ex.cefrLevel) ||
        (ex.cefrLevel === 'B1' && ex.textType === 'Formeller Brief')
      const minSourceWords = isShortByDesign ? 10 : 30
      if (wordCount < minSourceWords) {
        addIssue(ex.exerciseId, 'WARNING', 'QUALITY', `sourceText very short (${wordCount} words, min ${minSourceWords} for ${ex.cefrLevel})`)
      }
    }

    // 4d. Topic uniqueness within level+teil
    // (will check below)

    // 4e. Register consistency
    const validRegisters = ['formell', 'informell', 'halbformell', 'neutral', 'sachlich', 'akademisch', 'variiert']
    if (!validRegisters.includes(ex.register)) {
      addIssue(ex.exerciseId, 'WARNING', 'REGISTER', `Unknown register: "${ex.register}"`)
    }

    // 4f. Status check
    if (ex.status !== 'PUBLISHED') {
      addIssue(ex.exerciseId, 'WARNING', 'STATUS', `Exercise not PUBLISHED (status=${ex.status})`)
    }
  }

  // 4d. Topic uniqueness
  for (const [level, levelExs] of Object.entries(byLevel)) {
    const byTeil: Record<number, string[]> = {}
    for (const ex of levelExs) {
      if (!byTeil[ex.teil]) byTeil[ex.teil] = []
      byTeil[ex.teil].push(ex.topic)
    }
    for (const [teil, topics] of Object.entries(byTeil)) {
      const dupes = topics.filter((t, i) => topics.indexOf(t) !== i)
      if (dupes.length > 0) {
        addIssue('GLOBAL', 'INFO', 'TOPIC_DUPE', `${level}-T${teil}: Duplicate topic(s): ${[...new Set(dupes)].join(', ')}`)
      }
    }
  }

  // ==========================================
  // 5. TEIL NAME CONSISTENCY
  // ==========================================
  console.log('\n━━━ 5. TEIL NAME CONSISTENCY ━━━')

  for (const [level, levelExs] of Object.entries(byLevel)) {
    const teilNames: Record<number, Set<string>> = {}
    for (const ex of levelExs) {
      if (!teilNames[ex.teil]) teilNames[ex.teil] = new Set()
      teilNames[ex.teil].add(ex.teilName)
    }
    for (const [teil, names] of Object.entries(teilNames)) {
      if (names.size > 1) {
        addIssue('GLOBAL', 'WARNING', 'TEIL_NAME', `${level}-T${teil}: Inconsistent teilName(s): ${[...names].join(' / ')}`)
      }
    }
  }
  console.log('  ✔ Teil names checked')

  // ==========================================
  // 6. TIME MINUTES VALIDATION
  // ==========================================
  console.log('\n━━━ 6. TIME VALIDATION ━━━')

  for (const ex of exercises) {
    if (ex.timeMinutes < 3 || ex.timeMinutes > 90) {
      addIssue(ex.exerciseId, 'WARNING', 'TIME', `timeMinutes=${ex.timeMinutes} outside reasonable range [3-90]`)
    }
  }
  console.log('  ✔ Time limits validated')

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
    for (const i of criticals) {
      console.log(`  [${i.exerciseId}] ${i.category}: ${i.detail}`)
    }
  }

  if (warnings.length > 0) {
    console.log('\n⚠️  WARNINGS:')
    // Group by category
    const warnCats: Record<string, AuditIssue[]> = {}
    for (const i of warnings) {
      if (!warnCats[i.category]) warnCats[i.category] = []
      warnCats[i.category].push(i)
    }
    for (const [cat, items] of Object.entries(warnCats)) {
      console.log(`  ${cat} (${items.length}):`)
      for (const i of items.slice(0, 5)) {
        console.log(`    [${i.exerciseId}] ${i.detail}`)
      }
      if (items.length > 5) console.log(`    ... and ${items.length - 5} more`)
    }
  }

  if (infos.length > 0) {
    console.log('\nℹ️  INFO:')
    for (const i of infos.slice(0, 10)) {
      console.log(`  [${i.exerciseId}] ${i.category}: ${i.detail}`)
    }
    if (infos.length > 10) console.log(`  ... and ${infos.length - 10} more`)
  }

  // Save full report
  const reportPath = 'apps/web/public/audit-writing.json'
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    total_exercises: exercises.length,
    summary: { critical: criticals.length, warning: warnings.length, info: infos.length },
    issues
  }, null, 2))
  console.log(`\n💾 Full report: ${reportPath}`)

  if (criticals.length === 0) {
    console.log(`\n✅ PASSED — Writing Module looks great! (${warnings.length} warnings, ${infos.length} info)`)
  } else {
    console.log(`\n❌ FAILED — ${criticals.length} critical issues need fixing`)
    process.exit(1)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
