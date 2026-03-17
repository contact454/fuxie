/**
 * Phase 4 Round 2 — C2 Expansion (+50 themes, 61-110)
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
    // Philosophie vertieft
    { num: '61', slug: 'c2-phenomenologie', name: 'Phänomenologie & Husserl', nameVi: 'Hiện tượng học & Husserl', nameEn: 'Phenomenology & Husserl', words: 35 },
    { num: '62', slug: 'c2-dialektik-hegel', name: 'Dialektik & Hegel', nameVi: 'Biện chứng & Hegel', nameEn: 'Dialectics & Hegel', words: 35 },
    { num: '63', slug: 'c2-utilitarismus', name: 'Utilitarismus & Wohlfahrt', nameVi: 'Chủ nghĩa vị lợi & Phúc lợi', nameEn: 'Utilitarianism & Welfare', words: 35 },
    { num: '64', slug: 'c2-marxismus-kapitalismuskritik', name: 'Marxismus & Kapitalismuskritik', nameVi: 'Chủ nghĩa Marx & Phê phán CNTB', nameEn: 'Marxism & Capitalism Critique', words: 35 },
    { num: '65', slug: 'c2-anarchismus-libertarismus', name: 'Anarchismus & Libertarismus', nameVi: 'Chủ nghĩa vô chính phủ & Tự do', nameEn: 'Anarchism & Libertarianism', words: 35 },

    // Linguistik vertieft
    { num: '66', slug: 'c2-generative-grammatik', name: 'Generative Grammatik & Chomsky', nameVi: 'Ngữ pháp sinh thành & Chomsky', nameEn: 'Generative Grammar & Chomsky', words: 35 },
    { num: '67', slug: 'c2-kognitive-linguistik', name: 'Kognitive Linguistik & Metapher', nameVi: 'Ngôn ngữ học nhận thức & Ẩn dụ', nameEn: 'Cognitive Linguistics & Metaphor', words: 35 },
    { num: '68', slug: 'c2-spracherwerbsforschung', name: 'Spracherwerbsforschung', nameVi: 'Nghiên cứu thụ đắc ngôn ngữ', nameEn: 'Language Acquisition Research', words: 35 },
    { num: '69', slug: 'c2-korpuslinguistik', name: 'Korpuslinguistik & Computerlinguistik', nameVi: 'Ngôn ngữ học ngữ liệu & Máy tính', nameEn: 'Corpus & Computational Linguistics', words: 35 },

    // Recht vertieft
    { num: '70', slug: 'c2-europaeisches-recht', name: 'Europäisches Recht & EU-Verträge', nameVi: 'Luật châu Âu & Hiệp ước EU', nameEn: 'European Law & EU Treaties', words: 35 },
    { num: '71', slug: 'c2-wirtschaftsstrafrecht', name: 'Wirtschaftsstrafrecht & Compliance', nameVi: 'Luật hình sự kinh tế & Tuân thủ', nameEn: 'Economic Criminal Law & Compliance', words: 35 },
    { num: '72', slug: 'c2-medienrecht-urheberrecht', name: 'Medienrecht & Urheberrecht', nameVi: 'Luật truyền thông & Bản quyền', nameEn: 'Media Law & Copyright', words: 35 },

    // Wissenschaftstheorie vertieft
    { num: '73', slug: 'c2-falsifikationismus-popper', name: 'Falsifikationismus & Popper', nameVi: 'Chủ nghĩa phản chứng & Popper', nameEn: 'Falsificationism & Popper', words: 35 },
    { num: '74', slug: 'c2-wissenschaftliche-revolution', name: 'Wissenschaftliche Revolution & Kuhn', nameVi: 'Cách mạng khoa học & Kuhn', nameEn: 'Scientific Revolution & Kuhn', words: 35 },
    { num: '75', slug: 'c2-hermeneutischer-zirkel', name: 'Hermeneutischer Zirkel & Gadamer', nameVi: 'Vòng tuần hoàn giải thích & Gadamer', nameEn: 'Hermeneutic Circle & Gadamer', words: 35 },

    // Literaturwissenschaft vertieft
    { num: '76', slug: 'c2-intertextualitaet', name: 'Intertextualität & Dialogizität', nameVi: 'Liên văn bản & Tính đối thoại', nameEn: 'Intertextuality & Dialogism', words: 35 },
    { num: '77', slug: 'c2-postkoloniale-literatur', name: 'Postkoloniale Literatur & Subalternität', nameVi: 'Văn học hậu thuộc địa & Tính phụ thuộc', nameEn: 'Postcolonial Literature & Subalternity', words: 35 },
    { num: '78', slug: 'c2-dramentheorie-brecht', name: 'Dramentheorie & Brecht', nameVi: 'Lý thuyết kịch & Brecht', nameEn: 'Drama Theory & Brecht', words: 35 },
    { num: '79', slug: 'c2-literarische-gattungen', name: 'Literarische Gattungen & Gattungstheorie', nameVi: 'Thể loại văn học & Lý thuyết thể loại', nameEn: 'Literary Genres & Genre Theory', words: 35 },

    // Soziologie vertieft
    { num: '80', slug: 'c2-systemtheorie-luhmann', name: 'Systemtheorie & Luhmann', nameVi: 'Lý thuyết hệ thống & Luhmann', nameEn: 'Systems Theory & Luhmann', words: 35 },
    { num: '81', slug: 'c2-habituskonzept-bourdieu', name: 'Habituskonzept & Bourdieu', nameVi: 'Khái niệm Habitus & Bourdieu', nameEn: 'Habitus Concept & Bourdieu', words: 35 },
    { num: '82', slug: 'c2-risikogesellschaft-beck', name: 'Risikogesellschaft & Beck', nameVi: 'Xã hội rủi ro & Beck', nameEn: 'Risk Society & Beck', words: 35 },
    { num: '83', slug: 'c2-individualisierung-spätmoderne', name: 'Individualisierung & Spätmoderne', nameVi: 'Cá nhân hóa & Hậu hiện đại muộn', nameEn: 'Individualization & Late Modernity', words: 35 },
    { num: '84', slug: 'c2-netzwerkgesellschaft-castells', name: 'Netzwerkgesellschaft & Castells', nameVi: 'Xã hội mạng lưới & Castells', nameEn: 'Network Society & Castells', words: 35 },

    // Ökonomie vertieft
    { num: '85', slug: 'c2-spieltheorie-nash', name: 'Spieltheorie & Nash-Gleichgewicht', nameVi: 'Lý thuyết trò chơi & Cân bằng Nash', nameEn: 'Game Theory & Nash Equilibrium', words: 35 },
    { num: '86', slug: 'c2-entwicklungsoekonomie', name: 'Entwicklungsökonomie & Armutsforschung', nameVi: 'Kinh tế phát triển & Nghiên cứu đói nghèo', nameEn: 'Development Economics & Poverty Research', words: 35 },
    { num: '87', slug: 'c2-institutionelle-oekonomie', name: 'Institutionelle Ökonomie & Transaktionskosten', nameVi: 'Kinh tế thể chế & Chi phí giao dịch', nameEn: 'Institutional Economics & Transaction Costs', words: 35 },

    // Psychologie vertieft
    { num: '88', slug: 'c2-bindungstheorie-bowlby', name: 'Bindungstheorie & Bowlby', nameVi: 'Lý thuyết gắn bó & Bowlby', nameEn: 'Attachment Theory & Bowlby', words: 35 },
    { num: '89', slug: 'c2-positive-psychologie', name: 'Positive Psychologie & Flow', nameVi: 'Tâm lý học tích cực & Trạng thái flow', nameEn: 'Positive Psychology & Flow', words: 35 },
    { num: '90', slug: 'c2-neuropsychologie', name: 'Neuropsychologie & Lateralisation', nameVi: 'Tâm lý học thần kinh & Phân bổ bán cầu', nameEn: 'Neuropsychology & Lateralization', words: 35 },

    // Kulturwissenschaft
    { num: '91', slug: 'c2-kulturgedaechtnis', name: 'Kulturelles Gedächtnis & Assmann', nameVi: 'Ký ức văn hóa & Assmann', nameEn: 'Cultural Memory & Assmann', words: 35 },
    { num: '92', slug: 'c2-orientalismus-said', name: 'Orientalismus & Said', nameVi: 'Phương Đông học & Said', nameEn: 'Orientalism & Said', words: 35 },
    { num: '93', slug: 'c2-gender-studies-butler', name: 'Gender Studies & Butler', nameVi: 'Nghiên cứu giới & Butler', nameEn: 'Gender Studies & Butler', words: 35 },

    // Medien & Technologie
    { num: '94', slug: 'c2-kybernetik-informationstheorie', name: 'Kybernetik & Informationstheorie', nameVi: 'Điều khiển học & Lý thuyết thông tin', nameEn: 'Cybernetics & Information Theory', words: 35 },
    { num: '95', slug: 'c2-posthumanismus', name: 'Posthumanismus & Technokörper', nameVi: 'Hậu nhân bản & Cơ thể công nghệ', nameEn: 'Posthumanism & Technobody', words: 35 },
    { num: '96', slug: 'c2-ueberwachungsstaat', name: 'Überwachungsstaat & Panoptikum', nameVi: 'Nhà nước giám sát & Panopticon', nameEn: 'Surveillance State & Panopticon', words: 35 },

    // Ethik & Moral vertieft
    { num: '97', slug: 'c2-gerechtigkeitstheorie-rawls', name: 'Gerechtigkeitstheorie & Rawls', nameVi: 'Lý thuyết công lý & Rawls', nameEn: 'Theory of Justice & Rawls', words: 35 },
    { num: '98', slug: 'c2-diskursethik-habermas', name: 'Diskursethik & Habermas', nameVi: 'Đạo đức diễn ngôn & Habermas', nameEn: 'Discourse Ethics & Habermas', words: 35 },

    // Kunst vertieft
    { num: '99', slug: 'c2-avantgarde-dadaismus', name: 'Avantgarde & Dadaismus', nameVi: 'Tiên phong & Chủ nghĩa Dada', nameEn: 'Avant-garde & Dadaism', words: 35 },
    { num: '100', slug: 'c2-konzeptkunst-minimalismus', name: 'Konzeptkunst & Minimalismus', nameVi: 'Nghệ thuật ý niệm & Tối giản', nameEn: 'Conceptual Art & Minimalism', words: 35 },

    // Geschichte vertieft
    { num: '101', slug: 'c2-aufklaerung-kant', name: 'Aufklärung & Kant', nameVi: 'Khai sáng & Kant', nameEn: 'Enlightenment & Kant', words: 35 },
    { num: '102', slug: 'c2-kalter-krieg-bipolaritaet', name: 'Kalter Krieg & Bipolarität', nameVi: 'Chiến tranh Lạnh & Lưỡng cực', nameEn: 'Cold War & Bipolarity', words: 35 },
    { num: '103', slug: 'c2-kolonialgeschichte', name: 'Kolonialgeschichte & Dekolonisierung', nameVi: 'Lịch sử thuộc địa & Phi thuộc địa', nameEn: 'Colonial History & Decolonization', words: 35 },

    // Religion vertieft
    { num: '104', slug: 'c2-interreligioeser-dialog', name: 'Interreligiöser Dialog & Ökumene', nameVi: 'Đối thoại liên tôn & Đại kết', nameEn: 'Interfaith Dialogue & Ecumenism', words: 35 },
    { num: '105', slug: 'c2-religionskritik-feuerbach', name: 'Religionskritik & Feuerbach', nameVi: 'Phê bình tôn giáo & Feuerbach', nameEn: 'Religious Criticism & Feuerbach', words: 35 },

    // Architektur vertieft
    { num: '106', slug: 'c2-bauhaus-modernismus', name: 'Bauhaus & Modernismus', nameVi: 'Bauhaus & Chủ nghĩa hiện đại', nameEn: 'Bauhaus & Modernism', words: 35 },
    { num: '107', slug: 'c2-dekonstruktivismus-architektur', name: 'Dekonstruktivismus in der Architektur', nameVi: 'Giải cấu trúc trong kiến trúc', nameEn: 'Deconstructivism in Architecture', words: 35 },

    // Musik vertieft
    { num: '108', slug: 'c2-atonalitaet-schoenberg', name: 'Atonalität & Schönberg', nameVi: 'Phi âm tính & Schönberg', nameEn: 'Atonality & Schoenberg', words: 35 },
    { num: '109', slug: 'c2-elektronische-musik', name: 'Elektronische Musik & Klangkunst', nameVi: 'Âm nhạc điện tử & Nghệ thuật âm thanh', nameEn: 'Electronic Music & Sound Art', words: 35 },

    // Anthropologie
    { num: '110', slug: 'c2-strukturalismus-levi-strauss', name: 'Strukturalismus & Lévi-Strauss', nameVi: 'Chủ nghĩa cấu trúc & Lévi-Strauss', nameEn: 'Structuralism & Lévi-Strauss', words: 35 },
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
    console.log('🦊 Phase 4 Round 2 — C2 (+50)\n' + '='.repeat(40))
    let themes = THEMES
    if (startFrom) { const i = themes.findIndex(t => t.num === startFrom); if (i >= 0) { themes = themes.slice(i); console.log(`🎯 From ${startFrom} (${themes.length})`) } }
    let s = 0, f = 0
    for (const t of themes) { console.log(`\n  🔄 ${t.name}`); if (await gen(t)) s++; else f++; if (!dryRun) await sleep(4000) }
    console.log(`\n${'='.repeat(40)}\n📊 ✅ ${s} | ❌ ${f} | ~${s * 35} words\n🦊 Done!`)
}
main().catch(console.error)
