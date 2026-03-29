/**
 * audit-exam-content.ts — QA Audit for Exam Content
 *
 * Validates exam content against CEFR level-appropriate standards:
 * 1. Word count per passage (level-specific ranges)
 * 2. Grammar pattern check (Nebensätze, Perfekt, Konjunktiv II, etc.)
 * 3. Answer balance (R/F distribution, MC option spread)
 * 4. Scoring math (points × items = section total)
 * 5. Structural integrity
 *
 * Run: DATABASE_URL='...' npx tsx scripts/audit-exam-content.ts
 */
import { PrismaClient } from '../apps/web/generated/prisma'
const prisma = new PrismaClient()

/* ── CEFR level-specific parameters ── */
type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

interface LevelParams {
    lesenWordCount: { min: number; max: number }
    hoerenWordCount: { min: number; max: number }
    sentenceLength: { min: number; max: number }
    minGrammar: number   // minimum distinct grammar patterns expected
    minItems: number     // minimum TF items
}

const LEVEL_PARAMS: Record<CefrLevel, LevelParams> = {
    A1: { lesenWordCount: { min: 30, max: 250 }, hoerenWordCount: { min: 30, max: 300 }, sentenceLength: { min: 4, max: 12 }, minGrammar: 0, minItems: 3 },
    A2: { lesenWordCount: { min: 80, max: 350 }, hoerenWordCount: { min: 50, max: 400 }, sentenceLength: { min: 5, max: 16 }, minGrammar: 0, minItems: 4 },
    B1: { lesenWordCount: { min: 150, max: 400 }, hoerenWordCount: { min: 80, max: 500 }, sentenceLength: { min: 8, max: 20 }, minGrammar: 3, minItems: 5 },
    B2: { lesenWordCount: { min: 200, max: 600 }, hoerenWordCount: { min: 150, max: 600 }, sentenceLength: { min: 10, max: 28 }, minGrammar: 3, minItems: 5 },
    C1: { lesenWordCount: { min: 200, max: 800 }, hoerenWordCount: { min: 100, max: 700 }, sentenceLength: { min: 12, max: 35 }, minGrammar: 2, minItems: 3 },
    C2: { lesenWordCount: { min: 250, max: 1200 }, hoerenWordCount: { min: 150, max: 800 }, sentenceLength: { min: 12, max: 40 }, minGrammar: 2, minItems: 3 },
}

/* ── Grammar markers ── */
const GRAMMAR_MARKERS = [
    { name: 'Nebensatz (weil)', regex: /\bweil\b/gi },
    { name: 'Nebensatz (dass)', regex: /\bdass\b/gi },
    { name: 'Nebensatz (wenn)', regex: /\bwenn\b/gi },
    { name: 'Nebensatz (obwohl)', regex: /\bobwohl\b/gi },
    { name: 'Perfekt (hat/haben)', regex: /\b(hat|haben|habe|hast)\s+\w+(t|en)\b/gi },
    { name: 'Perfekt (ist/sind)', regex: /\b(ist|sind|bin|bist)\s+\w+(t|en)\b/gi },
    { name: 'Präteritum (war/hatte)', regex: /\b(war|hatte|konnte|wollte|musste|sollte|durfte)\b/gi },
    { name: 'Konjunktiv II (würde)', regex: /\bwürde\b/gi },
    { name: 'Konjunktiv II (hätte/wäre)', regex: /\b(hätte|wäre|könnte|möchte)\b/gi },
    { name: 'Passiv (wird/werden)', regex: /\b(wird|werden)\s+\w+(t|en)\b/gi },
]

interface AuditResult {
    taskTitle: string
    section: string
    checks: Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }>
}

function countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length
}

function auditPassage(text: string, isHoeren: boolean, level: CefrLevel): Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> {
    const checks: Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> = []
    const params = LEVEL_PARAMS[level]
    const wordCount = countWords(text)
    const limits = isHoeren ? params.hoerenWordCount : params.lesenWordCount

    // Word count
    if (wordCount >= limits.min && wordCount <= limits.max) {
        checks.push({ name: 'Word Count', status: '✅', detail: `${wordCount} words (${level}: ${limits.min}–${limits.max})` })
    } else if (wordCount < limits.min) {
        checks.push({ name: 'Word Count', status: '❌', detail: `${wordCount} words — TOO SHORT (${level} minimum: ${limits.min})` })
    } else {
        checks.push({ name: 'Word Count', status: '⚠️', detail: `${wordCount} words — over ${limits.max} max for ${level}` })
    }

    // Grammar diversity
    const grammarFound: string[] = []
    for (const g of GRAMMAR_MARKERS) {
        const matches = text.match(g.regex)
        if (matches && matches.length > 0) {
            grammarFound.push(`${g.name} (${matches.length}×)`)
        }
    }

    if (grammarFound.length >= params.minGrammar) {
        checks.push({ name: 'Grammar Diversity', status: '✅', detail: `${grammarFound.length} patterns found: ${grammarFound.join(', ') || 'n/a'}` })
    } else if (grammarFound.length >= 1) {
        checks.push({ name: 'Grammar Diversity', status: '⚠️', detail: `Only ${grammarFound.length} patterns (need ${params.minGrammar}+ for ${level}): ${grammarFound.join(', ')}` })
    } else if (params.minGrammar > 0) {
        checks.push({ name: 'Grammar Diversity', status: '❌', detail: `NO grammar patterns found — content may be below ${level}` })
    } else {
        checks.push({ name: 'Grammar Diversity', status: '✅', detail: `${grammarFound.length} patterns (${level} requires ${params.minGrammar}+)` })
    }

    // Sentence count & avg length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5)
    const avgSentenceLength = sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0
    if (avgSentenceLength >= params.sentenceLength.min && avgSentenceLength <= params.sentenceLength.max) {
        checks.push({ name: 'Avg Sentence Length', status: '✅', detail: `${avgSentenceLength} words/sentence (${level} target: ${params.sentenceLength.min}–${params.sentenceLength.max})` })
    } else if (avgSentenceLength < params.sentenceLength.min) {
        checks.push({ name: 'Avg Sentence Length', status: '⚠️', detail: `${avgSentenceLength} words/sentence — below ${level} minimum ${params.sentenceLength.min}` })
    } else {
        checks.push({ name: 'Avg Sentence Length', status: '⚠️', detail: `${avgSentenceLength} words/sentence — above ${level} max ${params.sentenceLength.max}` })
    }

    return checks
}

function auditTFItems(items: Array<{ id: string; correctAnswer: string }>, level: CefrLevel): Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> {
    const checks: Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> = []
    const richtigCount = items.filter(i => i.correctAnswer === 'RICHTIG').length
    const falschCount = items.filter(i => i.correctAnswer === 'FALSCH').length
    const total = items.length

    const ratio = Math.min(richtigCount, falschCount) / Math.max(richtigCount, falschCount)
    if (ratio >= 0.5) {
        checks.push({ name: 'R/F Balance', status: '✅', detail: `R:${richtigCount} / F:${falschCount} (balanced)` })
    } else if (ratio >= 0.3) {
        checks.push({ name: 'R/F Balance', status: '⚠️', detail: `R:${richtigCount} / F:${falschCount} (slightly unbalanced)` })
    } else {
        checks.push({ name: 'R/F Balance', status: '❌', detail: `R:${richtigCount} / F:${falschCount} — too unbalanced` })
    }

    const params = LEVEL_PARAMS[level]
    if (total >= params.minItems) {
        checks.push({ name: 'Item Count', status: '✅', detail: `${total} items` })
    } else {
        checks.push({ name: 'Item Count', status: '⚠️', detail: `Only ${total} items — ${level} typically has ${params.minItems}+` })
    }

    return checks
}

function auditMCItems(items: Array<{ id: string; options: Array<{ key: string }>; correctAnswer: string }>): Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> {
    const checks: Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> = []

    const optionCounts = items.map(i => i.options.length)
    const allSame = optionCounts.every(c => c === optionCounts[0])
    checks.push({
        name: 'Options Consistency',
        status: allSame ? '✅' : '⚠️',
        detail: allSame ? `All items have ${optionCounts[0]} options` : `Mixed option counts: ${[...new Set(optionCounts)].join(', ')}`
    })

    const answerDist: Record<string, number> = {}
    for (const item of items) {
        answerDist[item.correctAnswer] = (answerDist[item.correctAnswer] || 0) + 1
    }
    const distStr = Object.entries(answerDist).map(([k, v]) => `${k}:${v}`).join(' ')
    const maxCount = Math.max(...Object.values(answerDist))
    const isBalanced = maxCount <= Math.ceil(items.length * 0.6)
    checks.push({ name: 'Answer Distribution', status: isBalanced ? '✅' : '⚠️', detail: distStr })

    return checks
}

async function main() {
    console.log('🔍 Exam Content QA Audit (Level-Aware)\n')
    console.log('='.repeat(60))

    const exams = await prisma.examTemplate.findMany({
        include: {
            sections: { include: { tasks: true }, orderBy: { sortOrder: 'asc' } },
        },
        orderBy: [{ cefrLevel: 'asc' }],
    })

    let totalChecks = 0, passedChecks = 0, warnChecks = 0, failedChecks = 0

    for (const exam of exams) {
        const level = exam.cefrLevel as CefrLevel
        console.log(`\n📋 ${exam.title} (${level})`)
        console.log(`   ${exam.totalMinutes} min | ${exam.totalPoints} pts | Pass: ${exam.passingScore}%`)
        console.log('-'.repeat(60))

        let sectionPointsSum = 0
        for (const section of exam.sections) {
            const taskPointsSum = section.tasks.reduce((sum, t) => sum + t.maxPoints, 0)
            sectionPointsSum += section.totalPoints

            console.log(`\n  📂 ${section.title} (${section.skill}) — ${section.totalMinutes} min, ${section.totalPoints} pts`)

            if (taskPointsSum === section.totalPoints) {
                console.log(`     ✅ Scoring: Task points sum (${taskPointsSum}) = section total (${section.totalPoints})`)
                passedChecks++
            } else {
                console.log(`     ❌ Scoring: Task points sum (${taskPointsSum}) ≠ section total (${section.totalPoints})`)
                failedChecks++
            }
            totalChecks++

            for (const task of section.tasks) {
                const content = task.contentJson as Record<string, unknown>
                console.log(`\n     📝 ${task.title} (${task.exerciseType}, ${task.maxPoints} pts)`)

                const passage = (content.passage as string) || ''
                const audioTranscript = (content.audioTranscript as string) || ''
                const textToAudit = audioTranscript || passage
                const isHoeren = section.skill === 'HOEREN'

                if (textToAudit.length > 0) {
                    const passageChecks = auditPassage(textToAudit, isHoeren, level)
                    for (const c of passageChecks) {
                        console.log(`        ${c.status} ${c.name}: ${c.detail}`)
                        totalChecks++
                        if (c.status === '✅') passedChecks++
                        else if (c.status === '⚠️') warnChecks++
                        else failedChecks++
                    }
                }

                const items = (content.items as Array<Record<string, unknown>>) || []
                if (task.exerciseType === 'TRUE_FALSE' && items.length > 0) {
                    const tfChecks = auditTFItems(items as Array<{ id: string; correctAnswer: string }>, level)
                    for (const c of tfChecks) {
                        console.log(`        ${c.status} ${c.name}: ${c.detail}`)
                        totalChecks++
                        if (c.status === '✅') passedChecks++
                        else if (c.status === '⚠️') warnChecks++
                        else failedChecks++
                    }
                }

                if (task.exerciseType === 'MULTIPLE_CHOICE' && items.length > 0) {
                    const mcChecks = auditMCItems(items as Array<{ id: string; options: Array<{ key: string }>; correctAnswer: string }>)
                    for (const c of mcChecks) {
                        console.log(`        ${c.status} ${c.name}: ${c.detail}`)
                        totalChecks++
                        if (c.status === '✅') passedChecks++
                        else if (c.status === '⚠️') warnChecks++
                        else failedChecks++
                    }
                }

                if (items.length > 0) {
                    const ptsPerItem = task.maxPoints / items.length
                    const isWhole = Number.isInteger(ptsPerItem)
                    const status = isWhole ? '✅' as const : '⚠️' as const
                    console.log(`        ${status} Points/Item: ${ptsPerItem.toFixed(1)} (${task.maxPoints} pts / ${items.length} items)`)
                    totalChecks++
                    if (isWhole) passedChecks++; else warnChecks++
                }
            }
        }

        console.log('\n  ' + '-'.repeat(56))
        if (sectionPointsSum === exam.totalPoints) {
            console.log(`  ✅ Exam Total: Section sum (${sectionPointsSum}) = exam total (${exam.totalPoints})`)
            passedChecks++
        } else {
            console.log(`  ❌ Exam Total: Section sum (${sectionPointsSum}) ≠ exam total (${exam.totalPoints})`)
            failedChecks++
        }
        totalChecks++
    }

    console.log('\n' + '='.repeat(60))
    console.log('📊 AUDIT SUMMARY')
    console.log(`   Total Checks: ${totalChecks}`)
    console.log(`   ✅ Passed: ${passedChecks}`)
    console.log(`   ⚠️ Warnings: ${warnChecks}`)
    console.log(`   ❌ Failed: ${failedChecks}`)
    console.log(`   Score: ${((passedChecks / totalChecks) * 100).toFixed(0)}%`)

    if (failedChecks === 0 && warnChecks === 0) {
        console.log('\n🎉 All checks passed! Content meets CEFR standards.')
    } else if (failedChecks === 0) {
        console.log('\n⚠️ No critical failures, but some items need attention.')
    } else {
        console.log('\n❌ Critical issues found. Please revise content.')
    }
}

main().catch(console.error).finally(() => prisma.$disconnect())
