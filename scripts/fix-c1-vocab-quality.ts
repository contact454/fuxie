/**
 * Fix C1 Vocabulary Data Quality
 * 1. Fix invalid wordTypes (PRÄPOSITION → PRAEPOSITION, PRÄPOSITIONALPHRASE → PHRASE)
 * 2. Generate conjugation data for all C1 verbs missing it
 * 
 * Usage:
 *   npx tsx scripts/fix-c1-vocab-quality.ts
 *   npx tsx scripts/fix-c1-vocab-quality.ts --fix-types-only   # just fix wordTypes
 *   npx tsx scripts/fix-c1-vocab-quality.ts --dry-run
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
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'c1', 'vocabulary')

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const fixTypesOnly = args.includes('--fix-types-only')
const startFrom = args.find(a => a.startsWith('--start='))?.split('=')[1]

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// ===== PART 1: Fix invalid wordTypes =====
const WORDTYPE_FIXES: Record<string, string> = {
    'PRÄPOSITION': 'PRAEPOSITION',
    'PRÄPOSITIONALPHRASE': 'PHRASE',
}

function fixWordTypes(): number {
    console.log('\n📝 PART 1: Fixing invalid wordTypes...')
    let fixed = 0
    const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json')).sort()

    for (const file of files) {
        const filePath = path.join(CONTENT_DIR, file)
        const data = JSON.parse(readFileSync(filePath, 'utf8'))
        let dirty = false

        for (const w of data.words) {
            if (WORDTYPE_FIXES[w.wordType]) {
                console.log(`  🔧 ${file}: "${w.word}" — ${w.wordType} → ${WORDTYPE_FIXES[w.wordType]}`)
                if (!dryRun) w.wordType = WORDTYPE_FIXES[w.wordType]
                dirty = true
                fixed++
            }
        }

        if (dirty && !dryRun) {
            writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n')
        }
    }

    console.log(`  ✅ Fixed ${fixed} wordTypes`)
    return fixed
}

// ===== PART 2: Generate verb conjugations =====
function buildConjugationPrompt(verbs: string[]): string {
    return `You are an expert German linguist. Generate conjugation data for these German verbs.

Verbs: ${verbs.map(v => `"${v}"`).join(', ')}

For EACH verb, provide conjugation in this EXACT JSON format:
{
  "verb": "the original verb string exactly as given",
  "conjugation": {
    "praesens": {
      "ich": "...", "du": "...", "er/sie/es": "...",
      "wir": "...", "ihr": "...", "sie/Sie": "..."
    },
    "praeteritum": {
      "ich": "...", "du": "...", "er/sie/es": "...",
      "wir": "...", "ihr": "...", "sie/Sie": "..."
    },
    "perfekt": {
      "hilfsverb": "haben OR sein",
      "partizip2": "..."
    },
    "konjunktiv2": {
      "ich": "...", "du": "...", "er/sie/es": "...",
      "wir": "...", "ihr": "...", "sie/Sie": "..."
    },
    "imperativ": {
      "du": "...", "ihr": "...", "Sie": "..."
    }
  }
}

RULES:
- Use the STANDARD dictionary form (Infinitiv) for conjugation
- If the verb has a prefix like "etw.", "sich", "etwas", strip it and conjugate the base verb
  e.g. "etw. evaluieren" → conjugate "evaluieren"
  e.g. "sich etablieren" → conjugate "sich etablieren" (reflexive)
  e.g. "auf etwas zurückgreifen" → conjugate "zurückgreifen"
- For separable verbs, show the separated form in Präsens (e.g. "ich greife zurück")
- For reflexive verbs, include "sich" in conjugation
- Be ACCURATE — these are for a German learning app
- Return ONLY a valid JSON array, no markdown

Return an array of the above objects.`
}

async function generateConjugations(verbs: string[]): Promise<Map<string, any>> {
    const result = new Map<string, any>()

    try {
        const response = await genai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: buildConjugationPrompt(verbs),
            config: { temperature: 0.2 },
        })

        const text = response.text || ''
        let jsonStr = text.trim()
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        }

        const data = JSON.parse(jsonStr)
        if (Array.isArray(data)) {
            for (const item of data) {
                if (item.verb && item.conjugation) {
                    result.set(item.verb, item.conjugation)
                }
            }
        }
    } catch (err: any) {
        console.error(`  ❌ Gemini error: ${err.message?.substring(0, 200)}`)
    }

    return result
}

async function fixVerbConjugations(): Promise<number> {
    console.log('\n📝 PART 2: Generating verb conjugations...')
    let totalFixed = 0
    const files = readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json')).sort()

    // Apply --start filter
    let filteredFiles = files
    if (startFrom) {
        filteredFiles = files.filter(f => f >= startFrom)
        console.log(`  🎯 Starting from: ${startFrom} (${filteredFiles.length} files)`)
    }

    for (const file of filteredFiles) {
        const filePath = path.join(CONTENT_DIR, file)
        const data = JSON.parse(readFileSync(filePath, 'utf8'))

        // Collect verbs without conjugation
        const verbsToFix = data.words.filter((w: any) => w.wordType === 'VERB' && !w.conjugation)
        if (verbsToFix.length === 0) {
            console.log(`  ⏭️ ${file}: all verbs have conjugation`)
            continue
        }

        console.log(`  📂 ${file}: ${verbsToFix.length} verbs need conjugation`)

        if (dryRun) {
            for (const v of verbsToFix) {
                console.log(`    📝 ${v.word}`)
            }
            totalFixed += verbsToFix.length
            continue
        }

        // Process in batches of 10-15 to stay within token limits
        const BATCH_SIZE = 12
        for (let i = 0; i < verbsToFix.length; i += BATCH_SIZE) {
            const batch = verbsToFix.slice(i, i + BATCH_SIZE)
            const verbStrings = batch.map((v: any) => v.word)

            console.log(`    Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(verbsToFix.length / BATCH_SIZE)}: ${verbStrings.join(', ')}`)

            const conjugations = await generateConjugations(verbStrings)

            for (const verbData of batch) {
                const conj = conjugations.get(verbData.word)
                if (conj) {
                    verbData.conjugation = conj
                    totalFixed++
                    console.log(`    ✅ ${verbData.word}`)
                } else {
                    console.log(`    ❌ ${verbData.word} — no conjugation returned`)
                }
            }

            // Rate limit
            if (i + BATCH_SIZE < verbsToFix.length) {
                await sleep(3000)
            }
        }

        // Save updated file
        writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n')
        console.log(`  📝 Saved ${file}`)

        // Rate limit between files
        await sleep(2000)
    }

    console.log(`\n  ✅ Total verbs fixed: ${totalFixed}`)
    return totalFixed
}

// ===== MAIN =====
async function main() {
    console.log('🦊 C1 Vocabulary Quality Fix')
    console.log('============================')
    if (dryRun) console.log('🏃 DRY RUN')

    // Part 1: Fix wordTypes
    const typesFixed = fixWordTypes()

    // Part 2: Generate conjugations (unless --fix-types-only)
    let conjFixed = 0
    if (!fixTypesOnly) {
        conjFixed = await fixVerbConjugations()
    }

    console.log('\n============================')
    console.log('📊 SUMMARY')
    console.log(`  WordTypes fixed: ${typesFixed}`)
    console.log(`  Conjugations added: ${conjFixed}`)
    console.log('🦊 Done!')
}

main().catch(console.error)
