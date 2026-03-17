/**
 * Phase 4 Round 3 — C2 Final (+45 themes, 111-155)
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

interface T { num: string; slug: string; name: string; nameVi: string; nameEn: string; words: number }

const THEMES: T[] = [
    // Medizin & Neurowissenschaft
    { num: '111', slug: 'c2-neuroethik', name: 'Neuroethik & Enhancement', nameVi: 'Đạo đức thần kinh & Nâng cao', nameEn: 'Neuroethics & Enhancement', words: 35 },
    { num: '112', slug: 'c2-palliativmedizin', name: 'Palliativmedizin & Sterbebegleitung', nameVi: 'Y học giảm nhẹ & Hỗ trợ cuối đời', nameEn: 'Palliative Medicine & End-of-life Care', words: 35 },
    { num: '113', slug: 'c2-epigenetik', name: 'Epigenetik & Genexpression', nameVi: 'Biểu sinh học & Biểu hiện gen', nameEn: 'Epigenetics & Gene Expression', words: 35 },

    // Technikphilosophie
    { num: '114', slug: 'c2-technikphilosophie', name: 'Technikphilosophie & Heidegger', nameVi: 'Triết học kỹ thuật & Heidegger', nameEn: 'Philosophy of Technology & Heidegger', words: 35 },
    { num: '115', slug: 'c2-algorithmische-gouvernementalitaet', name: 'Algorithmische Gouvernementalität', nameVi: 'Tính cai trị thuật toán', nameEn: 'Algorithmic Governmentality', words: 35 },
    { num: '116', slug: 'c2-digitaler-humanismus', name: 'Digitaler Humanismus & Datensouveränität', nameVi: 'Chủ nghĩa nhân văn số & Chủ quyền dữ liệu', nameEn: 'Digital Humanism & Data Sovereignty', words: 35 },

    // Umweltphilosophie
    { num: '117', slug: 'c2-tiefenökologie', name: 'Tiefenökologie & Biozentrismus', nameVi: 'Sinh thái sâu & Thuyết sinh vật trung tâm', nameEn: 'Deep Ecology & Biocentrism', words: 35 },
    { num: '118', slug: 'c2-anthropozaen', name: 'Anthropozän & Erdsystemwissenschaft', nameVi: 'Thế Nhân sinh & Khoa học hệ Trái đất', nameEn: 'Anthropocene & Earth System Science', words: 35 },
    { num: '119', slug: 'c2-klimagerechtigkeit', name: 'Klimagerechtigkeit & Umweltrassismus', nameVi: 'Công lý khí hậu & Phân biệt môi trường', nameEn: 'Climate Justice & Environmental Racism', words: 35 },

    // Politische Theorie
    { num: '120', slug: 'c2-republikanismus', name: 'Republikanismus & Bürgerliche Freiheit', nameVi: 'Chủ nghĩa cộng hòa & Tự do công dân', nameEn: 'Republicanism & Civil Liberty', words: 35 },
    { num: '121', slug: 'c2-populismus-forschung', name: 'Populismusforschung & Demagogie', nameVi: 'Nghiên cứu chủ nghĩa dân túy & Mị dân', nameEn: 'Populism Research & Demagoguery', words: 35 },
    { num: '122', slug: 'c2-demokratietheorie', name: 'Demokratietheorie & Deliberation', nameVi: 'Lý thuyết dân chủ & Thảo nghị', nameEn: 'Democracy Theory & Deliberation', words: 35 },

    // Wirtschaftsphilosophie
    { num: '123', slug: 'c2-eigentumstheorie', name: 'Eigentumstheorie & Commons', nameVi: 'Lý thuyết sở hữu & Tài sản chung', nameEn: 'Property Theory & Commons', words: 35 },
    { num: '124', slug: 'c2-arbeitswerttheorie', name: 'Arbeitswerttheorie & Mehrwert', nameVi: 'Lý thuyết giá trị lao động & Giá trị thặng dư', nameEn: 'Labor Theory of Value & Surplus Value', words: 35 },

    // Bildungsphilosophie
    { num: '125', slug: 'c2-bildungsbegriff-humboldt', name: 'Bildungsbegriff & Humboldt', nameVi: 'Khái niệm giáo dục & Humboldt', nameEn: 'Concept of Education & Humboldt', words: 35 },
    { num: '126', slug: 'c2-freire-paedagogik', name: 'Kritische Pädagogik & Freire', nameVi: 'Sư phạm phê phán & Freire', nameEn: 'Critical Pedagogy & Freire', words: 35 },
    { num: '127', slug: 'c2-konstruktivismus-lernen', name: 'Konstruktivismus & Lerntheorie', nameVi: 'Chủ nghĩa kiến tạo & Lý thuyết học', nameEn: 'Constructivism & Learning Theory', words: 35 },

    // Rechtsphilosophie vertieft
    { num: '128', slug: 'c2-naturrecht-rechtspositivismus', name: 'Naturrecht & Rechtspositivismus', nameVi: 'Luật tự nhiên & Thực chứng pháp lý', nameEn: 'Natural Law & Legal Positivism', words: 35 },
    { num: '129', slug: 'c2-restorative-justice', name: 'Restorative Justice & Wiedergutmachung', nameVi: 'Tư pháp phục hồi & Bồi thường', nameEn: 'Restorative Justice & Restitution', words: 35 },

    // Ästhetik vertieft
    { num: '130', slug: 'c2-erhabene-sublime', name: 'Das Erhabene & Ästhetik des Sublimen', nameVi: 'Cái Cao cả & Mỹ học siêu phàm', nameEn: 'The Sublime & Aesthetics of the Sublime', words: 35 },
    { num: '131', slug: 'c2-dialektik-der-aufklaerung', name: 'Dialektik der Aufklärung & Adorno', nameVi: 'Biện chứng của Khai sáng & Adorno', nameEn: 'Dialectic of Enlightenment & Adorno', words: 35 },

    // Soziologie vertieft
    { num: '132', slug: 'c2-wissenssoziologie', name: 'Wissenssoziologie & Mannheim', nameVi: 'Xã hội học tri thức & Mannheim', nameEn: 'Sociology of Knowledge & Mannheim', words: 35 },
    { num: '133', slug: 'c2-symbolischer-interaktionismus', name: 'Symbolischer Interaktionismus & Mead', nameVi: 'Tương tác biểu tượng & Mead', nameEn: 'Symbolic Interactionism & Mead', words: 35 },
    { num: '134', slug: 'c2-ethnomethodologie', name: 'Ethnomethodologie & Garfinkel', nameVi: 'Phương pháp học dân tộc & Garfinkel', nameEn: 'Ethnomethodology & Garfinkel', words: 35 },

    // Geschichtsphilosophie
    { num: '135', slug: 'c2-geschichtsphilosophie', name: 'Geschichtsphilosophie & Historismus', nameVi: 'Triết học lịch sử & Chủ nghĩa lịch sử', nameEn: 'Philosophy of History & Historicism', words: 35 },
    { num: '136', slug: 'c2-utopieforschung', name: 'Utopieforschung & Dystopie', nameVi: 'Nghiên cứu không tưởng & Phản địa đàng', nameEn: 'Utopia Research & Dystopia', words: 35 },

    // Musikwissenschaft vertieft
    { num: '137', slug: 'c2-musiksemiotik', name: 'Musiksemiotik & Bedeutung', nameVi: 'Ký hiệu học âm nhạc & Ý nghĩa', nameEn: 'Music Semiotics & Meaning', words: 35 },
    { num: '138', slug: 'c2-ethnomusikologie', name: 'Ethnomusikologie & Weltmusik', nameVi: 'Dân tộc nhạc học & Nhạc thế giới', nameEn: 'Ethnomusicology & World Music', words: 35 },

    // Physik & Kosmologie
    { num: '139', slug: 'c2-kosmologie-astrophysik', name: 'Kosmologie & Astrophysik', nameVi: 'Vũ trụ học & Vật lý thiên văn', nameEn: 'Cosmology & Astrophysics', words: 35 },
    { num: '140', slug: 'c2-quantenmechanik-interpretation', name: 'Quantenmechanik-Interpretationen', nameVi: 'Các diễn giải cơ học lượng tử', nameEn: 'Quantum Mechanics Interpretations', words: 35 },

    // Informatik & KI
    { num: '141', slug: 'c2-bewusstseinsforschung-ki', name: 'Bewusstseinsforschung & KI', nameVi: 'Nghiên cứu ý thức & AI', nameEn: 'Consciousness Research & AI', words: 35 },
    { num: '142', slug: 'c2-informationsarchitektur', name: 'Informationsarchitektur & Ontologien', nameVi: 'Kiến trúc thông tin & Bản thể học', nameEn: 'Information Architecture & Ontologies', words: 35 },

    // Psychoanalyse vertieft
    { num: '143', slug: 'c2-lacan-lacanian', name: 'Lacan & lacansche Psychoanalyse', nameVi: 'Lacan & Phân tâm học Lacan', nameEn: 'Lacan & Lacanian Psychoanalysis', words: 35 },
    { num: '144', slug: 'c2-trauma-forschung', name: 'Traumaforschung & kollektives Trauma', nameVi: 'Nghiên cứu chấn thương & Chấn thương tập thể', nameEn: 'Trauma Research & Collective Trauma', words: 35 },

    // Geographie & Raumtheorie
    { num: '145', slug: 'c2-raumtheorie-lefebvre', name: 'Raumtheorie & Lefebvre', nameVi: 'Lý thuyết không gian & Lefebvre', nameEn: 'Space Theory & Lefebvre', words: 35 },
]

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const startFrom = args.find(a => a.startsWith('--from='))?.split('=')[1]
function sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)) }

function buildPrompt(t: T): string {
    return `You are an expert German language teacher creating C2-level (CEFR/Mastery) vocabulary.
Theme: "${t.name}" (${t.nameEn})
Level: C2 — near-native, highly specialized, academic/scholarly register.
Generate exactly ${t.words} German words. Mix: Nouns ~55%, Verbs ~20%, Adjectives ~20%, Others ~5%.
For nouns: article (MASKULIN/FEMININ/NEUTRUM) + plural. Others: null.
NO vocabulary below C1. Include Fachbegriffe, nominalized infinitives, complex compound nouns.
Return ONLY valid JSON array, no markdown. Each object:
{"word":"...","article":"MASKULIN"|"FEMININ"|"NEUTRUM"|null,"plural":"die ..."|null,"wordType":"NOMEN"|"VERB"|"ADJEKTIV"|"ADVERB","meaningVi":"...","meaningEn":"...","exampleSentence1":"...","exampleTranslation1":"...(Vietnamese)","exampleSentence2":"...","exampleTranslation2":"...(Vietnamese)"}`
}

async function gen(t: T): Promise<boolean> {
    const f = `${t.num}-${t.slug.replace('c2-', '')}.json`, fp = path.join(CONTENT_DIR, f)
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
    console.log('🦊 Phase 4 Round 3 — C2 Final (+45)\n' + '='.repeat(40))
    let themes = THEMES
    if (startFrom) { const i = themes.findIndex(t => t.num === startFrom); if (i >= 0) { themes = themes.slice(i); console.log(`🎯 From ${startFrom} (${themes.length})`) } }
    let s = 0, f = 0
    for (const t of themes) { console.log(`\n  🔄 ${t.name}`); if (await gen(t)) s++; else f++; if (!dryRun) await sleep(4000) }
    console.log(`\n${'='.repeat(40)}\n📊 ✅ ${s} | ❌ ${f} | ~${s * 35} words\n🦊 Done!`)
}
main().catch(console.error)
