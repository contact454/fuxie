/**
 * Phase 2 Vocabulary Expansion — B2
 *
 * Generates ~40 new B2 vocabulary themes to reach CEFR cumulative target (~4,500).
 * Current B2: 20 themes, 529 words (DB) / 700 words (JSON).
 * Need: +1,400 words → 40 new themes × 35 words.
 *
 * Usage:
 *   npx tsx scripts/expand-vocab-phase2.ts               # all
 *   npx tsx scripts/expand-vocab-phase2.ts --dry-run      # preview
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
const CONTENT_DIR = path.join(__dirname, '..', 'content', 'b2', 'vocabulary')

interface ThemeDef {
    num: string
    slug: string
    name: string
    nameVi: string
    nameEn: string
    words: number
}

const NEW_THEMES: ThemeDef[] = [
    // Group 1: Politik & Gesellschaft
    { num: '21', slug: 'b2-politische-systeme', name: 'Politische Systeme', nameVi: 'Hệ thống chính trị', nameEn: 'Political Systems', words: 35 },
    { num: '22', slug: 'b2-wahlen-demokratie', name: 'Wahlen & Demokratie', nameVi: 'Bầu cử & Dân chủ', nameEn: 'Elections & Democracy', words: 35 },
    { num: '23', slug: 'b2-demographischer-wandel', name: 'Demographischer Wandel', nameVi: 'Biến đổi nhân khẩu học', nameEn: 'Demographic Change', words: 35 },
    { num: '24', slug: 'b2-soziale-ungleichheit', name: 'Soziale Ungleichheit', nameVi: 'Bất bình đẳng xã hội', nameEn: 'Social Inequality', words: 35 },

    // Group 2: Medien & Kommunikation
    { num: '25', slug: 'b2-journalismus-recherche', name: 'Journalismus & Recherche', nameVi: 'Báo chí & Nghiên cứu', nameEn: 'Journalism & Research', words: 35 },
    { num: '26', slug: 'b2-soziale-medien-einfluss', name: 'Soziale Medien & Einfluss', nameVi: 'Mạng xã hội & Ảnh hưởng', nameEn: 'Social Media & Influence', words: 35 },
    { num: '27', slug: 'b2-werbung-marketing', name: 'Werbung & Marketing', nameVi: 'Quảng cáo & Marketing', nameEn: 'Advertising & Marketing', words: 35 },

    // Group 3: Wirtschaft & Beruf
    { num: '28', slug: 'b2-startup-gruendung', name: 'Startup & Unternehmensgründung', nameVi: 'Khởi nghiệp & Thành lập doanh nghiệp', nameEn: 'Startup & Entrepreneurship', words: 35 },
    { num: '29', slug: 'b2-aktienmarkt-investment', name: 'Aktienmarkt & Investment', nameVi: 'Thị trường chứng khoán & Đầu tư', nameEn: 'Stock Market & Investment', words: 35 },
    { num: '30', slug: 'b2-berufliche-weiterbildung', name: 'Berufliche Weiterbildung', nameVi: 'Đào tạo nâng cao', nameEn: 'Professional Development', words: 35 },
    { num: '31', slug: 'b2-arbeitsrecht-gewerkschaft', name: 'Arbeitsrecht & Gewerkschaft', nameVi: 'Luật lao động & Công đoàn', nameEn: 'Labor Law & Unions', words: 35 },

    // Group 4: Wissenschaft & Technologie
    { num: '32', slug: 'b2-digitale-transformation', name: 'Digitale Transformation', nameVi: 'Chuyển đổi số', nameEn: 'Digital Transformation', words: 35 },
    { num: '33', slug: 'b2-datenschutz-dsgvo', name: 'Datenschutz & DSGVO', nameVi: 'Bảo mật dữ liệu & GDPR', nameEn: 'Data Protection & GDPR', words: 35 },
    { num: '34', slug: 'b2-erneuerbare-energien', name: 'Erneuerbare Energien', nameVi: 'Năng lượng tái tạo', nameEn: 'Renewable Energy', words: 35 },
    { num: '35', slug: 'b2-wissenschaftsjournalismus', name: 'Wissenschaftsjournalismus', nameVi: 'Báo chí khoa học', nameEn: 'Science Journalism', words: 35 },

    // Group 5: Gesundheit & Soziales
    { num: '36', slug: 'b2-psychotherapie-behandlung', name: 'Psychotherapie & Behandlung', nameVi: 'Tâm lý trị liệu & Điều trị', nameEn: 'Psychotherapy & Treatment', words: 35 },
    { num: '37', slug: 'b2-pflege-altenhilfe', name: 'Pflege & Altenhilfe', nameVi: 'Chăm sóc & Dưỡng lão', nameEn: 'Care & Elder Services', words: 35 },
    { num: '38', slug: 'b2-gesundheitssystem', name: 'Gesundheitssystem & Krankenkasse', nameVi: 'Hệ thống y tế & Bảo hiểm sức khỏe', nameEn: 'Healthcare System & Insurance', words: 35 },
    { num: '39', slug: 'b2-suchtpraevention', name: 'Suchtprävention & Aufklärung', nameVi: 'Phòng chống nghiện & Giáo dục', nameEn: 'Addiction Prevention & Awareness', words: 35 },

    // Group 6: Recht & Justiz
    { num: '40', slug: 'b2-strafrecht-prozess', name: 'Strafrecht & Prozess', nameVi: 'Luật hình sự & Phiên tòa', nameEn: 'Criminal Law & Trial', words: 35 },
    { num: '41', slug: 'b2-vertragsrecht', name: 'Vertragsrecht & Haftung', nameVi: 'Luật hợp đồng & Trách nhiệm', nameEn: 'Contract Law & Liability', words: 35 },

    // Group 7: Kultur & Bildung
    { num: '42', slug: 'b2-kulturfoerderung', name: 'Kulturförderung & Mäzenatentum', nameVi: 'Bảo trợ văn hóa', nameEn: 'Cultural Promotion & Patronage', words: 35 },
    { num: '43', slug: 'b2-religionen-dialog', name: 'Religionen & Dialog', nameVi: 'Tôn giáo & Đối thoại', nameEn: 'Religions & Dialogue', words: 35 },
    { num: '44', slug: 'b2-bildungspolitik', name: 'Bildungspolitik & Chancengleichheit', nameVi: 'Chính sách giáo dục & Bình đẳng cơ hội', nameEn: 'Education Policy & Equal Opportunity', words: 35 },
    { num: '45', slug: 'b2-ehrenamt-zivilgesellschaft', name: 'Ehrenamt & Zivilgesellschaft', nameVi: 'Hoạt động tình nguyện & Xã hội dân sự', nameEn: 'Volunteering & Civil Society', words: 35 },

    // Group 8: Umwelt & Nachhaltigkeit
    { num: '46', slug: 'b2-klimadiskurs', name: 'Klimadiskurs & Aktivismus', nameVi: 'Thảo luận khí hậu & Hoạt động xã hội', nameEn: 'Climate Discourse & Activism', words: 35 },
    { num: '47', slug: 'b2-gentechnik-landwirtschaft', name: 'Gentechnik & Landwirtschaft', nameVi: 'Công nghệ gen & Nông nghiệp', nameEn: 'Genetic Engineering & Agriculture', words: 35 },
    { num: '48', slug: 'b2-wohnungsmarkt', name: 'Wohnungsmarkt & Gentrifizierung', nameVi: 'Thị trường nhà ở & Gentrification', nameEn: 'Housing Market & Gentrification', words: 35 },

    // Group 9: Sport & Lifestyle
    { num: '49', slug: 'b2-sport-doping', name: 'Sport & Doping', nameVi: 'Thể thao & Doping', nameEn: 'Sports & Doping', words: 35 },
    { num: '50', slug: 'b2-ernaehrungstrends', name: 'Ernährungstrends & Veganismus', nameVi: 'Xu hướng dinh dưỡng & Ăn chay', nameEn: 'Nutrition Trends & Veganism', words: 35 },

    // Group 10: Kommunikation & Sprache
    { num: '51', slug: 'b2-rhetorik-ueberzeugung', name: 'Rhetorik & Überzeugung', nameVi: 'Kỹ năng hùng biện & Thuyết phục', nameEn: 'Rhetoric & Persuasion', words: 35 },
    { num: '52', slug: 'b2-interkulturelle-kommunikation', name: 'Interkulturelle Kommunikation', nameVi: 'Giao tiếp liên văn hóa', nameEn: 'Intercultural Communication', words: 35 },
    { num: '53', slug: 'b2-konfliktloesung', name: 'Konfliktlösung & Mediation', nameVi: 'Giải quyết xung đột & Hòa giải', nameEn: 'Conflict Resolution & Mediation', words: 35 },

    // Group 11: Technik & Innovation
    { num: '54', slug: 'b2-robotik-automatisierung', name: 'Robotik & Automatisierung', nameVi: 'Robot & Tự động hóa', nameEn: 'Robotics & Automation', words: 35 },
    { num: '55', slug: 'b2-raumfahrt-forschung', name: 'Raumfahrt & Forschung', nameVi: 'Hàng không vũ trụ & Nghiên cứu', nameEn: 'Space Travel & Research', words: 35 },

    // Group 12: Geschichte & Erinnerung
    { num: '56', slug: 'b2-geschichtsbewusstsein', name: 'Geschichtsbewusstsein & Erinnerung', nameVi: 'Nhận thức lịch sử & Ký ức', nameEn: 'Historical Awareness & Memory', words: 35 },
    { num: '57', slug: 'b2-europaeische-integration', name: 'Europäische Integration', nameVi: 'Hội nhập châu Âu', nameEn: 'European Integration', words: 35 },

    // Group 13: Psychologie & Selbstentwicklung
    { num: '58', slug: 'b2-stressmanagement', name: 'Stressmanagement & Resilienz', nameVi: 'Quản lý stress & Khả năng phục hồi', nameEn: 'Stress Management & Resilience', words: 35 },
    { num: '59', slug: 'b2-persoenlichkeitsentwicklung', name: 'Persönlichkeitsentwicklung', nameVi: 'Phát triển bản thân', nameEn: 'Personal Development', words: 35 },

    // Group 14: Freizeit & Kultur
    { num: '60', slug: 'b2-film-filmkritik', name: 'Film & Filmkritik', nameVi: 'Phim & Phê bình phim', nameEn: 'Film & Film Criticism', words: 35 },
]

// ─── CLI ─────────────────────────────────────────────
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const startFrom = args.find(a => a.startsWith('--from='))?.split('=')[1]

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
}

// ─── Prompt Builder ──────────────────────────────────
function buildPrompt(theme: ThemeDef): string {
    return `You are an expert German language teacher creating B2-level (CEFR) vocabulary for a language learning app called Fuxie.

Theme: "${theme.name}" (${theme.nameEn})
Level: B2 (Upper Intermediate) — learners can understand complex texts, interact with fluency, produce clear detailed text on a wide range of subjects.

Generate exactly ${theme.words} German words for this theme at B2 level.

RULES:
- Words MUST be B2 level — more sophisticated than B1, but not C1/C2 academic
- B2 means: able to discuss current affairs, explain viewpoints, weigh advantages/disadvantages
- Include a mix: Nouns (NOMEN) ~50%, Verbs (VERB) ~25%, Adjectives (ADJEKTIV) ~20%, Others ~5%
- For nouns: include correct article (MASKULIN/FEMININ/NEUTRUM) and plural form
- For verbs/adjectives/others: set article and plural to null
- Example sentences MUST be B2 appropriate — complex but accessible
- Vietnamese translations must be ACCURATE and natural
- English translations must be precise
- NO duplicate words, NO basic A1-B1 vocabulary
- Nouns MUST be capitalized (German rule)
- Include some compound nouns (typical for B2 German)

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
    const slugNoPrefix = theme.slug.replace('b2-', '')
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
        console.log(`  ✅ ${valid.length} words → ${filename}`)
        return true
    } catch (err: any) {
        console.log(`  ❌ Error: ${err.message?.substring(0, 200)}`)
        return false
    }
}

// ─── Main ────────────────────────────────────────────
async function main() {
    console.log('🦊 Phase 2 Vocabulary Expansion — B2')
    console.log('=====================================')
    if (dryRun) console.log('🏃 DRY RUN')
    console.log('')

    let themes = NEW_THEMES
    if (startFrom) {
        const idx = themes.findIndex(t => t.num === startFrom)
        if (idx >= 0) {
            themes = themes.slice(idx)
            console.log(`🎯 Starting from theme ${startFrom} (${themes.length} remaining)`)
        }
    }

    console.log(`📚 B2 — ${themes.length} new themes`)
    console.log('─'.repeat(40))

    let success = 0
    let failed = 0

    for (const theme of themes) {
        console.log(`\n  🔄 ${theme.name} (${theme.nameEn})`)
        const ok = await generateTheme(theme)
        if (ok) success++; else failed++
        if (!dryRun) await sleep(4000)
    }

    console.log('\n=====================================')
    console.log(`📊 ✅ ${success} | ❌ ${failed}`)
    console.log(`📝 ~${success * 35} new words`)
    console.log('🦊 Done!')
}

main().catch(console.error)
