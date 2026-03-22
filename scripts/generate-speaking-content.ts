import fs from 'fs'
import path from 'path'
import { GoogleGenerativeAI } from '@google/generative-ai'
import dotenv from 'dotenv'

dotenv.config()

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
if (!API_KEY) {
  console.error("Missing Gemini API Key!")
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(API_KEY)
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" })

const LEVELS = ['a2', 'b1', 'b2', 'c1', 'c2']
const TOPICS = [
  { id: "alltag", name: "Alltag" },
  { id: "familie", name: "Familie und Freunde" },
  { id: "einkaufen", name: "Einkaufen" },
  { id: "wohnen", name: "Wohnen" },
  { id: "gesundheit", name: "Körper und Gesundheit" },
  { id: "arbeit", "name": "Arbeit und Beruf" },
  { id: "freizeit", name: "Freizeit und Hobbys" },
  { id: "reisen", name: "Verkehr und Reisen" },
  { id: "essen", name: "Essen und Trinken" },
  { id: "lernen", name: "Lernen und Ausbildung" }
]

async function generateWithTimeout(prompt: string, timeoutMs: number) {
  return Promise.race([
    model.generateContent(prompt),
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout generation')), timeoutMs))
  ]) as ReturnType<typeof model.generateContent>;
}

async function generateContent(level: string, topicId: string, topicName: string) {
  const prompt = `Du bist ein Sprachexperte für Deutsch als Fremdsprache (DaF).
Erstelle Nachsprechen-Übungen (Speaking) für vietnamesische Deutschlerner.
Niveau: ${level.toUpperCase()}
Thema: ${topicName} (ID: ${topicId})

Erstelle genau 8 Lektionen für dieses Thema.
Jede Lektion hat:
- "titleDe": Kurzer Titel auf Deutsch
- "titleVi": Kurzer Titel auf Vietnamesisch (Was lernt man hier?)
- "sentences": Genau 6 Sätze pro Lektion.

Für jeden Satz:
- "german": Der deutsche Satz. Er muss exakt zum Niveau ${level.toUpperCase()} passen (Grammatik und Wortschatz).
- "vietnamese": Die vietnamesische Übersetzung.
- "ipa": Die phonetische Transkription (IPA) des Satzes.
- "pronunciationTips": Ein kurzer, sehr spezifischer Tipp zur Aussprache dieses Satzes auf Vietnamesisch (z.B. Betonung, schwierige Laute, Satzmelodie).

Die Ausgabe MUSS ein gültiges JSON-Objekt sein, ohne Markdown-Formatierung.
Struktur:
{
  "topicSlug": "${level}-${topicId}",
  "cefrLevel": "${level.toUpperCase()}",
  "titleDe": "${topicName}",
  "titleVi": "Vietnamesische Übersetzung des Themas",
  "lessons": [
    {
      "lessonId": "${level}-${topicId}-01",
      "lessonNumber": 1,
      "titleDe": "...",
      "titleVi": "...",
      "sentences": [
        {
          "id": "${level}-${topicId}-01-s1",
          "german": "...",
          "vietnamese": "...",
          "ipa": "...",
          "pronunciationTips": "..."
        }
      ]
    }
  ]
}`

  try {
    const result = await generateWithTimeout(prompt, 60000)
    const text = result.response.text().replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const data = JSON.parse(text)
    
    // Deterministic ID assignment
    if (data.lessons && Array.isArray(data.lessons)) {
      data.lessons.forEach((lesson: any, i: number) => {
        const lNum = String(i + 1).padStart(2, '0')
        lesson.lessonId = `${level}-${topicId}-${lNum}`
        lesson.lessonNumber = i + 1
        
        if (lesson.sentences && Array.isArray(lesson.sentences)) {
          lesson.sentences.forEach((sentence: any, j: number) => {
            const sNum = j + 1
            sentence.id = `${level}-${topicId}-${lNum}-s${sNum}`
            sentence.audioUrl = `https://pub-2e3895bbabbf4d3cad68dc3bece2f3a6.r2.dev/L-SPR-${level.toUpperCase()}-${topicId.toUpperCase()}-${lNum}-S${sNum}.mp3`
          })
        }
      })
    }
    
    return data
  } catch (error) {
    console.error(`Failed to generate ${level} ${topicId}:`, error)
    return null
  }
}

async function main() {
  for (const level of LEVELS) {
    const dir = path.join(process.cwd(), 'content', level, 'speaking')
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    for (const topic of TOPICS) {
      const filePath = path.join(dir, `${level}-${topic.id}.json`)
      if (fs.existsSync(filePath)) {
        console.log(`Skipping ${level}-${topic.id}.json (already exists)`)
        continue
      }

      console.log(`Generating ${level.toUpperCase()} - ${topic.name}...`)
      let attempts = 0
      let data = null
      while (attempts < 3 && !data) {
        data = await generateContent(level, topic.id, topic.name)
        attempts++
        if (!data) {
           console.log(`Attempt ${attempts} failed, retrying...`)
           await new Promise(resolve => setTimeout(resolve, 2000))
        }
      }
      
      if (data) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
        console.log(`Saved ${filePath}`)
      }
      
      // Delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }
}

main().catch(console.error)
