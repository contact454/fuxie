/**
 * C1 Vocabulary Generator
 * Uses Gemini to generate C1-level German vocabulary for 20 themes.
 * Creates JSON files in content/c1/vocabulary/
 *
 * Usage:
 *   npx tsx scripts/gen-c1-vocab.ts
 *   npx tsx scripts/gen-c1-vocab.ts --theme=01
 *   npx tsx scripts/gen-c1-vocab.ts --dry-run
 */

import { GoogleGenAI } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', 'apps', 'web', '.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found')
    process.exit(1)
}

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'c1', 'vocabulary')

// C1 Theme definitions — advanced, nuanced, academic/professional
const THEMES = [
    { num: '01', slug: 'c1-gesellschaftskritik-diskurs', name: 'Gesellschaftskritik & Diskurs', nameVi: 'Phê bình xã hội & Diễn ngôn', nameEn: 'Social Criticism & Discourse', words: 35 },
    { num: '02', slug: 'c1-psychologie-verhaltensmuster', name: 'Psychologie & Verhaltensmuster', nameVi: 'Tâm lý học & Mô hình hành vi', nameEn: 'Psychology & Behavioral Patterns', words: 35 },
    { num: '03', slug: 'c1-bioethik-gentechnik', name: 'Bioethik & Gentechnik', nameVi: 'Đạo đức sinh học & Công nghệ gen', nameEn: 'Bioethics & Genetic Engineering', words: 35 },
    { num: '04', slug: 'c1-urbanisierung-raumplanung', name: 'Urbanisierung & Raumplanung', nameVi: 'Đô thị hóa & Quy hoạch không gian', nameEn: 'Urbanization & Spatial Planning', words: 35 },
    { num: '05', slug: 'c1-klimapolitik-nachhaltigkeit', name: 'Klimapolitik & Nachhaltigkeit', nameVi: 'Chính sách khí hậu & Bền vững', nameEn: 'Climate Policy & Sustainability', words: 35 },
    { num: '06', slug: 'c1-sprachwissenschaft-linguistik', name: 'Sprachwissenschaft & Linguistik', nameVi: 'Ngôn ngữ học', nameEn: 'Linguistics & Language Science', words: 35 },
    { num: '07', slug: 'c1-wirtschaftstheorie-globalisierung', name: 'Wirtschaftstheorie & Globalisierung', nameVi: 'Lý thuyết kinh tế & Toàn cầu hóa', nameEn: 'Economic Theory & Globalization', words: 35 },
    { num: '08', slug: 'c1-geopolitik-diplomatie', name: 'Geopolitik & Diplomatie', nameVi: 'Địa chính trị & Ngoại giao', nameEn: 'Geopolitics & Diplomacy', words: 35 },
    { num: '09', slug: 'c1-forschungsmethodik-akademie', name: 'Forschungsmethodik & Akademischer Diskurs', nameVi: 'Phương pháp nghiên cứu & Học thuật', nameEn: 'Research Methodology & Academic Discourse', words: 35 },
    { num: '10', slug: 'c1-arbeitsrecht-sozialpartnerschaft', name: 'Arbeitsrecht & Sozialpartnerschaft', nameVi: 'Luật lao động & Đối tác xã hội', nameEn: 'Labor Law & Social Partnership', words: 35 },
    { num: '11', slug: 'c1-literaturkritik-textanalyse', name: 'Literaturkritik & Textanalyse', nameVi: 'Phê bình văn học & Phân tích văn bản', nameEn: 'Literary Criticism & Text Analysis', words: 35 },
    { num: '12', slug: 'c1-medientheorie-propaganda', name: 'Medientheorie & Propaganda', nameVi: 'Lý thuyết truyền thông & Tuyên truyền', nameEn: 'Media Theory & Propaganda', words: 35 },
    { num: '13', slug: 'c1-kultursoziologie-identitaet', name: 'Kultursoziologie & Identität', nameVi: 'Xã hội học văn hóa & Bản sắc', nameEn: 'Cultural Sociology & Identity', words: 35 },
    { num: '14', slug: 'c1-philosophie-erkenntnistheorie', name: 'Philosophie & Erkenntnistheorie', nameVi: 'Triết học & Nhận thức luận', nameEn: 'Philosophy & Epistemology', words: 35 },
    { num: '15', slug: 'c1-neurowissenschaft-bewusstsein', name: 'Neurowissenschaft & Bewusstsein', nameVi: 'Khoa học thần kinh & Ý thức', nameEn: 'Neuroscience & Consciousness', words: 35 },
    { num: '16', slug: 'c1-datenschutz-digitalethik', name: 'Datenschutz & Digitalethik', nameVi: 'Bảo vệ dữ liệu & Đạo đức số', nameEn: 'Data Protection & Digital Ethics', words: 35 },
    { num: '17', slug: 'c1-verfassungsrecht-staatstheorie', name: 'Verfassungsrecht & Staatstheorie', nameVi: 'Luật hiến pháp & Lý thuyết nhà nước', nameEn: 'Constitutional Law & State Theory', words: 35 },
    { num: '18', slug: 'c1-finanzmaerkte-regulierung', name: 'Finanzmärkte & Regulierung', nameVi: 'Thị trường tài chính & Điều tiết', nameEn: 'Financial Markets & Regulation', words: 35 },
    { num: '19', slug: 'c1-verkehrswende-infrastruktur', name: 'Verkehrswende & Infrastrukturpolitik', nameVi: 'Chuyển đổi giao thông & Chính sách hạ tầng', nameEn: 'Transport Transition & Infrastructure Policy', words: 35 },
    { num: '20', slug: 'c1-energiepolitik-ressourcen', name: 'Energiepolitik & Ressourcenmanagement', nameVi: 'Chính sách năng lượng & Quản lý tài nguyên', nameEn: 'Energy Policy & Resource Management', words: 35 },
]

const args = process.argv.slice(2)
const themeFilter = args.find(a => a.startsWith('--theme='))?.split('=')[1]
const dryRun = args.includes('--dry-run')

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function buildPrompt(theme: typeof THEMES[0]): string {
    return `You are an expert German language teacher creating C1-level (CEFR) vocabulary for a language learning app called Fuxie.

Theme: "${theme.name}" (${theme.nameEn})

Generate exactly ${theme.words} German words for this theme at C1 level.

RULES:
- Words MUST be C1 level — advanced, NOT basic A1-B2 words, NOT obscure C2 words
- C1 means: can understand demanding texts, express ideas fluently, use language flexibly for academic and professional purposes
- Include a good mix of: Nouns (NOMEN) ~50%, Verbs (VERB) ~30%, Adjectives (ADJEKTIV) ~15%, other (ADVERB/PHRASE) ~5%
- For nouns: include correct article (MASKULIN/FEMININ/NEUTRUM) and plural form
- For verbs: set article to null and plural to null
- For adjectives/adverbs: set article to null and plural to null
- Example sentences MUST be C1 appropriate — complex subordinate clauses, Konjunktiv I/II, Partizipialattribute, Nominalisierungen, passive constructions, academic register
- Vietnamese translations must be accurate and natural
- English translations must be precise
- Include NOTES for: register (gehoben/fachsprachlich/bildungssprachlich), collocations, similar words, usage tips
- NO duplicate words
- Nouns MUST be capitalized (German rule)
- Prefer compound nouns and nominalized forms typical of C1 register

Return ONLY a valid JSON array with NO markdown formatting, NO code blocks. Each object:

{
  "word": "die Auseinandersetzung",
  "article": "FEMININ",
  "plural": "die Auseinandersetzungen",
  "wordType": "NOMEN",
  "meaningVi": "sự tranh luận, xung đột",
  "meaningEn": "confrontation, dispute",
  "exampleSentence1": "Die politische Auseinandersetzung über die Rentenreform hat sich in den letzten Monaten verschärft.",
  "exampleTranslation1": "Cuộc tranh luận chính trị về cải cách hưu trí đã trở nên gay gắt hơn trong những tháng gần đây.",
  "exampleSentence2": "Eine sachliche Auseinandersetzung mit dem Thema ist unerlässlich, um fundierte Entscheidungen treffen zu können.",
  "exampleTranslation2": "Việc thảo luận khách quan về chủ đề này là không thể thiếu để có thể đưa ra các quyết định có cơ sở.",
  "notes": "Bildungssprachlich. Kollokation: eine Auseinandersetzung führen / vermeiden. Nicht verwechseln mit 'Streit' (eher umgangssprachlich)."
}

Generate exactly ${theme.words} words. Return ONLY the JSON array.`
}

async function generateTheme(theme: typeof THEMES[0]): Promise<boolean> {
    const filename = `${theme.num}-${theme.slug.replace('c1-', '')}.json`
    const filePath = path.join(CONTENT_DIR, filename)

    if (existsSync(filePath)) {
        const existing = JSON.parse(readFileSync(filePath, 'utf8'))
        if (existing.words && existing.words.length >= theme.words) {
            console.log(`  ⏭️ Already exists with ${existing.words.length} words`)
            return true
        }
    }

    if (dryRun) {
        console.log(`  🏃 Would generate ${theme.words} words`)
        return true
    }

    const prompt = buildPrompt(theme)

    try {
        const response = await genai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { temperature: 0.7 },
        })

        const text = response.text || ''
        let jsonStr = text.trim()
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        }

        const words = JSON.parse(jsonStr)
        if (!Array.isArray(words) || words.length === 0) {
            console.log(`  ❌ Invalid response`)
            return false
        }

        const valid = words.filter((w: any) =>
            w.word && w.wordType && w.meaningVi && w.meaningEn &&
            w.exampleSentence1 && w.exampleTranslation1
        )

        const data = {
            theme: {
                slug: theme.slug,
                name: theme.name,
                nameVi: theme.nameVi,
                nameEn: theme.nameEn,
                sortOrder: parseInt(theme.num),
                imageUrl: `/images/themes/${theme.slug}.png`,
            },
            words: valid,
        }

        mkdirSync(CONTENT_DIR, { recursive: true })
        writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n')
        console.log(`  ✅ Generated ${valid.length} words → ${filename}`)
        return true
    } catch (err: any) {
        console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`)
        return false
    }
}

async function main() {
    console.log('🦊 C1 Vocabulary Generator')
    console.log('==========================')
    if (dryRun) console.log('🏃 DRY RUN')
    console.log('')

    let themes = THEMES
    if (themeFilter) {
        themes = themes.filter(t => t.num === themeFilter)
        console.log(`🎯 Filter: theme ${themeFilter}`)
    }

    let success = 0, failed = 0, totalWords = 0

    for (const theme of themes) {
        console.log(`\n📂 ${theme.name} (${theme.num})`)
        console.log('---')
        const ok = await generateTheme(theme)
        if (ok) { success++; totalWords += theme.words } else { failed++ }
        if (!dryRun) await sleep(3000)
    }

    console.log('\n==========================')
    console.log(`📊 Themes: ✅ ${success} | ❌ ${failed}`)
    console.log(`📝 Total words: ~${totalWords}`)
    console.log('🦊 Done!')
}

main().catch(console.error)
