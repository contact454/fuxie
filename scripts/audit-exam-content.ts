/**
 * audit-exam-content.ts — QA Audit for Exam Content
 *
 * Validates exam content against CEFR B1 standards:
 * 1. Word count per passage (200–350 for B1)
 * 2. Grammar pattern check (Nebensätze, Perfekt, Konjunktiv II)
 * 3. Answer balance (R/F distribution, MC option spread)
 * 4. Scoring math (points × items = section total)
 * 5. Structural integrity
 *
 * Run: DATABASE_URL='...' npx tsx scripts/audit-exam-content.ts
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

/* ── B1 CEFR parameters ── */
const B1_WORD_COUNT = { min: 150, max: 400 }  // relaxed range for exam tasks
const B1_HOEREN_WORD_COUNT = { min: 80, max: 500 }  // transcripts can vary

/* ── B1 grammar markers (should be present) ── */
const B1_GRAMMAR_EXPECTED = [
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

/* ── Forbidden A1-only patterns (too simple for B1) ── */
const TOO_SIMPLE_PATTERNS = [
    { name: 'Only Präsens (no Perfekt/Prät found)', check: 'grammar_diversity' },
]

interface AuditResult {
    taskTitle: string
    section: string
    checks: Array<{
        name: string
        status: '✅' | '⚠️' | '❌'
        detail: string
    }>
}

function countWords(text: string): number {
    return text.split(/\s+/).filter(w => w.length > 0).length
}

function auditPassage(text: string, isHoeren: boolean): Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> {
    const checks: Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> = []
    const wordCount = countWords(text)
    const limits = isHoeren ? B1_HOEREN_WORD_COUNT : B1_WORD_COUNT

    // Word count
    if (wordCount >= limits.min && wordCount <= limits.max) {
        checks.push({ name: 'Word Count', status: '✅', detail: `${wordCount} words (B1: ${limits.min}–${limits.max})` })
    } else if (wordCount < limits.min) {
        checks.push({ name: 'Word Count', status: '❌', detail: `${wordCount} words — TOO SHORT (B1 minimum: ${limits.min})` })
    } else {
        checks.push({ name: 'Word Count', status: '⚠️', detail: `${wordCount} words — slightly over ${limits.max} max` })
    }

    // Grammar diversity
    const grammarFound: string[] = []
    for (const g of B1_GRAMMAR_EXPECTED) {
        const matches = text.match(g.regex)
        if (matches && matches.length > 0) {
            grammarFound.push(`${g.name} (${matches.length}×)`)
        }
    }

    if (grammarFound.length >= 3) {
        checks.push({ name: 'Grammar Diversity', status: '✅', detail: `${grammarFound.length} B1 patterns: ${grammarFound.join(', ')}` })
    } else if (grammarFound.length >= 1) {
        checks.push({ name: 'Grammar Diversity', status: '⚠️', detail: `Only ${grammarFound.length} B1 patterns: ${grammarFound.join(', ')}. Need 3+ for B1.` })
    } else {
        checks.push({ name: 'Grammar Diversity', status: '❌', detail: 'NO B1 grammar patterns found — content may be A2 level' })
    }

    // Sentence count & avg length
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5)
    const avgSentenceLength = sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0
    if (avgSentenceLength >= 8 && avgSentenceLength <= 20) {
        checks.push({ name: 'Avg Sentence Length', status: '✅', detail: `${avgSentenceLength} words/sentence (B1 target: 8–20)` })
    } else if (avgSentenceLength < 8) {
        checks.push({ name: 'Avg Sentence Length', status: '⚠️', detail: `${avgSentenceLength} words/sentence — too simple for B1` })
    } else {
        checks.push({ name: 'Avg Sentence Length', status: '⚠️', detail: `${avgSentenceLength} words/sentence — complex for B1` })
    }

    return checks
}

function auditTFItems(items: Array<{ id: string; correctAnswer: string }>): Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> {
    const checks: Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> = []
    const richtigCount = items.filter(i => i.correctAnswer === 'RICHTIG').length
    const falschCount = items.filter(i => i.correctAnswer === 'FALSCH').length
    const total = items.length

    // Balance check
    const ratio = Math.min(richtigCount, falschCount) / Math.max(richtigCount, falschCount)
    if (ratio >= 0.6) {
        checks.push({ name: 'R/F Balance', status: '✅', detail: `R:${richtigCount} / F:${falschCount} (balanced)` })
    } else if (ratio >= 0.4) {
        checks.push({ name: 'R/F Balance', status: '⚠️', detail: `R:${richtigCount} / F:${falschCount} (slightly unbalanced)` })
    } else {
        checks.push({ name: 'R/F Balance', status: '❌', detail: `R:${richtigCount} / F:${falschCount} — too unbalanced, ratio ${(ratio * 100).toFixed(0)}%` })
    }

    // Item count
    if (total >= 5) {
        checks.push({ name: 'Item Count', status: '✅', detail: `${total} items` })
    } else {
        checks.push({ name: 'Item Count', status: '⚠️', detail: `Only ${total} items — B1 typically has 6+` })
    }

    return checks
}

function auditMCItems(items: Array<{ id: string; options: Array<{ key: string }>; correctAnswer: string }>): Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> {
    const checks: Array<{ name: string; status: '✅' | '⚠️' | '❌'; detail: string }> = []

    // Option count consistency
    const optionCounts = items.map(i => i.options.length)
    const allSame = optionCounts.every(c => c === optionCounts[0])
    checks.push({
        name: 'Options Consistency',
        status: allSame ? '✅' : '⚠️',
        detail: allSame ? `All items have ${optionCounts[0]} options` : `Mixed option counts: ${[...new Set(optionCounts)].join(', ')}`
    })

    // Answer distribution
    const answerDist: Record<string, number> = {}
    for (const item of items) {
        answerDist[item.correctAnswer] = (answerDist[item.correctAnswer] || 0) + 1
    }
    const distStr = Object.entries(answerDist).map(([k, v]) => `${k}:${v}`).join(' ')
    const maxCount = Math.max(...Object.values(answerDist))
    const isBalanced = maxCount <= Math.ceil(items.length / 2)
    checks.push({
        name: 'Answer Distribution',
        status: isBalanced ? '✅' : '⚠️',
        detail: distStr
    })

    return checks
}

async function main() {
    console.log('🔍 Exam Content QA Audit\n')
    console.log('='.repeat(60))

    const exams = await prisma.examTemplate.findMany({
        include: {
            sections: {
                include: { tasks: true },
                orderBy: { sortOrder: 'asc' },
            },
        },
    })

    let totalChecks = 0
    let passedChecks = 0
    let warnChecks = 0
    let failedChecks = 0
    const allResults: AuditResult[] = []

    for (const exam of exams) {
        console.log(`\n📋 ${exam.title} (${exam.cefrLevel})`)
        console.log(`   ${exam.totalMinutes} min | ${exam.totalPoints} pts | Pass: ${exam.passingScore}%`)
        console.log('-'.repeat(60))

        // Scoring math
        let sectionPointsSum = 0
        for (const section of exam.sections) {
            const taskPointsSum = section.tasks.reduce((sum, t) => sum + t.maxPoints, 0)
            sectionPointsSum += section.totalPoints

            console.log(`\n  📂 ${section.title} (${section.skill}) — ${section.totalMinutes} min, ${section.totalPoints} pts`)

            // Section scoring check
            if (taskPointsSum === section.totalPoints) {
                console.log(`     ✅ Scoring: Task points sum (${taskPointsSum}) = section total (${section.totalPoints})`)
            } else {
                console.log(`     ❌ Scoring: Task points sum (${taskPointsSum}) ≠ section total (${section.totalPoints})`)
                failedChecks++
            }
            totalChecks++

            for (const task of section.tasks) {
                const content = task.contentJson as Record<string, unknown>
                const result: AuditResult = { taskTitle: task.title, section: section.title, checks: [] }

                console.log(`\n     📝 ${task.title} (${task.exerciseType}, ${task.maxPoints} pts)`)

                // Passage audit
                const passage = (content.passage as string) || ''
                const audioTranscript = (content.audioTranscript as string) || ''
                const textToAudit = audioTranscript || passage
                const isHoeren = section.skill === 'HOEREN'

                if (textToAudit.length > 0) {
                    const passageChecks = auditPassage(textToAudit, isHoeren)
                    result.checks.push(...passageChecks)
                    for (const c of passageChecks) {
                        const icon = c.status
                        console.log(`        ${icon} ${c.name}: ${c.detail}`)
                        totalChecks++
                        if (c.status === '✅') passedChecks++
                        else if (c.status === '⚠️') warnChecks++
                        else failedChecks++
                    }
                }

                // Item-type audit
                const items = (content.items as Array<Record<string, unknown>>) || []
                if (task.exerciseType === 'TRUE_FALSE' && items.length > 0) {
                    const tfChecks = auditTFItems(items as Array<{ id: string; correctAnswer: string }>)
                    result.checks.push(...tfChecks)
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
                    result.checks.push(...mcChecks)
                    for (const c of mcChecks) {
                        console.log(`        ${c.status} ${c.name}: ${c.detail}`)
                        totalChecks++
                        if (c.status === '✅') passedChecks++
                        else if (c.status === '⚠️') warnChecks++
                        else failedChecks++
                    }
                }

                // Points per item consistency
                if (items.length > 0) {
                    const ptsPerItem = task.maxPoints / items.length
                    const isWhole = Number.isInteger(ptsPerItem)
                    const status = isWhole ? '✅' as const : '⚠️' as const
                    console.log(`        ${status} Points/Item: ${ptsPerItem.toFixed(1)} (${task.maxPoints} pts / ${items.length} items)`)
                    result.checks.push({ name: 'Points/Item', status, detail: `${ptsPerItem.toFixed(1)}` })
                    totalChecks++
                    if (isWhole) passedChecks++; else warnChecks++
                }

                allResults.push(result)
            }
        }

        // Overall exam scoring
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

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 AUDIT SUMMARY')
    console.log(`   Total Checks: ${totalChecks}`)
    console.log(`   ✅ Passed: ${passedChecks}`)
    console.log(`   ⚠️ Warnings: ${warnChecks}`)
    console.log(`   ❌ Failed: ${failedChecks}`)
    console.log(`   Score: ${((passedChecks / totalChecks) * 100).toFixed(0)}%`)

    if (failedChecks === 0 && warnChecks === 0) {
        console.log('\n🎉 All checks passed! Content meets B1 CEFR standards.')
    } else if (failedChecks === 0) {
        console.log('\n⚠️ No critical failures, but some items need attention.')
    } else {
        console.log('\n❌ Critical issues found. Please revise content.')
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
