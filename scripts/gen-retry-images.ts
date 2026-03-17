/**
 * Retry missing images with longer delay to avoid rate limits
 * Scans all JSON files for words without imageUrl and generates images
 */
import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), 'apps', 'web', '.env') })

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
const DELAY = 8000 // 8 seconds between requests

function slugify(word: string): string {
    return word
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
}

async function generateImage(word: string, meaning: string, outDir: string): Promise<{ slug: string; ok: boolean }> {
    const slug = slugify(word)
    const dest = path.join(outDir, `${slug}.png`)

    if (existsSync(dest)) {
        return { slug, ok: true }
    }

    const prompt = `Create a simple, cute flat design illustration representing "${word}" (${meaning}) for a German language learning flashcard. Style: Clean flat vector illustration, minimal details, soft pastel colors, white/transparent background, no text, no border. Similar to Duolingo illustration style. Single centered object, 256x256 scale.`

    try {
        const r = await genai.models.generateContent({
            model: 'gemini-2.0-flash-exp-image-generation',
            contents: prompt,
            config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
        })

        for (const p of r.candidates?.[0]?.content?.parts || []) {
            if (p.inlineData?.mimeType?.startsWith('image/')) {
                const buf = Buffer.from(p.inlineData.data!, 'base64')
                writeFileSync(dest, buf)
                console.log(`  ✅ ${word} → ${slug}.png (${(buf.length / 1024).toFixed(0)}KB)`)
                return { slug, ok: true }
            }
        }
        console.log(`  ⚠️ ${word} — no image in response`)
        return { slug, ok: false }
    } catch (e: any) {
        if (e.message?.includes('429')) {
            console.log(`  🛑 ${word} — RATE LIMITED, stopping batch`)
            return { slug, ok: false }
        }
        console.log(`  ⚠️ ${word} — ${e.message?.slice(0, 80)}`)
        return { slug, ok: false }
    }
}

async function main() {
    console.log('🦊 Retry Missing Images (8s delay)\n')

    const vocabDir = 'content/a1/vocabulary'
    const files = readdirSync(vocabDir).filter(f => f.endsWith('.json')).sort()

    let totalOk = 0, totalFail = 0

    for (const file of files) {
        const data = JSON.parse(readFileSync(path.join(vocabDir, file), 'utf8'))
        const themeSlug = data.theme.slug
        const imgDir = `apps/web/public/images/vocab/${themeSlug}`
        mkdirSync(imgDir, { recursive: true })

        const wordsNeedingImages = data.words.filter((w: any) => !w.imageUrl)
        if (wordsNeedingImages.length === 0) continue

        console.log(`📌 ${data.theme.name} — ${wordsNeedingImages.length} missing`)

        let rateLimited = false
        for (let i = 0; i < wordsNeedingImages.length; i++) {
            const w = wordsNeedingImages[i]
            const { slug, ok } = await generateImage(w.word, w.meaningVi || w.meaningEn, imgDir)
            if (ok) {
                const origWord = data.words.find((dw: any) => dw.word === w.word)
                if (origWord) origWord.imageUrl = `/images/vocab/${themeSlug}/${slug}.png`
                totalOk++
            } else {
                totalFail++
                if (!ok && !existsSync(path.join(imgDir, `${slug}.png`))) {
                    // check if rate limited
                    rateLimited = true
                }
            }
            if (i < wordsNeedingImages.length - 1) {
                console.log(`    ⏳ waiting ${DELAY / 1000}s...`)
                await new Promise(r => setTimeout(r, DELAY))
            }
        }

        writeFileSync(path.join(vocabDir, file), JSON.stringify(data, null, 4) + '\n', 'utf8')
    }

    console.log(`\n📊 Total: ✅ ${totalOk} | ❌ ${totalFail}`)
    console.log('🦊 Done!')
}

main().catch(console.error)
