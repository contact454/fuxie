/**
 * Session 6: Ausbildung und Lernen (28) + Arbeit und Beruf (18) = 46 words
 */
import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), 'apps', 'web', '.env') })
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
const BASE = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'vocab')

const AUSBILDUNG = [
    { word: 'Schule', slug: 'schule', meaning: 'school building' },
    { word: 'Universität', slug: 'universitaet', meaning: 'university campus building' },
    { word: 'Kurs', slug: 'kurs', meaning: 'course class with students' },
    { word: 'Lehrer', slug: 'lehrer', meaning: 'male teacher at blackboard' },
    { word: 'Lehrerin', slug: 'lehrerin', meaning: 'female teacher at blackboard' },
    { word: 'Schüler', slug: 'schueler', meaning: 'male student boy at desk' },
    { word: 'Student', slug: 'student', meaning: 'male university student with books' },
    { word: 'Studentin', slug: 'studentin', meaning: 'female university student with books' },
    { word: 'Klasse', slug: 'klasse', meaning: 'classroom with desks and chairs' },
    { word: 'Buch', slug: 'buch', meaning: 'open book' },
    { word: 'Heft', slug: 'heft', meaning: 'notebook exercise book with lines' },
    { word: 'Stift', slug: 'stift', meaning: 'pen pencil writing' },
    { word: 'Tafel', slug: 'tafel', meaning: 'blackboard chalkboard in classroom' },
    { word: 'Computer', slug: 'computer', meaning: 'laptop computer screen' },
    { word: 'Hausaufgabe', slug: 'hausaufgabe', meaning: 'homework papers on desk' },
    { word: 'Prüfung', slug: 'pruefung', meaning: 'exam test paper with checkmarks' },
    { word: 'Wort', slug: 'wort', meaning: 'word in speech bubble ABC' },
    { word: 'Satz', slug: 'satz', meaning: 'sentence written on paper' },
    { word: 'Frage', slug: 'frage', meaning: 'question mark speech bubble' },
    { word: 'Antwort', slug: 'antwort', meaning: 'answer checkmark lightbulb' },
    { word: 'lesen', slug: 'lesen', meaning: 'person reading a book' },
    { word: 'schreiben', slug: 'schreiben', meaning: 'hand writing with pen on paper' },
    { word: 'verstehen', slug: 'verstehen', meaning: 'person understanding lightbulb moment' },
    { word: 'hören', slug: 'hoeren', meaning: 'person listening with headphones ear' },
    { word: 'richtig', slug: 'richtig', meaning: 'green checkmark correct' },
    { word: 'falsch', slug: 'falsch', meaning: 'red X wrong incorrect' },
    { word: 'schwer', slug: 'schwer', meaning: 'heavy weight difficult' },
    { word: 'leicht', slug: 'leicht', meaning: 'feather light easy' },
]

const ARBEIT = [
    { word: 'Arbeit', slug: 'arbeit', meaning: 'person working at desk' },
    { word: 'Büro', slug: 'buero', meaning: 'office room with desk and computer' },
    { word: 'Chef', slug: 'chef', meaning: 'male boss in suit' },
    { word: 'Chefin', slug: 'chefin', meaning: 'female boss in suit' },
    { word: 'Kollege', slug: 'kollege', meaning: 'male colleague coworker' },
    { word: 'Kollegin', slug: 'kollegin', meaning: 'female colleague coworker' },
    { word: 'Firma', slug: 'firma', meaning: 'company office building' },
    { word: 'Ingenieur', slug: 'ingenieur', meaning: 'engineer with hard hat and blueprints' },
    { word: 'Sekretärin', slug: 'sekretaerin', meaning: 'female secretary at desk typing' },
    { word: 'Verkäufer', slug: 'verkaeufer', meaning: 'salesperson at shop counter' },
    { word: 'Kellner', slug: 'kellner', meaning: 'waiter carrying tray of food' },
    { word: 'Krankenschwester', slug: 'krankenschwester', meaning: 'nurse in hospital uniform' },
    { word: 'arbeiten', slug: 'arbeiten', meaning: 'person working typing at computer' },
    { word: 'verdienen', slug: 'verdienen', meaning: 'person earning money salary' },
    { word: 'Stunde', slug: 'stunde', meaning: 'clock showing one hour' },
    { word: 'Pause', slug: 'pause', meaning: 'person taking break coffee' },
    { word: 'Feierabend', slug: 'feierabend', meaning: 'person leaving work happy sunset' },
    { word: 'Urlaub', slug: 'urlaub', meaning: 'vacation beach palm tree suitcase' },
]

function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)) }

function buildPrompt(word: string, meaning: string): string {
    return `Create a simple, cute flat design illustration of "${word}" (${meaning}) for a language learning flashcard. 
Style: Clean flat vector illustration, minimal details, soft pastel colors, white/transparent background, no text, no border. 
Similar to Duolingo illustration style. Single centered object, 256x256 scale.`
}

async function gen(prompt: string): Promise<Buffer | null> {
    const r = await genai.models.generateContent({
        model: 'gemini-3.1-flash-image-preview', contents: prompt,
        config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    })
    for (const p of r.candidates?.[0]?.content?.parts || [])
        if (p.inlineData?.mimeType?.startsWith('image/'))
            return Buffer.from(p.inlineData.data!, 'base64')
    return null
}

async function processTheme(words: typeof AUSBILDUNG, theme: string) {
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
    console.log('📚 Session 6: Ausbildung + Arbeit')
    console.log('==================================\n')
    console.log('🎓 Ausbildung und Lernen (28 words)')
    const r1 = await processTheme(AUSBILDUNG, 'a1-ausbildung-lernen')
    console.log('')
    console.log('💼 Arbeit und Beruf (18 words)')
    const r2 = await processTheme(ARBEIT, 'a1-arbeit-beruf')
    console.log(`\n📊 Total: ✅ ${r1.ok + r2.ok} | ❌ ${r1.fail + r2.fail}`)
    console.log('🦊 Done!')
}
main().catch(console.error)
