/**
 * Generate Theme Images for Fuxie Vocabulary Themes
 * 
 * Generates illustrated circular icons for each vocabulary theme using
 * Google Gemini Imagen API, uploads to GCS, and updates the database.
 * 
 * Usage:
 *   npx tsx scripts/generate-theme-images.ts [--dry-run]
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { Storage } from '@google-cloud/storage'
import { GoogleGenAI, Modality } from '@google/genai'

// ===== CONFIG =====
const GCS_BUCKET = process.env.GCS_BUCKET_AUDIO || 'fuxie-audio'
const DELAY_MS = 3000

// ===== ARGS =====
const DRY_RUN = process.argv.includes('--dry-run')

// ===== CLIENTS =====
const prisma = new PrismaClient()
const storage = new Storage()
const bucket = storage.bucket(GCS_BUCKET)
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || ''
const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// Theme-specific prompts for better results
const THEME_PROMPTS: Record<string, string> = {
    'a1-person': 'a friendly person standing and waving, wearing casual clothes',
    'a1-familie-freunde': 'a happy family with parents and children together, warm and cozy',
    'a1-koerper-gesundheit': 'a healthy human body outline with a heart and medical symbols',
    'a1-wohnen': 'a cozy house with a door, windows, and a small garden',
    'a1-umwelt': 'nature scene with a tree, sun, and clouds',
    'a1-essen-trinken': 'a plate of food with bread, vegetables and a glass of water',
    'a1-einkaufen': 'a shopping cart with some items and shopping bags',
    'a1-dienstleistungen': 'a post office or bank building with service counter',
    'a1-ausbildung-lernen': 'a school desk with books, notebook and pencil',
    'a1-arbeit-beruf': 'a briefcase and office desk with a computer',
    'a1-freizeit': 'a soccer ball, music notes, and a book for leisure time',
    'a1-kommunikation': 'a speech bubble, telephone and letter envelope',
    'a1-reisen-verkehr': 'a train, bus and road signs for travel and transport',
    'a1-zeitangaben': 'a clock face, calendar and hourglass for time expressions',
}

function buildThemePrompt(slug: string, name: string): string {
    const specific = THEME_PROMPTS[slug] || name
    return `Create a cute, simple flat design circular icon illustration for a German language learning app theme called "${name}". 
Show: ${specific}. 
Style: Clean flat vector illustration, Duolingo-style, soft pastel colors with blue (#5B9BD5) and orange (#FF6B35) accent tones, white/transparent background, no text, no border. 
The illustration should be contained within a soft circle shape. 256x256 scale.`
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
    console.log('🦊 Fuxie Theme Image Generator')
    console.log('================================')
    console.log(`Bucket: ${GCS_BUCKET}`)
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '🔴 LIVE'}`)
    console.log('')

    const themes = await prisma.vocabularyTheme.findMany({
        where: { imageUrl: null },
        select: { id: true, name: true, slug: true, nameVi: true },
        orderBy: { sortOrder: 'asc' },
    })

    console.log(`📊 Found ${themes.length} themes without images\n`)

    if (themes.length === 0) {
        console.log('✅ All themes already have images!')
        return
    }

    let success = 0
    let failed = 0

    for (const theme of themes) {
        const gcsPath = `images/themes/${theme.slug}.png`
        const prompt = buildThemePrompt(theme.slug, theme.name)

        if (DRY_RUN) {
            console.log(`🔍 [DRY] ${theme.name} (${theme.slug}) → gs://${GCS_BUCKET}/${gcsPath}`)
            console.log(`   Prompt: ${prompt.substring(0, 100)}...`)
            continue
        }

        try {
            console.log(`🎨 Generating: ${theme.name} (${theme.slug})...`)
            const imageBuffer = await generateImage(prompt)
            if (!imageBuffer) {
                console.log(`  ⚠️ ${theme.name}: No image generated (skipped)`)
                failed++
                continue
            }

            const publicUrl = await uploadToGCS(imageBuffer, gcsPath)

            await prisma.vocabularyTheme.update({
                where: { id: theme.id },
                data: { imageUrl: publicUrl },
            })

            console.log(`  ✅ ${theme.name} → ${publicUrl}`)
            success++
        } catch (err) {
            console.error(`  ❌ ${theme.name}: ${err instanceof Error ? err.message : err}`)
            failed++
        }

        await sleep(DELAY_MS)
    }

    console.log('\n================================')
    console.log('📊 Summary:')
    console.log(`  Total: ${themes.length}`)
    if (!DRY_RUN) {
        console.log(`  ✅ Success: ${success}`)
        console.log(`  ❌ Failed: ${failed}`)
    }
    console.log('\n🦊 Done!')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
