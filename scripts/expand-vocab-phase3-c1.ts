/**
 * Phase 3 Vocabulary Expansion — C1
 *
 * Generates 40 new C1 vocabulary themes to reach CEFR cumulative target (≥6,000).
 * Current C1: 20 themes, 554 words (DB). Cumulative: 4,602.
 *
 * Usage:
 *   npx tsx scripts/expand-vocab-phase3-c1.ts               # all
 *   npx tsx scripts/expand-vocab-phase3-c1.ts --dry-run      # preview
 *   npx tsx scripts/expand-vocab-phase3-c1.ts --from=35      # resume from theme 35
 */

import { GoogleGenAI } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
if (!GEMINI_API_KEY) { console.error('❌ GEMINI_API_KEY not found'); process.exit(1) }

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'c1', 'vocabulary')

interface ThemeDef { num: string; slug: string; name: string; nameVi: string; nameEn: string; words: number }

const NEW_THEMES: ThemeDef[] = [
    // Recht & Staat
    { num: '21', slug: 'c1-voelkerrecht-souveraenitaet', name: 'Völkerrecht & Souveränität', nameVi: 'Luật quốc tế & Chủ quyền', nameEn: 'International Law & Sovereignty', words: 35 },
    { num: '22', slug: 'c1-verwaltungsrecht-behörden', name: 'Verwaltungsrecht & Behörden', nameVi: 'Luật hành chính & Cơ quan', nameEn: 'Administrative Law & Authorities', words: 35 },
    { num: '23', slug: 'c1-grundrechte-verfassung', name: 'Grundrechte & Verfassung', nameVi: 'Quyền cơ bản & Hiến pháp', nameEn: 'Fundamental Rights & Constitution', words: 35 },
    { num: '24', slug: 'c1-justizwesen-strafvollzug', name: 'Justizwesen & Strafvollzug', nameVi: 'Tư pháp & Thi hành án', nameEn: 'Judiciary & Penal System', words: 35 },

    // Wirtschaft & Finanzen
    { num: '25', slug: 'c1-geldpolitik-zentralbank', name: 'Geldpolitik & Zentralbank', nameVi: 'Chính sách tiền tệ & Ngân hàng TW', nameEn: 'Monetary Policy & Central Banking', words: 35 },
    { num: '26', slug: 'c1-handelsabkommen-zoll', name: 'Handelsabkommen & Zoll', nameVi: 'Hiệp định thương mại & Hải quan', nameEn: 'Trade Agreements & Customs', words: 35 },
    { num: '27', slug: 'c1-konjunktur-wirtschaftskrise', name: 'Konjunktur & Wirtschaftskrise', nameVi: 'Chu kỳ kinh tế & Khủng hoảng', nameEn: 'Economic Cycle & Crisis', words: 35 },
    { num: '28', slug: 'c1-steuerpolitik-haushalt', name: 'Steuerpolitik & Staatshaushalt', nameVi: 'Chính sách thuế & Ngân sách nhà nước', nameEn: 'Tax Policy & National Budget', words: 35 },

    // Wissenschaft & Forschung
    { num: '29', slug: 'c1-quantenphysik-grundlagen', name: 'Quantenphysik (Grundlagen)', nameVi: 'Vật lý lượng tử (Cơ bản)', nameEn: 'Quantum Physics (Basics)', words: 35 },
    { num: '30', slug: 'c1-genetik-evolution', name: 'Genetik & Evolution', nameVi: 'Di truyền học & Tiến hóa', nameEn: 'Genetics & Evolution', words: 35 },
    { num: '31', slug: 'c1-kuenstliche-intelligenz-ml', name: 'Künstliche Intelligenz & ML', nameVi: 'Trí tuệ nhân tạo & Máy học', nameEn: 'Artificial Intelligence & ML', words: 35 },
    { num: '32', slug: 'c1-klimaforschung-modellierung', name: 'Klimaforschung & Modellierung', nameVi: 'Nghiên cứu khí hậu & Mô hình hóa', nameEn: 'Climate Research & Modeling', words: 35 },

    // Gesellschaft & Kultur
    { num: '33', slug: 'c1-migrationsdebatte', name: 'Migrationsdebatte & Integration', nameVi: 'Tranh luận di cư & Hòa nhập', nameEn: 'Migration Debate & Integration', words: 35 },
    { num: '34', slug: 'c1-geschlechtergerechtigkeit', name: 'Geschlechtergerechtigkeit', nameVi: 'Bình đẳng giới', nameEn: 'Gender Equality', words: 35 },
    { num: '35', slug: 'c1-urbanisierung-smart-city', name: 'Urbanisierung & Smart City', nameVi: 'Đô thị hóa & Thành phố thông minh', nameEn: 'Urbanization & Smart City', words: 35 },
    { num: '36', slug: 'c1-generationenkonflikt', name: 'Generationenkonflikt & Wandel', nameVi: 'Xung đột thế hệ & Thay đổi', nameEn: 'Generational Conflict & Change', words: 35 },

    // Medien & Kommunikation
    { num: '37', slug: 'c1-desinformation-faktencheck', name: 'Desinformation & Faktencheck', nameVi: 'Tin giả & Kiểm chứng', nameEn: 'Disinformation & Fact-checking', words: 35 },
    { num: '38', slug: 'c1-pressefreiheit-zensur', name: 'Pressefreiheit & Zensur', nameVi: 'Tự do báo chí & Kiểm duyệt', nameEn: 'Press Freedom & Censorship', words: 35 },
    { num: '39', slug: 'c1-algorithmen-filterblasen', name: 'Algorithmen & Filterblasen', nameVi: 'Thuật toán & Bong bóng lọc', nameEn: 'Algorithms & Filter Bubbles', words: 35 },

    // Psychologie & Bildung
    { num: '40', slug: 'c1-kognitionswissenschaft', name: 'Kognitionswissenschaft', nameVi: 'Khoa học nhận thức', nameEn: 'Cognitive Science', words: 35 },
    { num: '41', slug: 'c1-entwicklungspsychologie', name: 'Entwicklungspsychologie', nameVi: 'Tâm lý học phát triển', nameEn: 'Developmental Psychology', words: 35 },
    { num: '42', slug: 'c1-paedagogik-didaktik', name: 'Pädagogik & Didaktik', nameVi: 'Sư phạm & Phương pháp giảng dạy', nameEn: 'Pedagogy & Didactics', words: 35 },

    // Umwelt & Technik
    { num: '43', slug: 'c1-kreislaufwirtschaft', name: 'Kreislaufwirtschaft & Ressourcen', nameVi: 'Kinh tế tuần hoàn & Tài nguyên', nameEn: 'Circular Economy & Resources', words: 35 },
    { num: '44', slug: 'c1-biotechnologie-pharma', name: 'Biotechnologie & Pharma', nameVi: 'Công nghệ sinh học & Dược phẩm', nameEn: 'Biotechnology & Pharma', words: 35 },
    { num: '45', slug: 'c1-nanotechnologie', name: 'Nanotechnologie & Materialwissenschaft', nameVi: 'Công nghệ nano & Khoa học vật liệu', nameEn: 'Nanotechnology & Materials Science', words: 35 },

    // Philosophie & Ethik
    { num: '46', slug: 'c1-wirtschaftsethik', name: 'Wirtschaftsethik & CSR', nameVi: 'Đạo đức kinh doanh & CSR', nameEn: 'Business Ethics & CSR', words: 35 },
    { num: '47', slug: 'c1-medizinethik-patientenrecht', name: 'Medizinethik & Patientenrecht', nameVi: 'Đạo đức y khoa & Quyền bệnh nhân', nameEn: 'Medical Ethics & Patient Rights', words: 35 },
    { num: '48', slug: 'c1-tierethik-tierschutz', name: 'Tierethik & Tierschutz', nameVi: 'Đạo đức động vật & Bảo vệ', nameEn: 'Animal Ethics & Protection', words: 35 },

    // Kunst & Literatur
    { num: '49', slug: 'c1-theaterwissenschaft', name: 'Theaterwissenschaft & Dramatik', nameVi: 'Nghiên cứu sân khấu & Kịch nghệ', nameEn: 'Theater Studies & Drama', words: 35 },
    { num: '50', slug: 'c1-kunstgeschichte-epochen', name: 'Kunstgeschichte & Epochen', nameVi: 'Lịch sử nghệ thuật & Thời kỳ', nameEn: 'Art History & Periods', words: 35 },
    { num: '51', slug: 'c1-filmtheorie-analyse', name: 'Filmtheorie & Analyse', nameVi: 'Lý thuyết phim & Phân tích', nameEn: 'Film Theory & Analysis', words: 35 },

    // Internationale Beziehungen
    { num: '52', slug: 'c1-sicherheitspolitik-nato', name: 'Sicherheitspolitik & NATO', nameVi: 'Chính sách an ninh & NATO', nameEn: 'Security Policy & NATO', words: 35 },
    { num: '53', slug: 'c1-entwicklungshilfe-ngos', name: 'Entwicklungshilfe & NGOs', nameVi: 'Viện trợ phát triển & NGOs', nameEn: 'Development Aid & NGOs', words: 35 },
    { num: '54', slug: 'c1-flucht-asylrecht', name: 'Flucht & Asylrecht', nameVi: 'Tị nạn & Quyền tị nạn', nameEn: 'Refugees & Asylum Law', words: 35 },

    // Gesundheit & Medizin
    { num: '55', slug: 'c1-epidemiologie-pandemie', name: 'Epidemiologie & Pandemie', nameVi: 'Dịch tễ học & Đại dịch', nameEn: 'Epidemiology & Pandemic', words: 35 },
    { num: '56', slug: 'c1-psychosomatik', name: 'Psychosomatik & Ganzheitsmedizin', nameVi: 'Y học tâm thể & Toàn diện', nameEn: 'Psychosomatics & Holistic Medicine', words: 35 },

    // Digitale Gesellschaft
    { num: '57', slug: 'c1-blockchain-kryptowaehrung', name: 'Blockchain & Kryptowährung', nameVi: 'Blockchain & Tiền mã hóa', nameEn: 'Blockchain & Cryptocurrency', words: 35 },
    { num: '58', slug: 'c1-cybersicherheit-cyberkrieg', name: 'Cybersicherheit & Cyberkrieg', nameVi: 'An ninh mạng & Chiến tranh mạng', nameEn: 'Cybersecurity & Cyber Warfare', words: 35 },

    // Soziologie
    { num: '59', slug: 'c1-soziale-netzwerke-analyse', name: 'Soziale Netzwerke & Analyse', nameVi: 'Mạng xã hội & Phân tích', nameEn: 'Social Networks & Analysis', words: 35 },
    { num: '60', slug: 'c1-arbeitssoziologie-prekaritaet', name: 'Arbeitssoziologie & Prekarität', nameVi: 'Xã hội học lao động & Bất ổn', nameEn: 'Sociology of Work & Precarity', words: 35 },
]

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const startFrom = args.find(a => a.startsWith('--from='))?.split('=')[1]

function sleep(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)) }

function buildPrompt(theme: ThemeDef): string {
    return `You are an expert German language teacher creating C1-level (CEFR) vocabulary for a language learning app.

Theme: "${theme.name}" (${theme.nameEn})
Level: C1 (Fortgeschritten/Advanced) — learners can understand demanding, longer texts and recognize implicit meaning. Can express ideas fluently and spontaneously. Can use language flexibly and effectively for social, academic and professional purposes.

Generate exactly ${theme.words} German words for this theme at C1 level.

RULES:
- Words MUST be C1 level — sophisticated, academic, precise vocabulary
- C1 means: expressing nuanced opinions, understanding implicit meaning, academic & professional contexts
- Include: Nouns (NOMEN) ~50%, Verbs (VERB) ~25%, Adjectives (ADJEKTIV) ~20%, Others ~5%
- For nouns: include correct article (MASKULIN/FEMININ/NEUTRUM) and plural form
- For verbs/adjectives: set article and plural to null
- Example sentences must demonstrate C1-level complexity and usage
- Vietnamese and English translations must be accurate
- Include compound nouns, nominalized verbs, academic register
- NO basic A1-B2 vocabulary
- Nouns MUST be capitalized

Return ONLY a valid JSON array. Each object:
{
  "word": "...",
  "article": "MASKULIN" | "FEMININ" | "NEUTRUM" | null,
  "plural": "die ..." | null,
  "wordType": "NOMEN" | "VERB" | "ADJEKTIV" | "ADVERB" | "PRAEPOSITION" | "PARTIKEL",
  "meaningVi": "...",
  "meaningEn": "...",
  "exampleSentence1": "...",
  "exampleTranslation1": "... (Vietnamese)",
  "exampleSentence2": "...",
  "exampleTranslation2": "... (Vietnamese)"
}

Generate exactly ${theme.words} words. Return ONLY the JSON array, no markdown.`
}

async function generateTheme(theme: ThemeDef): Promise<boolean> {
    const slugNoPrefix = theme.slug.replace('c1-', '')
    const filename = `${theme.num}-${slugNoPrefix}.json`
    const filePath = path.join(CONTENT_DIR, filename)

    if (existsSync(filePath)) {
        try {
            const existing = JSON.parse(readFileSync(filePath, 'utf8'))
            if (existing.words?.length >= theme.words) {
                console.log(`  ⏭️ Already exists (${existing.words.length} words)`)
                return true
            }
        } catch { /* regenerate */ }
    }

    if (dryRun) { console.log(`  🏃 Would generate ${theme.words} words → ${filename}`); return true }

    try {
        const response = await genai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: buildPrompt(theme),
            config: { temperature: 0.7 },
        })

        const text = response.text || ''
        let jsonStr = text.trim()
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')

        const words = JSON.parse(jsonStr)
        if (!Array.isArray(words) || words.length === 0) { console.log(`  ❌ Invalid response`); return false }

        const valid = words.filter((w: any) => w.word && w.wordType && w.meaningVi && w.meaningEn && w.exampleSentence1 && w.exampleTranslation1)

        const data = {
            theme: { slug: theme.slug, name: theme.name, nameVi: theme.nameVi, nameEn: theme.nameEn, sortOrder: parseInt(theme.num), imageUrl: `/images/themes/${theme.slug}.png` },
            words: valid,
        }

        mkdirSync(CONTENT_DIR, { recursive: true })
        writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n')
        console.log(`  ✅ ${valid.length} words → ${filename}`)
        return true
    } catch (err: any) { console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`); return false }
}

async function main() {
    console.log('🦊 Phase 3 Vocabulary Expansion — C1')
    console.log('=====================================')
    if (dryRun) console.log('🏃 DRY RUN')

    let themes = NEW_THEMES
    if (startFrom) {
        const idx = themes.findIndex(t => t.num === startFrom)
        if (idx >= 0) { themes = themes.slice(idx); console.log(`🎯 Starting from theme ${startFrom} (${themes.length} remaining)`) }
    }

    console.log(`\n📚 C1 — ${themes.length} new themes\n${'─'.repeat(40)}`)

    let success = 0, failed = 0
    for (const theme of themes) {
        console.log(`\n  🔄 ${theme.name} (${theme.nameEn})`)
        const ok = await generateTheme(theme)
        if (ok) success++; else failed++
        if (!dryRun) await sleep(4000)
    }

    console.log(`\n=====================================\n📊 ✅ ${success} | ❌ ${failed}\n📝 ~${success * 35} new words\n🦊 Done!`)
}

main().catch(console.error)
