/**
 * C1 Vocabulary Image Generator + JSON Updater
 * Reads all C1 theme JSON files, generates images, and updates JSON with imageUrl
 * 
 * Uses Gemini API with fallback chain:
 *   gemini-3.1-flash-image-preview → gemini-2.5-flash-image
 *
 * Usage:
 *   npx tsx scripts/gen-c1-vocab-images.ts                # all themes
 *   npx tsx scripts/gen-c1-vocab-images.ts --theme=01     # specific theme
 *   npx tsx scripts/gen-c1-vocab-images.ts --start=06     # start from theme 06
 *   npx tsx scripts/gen-c1-vocab-images.ts --dry-run      # just list words
 */

import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', 'apps', 'web', '.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found')
    process.exit(1)
}

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const BASE_DIR = path.join(__dirname, '..', 'apps', 'web', 'public', 'images', 'vocab')
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'c1', 'vocabulary')

// Models with fallback
const MODELS = [
    'gemini-3.1-flash-image-preview',
    'gemini-2.5-flash-image',
]

// Parse CLI args
const args = process.argv.slice(2)
const themeFilter = args.find(a => a.startsWith('--theme='))?.split('=')[1]
const startFrom = args.find(a => a.startsWith('--start='))?.split('=')[1]
const dryRun = args.includes('--dry-run')

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function slugify(word: string): string {
    return word.toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue')
        .replace(/ß/g, 'ss')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
}

function buildPrompt(word: string, meaning: string, wordType: string): string {
    let styleHint = ''
    if (wordType === 'VERB') {
        styleHint = 'Show the action being performed by a simple cartoon character. '
    } else if (wordType === 'ADJEKTIV' || wordType === 'ADVERB') {
        styleHint = 'Show the concept/quality visually with a simple scene. '
    } else if (wordType === 'PHRASE') {
        styleHint = 'Show the concept as a small scene with simple characters. '
    }

    return `Create a simple, cute flat design illustration of "${word}" (${meaning}) for a German language learning flashcard. ${styleHint}
Style: Clean flat vector illustration, minimal details, soft pastel colors, white background, no text, no border, no labels. 
Similar to Duolingo illustration style. Single centered object or scene, 256x256 scale.`
}

async function generateImage(prompt: string, modelIndex = 0): Promise<Buffer | null> {
    if (modelIndex >= MODELS.length) return null
    const model = MODELS[modelIndex]

    try {
        const response = await genai.models.generateContent({
            model,
            contents: prompt,
            config: {
                responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
        })

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.mimeType?.startsWith('image/')) {
                    return Buffer.from(part.inlineData.data!, 'base64')
                }
            }
        }

        console.log(`    ⚠️ No image from ${model}, trying fallback...`)
        return generateImage(prompt, modelIndex + 1)
    } catch (err: any) {
        const msg = err?.message || String(err)
        if (msg.includes('429') || msg.includes('quota') || msg.includes('RESOURCE_EXHAUSTED')) {
            console.log(`    ⚠️ ${model} quota hit, trying fallback...`)
            return generateImage(prompt, modelIndex + 1)
        }
        console.error(`    ❌ ${model} error: ${msg.substring(0, 100)}`)
        return generateImage(prompt, modelIndex + 1)
    }
}

interface WordData {
    word: string
    meaningEn: string
    wordType: string
    imageUrl?: string | null
    [key: string]: unknown
}

interface ThemeData {
    theme: { slug: string; name: string; imageUrl?: string | null;[key: string]: unknown }
    words: WordData[]
}

/**
 * Process a theme: generate images + update JSON with imageUrl in-place
 */
async function processTheme(themeFile: string): Promise<{ success: number; failed: number; skipped: number; jsonUpdated: boolean }> {
    const filePath = path.join(CONTENT_DIR, themeFile)
    const data: ThemeData = JSON.parse(readFileSync(filePath, 'utf8'))
    const themeSlug = data.theme.slug
    const destDir = path.join(BASE_DIR, themeSlug)
    mkdirSync(destDir, { recursive: true })

    let success = 0, failed = 0, skipped = 0
    let jsonDirty = false

    for (let i = 0; i < data.words.length; i++) {
        const wordData = data.words[i]
        const { word, meaningEn, wordType } = wordData
        const slug = slugify(word)
        const destPath = path.join(destDir, `${slug}.png`)
        const imageUrl = `/images/vocab/${themeSlug}/${slug}.png`

        // If image already exists, just update JSON if needed
        if (existsSync(destPath)) {
            if (wordData.imageUrl !== imageUrl) {
                wordData.imageUrl = imageUrl
                jsonDirty = true
            }
            skipped++
            continue
        }

        if (dryRun) {
            console.log(`    📝 ${word} → ${slug}.png`)
            success++
            continue
        }

        console.log(`    [${i + 1}/${data.words.length}] ${word}...`)
        const prompt = buildPrompt(word, meaningEn, wordType)
        const imageBuffer = await generateImage(prompt)

        if (imageBuffer) {
            writeFileSync(destPath, imageBuffer)
            // Update imageUrl in data
            wordData.imageUrl = imageUrl
            jsonDirty = true
            console.log(`    ✅ ${word} → ${slug}.png (${(imageBuffer.length / 1024).toFixed(0)}KB)`)
            success++
        } else {
            console.log(`    ❌ ${word} — failed all models`)
            failed++
        }

        // Rate limit: ~6 req/min to stay safe
        if (i < data.words.length - 1) {
            await sleep(10000)
        }
    }

    // Save updated JSON with imageUrl fields
    if (jsonDirty && !dryRun) {
        writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n')
        console.log(`  📝 Updated ${themeFile} with imageUrl fields`)
    }

    return { success, failed, skipped, jsonUpdated: jsonDirty }
}

async function main() {
    console.log('🦊 C1 Vocabulary Image Generator + JSON Updater')
    console.log('================================================')
    console.log(`Models: ${MODELS.join(' → ')}`)
    console.log(`Output: ${BASE_DIR}`)
    console.log(`JSON:   ${CONTENT_DIR}`)
    if (dryRun) console.log('🏃 DRY RUN — no images will be generated')
    console.log('')

    // Get all theme files
    let files = readdirSync(CONTENT_DIR)
        .filter(f => f.endsWith('.json'))
        .sort()

    // Apply filters
    if (themeFilter) {
        files = files.filter(f => f.startsWith(themeFilter))
        console.log(`🎯 Filter: theme ${themeFilter} (${files.length} files)`)
    }
    if (startFrom) {
        files = files.filter(f => f >= `${startFrom}`)
        console.log(`🎯 Starting from: ${startFrom} (${files.length} files)`)
    }

    let totalSuccess = 0, totalFailed = 0, totalSkipped = 0, totalJsonUpdated = 0

    for (const file of files) {
        const data: ThemeData = JSON.parse(readFileSync(path.join(CONTENT_DIR, file), 'utf8'))
        console.log(`\n📂 ${data.theme.name} (${file}) — ${data.words.length} words`)
        console.log('---')

        const result = await processTheme(file)
        totalSuccess += result.success
        totalFailed += result.failed
        totalSkipped += result.skipped
        if (result.jsonUpdated) totalJsonUpdated++

        console.log(`  ✅ ${result.success} | ❌ ${result.failed} | ⏭️ ${result.skipped}`)
    }

    console.log('\n================================================')
    console.log('📊 TOTAL:')
    console.log(`  ✅ Generated: ${totalSuccess}`)
    console.log(`  ❌ Failed: ${totalFailed}`)
    console.log(`  ⏭️ Skipped (exists): ${totalSkipped}`)
    console.log(`  📝 JSON files updated: ${totalJsonUpdated}`)
    console.log('\n🦊 Done!')
}

main().catch(console.error)
