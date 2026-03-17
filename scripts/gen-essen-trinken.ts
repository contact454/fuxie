/**
 * Generate vocabulary images for Essen und Trinken theme (49 words)
 * Uses Gemini API directly
 */

import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), 'apps', 'web', '.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
if (!GEMINI_API_KEY) { console.error('❌ No API key'); process.exit(1) }

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const DEST = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'vocab', 'a1-essen-trinken')

const WORDS = [
    { word: 'Essen', slug: 'essen', meaning: 'food, a meal on a plate' },
    { word: 'Frühstück', slug: 'fruehstueck', meaning: 'breakfast with bread, egg, coffee' },
    { word: 'Mittagessen', slug: 'mittagessen', meaning: 'lunch meal on a table' },
    { word: 'Abendessen', slug: 'abendessen', meaning: 'dinner meal in evening setting' },
    { word: 'Brot', slug: 'brot', meaning: 'bread loaf' },
    { word: 'Brötchen', slug: 'broetchen', meaning: 'small bread roll' },
    { word: 'Butter', slug: 'butter', meaning: 'butter block on dish' },
    { word: 'Käse', slug: 'kaese', meaning: 'cheese wedge with holes' },
    { word: 'Wurst', slug: 'wurst', meaning: 'German sausage' },
    { word: 'Fleisch', slug: 'fleisch', meaning: 'piece of meat steak' },
    { word: 'Fisch', slug: 'fisch', meaning: 'cooked fish on plate' },
    { word: 'Ei', slug: 'ei', meaning: 'egg, boiled egg' },
    { word: 'Reis', slug: 'reis', meaning: 'bowl of rice' },
    { word: 'Nudel', slug: 'nudel', meaning: 'pasta noodles on plate' },
    { word: 'Kartoffel', slug: 'kartoffel', meaning: 'potato' },
    { word: 'Gemüse', slug: 'gemuese', meaning: 'assorted vegetables' },
    { word: 'Obst', slug: 'obst', meaning: 'assorted fruits' },
    { word: 'Apfel', slug: 'apfel', meaning: 'red apple' },
    { word: 'Banane', slug: 'banane', meaning: 'yellow banana' },
    { word: 'Orange', slug: 'orange', meaning: 'orange fruit' },
    { word: 'Salat', slug: 'salat', meaning: 'green salad in bowl' },
    { word: 'Suppe', slug: 'suppe', meaning: 'bowl of hot soup' },
    { word: 'Kuchen', slug: 'kuchen', meaning: 'cake slice with frosting' },
    { word: 'Zucker', slug: 'zucker', meaning: 'sugar cubes and spoon' },
    { word: 'Salz', slug: 'salz', meaning: 'salt shaker' },
    { word: 'Wasser', slug: 'wasser', meaning: 'glass of water' },
    { word: 'Kaffee', slug: 'kaffee', meaning: 'cup of coffee with steam' },
    { word: 'Tee', slug: 'tee', meaning: 'cup of tea with tea bag' },
    { word: 'Milch', slug: 'milch', meaning: 'glass of milk and milk carton' },
    { word: 'Saft', slug: 'saft', meaning: 'glass of orange juice' },
    { word: 'Bier', slug: 'bier', meaning: 'glass of beer with foam' },
    { word: 'Wein', slug: 'wein', meaning: 'glass of red wine' },
    { word: 'Glas', slug: 'glas', meaning: 'empty drinking glass' },
    { word: 'Tasse', slug: 'tasse', meaning: 'coffee cup with handle' },
    { word: 'Teller', slug: 'teller', meaning: 'empty plate dish' },
    { word: 'Flasche', slug: 'flasche', meaning: 'water bottle' },
    { word: 'Restaurant', slug: 'restaurant', meaning: 'restaurant building exterior' },
    { word: 'Speisekarte', slug: 'speisekarte', meaning: 'open menu book' },
    { word: 'Rechnung', slug: 'rechnung', meaning: 'restaurant bill receipt' },
    { word: 'essen', slug: 'essen-verb', meaning: 'person eating food with fork' },
    { word: 'trinken', slug: 'trinken', meaning: 'person drinking from glass' },
    { word: 'kochen', slug: 'kochen', meaning: 'person cooking at stove' },
    { word: 'bestellen', slug: 'bestellen', meaning: 'person ordering food at restaurant' },
    { word: 'möchten', slug: 'moechten', meaning: 'person pointing at menu wanting something' },
    { word: 'lecker', slug: 'lecker', meaning: 'person enjoying delicious food, happy face' },
    { word: 'süß', slug: 'suess', meaning: 'sweet candy and cupcake' },
    { word: 'sauer', slug: 'sauer', meaning: 'sour lemon, person making sour face' },
    { word: 'Hunger', slug: 'hunger', meaning: 'hungry person with empty stomach' },
    { word: 'Durst', slug: 'durst', meaning: 'thirsty person wanting water' },
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
    const response = await genai.models.generateContent({
        model: 'gemini-2.0-flash-exp-image-generation',
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
    return null
}

async function main() {
    mkdirSync(DEST, { recursive: true })
    console.log('🍽️ Essen und Trinken — 49 words')
    console.log('================================')

    let success = 0, failed = 0
    const failures: string[] = []

    for (let i = 0; i < WORDS.length; i++) {
        const { word, slug, meaning } = WORDS[i]
        const dest = path.join(DEST, `${slug}.png`)

        if (existsSync(dest)) {
            console.log(`  ⏭️ [${i + 1}/${WORDS.length}] ${word} — exists`)
            success++
            continue
        }

        console.log(`  [${i + 1}/${WORDS.length}] Generating ${word}...`)
        try {
            const buf = await generateImage(buildPrompt(word, meaning))
            if (buf) {
                writeFileSync(dest, buf)
                console.log(`  ✅ ${word} → ${slug}.png (${(buf.length / 1024).toFixed(0)}KB)`)
                success++
            } else {
                console.log(`  ⚠️ ${word} — no image`)
                failed++
                failures.push(word)
            }
        } catch (err: any) {
            console.log(`  ❌ ${word} — ${err.message?.substring(0, 80)}`)
            failed++
            failures.push(word)
        }

        if (i < WORDS.length - 1) await sleep(1500)
    }

    console.log(`\n✅ ${success} | ❌ ${failed}`)
    if (failures.length) console.log('Failed:', failures.join(', '))
    console.log('🦊 Done!')
}

main().catch(console.error)
