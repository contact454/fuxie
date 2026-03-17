/**
 * Batch TTS Audio Generation for Fuxie A1 Vocabulary
 * 
 * Generates pronunciation audio for all A1 vocabulary words using
 * Google Cloud Text-to-Speech (de-DE-Wavenet), uploads to GCS,
 * and updates the database audioUrl field.
 * 
 * Usage:
 *   npx tsx scripts/generate-vocabulary-audio.ts [--dry-run] [--limit N]
 * 
 * Prerequisites:
 *   - GOOGLE_APPLICATION_CREDENTIALS set or gcloud auth configured
 *   - Cloud SQL accessible (directly or via proxy)
 *   - GCS bucket "fuxie-audio" exists
 */

import { PrismaClient } from '@prisma/client'
import { TextToSpeechClient } from '@google-cloud/text-to-speech'
import { Storage } from '@google-cloud/storage'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'

// ===== CONFIG =====
const GCS_BUCKET = process.env.GCS_BUCKET_AUDIO || 'fuxie-audio'
const VOICE_NAME = 'de-DE-Wavenet-D' // Male German Hochdeutsch
const AUDIO_ENCODING = 'MP3' as const
const SPEAKING_RATE = 0.85 // Slightly slower for learners
const BATCH_SIZE = 10 // Process in batches to avoid rate limits
const DELAY_MS = 500 // Delay between batches

// ===== ARGS =====
const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit'))
const LIMIT = limitArg ? parseInt(args[args.indexOf(limitArg) + 1] || '0') : 0

// ===== CLIENTS =====
const prisma = new PrismaClient()
const ttsClient = new TextToSpeechClient()
const storage = new Storage()
const bucket = storage.bucket(GCS_BUCKET)

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

interface VocabWord {
    id: string
    word: string
    article: string | null
    audioUrl: string | null
    theme: { slug: string } | null
}

async function generateAudio(text: string): Promise<Buffer> {
    const [response] = await ttsClient.synthesizeSpeech({
        input: { text },
        voice: {
            languageCode: 'de-DE',
            name: VOICE_NAME,
        },
        audioConfig: {
            audioEncoding: AUDIO_ENCODING,
            speakingRate: SPEAKING_RATE,
            pitch: 0,
        },
    })

    if (!response.audioContent) {
        throw new Error(`TTS returned empty audio for: ${text}`)
    }

    return Buffer.from(response.audioContent as Uint8Array)
}

async function uploadToGCS(buffer: Buffer, gcsPath: string): Promise<string> {
    const file = bucket.file(gcsPath)
    await file.save(buffer, {
        metadata: {
            contentType: 'audio/mpeg',
            cacheControl: 'public, max-age=31536000', // 1 year cache
        },
    })
    // Bucket uses uniform bucket-level access — IAM handles public read
    return `https://storage.googleapis.com/${GCS_BUCKET}/${gcsPath}`
}

// ===== MAIN =====
async function main() {
    console.log('🦊 Fuxie TTS Audio Generator')
    console.log('============================')
    console.log(`Bucket: ${GCS_BUCKET}`)
    console.log(`Voice: ${VOICE_NAME}`)
    console.log(`Mode: ${DRY_RUN ? '🔍 DRY RUN' : '🔴 LIVE'}`)
    if (LIMIT) console.log(`Limit: ${LIMIT}`)
    console.log('')

    // Get words without audio
    const words = await prisma.vocabularyItem.findMany({
        where: {
            cefrLevel: 'A1',
            audioUrl: null,
        },
        orderBy: [{ theme: { sortOrder: 'asc' } }, { word: 'asc' }],
        take: LIMIT || undefined,
        select: {
            id: true,
            word: true,
            article: true,
            audioUrl: true,
            theme: { select: { slug: true } },
        },
    })

    const total = words.length
    console.log(`📊 Found ${total} words without audio`)

    if (total === 0) {
        console.log('✅ All words already have audio!')
        return
    }

    // Process in batches
    let success = 0
    let failed = 0
    const errors: Array<{ word: string; error: string }> = []

    for (let i = 0; i < words.length; i += BATCH_SIZE) {
        const batch = words.slice(i, i + BATCH_SIZE)
        console.log(`\n📦 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(total / BATCH_SIZE)} (${batch.length} words)`)

        const promises = batch.map(async (word) => {
            const themeSlug = word.theme?.slug || 'other'
            const wordSlug = slugify(word.word)
            const gcsPath = `a1/${themeSlug}/${wordSlug}.mp3`

            // What to speak: article + word (for nouns)
            const articleMap: Record<string, string> = {
                MASKULIN: 'der', FEMININ: 'die', NEUTRUM: 'das',
            }
            const spokenText = word.article && articleMap[word.article]
                ? `${articleMap[word.article]} ${word.word}`
                : word.word

            try {
                if (DRY_RUN) {
                    console.log(`  🔍 [DRY] ${spokenText} → gs://${GCS_BUCKET}/${gcsPath}`)
                    return
                }

                // Generate audio
                const audioBuffer = await generateAudio(spokenText)

                // Upload to GCS
                const publicUrl = await uploadToGCS(audioBuffer, gcsPath)

                // Update DB
                await prisma.vocabularyItem.update({
                    where: { id: word.id },
                    data: { audioUrl: publicUrl },
                })

                console.log(`  ✅ ${spokenText} → ${publicUrl}`)
                success++
            } catch (err) {
                const errorMsg = err instanceof Error ? err.message : String(err)
                console.error(`  ❌ ${spokenText}: ${errorMsg}`)
                errors.push({ word: word.word, error: errorMsg })
                failed++
            }
        })

        await Promise.all(promises)

        // Rate limit delay between batches
        if (i + BATCH_SIZE < words.length) {
            await sleep(DELAY_MS)
        }
    }

    // Summary
    console.log('\n============================')
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
