import { PrismaClient } from '../apps/web/generated/prisma'
import { GoogleGenAI } from '@google/genai'
import * as fs from 'fs'
import * as path from 'path'

const prisma = new PrismaClient()

const LEVELS = ['A2', 'B1', 'B2', 'C1', 'C2']

function buildPrompt(topicTitle: string, topicDesc: string, level: string): string {
  return `Du bist ein erfahrener Deutschlehrer und Experte für die Erstellung von Lehrmaterialien.
Dein Auftrag ist es, die detaillierten Grammatikregeln für ein bestimmtes Thema auf dem Niveau ${level} zu erstellen.

Thema: ${topicTitle}
Beschreibung: ${topicDesc}

Erstelle ein JSON-Objekt mit den Grammatikregeln, Formeln und Tipps für dieses Thema.
Die Ausgabe MUSS EXAKT dieses JSON-Schema erfüllen (kein Markdown-Codeblock, NUR valides JSON!):

{
  "explanation": "Eine kurze Erklärung auf Deutsch, worum es bei diesem Thema geht.",
  "formula": "Eine prägnante Formel (z.B. Subjekt + Hilfsverb + Objekt + Partizip II) oder null.",
  "mnemonicTip": "Ein kurzer, einprägsamer Tipp oder Eselsbrücke (auf Vietnamesisch oder Deutsch), um sich die Regel besser zu merken.",
  "rules": [
    {
      "title": "Titel der Regel auf Vietnamesisch",
      "titleDe": "Titel der Regel auf Deutsch",
      "ruleText": "Die Erklärung der Regel auf Vietnamesisch (sehr klar und verständlich für ${level}-Lernende).",
      "examples": [
        "Beispielsatz 1 auf Deutsch. (Bedeutung auf Vietnamesisch)",
        "Beispielsatz 2 auf Deutsch. (Bedeutung auf Vietnamesisch)"
      ],
      "tableData": null, 
      "sortOrder": 1
    }
  ]
}

- Erstelle 2-4 Regeln pro Thema.
- Das JSON muss absolut valide sein.
- Die "tableData" Eigenschaft kann "null" sein, wenn keine Tabelle nötig ist, andernfalls:
  { "columns": ["...", "..."], "rows": [ ["...", "..."], ["...", "..."] ] }
- "ruleText" und "mnemonicTip" sollten primär auf Vietnamesisch sein (mit deutschen Begriffen), passend für vietnamesische Lernende.
`
}

async function main() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    console.error('GEMINI_API_KEY is required')
    process.exit(1)
  }
  const genai = new GoogleGenAI({ apiKey })

  for (const level of LEVELS) {
    console.log(`\n=== Processing Level ${level} ===`)
    
    // Create directory if not exists
    const dir = path.join(process.cwd(), 'content', level.toLowerCase(), 'grammar')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    const jsonPath = path.join(dir, 'grammar-topics.json')

    const topics = await prisma.grammarTopic.findMany({
      where: { cefrLevel: level as any },
      orderBy: { sortOrder: 'asc' }
    })

    if (topics.length === 0) {
      console.log(`No topics found for ${level} in DB.`)
      continue
    }

    const topicsJson: any[] = []

    for (const t of topics) {
      console.log(`Generating rules for: ${t.slug} (${t.title})`)
      const prompt = buildPrompt(t.title, t.description || '', level)

      try {
        const response = await genai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            temperature: 0.3,
            responseMimeType: 'application/json',
          },
        })

        const text = response.text || ''
        const generated = JSON.parse(text)

        // Compile topic object
        const topicObj = {
          slug: t.slug,
          title: t.title,
          titleDe: t.titleDe,
          description: t.description,
          cefrLevel: t.cefrLevel,
          sortOrder: t.sortOrder,
          explanation: generated.explanation,
          formula: generated.formula,
          mnemonicTip: generated.mnemonicTip,
          rules: generated.rules || []
        }

        topicsJson.push(topicObj)
        
        // Wait 2s to respect rate limit
        await new Promise(r => setTimeout(r, 2000))

      } catch (err: any) {
        console.error(`Failed to generate for ${t.slug}:`, err.message)
      }
    }

    // Save to JSON
    fs.writeFileSync(jsonPath, JSON.stringify({ topics: topicsJson }, null, 4))
    console.log(`Saved ${topicsJson.length} topics to ${jsonPath}`)
  }
}

main().catch(console.error).finally(() => prisma.$disconnect())
