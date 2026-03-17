/**
 * C2 Vocabulary Generator
 * Uses Gemini to generate C2-level German vocabulary for 20 themes.
 * Creates JSON files in content/c2/vocabulary/
 *
 * Usage:
 *   npx tsx scripts/gen-c2-vocab.ts
 *   npx tsx scripts/gen-c2-vocab.ts --theme=01
 *   npx tsx scripts/gen-c2-vocab.ts --dry-run
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
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'c2', 'vocabulary')

// C2 Theme definitions — near-native, academic/literary, highly specialized
const THEMES = [
    { num: '01', slug: 'c2-epistemologie-wissenschaftstheorie', name: 'Epistemologie & Wissenschaftstheorie', nameVi: 'Nhận thức luận & Triết học khoa học', nameEn: 'Epistemology & Philosophy of Science', words: 35 },
    { num: '02', slug: 'c2-rechtsphilosophie-justiz', name: 'Rechtsphilosophie & Justiz', nameVi: 'Triết học pháp luật & Tư pháp', nameEn: 'Legal Philosophy & Justice', words: 35 },
    { num: '03', slug: 'c2-sozialpolitik-wohlfahrtsstaat', name: 'Sozialpolitik & Wohlfahrtsstaat', nameVi: 'Chính sách xã hội & Nhà nước phúc lợi', nameEn: 'Social Policy & Welfare State', words: 35 },
    { num: '04', slug: 'c2-literaturwissenschaft-hermeneutik', name: 'Literaturwissenschaft & Hermeneutik', nameVi: 'Khoa học văn chương & Chú giải học', nameEn: 'Literary Studies & Hermeneutics', words: 35 },
    { num: '05', slug: 'c2-aesthetik-kunstkritik', name: 'Ästhetik & Kunstkritik', nameVi: 'Mỹ học & Phê bình nghệ thuật', nameEn: 'Aesthetics & Art Criticism', words: 35 },
    { num: '06', slug: 'c2-anthropologie-ethnografie', name: 'Anthropologie & Ethnografie', nameVi: 'Nhân học & Dân tộc học', nameEn: 'Anthropology & Ethnography', words: 35 },
    { num: '07', slug: 'c2-psychoanalyse-tiefenpsychologie', name: 'Psychoanalyse & Tiefenpsychologie', nameVi: 'Phân tâm học & Tâm lý học chiều sâu', nameEn: 'Psychoanalysis & Depth Psychology', words: 35 },
    { num: '08', slug: 'c2-politische-rhetorik-demagogie', name: 'Politische Rhetorik & Demagogie', nameVi: 'Hùng biện chính trị & Mị dân', nameEn: 'Political Rhetoric & Demagoguery', words: 35 },
    { num: '09', slug: 'c2-transkulturalitaet-postkolonialismus', name: 'Transkulturalität & Postkolonialismus', nameVi: 'Xuyên văn hóa & Hậu thực dân', nameEn: 'Transculturality & Postcolonialism', words: 35 },
    { num: '10', slug: 'c2-oekonomische-paradigmen-kritik', name: 'Ökonomische Paradigmen & Kritik', nameVi: 'Mô thức kinh tế & Phê phán', nameEn: 'Economic Paradigms & Critique', words: 35 },
    { num: '11', slug: 'c2-mediensemiotik-kommunikationswissenschaft', name: 'Mediensemiotik & Kommunikationswissenschaft', nameVi: 'Ký hiệu học truyền thông & Khoa học truyền thông', nameEn: 'Media Semiotics & Communication Studies', words: 35 },
    { num: '12', slug: 'c2-religionswissenschaft-saekularisierung', name: 'Religionswissenschaft & Säkularisierung', nameVi: 'Khoa học tôn giáo & Thế tục hóa', nameEn: 'Religious Studies & Secularization', words: 35 },
    { num: '13', slug: 'c2-geschichtswissenschaft-erinnerungskultur', name: 'Geschichtswissenschaft & Erinnerungskultur', nameVi: 'Khoa học lịch sử & Văn hóa ký ức', nameEn: 'Historiography & Memory Culture', words: 35 },
    { num: '14', slug: 'c2-biopolitik-transhumanismus', name: 'Biopolitik & Transhumanismus', nameVi: 'Chính trị sinh học & Siêu nhân loại', nameEn: 'Biopolitics & Transhumanism', words: 35 },
    { num: '15', slug: 'c2-sprachphilosophie-semantik', name: 'Sprachphilosophie & Semantik', nameVi: 'Triết học ngôn ngữ & Ngữ nghĩa học', nameEn: 'Philosophy of Language & Semantics', words: 35 },
    { num: '16', slug: 'c2-architekturtheorie-raumaesthetik', name: 'Architekturtheorie & Raumästhetik', nameVi: 'Lý thuyết kiến trúc & Mỹ học không gian', nameEn: 'Architectural Theory & Spatial Aesthetics', words: 35 },
    { num: '17', slug: 'c2-musikwissenschaft-kulturindustrie', name: 'Musikwissenschaft & Kulturindustrie', nameVi: 'Âm nhạc học & Công nghiệp văn hóa', nameEn: 'Musicology & Culture Industry', words: 35 },
    { num: '18', slug: 'c2-umweltethik-ressourcengerechtigkeit', name: 'Umweltethik & Ressourcengerechtigkeit', nameVi: 'Đạo đức môi trường & Công bằng tài nguyên', nameEn: 'Environmental Ethics & Resource Justice', words: 35 },
    { num: '19', slug: 'c2-bildungstheorie-paedagogik', name: 'Bildungstheorie & Pädagogik', nameVi: 'Lý thuyết giáo dục & Sư phạm', nameEn: 'Educational Theory & Pedagogy', words: 35 },
    { num: '20', slug: 'c2-diplomatische-sprache-voelkerrecht', name: 'Diplomatische Sprache & Völkerrecht', nameVi: 'Ngôn ngữ ngoại giao & Luật quốc tế', nameEn: 'Diplomatic Language & International Law', words: 35 },
]

const args = process.argv.slice(2)
const themeFilter = args.find(a => a.startsWith('--theme='))?.split('=')[1]
const startFrom = args.find(a => a.startsWith('--start='))?.split('=')[1]
const dryRun = args.includes('--dry-run')

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

function buildPrompt(theme: typeof THEMES[0]): string {
    return `You are an expert German language teacher creating C2-level (CEFR) vocabulary for a language learning app called Fuxie.

Theme: "${theme.name}" (${theme.nameEn})

Generate exactly ${theme.words} German words for this theme at C2 level.

RULES:
- Words MUST be C2 level — near-native mastery, NOT C1 or lower
- C2 means: can understand virtually everything, express precisely with fine shades of meaning, reconstruct arguments in cohesive presentations, use language in highly sophisticated academic and professional contexts
- Include a good mix of: Nouns (NOMEN) ~50%, Verbs (VERB) ~25%, Adjectives (ADJEKTIV) ~15%, other (ADVERB/PHRASE/PARTIKEL) ~10%
- For nouns: include correct article (MASKULIN/FEMININ/NEUTRUM) and plural form
- For verbs: include conjugation object with keys "praesens" (ich/du/er forms), "praeteritum" (ich form), "perfekt" (hat/ist + Partizip II). Set article to null and plural to null
- For adjectives/adverbs: set article to null, plural to null, conjugation to null
- For phrases: set wordType to "PHRASE", article to null, plural to null, conjugation to null
- Example sentences MUST demonstrate C2 mastery — elaborate Konjunktiv I (indirekte Rede), Konjunktiv II (irrealis), Partizipialattribute, extended Nominalstil, Passiversatzformen, gehobener Stil, fachsprachliche Register
- Vietnamese translations must be accurate and natural
- English translations must be precise
- Include NOTES for: register (gehoben/fachsprachlich/bildungssprachlich/amtssprachlich), etymology where helpful, stylistic nuances, common collocations, similar/contrasting terms, usage restrictions
- NO duplicate words
- Nouns MUST be capitalized (German rule)
- Prefer highly specialized compound nouns, abstract nominalizations, academic Funktionsverbgefüge, and literary/rhetorical vocabulary typical of C2 register
- Words should NOT overlap with common C1-level vocabulary

Return ONLY a valid JSON array with NO markdown formatting, NO code blocks. Each object:

{
  "word": "die Diskursanalyse",
  "article": "FEMININ",
  "plural": "die Diskursanalysen",
  "wordType": "NOMEN",
  "meaningVi": "phân tích diễn ngôn",
  "meaningEn": "discourse analysis",
  "exampleSentence1": "Die Diskursanalyse nach Foucault ermöglicht es, die Machtstrukturen hinter scheinbar neutralen Aussagen offenzulegen.",
  "exampleTranslation1": "Phân tích diễn ngôn theo Foucault cho phép phơi bày các cấu trúc quyền lực đằng sau những phát ngôn tưởng chừng trung lập.",
  "exampleSentence2": "Mittels einer systematischen Diskursanalyse ließe sich nachweisen, inwiefern die mediale Berichterstattung das öffentliche Bewusstsein prägt.",
  "exampleTranslation2": "Bằng phương pháp phân tích diễn ngôn có hệ thống, có thể chứng minh được mức độ ảnh hưởng của báo chí đối với nhận thức công chúng.",
  "notes": "Fachsprachlich (Linguistik/Soziologie). Kollokation: eine Diskursanalyse durchführen/anwenden. Vgl. auch: Diskurstheorie, Diskursethik (Habermas). Nicht zu verwechseln mit 'Gesprächsanalyse' (conversation analysis)."
}

Generate exactly ${theme.words} words. Return ONLY the JSON array.`
}

async function generateTheme(theme: typeof THEMES[0]): Promise<boolean> {
    const filename = `${theme.num}-${theme.slug.replace('c2-', '')}.json`
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
    console.log('🦊 C2 Vocabulary Generator')
    console.log('==========================')
    if (dryRun) console.log('🏃 DRY RUN')
    console.log('')

    let themes = THEMES
    if (themeFilter) {
        themes = themes.filter(t => t.num === themeFilter)
        console.log(`🎯 Filter: theme ${themeFilter}`)
    }
    if (startFrom) {
        themes = themes.filter(t => t.num >= startFrom)
        console.log(`🎯 Starting from: theme ${startFrom}`)
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
