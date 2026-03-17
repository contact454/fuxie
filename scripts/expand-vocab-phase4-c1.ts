/**
 * Phase 4 Round 1 — C1 Final (+15 themes)
 * Target: cumulative ≥6,000 words
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

interface T { num: string; slug: string; name: string; nameVi: string; nameEn: string; words: number }

const THEMES: T[] = [
    { num: '61', slug: 'c1-forensik-kriminalistik', name: 'Forensik & Kriminalistik', nameVi: 'Pháp y & Điều tra hình sự', nameEn: 'Forensics & Criminology', words: 35 },
    { num: '62', slug: 'c1-logistik-lieferkette', name: 'Logistik & Lieferkette', nameVi: 'Logistics & Chuỗi cung ứng', nameEn: 'Logistics & Supply Chain', words: 35 },
    { num: '63', slug: 'c1-musiktherapie', name: 'Musiktherapie & Heilpädagogik', nameVi: 'Âm nhạc trị liệu & Giáo dục đặc biệt', nameEn: 'Music Therapy & Special Education', words: 35 },
    { num: '64', slug: 'c1-sportmedizin', name: 'Sportmedizin & Rehabilitation', nameVi: 'Y học thể thao & Phục hồi', nameEn: 'Sports Medicine & Rehabilitation', words: 35 },
    { num: '65', slug: 'c1-lebensmittelrecht', name: 'Lebensmittelrecht & Verbraucherschutz', nameVi: 'Luật thực phẩm & Bảo vệ người tiêu dùng', nameEn: 'Food Law & Consumer Protection', words: 35 },
    { num: '66', slug: 'c1-stadtmarketing-tourismus', name: 'Stadtmarketing & Tourismus', nameVi: 'Marketing đô thị & Du lịch', nameEn: 'City Marketing & Tourism', words: 35 },
    { num: '67', slug: 'c1-wasserversorgung', name: 'Wasserversorgung & Infrastruktur', nameVi: 'Cấp nước & Hạ tầng', nameEn: 'Water Supply & Infrastructure', words: 35 },
    { num: '68', slug: 'c1-krisenmanagement', name: 'Krisenmanagement & Katastrophenschutz', nameVi: 'Quản lý khủng hoảng & Phòng chống thiên tai', nameEn: 'Crisis Management & Disaster Protection', words: 35 },
    { num: '69', slug: 'c1-patentrecht', name: 'Patentrecht & geistiges Eigentum', nameVi: 'Luật sáng chế & Sở hữu trí tuệ', nameEn: 'Patent Law & Intellectual Property', words: 35 },
    { num: '70', slug: 'c1-energiespeicherung', name: 'Energiespeicherung & Wasserstoff', nameVi: 'Lưu trữ năng lượng & Hydro', nameEn: 'Energy Storage & Hydrogen', words: 35 },
    { num: '71', slug: 'c1-neuroplastizitaet', name: 'Neuroplastizität & Gehirnforschung', nameVi: 'Tính dẻo thần kinh & Nghiên cứu não', nameEn: 'Neuroplasticity & Brain Research', words: 35 },
    { num: '72', slug: 'c1-verhaltensforschung', name: 'Verhaltensforschung & Ethologie', nameVi: 'Nghiên cứu hành vi & Sinh thái học', nameEn: 'Behavioral Research & Ethology', words: 35 },
    { num: '73', slug: 'c1-bibliothekswesen', name: 'Bibliothekswesen & Archivistik', nameVi: 'Thư viện học & Lưu trữ', nameEn: 'Library Science & Archival Studies', words: 35 },
    { num: '74', slug: 'c1-qualitaetsmanagement', name: 'Qualitätsmanagement & Zertifizierung', nameVi: 'Quản lý chất lượng & Chứng nhận', nameEn: 'Quality Management & Certification', words: 35 },
    { num: '75', slug: 'c1-steuerberatung', name: 'Steuerberatung & Wirtschaftsprüfung', nameVi: 'Tư vấn thuế & Kiểm toán', nameEn: 'Tax Advisory & Auditing', words: 35 },
]

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

function buildPrompt(t: T): string {
    return `You are an expert German language teacher creating C1-level (CEFR) vocabulary.
Theme: "${t.name}" (${t.nameEn})
Level: C1 (Advanced) — academic/professional vocabulary, nuanced expression, complex argumentation.
Generate exactly ${t.words} German words. Mix: Nouns ~50%, Verbs ~25%, Adjectives ~20%, Others ~5%.
For nouns: article (MASKULIN/FEMININ/NEUTRUM) + plural. Others: null.
Return ONLY valid JSON array, no markdown. Each object:
{"word":"...","article":"MASKULIN"|"FEMININ"|"NEUTRUM"|null,"plural":"die ..."|null,"wordType":"NOMEN"|"VERB"|"ADJEKTIV"|"ADVERB","meaningVi":"...","meaningEn":"...","exampleSentence1":"...","exampleTranslation1":"...(Vietnamese)","exampleSentence2":"...","exampleTranslation2":"...(Vietnamese)"}`
}

async function gen(t: T): Promise<boolean> {
    const f = `${t.num}-${t.slug.replace('c1-', '')}.json`, fp = path.join(CONTENT_DIR, f)
    if (existsSync(fp)) { try { const e = JSON.parse(readFileSync(fp, 'utf8')); if (e.words?.length >= t.words) { console.log(`  ⏭️ Exists (${e.words.length})`); return true } } catch { } }
    if (dryRun) { console.log(`  🏃 ${t.words} words → ${f}`); return true }
    try {
        const r = await genai.models.generateContent({ model: 'gemini-2.5-flash', contents: buildPrompt(t), config: { temperature: 0.7 } })
        let j = (r.text || '').trim(); if (j.startsWith('```')) j = j.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '')
        const w = JSON.parse(j); if (!Array.isArray(w) || !w.length) { console.log('  ❌ Invalid'); return false }
        const v = w.filter((x: any) => x.word && x.wordType && x.meaningVi && x.meaningEn && x.exampleSentence1)
        mkdirSync(CONTENT_DIR, { recursive: true })
        writeFileSync(fp, JSON.stringify({ theme: { slug: t.slug, name: t.name, nameVi: t.nameVi, nameEn: t.nameEn, sortOrder: +t.num, imageUrl: `/images/themes/${t.slug}.png` }, words: v }, null, 4) + '\n')
        console.log(`  ✅ ${v.length} words → ${f}`); return true
    } catch (e: any) { console.log(`  ❌ ${e.message?.substring(0, 200)}`); return false }
}

async function main() {
    console.log('🦊 Phase 4 Round 1 — C1 Final (+15)\n' + '='.repeat(40))
    let s = 0, f = 0
    for (const t of THEMES) { console.log(`\n  🔄 ${t.name}`); if (await gen(t)) s++; else f++; if (!dryRun) await sleep(4000) }
    console.log(`\n${'='.repeat(40)}\n📊 ✅ ${s} | ❌ ${f} | ~${s * 35} words\n🦊 Done!`)
}
main().catch(console.error)
