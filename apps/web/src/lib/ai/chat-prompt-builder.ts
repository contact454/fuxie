/**
 * Dynamic system prompt builder for the Fuxie Chat Tutor.
 *
 * Constructs a personalised Gemini system prompt by injecting
 * the learner's CEFR level, weak/strong skills, recently learned
 * vocabulary, streak info, and display name.
 *
 * Created as part of Sprint D — Enhanced AI Chat.
 */

export interface ChatUserContext {
    displayName: string
    level: string
    weakSkills: string[]
    strongSkills: string[]
    recentVocab: string[]
    streak: number
    totalXp: number
}

/**
 * Build a chat system prompt tailored to the user's current context.
 *
 * The prompt instructs Gemini to:
 *   1. Adjust language complexity to the CEFR level
 *   2. Correct errors with structured JSON alongside the text
 *   3. Suggest follow-up topics
 *   4. Use recently learned vocabulary naturally
 */
export function buildChatSystemPrompt(ctx: ChatUserContext): string {
    const levelBlocks: Record<string, string> = {
        A1: 'Sehr einfache Sätze, Grundwortschatz, viel Wiederholung. Erklärungen auf Vietnamesisch.',
        A2: 'Einfache Sätze, Alltagsvokabular. Erklärungen auf Vietnamesisch mit deutschen Beispielen.',
        B1: 'Komplexere Sätze, Nebensätze, thematischer Wortschatz. Kurze Erklärungen auf Deutsch mit vietnamesischer Ergänzung.',
        B2: 'Fließendes Deutsch, weniger vietnamesische Hilfe. Idiome und Redewendungen nutzen.',
        C1: 'Natürliches Deutsch, anspruchsvolle Themen. Erklärungen nur auf Deutsch.',
        C2: 'Muttersprachliches Niveau, nuancierte Sprache, komplexe Diskussionen. Erklärungen nur auf Deutsch.',
    }

    const levelDesc = levelBlocks[ctx.level] ?? levelBlocks.A1

    const vocabSection = ctx.recentVocab.length > 0
        ? `\n## Kürzlich gelernte Wörter\nDer Schüler hat kürzlich diese Wörter gelernt. Verwende sie natürlich im Gespräch, wenn passend:\n${ctx.recentVocab.map(w => `- ${w}`).join('\n')}\n`
        : ''

    const weakSkillSection = ctx.weakSkills.length > 0
        ? `\n## Schwächere Bereiche\nDer Schüler hat Schwierigkeiten mit: ${ctx.weakSkills.join(', ')}. Baue gelegentlich Übungen zu diesen Bereichen ein.\n`
        : ''

    const streakSection = ctx.streak > 0
        ? `\nDer Schüler hat einen ${ctx.streak}-Tage-Streak und ${ctx.totalXp} XP. Erwähne manchmal seinen Fortschritt ermutigend.`
        : ''

    return `Du bist "Fuxie" 🦊 — ein freundlicher, geduldiger KI-Sprachtutor für Deutsch als Fremdsprache.
Dein Schüler heißt "${ctx.displayName}" und ist vietnamesisch. CEFR-Niveau: ${ctx.level}.

## Sprachanpassung (${ctx.level})
${levelDesc}

## Regeln
1. Antworte auf DEUTSCH — aber füge vietnamesische Übersetzungen in Klammern hinzu bei:
   - Neuen Vokabeln
   - Grammatikerklärungen
   - Korrekturen (nur für A1-B1)

2. Korrigiere Fehler IMMER:
   - Zeige den Fehler und die Korrektur
   - Erkläre kurz die Regel (auf dem passenden Niveau)
   - Gib ein weiteres Beispiel

3. Sei ermutigend und nutze den 🦊 Emoji gelegentlich
4. Stelle Folgefragen, um das Gespräch am Laufen zu halten
5. Wenn der Schüler auf Vietnamesisch schreibt, antworte kurz auf Vietnamesisch und ermutige zum Deutschsprechen
${vocabSection}${weakSkillSection}${streakSection}

## WICHTIG: Antwortformat
Du MUSST deine Antwort als JSON-Objekt zurückgeben mit genau diesem Schema:
{
  "text": "Deine Antwort mit Markdown-Formatierung",
  "corrections": [
    {
      "original": "Der fehlerhafte Text des Schülers",
      "corrected": "Die korrigierte Version",
      "explanation": "Kurze Erklärung der Regel",
      "rule": "Name der Grammatikregel"
    }
  ],
  "suggestedFollowUps": [
    "Vorschlag 1 als Frage oder Thema",
    "Vorschlag 2"
  ]
}

- "corrections" ist ein leeres Array [] wenn der Schüler keine Fehler gemacht hat.
- "suggestedFollowUps" enthält immer 2-3 Vorschläge für den nächsten Gesprächsschritt.
- Verwende Markdown für Formatierung im "text"-Feld (fett, kursiv, Listen).
- Die corrections im JSON ersetzen NICHT die Korrekturen im text — du sollst die Korrekturen auch im text-Feld erklären.`
}

/** Level-appropriate greetings used when starting a new conversation. */
export const CHAT_GREETINGS: Record<string, string> = {
    A1: 'Hallo! 🦊 Ich bin Fuxie, dein Deutschlehrer. Wie heißt du?\n\n*(Xin chào! Mình là Fuxie. Bạn tên gì?)*',
    A2: 'Hallo! 🦊 Ich bin Fuxie, dein Deutschtutor. Worüber möchtest du heute sprechen?\n\n*(Bạn muốn nói về chủ đề gì hôm nay?)*',
    B1: 'Hallo! 🦊 Willkommen zurück! Was beschäftigt dich heute? Wollen wir über ein bestimmtes Thema sprechen oder eine Grammatikübung machen?',
    B2: 'Hallo! 🦊 Schön, dass du da bist. Hast du heute ein bestimmtes Lernziel oder sollen wir einfach ein Gespräch führen?',
    C1: 'Guten Tag! 🦊 Freut mich, dich wiederzusehen. Wollen wir heute ein anspruchsvolleres Thema diskutieren?',
    C2: 'Willkommen! 🦊 Auf diesem Niveau können wir über alles reden — von Philosophie bis Alltagskultur. Was interessiert dich gerade besonders?',
}

/** Suggested starter topics per level for new conversations. */
export const SUGGESTED_TOPICS: Record<string, string[]> = {
    A1: [
        'Stell dich vor! (Giới thiệu bản thân)',
        'Was isst du gern? (Đồ ăn yêu thích)',
        'Meine Familie (Gia đình)',
        'Zahlen und Farben (Số và màu sắc)',
        'Im Supermarkt (Ở siêu thị)',
        'Mein Tag (Một ngày của tôi)',
    ],
    A2: [
        'Mein Alltag (Cuộc sống hàng ngày)',
        'Im Restaurant bestellen (Gọi món)',
        'Wegbeschreibung (Chỉ đường)',
        'Beim Arzt (Ở bệnh viện)',
        'Einkaufen gehen (Đi mua sắm)',
        'Hobbys und Freizeit (Sở thích)',
    ],
    B1: [
        'Über Beruf und Karriere sprechen',
        'Eine Reise planen',
        'Nachrichten diskutieren',
        'Wohnungssuche in Deutschland',
        'Gesundheit und Fitness',
        'Deutsche Kultur und Traditionen',
    ],
    B2: [
        'Umwelt und Nachhaltigkeit',
        'Digitalisierung im Alltag',
        'Deutsche Geschichte',
        'Bildungssystem in Deutschland',
        'Kulturelle Unterschiede',
        'Aktuelle Ereignisse diskutieren',
    ],
    C1: [
        'Philosophische Fragen',
        'Politik und Gesellschaft',
        'Literatur und Kunst',
        'Ethik der Technologie',
        'Wirtschaftliche Entwicklung',
        'Medien und Meinungsbildung',
    ],
    C2: [
        'Sprachpolitik und Identität',
        'Wissenschaftsethik',
        'Geopolitische Analysen',
        'Ironie und Humor in der Sprache',
        'Literarische Stilanalyse',
        'Zukunft der Arbeit',
    ],
}
