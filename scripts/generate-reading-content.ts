/**
 * GENERATE READING CONTENT — Fill in missing texts + questions for 36 Lückentext exercises
 * Usage: npx tsx scripts/generate-reading-content.ts
 *        npx tsx scripts/generate-reading-content.ts --dry-run    (preview only)
 */

import { PrismaClient } from '../apps/web/generated/prisma'
import { GoogleGenAI } from '@google/genai'
import * as fs from 'fs'
import * as path from 'path'

// Load env
const webEnvPath = path.join(__dirname, '../apps/web/.env')
let geminiKey = process.env.GEMINI_API_KEY
if (fs.existsSync(webEnvPath)) {
  const envLines = fs.readFileSync(webEnvPath, 'utf8').split('\n')
  for (const line of envLines) {
    if (line.startsWith('GEMINI_API_KEY=')) {
      geminiKey = line.split('=').slice(1).join('=').trim().replace(/^"|"$/g, '')
      break
    }
  }
}
if (!geminiKey) {
  console.error('GEMINI_API_KEY not found')
  process.exit(1)
}

const prisma = new PrismaClient()
const ai = new GoogleGenAI({ apiKey: geminiKey })
const isDryRun = process.argv.includes('--dry-run')

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function buildPrompt(exercise: any): string {
  const meta = exercise.metadataJson || {}
  const scoring = exercise.scoringJson || {}
  const totalPoints = scoring.total_points || 8
  const targetGrammar = (meta.target_grammar || []).join(', ')
  const wordCount = meta.word_count || 250

  const teilDescriptions: Record<string, string> = {
    'C1-1': `Lückentext (Wörter): Ein Sachtext mit ${totalPoints} Lücken. 
Für jede Lücke fehlt EIN Wort. Der Leser muss das passende Wort aus dem Kontext erschließen.
Question format: questionType = "lueckentext", each question represents one gap.
The statement should describe the gap position (e.g. "Lücke 1" or the sentence with the gap).
correctAnswer = the missing word.
options = null (open cloze, no multiple choice).`,
    
    'C1-3': `Lückentext (Sätze): Ein Sachtext mit ${totalPoints} Lücken. 
Für jede Lücke fehlt EIN ganzer Satz. Der Leser muss den passenden Satz aus einer Liste wählen.
Question format: questionType = "lueckentext", each question is one gap.
Provide options as {a: "...", b: "...", c: "...", d: "..."} with one correct and distractor sentences.
correctAnswer = the letter key of the correct option (e.g. "a", "b").`,
    
    'C2-2': `Lückentext (Textabschnitte): Ein wissenschaftlicher Text mit ${totalPoints} Lücken.
Für jede Lücke fehlt ein ganzer Absatz/Textabschnitt. Der Leser muss den passenden Abschnitt zuordnen.
Question format: questionType = "lueckentext", each question is one gap.
Provide options as {a: "...", b: "...", c: "...", d: "..."} with full paragraph excerpts as options.
correctAnswer = the letter key of the correct option.`
  }

  const teilKey = `${exercise.cefrLevel}-${exercise.teil}`
  const teilDesc = teilDescriptions[teilKey] || teilDescriptions['C1-1']

  return `
Du bist ein Experte für Goethe-Zertifikat ${exercise.cefrLevel} Leseverstehen und erstellst hochwertige Prüfungsmaterialien.

AUFGABE: Erstelle einen vollständigen Lesetext UND Fragen für ein Leseverstehen-Übung.

DETAILS:
- CEFR-Niveau: ${exercise.cefrLevel}
- Teil: ${exercise.teil} — ${exercise.teilName}
- Thema: ${exercise.topic}
- Ziel-Grammatik: ${targetGrammar}
- Gewünschte Wortanzahl: ca. ${wordCount} Wörter
- Anzahl Fragen: ${totalPoints}

ÜBUNGSTYP:
${teilDesc}

QUALITÄTSANFORDERUNGEN:
1. Der Text muss thematisch zum Thema "${exercise.topic}" passen und dem ${exercise.cefrLevel}-Niveau entsprechen.
2. Jede Frage braucht eine detaillierte Erklärung mit:
   - "reasoning": Warum ist die Antwort korrekt? (auf Deutsch)
   - "key_evidence": Ein direktes Zitat aus dem Text als Beleg
   - "key_vocabulary": Array mit [{word, type, meaning}] für wichtige Wörter
3. Die Grammatikstrukturen ${targetGrammar} sollen im Text vorkommen.

AUSGABEFORMAT — Gib NUR ein JSON-Objekt zurück:
{
  "texts": [
    {
      "id": "TextA",
      "type": "sachtext",
      "title": "Titel des Textes",
      "content": "Der vollständige Lesetext hier..."
    }
  ],
  "questions": [
    {
      "questionNumber": 1,
      "questionType": "lueckentext",
      "linkedText": "TextA",
      "statement": "Beschreibung der Lücke oder Kontext",
      "options": {"a": "Option A", "b": "Option B", "c": "Option C", "d": "Option D"},
      "correctAnswer": "b",
      "points": 1,
      "explanation": {
        "reasoning": "Erklärung warum die Antwort korrekt ist.",
        "key_evidence": "Direktes Zitat aus dem Text.",
        "key_vocabulary": [{"word": "Beispielwort", "type": "Nomen", "meaning": "example word"}]
      }
    }
  ]
}

Gib NUR rohes JSON zurück. Keine Markdown-Codeblöcke.
`
}

async function generateForExercise(exercise: any, index: number, total: number): Promise<boolean> {
  const label = `[${index + 1}/${total}] ${exercise.cefrLevel} T${exercise.teil} — ${exercise.topic}`
  console.log(`\n📝 ${label}`)

  const prompt = buildPrompt(exercise)

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3
      }
    })

    const responseText = response.text || '{}'
    let parsed: any
    try {
      parsed = JSON.parse(responseText)
    } catch {
      console.error(`  ❌ Failed to parse JSON response`)
      return false
    }

    const texts = parsed.texts
    const questions = parsed.questions

    if (!Array.isArray(texts) || texts.length === 0) {
      console.error(`  ❌ No texts generated`)
      return false
    }
    if (!Array.isArray(questions) || questions.length === 0) {
      console.error(`  ❌ No questions generated`)
      return false
    }

    console.log(`  ✅ Generated: ${texts.length} text(s), ${questions.length} question(s)`)
    console.log(`     Text preview: "${texts[0].content?.slice(0, 80)}..."`)

    if (isDryRun) {
      console.log(`  ⏭️  DRY RUN — skipping DB write`)
      return true
    }

    // Write textsJson
    await prisma.readingExercise.update({
      where: { id: exercise.id },
      data: { textsJson: texts }
    })

    // Create questions
    for (const q of questions) {
      await prisma.readingQuestion.create({
        data: {
          exerciseId: exercise.id,
          questionNumber: q.questionNumber,
          questionType: q.questionType || 'lueckentext',
          linkedText: q.linkedText || null,
          statement: q.statement || '',
          options: q.options || null,
          correctAnswer: q.correctAnswer,
          points: q.points || 1,
          explanation: q.explanation || null,
          sortOrder: q.questionNumber,
        }
      })
    }

    console.log(`  💾 Saved to database`)
    return true

  } catch (error: any) {
    console.error(`  ❌ Gemini error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 GENERATE READING CONTENT')
  console.log('='.repeat(60))
  if (isDryRun) console.log('⚠️  DRY RUN MODE — no DB changes will be made\n')

  // Find exercises with no questions
  const allExercises = await prisma.readingExercise.findMany({
    include: { questions: true }
  })

  const incomplete = allExercises.filter(ex => ex.questions.length === 0)
  console.log(`Found ${incomplete.length} exercises with no questions`)

  let success = 0
  let failures = 0

  for (let i = 0; i < incomplete.length; i++) {
    const ok = await generateForExercise(incomplete[i], i, incomplete.length)
    if (ok) success++
    else failures++

    // Rate limit: wait 5 seconds between calls
    if (i < incomplete.length - 1) {
      console.log('  ⏳ Waiting 5s...')
      await sleep(5000)
    }
  }

  console.log('\n' + '='.repeat(60))
  console.log(`🎉 Complete! ${success} succeeded, ${failures} failed out of ${incomplete.length}`)
}

main().catch(e => {
  console.error(e)
  process.exit(1)
}).finally(async () => {
  await prisma.$disconnect()
})
