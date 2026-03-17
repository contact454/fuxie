/**
 * Phase 3 Vocabulary Expansion — C2
 *
 * Generates 40 new C2 vocabulary themes.
 * Current C2: 20 themes, 471 words (DB).
 *
 * Usage:
 *   npx tsx scripts/expand-vocab-phase3-c2.ts
 *   npx tsx scripts/expand-vocab-phase3-c2.ts --dry-run
 *   npx tsx scripts/expand-vocab-phase3-c2.ts --from=35
 */

import { GoogleGenAI } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
if (!GEMINI_API_KEY) { console.error('❌ GEMINI_API_KEY not found'); process.exit(1) }

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'c2', 'vocabulary')

interface ThemeDef { num: string; slug: string; name: string; nameVi: string; nameEn: string; words: number }

const NEW_THEMES: ThemeDef[] = [
    // Philosophie & Metaphysik
    { num: '21', slug: 'c2-metaphysik-ontologie', name: 'Metaphysik & Ontologie', nameVi: 'Siêu hình học & Bản thể luận', nameEn: 'Metaphysics & Ontology', words: 35 },
    { num: '22', slug: 'c2-existenzphilosophie', name: 'Existenzphilosophie', nameVi: 'Triết học hiện sinh', nameEn: 'Existential Philosophy', words: 35 },
    { num: '23', slug: 'c2-poststrukturalismus', name: 'Poststrukturalismus & Dekonstruktion', nameVi: 'Hậu cấu trúc & Giải cấu trúc', nameEn: 'Post-structuralism & Deconstruction', words: 35 },
    { num: '24', slug: 'c2-kritische-theorie', name: 'Kritische Theorie & Frankfurter Schule', nameVi: 'Lý thuyết phê phán & Trường phái Frankfurt', nameEn: 'Critical Theory & Frankfurt School', words: 35 },

    // Linguistik & Sprache
    { num: '25', slug: 'c2-diskursanalyse', name: 'Diskursanalyse & Pragmatik', nameVi: 'Phân tích diễn ngôn & Ngữ dụng', nameEn: 'Discourse Analysis & Pragmatics', words: 35 },
    { num: '26', slug: 'c2-soziolinguistik', name: 'Soziolinguistik & Varietäten', nameVi: 'Ngôn ngữ học xã hội & Phương ngữ', nameEn: 'Sociolinguistics & Varieties', words: 35 },
    { num: '27', slug: 'c2-uebersetzungswissenschaft', name: 'Übersetzungswissenschaft', nameVi: 'Khoa học dịch thuật', nameEn: 'Translation Studies', words: 35 },

    // Recht & Staat (vertieft)
    { num: '28', slug: 'c2-rechtshermeneutik', name: 'Rechtshermeneutik & Auslegung', nameVi: 'Giải thích pháp luật & Phương pháp', nameEn: 'Legal Hermeneutics & Interpretation', words: 35 },
    { num: '29', slug: 'c2-staatsphilosophie-vertieft', name: 'Staatsphilosophie (vertieft)', nameVi: 'Triết học nhà nước (nâng cao)', nameEn: 'Philosophy of State (Advanced)', words: 35 },
    { num: '30', slug: 'c2-menschenrechte-voelkerrecht', name: 'Menschenrechte & humanitäres Völkerrecht', nameVi: 'Nhân quyền & Luật nhân đạo quốc tế', nameEn: 'Human Rights & Humanitarian Law', words: 35 },

    // Wissenschaftstheorie
    { num: '31', slug: 'c2-paradigmenwechsel', name: 'Paradigmenwechsel & Wissenschaftsrevolution', nameVi: 'Chuyển đổi mô hình & Cách mạng khoa học', nameEn: 'Paradigm Shifts & Scientific Revolution', words: 35 },
    { num: '32', slug: 'c2-empirismus-rationalismus', name: 'Empirismus & Rationalismus', nameVi: 'Chủ nghĩa kinh nghiệm & Lý tính', nameEn: 'Empiricism & Rationalism', words: 35 },
    { num: '33', slug: 'c2-wissenschaftssoziologie', name: 'Wissenschaftssoziologie', nameVi: 'Xã hội học khoa học', nameEn: 'Sociology of Science', words: 35 },

    // Literatur & Textanalysis
    { num: '34', slug: 'c2-narratologie', name: 'Narratologie & Erzähltheorie', nameVi: 'Tự sự học & Lý thuyết kể chuyện', nameEn: 'Narratology & Narrative Theory', words: 35 },
    { num: '35', slug: 'c2-lyrikanalyse-metrik', name: 'Lyrikanalyse & Metrik', nameVi: 'Phân tích thơ & Nhịp thơ', nameEn: 'Poetry Analysis & Metrics', words: 35 },
    { num: '36', slug: 'c2-komparatistik', name: 'Komparatistik & Weltliteratur', nameVi: 'Văn học so sánh & Văn học thế giới', nameEn: 'Comparative Literature & World Literature', words: 35 },

    // Soziologie & Politik (vertieft)
    { num: '37', slug: 'c2-machttheorie-herrschaft', name: 'Machttheorie & Herrschaft', nameVi: 'Lý thuyết quyền lực & Thống trị', nameEn: 'Power Theory & Domination', words: 35 },
    { num: '38', slug: 'c2-klassentheorie-ungleichheit', name: 'Klassentheorie & Ungleichheit', nameVi: 'Lý thuyết giai cấp & Bất bình đẳng', nameEn: 'Class Theory & Inequality', words: 35 },
    { num: '39', slug: 'c2-zivilisationstheorie', name: 'Zivilisationstheorie & Modernisierung', nameVi: 'Lý thuyết văn minh & Hiện đại hóa', nameEn: 'Civilization Theory & Modernization', words: 35 },

    // Ökonomische Theorie
    { num: '40', slug: 'c2-ordoliberalismus', name: 'Ordoliberalismus & Soziale Marktwirtschaft', nameVi: 'Chủ nghĩa tự do trật tự & KTTT xã hội', nameEn: 'Ordoliberalism & Social Market Economy', words: 35 },
    { num: '41', slug: 'c2-verhaltensökonomie', name: 'Verhaltensökonomie & Nudging', nameVi: 'Kinh tế hành vi & Nudging', nameEn: 'Behavioral Economics & Nudging', words: 35 },
    { num: '42', slug: 'c2-oekologische-oekonomie', name: 'Ökologische Ökonomie & Degrowth', nameVi: 'Kinh tế sinh thái & Giảm tăng trưởng', nameEn: 'Ecological Economics & Degrowth', words: 35 },

    // Medientheorie (vertieft)
    { num: '43', slug: 'c2-medienphilosophie', name: 'Medienphilosophie & Virtualität', nameVi: 'Triết học truyền thông & Ảo hóa', nameEn: 'Media Philosophy & Virtuality', words: 35 },
    { num: '44', slug: 'c2-filmtheorie-auteur', name: 'Autorentheorie & Nouvelle Vague', nameVi: 'Lý thuyết tác giả & Làn sóng mới', nameEn: 'Auteur Theory & New Wave', words: 35 },

    // Psychologie (vertieft)
    { num: '45', slug: 'c2-analytische-psychologie', name: 'Analytische Psychologie (Jung)', nameVi: 'Tâm lý học phân tích (Jung)', nameEn: 'Analytical Psychology (Jung)', words: 35 },
    { num: '46', slug: 'c2-gestaltpsychologie', name: 'Gestaltpsychologie & Wahrnehmung', nameVi: 'Tâm lý học Gestalt & Tri giác', nameEn: 'Gestalt Psychology & Perception', words: 35 },
    { num: '47', slug: 'c2-existenzielle-psychotherapie', name: 'Existenzielle Psychotherapie', nameVi: 'Tâm lý trị liệu hiện sinh', nameEn: 'Existential Psychotherapy', words: 35 },

    // Ethik & Moralphilosophie
    { num: '48', slug: 'c2-deontologie-konsequentialismus', name: 'Deontologie & Konsequentialismus', nameVi: 'Nghĩa vụ luận & Hệ quả luận', nameEn: 'Deontology & Consequentialism', words: 35 },
    { num: '49', slug: 'c2-tugendethik-aristoteles', name: 'Tugendethik & Aristoteles', nameVi: 'Đạo đức đức hạnh & Aristotle', nameEn: 'Virtue Ethics & Aristotle', words: 35 },

    // Kultur & Anthropologie
    { num: '50', slug: 'c2-kulturkritik-postmoderne', name: 'Kulturkritik & Postmoderne', nameVi: 'Phê bình văn hóa & Hậu hiện đại', nameEn: 'Cultural Criticism & Postmodernism', words: 35 },
    { num: '51', slug: 'c2-ritualforschung', name: 'Ritualforschung & Symbolik', nameVi: 'Nghiên cứu nghi lễ & Biểu tượng', nameEn: 'Ritual Studies & Symbolism', words: 35 },

    // Geschichte (vertieft)
    { num: '52', slug: 'c2-historiographie-methodik', name: 'Historiographie & Methodik', nameVi: 'Sử học & Phương pháp', nameEn: 'Historiography & Methodology', words: 35 },
    { num: '53', slug: 'c2-mentalitaetsgeschichte', name: 'Mentalitätsgeschichte & Alltagsgeschichte', nameVi: 'Lịch sử tâm thức & Đời thường', nameEn: 'History of Mentalities & Everyday Life', words: 35 },

    // Theologie & Religion
    { num: '54', slug: 'c2-religionsphilosophie', name: 'Religionsphilosophie & Theodizee', nameVi: 'Triết học tôn giáo & Biện thần luận', nameEn: 'Philosophy of Religion & Theodicy', words: 35 },
    { num: '55', slug: 'c2-mystik-kontemplation', name: 'Mystik & Kontemplation', nameVi: 'Huyền bí & Chiêm niệm', nameEn: 'Mysticism & Contemplation', words: 35 },

    // Architektur & Raum
    { num: '56', slug: 'c2-stadtsoziologie', name: 'Stadtsoziologie & öffentlicher Raum', nameVi: 'Xã hội học đô thị & Không gian công', nameEn: 'Urban Sociology & Public Space', words: 35 },
    { num: '57', slug: 'c2-denkmalschutz-kulturerbe', name: 'Denkmalschutz & immaterielles Kulturerbe', nameVi: 'Bảo tồn di tích & Di sản phi vật thể', nameEn: 'Heritage Conservation & Intangible Heritage', words: 35 },

    // Musik & Ästhetik
    { num: '58', slug: 'c2-musikaesthetik', name: 'Musikästhetik & Kompositionstheorie', nameVi: 'Mỹ học âm nhạc & Lý thuyết sáng tác', nameEn: 'Music Aesthetics & Composition Theory', words: 35 },
    { num: '59', slug: 'c2-performativitaet', name: 'Performativität & Inszenierung', nameVi: 'Tính trình diễn & Dàn dựng', nameEn: 'Performativity & Staging', words: 35 },
    { num: '60', slug: 'c2-rezeptionsaesthetik', name: 'Rezeptionsästhetik & Lesertheorie', nameVi: 'Mỹ học tiếp nhận & Lý thuyết độc giả', nameEn: 'Reception Aesthetics & Reader Theory', words: 35 },
]

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const startFrom = args.find(a => a.startsWith('--from='))?.split('=')[1]

function sleep(ms: number): Promise<void> { return new Promise(resolve => setTimeout(resolve, ms)) }

function buildPrompt(theme: ThemeDef): string {
    return `You are an expert German language teacher creating C2-level (CEFR) vocabulary for a language learning app.

Theme: "${theme.name}" (${theme.nameEn})
Level: C2 (Muttersprachenniveau/Mastery) — near-native proficiency. Can understand with ease virtually everything heard or read. Can summarize information from different spoken and written sources, reconstructing arguments and accounts in a coherent presentation.

Generate exactly ${theme.words} German words for this theme at C2 level.

RULES:
- Words MUST be C2 level — highly specialized, academic, nuanced vocabulary
- C2 means: native-level precision, specialized terminology, nuanced expression, academic discourse
- Include: Nouns (NOMEN) ~55%, Verbs (VERB) ~20%, Adjectives (ADJEKTIV) ~20%, Others ~5%
- For nouns: include correct article (MASKULIN/FEMININ/NEUTRUM) and plural form
- For verbs/adjectives: set article and plural to null
- Example sentences must demonstrate C2-level complexity — academic register, nuanced argumentation
- Vietnamese and English translations must be accurate and scholarly
- Include highly specialized compound nouns, nominalized infinitives, Fachbegriffe (technical terms)
- NO vocabulary below C1 level
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
    const slugNoPrefix = theme.slug.replace('c2-', '')
    const filename = `${theme.num}-${slugNoPrefix}.json`
    const filePath = path.join(CONTENT_DIR, filename)

    if (existsSync(filePath)) {
        try {
            const existing = JSON.parse(readFileSync(filePath, 'utf8'))
            if (existing.words?.length >= theme.words) { console.log(`  ⏭️ Already exists (${existing.words.length} words)`); return true }
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
    console.log('🦊 Phase 3 Vocabulary Expansion — C2')
    console.log('=====================================')
    if (dryRun) console.log('🏃 DRY RUN')

    let themes = NEW_THEMES
    if (startFrom) {
        const idx = themes.findIndex(t => t.num === startFrom)
        if (idx >= 0) { themes = themes.slice(idx); console.log(`🎯 Starting from theme ${startFrom} (${themes.length} remaining)`) }
    }

    console.log(`\n📚 C2 — ${themes.length} new themes\n${'─'.repeat(40)}`)

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
