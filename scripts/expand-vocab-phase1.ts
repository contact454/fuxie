/**
 * Phase 1 Vocabulary Expansion — A1, A2, B1
 *
 * Generates new vocabulary themes to meet CEFR cumulative targets:
 *   A1: +3 themes (→ ~750 total cumulative)
 *   A2: +6 themes (→ ~1,500 total cumulative)
 *   B1: +22 themes (→ ~2,750 total cumulative)
 *
 * Usage:
 *   npx tsx scripts/expand-vocab-phase1.ts               # all
 *   npx tsx scripts/expand-vocab-phase1.ts --level=A1     # specific level
 *   npx tsx scripts/expand-vocab-phase1.ts --dry-run      # preview
 */

import { GoogleGenAI } from '@google/genai'
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '..', '.env') })

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || ''
if (!GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY not found')
    process.exit(1)
}

const genai = new GoogleGenAI({ apiKey: GEMINI_API_KEY })
const CONTENT_ROOT = path.join(__dirname, '..', 'content')

// ─── Theme Definitions ──────────────────────────────

interface ThemeDef {
    num: string
    slug: string
    name: string
    nameVi: string
    nameEn: string
    words: number
    level: string
}

const NEW_THEMES: ThemeDef[] = [
    // === A1 — 3 new themes (19-21) ===
    { num: '19', slug: 'a1-tiere', name: 'Tiere', nameVi: 'Động vật', nameEn: 'Animals', words: 35, level: 'a1' },
    { num: '20', slug: 'a1-schule-klassenzimmer', name: 'Schule & Klassenzimmer', nameVi: 'Trường học & Lớp học', nameEn: 'School & Classroom', words: 35, level: 'a1' },
    { num: '21', slug: 'a1-hobbys-sport', name: 'Hobbys & Sport', nameVi: 'Sở thích & Thể thao', nameEn: 'Hobbies & Sports', words: 35, level: 'a1' },

    // === A2 — 6 new themes (21-26) ===
    { num: '21', slug: 'a2-sport-fitness', name: 'Sport & Fitness', nameVi: 'Thể thao & Thể dục', nameEn: 'Sports & Fitness', words: 35, level: 'a2' },
    { num: '22', slug: 'a2-haustiere', name: 'Haustiere & Tierpflege', nameVi: 'Thú cưng & Chăm sóc', nameEn: 'Pets & Animal Care', words: 35, level: 'a2' },
    { num: '23', slug: 'a2-feste-geburtstag', name: 'Feste & Geburtstag', nameVi: 'Lễ hội & Sinh nhật', nameEn: 'Celebrations & Birthday', words: 35, level: 'a2' },
    { num: '24', slug: 'a2-koerperteile-detailliert', name: 'Körperteile (detailliert)', nameVi: 'Bộ phận cơ thể (chi tiết)', nameEn: 'Body Parts (Detailed)', words: 35, level: 'a2' },
    { num: '25', slug: 'a2-schulfaecher', name: 'Schulfächer & Lernen', nameVi: 'Môn học & Học tập', nameEn: 'School Subjects & Learning', words: 35, level: 'a2' },
    { num: '26', slug: 'a2-nachbarn-gemeinde', name: 'Nachbarn & Gemeinde', nameVi: 'Hàng xóm & Cộng đồng', nameEn: 'Neighbors & Community', words: 35, level: 'a2' },

    // === B1 — 22 new themes (21-42) ===
    { num: '21', slug: 'b1-medien-fernsehen', name: 'Medien & Fernsehen', nameVi: 'Truyền thông & Truyền hình', nameEn: 'Media & Television', words: 35, level: 'b1' },
    { num: '22', slug: 'b1-musik-instrumente', name: 'Musik & Instrumente', nameVi: 'Âm nhạc & Nhạc cụ', nameEn: 'Music & Instruments', words: 35, level: 'b1' },
    { num: '23', slug: 'b1-sport-wettkampf', name: 'Sport & Wettkampf', nameVi: 'Thể thao & Thi đấu', nameEn: 'Sports & Competition', words: 35, level: 'b1' },
    { num: '24', slug: 'b1-haustiere-tierpflege', name: 'Haustiere & Tierpflege', nameVi: 'Thú cưng & Chăm sóc động vật', nameEn: 'Pets & Animal Care', words: 35, level: 'b1' },
    { num: '25', slug: 'b1-bank-versicherung', name: 'Bank & Versicherung', nameVi: 'Ngân hàng & Bảo hiểm', nameEn: 'Banking & Insurance', words: 35, level: 'b1' },
    { num: '26', slug: 'b1-bewerbung-lebenslauf', name: 'Bewerbung & Lebenslauf', nameVi: 'Ứng tuyển & Hồ sơ', nameEn: 'Job Application & Resume', words: 35, level: 'b1' },
    { num: '27', slug: 'b1-mietvertrag-rechte', name: 'Mietvertrag & Wohnrechte', nameVi: 'Hợp đồng thuê & Quyền', nameEn: 'Rental Contract & Rights', words: 35, level: 'b1' },
    { num: '28', slug: 'b1-internet-sicherheit', name: 'Internet & Sicherheit', nameVi: 'Internet & An ninh mạng', nameEn: 'Internet & Security', words: 35, level: 'b1' },
    { num: '29', slug: 'b1-ehrenamt-soziales', name: 'Ehrenamt & Soziales', nameVi: 'Tình nguyện & Xã hội', nameEn: 'Volunteering & Social Work', words: 35, level: 'b1' },
    { num: '30', slug: 'b1-umgangsformen-etikette', name: 'Umgangsformen & Etikette', nameVi: 'Ứng xử & Phép lịch sự', nameEn: 'Manners & Etiquette', words: 35, level: 'b1' },
    { num: '31', slug: 'b1-landwirtschaft-ernte', name: 'Landwirtschaft & Ernte', nameVi: 'Nông nghiệp & Thu hoạch', nameEn: 'Agriculture & Harvest', words: 35, level: 'b1' },
    { num: '32', slug: 'b1-handwerk-reparatur', name: 'Handwerk & Reparatur', nameVi: 'Thủ công & Sửa chữa', nameEn: 'Craft & Repair', words: 35, level: 'b1' },
    { num: '33', slug: 'b1-brief-formell', name: 'Brief & formelle E-Mail', nameVi: 'Thư & Email chính thức', nameEn: 'Letters & Formal Email', words: 35, level: 'b1' },
    { num: '34', slug: 'b1-diskussion-argumentation', name: 'Diskussion & Argumentation', nameVi: 'Thảo luận & Lập luận', nameEn: 'Discussion & Argumentation', words: 35, level: 'b1' },
    { num: '35', slug: 'b1-vergleich-statistik', name: 'Vergleich & Statistik', nameVi: 'So sánh & Thống kê', nameEn: 'Comparison & Statistics', words: 35, level: 'b1' },
    { num: '36', slug: 'b1-hotel-unterkunft', name: 'Hotel & Unterkunft', nameVi: 'Khách sạn & Chỗ ở', nameEn: 'Hotel & Accommodation', words: 35, level: 'b1' },
    { num: '37', slug: 'b1-flughafen-grenze', name: 'Flughafen & Grenze', nameVi: 'Sân bay & Biên giới', nameEn: 'Airport & Border', words: 35, level: 'b1' },
    { num: '38', slug: 'b1-notfall-erste-hilfe', name: 'Notfall & Erste Hilfe', nameVi: 'Tình huống khẩn & Sơ cứu', nameEn: 'Emergency & First Aid', words: 35, level: 'b1' },
    { num: '39', slug: 'b1-muell-recycling', name: 'Müll & Recycling', nameVi: 'Rác & Tái chế', nameEn: 'Waste & Recycling', words: 35, level: 'b1' },
    { num: '40', slug: 'b1-steuern-abgaben', name: 'Steuern & Abgaben', nameVi: 'Thuế & Lệ phí', nameEn: 'Taxes & Fees', words: 35, level: 'b1' },
    { num: '41', slug: 'b1-versicherungen', name: 'Versicherungen', nameVi: 'Các loại bảo hiểm', nameEn: 'Insurance Types', words: 35, level: 'b1' },
    { num: '42', slug: 'b1-bewertungen-beschwerden', name: 'Bewertungen & Beschwerden', nameVi: 'Đánh giá & Khiếu nại', nameEn: 'Reviews & Complaints', words: 35, level: 'b1' },
]

// ─── CLI ─────────────────────────────────────────────
const args = process.argv.slice(2)
const levelFilter = args.find(a => a.startsWith('--level='))?.split('=')[1]?.toLowerCase()
const dryRun = args.includes('--dry-run')

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Prompt Builder ──────────────────────────────────
function buildPrompt(theme: ThemeDef): string {
    const levelUpper = theme.level.toUpperCase()
    const levelDescriptions: Record<string, string> = {
        a1: `A1 (Anfänger): VERY basic vocabulary. Only the most common, everyday words. Simple nouns, basic verbs (haben, sein, gehen, essen...), simple adjectives (groß, klein, gut, schlecht). Words a total beginner needs in first 2-3 months.`,
        a2: `A2 (Grundstufe): Elementary vocabulary. Everyday situations like shopping, doctor, school. Still simple but more specific than A1. Common compound words. Basic reflexive verbs.`,
        b1: `B1 (Mittelstufe): Intermediate vocabulary. Can discuss opinions, describe experiences, handle unexpected situations. More abstract words, more precise verbs, compound nouns. Words needed for Goethe B1 exam.`,
    }

    return `You are an expert German language teacher creating ${levelUpper}-level (CEFR) vocabulary for a language learning app.

Theme: "${theme.name}" (${theme.nameEn})
Level: ${levelDescriptions[theme.level]}

Generate exactly ${theme.words} German words for this theme at ${levelUpper} level.

RULES:
- Words MUST be ${levelUpper} level — not too easy, not too hard
- Include a mix: Nouns (NOMEN) ~50%, Verbs (VERB) ~25%, Adjectives/Adverbs (ADJEKTIV/ADVERB) ~20%, Prepositions/Particles (PRAEPOSITION/PARTIKEL) ~5%
- For nouns: include correct article (MASKULIN/FEMININ/NEUTRUM) and plural form
- For verbs/adjectives: set article and plural to null
- Example sentences MUST match ${levelUpper} level complexity
- Vietnamese translations must be ACCURATE and natural
- English translations must be precise
- NO duplicate words
- Nouns MUST be capitalized (German rule)
- Do NOT include words that already exist in common A1 basic vocabulary (like Hund, Katze for A2, or Tier for A1)

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

// ─── Generator ───────────────────────────────────────
async function generateTheme(theme: ThemeDef): Promise<boolean> {
    const levelDir = path.join(CONTENT_ROOT, theme.level, 'vocabulary')
    const slugNoPrefix = theme.slug.replace(`${theme.level}-`, '')
    const filename = `${theme.num}-${slugNoPrefix}.json`
    const filePath = path.join(levelDir, filename)

    // Skip if already exists
    if (existsSync(filePath)) {
        try {
            const existing = JSON.parse(readFileSync(filePath, 'utf8'))
            if (existing.words?.length >= theme.words) {
                console.log(`  ⏭️ Already exists (${existing.words.length} words)`)
                return true
            }
        } catch { /* regenerate */ }
    }

    if (dryRun) {
        console.log(`  🏃 Would generate ${theme.words} words → ${filename}`)
        return true
    }

    try {
        const response = await genai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: buildPrompt(theme),
            config: { temperature: 0.7 },
        })

        const text = response.text || ''
        let jsonStr = text.trim()
        if (jsonStr.startsWith('```')) {
            jsonStr = jsonStr.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        }

        const words = JSON.parse(jsonStr)
        if (!Array.isArray(words) || words.length === 0) {
            console.log(`  ❌ Invalid response — not an array`)
            return false
        }

        // Validate
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

        mkdirSync(levelDir, { recursive: true })
        writeFileSync(filePath, JSON.stringify(data, null, 4) + '\n')
        console.log(`  ✅ ${valid.length} words → ${filename}`)
        return true
    } catch (err: any) {
        console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`)
        return false
    }
}

// ─── Main ────────────────────────────────────────────
async function main() {
    console.log('🦊 Phase 1 Vocabulary Expansion')
    console.log('================================')
    if (dryRun) console.log('🏃 DRY RUN')
    console.log('')

    let themes = NEW_THEMES
    if (levelFilter) {
        themes = themes.filter(t => t.level === levelFilter)
        console.log(`🎯 Filter: ${levelFilter.toUpperCase()} (${themes.length} themes)`)
    }

    const byLevel = ['a1', 'a2', 'b1']
    let totalSuccess = 0
    let totalFailed = 0

    for (const level of byLevel) {
        const levelThemes = themes.filter(t => t.level === level)
        if (levelThemes.length === 0) continue

        console.log(`\n📚 ${level.toUpperCase()} — ${levelThemes.length} new themes`)
        console.log('─'.repeat(40))

        for (const theme of levelThemes) {
            console.log(`\n  🔄 ${theme.name} (${theme.nameEn})`)
            const ok = await generateTheme(theme)
            if (ok) totalSuccess++; else totalFailed++
            if (!dryRun) await sleep(4000)
        }
    }

    console.log('\n================================')
    console.log(`📊 ✅ ${totalSuccess} | ❌ ${totalFailed}`)
    console.log(`📝 ~${totalSuccess * 35} new words`)
    console.log('🦊 Done!')
}

main().catch(console.error)
