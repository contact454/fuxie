/**
 * Session 8: Reisen und Verkehr (29) + Zeitangaben (48) = 77 words
 */
import { GoogleGenAI, Modality } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(process.cwd(), 'apps', 'web', '.env') })
const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' })
const BASE = path.join(process.cwd(), 'apps', 'web', 'public', 'images', 'vocab')

const REISEN = [
    { word: 'Zug', slug: 'zug', meaning: 'train locomotive' },
    { word: 'Bus', slug: 'bus', meaning: 'city bus public transport' },
    { word: 'Auto', slug: 'auto', meaning: 'car automobile' },
    { word: 'Flugzeug', slug: 'flugzeug', meaning: 'airplane in sky' },
    { word: 'Flughafen', slug: 'flughafen', meaning: 'airport building' },
    { word: 'Bahnhof', slug: 'bahnhof', meaning: 'train station building' },
    { word: 'Haltestelle', slug: 'haltestelle', meaning: 'bus stop sign' },
    { word: 'Fahrkarte', slug: 'fahrkarte', meaning: 'train ticket pass' },
    { word: 'Ticket', slug: 'ticket', meaning: 'entry ticket' },
    { word: 'Gepäck', slug: 'gepaeck', meaning: 'luggage suitcases bags' },
    { word: 'Koffer', slug: 'koffer', meaning: 'suitcase travel bag' },
    { word: 'Reise', slug: 'reise', meaning: 'travel journey map globe' },
    { word: 'Hotel', slug: 'hotel', meaning: 'hotel building with sign' },
    { word: 'Gleis', slug: 'gleis', meaning: 'train platform track rails' },
    { word: 'Abfahrt', slug: 'abfahrt', meaning: 'departure sign train leaving' },
    { word: 'Ankunft', slug: 'ankunft', meaning: 'arrival sign train arriving' },
    { word: 'Verspätung', slug: 'verspaetung', meaning: 'clock delay late warning' },
    { word: 'Weg', slug: 'weg', meaning: 'path road way' },
    { word: 'fahren', slug: 'fahren', meaning: 'person driving car steering wheel' },
    { word: 'fliegen', slug: 'fliegen', meaning: 'airplane flying in clouds' },
    { word: 'gehen', slug: 'gehen', meaning: 'person walking footsteps' },
    { word: 'umsteigen', slug: 'umsteigen', meaning: 'person changing trains arrows' },
    { word: 'einsteigen', slug: 'einsteigen', meaning: 'person boarding train stepping up' },
    { word: 'aussteigen', slug: 'aussteigen', meaning: 'person getting off train stepping down' },
    { word: 'links', slug: 'links', meaning: 'left arrow direction sign' },
    { word: 'rechts', slug: 'rechts', meaning: 'right arrow direction sign' },
    { word: 'geradeaus', slug: 'geradeaus', meaning: 'straight ahead arrow sign' },
    { word: 'weit', slug: 'weit', meaning: 'far away distance long road' },
    { word: 'nah', slug: 'nah', meaning: 'close nearby short distance' },
]

const ZEITANGABEN = [
    { word: 'Uhr', slug: 'uhr', meaning: 'clock wall clock' },
    { word: 'Zeit', slug: 'zeit', meaning: 'time hourglass sand timer' },
    { word: 'Minute', slug: 'minute', meaning: 'stopwatch timer minute hand' },
    { word: 'Tag', slug: 'tag', meaning: 'day sunny daytime' },
    { word: 'Woche', slug: 'woche', meaning: 'weekly calendar 7 days' },
    { word: 'Monat', slug: 'monat', meaning: 'monthly calendar page' },
    { word: 'Montag', slug: 'montag', meaning: 'calendar showing Monday' },
    { word: 'Dienstag', slug: 'dienstag', meaning: 'calendar showing Tuesday' },
    { word: 'Mittwoch', slug: 'mittwoch', meaning: 'calendar showing Wednesday' },
    { word: 'Donnerstag', slug: 'donnerstag', meaning: 'calendar showing Thursday' },
    { word: 'Freitag', slug: 'freitag', meaning: 'calendar showing Friday happy' },
    { word: 'Samstag', slug: 'samstag', meaning: 'calendar showing Saturday weekend' },
    { word: 'Sonntag', slug: 'sonntag', meaning: 'calendar showing Sunday relaxing' },
    { word: 'Wochenende', slug: 'wochenende', meaning: 'weekend calendar Saturday Sunday' },
    { word: 'Januar', slug: 'januar', meaning: 'January winter snow' },
    { word: 'Februar', slug: 'februar', meaning: 'February valentines heart' },
    { word: 'März', slug: 'maerz', meaning: 'March spring flowers' },
    { word: 'April', slug: 'april', meaning: 'April rain umbrella' },
    { word: 'Mai', slug: 'mai', meaning: 'May flowers blooming' },
    { word: 'Juni', slug: 'juni', meaning: 'June summer sun' },
    { word: 'Juli', slug: 'juli', meaning: 'July hot sun beach' },
    { word: 'August', slug: 'august', meaning: 'August vacation sunglasses' },
    { word: 'September', slug: 'september', meaning: 'September autumn leaves' },
    { word: 'Oktober', slug: 'oktober', meaning: 'October harvest pumpkin' },
    { word: 'November', slug: 'november', meaning: 'November fog grey clouds' },
    { word: 'Dezember', slug: 'dezember', meaning: 'December christmas tree snow' },
    { word: 'heute', slug: 'heute', meaning: 'today calendar with checkmark' },
    { word: 'morgen', slug: 'morgen-adverb', meaning: 'tomorrow calendar next day arrow' },
    { word: 'gestern', slug: 'gestern', meaning: 'yesterday calendar past day' },
    { word: 'jetzt', slug: 'jetzt', meaning: 'now clock current time exclamation' },
    { word: 'später', slug: 'spaeter', meaning: 'later clock forward arrow' },
    { word: 'früh', slug: 'frueh', meaning: 'early morning sunrise alarm clock' },
    { word: 'spät', slug: 'spaet', meaning: 'late night moon stars clock' },
    { word: 'Morgen', slug: 'morgen-noun', meaning: 'morning sunrise coffee' },
    { word: 'Mittag', slug: 'mittag', meaning: 'noon midday sun at top' },
    { word: 'Abend', slug: 'abend', meaning: 'evening sunset sky' },
    { word: 'Nacht', slug: 'nacht', meaning: 'night moon stars dark sky' },
    { word: 'Vormittag', slug: 'vormittag', meaning: 'late morning clock 10am' },
    { word: 'Nachmittag', slug: 'nachmittag', meaning: 'afternoon clock 3pm sun' },
    { word: 'Frühling', slug: 'fruehling', meaning: 'spring season flowers butterflies' },
    { word: 'Sommer', slug: 'sommer', meaning: 'summer season hot sun beach' },
    { word: 'Herbst', slug: 'herbst', meaning: 'autumn fall colorful leaves' },
    { word: 'Winter', slug: 'winter', meaning: 'winter season snowflakes cold' },
    { word: 'immer', slug: 'immer', meaning: 'always infinity loop repeat forever' },
    { word: 'manchmal', slug: 'manchmal', meaning: 'sometimes partial circle occasional' },
    { word: 'nie', slug: 'nie', meaning: 'never X prohibition stop sign' },
    { word: 'oft', slug: 'oft', meaning: 'often frequency many dots repeated' },
    { word: 'Feiertag', slug: 'feiertag', meaning: 'holiday celebration flag star' },
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

async function processTheme(words: typeof REISEN, theme: string) {
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
    console.log('✈️ Session 8: Reisen + Zeitangaben')
    console.log('====================================\n')
    console.log('🚂 Reisen und Verkehr (29 words)')
    const r1 = await processTheme(REISEN, 'a1-reisen-verkehr')
    console.log('')
    console.log('🕐 Zeitangaben (48 words)')
    const r2 = await processTheme(ZEITANGABEN, 'a1-zeitangaben')
    console.log(`\n📊 Total: ✅ ${r1.ok + r2.ok} | ❌ ${r1.fail + r2.fail}`)
    console.log('🦊 Done!')
}
main().catch(console.error)
