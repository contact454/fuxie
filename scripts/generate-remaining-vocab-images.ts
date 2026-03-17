/**
 * Generate remaining vocabulary images for Wohnen & Umwelt themes
 * Uses Gemini API directly (bypasses tool quota)
 *
 * Usage:
 *   npx tsx scripts/generate-remaining-vocab-images.ts
 */

import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

// Load env from apps/web/.env
dotenv.config({ path: path.join(__dirname, '..', 'apps', 'web', '.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found in env')
    process.exit(1)
}

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

const BASE_DIR = path.join(__dirname, '..', 'apps', 'web', 'public', 'images', 'vocab')

// Remaining Wohnen words (16)
const WOHNEN_REMAINING = [
    { word: 'Lampe', slug: 'lampe', meaning: 'lamp, light' },
    { word: 'Kühlschrank', slug: 'kuehlschrank', meaning: 'refrigerator' },
    { word: 'Garten', slug: 'garten', meaning: 'garden' },
    { word: 'Balkon', slug: 'balkon', meaning: 'balcony' },
    { word: 'Miete', slug: 'miete', meaning: 'rent payment' },
    { word: 'Stock', slug: 'stock', meaning: 'floor/story of a building' },
    { word: 'Erdgeschoss', slug: 'erdgeschoss', meaning: 'ground floor' },
    { word: 'hell', slug: 'hell', meaning: 'bright room with sunlight' },
    { word: 'dunkel', slug: 'dunkel', meaning: 'dark room' },
    { word: 'ruhig', slug: 'ruhig', meaning: 'quiet and peaceful' },
    { word: 'laut', slug: 'laut', meaning: 'loud and noisy' },
    { word: 'sauber', slug: 'sauber', meaning: 'clean and tidy' },
    { word: 'Schlüssel', slug: 'schluessel', meaning: 'key' },
    { word: 'Treppe', slug: 'treppe', meaning: 'stairs/staircase' },
    { word: 'Aufzug', slug: 'aufzug', meaning: 'elevator/lift' },
    { word: 'Möbel', slug: 'moebel', meaning: 'furniture' },
]

// All Umwelt words (25)
const UMWELT_WORDS = [
    { word: 'Park', slug: 'park', meaning: 'park with trees and benches' },
    { word: 'Platz', slug: 'platz', meaning: 'town square/plaza' },
    { word: 'Brücke', slug: 'bruecke', meaning: 'bridge over water' },
    { word: 'Kirche', slug: 'kirche', meaning: 'church building' },
    { word: 'Museum', slug: 'museum', meaning: 'museum building' },
    { word: 'Rathaus', slug: 'rathaus', meaning: 'town hall building' },
    { word: 'Hund', slug: 'hund', meaning: 'dog' },
    { word: 'Katze', slug: 'katze', meaning: 'cat' },
    { word: 'Tier', slug: 'tier', meaning: 'animal' },
    { word: 'Baum', slug: 'baum', meaning: 'tree' },
    { word: 'Blume', slug: 'blume', meaning: 'flower' },
    { word: 'Wetter', slug: 'wetter', meaning: 'weather with sun and clouds' },
    { word: 'Sonne', slug: 'sonne', meaning: 'sun shining' },
    { word: 'Regen', slug: 'regen', meaning: 'rain falling' },
    { word: 'Schnee', slug: 'schnee', meaning: 'snow falling' },
    { word: 'kalt', slug: 'kalt', meaning: 'cold weather, person shivering' },
    { word: 'warm', slug: 'warm', meaning: 'warm weather, comfortable' },
    { word: 'heiß', slug: 'heiss', meaning: 'hot weather, sun blazing' },
    { word: 'schön', slug: 'schoen', meaning: 'beautiful scenery' },
    { word: 'Natur', slug: 'natur', meaning: 'nature landscape' },
    { word: 'Fluss', slug: 'fluss', meaning: 'river flowing' },
    { word: 'See', slug: 'see', meaning: 'lake with mountains' },
    { word: 'Berg', slug: 'berg', meaning: 'mountain' },
    { word: 'Meer', slug: 'meer', meaning: 'sea/ocean' },
    { word: 'Wald', slug: 'wald', meaning: 'forest with trees' },
]

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function buildPrompt(word: string, meaning: string): string {
    return `Create a simple, cute flat design illustration of "${word}" (${meaning}) for a language learning flashcard. 
Style: Clean flat vector illustration, minimal details, soft pastel colors, white/transparent background, no text, no border. 
Similar to Duolingo illustration style. Single centered object, 256x256 scale.`
}

async function generateImage(prompt: string): Promise<Buffer | null> {
    try {
        const response = await genai.models.generateContent({
            model: 'gemini-2.0-flash-exp-image-generation',
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
        return null
    } catch (err) {
        console.error(`  ❌ Image gen error: ${err instanceof Error ? err.message : err}`)
        return null
    }
}

async function processWords(words: Array<{ word: string; slug: string; meaning: string }>, themeSlug: string) {
    const destDir = path.join(BASE_DIR, themeSlug)
    mkdirSync(destDir, { recursive: true })

    let success = 0
    let failed = 0

    for (let i = 0; i < words.length; i++) {
        const { word, slug, meaning } = words[i]
        const destPath = path.join(destDir, `${slug}.png`)

        // Skip if already exists
        if (existsSync(destPath)) {
            console.log(`  ⏭️ ${word} (${slug}.png) — already exists, skipping`)
            success++
            continue
        }

        console.log(`  [${i + 1}/${words.length}] Generating ${word}...`)
        const prompt = buildPrompt(word, meaning)
        const imageBuffer = await generateImage(prompt)

        if (imageBuffer) {
            writeFileSync(destPath, imageBuffer)
            console.log(`  ✅ ${word} → ${slug}.png (${(imageBuffer.length / 1024).toFixed(0)}KB)`)
            success++
        } else {
            console.log(`  ⚠️ ${word} — no image generated, skipping`)
            failed++
        }

        // Delay between requests to avoid rate limit
        if (i < words.length - 1) {
            await sleep(1500)
        }
    }

    return { success, failed }
}

async function main() {
    console.log('🦊 Fuxie Vocabulary Image Generator (Gemini API)')
    console.log('================================================')
    console.log(`API Key: ${GEMINI_API_KEY.substring(0, 10)}...`)
    console.log(`Output: ${BASE_DIR}`)
    console.log('')

    // --- Wohnen remaining ---
    console.log('🏠 Theme: Wohnen (a1-wohnen) — 16 remaining words')
    console.log('---')
    const wohnenResult = await processWords(WOHNEN_REMAINING, 'a1-wohnen')
    console.log(`\n  Wohnen: ✅ ${wohnenResult.success} | ❌ ${wohnenResult.failed}`)

    console.log('')

    // --- Umwelt all ---
    console.log('🌳 Theme: Umwelt (a1-umwelt) — 25 words')
    console.log('---')
    const umweltResult = await processWords(UMWELT_WORDS, 'a1-umwelt')
    console.log(`\n  Umwelt: ✅ ${umweltResult.success} | ❌ ${umweltResult.failed}`)

    // Summary
    console.log('\n================================================')
    console.log('📊 Total:')
    console.log(`  ✅ Success: ${wohnenResult.success + umweltResult.success}`)
    console.log(`  ❌ Failed: ${wohnenResult.failed + umweltResult.failed}`)
    console.log('\n🦊 Done!')
}

main().catch(console.error)
