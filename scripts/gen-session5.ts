/**
 * Session 5: Einkaufen (23) + Dienstleistungen (17) = 40 words
 */
import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), 'apps', 'web', '.env') })
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
const BASE = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'vocab')

const EINKAUFEN = [
    { word: 'Geschäft', slug: 'geschaeft', meaning: 'shop store building' },
    { word: 'Supermarkt', slug: 'supermarkt', meaning: 'supermarket building' },
    { word: 'Markt', slug: 'markt', meaning: 'outdoor market with stalls' },
    { word: 'Bäckerei', slug: 'baeckerei', meaning: 'bakery with bread display' },
    { word: 'Kasse', slug: 'kasse', meaning: 'cash register checkout counter' },
    { word: 'Preis', slug: 'preis', meaning: 'price tag with euro sign' },
    { word: 'Geld', slug: 'geld', meaning: 'money bills and coins' },
    { word: 'Euro', slug: 'euro', meaning: 'euro coins and banknotes' },
    { word: 'Cent', slug: 'cent', meaning: 'cent coins copper' },
    { word: 'Angebot', slug: 'angebot', meaning: 'sale offer discount tag' },
    { word: 'Tasche', slug: 'tasche', meaning: 'shopping bag' },
    { word: 'Kleidung', slug: 'kleidung', meaning: 'clothing items shirts pants' },
    { word: 'Größe', slug: 'groesse', meaning: 'size label S M L XL' },
    { word: 'kaufen', slug: 'kaufen', meaning: 'person buying paying at counter' },
    { word: 'bezahlen', slug: 'bezahlen', meaning: 'person paying with money' },
    { word: 'kosten', slug: 'kosten', meaning: 'price tag with question mark how much' },
    { word: 'brauchen', slug: 'brauchen', meaning: 'person needing something thinking' },
    { word: 'einkaufen', slug: 'einkaufen-verb', meaning: 'person shopping with cart in store' },
    { word: 'teuer', slug: 'teuer', meaning: 'expensive item with high price tag' },
    { word: 'billig', slug: 'billig', meaning: 'cheap item with low price tag sale' },
    { word: 'günstig', slug: 'guenstig', meaning: 'affordable good deal thumbs up' },
    { word: 'offen', slug: 'offen', meaning: 'open sign on shop door' },
    { word: 'geschlossen', slug: 'geschlossen', meaning: 'closed sign on shop door' },
]

const DIENST = [
    { word: 'Post', slug: 'post', meaning: 'post office building' },
    { word: 'Bank', slug: 'bank', meaning: 'bank building' },
    { word: 'Polizei', slug: 'polizei', meaning: 'police car and police officer' },
    { word: 'Feuerwehr', slug: 'feuerwehr', meaning: 'fire truck fire department' },
    { word: 'Brief', slug: 'brief', meaning: 'letter envelope with stamp' },
    { word: 'Paket', slug: 'paket', meaning: 'package cardboard box parcel' },
    { word: 'Briefmarke', slug: 'briefmarke', meaning: 'postage stamp on letter' },
    { word: 'Formular', slug: 'formular', meaning: 'paper form document with lines' },
    { word: 'Ausweis', slug: 'ausweis', meaning: 'ID card identity document' },
    { word: 'Pass', slug: 'pass', meaning: 'passport travel document' },
    { word: 'Amt', slug: 'amt', meaning: 'government office building' },
    { word: 'Versicherung', slug: 'versicherung', meaning: 'insurance document with shield' },
    { word: 'Konto', slug: 'konto', meaning: 'bank account card screen' },
    { word: 'schicken', slug: 'schicken', meaning: 'person sending letter mailbox' },
    { word: 'unterschreiben', slug: 'unterschreiben', meaning: 'hand signing document with pen' },
    { word: 'ausfüllen', slug: 'ausfuellen', meaning: 'person filling out form writing' },
    { word: 'wichtig', slug: 'wichtig', meaning: 'important star exclamation mark' },
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

async function processTheme(words: typeof EINKAUFEN, theme: string) {
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
    console.log('🛒 Session 5: Einkaufen + Dienstleistungen')
    console.log('============================================\n')

    console.log('🛍️ Einkaufen (23 words)')
    const r1 = await processTheme(EINKAUFEN, 'a1-einkaufen')
    console.log('')

    console.log('🏛️ Dienstleistungen (17 words)')
    const r2 = await processTheme(DIENST, 'a1-dienstleistungen')

    console.log(`\n📊 Total: ✅ ${r1.ok + r2.ok} | ❌ ${r1.fail + r2.fail}`)
    console.log('🦊 Done!')
}
main().catch(console.error)
