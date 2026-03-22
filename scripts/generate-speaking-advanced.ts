/**
 * generate-speaking-advanced.ts
 * 
 * Generates Nachsprechen content for B2, C1, C2 levels using Gemini.
 * Unlike the A1 generator, this creates content from scratch (no Audio Factory).
 * 
 * Usage:
 *   GEMINI_API_KEY="..." npx tsx scripts/generate-speaking-advanced.ts [b2|c1|c2] [topic-slug]
 *
 * Examples:
 *   GEMINI_API_KEY="..." npx tsx scripts/generate-speaking-advanced.ts b2
 *   GEMINI_API_KEY="..." npx tsx scripts/generate-speaking-advanced.ts c1 c1-umwelt
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const GEMINI_API_KEY = process.env.GEMINI_API_KEY
if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY is required')
  process.exit(1)
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const CONTENT_ROOT = path.resolve(__dirname, '../content')

// ─── Topic definitions per level ─────────────────────────────────────────────

interface TopicDef {
  slug: string
  titleDe: string
  titleVi: string
  context: string
}

const B2_TOPICS: TopicDef[] = [
  // Existing (already have content):
  // b2-arbeit, b2-einkaufen, b2-essen, b2-lernen
  // New topics:
  { slug: 'b2-freizeit', titleDe: 'Freizeit und Kultur', titleVi: 'Giải trí và Văn hóa', context: 'cultural events, leisure activities, theater, concerts, museums, hobbies, work-life balance' },
  { slug: 'b2-gesundheit', titleDe: 'Gesundheit und Wohlbefinden', titleVi: 'Sức khỏe và Hạnh phúc', context: 'healthcare system, mental health, fitness, nutrition, wellness, stress management, insurance' },
  { slug: 'b2-reisen', titleDe: 'Reisen und Tourismus', titleVi: 'Du lịch', context: 'travel planning, tourism, cultural exchange, sustainable travel, accommodations, complaints' },
  { slug: 'b2-umwelt', titleDe: 'Umwelt und Nachhaltigkeit', titleVi: 'Môi trường và Phát triển bền vững', context: 'environment, climate change, recycling, sustainability, renewable energy, ecological footprint' },
  { slug: 'b2-medien', titleDe: 'Medien und Kommunikation', titleVi: 'Truyền thông và Giao tiếp', context: 'social media, news, digital communication, journalism, media consumption, information literacy' },
  { slug: 'b2-wohnen', titleDe: 'Wohnen und Stadtleben', titleVi: 'Nhà ở và Đời sống thành phố', context: 'urban living, housing market, rent, neighborhood, city planning, gentrification, commuting' },
]

const C1_TOPICS: TopicDef[] = [
  // Existing: c1-lernen
  // New topics:
  { slug: 'c1-arbeit', titleDe: 'Arbeitswelt und Karriere', titleVi: 'Thế giới Nghề nghiệp và Sự nghiệp', context: 'career development, job market, leadership, remote work, work culture, entrepreneurship, globalization' },
  { slug: 'c1-gesellschaft', titleDe: 'Gesellschaft und Zusammenleben', titleVi: 'Xã hội và Cộng đồng', context: 'social issues, integration, diversity, democracy, civil engagement, generational changes, social justice' },
  { slug: 'c1-umwelt', titleDe: 'Umwelt und Klimawandel', titleVi: 'Môi trường và Biến đổi Khí hậu', context: 'climate policy, environmental science, biodiversity, energy transition, circular economy, environmental ethics' },
  { slug: 'c1-medien', titleDe: 'Medien und Digitalisierung', titleVi: 'Truyền thông và Số hóa', context: 'digital transformation, AI, data privacy, media ethics, fake news, digital literacy, platform economy' },
  { slug: 'c1-kultur', titleDe: 'Kultur und Identität', titleVi: 'Văn hóa và Bản sắc', context: 'cultural identity, art, literature, intercultural communication, traditions, cultural heritage, globalization of culture' },
  { slug: 'c1-wissenschaft', titleDe: 'Wissenschaft und Forschung', titleVi: 'Khoa học và Nghiên cứu', context: 'scientific research, innovation, ethics in science, academic discourse, technology impact, evidence-based thinking' },
  { slug: 'c1-gesundheit', titleDe: 'Gesundheitswesen und Ethik', titleVi: 'Y tế và Đạo đức', context: 'healthcare system, medical ethics, public health, mental health policy, aging society, bioethics, pharmaceutical industry' },
]

const C2_TOPICS: TopicDef[] = [
  { slug: 'c2-philosophie', titleDe: 'Philosophie und Ethik', titleVi: 'Triết học và Đạo đức', context: 'philosophical concepts, ethical dilemmas, moral philosophy, existentialism, epistemology, contemporary philosophical debates' },
  { slug: 'c2-politik', titleDe: 'Politik und Geopolitik', titleVi: 'Chính trị và Địa chính trị', context: 'international relations, geopolitics, diplomacy, political systems, European Union, global governance, political discourse' },
  { slug: 'c2-wirtschaft', titleDe: 'Wirtschaft und Globalisierung', titleVi: 'Kinh tế và Toàn cầu hóa', context: 'macroeconomics, globalization, trade policy, economic theory, financial markets, development economics, inequality' },
  { slug: 'c2-kunst', titleDe: 'Kunst und Ästhetik', titleVi: 'Nghệ thuật và Thẩm mỹ', context: 'art criticism, aesthetic theory, contemporary art, cultural production, art history, creative industries, artistic expression' },
  { slug: 'c2-sprache', titleDe: 'Sprache und Linguistik', titleVi: 'Ngôn ngữ và Ngôn ngữ học', context: 'linguistics, language acquisition, sociolinguistics, pragmatics, discourse analysis, language policy, multilingualism' },
  { slug: 'c2-technologie', titleDe: 'Technologie und Zukunft', titleVi: 'Công nghệ và Tương lai', context: 'emerging technologies, AI ethics, transhumanism, technological singularity, biotechnology, space exploration, digital society' },
]

const ALL_TOPICS: Record<string, TopicDef[]> = {
  b2: B2_TOPICS,
  c1: C1_TOPICS,
  c2: C2_TOPICS,
}

// ─── CEFR level descriptions ────────────────────────────────────────────────

const LEVEL_DESC: Record<string, string> = {
  b2: `B2 (Fortgeschritten / Vantage):
- Kann die Hauptinhalte komplexer Texte zu konkreten und abstrakten Themen verstehen
- Kann sich so spontan und fließend verständigen, dass ein normales Gespräch möglich ist
- Kann zu einem breiten Themenspektrum klare und detaillierte Texte verfassen
- Sätze: 12-20 Wörter, Nebensätze, Konjunktiv II, Passiv, Relativsätze`,

  c1: `C1 (Kompetent / Effective Operational Proficiency):
- Kann ein breites Spektrum anspruchsvoller, längerer Texte verstehen
- Kann Sprache im gesellschaftlichen und beruflichen Leben wirksam einsetzen
- Komplexe Satzstrukturen, erweiterte Partizipien, Nominalisierungen
- Sätze: 15-25 Wörter, akademischer/formeller Stil`,

  c2: `C2 (Mastery / Near-native):
- Kann praktisch alles mühelos verstehen
- Kann Informationen zusammenfassen und dabei aus verschiedenen Quellen Argumente rekonstruieren
- Höchst differenzierter Ausdruck, Stilmittel, Nuancen
- Sätze: 18-30 Wörter, rhetorische Mittel, Fachsprache, idiomatische Wendungen`,
}

// ─── Prompt template ────────────────────────────────────────────────────────

function buildPrompt(level: string, topic: TopicDef, lessonNum: number, lessonTitle: string): string {
  const levelInfo = LEVEL_DESC[level] || LEVEL_DESC.b2
  const cefrUpper = level.toUpperCase()

  return `Du bist ein Experte für Deutsch als Fremdsprache (DaF) auf ${cefrUpper}-Niveau.

Erstelle 6 Sätze für eine Nachsprechen-Übung (Repeat-After-Me) auf ${cefrUpper}-Niveau.

Thema: "${topic.titleDe}" — "${lessonTitle}"
Kontext: ${topic.context}

${cefrUpper}-Anforderungen:
${levelInfo}

Die 6 Sätze sollen:
- Thematisch zur Lektion "${lessonTitle}" passen
- Von LEICHT → SCHWIERIGER verlaufen (Satz 1 am einfachsten, Satz 6 am komplexesten)
- Dem ${cefrUpper}-Niveau entsprechen (Wortschatz, Grammatik, Satzkomplexität)
- Natürlich, authentisch und bildungssprachlich klingen
- Verschiedene grammatische Strukturen verwenden
- Unterschiedliche phonetische Herausforderungen enthalten

Antworte NUR mit einem JSON-Array. Für jeden Satz:
{
  "german": "Der deutsche Satz",
  "vietnamese": "Bản dịch tiếng Việt (tự nhiên, không dịch sát từng từ)",
  "ipa": "IPA-Lautschrift des deutschen Satzes (in eckigen Klammern)",
  "pronunciationTips": "Ghi chú phát âm bằng tiếng Việt (tập trung vào âm khó: ch, sch, ü, ö, ä, z, r, ei, eu, Umlaute, Konsonantencluster)",
  "audioUrl": "https://pub-2e3895bbabbf4d3cad68dc3bece2f3a6.r2.dev/L-SPR-${cefrUpper}-${topic.slug.split('-').slice(1).join('-').toUpperCase()}-${String(lessonNum).padStart(2, '0')}-S{N}.mp3"
}

Ersetze {N} durch die Satznummer (1-6).

Wichtig bei pronunciationTips:
- Schreibe AUF VIETNAMESISCH
- Fokus auf phonetische Herausforderungen für Vietnamesen
- Kurz und praktisch (1-2 Sätze)

ANTWORTE NUR MIT DEM JSON-ARRAY, KEIN ANDERER TEXT.`
}

// ─── Lesson title templates ──────────────────────────────────────────────────

function getLessonTitles(level: string, topic: TopicDef): Array<{ titleDe: string; titleVi: string }> {
  // Generate 8 themed lesson titles based on topic context
  const templates: Record<string, Array<{ titleDe: string; titleVi: string }>> = {
    // B2 topics
    'b2-freizeit': [
      { titleDe: 'Kulturelle Veranstaltungen', titleVi: 'Sự kiện văn hóa' },
      { titleDe: 'Sport und Fitness', titleVi: 'Thể thao và Sức khỏe' },
      { titleDe: 'Musik und Konzerte', titleVi: 'Âm nhạc và Buổi hòa nhạc' },
      { titleDe: 'Museumsbesuche', titleVi: 'Tham quan bảo tàng' },
      { titleDe: 'Hobbys und Leidenschaften', titleVi: 'Sở thích và Đam mê' },
      { titleDe: 'Work-Life-Balance', titleVi: 'Cân bằng công việc - cuộc sống' },
      { titleDe: 'Vereine und Gemeinschaft', titleVi: 'Câu lạc bộ và Cộng đồng' },
      { titleDe: 'Kreative Beschäftigungen', titleVi: 'Hoạt động sáng tạo' },
    ],
    'b2-gesundheit': [
      { titleDe: 'Gesundheitssystem in Deutschland', titleVi: 'Hệ thống y tế ở Đức' },
      { titleDe: 'Psychische Gesundheit', titleVi: 'Sức khỏe tâm thần' },
      { titleDe: 'Ernährung und Wohlbefinden', titleVi: 'Dinh dưỡng và Sự khỏe mạnh' },
      { titleDe: 'Stressmanagement', titleVi: 'Quản lý stress' },
      { titleDe: 'Vorsorge und Prävention', titleVi: 'Phòng ngừa bệnh tật' },
      { titleDe: 'Alternative Heilmethoden', titleVi: 'Phương pháp chữa bệnh thay thế' },
      { titleDe: 'Krankenversicherung', titleVi: 'Bảo hiểm y tế' },
      { titleDe: 'Gesunde Lebensführung', titleVi: 'Lối sống lành mạnh' },
    ],
    'b2-reisen': [
      { titleDe: 'Reiseplanung und Buchung', titleVi: 'Lập kế hoạch du lịch' },
      { titleDe: 'Nachhaltiger Tourismus', titleVi: 'Du lịch bền vững' },
      { titleDe: 'Kulturelle Begegnungen', titleVi: 'Giao lưu văn hóa' },
      { titleDe: 'Unterkünfte und Bewertungen', titleVi: 'Nơi ở và Đánh giá' },
      { titleDe: 'Beschwerden und Reklamationen', titleVi: 'Khiếu nại và Phản hồi' },
      { titleDe: 'Abenteuerreisen', titleVi: 'Du lịch phiêu lưu' },
      { titleDe: 'Städtereisen in Europa', titleVi: 'Du lịch thành phố châu Âu' },
      { titleDe: 'Reiseerfahrungen teilen', titleVi: 'Chia sẻ trải nghiệm du lịch' },
    ],
    'b2-umwelt': [
      { titleDe: 'Klimawandel verstehen', titleVi: 'Hiểu về biến đổi khí hậu' },
      { titleDe: 'Recycling und Mülltrennung', titleVi: 'Tái chế và Phân loại rác' },
      { titleDe: 'Erneuerbare Energien', titleVi: 'Năng lượng tái tạo' },
      { titleDe: 'Ökologischer Fußabdruck', titleVi: 'Dấu chân sinh thái' },
      { titleDe: 'Umweltschutz im Alltag', titleVi: 'Bảo vệ môi trường trong đời sống' },
      { titleDe: 'Nachhaltiger Konsum', titleVi: 'Tiêu dùng bền vững' },
      { titleDe: 'Artenschutz und Biodiversität', titleVi: 'Bảo tồn loài và Đa dạng sinh học' },
      { titleDe: 'Umweltbewusstsein', titleVi: 'Ý thức môi trường' },
    ],
    'b2-medien': [
      { titleDe: 'Soziale Medien und Gesellschaft', titleVi: 'Mạng xã hội và Xã hội' },
      { titleDe: 'Nachrichtenkonsum', titleVi: 'Tiêu thụ tin tức' },
      { titleDe: 'Digitale Kommunikation', titleVi: 'Giao tiếp kỹ thuật số' },
      { titleDe: 'Medienkompetenz', titleVi: 'Năng lực truyền thông' },
      { titleDe: 'Fake News erkennen', titleVi: 'Nhận biết tin giả' },
      { titleDe: 'Influencer und Werbung', titleVi: 'Influencer và Quảng cáo' },
      { titleDe: 'Datenschutz und Privatsphäre', titleVi: 'Bảo vệ dữ liệu và Quyền riêng tư' },
      { titleDe: 'Streaming und Unterhaltung', titleVi: 'Streaming và Giải trí' },
    ],
    'b2-wohnen': [
      { titleDe: 'Wohnungssuche in der Stadt', titleVi: 'Tìm nhà ở thành phố' },
      { titleDe: 'Mietrecht und Verträge', titleVi: 'Luật thuê nhà và Hợp đồng' },
      { titleDe: 'Nachbarschaft und Zusammenleben', titleVi: 'Hàng xóm và Cuộc sống chung' },
      { titleDe: 'Stadtplanung und Verkehr', titleVi: 'Quy hoạch đô thị và Giao thông' },
      { titleDe: 'Energieeffizienz im Haushalt', titleVi: 'Hiệu quả năng lượng trong nhà' },
      { titleDe: 'Smart Home Technologien', titleVi: 'Công nghệ nhà thông minh' },
      { titleDe: 'Gentrifizierung', titleVi: 'Quý tộc hóa đô thị' },
      { titleDe: 'Wohnungsmarkt und Preise', titleVi: 'Thị trường nhà ở và Giá cả' },
    ],
    // C1 topics
    'c1-arbeit': [
      { titleDe: 'Karriereentwicklung', titleVi: 'Phát triển sự nghiệp' },
      { titleDe: 'Führungskompetenzen', titleVi: 'Năng lực lãnh đạo' },
      { titleDe: 'Remote Work und Digitalisierung', titleVi: 'Làm việc từ xa và Số hóa' },
      { titleDe: 'Unternehmenskultur', titleVi: 'Văn hóa doanh nghiệp' },
      { titleDe: 'Arbeitsrecht und Mitbestimmung', titleVi: 'Luật lao động và Quyền đồng quyết định' },
      { titleDe: 'Entrepreneurship', titleVi: 'Khởi nghiệp' },
      { titleDe: 'Fachkräftemangel', titleVi: 'Thiếu hụt nhân lực chuyên môn' },
      { titleDe: 'Work-Life-Integration', titleVi: 'Hòa nhập công việc-cuộc sống' },
    ],
    'c1-gesellschaft': [
      { titleDe: 'Integration und Migration', titleVi: 'Hội nhập và Di cư' },
      { titleDe: 'Demokratie und Bürgerbeteiligung', titleVi: 'Dân chủ và Sự tham gia của công dân' },
      { titleDe: 'Soziale Gerechtigkeit', titleVi: 'Công bằng xã hội' },
      { titleDe: 'Generationenkonflikte', titleVi: 'Xung đột thế hệ' },
      { titleDe: 'Diversität und Inklusion', titleVi: 'Đa dạng và Hòa nhập' },
      { titleDe: 'Zivilgesellschaft', titleVi: 'Xã hội dân sự' },
      { titleDe: 'Soziale Ungleichheit', titleVi: 'Bất bình đẳng xã hội' },
      { titleDe: 'Demografischer Wandel', titleVi: 'Biến đổi nhân khẩu học' },
    ],
    'c1-umwelt': [
      { titleDe: 'Klimapolitik und Gesetzgebung', titleVi: 'Chính sách khí hậu và Pháp luật' },
      { titleDe: 'Biodiversitätsverlust', titleVi: 'Mất đa dạng sinh học' },
      { titleDe: 'Energiewende', titleVi: 'Chuyển đổi năng lượng' },
      { titleDe: 'Kreislaufwirtschaft', titleVi: 'Kinh tế tuần hoàn' },
      { titleDe: 'Umweltethik', titleVi: 'Đạo đức môi trường' },
      { titleDe: 'Nachhaltige Stadtentwicklung', titleVi: 'Phát triển đô thị bền vững' },
      { titleDe: 'Wassermanagement', titleVi: 'Quản lý nguồn nước' },
      { titleDe: 'Globale Umweltverantwortung', titleVi: 'Trách nhiệm môi trường toàn cầu' },
    ],
    'c1-medien': [
      { titleDe: 'Künstliche Intelligenz und Ethik', titleVi: 'Trí tuệ nhân tạo và Đạo đức' },
      { titleDe: 'Datenschutzgrundverordnung', titleVi: 'Quy định bảo vệ dữ liệu (DSGVO)' },
      { titleDe: 'Medienethik und Verantwortung', titleVi: 'Đạo đức truyền thông và Trách nhiệm' },
      { titleDe: 'Desinformation und Propaganda', titleVi: 'Thông tin sai lệch và Tuyên truyền' },
      { titleDe: 'Digitale Teilhabe', titleVi: 'Sự tham gia kỹ thuật số' },
      { titleDe: 'Plattformökonomie', titleVi: 'Kinh tế nền tảng' },
      { titleDe: 'Journalismus im Wandel', titleVi: 'Báo chí trong quá trình chuyển đổi' },
      { titleDe: 'Algorithmen und Filterblasen', titleVi: 'Thuật toán và Bong bóng lọc thông tin' },
    ],
    'c1-kultur': [
      { titleDe: 'Kulturelle Identität', titleVi: 'Bản sắc văn hóa' },
      { titleDe: 'Interkulturelle Kommunikation', titleVi: 'Giao tiếp liên văn hóa' },
      { titleDe: 'Literatur und Gesellschaft', titleVi: 'Văn học và Xã hội' },
      { titleDe: 'Kulturelles Erbe', titleVi: 'Di sản văn hóa' },
      { titleDe: 'Globalisierung der Kultur', titleVi: 'Toàn cầu hóa văn hóa' },
      { titleDe: 'Kunst als Gesellschaftskritik', titleVi: 'Nghệ thuật như phê bình xã hội' },
      { titleDe: 'Traditionen im Wandel', titleVi: 'Truyền thống trong quá trình thay đổi' },
      { titleDe: 'Sprachliche Vielfalt', titleVi: 'Đa dạng ngôn ngữ' },
    ],
    'c1-wissenschaft': [
      { titleDe: 'Grundlagen der Forschung', titleVi: 'Nền tảng nghiên cứu' },
      { titleDe: 'Innovation und Fortschritt', titleVi: 'Đổi mới và Tiến bộ' },
      { titleDe: 'Ethik in der Wissenschaft', titleVi: 'Đạo đức trong khoa học' },
      { titleDe: 'Wissenschaftskommunikation', titleVi: 'Truyền thông khoa học' },
      { titleDe: 'Technologische Auswirkungen', titleVi: 'Tác động công nghệ' },
      { titleDe: 'Interdisziplinäre Forschung', titleVi: 'Nghiên cứu liên ngành' },
      { titleDe: 'Evidenzbasiertes Denken', titleVi: 'Tư duy dựa trên bằng chứng' },
      { titleDe: 'Zukunftstechnologien', titleVi: 'Công nghệ tương lai' },
    ],
    'c1-gesundheit': [
      { titleDe: 'Gesundheitspolitik', titleVi: 'Chính sách y tế' },
      { titleDe: 'Medizinische Ethik', titleVi: 'Đạo đức y học' },
      { titleDe: 'Öffentliche Gesundheit', titleVi: 'Y tế công cộng' },
      { titleDe: 'Psychische Gesundheit und Stigma', titleVi: 'Sức khỏe tâm thần và Kỳ thị' },
      { titleDe: 'Alternde Gesellschaft', titleVi: 'Xã hội già hóa' },
      { titleDe: 'Bioethik und Forschung', titleVi: 'Đạo đức sinh học và Nghiên cứu' },
      { titleDe: 'Pharmaindustrie', titleVi: 'Ngành dược phẩm' },
      { titleDe: 'Prävention und Gesundheitsförderung', titleVi: 'Phòng ngừa và Nâng cao sức khỏe' },
    ],
    // C2 topics
    'c2-philosophie': [
      { titleDe: 'Erkenntnistheorie', titleVi: 'Nhận thức luận' },
      { titleDe: 'Moralphilosophie', titleVi: 'Triết học đạo đức' },
      { titleDe: 'Existenzialismus', titleVi: 'Chủ nghĩa hiện sinh' },
      { titleDe: 'Ethische Dilemmata', titleVi: 'Tình thế tiến thoái lưỡng nan về đạo đức' },
      { titleDe: 'Sprachphilosophie', titleVi: 'Triết học ngôn ngữ' },
      { titleDe: 'Politische Philosophie', titleVi: 'Triết học chính trị' },
      { titleDe: 'Ästhetik und Wahrnehmung', titleVi: 'Thẩm mỹ và Nhận thức' },
      { titleDe: 'Zeitgenössische Debatten', titleVi: 'Các cuộc tranh luận đương đại' },
    ],
    'c2-politik': [
      { titleDe: 'Internationale Beziehungen', titleVi: 'Quan hệ quốc tế' },
      { titleDe: 'Europäische Integration', titleVi: 'Hội nhập châu Âu' },
      { titleDe: 'Diplomatische Verhandlungen', titleVi: 'Đàm phán ngoại giao' },
      { titleDe: 'Politische Systeme im Vergleich', titleVi: 'So sánh các hệ thống chính trị' },
      { titleDe: 'Geopolitische Herausforderungen', titleVi: 'Thách thức địa chính trị' },
      { titleDe: 'Menschenrechte und Völkerrecht', titleVi: 'Nhân quyền và Luật quốc tế' },
      { titleDe: 'Politische Rhetorik', titleVi: 'Tu từ chính trị' },
      { titleDe: 'Globale Governance', titleVi: 'Quản trị toàn cầu' },
    ],
    'c2-wirtschaft': [
      { titleDe: 'Makroökonomische Theorien', titleVi: 'Lý thuyết kinh tế vĩ mô' },
      { titleDe: 'Globale Handelsbeziehungen', titleVi: 'Quan hệ thương mại toàn cầu' },
      { titleDe: 'Finanzmarktregulierung', titleVi: 'Quy định thị trường tài chính' },
      { titleDe: 'Entwicklungsökonomie', titleVi: 'Kinh tế phát triển' },
      { titleDe: 'Verteilungsgerechtigkeit', titleVi: 'Công bằng phân phối' },
      { titleDe: 'Wirtschaftsethik', titleVi: 'Đạo đức kinh tế' },
      { titleDe: 'Digitale Wirtschaft', titleVi: 'Kinh tế số' },
      { titleDe: 'Nachhaltiges Wirtschaften', titleVi: 'Kinh tế bền vững' },
    ],
    'c2-kunst': [
      { titleDe: 'Kunstkritik und Interpretation', titleVi: 'Phê bình và Diễn giải nghệ thuật' },
      { titleDe: 'Ästhetische Theorien', titleVi: 'Lý thuyết thẩm mỹ' },
      { titleDe: 'Zeitgenössische Kunstbewegungen', titleVi: 'Các phong trào nghệ thuật đương đại' },
      { titleDe: 'Kunst und Technologie', titleVi: 'Nghệ thuật và Công nghệ' },
      { titleDe: 'Kulturelle Produktion', titleVi: 'Sản xuất văn hóa' },
      { titleDe: 'Performancekunst', titleVi: 'Nghệ thuật trình diễn' },
      { titleDe: 'Architektur und Raumgestaltung', titleVi: 'Kiến trúc và Thiết kế không gian' },
      { titleDe: 'Filmkunst und Erzählung', titleVi: 'Nghệ thuật điện ảnh và Tự sự' },
    ],
    'c2-sprache': [
      { titleDe: 'Spracherwerbstheorien', titleVi: 'Lý thuyết thụ đắc ngôn ngữ' },
      { titleDe: 'Soziolinguistik', titleVi: 'Ngôn ngữ học xã hội' },
      { titleDe: 'Pragmatik und Diskursanalyse', titleVi: 'Ngữ dụng học và Phân tích diễn ngôn' },
      { titleDe: 'Sprachpolitik und Sprachplanung', titleVi: 'Chính sách ngôn ngữ' },
      { titleDe: 'Mehrsprachigkeit', titleVi: 'Đa ngôn ngữ' },
      { titleDe: 'Sprache und Identität', titleVi: 'Ngôn ngữ và Bản sắc' },
      { titleDe: 'Kognitive Linguistik', titleVi: 'Ngôn ngữ học nhận thức' },
      { titleDe: 'Sprache im digitalen Zeitalter', titleVi: 'Ngôn ngữ trong thời đại số' },
    ],
    'c2-technologie': [
      { titleDe: 'Künstliche Superintelligenz', titleVi: 'Siêu trí tuệ nhân tạo' },
      { titleDe: 'Transhumanismus', titleVi: 'Chủ nghĩa siêu nhân' },
      { titleDe: 'Biotechnologie und Ethik', titleVi: 'Công nghệ sinh học và Đạo đức' },
      { titleDe: 'Raumfahrt und Kolonisierung', titleVi: 'Hàng không vũ trụ và Khai phá' },
      { titleDe: 'Quantencomputing', titleVi: 'Máy tính lượng tử' },
      { titleDe: 'Digitale Gesellschaft', titleVi: 'Xã hội số' },
      { titleDe: 'Technologische Singularität', titleVi: 'Điểm kỳ dị công nghệ' },
      { titleDe: 'Cyberethik und Datensouveränität', titleVi: 'Đạo đức mạng và Chủ quyền dữ liệu' },
    ],
  }

  return templates[topic.slug] || Array.from({ length: 8 }, (_, i) => ({
    titleDe: `Lektion ${i + 1}`,
    titleVi: `Bài ${i + 1}`,
  }))
}

// ─── Generation ─────────────────────────────────────────────────────────────

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function generateTopic(level: string, topic: TopicDef): Promise<void> {
  const outputDir = path.join(CONTENT_ROOT, level, 'speaking')
  fs.mkdirSync(outputDir, { recursive: true })

  const outFile = path.join(outputDir, `${topic.slug}.json`)
  if (fs.existsSync(outFile)) {
    console.log(`  ⏭️  ${topic.slug}: Already exists, skipping`)
    return
  }

  const cefrUpper = level.toUpperCase()
  const lessonTitles = getLessonTitles(level, topic)
  const lessons: any[] = []

  console.log(`\n🎤 ${topic.slug} (${topic.titleVi}) — ${lessonTitles.length} lessons`)

  for (let i = 0; i < lessonTitles.length; i++) {
    const lt = lessonTitles[i]!
    const lessonNum = i + 1
    const lessonId = `${topic.slug}-${String(lessonNum).padStart(2, '0')}`

    console.log(`  📝 Lesson ${lessonNum}: "${lt.titleDe}"`)

    const prompt = buildPrompt(level, topic, lessonNum, lt.titleDe)

    try {
      const result = await model.generateContent(prompt)
      const text = result.response.text()

      // Extract JSON from response
      let jsonStr = text
      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }

      const sentences = JSON.parse(jsonStr) as Array<{
        german: string
        vietnamese: string
        ipa: string
        pronunciationTips: string
        audioUrl: string
      }>

      // Fix audioUrl to have correct sentence numbers
      const fixedSentences = sentences.map((s, idx) => ({
        ...s,
        id: `${lessonId}-s${idx + 1}`,
        audioUrl: `https://pub-2e3895bbabbf4d3cad68dc3bece2f3a6.r2.dev/L-SPR-${cefrUpper}-${topic.slug.split('-').slice(1).join('-').toUpperCase()}-${String(lessonNum).padStart(2, '0')}-S${idx + 1}.mp3`,
      }))

      lessons.push({
        lessonId,
        lessonNumber: lessonNum,
        titleDe: lt.titleDe,
        titleVi: lt.titleVi,
        sentences: fixedSentences,
      })

      console.log(`     ✅ ${fixedSentences.length} sentences`)
    } catch (err: any) {
      console.error(`     ❌ Error: ${err.message?.slice(0, 100)}`)
      // Create minimal fallback
      lessons.push({
        lessonId,
        lessonNumber: lessonNum,
        titleDe: lt.titleDe,
        titleVi: lt.titleVi,
        sentences: [],
      })
    }

    // Rate limiting
    await sleep(1000)
  }

  // Save output
  const output = {
    topicSlug: topic.slug,
    cefrLevel: cefrUpper,
    titleDe: topic.titleDe,
    titleVi: topic.titleVi,
    lessons,
  }

  fs.writeFileSync(outFile, JSON.stringify(output, null, 2), 'utf-8')
  const totalSentences = lessons.reduce((sum, l) => sum + l.sentences.length, 0)
  console.log(`  💾 Saved: ${outFile} (${lessons.length} lessons, ${totalSentences} sentences)`)
}

// ─── Main ───────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const targetLevel = args[0]?.toLowerCase()
  const targetSlug = args[1]

  if (!targetLevel || !ALL_TOPICS[targetLevel]) {
    console.log('Usage: npx tsx scripts/generate-speaking-advanced.ts [b2|c1|c2] [optional-topic-slug]')
    console.log('\nAvailable levels and topics:')
    for (const [level, topics] of Object.entries(ALL_TOPICS)) {
      console.log(`\n  ${level.toUpperCase()}:`)
      for (const t of topics) {
        console.log(`    ${t.slug} — ${t.titleDe} (${t.titleVi})`)
      }
    }
    process.exit(0)
  }

  console.log(`🎤 Fuxie Speaking Content Generator — ${targetLevel.toUpperCase()}`)
  console.log('====================================================\n')

  const topics = ALL_TOPICS[targetLevel]!
  let generated = 0

  for (const topic of topics) {
    if (targetSlug && topic.slug !== targetSlug) continue
    await generateTopic(targetLevel, topic)
    generated++
  }

  if (generated === 0 && targetSlug) {
    console.log(`❌ Topic "${targetSlug}" not found in ${targetLevel.toUpperCase()}`)
  } else {
    console.log(`\n✅ Generated ${generated} topics for ${targetLevel.toUpperCase()}! 🦊`)
  }
}

main().catch(e => {
  console.error('❌ Generation failed:', e)
  process.exit(1)
})
