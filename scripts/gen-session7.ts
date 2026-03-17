/**
 * Session 7: Freizeit (25) + Kommunikation (18) = 43 words
 */
import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), 'apps', 'web', '.env') })
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
const BASE = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'vocab')

const FREIZEIT = [
    { word: 'Sport', slug: 'sport', meaning: 'sports equipment balls' },
    { word: 'Fußball', slug: 'fussball', meaning: 'soccer ball football' },
    { word: 'Schwimmbad', slug: 'schwimmbad', meaning: 'swimming pool with lanes' },
    { word: 'Fahrrad', slug: 'fahrrad', meaning: 'bicycle bike' },
    { word: 'Kino', slug: 'kino', meaning: 'cinema building with screen' },
    { word: 'Theater', slug: 'theater', meaning: 'theater stage with curtains' },
    { word: 'Musik', slug: 'musik', meaning: 'musical notes and instruments' },
    { word: 'Film', slug: 'film', meaning: 'movie film reel clapperboard' },
    { word: 'Foto', slug: 'foto', meaning: 'camera taking photo' },
    { word: 'Hobby', slug: 'hobby', meaning: 'hobby activities painting reading' },
    { word: 'Spiel', slug: 'spiel', meaning: 'board game with pieces' },
    { word: 'Konzert', slug: 'konzert', meaning: 'concert stage with musicians' },
    { word: 'Fest', slug: 'fest', meaning: 'festival celebration with decorations' },
    { word: 'Party', slug: 'party', meaning: 'party with balloons confetti' },
    { word: 'spielen', slug: 'spielen', meaning: 'person playing a game' },
    { word: 'schwimmen', slug: 'schwimmen', meaning: 'person swimming in water' },
    { word: 'tanzen', slug: 'tanzen', meaning: 'person dancing' },
    { word: 'singen', slug: 'singen', meaning: 'person singing with microphone' },
    { word: 'malen', slug: 'malen', meaning: 'person painting with brush canvas' },
    { word: 'fernsehen', slug: 'fernsehen', meaning: 'person watching TV on couch' },
    { word: 'spazieren gehen', slug: 'spazieren-gehen', meaning: 'person walking in park nature' },
    { word: 'gern', slug: 'gern', meaning: 'happy face heart thumbs up liking' },
    { word: 'interessant', slug: 'interessant', meaning: 'excited curious face with star eyes' },
    { word: 'langweilig', slug: 'langweilig', meaning: 'bored sleepy face yawning' },
    { word: 'lustig', slug: 'lustig', meaning: 'laughing face funny happy' },
]

const KOMMUNIKATION = [
    { word: 'Handy', slug: 'handy', meaning: 'smartphone mobile phone' },
    { word: 'Telefon', slug: 'telefon', meaning: 'telephone desk phone' },
    { word: 'Internet', slug: 'internet', meaning: 'wifi globe internet symbol' },
    { word: 'Nachricht', slug: 'nachricht', meaning: 'text message notification' },
    { word: 'Zeitung', slug: 'zeitung', meaning: 'newspaper folded' },
    { word: 'Fernsehen', slug: 'fernsehen-noun', meaning: 'television TV screen' },
    { word: 'Fernseher', slug: 'fernseher', meaning: 'TV set flat screen' },
    { word: 'Radio', slug: 'radio', meaning: 'radio device with antenna' },
    { word: 'Postkarte', slug: 'postkarte', meaning: 'postcard with stamp' },
    { word: 'anrufen', slug: 'anrufen', meaning: 'person making phone call' },
    { word: 'telefonieren', slug: 'telefonieren', meaning: 'person talking on phone' },
    { word: 'sagen', slug: 'sagen', meaning: 'person speaking with speech bubble' },
    { word: 'fragen', slug: 'fragen-verb', meaning: 'person asking question raising hand' },
    { word: 'antworten', slug: 'antworten', meaning: 'person answering responding' },
    { word: 'erklären', slug: 'erklaeren', meaning: 'person explaining at whiteboard' },
    { word: 'wiederholen', slug: 'wiederholen', meaning: 'repeat loop arrow circle' },
    { word: 'langsam', slug: 'langsam', meaning: 'snail slow turtle' },
    { word: 'schnell', slug: 'schnell', meaning: 'fast running rabbit lightning' },
]

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function buildPrompt(word: string, meaning: string): string {
    return `Create a simple, cute flat design illustration of "${word}" (${meaning}) for a language learning flashcard. 
Style: Clean flat vector illustration, minimal details, soft pastel colors, white/transparent background, no text, no border. 
Similar to Duolingo illustration style. Single centered object, 256x256 scale.`
}

async function gen(prompt: string): Promise<Buffer | null> {
    const r = await genai.models.generateContent({
        model: 'gemini-2.0-flash-exp-image-generation', contents: prompt,
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    })
    for (const p of r.candidates?.[0]?.content?.parts || [])
        if (p.inlineData?.mimeType?.startsWith('image/'))
            return Buffer.from(p.inlineData.data!, 'base64')
    return null
}

async function processTheme(words: typeof FREIZEIT, theme: string) {
    const dest = path.join(BASE, theme)
    mkdirSync(dest, { recursive: true })
    let ok = 0, fail = 0; const fails: string[] = []
    for (let i = 0; i < words.length; i++) {
        const { word, slug, meaning } = words[i]
        const fp = path.join(dest, `${slug}.png`)
        if (existsSync(fp)) { console.log(`  ⏭️ [${i + 1}/${words.length}] ${word}`); ok++; continue }
        console.log(`  [${i + 1}/${words.length}] ${word}...`)
        try {
            const buf = await gen(buildPrompt(word, meaning))
            if (buf) { writeFileSync(fp, buf); console.log(`  ✅ ${word} → ${slug}.png (${(buf.length / 1024).toFixed(0)}KB)`); ok++ }
            else { console.log(`  ⚠️ ${word} — skip`); fail++; fails.push(word) }
        } catch (e: any) { console.log(`  ❌ ${word} — ${e.message?.substring(0, 60)}`); fail++; fails.push(word) }
        if (i < words.length - 1) await sleep(1500)
    }
    console.log(`  Result: ✅ ${ok} | ❌ ${fail}`)
    if (fails.length) console.log('  Failed:', fails.join(', '))
    return { ok, fail }
}

async function main() {
    console.log('🎮 Session 7: Freizeit + Kommunikation')
    console.log('========================================\n')
    console.log('🏊 Freizeit (25 words)')
    const r1 = await processTheme(FREIZEIT, 'a1-freizeit')
    console.log('')
    console.log('📱 Kommunikation (18 words)')
    const r2 = await processTheme(KOMMUNIKATION, 'a1-kommunikation')
    console.log(`\n📊 Total: ✅ ${r1.ok + r2.ok} | ❌ ${r1.fail + r2.fail}`)
    console.log('🦊 Done!')
}
main().catch(console.error)
