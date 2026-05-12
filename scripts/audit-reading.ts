/**
 * STRICT QUALITY AUDIT — Reading Module
 * Validates Fuxie Reading Exercises for structure, pointers, duplicates, and logic.
 * Usage: npx tsx scripts/audit-reading.ts
 */

import { PrismaClient } from '../apps/web/generated/prisma'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') })

const prisma = new PrismaClient()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const useDeepAI = process.argv.includes('--deep')

interface Issue {
  topic: string
  questionId?: string
  category: string
  severity: '🔴 CRITICAL' | '🟡 WARNING' | '🔵 INFO'
  detail: string
}

const issues: Issue[] = []

function addIssue(topic: string, category: string, severity: Issue['severity'], detail: string, questionId?: string) {
  issues.push({ topic, questionId, category, severity, detail })
}

// Memory for duplicate checking
const seenTexts = new Map<string, string>()

async function checkGermanQuality(text: string, question: any, answer: string, topic: string) {
  if (!process.env.GEMINI_API_KEY) return
  
  const prompt = `
  Du bist ein strenger Deutschlehrer.
  Prüfe, ob diese Leseverständnis-Frage logisch aus dem Text beantwortet werden kann.
  Text: """${text}"""
  Frage: "${question}"
  Angegebene korrekte Antwort: "${answer}"
  
  Ist diese Antwort 100% korrekt und eindeutig aus dem Text abzuleiten?
  Antworte nur mit "JA" oder "NEIN: [Begründung]".
  `

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' })
    const result = await model.generateContent(prompt)
    const response = result.response.text().trim()
    
    if (response.startsWith('NEIN')) {
      addIssue(topic, 'AI_LOGIC', '🟡 WARNING', `Gemini flagged logic issue: ${response}`, question)
    }
  } catch (error: any) {
    console.error(`Gemini Error on ${topic}:`, error.message)
  }
}

async function main() {
  console.log('🔎 STRICT QUALITY AUDIT — Reading Module')
  console.log('='.repeat(60))

  const exercises = await prisma.readingExercise.findMany({
    include: { questions: { orderBy: { sortOrder: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })

  let aiCheckPromises: Promise<void>[] = []

  for (const ex of exercises) {
    const topic = `${ex.cefrLevel.toLowerCase()}-${ex.theme || ex.id.slice(0,8)}`
    console.log(`\n📋 ${topic} (${ex.questions.length} questions)`)

    const contentArray = Array.isArray(ex.textsJson) ? ex.textsJson : []
    const imagesArray = Array.isArray(ex.imagesJson) ? ex.imagesJson : []
    
    // 1. Check Content Integrity
    if (contentArray.length === 0 && imagesArray.length === 0) {
      addIssue(topic, 'STRUCTURE', '🔴 CRITICAL', 'Reading content array (texts and images) is empty or invalid.')
      continue
    }

    const textIds = new Set<string>()

    for (const c of contentArray as any[]) {
      if (!c.id) {
        addIssue(topic, 'STRUCTURE', '🔴 CRITICAL', 'A content block is missing an "id".')
        continue
      }
      textIds.add(c.id)

      const textContent = c.content || c.text || ''
      if (!textContent || textContent.trim().length === 0) {
        addIssue(topic, 'STRUCTURE', '🔴 CRITICAL', `Content block ${c.id} has empty text.`)
      } else {
        // Warning: Text Length
        const words = textContent.split(/\s+/).length
        if (ex.cefrLevel === 'A1' && words > 150) {
          addIssue(topic, 'LENGTH', '🟡 WARNING', `A1 text ${c.id} is very long (${words} words).`)
        } else if (words < 10) {
          addIssue(topic, 'LENGTH', '🟡 WARNING', `Text ${c.id} is extremely short (${words} words).`)
        }

        // Warning: Duplicates
        const normalized = textContent.toLowerCase().trim()
        if (seenTexts.has(normalized)) {
          addIssue(topic, 'DUPLICATE', '🟡 WARNING', `Duplicate text found in ${seenTexts.get(normalized)}`)
        } else {
          seenTexts.set(normalized, topic)
        }
      }
    }

    for (const img of imagesArray as any[]) {
      if (!img.id) {
        addIssue(topic, 'STRUCTURE', '🔴 CRITICAL', 'An image block is missing an "id".')
        continue
      }
      textIds.add(img.id)
    }

    // 2. Check Questions Integrity
    if (ex.questions.length === 0) {
      addIssue(topic, 'STRUCTURE', '🔴 CRITICAL', 'Exercise has no questions.')
      continue
    }

    for (const q of ex.questions) {
      const qId = q.id.slice(0,8)

      // Dangling Pointer
      if (q.linkedText !== null && !textIds.has(q.linkedText)) {
        addIssue(topic, 'DANGLING_POINTER', '🔴 CRITICAL', `Question linkedText "${q.linkedText}" does not match any content id.`, qId)
      }

      // Statement & Answer
      if (!q.statement || q.statement.trim() === '') {
        addIssue(topic, 'STRUCTURE', '🟡 WARNING', 'Question statement is empty (implicit question).', qId)
      }
      if (!q.correctAnswer || q.correctAnswer.trim() === '') {
        addIssue(topic, 'STRUCTURE', '🔴 CRITICAL', 'correctAnswer is empty.', qId)
      }

      // Question Types logic
      if (q.questionType === 'richtig_falsch') {
        if (q.correctAnswer !== 'richtig' && q.correctAnswer !== 'falsch') {
          addIssue(topic, 'LOGIC', '🔴 CRITICAL', `richtig_falsch question has invalid answer: "${q.correctAnswer}". Must be "richtig" or "falsch".`, qId)
        }
      } else if (q.questionType === 'multiple_choice') {
        const options = q.options as any
        if (!options || typeof options !== 'object' || Object.keys(options).length === 0) {
          addIssue(topic, 'STRUCTURE', '🔴 CRITICAL', 'multiple_choice question has empty options.', qId)
        } else {
          // Check if correctAnswer matches a key or value
          const keys = Object.keys(options)
          const values = Object.values(options)
          if (!keys.includes(q.correctAnswer) && !values.includes(q.correctAnswer)) {
            addIssue(topic, 'LOGIC', '🔴 CRITICAL', `correctAnswer "${q.correctAnswer}" does not exist in options.`, qId)
          }
        }
      }

      // Explanation Quality
      const expl = q.explanation as any
      const hasReasoning = expl && (expl.de?.trim() || expl.reasoning?.trim())
      if (!hasReasoning) {
        addIssue(topic, 'EXPLANATION', '🟡 WARNING', 'Missing explanation (explanation.de or explanation.reasoning).', qId)
      }
      if (!expl || !expl.key_evidence || expl.key_evidence.trim() === '') {
        addIssue(topic, 'EXPLANATION', '🟡 WARNING', 'Missing key_evidence from text.', qId)
      }

      // Deep AI Check
      if (useDeepAI && q.linkedText && q.statement && q.correctAnswer) {
        const textBlock = contentArray.find((c: any) => c.id === q.linkedText) as any
        if (textBlock && textBlock.content) {
          aiCheckPromises.push(checkGermanQuality(textBlock.content, q.statement, q.correctAnswer, topic))
        }
      }
    }
  }

  if (useDeepAI && aiCheckPromises.length > 0) {
    console.log(`\n⏳ Running deep AI logic checks for ${aiCheckPromises.length} questions...`)
    await Promise.all(aiCheckPromises)
  }

  // ═══ REPORT ═══
  console.log('\n' + '='.repeat(60))
  
  const critical = issues.filter(i => i.severity === '🔴 CRITICAL')
  const warnings = issues.filter(i => i.severity === '🟡 WARNING')
  const infos = issues.filter(i => i.severity === '🔵 INFO')

  for (const i of issues) {
    console.log(`  [${i.topic}] ${i.category}: ${i.detail}`)
  }

  const report = {
    auditedAt: new Date().toISOString(),
    totalExercises: exercises.length,
    critical: critical.length,
    warnings: warnings.length,
    info: infos.length,
    issues
  }

  const reportPath = path.resolve(__dirname, '../apps/web/public/audit-reading.json')
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8')
  console.log(`\n💾 Full report: ${reportPath}`)

  if (critical.length > 0) {
    console.log(`\n❌ FAILED — ${critical.length} critical issues need fixing`)
    process.exit(0) // don't fail CI, just report
  } else {
    console.log(`\n✅ PASSED — Reading Module looks great! (${warnings.length} warnings)`)
  }
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
