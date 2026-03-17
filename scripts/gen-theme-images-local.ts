/**
 * Generate Theme Images (Local) — Saves to apps/web/public/images/themes/
 *
 * Scans all vocabulary JSON files, checks for missing theme images in
 * apps/web/public/images/themes/, and generates them using Gemini.
 *
 * Usage:
 *   npx tsx scripts/gen-theme-images-local.ts              # all missing
 *   npx tsx scripts/gen-theme-images-local.ts --dry-run     # preview
 *   npx tsx scripts/gen-theme-images-local.ts --level=c1    # specific level
 */

import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync, readdirSync, readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
if (!GEMINI_API_KEY) { console.error('❌ GEMINI_API_KEY not found'); process.exit(1) }

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const CONTENT_DIR = path.join(__dirname, '..', 'content')
const IMAGES_DIR = path.join(__dirname, '..', 'apps', 'web', 'public', 'images', 'themes')
const DELAY_MS = 4000

const args = process.argv.slice(2)
const DRY_RUN = args.includes('--dry-run')
const levelFilter = args.find(a => a.startsWith('--level='))?.split('=')[1]

function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

interface ThemeInfo { slug: string; name: string; nameEn: string; level: string }

function scanMissingThemes(): ThemeInfo[] {
    mkdirSync(IMAGES_DIR, { recursive: true })
    const existingImages = new Set(
        readdirSync(IMAGES_DIR).filter(f => f.endsWith('.png')).map(f => f.replace('.png', ''))
    )

    const levels = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2']
    const missing: ThemeInfo[] = []

    for (const level of levels) {
        if (levelFilter && level !== levelFilter) continue
        const vocabDir = path.join(CONTENT_DIR, level, 'vocabulary')
        if (!existsSync(vocabDir)) continue

        const files = readdirSync(vocabDir).filter(f => f.endsWith('.json'))
        for (const file of files) {
            try {
                const data = JSON.parse(readFileSync(path.join(vocabDir, file), 'utf8'))
                const slug = data.theme?.slug
                if (!slug) continue
                if (existingImages.has(slug)) continue
                missing.push({
                    slug,
                    name: data.theme.name || slug,
                    nameEn: data.theme.nameEn || data.theme.name || slug,
                    level: level.toUpperCase(),
                })
            } catch { /* skip invalid files */ }
        }
    }

    return missing
}

function buildPrompt(theme: ThemeInfo): string {
    return `Create a cute, simple flat design circular icon illustration for a German language learning app theme called "${theme.name}" (${theme.nameEn}).
Style: Clean kawaii flat vector illustration, soft pastel colors with blue (#5B9BD5) and orange (#FF6B35) accents, white background, no text, no border, no frame.
The illustration should clearly represent the theme "${theme.nameEn}" with recognizable objects/symbols.
Size: 256x256 scale, contained within a soft circle shape.`
}

async function generateImage(prompt: string): Promise<Buffer | null> {
    const models = [
        'gemini-2.0-flash-exp-image-generation',
        'gemini-2.5-flash-preview-04-17',
    ]

    for (const model of models) {
        try {
            const response = await genai.models.generateContent({
                model,
                contents: prompt,
                config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
            })

            if (response.candidates?.[0]?.content?.parts) {
                for (const part of response.candidates[0].content.parts) {
                    if (part.inlineData?.mimeType?.startsWith('image/')) {
                        return Buffer.from(part.inlineData.data!, 'base64')
                    }
                }
            }
        } catch (err: any) {
            if (models.indexOf(model) < models.length - 1) {
                console.log(`    ⚠️ ${model} failed, trying next...`)
                continue
            }
            console.error(`    ❌ All models failed: ${err.message?.substring(0, 200)}`)
        }
    }
    return null
}

async function main() {
    console.log('🖼️  Theme Image Generator (Local)')
    console.log('='.repeat(40))
    if (DRY_RUN) console.log('🔍 DRY RUN')
    if (levelFilter) console.log(`🎯 Level: ${levelFilter.toUpperCase()}`)

    const missing = scanMissingThemes()
    console.log(`\n📊 Missing: ${missing.length} theme images\n`)

    if (missing.length === 0) { console.log('✅ All themes have images!'); return }

    // Group by level for display
    const byLevel: Record<string, number> = {}
    for (const t of missing) { byLevel[t.level] = (byLevel[t.level] || 0) + 1 }
    for (const [level, count] of Object.entries(byLevel)) {
        console.log(`  ${level}: ${count} missing`)
    }
    console.log('')

    let success = 0, failed = 0

    for (let i = 0; i < missing.length; i++) {
        const theme = missing[i]
        const imgPath = path.join(IMAGES_DIR, `${theme.slug}.png`)

        if (DRY_RUN) {
            console.log(`  🔍 [${i + 1}/${missing.length}] ${theme.level} ${theme.name} → ${theme.slug}.png`)
            continue
        }

        console.log(`  🎨 [${i + 1}/${missing.length}] ${theme.level} ${theme.name}`)
        const prompt = buildPrompt(theme)
        const buffer = await generateImage(prompt)

        if (buffer) {
            writeFileSync(imgPath, buffer)
            console.log(`    ✅ → ${theme.slug}.png (${(buffer.length / 1024).toFixed(0)}KB)`)
            success++
        } else {
            console.log(`    ❌ No image generated`)
            failed++
        }

        await sleep(DELAY_MS)
    }

    console.log(`\n${'='.repeat(40)}`)
    console.log(`📊 ✅ ${success} | ❌ ${failed} | Total: ${missing.length}`)
    console.log('🦊 Done!')
}

main().catch(console.error)
