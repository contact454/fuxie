/**
 * A2 Vocabulary Expansion Script
 * Uses Gemini to generate additional A2-level vocabulary words
 * and appends them to existing theme JSON files.
 *
 * Usage:
 *   npx tsx scripts/expand-a2-vocab.ts                # all themes
 *   npx tsx scripts/expand-a2-vocab.ts --theme=18     # specific theme
 *   npx tsx scripts/expand-a2-vocab.ts --dry-run      # preview only
 */

import { GoogleGenAI } from '@google/genai'
import { writeFileSync, readdirSync, readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', 'apps', 'web', '.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found')
    process.exit(1)
}

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'a2', 'vocabulary')

// Target word counts per theme
const TARGETS: Record<string, number> = {
    '01-person-identitaet': 35,
    '02-familie-soziales': 35,
    '05-umwelt-natur': 35,
    '06-essen-restaurant': 35,
    '07-kleidung-mode': 32,
    '08-dienstleistungen-amt': 30,
    '09-bildung-berufsleben': 30,
    '10-arbeit-wirtschaft': 32,
    '11-freizeit-kultur': 30,
    '12-kommunikation-medien': 30,
    '13-reisen-tourismus': 30,
    '14-zeit-feiertage': 30,
    '15-gefuehle-meinungen': 35,
    '16-technik-alltag': 30,
    '17-gesellschaft-regeln': 30,
    '18-geld-finanzen': 30,
    '19-verkehr-mobilitaet': 30,
    '20-wetter-klima': 30,
}

// Parse CLI args
const args = process.argv.slice(2)
const themeFilter = args.find(a => a.startsWith('--theme='))?.split('=')[1]
const dryRun = args.includes('--dry-run')

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

interface WordData {
    word: string
    article?: string
    plural?: string
    wordType: string
    meaningVi: string
    meaningEn: string
    exampleSentence1: string
    exampleTranslation1: string
    exampleSentence2: string
    exampleTranslation2: string
    imageUrl?: string | null
}

interface ThemeData {
    theme: { slug: string; name: string;[key: string]: unknown }
    words: WordData[]
}

function buildPrompt(themeName: string, existingWords: string[], count: number): string {
    return `You are a German language expert creating A2-level (CEFR) vocabulary for a learning app.

Theme: "${themeName}"

ALREADY EXISTING WORDS (DO NOT DUPLICATE):
${existingWords.join(', ')}

Generate exactly ${count} NEW German words for this theme at A2 level. 

RULES:
- Words must be A2 level (not too basic A1, not too advanced B1+)
- Include a mix of: Nouns (NOMEN), Verbs (VERB), Adjectives (ADJEKTIV)
- For nouns: include correct article (MASKULIN/FEMININ/NEUTRUM) and plural form
- For verbs/adjectives: set article to null and plural to null  
- All example sentences must be A2 appropriate (simple but not A1-basic)
- Vietnamese translations must be accurate
- DO NOT include any word that is already in the existing words list above

Return ONLY a valid JSON array with NO markdown formatting, NO code blocks, just the raw JSON array. Each object must have exactly these fields:
[
  {
    "word": "Beispiel",
    "article": "NEUTRUM",
    "plural": "die Beispiele",
    "wordType": "NOMEN",
    "meaningVi": "ví dụ",
    "meaningEn": "example",
    "exampleSentence1": "Können Sie mir ein Beispiel geben?",
    "exampleTranslation1": "Bạn có thể cho tôi một ví dụ không?",
    "exampleSentence2": "Das ist ein gutes Beispiel.",
    "exampleTranslation2": "Đó là một ví dụ tốt."
  }
]

For verbs, use this format:
{
  "word": "besuchen",
  "article": null,
  "plural": null,
  "wordType": "VERB",
  ...
}

For adjectives:
{
  "word": "wichtig",
  "article": null,
  "plural": null,
  "wordType": "ADJEKTIV",
  ...
}

Generate exactly ${count} words. Return ONLY the JSON array, nothing else.`
}

async function generateWords(themeName: string, existingWords: string[], count: number): Promise<WordData[]> {
    const prompt = buildPrompt(themeName, existingWords, count)

    try {
        const response = await genai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.7,
            },
        })

        const text = response.text || ''
        // Extract JSON from response (handle potential markdown wrapping)
        let jsonStr = text.trim()
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        }

        const words: WordData[] = JSON.parse(jsonStr)

        // Validate and clean
        const cleaned: WordData[] = []
        for (const w of words) {
            if (!w.word || !w.wordType || !w.meaningVi || !w.meaningEn) continue
            // Skip duplicates
            if (existingWords.some(ew => ew.toLowerCase() === w.word.toLowerCase())) continue

            // Normalize article
            if (w.wordType === 'VERB' || w.wordType === 'ADJEKTIV' || w.wordType === 'ADVERB') {
                w.article = undefined as any
                w.plural = undefined as any
            }

            cleaned.push(w)
        }

        return cleaned.slice(0, count)
    } catch (err: any) {
        console.error(`    ❌ Gemini error: ${err.message?.substring(0, 200)}`)
        return []
    }
}

async function processTheme(file: string): Promise<{ added: number }> {
    const filePath = path.join(CONTENT_DIR, file)
    const data: ThemeData = JSON.parse(readFileSync(filePath, 'utf8'))
    const fileKey = file.replace('.json', '')
    const target = TARGETS[fileKey]

    if (!target) {
        console.log(`  ⏭️ No expansion target for ${fileKey}`)
        return { added: 0 }
    }

    const needed = target - data.words.length
    if (needed <= 0) {
        console.log(`  ✅ Already at target (${data.words.length}/${target})`)
        return { added: 0 }
    }

    console.log(`  📝 Need ${needed} more words (${data.words.length} → ${target})`)

    if (dryRun) {
        return { added: needed }
    }

    const existingWords = data.words.map(w => w.word)
    const newWords = await generateWords(data.theme.name, existingWords, needed)

    if (newWords.length === 0) {
        console.log(`  ❌ No words generated`)
        return { added: 0 }
    }

    // Append new words
    data.words.push(...newWords)

    // Save
    writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n')
    console.log(`  ✅ Added ${newWords.length} words: ${newWords.map(w => w.word).join(', ')}`)

    return { added: newWords.length }
}

async function main() {
    console.log('🦊 A2 Vocabulary Expansion')
    console.log('==========================')
    if (dryRun) console.log('🏃 DRY RUN — no changes will be made')
    console.log('')

    let files = readdirSync(CONTENT_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()

    if (themeFilter) {
        files = files.filter(f => f.startsWith(themeFilter))
        console.log(`🎯 Filter: theme ${themeFilter} (${files.length} files)`)
    }

    let totalAdded = 0

    for (const file of files) {
        const data: ThemeData = JSON.parse(readFileSync(path.join(CONTENT_DIR, file), 'utf8'))
        console.log(`\n📂 ${data.theme.name} (${file}) — ${data.words.length} words`)

        const result = await processTheme(file)
        totalAdded += result.added

        // Rate limit between API calls
        if (result.added > 0) {
            await sleep(3000)
        }
    }

    console.log('\n==========================')
    console.log(`📊 Total words added: ${totalAdded}`)
    console.log('🦊 Done!')
}

main().catch(console.error)
