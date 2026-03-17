/**
 * B2 Vocabulary Generator
 * Uses Gemini to generate B2-level German vocabulary for 20 themes.
 * Creates JSON files in content/b2/vocabulary/
 *
 * Usage:
 *   npx tsx scripts/gen-b2-vocab.ts
 *   npx tsx scripts/gen-b2-vocab.ts --theme=01
 *   npx tsx scripts/gen-b2-vocab.ts --dry-run
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
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'b2', 'vocabulary')

// B2 Theme definitions — upper-intermediate, more abstract/academic
const THEMES = [
    { num: '01', slug: 'b2-identitaet-selbstbild', name: 'Identität & Selbstbild', nameVi: 'Bản sắc & Hình ảnh bản thân', nameEn: 'Identity & Self-Image', words: 35 },
    { num: '02', slug: 'b2-zwischenmenschliches', name: 'Zwischenmenschliche Beziehungen', nameVi: 'Quan hệ giữa người với người', nameEn: 'Interpersonal Relationships', words: 35 },
    { num: '03', slug: 'b2-medizin-forschung', name: 'Medizin & Forschung', nameVi: 'Y học & Nghiên cứu', nameEn: 'Medicine & Research', words: 35 },
    { num: '04', slug: 'b2-architektur-stadtplanung', name: 'Architektur & Stadtplanung', nameVi: 'Kiến trúc & Quy hoạch đô thị', nameEn: 'Architecture & Urban Planning', words: 35 },
    { num: '05', slug: 'b2-oekologie-artenvielfalt', name: 'Ökologie & Artenvielfalt', nameVi: 'Sinh thái & Đa dạng sinh học', nameEn: 'Ecology & Biodiversity', words: 35 },
    { num: '06', slug: 'b2-ernaehrungswissenschaft', name: 'Ernährungswissenschaft', nameVi: 'Khoa học dinh dưỡng', nameEn: 'Nutritional Science', words: 35 },
    { num: '07', slug: 'b2-konsumverhalten-werbung', name: 'Konsumverhalten & Werbung', nameVi: 'Hành vi tiêu dùng & Quảng cáo', nameEn: 'Consumer Behavior & Advertising', words: 35 },
    { num: '08', slug: 'b2-migration-integration', name: 'Migration & Integration', nameVi: 'Di cư & Hội nhập', nameEn: 'Migration & Integration', words: 35 },
    { num: '09', slug: 'b2-wissenschaft-hochschule', name: 'Wissenschaft & Hochschule', nameVi: 'Khoa học & Đại học', nameEn: 'Science & Higher Education', words: 35 },
    { num: '10', slug: 'b2-arbeitswelt-globalisierung', name: 'Arbeitswelt & Globalisierung', nameVi: 'Thế giới việc làm & Toàn cầu hóa', nameEn: 'Working World & Globalization', words: 35 },
    { num: '11', slug: 'b2-literatur-philosophie', name: 'Literatur & Philosophie', nameVi: 'Văn học & Triết học', nameEn: 'Literature & Philosophy', words: 35 },
    { num: '12', slug: 'b2-medienlandschaft-ethik', name: 'Medienlandschaft & Ethik', nameVi: 'Truyền thông & Đạo đức', nameEn: 'Media Landscape & Ethics', words: 35 },
    { num: '13', slug: 'b2-tourismus-kulturerbe', name: 'Tourismus & Kulturerbe', nameVi: 'Du lịch & Di sản văn hóa', nameEn: 'Tourism & Cultural Heritage', words: 35 },
    { num: '14', slug: 'b2-kulturvergleich-vielfalt', name: 'Kulturvergleich & Vielfalt', nameVi: 'So sánh VH & Đa dạng', nameEn: 'Cross-Cultural Comparison & Diversity', words: 35 },
    { num: '15', slug: 'b2-emotionale-intelligenz', name: 'Emotionale Intelligenz', nameVi: 'Trí tuệ cảm xúc', nameEn: 'Emotional Intelligence', words: 35 },
    { num: '16', slug: 'b2-kuenstliche-intelligenz', name: 'Künstliche Intelligenz & Digitalisierung', nameVi: 'Trí tuệ nhân tạo & Số hóa', nameEn: 'AI & Digitalization', words: 35 },
    { num: '17', slug: 'b2-menschenrechte-demokratie', name: 'Menschenrechte & Demokratie', nameVi: 'Nhân quyền & Dân chủ', nameEn: 'Human Rights & Democracy', words: 35 },
    { num: '18', slug: 'b2-finanzsystem-boerse', name: 'Finanzsystem & Börse', nameVi: 'Hệ thống tài chính & Chứng khoán', nameEn: 'Financial System & Stock Market', words: 35 },
    { num: '19', slug: 'b2-mobilitaet-zukunft', name: 'Mobilität der Zukunft', nameVi: 'Giao thông tương lai', nameEn: 'Future Mobility', words: 35 },
    { num: '20', slug: 'b2-energiewende-innovation', name: 'Energiewende & Innovation', nameVi: 'Chuyển đổi năng lượng & Đổi mới', nameEn: 'Energy Transition & Innovation', words: 35 },
]

const args = process.argv.slice(2)
const themeFilter = args.find(a => a.startsWith('--theme='))?.split('=')[1]
const dryRun = args.includes('--dry-run')

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function buildPrompt(theme: typeof THEMES[0]): string {
    return `You are an expert German language teacher creating B2-level (CEFR) vocabulary for a language learning app called Fuxie.

Theme: "${theme.name}" (${theme.nameEn})

Generate exactly ${theme.words} German words for this theme at B2 level.

RULES:
- Words MUST be B2 level — upper-intermediate, NOT basic A1-B1 words, NOT advanced C1/C2 words
- B2 means: can understand complex texts, interact fluently, produce clear detailed text on a wide range of subjects
- Include a good mix of: Nouns (NOMEN) ~50%, Verbs (VERB) ~30%, Adjectives (ADJEKTIV) ~20%
- For nouns: include correct article (MASKULIN/FEMININ/NEUTRUM) and plural form
- For verbs: set article to null and plural to null
- For adjectives: set article to null and plural to null
- Example sentences MUST be B2 appropriate — complex structures, subordinate clauses, Konjunktiv II
- Vietnamese translations must be accurate and natural
- English translations must be precise
- NO duplicate words
- Nouns MUST be capitalized (German rule)

Return ONLY a valid JSON array with NO markdown formatting, NO code blocks. Each object:

{
  "word": "die Herausforderung",
  "article": "FEMININ",
  "plural": "die Herausforderungen",
  "wordType": "NOMEN",
  "meaningVi": "thách thức",
  "meaningEn": "challenge",
  "exampleSentence1": "Die größte Herausforderung besteht darin, alle Beteiligten zufriedenzustellen.",
  "exampleTranslation1": "Thách thức lớn nhất là làm hài lòng tất cả các bên liên quan.",
  "exampleSentence2": "Er sieht die neue Aufgabe als eine spannende Herausforderung.",
  "exampleTranslation2": "Anh ấy coi nhiệm vụ mới là một thách thức thú vị."
}

Generate exactly ${theme.words} words. Return ONLY the JSON array.`
}

async function generateTheme(theme: typeof THEMES[0]): Promise<boolean> {
    const filename = `${theme.num}-${theme.slug.replace('b2-', '')}.json`
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
    console.log('🦊 B2 Vocabulary Generator')
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
