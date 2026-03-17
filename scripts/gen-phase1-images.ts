/**
 * Phase 1 Images: Zahlen (39) + Farben (15) + Länder (26) + Berufe (22) = 102 words
 */
import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), 'apps', 'web', '.env') })

const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
const DELAY = 1500

const themes = [
    {
        file: 'content/a1/vocabulary/15-zahlen.json',
        dir: 'apps/web/public/images/vocab/a1-zahlen',
        name: 'Zahlen',
    },
    {
        file: 'content/a1/vocabulary/16-farben.json',
        dir: 'apps/web/public/images/vocab/a1-farben',
        name: 'Farben',
    },
    {
        file: 'content/a1/vocabulary/17-laender-nationalitaeten.json',
        dir: 'apps/web/public/images/vocab/a1-laender-nationalitaeten',
        name: 'Länder & Nationalitäten',
    },
    {
        file: 'content/a1/vocabulary/18-berufe.json',
        dir: 'apps/web/public/images/vocab/a1-berufe',
        name: 'Berufe',
    },
]

function slugify(word: string): string {
    return word
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '')
}

function buildPrompt(word: string, meaning: string, theme: string): string {
    // Special handling for numbers theme
    if (theme === 'Zahlen') {
        return `Create a simple, cute flat design illustration representing the number/concept "${word}" (${meaning}) for a language learning flashcard. Style: Clean flat vector illustration, minimal details, soft pastel colors, white/transparent background, no text, no border. Similar to Duolingo illustration style. Single centered object, 256x256 scale.`
    }
    if (theme === 'Farben') {
        return `Create a simple, cute flat design illustration representing the color "${word}" (${meaning}) for a language learning flashcard. Show an object or scene that is clearly this color. Style: Clean flat vector illustration, minimal details, soft pastel colors, white/transparent background, no text, no border. Similar to Duolingo illustration style. Single centered object, 256x256 scale.`
    }
    if (theme === 'Länder & Nationalitäten') {
        return `Create a simple, cute flat design illustration representing "${word}" (${meaning}) for a language learning flashcard. Show a recognizable landmark or cultural symbol. Style: Clean flat vector illustration, minimal details, soft pastel colors, white/transparent background, no text, no border. Similar to Duolingo illustration style. Single centered object, 256x256 scale.`
    }
    // Berufe
    return `Create a simple, cute flat design illustration of "${word}" (${meaning}) for a language learning flashcard. Show a person in this profession with typical tools/outfit. Style: Clean flat vector illustration, minimal details, soft pastel colors, white/transparent background, no text, no border. Similar to Duolingo illustration style. Single centered object, 256x256 scale.`
}

async function generateImage(word: string, meaning: string, theme: string, outDir: string): Promise<{ slug: string; ok: boolean }> {
    const slug = slugify(word)
    const dest = path.join(outDir, `${slug}.png`)

    if (existsSync(dest)) {
        console.log(`  ⏭️  ${word} → ${slug}.png (exists)`)
        return { slug, ok: true }
    }

    const prompt = buildPrompt(word, meaning, theme)

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
                return { slug, ok: true }
            }
        }
        console.log(`  ⚠️ ${word} — skip`)
        return { slug, ok: false }
    } catch (e: any) {
        console.log(`  ⚠️ ${word} — ${e.message?.slice(0, 60)}`)
        return { slug, ok: false }
    }
}

async function main() {
    console.log('🦊 Phase 1 Image Generation')
    console.log('====================================\n')

    let totalOk = 0, totalFail = 0

    for (const theme of themes) {
        const data = JSON.parse(readFileSync(theme.file, 'utf8'))
        const words = data.words as any[]

        mkdirSync(theme.dir, { recursive: true })
        console.log(`📌 ${theme.name} (${words.length} words)`)

        let ok = 0, fail = 0
        for (let i = 0; i < words.length; i++) {
            const w = words[i]
            console.log(`  [${i + 1}/${words.length}] ${w.word}...`)
            const result = await generateImage(w.word, w.meaningVi || w.meaningEn, theme.name, theme.dir)
            if (result.ok) ok++; else fail++
            if (i < words.length - 1) await new Promise(r => setTimeout(r, DELAY))
        }
        console.log(`  Result: ✅ ${ok} | ❌ ${fail}\n`)
        totalOk += ok
        totalFail += fail
    }

    console.log(`📊 Total: ✅ ${totalOk} | ❌ ${totalFail}`)
    console.log('🦊 Done!')
}

main().catch(console.error)
