/**
 * 🦊 Unified Vocabulary Image Generator
 *
 * Generates word images for ALL CEFR levels (A1-C2) using Gemini model fallback chain.
 * Skips existing images, updates JSON files with imageUrl in-place.
 *
 * Usage:
 *   npx tsx scripts/gen-all-vocab-images.ts                    # all levels, no limit
 *   npx tsx scripts/gen-all-vocab-images.ts --batch=1500       # max 1500 images per run
 *   npx tsx scripts/gen-all-vocab-images.ts --level=c1         # only C1 level
 *   npx tsx scripts/gen-all-vocab-images.ts --start=c1-05      # resume from theme starting with "c1-05"
 *   npx tsx scripts/gen-all-vocab-images.ts --delay=8000       # ms between requests
 *   npx tsx scripts/gen-all-vocab-images.ts --dry-run          # list missing images only
 */

import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync, appendFileSync, statSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', 'apps', 'web', '.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in apps/web/.env')
    process.exit(1)
}

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

// ──── Config ────

const PROJECT_ROOT = path.join(__dirname, '..')
const IMG_BASE = path.join(PROJECT_ROOT, 'apps', 'web', 'public', 'images', 'vocab')
const CONTENT_BASE = path.join(PROJECT_ROOT, 'content')
const LOG_FILE = path.join(__dirname, 'image-gen-progress.log')

const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const
type CefrLevel = typeof LEVELS[number]

// Fallback model chain (TIER_VOCAB)
const MODEL_CHAIN = [
    'gemini-3.1-flash-image-preview',
    'gemini-2.5-flash-image',
]

// ──── CLI Args ────

const args = process.argv.slice(2)
const levelFilter = args.find(a => a.startsWith('--level='))?.split('=')[1]?.toLowerCase() as CefrLevel | undefined
const startFrom = args.find(a => a.startsWith('--start='))?.split('=')[1]
const batchLimit = parseInt(args.find(a => a.startsWith('--batch='))?.split('=')[1] || '0', 10)
const delayMs = parseInt(args.find(a => a.startsWith('--delay='))?.split('=')[1] || '5000', 10)
const dryRun = args.includes('--dry-run')
const RATE_LIMIT_DELAY = 60000

// ──── Helpers ────

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

function logProgress(message: string): void {
    const timestamp = new Date().toISOString()
    appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`)
}

function buildPrompt(word: string, meaning: string, wordType: string): string {
    let styleHint = ''
    if (wordType === 'VERB') {
        styleHint = 'Show the action being performed by a simple cartoon character. '
    } else if (wordType === 'ADJEKTIV' || wordType === 'ADVERB') {
        styleHint = 'Show the concept/quality visually with a simple scene. '
    } else if (wordType === 'PHRASE' || wordType === 'REDEWENDUNG') {
        styleHint = 'Show the concept as a small scene with simple characters. '
    } else if (wordType === 'PRAEPOSITION' || wordType === 'KONJUNKTION' || wordType === 'PARTIKEL') {
        styleHint = 'Show a simple spatial or relational concept with arrows or positioning. '
    }

    return `Create a simple, cute flat design illustration of "${word}" (${meaning}) for a German language learning flashcard. ${styleHint}
Style: Clean flat vector illustration, minimal details, soft pastel colors, white background, no text, no border, no labels. 
Similar to Duolingo illustration style. Single centered object or scene, 256x256 scale.`
}

// ──── Image Generation with Fallback ────

async function generateImage(prompt: string, modelIndex = 0): Promise<{ buffer: Buffer; model: string } | null> {
    if (modelIndex >= MODEL_CHAIN.length) return null
    const model = MODEL_CHAIN[modelIndex]!

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const response = await genai.models.generateContent({
                model,
                contents: prompt,
                config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
            })

            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData?.mimeType?.startsWith('image/')) {
                    return {
                        buffer: Buffer.from(part.inlineData.data!, 'base64'),
                        model,
                    }
                }
            }
            // No image returned — retry once then fallback
        } catch (err: any) {
            const msg = err?.message || String(err)
            if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
                console.log(`    ⏳ ${model} rate limited → fallback`)
                return generateImage(prompt, modelIndex + 1)
            }
            if (msg.includes('404')) {
                console.log(`    ⚠️ ${model} not found → fallback`)
                return generateImage(prompt, modelIndex + 1)
            }
            if (msg.includes('503') || msg.includes('UNAVAILABLE')) {
                console.log(`    ⚠️ ${model} unavailable, retrying in 5s...`)
                await sleep(5000)
                continue
            }
            console.error(`    ❌ ${model}: ${msg.slice(0, 100)}`)
        }
    }

    return generateImage(prompt, modelIndex + 1)
}

// ──── Data Types ────

interface WordData {
    word: string
    meaningEn: string
    meaningVi?: string
    wordType: string
    imageUrl?: string | null
    [key: string]: unknown
}

interface ThemeData {
    theme: { slug: string; name: string;[key: string]: unknown }
    words: WordData[]
}

// ──── Core Processing ────

interface Stats {
    generated: number
    failed: number
    skipped: number
    jsonUpdated: number
    batchLimitReached: boolean
}

async function processTheme(
    level: CefrLevel,
    themeFile: string,
    stats: Stats,
): Promise<void> {
    const vocabDir = path.join(CONTENT_BASE, level, 'vocabulary')
    const filePath = path.join(vocabDir, themeFile)
    const data: ThemeData = JSON.parse(readFileSync(filePath, 'utf8'))
    const themeSlug = data.theme.slug
    const destDir = path.join(IMG_BASE, themeSlug)
    mkdirSync(destDir, { recursive: true })

    let jsonDirty = false

    for (let i = 0; i < data.words.length; i++) {
        if (batchLimit > 0 && stats.generated >= batchLimit) {
            stats.batchLimitReached = true
            break
        }

        const w = data.words[i]!
        const slug = slugify(w.word)
        const destPath = path.join(destDir, `${slug}.png`)
        const imageUrl = `/images/vocab/${themeSlug}/${slug}.png`

        // Already exists on disk
        if (existsSync(destPath)) {
            if (w.imageUrl !== imageUrl) {
                w.imageUrl = imageUrl
                jsonDirty = true
            }
            stats.skipped++
            continue
        }

        if (dryRun) {
            console.log(`    📝 ${w.word} → ${themeSlug}/${slug}.png`)
            stats.generated++
            continue
        }

        // Generate
        const meaning = w.meaningVi || w.meaningEn || ''
        const prompt = buildPrompt(w.word, meaning, w.wordType)
        const result = await generateImage(prompt)

        if (result) {
            writeFileSync(destPath, result.buffer)
            w.imageUrl = imageUrl
            jsonDirty = true
            console.log(`    ✅ ${w.word} → ${slug}.png (${(result.buffer.length / 1024).toFixed(0)}KB) [${result.model.split('-').slice(-2).join('-')}]`)
            stats.generated++
            logProgress(`✅ ${level.toUpperCase()} | ${themeSlug} | ${w.word} → ${slug}.png | ${result.model}`)
        } else {
            console.log(`    ❌ ${w.word} — all models failed`)
            stats.failed++
            logProgress(`❌ ${level.toUpperCase()} | ${themeSlug} | ${w.word} — FAILED`)
        }

        // Rate limit delay
        if (i < data.words.length - 1) {
            await sleep(delayMs)
        }
    }

    // Save updated JSON
    if (jsonDirty && !dryRun) {
        writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n')
    }
    if (jsonDirty) stats.jsonUpdated++
}

// ──── Main ────

async function main(): Promise<void> {
    const startTime = Date.now()

    console.log('🦊 Fuxie — Unified Vocabulary Image Generator')
    console.log('═══════════════════════════════════════════════')
    console.log(`Models: ${MODEL_CHAIN.join(' → ')}`)
    console.log(`Delay:  ${delayMs}ms between requests`)
    if (batchLimit > 0) console.log(`Batch:  max ${batchLimit} images`)
    if (levelFilter) console.log(`Level:  ${levelFilter.toUpperCase()} only`)
    if (startFrom) console.log(`Start:  from theme "${startFrom}"`)
    if (dryRun) console.log('🏃 DRY RUN — no images will be generated')
    console.log('')

    logProgress(`=== RUN START === batch=${batchLimit} level=${levelFilter || 'all'} start=${startFrom || 'begin'} dryRun=${dryRun}`)

    const stats: Stats = { generated: 0, failed: 0, skipped: 0, jsonUpdated: 0, batchLimitReached: false }
    const levels = levelFilter ? [levelFilter] : [...LEVELS]
    let passedStart = !startFrom

    for (const level of levels) {
        const vocabDir = path.join(CONTENT_BASE, level, 'vocabulary')
        if (!existsSync(vocabDir)) continue

        const files = readdirSync(vocabDir).filter(f => f.endsWith('.json')).sort()

        // Count missing for this level
        let levelMissing = 0
        for (const file of files) {
            const data: ThemeData = JSON.parse(readFileSync(path.join(vocabDir, file), 'utf8'))
            const themeSlug = data.theme.slug
            for (const w of data.words) {
                const slug = slugify(w.word)
                if (!existsSync(path.join(IMG_BASE, themeSlug, `${slug}.png`))) {
                    levelMissing++
                }
            }
        }

        console.log(`\n📚 ${level.toUpperCase()} — ${files.length} themes, ~${levelMissing} missing images`)
        console.log('─'.repeat(50))

        if (levelMissing === 0) {
            console.log('  ✅ All images exist, skipping.')
            continue
        }

        for (const file of files) {
            if (stats.batchLimitReached) break

            const data: ThemeData = JSON.parse(readFileSync(path.join(vocabDir, file), 'utf8'))
            const themeSlug = data.theme.slug

            // Handle --start filter
            if (!passedStart) {
                if (themeSlug.includes(startFrom!) || file.includes(startFrom!)) {
                    passedStart = true
                } else {
                    continue
                }
            }

            // Check if this theme has any missing images
            const missingCount = data.words.filter(w => {
                const slug = slugify(w.word)
                return !existsSync(path.join(IMG_BASE, themeSlug, `${slug}.png`))
            }).length

            if (missingCount === 0) continue

            console.log(`\n  📂 ${data.theme.name} — ${missingCount}/${data.words.length} missing`)

            await processTheme(level, file, stats)
        }

        if (stats.batchLimitReached) {
            console.log(`\n⏸️  Batch limit reached (${batchLimit}). Run again to continue.`)
            break
        }
    }

    const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)

    console.log('\n═══════════════════════════════════════════════')
    console.log('📊 SUMMARY:')
    console.log(`  ✅ Generated: ${stats.generated}`)
    console.log(`  ❌ Failed:    ${stats.failed}`)
    console.log(`  ⏭️  Skipped:   ${stats.skipped}`)
    console.log(`  📝 JSON updated: ${stats.jsonUpdated} files`)
    console.log(`  ⏱️  Time: ${elapsed} minutes`)
    if (stats.batchLimitReached) {
        console.log(`  ⏸️  Batch limit: ${batchLimit} (run again to continue)`)
    }
    console.log('\n🦊 Done!')

    logProgress(`=== RUN END === generated=${stats.generated} failed=${stats.failed} skipped=${stats.skipped} time=${elapsed}min`)
}

main().catch(err => {
    console.error('💥 Fatal error:', err)
    logProgress(`💥 FATAL: ${err.message}`)
    process.exit(1)
})
