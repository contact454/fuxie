import { GoogleGenerativeAI } from '@google/generative-ai'

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || ''

let genAI: GoogleGenerativeAI | null = null

function getGenAI(): GoogleGenerativeAI {
    if (!genAI) {
        if (!API_KEY) {
            throw new Error('GEMINI_API_KEY or GOOGLE_AI_API_KEY environment variable is not set')
        }
        genAI = new GoogleGenerativeAI(API_KEY)
    }
    return genAI
}

// ─── 2-Tier Model Selection ─────────────────────────
// A1-B1: Flash-Lite (fast, cheap, sufficient for simple texts)
// B2-C2: Flash (more accurate for complex argumentation & cohesion)
const BASIC_LEVELS = new Set(['A1', 'A2', 'B1'])

function getModelForLevel(level: string): string {
    return BASIC_LEVELS.has(level)
        ? 'gemini-3.1-flash-lite-preview'
        : 'gemini-3-flash-preview'
}

// ─── Types ──────────────────────────────────────────
export interface GradingResult {
    totalScore: number
    maxScore: number
    percentScore: number
    estimatedLevel: string
    criteria: Array<{
        id: string
        name: string
        nameVi: string
        score: number
        maxScore: number
        reasoning: string
        reasoningVi: string
        suggestions: string[]
        suggestionsVi: string[]
    }>
    overallFeedback: string
    overallFeedbackVi: string
    corrections: Array<{
        original: string
        corrected: string
        type: string
        typeVi: string
        explanation: string
        explanationVi: string
    }>
}

interface RubricCriterion {
    id: string
    name: string
    nameVi?: string
    maxScore: number
    weight?: number
}

interface GradingRequest {
    cefrLevel: string
    textType: string
    register: string
    situation: string
    contentPoints: string[]
    submittedText: string
    minWords: number
    maxWords: number | null
    rubric: { criteria: RubricCriterion[]; maxScore: number }
}

// ─── Vietnamese Labels (with diacritics) ─────────────
const CRITERION_VI: Record<string, string> = {
    'Inhalt': 'Nội dung',
    'Kommunikative Angemessenheit': 'Phù hợp giao tiếp',
    'Angemessenheit': 'Tính phù hợp',
    'Korrektheit': 'Chính xác ngữ pháp & chính tả',
    'Wortschatz & Strukturen': 'Đa dạng từ vựng & cấu trúc',
    'Kohaerenz & Kohaesion': 'Mạch lạc & liên kết',
    'Kohärenz & Kohäsion': 'Mạch lạc & liên kết',
    'Vollständigkeit': 'Tính đầy đủ',
    'Formale Richtigkeit': 'Đúng hình thức',
}

const ERROR_TYPE_VI: Record<string, string> = {
    'Grammatik': 'Ngữ pháp',
    'Rechtschreibung': 'Chính tả',
    'Wortschatz': 'Từ vựng',
    'Syntax': 'Cú pháp',
    'Interpunktion': 'Dấu câu',
    'Register': 'Văn phong',
    'Formatierung': 'Định dạng',
    'Kohärenz': 'Liên kết',
}

// ─── CEFR Level-Specific Rubric Descriptors ─────────
// Based on Goethe-Institut scoring guidelines
function getCefrDescriptors(level: string): string {
    const descriptors: Record<string, string> = {
        'A1': `
### Bewertungsmaßstäbe Niveau A1 (Goethe-Zertifikat A1: Start Deutsch 1)
**Inhalt (Nội dung):**
- 5 Punkte: Alle geforderten Inhaltspunkte vollständig und verständlich behandelt
- 3 Punkte: Inhaltspunkte teilweise behandelt, einige fehlen
- 1 Punkt: Nur einzelne Inhaltspunkte vorhanden
- 0 Punkte: Aufgabe verfehlt, kein erkennbarer Bezug

**Korrektheit (Chính xác):**
- 5 Punkte: Einfache Sätze weitgehend korrekt, vereinzelte Fehler stören nicht
- 3 Punkte: Mehrere Fehler, aber Text noch verständlich
- 1 Punkt: Viele Fehler, Verständigung stark beeinträchtigt

**Angemessenheit (Tính phù hợp):**
- 5 Punkte: Register und Format korrekt, soziokulturellen Konventionen entsprechend
- 3 Punkte: Register teilweise angemessen
- 0 Punkte: Register völlig unangemessen`,

        'A2': `
### Bewertungsmaßstäbe Niveau A2 (Goethe-Zertifikat A2)
**Inhalt (Nội dung):**
- 5 Punkte: Alle Inhaltspunkte verständlich behandelt, ggf. mit Erweiterung
- 3 Punkte: Nicht alle Punkte behandelt oder nur oberflächlich
- 0 Punkte: Thema verfehlt

**Korrektheit (Chính xác ngữ pháp & chính tả):**
- 5 Punkte: Einfache Strukturen überwiegend korrekt (Verbposition, Kasus bei einfachen Fällen)
- 3 Punkte: Häufige Fehler, Text bleibt verständlich
- 1 Punkt: Grundlegende Grammatikfehler beeinträchtigen Verständnis

**Angemessenheit (Tính phù hợp):**
- 5 Punkte: Anrede, Gruß, Register passend (du/Sie richtig eingesetzt)
- 3 Punkte: Teilweise unpassendes Register
- 0 Punkte: Konventionen nicht beachtet`,

        'B1': `
### Bewertungsmaßstäbe Niveau B1 (Goethe-Zertifikat B1)
**Inhalt (Nội dung):**
- 5 Punkte: Alle 4 Inhaltspunkte ausführlich und differenziert behandelt
- 3 Punkte: 2-3 Punkte behandelt oder nur oberflächlich
- 0 Punkte: Unter 2 Inhaltspunkte oder Thema verfehlt

**Kommunikative Angemessenheit (Phù hợp giao tiếp):**
- 5 Punkte: Register durchgehend passend, Textsortenkonventionen erfüllt
- 3 Punkte: Register überwiegend passend, kleine Unstimmigkeiten

**Korrektheit (Chính xác ngữ pháp & chính tả):**
- 5 Punkte: Gute Beherrschung einfacher und einiger komplexer Strukturen
- 3 Punkte: Fehler bei komplexen Strukturen, Grundstrukturen korrekt
- 1 Punkt: Auch Grundstrukturen fehlerhaft

**Wortschatz & Strukturen (Đa dạng từ vựng & cấu trúc):**
- 5 Punkte: Angemessener, teilweise differenzierter Wortschatz
- 3 Punkte: Grundwortschatz korrekt, wenig Variation

**Kohärenz & Kohäsion (Mạch lạc & liên kết):**
- 5 Punkte: Logischer Aufbau, geeignete Konnektoren (weil, deshalb, obwohl)
- 3 Punkte: Teilweise zusammenhängend, wenige Konnektoren`,

        'B2': `
### Bewertungsmaßstäbe Niveau B2 (Goethe-Zertifikat B2)
**Inhalt (Nội dung):**
- 5 Punkte: Alle Inhaltspunkte differenziert und mit eigenen Argumenten
- 3 Punkte: Inhaltspunkte behandelt, aber wenig differenziert
- 0 Punkte: Wesentliche Aspekte fehlen

**Kommunikative Angemessenheit (Phù hợp giao tiếp):**
- 5 Punkte: Textsorte voll erfüllt, Register durchgehend korrekt
- 3 Punkte: Textsorte erkennbar, Register weitgehend passend

**Korrektheit (Chính xác ngữ pháp & chính tả):**
- 5 Punkte: Komplexe Satzstrukturen weitgehend korrekt (Konjunktiv II, Passiv, Relativsätze)
- 3 Punkte: Fehler bei komplexen Strukturen, stören nicht wesentlich
- 1 Punkt: Auch einfache Strukturen fehlerhaft

**Wortschatz & Strukturen (Đa dạng từ vựng & cấu trúc):**
- 5 Punkte: Differenzierter Wortschatz, themenspezifische Begriffe, Varianz bei Satzanfängen
- 3 Punkte: Angemessener Wortschatz, wenig Varianz

**Kohärenz & Kohäsion (Mạch lạc & liên kết):**
- 5 Punkte: Klare Gliederung (Einleitung, Hauptteil, Schluss), vielfältige Konnektoren
- 3 Punkte: Grundstruktur erkennbar, einfache Konnektoren`,

        'C1': `
### Bewertungsmaßstäbe Niveau C1 (Goethe-Zertifikat C1)
**Inhalt (Nội dung):**
- 5 Punkte: Alle Aspekte umfassend und differenziert mit eigener Stellungnahme
- 3 Punkte: Aspekte behandelt, aber nicht ausreichend differenziert

**Kommunikative Angemessenheit (Phù hợp giao tiếp):**
- 5 Punkte: Durchgehend angemessenes Register, souveräner Umgang mit Textsorte
- 3 Punkte: Im Wesentlichen angemessen, gelegentliche Stilbrüche

**Korrektheit (Chính xác ngữ pháp & chính tả):**
- 5 Punkte: Hohes Maß an grammatischer Korrektheit, kaum Fehler
- 3 Punkte: Gelegentliche Fehler bei komplexen Strukturen

**Wortschatz & Strukturen (Đa dạng từ vựng & cấu trúc):**
- 5 Punkte: Breiter, präziser Wortschatz, idiomatische Wendungen, stilistische Varianz
- 3 Punkte: Differenzierter Wortschatz, gelegentliche Ungenauigkeiten

**Kohärenz & Kohäsion (Mạch lạc & liên kết):**
- 5 Punkte: Durchgehend kohärenter, gut strukturierter Text mit vielfältigen Mitteln der Textverknüpfung
- 3 Punkte: Überwiegend kohärent, einige Brüche`,

        'C2': `
### Bewertungsmaßstäbe Niveau C2 (Goethe-Zertifikat C2: GDS)
**Inhalt (Nội dung):**
- 5 Punkte: Souveräne Behandlung aller Aspekte mit differenzierter Argumentation und Originalität
- 3 Punkte: Alle Aspekte behandelt, Argumentation konventionell

**Kommunikative Angemessenheit (Phù hợp giao tiếp):**
- 5 Punkte: Muttersprachliches Niveau der Angemessenheit, souveräner Umgang mit Register und Konventionen
- 3 Punkte: Durchgehend angemessen, selten stilistisch auffällig

**Korrektheit (Chính xác ngữ pháp & chính tả):**
- 5 Punkte: Nahezu fehlerfrei, auch bei komplexen Strukturen
- 3 Punkte: Vereinzelte Fehler, die den Gesamteindruck nicht beeinträchtigen

**Wortschatz & Strukturen (Đa dạng từ vựng & cấu trúc):**
- 5 Punkte: Präziser, nuancierter Wortschatz auf muttersprachlichem Niveau
- 3 Punkte: Differenziert, aber gelegentlich unpräzise

**Kohärenz & Kohäsion (Mạch lạc & liên kết):**
- 5 Punkte: Perfekt strukturierter, fließender Text mit anspruchsvollen Verknüpfungsmitteln
- 3 Punkte: Gut strukturiert mit angemessenen Verknüpfungsmitteln`,
    }
    return descriptors[level] ?? descriptors['B1']!
}

// ─── Grade Writing ──────────────────────────────────
export async function gradeWriting(req: GradingRequest): Promise<GradingResult> {
    const ai = getGenAI()
    const modelName = getModelForLevel(req.cefrLevel)
    const model = ai.getGenerativeModel({ model: modelName })

    console.log(`[AI Grading] Level: ${req.cefrLevel}, Model: ${modelName}`)

    const criteriaList = req.rubric.criteria.map(c =>
        `- "${c.name}" (${CRITERION_VI[c.name] || c.nameVi || ''}) — max ${c.maxScore} Punkte, Gewicht: ${c.weight || 20}%`
    ).join('\n')

    const contentPointsList = req.contentPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')
    const cefrDescriptors = getCefrDescriptors(req.cefrLevel)

    const prompt = `Du bist ein erfahrener DaF-Prüfer (Deutsch als Fremdsprache), spezialisiert auf CEFR-Bewertung und Goethe-Zertifikat-Prüfungen.

## Deine Rolle / Vai trò của bạn
Du bewertest den Text eines vietnamesischen Deutschlernenden. Deine Bewertung muss:
1. Streng den CEFR-Standards für Niveau ${req.cefrLevel} folgen
2. Die Goethe-Institut-Bewertungskriterien anwenden
3. Konstruktives Feedback geben — sowohl auf Deutsch als auch auf Vietnamesisch (song ngữ Đức-Việt)

## Aufgabenkontext / Ngữ cảnh bài tập
- **Niveau/Trình độ**: ${req.cefrLevel}
- **Texttyp/Loại bài**: ${req.textType}
- **Register/Văn phong**: ${req.register}
- **Situation/Tình huống**: ${req.situation}
- **Inhaltspunkte (Các điểm nội dung cần có)**:
${contentPointsList}
- **Wortanzahl/Số từ yêu cầu**: ${req.minWords}${req.maxWords ? `–${req.maxWords}` : '+'} Wörter

## Bewertungskriterien / Tiêu chí đánh giá
${criteriaList}

${cefrDescriptors}

## Eingereichter Text / Bài viết đã nộp
"""
${req.submittedText}
"""

## Anweisungen / Hướng dẫn chấm

### Schritt 1: Bewerte jedes Kriterium / Đánh giá từng tiêu chí
Für jedes Kriterium gib:
- Punktzahl (0 bis maxScore)
- reasoning: Begründung auf DEUTSCH (2-3 Sätze, konkret mit Textreferenz)
- reasoningVi: Giải thích bằng TIẾNG VIỆT (dịch reasoning)
- suggestions: Verbesserungsvorschläge auf DEUTSCH
- suggestionsVi: Gợi ý cải thiện bằng TIẾNG VIỆT

### Schritt 2: Fehlerkorrektur / Sửa lỗi
Identifiziere die wichtigsten Fehler (max 8). Für jeden Fehler:
- original: fehlerhafter Text
- corrected: Korrektur
- type: Fehlertyp auf Deutsch (Grammatik, Rechtschreibung, Wortschatz, Syntax, Interpunktion, Register)
- typeVi: Loại lỗi bằng tiếng Việt
- explanation: Erklärung auf Deutsch
- explanationVi: Giải thích bằng tiếng Việt

### Schritt 3: Gesamtbewertung / Đánh giá tổng thể
- overallFeedback: 2-3 Sätze auf Deutsch
- overallFeedbackVi: Dịch sang tiếng Việt
- estimatedLevel: CEFR-Niveau des Textes (A1/A2/B1/B2/C1/C2)

## WICHTIG / QUAN TRỌNG
- Bewerte STRENG nach dem CEFR-Niveau ${req.cefrLevel} (nicht zu großzügig!)
- Wenn der Text zu kurz ist (<${req.minWords} Wörter), ziehe Punkte bei "Inhalt" ab
- Achte besonders auf Register (du/Sie) passend zum Kontext

Antworte ausschließlich im folgenden JSON-Format (KEIN Markdown, KEINE Codeblöcke):
{
  "criteria": [
    {
      "id": "criterion_id",
      "name": "Kriteriumsname",
      "score": 0,
      "maxScore": 5,
      "reasoning": "Begründung auf Deutsch mit Textbezug",
      "reasoningVi": "Giải thích bằng tiếng Việt",
      "suggestions": ["Vorschlag 1 auf Deutsch", "Vorschlag 2"],
      "suggestionsVi": ["Gợi ý 1 bằng tiếng Việt", "Gợi ý 2"]
    }
  ],
  "overallFeedback": "Gesamtbewertung auf Deutsch",
  "overallFeedbackVi": "Đánh giá tổng thể bằng tiếng Việt",
  "estimatedLevel": "A1",
  "corrections": [
    {
      "original": "fehlerhaft",
      "corrected": "korrekt",
      "type": "Grammatik",
      "typeVi": "Ngữ pháp",
      "explanation": "Erklärung auf Deutsch",
      "explanationVi": "Giải thích bằng tiếng Việt"
    }
  ]
}`

    try {
        const result = await model.generateContent(prompt)
        const responseText = result.response.text()

        // Parse JSON response — clean up any markdown fences
        const cleaned = responseText
            .replace(/```json\s*/g, '')
            .replace(/```\s*/g, '')
            .trim()

        const parsed = JSON.parse(cleaned)

        // Calculate total score
        const totalScore = (parsed.criteria || []).reduce(
            (sum: number, c: any) => sum + (c.score || 0), 0
        )
        const maxScore = req.rubric.maxScore

        return {
            totalScore,
            maxScore,
            percentScore: maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0,
            estimatedLevel: parsed.estimatedLevel || req.cefrLevel,
            criteria: (parsed.criteria || []).map((c: any) => ({
                id: c.id || c.name,
                name: c.name,
                nameVi: CRITERION_VI[c.name] || c.nameVi || '',
                score: c.score || 0,
                maxScore: c.maxScore || 5,
                reasoning: c.reasoning || '',
                reasoningVi: c.reasoningVi || '',
                suggestions: c.suggestions || [],
                suggestionsVi: c.suggestionsVi || [],
            })),
            overallFeedback: parsed.overallFeedback || 'Bewertung abgeschlossen.',
            overallFeedbackVi: parsed.overallFeedbackVi || 'Đã hoàn thành đánh giá.',
            corrections: (parsed.corrections || []).map((c: any) => ({
                original: c.original || '',
                corrected: c.corrected || '',
                type: c.type || 'Grammatik',
                typeVi: c.typeVi || ERROR_TYPE_VI[c.type] || 'Ngữ pháp',
                explanation: c.explanation || '',
                explanationVi: c.explanationVi || '',
            })),
        }
    } catch (error) {
        console.error('[AI Grading] Error:', error)
        throw new Error('AI grading failed. Please try again.')
    }
}
