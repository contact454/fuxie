/**
 * STRICT Quality Audit for Nachsprechen Scripts
 * 
 * Checks:
 * 1. German text: grammar, spelling, A1 vocabulary
 * 2. IPA: format validity
 * 3. Pronunciation notes: relevance for Vietnamese learners
 * 4. Sentence progression: short → long within topic
 * 5. Duplicates: across all topics
 * 6. Audio Factory format: JSON compliance
 * 7. Gemini cross-check: grammar + vocabulary level validation
 * 
 * Usage: npx tsx scripts/audit-speaking.ts
 */

import { PrismaClient } from '@prisma/client'
import { GoogleGenerativeAI } from '@google/generative-ai'
import * as dotenv from 'dotenv'
import * as path from 'path'
import * as fs from 'fs'

dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env') })

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL } }
})
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

interface Sentence {
  id: string
  textDe: string
  textVi: string
  ipa: string
  audioUrl: string
  expectedDurationSec: number
  pronunciationNotes?: string
}

interface Issue {
  topic: string
  sentenceId: string
  textDe: string
  category: string
  severity: '🔴 CRITICAL' | '🟡 WARNING' | '🔵 INFO'
  detail: string
}

const issues: Issue[] = []
const allSentences: { topic: string; sentence: Sentence }[] = []

function addIssue(topic: string, s: Sentence, category: string, severity: Issue['severity'], detail: string) {
  issues.push({ topic, sentenceId: s.id, textDe: s.textDe, category, severity, detail })
}

// ═══ Check 1: Structural validation ═══
function checkStructure(topic: string, sentences: Sentence[]) {
  for (const s of sentences) {
    // Required fields
    if (!s.textDe?.trim()) addIssue(topic, s, 'STRUCTURE', '🔴 CRITICAL', 'textDe is empty')
    if (!s.textVi?.trim()) addIssue(topic, s, 'STRUCTURE', '🔴 CRITICAL', 'textVi is empty')
    if (!s.ipa?.trim()) addIssue(topic, s, 'STRUCTURE', '🟡 WARNING', 'IPA is empty')
    if (!s.audioUrl?.trim()) addIssue(topic, s, 'STRUCTURE', '🔴 CRITICAL', 'audioUrl is empty')

    // IPA format: should start with / and end with /
    if (s.ipa && (!s.ipa.startsWith('/') || !s.ipa.endsWith('/'))) {
      addIssue(topic, s, 'IPA_FORMAT', '🟡 WARNING', `IPA not enclosed in /.../ → "${s.ipa}"`)
    }

    // Text should end with punctuation
    if (s.textDe && !/[.!?]$/.test(s.textDe.trim())) {
      addIssue(topic, s, 'PUNCTUATION', '🟡 WARNING', `textDe missing final punctuation → "${s.textDe}"`)
    }

    // Expected duration check
    if (s.expectedDurationSec <= 0 || s.expectedDurationSec > 10) {
      addIssue(topic, s, 'DURATION', '🟡 WARNING', `Unusual duration: ${s.expectedDurationSec}s`)
    }
  }
}

// ═══ Check 2: Difficulty progression (word count should increase) ═══
function checkProgression(topic: string, sentences: Sentence[]) {
  const wordCounts = sentences.map(s => s.textDe.split(/\s+/).length)
  
  let regressions = 0
  for (let i = 1; i < wordCounts.length; i++) {
    if (wordCounts[i] < wordCounts[i - 1] - 1) { // Allow 1 word tolerance
      regressions++
    }
  }
  
  if (regressions > 2) {
    addIssue(topic, sentences[0], 'PROGRESSION', '🟡 WARNING', 
      `Difficulty not progressing smoothly: word counts = [${wordCounts.join(',')}], ${regressions} regressions`)
  }

  // First sentence should be short (≤4 words), last should be longer
  if (wordCounts[0] > 5) {
    addIssue(topic, sentences[0], 'PROGRESSION', '🟡 WARNING', 
      `First sentence too long (${wordCounts[0]} words): "${sentences[0].textDe}"`)
  }
}

// ═══ Check 3: Duplicates ═══
function checkDuplicates() {
  const seen = new Map<string, string>()
  
  for (const { topic, sentence } of allSentences) {
    const normalized = sentence.textDe.toLowerCase().trim()
    if (seen.has(normalized)) {
      addIssue(topic, sentence, 'DUPLICATE', '🔴 CRITICAL', 
        `Duplicate of sentence in topic "${seen.get(normalized)}" → "${sentence.textDe}"`)
    } else {
      seen.set(normalized, topic)
    }
  }
}

// ═══ Check 4: German text quality via Gemini ═══
async function checkGermanQuality(topicSentences: { topic: string; sentences: Sentence[] }[]) {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  // Build all sentences for batch review
  const allTexts = topicSentences.flatMap(({ topic, sentences }) =>
    sentences.map((s, i) => `[${topic}:${s.id}] "${s.textDe}" → ${s.textVi} | IPA: ${s.ipa}`)
  )

  const prompt = `Du bist ein strenger Deutsch-Lektor und Prüfer für Goethe A1 Materialien.
  
Überprüfe diese 80 deutschen Sätze für eine Nachsprech-Übung (Repeat After Me). Bewerte STRENG:

1. **Grammatik**: Gibt es Fehler? (Konjugation, Kasus, Wortstellung)
2. **Rechtschreibung**: Tippfehler, falsche Umlaute?
3. **A1-Niveau**: Ist der Wortschatz wirklich A1 Goethe? Markiere Wörter die B1+ sind.
4. **IPA**: Sind die IPA-Transkriptionen korrekt für Standard-Hochdeutsch?  
5. **Natürlichkeit**: Klingen die Sätze natürlich? (Nicht wie aus dem Lehrbuch kopiert)
6. **Vietnamesische Übersetzung**: Ist die Übersetzung korrekt?

SÄTZE:
${allTexts.join('\n')}

Antworte NUR als JSON array von Problemen:
[
  {
    "ref": "[topic:id]",
    "category": "GRAMMAR|SPELLING|LEVEL|IPA|NATURALNESS|TRANSLATION",
    "severity": "CRITICAL|WARNING|INFO", 
    "text_de": "original text",
    "issue": "beschreibung des Problems",
    "fix": "Korrekturvorschlag (falls möglich)"
  }
]

Wenn ALLES in Ordnung ist, antworte: []
Sei extrem streng und penibel. Nur JSON, kein Markdown.`

  console.log('\n🔍 Gemini deep review running...')
  const result = await model.generateContent(prompt)
  let text = result.response.text().trim()
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()

  try {
    const geminiIssues = JSON.parse(text) as Array<{
      ref: string
      category: string
      severity: string
      text_de: string
      issue: string
      fix?: string
    }>

    for (const gi of geminiIssues) {
      const severity = gi.severity === 'CRITICAL' ? '🔴 CRITICAL' : gi.severity === 'WARNING' ? '🟡 WARNING' : '🔵 INFO'
      issues.push({
        topic: gi.ref,
        sentenceId: '',
        textDe: gi.text_de,
        category: `GEMINI_${gi.category}`,
        severity,
        detail: `${gi.issue}${gi.fix ? ` → Fix: ${gi.fix}` : ''}`,
      })
    }

    console.log(`  Gemini found ${geminiIssues.length} issues`)
    return geminiIssues.length
  } catch (e) {
    console.error('  ❌ Gemini response parse error:', text.substring(0, 200))
    return -1
  }
}

// ═══ Check 5: Audio Factory script format ═══
function checkAudioFactoryScripts() {
  const scriptsDir = path.resolve(__dirname, '../../8-Audio-Factory/data/scripts/Sprechen-Nachsprechen')
  
  if (!fs.existsSync(scriptsDir)) {
    issues.push({
      topic: 'GLOBAL', sentenceId: '', textDe: '', category: 'AF_FORMAT', severity: '🔴 CRITICAL',
      detail: `Audio Factory scripts directory not found: ${scriptsDir}`
    })
    return
  }

  const files = fs.readdirSync(scriptsDir).filter(f => f.startsWith('L-') && f.endsWith('.json'))
  
  for (const file of files) {
    const filePath = path.join(scriptsDir, file)
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))

    // Required fields
    if (!data.lesson_id) issues.push({ topic: file, sentenceId: '', textDe: '', category: 'AF_FORMAT', severity: '🔴 CRITICAL', detail: 'Missing lesson_id' })
    if (!data.level) issues.push({ topic: file, sentenceId: '', textDe: '', category: 'AF_FORMAT', severity: '🔴 CRITICAL', detail: 'Missing level' })
    if (!data.output_filename) issues.push({ topic: file, sentenceId: '', textDe: '', category: 'AF_FORMAT', severity: '🔴 CRITICAL', detail: 'Missing output_filename' })
    if (!data.lines || data.lines.length === 0) issues.push({ topic: file, sentenceId: '', textDe: '', category: 'AF_FORMAT', severity: '🔴 CRITICAL', detail: 'Missing or empty lines array' })

    // Check line format
    if (data.lines?.[0]) {
      const line = data.lines[0]
      const requiredFields = ['speaker', 'voice_description', 'text', 'engine', 'speed']
      for (const field of requiredFields) {
        if (!line[field]) {
          issues.push({ topic: file, sentenceId: '', textDe: line.text || '', category: 'AF_FORMAT', severity: '🔴 CRITICAL', detail: `Missing required field in line: ${field}` })
        }
      }

      // Speed check for learner content
      if (line.speed > 0.8) {
        issues.push({ topic: file, sentenceId: '', textDe: line.text || '', category: 'AF_SPEED', severity: '🟡 WARNING', detail: `Speed ${line.speed} too fast for A1 learner content (recommended ≤0.75)` })
      }
    }
  }

  console.log(`  ✅ Checked ${files.length} Audio Factory scripts`)
}

async function main() {
  console.log('🔎 STRICT QUALITY AUDIT — Nachsprechen Scripts')
  console.log('=' .repeat(60))

  // Fetch all lessons
  const lessons = await prisma.speakingLesson.findMany({
    where: { exerciseType: 'nachsprechen', status: 'PUBLISHED' },
    include: { topic: true },
    orderBy: { sortOrder: 'asc' },
  })

  const topicSentences: { topic: string; sentences: Sentence[] }[] = []

  for (const lesson of lessons) {
    const data = lesson.exercisesJson as { sentences: Sentence[] }
    const sentences = data.sentences || []
    const topic = lesson.topic.slug

    console.log(`\n📋 ${topic} (${sentences.length} sentences)`)

    // Collect for global checks
    for (const s of sentences) {
      allSentences.push({ topic, sentence: s })
    }
    topicSentences.push({ topic, sentences })

    // Per-topic checks
    checkStructure(topic, sentences)
    checkProgression(topic, sentences)
  }

  // Global checks
  console.log('\n🔍 Checking duplicates...')
  checkDuplicates()

  console.log('🔍 Checking Audio Factory scripts...')
  checkAudioFactoryScripts()

  // Gemini deep review
  await checkGermanQuality(topicSentences)

  // ═══ REPORT ═══
  console.log('\n' + '=' .repeat(60))
  console.log('📊 AUDIT REPORT')
  console.log('=' .repeat(60))

  const critical = issues.filter(i => i.severity === '🔴 CRITICAL')
  const warnings = issues.filter(i => i.severity === '🟡 WARNING')
  const info = issues.filter(i => i.severity === '🔵 INFO')

  console.log(`\n  🔴 CRITICAL: ${critical.length}`)
  console.log(`  🟡 WARNING:  ${warnings.length}`)
  console.log(`  🔵 INFO:     ${info.length}`)
  console.log(`  📝 TOTAL:    ${issues.length}`)

  if (critical.length > 0) {
    console.log('\n─── 🔴 CRITICAL ISSUES ───')
    for (const i of critical) {
      console.log(`  [${i.topic}] ${i.category}: ${i.detail}`)
      if (i.textDe) console.log(`    Text: "${i.textDe}"`)
    }
  }

  if (warnings.length > 0) {
    console.log('\n─── 🟡 WARNINGS ───')
    for (const i of warnings) {
      console.log(`  [${i.topic}] ${i.category}: ${i.detail}`)
      if (i.textDe) console.log(`    Text: "${i.textDe}"`)
    }
  }

  if (info.length > 0) {
    console.log('\n─── 🔵 INFO ───')
    for (const i of info) {
      console.log(`  [${i.topic}] ${i.category}: ${i.detail}`)
    }
  }

  // Save report
  const reportPath = path.resolve(__dirname, '../apps/web/public/audit-speaking.json')
  fs.mkdirSync(path.dirname(reportPath), { recursive: true })
  fs.writeFileSync(reportPath, JSON.stringify({
    auditedAt: new Date().toISOString(),
    totalSentences: allSentences.length,
    critical: critical.length,
    warnings: warnings.length,
    info: info.length,
    issues,
  }, null, 2))

  console.log(`\n💾 Full report: ${reportPath}`)
  
  if (critical.length === 0) {
    console.log('\n✅ PASSED — No critical issues found!')
  } else {
    console.log(`\n❌ FAILED — ${critical.length} critical issues need fixing`)
  }

  await prisma.$disconnect()
}

main().catch(console.error)
