/**
 * Resilient image retry — uses Gemini 2.5 Flash Preview Image model
 */
import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync, readFileSync, readdirSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), 'apps', 'web', '.env') })

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
const NORMAL_DELAY = 5000
const RATE_LIMIT_DELAY = 30000

function slugify(word: string): string {
    return word.toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

async function generateImage(word: string, meaning: string, outDir: string): Promise<boolean> {
    const slug = slugify(word)
    const dest = path.join(outDir, `${slug}.png`)
    if (existsSync(dest)) return true

    const prompt = `Create a simple, cute flat design illustration representing "${word}" (${meaning}) for a German language learning flashcard. Style: Clean flat vector illustration, minimal details, soft pastel colors, white/transparent background, no text, no border. Similar to Duolingo illustration style. Single centered object, 256x256 scale.`

    for (let attempt = 0; attempt < 3; attempt++) {
        try {
            const r = await genai.models.generateContent({
                model: 'gemini-3.1-flash-image-preview',
                contents: prompt,
                config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
            })

            for (const p of r.candidates?.[0]?.content?.parts || []) {
                if (p.inlineData?.mimeType?.startsWith('image/')) {
                    const buf = Buffer.from(p.inlineData.data!, 'base64')
                    writeFileSync(dest, buf)
                    console.log(`  ✅ ${word} → ${slug}.png (${(buf.length / 1024).toFixed(0)}KB)`)
                    return true
                }
            }
            console.log(`  ⚠️ ${word} — no image, retrying...`)
        } catch (e: any) {
            if (e.message?.includes('429') || e.message?.includes('RESOURCE_EXHAUSTED')) {
                console.log(`  ⏳ ${word} — rate limited, waiting ${RATE_LIMIT_DELAY / 1000}s (attempt ${attempt + 1}/3)...`)
                await new Promise(r => setTimeout(r, RATE_LIMIT_DELAY))
                continue
            }
            console.log(`  ❌ ${word} — ${e.message?.slice(0, 80)}`)
            return false
        }
    }
    return false
}

async function main() {
    console.log('🦊 Resilient Image Retry (15s normal, 90s on rate limit)\n')

    const vocabDir = 'content/a1/vocabulary'
    const files = readdirSync(vocabDir).filter(f => f.endsWith('.json')).sort()
    let totalOk = 0, totalFail = 0

    for (const file of files) {
        const filePath = path.join(vocabDir, file)
        const data = JSON.parse(readFileSync(filePath, 'utf8'))
        const themeSlug = data.theme.slug
        const imgDir = `apps/web/public/images/vocab/${themeSlug}`
        mkdirSync(imgDir, { recursive: true })

        const missing = data.words.filter((w: any) => !w.imageUrl)
        if (missing.length === 0) continue

        console.log(`📌 ${data.theme.name} — ${missing.length} missing`)

        for (let i = 0; i < missing.length; i++) {
            const w = missing[i]
            const slug = slugify(w.word)
            const ok = await generateImage(w.word, w.meaningVi || w.meaningEn, imgDir)
            if (ok) {
                w.imageUrl = `/images/vocab/${themeSlug}/${slug}.png`
                totalOk++
            } else {
                totalFail++
            }
            if (i < missing.length - 1) {
                await new Promise(r => setTimeout(r, NORMAL_DELAY))
            }
        }
        writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n', 'utf8')
        console.log(`  → Saved ${file}`)
    }

    console.log(`\n📊 Total: ✅ ${totalOk} | ❌ ${totalFail}`)
    console.log('🦊 Done!')
}

main().catch(console.error)
