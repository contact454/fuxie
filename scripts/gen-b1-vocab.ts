/**
 * B1 Vocabulary Generator
 * Uses Gemini to generate B1-level German vocabulary for 20 themes.
 * Creates JSON files in content/b1/vocabulary/ following A1/A2 structure.
 *
 * Usage:
 *   npx tsx scripts/gen-b1-vocab.ts               # all themes
 *   npx tsx scripts/gen-b1-vocab.ts --theme=01     # specific theme
 *   npx tsx scripts/gen-b1-vocab.ts --dry-run      # preview only
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
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'b1', 'vocabulary')

// B1 Theme definitions
const THEMES = [
    { num: '01', slug: 'b1-persoenlichkeit-charakter', name: 'Persönlichkeit & Charakter', nameVi: 'Tính cách & Nhân cách', nameEn: 'Personality & Character', words: 35 },
    { num: '02', slug: 'b1-beziehungen-zusammenleben', name: 'Beziehungen & Zusammenleben', nameVi: 'Quan hệ & Chung sống', nameEn: 'Relationships & Cohabitation', words: 35 },
    { num: '03', slug: 'b1-gesundheit-ernaehrung', name: 'Gesundheit & Ernährung', nameVi: 'Sức khỏe & Dinh dưỡng', nameEn: 'Health & Nutrition', words: 35 },
    { num: '04', slug: 'b1-wohnen-umzug', name: 'Wohnen & Umzug', nameVi: 'Nhà ở & Chuyển nhà', nameEn: 'Housing & Moving', words: 35 },
    { num: '05', slug: 'b1-natur-umweltschutz', name: 'Natur & Umweltschutz', nameVi: 'Thiên nhiên & Bảo vệ Môi trường', nameEn: 'Nature & Environmental Protection', words: 35 },
    { num: '06', slug: 'b1-ernaehrung-kochen', name: 'Ernährung & Kochen', nameVi: 'Ẩm thực & Nấu ăn', nameEn: 'Nutrition & Cooking', words: 35 },
    { num: '07', slug: 'b1-mode-konsum', name: 'Mode & Konsum', nameVi: 'Thời trang & Tiêu dùng', nameEn: 'Fashion & Consumption', words: 35 },
    { num: '08', slug: 'b1-behoerden-buerokratie', name: 'Behörden & Bürokratie', nameVi: 'Cơ quan & Thủ tục hành chính', nameEn: 'Authorities & Bureaucracy', words: 35 },
    { num: '09', slug: 'b1-ausbildung-studium', name: 'Ausbildung & Studium', nameVi: 'Đào tạo & Đại học', nameEn: 'Education & University', words: 35 },
    { num: '10', slug: 'b1-beruf-karriere', name: 'Beruf & Karriere', nameVi: 'Nghề nghiệp & Sự nghiệp', nameEn: 'Profession & Career', words: 35 },
    { num: '11', slug: 'b1-kunst-unterhaltung', name: 'Kunst & Unterhaltung', nameVi: 'Nghệ thuật & Giải trí', nameEn: 'Art & Entertainment', words: 35 },
    { num: '12', slug: 'b1-nachrichten-politik', name: 'Nachrichten & Politik', nameVi: 'Tin tức & Chính trị', nameEn: 'News & Politics', words: 35 },
    { num: '13', slug: 'b1-reisen-abenteuer', name: 'Reisen & Abenteuer', nameVi: 'Du lịch & Phiêu lưu', nameEn: 'Travel & Adventure', words: 35 },
    { num: '14', slug: 'b1-feste-traditionen', name: 'Feste & Traditionen', nameVi: 'Lễ hội & Phong tục', nameEn: 'Celebrations & Traditions', words: 35 },
    { num: '15', slug: 'b1-psychologie-wohlbefinden', name: 'Psychologie & Wohlbefinden', nameVi: 'Tâm lý & Hạnh phúc', nameEn: 'Psychology & Well-being', words: 35 },
    { num: '16', slug: 'b1-digitales-leben-internet', name: 'Digitales Leben & Internet', nameVi: 'Cuộc sống số & Internet', nameEn: 'Digital Life & Internet', words: 35 },
    { num: '17', slug: 'b1-recht-gerechtigkeit', name: 'Recht & Gerechtigkeit', nameVi: 'Pháp luật & Công lý', nameEn: 'Law & Justice', words: 35 },
    { num: '18', slug: 'b1-wirtschaft-handel', name: 'Wirtschaft & Handel', nameVi: 'Kinh tế & Thương mại', nameEn: 'Economy & Trade', words: 35 },
    { num: '19', slug: 'b1-verkehr-infrastruktur', name: 'Verkehr & Infrastruktur', nameVi: 'Giao thông & Hạ tầng', nameEn: 'Traffic & Infrastructure', words: 35 },
    { num: '20', slug: 'b1-klima-nachhaltigkeit', name: 'Klima & Nachhaltigkeit', nameVi: 'Khí hậu & Phát triển bền vững', nameEn: 'Climate & Sustainability', words: 35 },
]

// Parse CLI args
const args = process.argv.slice(2)
const themeFilter = args.find(a => a.startsWith('--theme='))?.split('=')[1]
const dryRun = args.includes('--dry-run')

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function buildPrompt(theme: typeof THEMES[0]): string {
    return `You are an expert German language teacher creating B1-level (CEFR) vocabulary for a language learning app called Fuxie.

Theme: "${theme.name}" (${theme.nameEn})

Generate exactly ${theme.words} German words for this theme at B1 level.

RULES:
- Words MUST be B1 level — not basic A1/A2 words, not advanced B2/C1 words
- B1 means: intermediate vocabulary for describing experiences, giving opinions, handling everyday situations
- Include a good mix of: Nouns (NOMEN) ~50%, Verbs (VERB) ~30%, Adjectives (ADJEKTIV) ~20%
- For nouns: include correct article (MASKULIN/FEMININ/NEUTRUM) and plural form (e.g. "die Erfahrungen")
- For verbs: set article to null and plural to null
- For adjectives: set article to null and plural to null
- Example sentences MUST be B1 appropriate — more complex than A2 but still accessible
- Vietnamese translations must be accurate and natural
- English translations must be precise
- NO duplicate words
- Nouns MUST be capitalized (German rule)

Return ONLY a valid JSON array with NO markdown formatting, NO code blocks. Each object must have exactly these fields:

For nouns:
{
  "word": "Erfahrung",
  "article": "FEMININ",
  "plural": "die Erfahrungen",
  "wordType": "NOMEN",
  "meaningVi": "kinh nghiệm",
  "meaningEn": "experience",
  "exampleSentence1": "Ich habe viel Erfahrung in diesem Bereich.",
  "exampleTranslation1": "Tôi có nhiều kinh nghiệm trong lĩnh vực này.",
  "exampleSentence2": "Diese Erfahrung hat mich sehr geprägt.",
  "exampleTranslation2": "Trải nghiệm này đã ảnh hưởng rất nhiều đến tôi."
}

For verbs:
{
  "word": "erleben",
  "article": null,
  "plural": null,
  "wordType": "VERB",
  "meaningVi": "trải nghiệm",
  "meaningEn": "to experience",
  "exampleSentence1": "Ich möchte viel erleben.",
  "exampleTranslation1": "Tôi muốn trải nghiệm nhiều.",
  "exampleSentence2": "Was hast du dort erlebt?",
  "exampleTranslation2": "Bạn đã trải nghiệm gì ở đó?"
}

For adjectives:
{
  "word": "selbstbewusst",
  "article": null,
  "plural": null,
  "wordType": "ADJEKTIV",
  "meaningVi": "tự tin",
  "meaningEn": "self-confident",
  "exampleSentence1": "Sie ist eine selbstbewusste Frau.",
  "exampleTranslation1": "Cô ấy là một phụ nữ tự tin.",
  "exampleSentence2": "Er tritt sehr selbstbewusst auf.",
  "exampleTranslation2": "Anh ấy xuất hiện rất tự tin."
}

Generate exactly ${theme.words} words. Return ONLY the JSON array.`
}

async function generateTheme(theme: typeof THEMES[0]): Promise<boolean> {
    const filename = `${theme.num}-${theme.slug.replace('b1-', '')}.json`
    const filePath = path.join(CONTENT_DIR, filename)

    // Skip if file exists and has enough words
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
            config: {
                temperature: 0.7,
            },
        })

        const text = response.text || ''
        let jsonStr = text.trim()
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        }

        const words = JSON.parse(jsonStr)

        if (!Array.isArray(words) || words.length === 0) {
            console.log(`  ❌ Invalid response — not an array or empty`)
            return false
        }

        // Validate words
        const valid = words.filter((w: any) =>
            w.word && w.wordType && w.meaningVi && w.meaningEn &&
            w.exampleSentence1 && w.exampleTranslation1
        )

        // Build JSON structure
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

        // Ensure directory exists
        mkdirSync(CONTENT_DIR, { recursive: true })

        // Write file
        writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n')
        console.log(`  ✅ Generated ${valid.length} words → ${filename}`)

        return true
    } catch (err: any) {
        console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`)
        return false
    }
}

async function main() {
    console.log('🦊 B1 Vocabulary Generator')
    console.log('==========================')
    if (dryRun) console.log('🏃 DRY RUN — no files will be created')
    console.log('')

    let themes = THEMES
    if (themeFilter) {
        themes = themes.filter(t => t.num === themeFilter)
        console.log(`🎯 Filter: theme ${themeFilter} (${themes.length} themes)`)
    }

    let success = 0
    let failed = 0
    let totalWords = 0

    for (const theme of themes) {
        console.log(`\n📂 ${theme.name} (${theme.num})`)
        console.log('---')

        const ok = await generateTheme(theme)
        if (ok) {
            success++
            totalWords += theme.words
        } else {
            failed++
        }

        // Rate limit
        if (!dryRun) await sleep(3000)
    }

    console.log('\n==========================')
    console.log(`📊 Themes: ✅ ${success} | ❌ ${failed}`)
    console.log(`📝 Total words: ~${totalWords}`)
    console.log('🦊 Done!')
}

main().catch(console.error)
