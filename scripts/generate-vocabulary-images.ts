/**
 * Batch Image Generation for Fuxie A1 Vocabulary
 * 
 * Generates flat illustration images for all A1 concrete nouns using
 * Google Gemini Imagen API, uploads to GCS, and updates the database.
 * 
 * Usage:
 *   npx tsx scripts/generate-vocabulary-images.ts [--dry-run] [--limit N] [--theme SLUG]
 * 
 * Prerequisites:
 *   - GOOGLE_APPLICATION_CREDENTIALS or gcloud ADC configured
 *   - GCS bucket "fuxie-audio" exists (reusing same bucket for media)
 */

import { PrismaClient } from '@prisma/client'
import { Storage } from '@google-cloud/storage'
import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'

// ===== CONFIG =====
const GCS_BUCKET = process.env.GCS_BUCKET_AUDIO || 'fuxie-audio'
const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT || 'dmf-elearning'
const BATCH_SIZE = 5 // Small batch for image gen (slower than TTS)
const DELAY_MS = 2000 // 2s between batches to avoid rate limits

// ===== ARGS =====
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const limitIdx = args.indexOf('--limit')
const LIMIT = limitIdx !== -1 ? parseInt(args[limitIdx + 1] || '0') : 0
const themeIdx = args.indexOf('--theme')
const THEME_FILTER = themeIdx !== -1 ? args[themeIdx + 1] : undefined

// ===== CLIENTS =====
const prisma = new PrismaClient()
const storage = new Storage()
const bucket = storage.bucket(GCS_BUCKET)

// Initialize Gemini with API key from env or ADC
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

// ===== HELPERS =====
function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function buildPrompt(word: string, meaningVi: string): string {
    return `Create a simple, cute flat design illustration of "${word}" (${meaningVi}) for a language learning flashcard. 
Style: Clean flat vector illustration, minimal details, soft pastel colors, white/transparent background, no text, no border. 
Similar to Duolingo illustration style. Single centered object, 256x256 scale.`
}

interface VocabWord {
    id: string
    word: string
    article: string | null
    meaningVi: string
    imageUrl: string | null
    theme: { slug: string; name: string } | null
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

        // Extract image from response
        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.mimeType?.startsWith('image/')) {
                    return Buffer.from(part.inlineData.data!, 'base64')
                }
            }
        }
        return null
    } catch (err) {
        console.error(`  Image gen error: ${err instanceof Error ? err.message : err}`)
        return null
    }
}

async function uploadToGCS(buffer: Buffer, gcsPath: string): Promise<string> {
    const file = bucket.file(gcsPath)
    await file.save(buffer, {
        metadata: {
            contentType: 'image/png',
            cacheControl: 'public, max-age=31536000',
        },
    })
    return `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`
}

// ===== MAIN =====
async function main() {
    console.log('🦊 Fuxie Vocabulary Image Generator')
    console.log('====================================')
    console.log(`Bucket: ${GCS_BUCKET}`)
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '🔴 LIVE'}`)
    if (LIMIT) console.log(`Limit: ${LIMIT}`)
    if (THEME_FILTER) console.log(`Theme: ${THEME_FILTER}`)
    console.log('')

    // Build where clause
    const where: Record<string, unknown> = {
        cefrLevel: 'A1',
        wordType: 'NOMEN',
        imageUrl: null,
    }
    if (THEME_FILTER) {
        where.theme = { slug: THEME_FILTER }
    }

    const words = await prisma.vocabularyItem.findMany({
        where: where as any,
        orderBy: [{ theme: { sortOrder: 'asc' } }, { word: 'asc' }],
        take: LIMIT || undefined,
        select: {
            id: true,
            word: true,
            article: true,
            meaningVi: true,
            imageUrl: true,
            theme: { select: { slug: true, name: true } },
        },
    })

    const total = words.length
    console.log(`📊 Found ${total} nouns without images`)

    if (total === 0) {
        console.log('✅ All nouns already have images!')
        return
    }

    let success = 0
    let failed = 0
    const errors: Array<{ word: string; error: string }> = []

    for (let i = 0; i < words.length; i += BATCH_SIZE) {
        const batch = words.slice(i, i + BATCH_SIZE)
        console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(total / BATCH_SIZE)} (${batch.length} words)`)

        for (const word of batch) {
            const themeSlug = word.theme?.slug || 'other'
            const wordSlug = slugify(word.word)
            const gcsPath = `images/a1/${themeSlug}/${wordSlug}.png`
            const prompt = buildPrompt(word.word, word.meaningVi)

            if (DRY_RUN) {
                console.log(`  🔍 [DRY] ${word.word} → gs://${GCS_BUCKET}/${gcsPath}`)
                continue
            }

            try {
                // Generate image
                const imageBuffer = await generateImage(prompt)
                if (!imageBuffer) {
                    console.log(`  ⚠️ ${word.word}: No image generated (skipped)`)
                    failed++
                    errors.push({ word: word.word, error: 'No image in response' })
                    continue
                }

                // Upload to GCS
                const publicUrl = await uploadToGCS(imageBuffer, gcsPath)

                // Update DB
                await prisma.vocabularyItem.update({
                    where: { id: word.id },
                    data: { imageUrl: publicUrl },
                })

                console.log(`  ✅ ${word.word} → ${publicUrl}`)
                success++
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err)
                console.error(`  ❌ ${word.word}: ${errorMsg}`)
                errors.push({ word: word.word, error: errorMsg })
                failed++
            }

            // Small delay between individual image generations
            await sleep(500)
        }

        // Delay between batches
        if (i + BATCH_SIZE < words.length) {
            await sleep(DELAY_MS)
        }
    }

    // Summary
    console.log('\n====================================')
    console.log('📊 Summary:')
    console.log(`  Total: ${total}`)
    if (!DRY_RUN) {
        console.log(`  ✅ Success: ${success}`)
        console.log(`  ❌ Failed: ${failed}`)
    }

    if (errors.length > 0) {
        console.log('\n❌ Failed words:')
        errors.forEach(e => console.log(`  - ${e.word}: ${e.error}`))
    }

    console.log('\n🦊 Done!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
