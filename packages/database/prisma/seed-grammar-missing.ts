/**
 * seed-grammar-missing.ts
 * 
 * Generates and seeds lessons for grammar topics that have 0 lessons.
 * Each topic gets 3 lessons: E (Einführung), V (Vertiefung), A (Anwendung)
 * 
 * Usage:
 *   DATABASE_URL='...' npx tsx packages/database/prisma/seed-grammar-missing.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ─── Lesson content for each missing topic ──────────────────

interface TheoryBlock {
  type: string
  [key: string]: any
}

interface Exercise {
  type: string
  [key: string]: any
}

interface LessonData {
  lessonType: string  // E, V, A
  titleDe: string
  titleVi: string
  estimatedMin: number
  tags: string[]
  theory: { blocks: TheoryBlock[] } | null
  exercises: Exercise[]
}

// ═══════════════════════════════════════════════════════════
// Helper: generate lessons for a given topic config
// ═══════════════════════════════════════════════════════════
function createLessons(topicId: string, slug: string, lessons: LessonData[]) {
  return lessons.map((l, i) => ({
    id: `${slug}-${String(i + 1).padStart(2, '0')}-${l.lessonType}`,
    topicId,
    level: 'A1' as const,
    lessonType: l.lessonType,
    lessonNumber: i + 1,
    titleDe: l.titleDe,
    titleVi: l.titleVi,
    estimatedMin: l.estimatedMin,
    tags: l.tags,
    theoryJson: l.theory,
    exercisesJson: l.exercises,
    sortOrder: i + 1,
    status: 'PUBLISHED' as const,
  }))
}

// ─── Topic: Das Alphabet und die Aussprache ─────────────────
const alphabetLessons: LessonData[] = [
  {
    lessonType: 'E',
    titleDe: 'Das deutsche Alphabet',
    titleVi: 'Bảng chữ cái tiếng Đức',
    estimatedMin: 10,
    tags: ['alphabet', 'aussprache', 'grundlagen'],
    theory: {
      blocks: [
        {
          type: 'rule',
          text_vi: 'Bảng chữ cái tiếng Đức gồm 26 chữ cái cơ bản (giống tiếng Anh) và 4 ký tự đặc biệt: Ä, Ö, Ü, ß. Danh từ trong tiếng Đức luôn viết HOA chữ cái đầu.',
          formula: '26 Buchstaben + Ä, Ö, Ü, ß',
        },
        {
          type: 'paradigm_table',
          headers: ['Ký tự', 'Phát âm', 'Ví dụ'],
          rows: [
            ['Ä/ä', '/ɛ/ (giống "e" dài)', 'Äpfel, Bär'],
            ['Ö/ö', '/ø/ (tròn môi nói "ơ")', 'schön, Köln'],
            ['Ü/ü', '/y/ (tròn môi nói "i")', 'über, Tür'],
            ['ß', '/s/ (giống "ss")', 'Straße, heißen'],
          ],
          highlight_columns: [1],
        },
        {
          type: 'examples',
          items: [
            { de: 'Ich heiße Anna.', vi: 'Tôi tên là Anna.', highlight: ['heiße'] },
            { de: 'Das ist schön.', vi: 'Cái đó đẹp.', highlight: ['schön'] },
            { de: 'Er fährt über die Straße.', vi: 'Anh ấy lái xe qua đường.', highlight: ['fährt', 'über', 'Straße'] },
          ],
        },
        {
          type: 'mnemonic',
          visual_emoji: '🔤',
          text_vi: 'Ä = tròn miệng nói "e" | Ö = tròn miệng nói "ơ" | Ü = tròn miệng nói "i" | ß = luôn là "ss"',
        },
      ],
    },
    exercises: [
      {
        type: 'multiple_choice',
        question_de: 'Welcher Buchstabe klingt wie "ss"?',
        question_vi: 'Chữ cái nào phát âm giống "ss"?',
        options: ['Ä', 'Ö', 'ß', 'Ü'],
        answer: ['ß'],
        explanation_vi: 'ß (Eszett) phát âm giống "ss". Ví dụ: Straße = Strasse.',
        tags: ['alphabet'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Wie spricht man "Ü" aus?',
        question_vi: 'Chữ "Ü" phát âm như thế nào?',
        options: ['Giống "u" tiếng Việt', 'Tròn môi nói "i"', 'Giống "o" tiếng Việt', 'Giống "a" tiếng Việt'],
        answer: ['Tròn môi nói "i"'],
        explanation_vi: 'Ü phát âm bằng cách tròn môi rồi nói âm "i".',
        tags: ['aussprache'],
      },
      {
        type: 'fill_blanks',
        instruction_de: 'Ergänze den richtigen Buchstaben.',
        instruction_vi: 'Điền chữ cái đúng.',
        sentence: 'Ich hei_e Anna.',
        blanks: [{ position: 7, answer: 'ß', options: ['ß', 'ss', 's'] }],
        explanation_vi: '"heißen" viết với ß.',
        tags: ['alphabet'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Welches Wort hat ein "Ö"?',
        question_vi: 'Từ nào có chữ "Ö"?',
        options: ['Schule', 'schön', 'Straße', 'Haus'],
        answer: ['schön'],
        explanation_vi: 'schön (đẹp) có chữ ö.',
        tags: ['alphabet'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Wie schreibt man "Strasse" richtig?',
        question_vi: 'Cách viết đúng của "Strasse" là gì?',
        options: ['Strasse', 'Straße', 'Straβe', 'Strase'],
        answer: ['Straße'],
        explanation_vi: 'Straße viết với ß (không phải ss hay β).',
        tags: ['alphabet'],
      },
    ],
  },
  {
    lessonType: 'V',
    titleDe: 'Ausspracheregeln',
    titleVi: 'Quy tắc phát âm',
    estimatedMin: 10,
    tags: ['aussprache', 'konsonanten'],
    theory: {
      blocks: [
        {
          type: 'rule',
          text_vi: 'Tiếng Đức có nhiều quy tắc phát âm khác tiếng Anh. Đặc biệt: W = /v/, V = /f/, Z = /ts/, Ch = /ç/ hoặc /x/, Sch = /ʃ/.',
          comparison_vi: 'W tiếng Anh = /w/ (what)\nW tiếng Đức = /v/ (Wasser)\nV tiếng Anh = /v/ (very)\nV tiếng Đức = /f/ (Vater)',
        },
        {
          type: 'paradigm_table',
          headers: ['Chữ', 'Phát âm', 'Ví dụ', 'So với tiếng Anh'],
          rows: [
            ['W', '/v/', 'Wasser, wir', 'W = V'],
            ['V', '/f/', 'Vater, viel', 'V = F'],
            ['Z', '/ts/', 'Zug, zehn', 'Z = TS'],
            ['Sch', '/ʃ/', 'Schule', 'Sch = SH'],
            ['Ch', '/ç/ hoặc /x/', 'ich, auch', 'Không có'],
            ['Sp-/St-', '/ʃp/, /ʃt/', 'sprechen, Stuhl', 'SP = SHP'],
          ],
          highlight_columns: [1],
        },
        {
          type: 'key_takeaway',
          text_vi: 'Mẹo nhớ: W=V, V=F, Z=TS — nghĩ NGƯỢC LẠI so với tiếng Anh!',
        },
      ],
    },
    exercises: [
      {
        type: 'multiple_choice',
        question_de: 'Wie spricht man "W" im Deutschen aus?',
        question_vi: '"W" trong tiếng Đức phát âm thế nào?',
        options: ['/w/ giống tiếng Anh', '/v/ giống "v"', '/f/ giống "f"', '/b/ giống "b"'],
        answer: ['/v/ giống "v"'],
        explanation_vi: 'W trong tiếng Đức phát âm /v/. Ví dụ: Wasser = "Vasser".',
        tags: ['aussprache'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Wie spricht man "Z" aus?',
        question_vi: '"Z" phát âm thế nào?',
        options: ['/z/ giống tiếng Anh', '/s/ giống "s"', '/ts/ giống "ts"', '/ʃ/ giống "sh"'],
        answer: ['/ts/ giống "ts"'],
        explanation_vi: 'Z trong tiếng Đức phát âm /ts/. Ví dụ: Zug = "Tsuk".',
        tags: ['aussprache'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Welches Wort beginnt mit dem Laut /ʃ/?',
        question_vi: 'Từ nào bắt đầu bằng âm /ʃ/?',
        options: ['Saft', 'Schule', 'Sonne', 'Salz'],
        answer: ['Schule'],
        explanation_vi: 'Sch phát âm /ʃ/. Schule = "Shule".',
        tags: ['aussprache'],
      },
      {
        type: 'multiple_choice',
        question_de: '"Sprechen" — wie spricht man "sp" am Anfang?',
        question_vi: '"Sprechen" — "sp" ở đầu từ phát âm thế nào?',
        options: ['/sp/', '/ʃp/', '/fp/', '/vp/'],
        answer: ['/ʃp/'],
        explanation_vi: 'Sp- ở đầu từ phát âm /ʃp/. sprechen = "shprechen".',
        tags: ['aussprache'],
      },
      {
        type: 'multiple_choice',
        question_de: '"V" in "Vater" klingt wie...',
        question_vi: '"V" trong "Vater" nghe giống...',
        options: ['/v/ giống "vẹ"', '/f/ giống "phờ"', '/b/ giống "bờ"', '/w/ giống "uờ"'],
        answer: ['/f/ giống "phờ"'],
        explanation_vi: 'V trong từ thuần Đức phát âm /f/. Vater = "Fater".',
        tags: ['aussprache'],
      },
    ],
  },
  {
    lessonType: 'A',
    titleDe: 'Alphabet und Aussprache üben',
    titleVi: 'Luyện tập bảng chữ cái và phát âm',
    estimatedMin: 8,
    tags: ['alphabet', 'aussprache', 'anwendung'],
    theory: null,
    exercises: [
      {
        type: 'multiple_choice',
        question_de: 'Wähle das Wort mit "Ä":',
        question_vi: 'Chọn từ có chữ "Ä":',
        options: ['Apfel', 'Äpfel', 'Ampel', 'Alter'],
        answer: ['Äpfel'],
        explanation_vi: 'Äpfel (những quả táo) — số nhiều của Apfel.',
        tags: ['alphabet'],
      },
      {
        type: 'multiple_choice',
        question_de: '"Tschüss" — welcher besondere Buchstabe ist hier?',
        question_vi: '"Tschüss" — có ký tự đặc biệt nào?',
        options: ['ß', 'Ö', 'Ü', 'Ä'],
        answer: ['Ü'],
        explanation_vi: 'Tschüss chứa chữ Ü.',
        tags: ['alphabet'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Wie klingt "ch" in "ich"?',
        question_vi: '"ch" trong "ich" phát âm thế nào?',
        options: ['/k/', '/ç/ (nhẹ, phía trước)', '/x/ (nặng, phía sau)', '/ʃ/'],
        answer: ['/ç/ (nhẹ, phía trước)'],
        explanation_vi: 'Sau i, e, ä, ö, ü → ch phát âm /ç/ (nhẹ). ich = "ích".',
        tags: ['aussprache'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Wie klingt "ch" in "auch"?',
        question_vi: '"ch" trong "auch" phát âm thế nào?',
        options: ['/k/', '/ç/ (nhẹ)', '/x/ (nặng, phía sau)', '/ʃ/'],
        answer: ['/x/ (nặng, phía sau)'],
        explanation_vi: 'Sau a, o, u → ch phát âm /x/ (nặng). auch = "auchh".',
        tags: ['aussprache'],
      },
      {
        type: 'sort_words',
        instruction_vi: 'Sắp xếp đúng thứ tự:',
        words: ['Guten', 'Tag,', 'wie', 'heißen', 'Sie?'],
        correct_order: ['Guten', 'Tag,', 'wie', 'heißen', 'Sie?'],
        explanation_vi: '"Guten Tag, wie heißen Sie?" = Xin chào, quý ông/bà tên gì?',
        tags: ['anwendung'],
      },
    ],
  },
]

// ─── Topic: Regelmäßige Verben im Präsens ──────────────────
const regelmaessigeLessons: LessonData[] = [
  {
    lessonType: 'E',
    titleDe: 'Verbkonjugation: Endungen',
    titleVi: 'Chia động từ: Các đuôi',
    estimatedMin: 10,
    tags: ['verben', 'konjugation', 'praesens'],
    theory: {
      blocks: [
        {
          type: 'rule',
          text_vi: 'Để chia động từ quy tắc ở thì hiện tại: bỏ đuôi -en để lấy gốc (Stamm), rồi thêm đuôi theo ngôi.',
          formula: 'Stamm + Endung: -e, -st, -t, -en, -t, -en',
          steps_vi: [
            'Lấy động từ nguyên mẫu: lernen',
            'Bỏ -en → gốc: lern-',
            'Thêm đuôi theo ngôi: ich lern-e, du lern-st...',
          ],
        },
        {
          type: 'paradigm_table',
          headers: ['Pronomen', 'Endung', 'lernen', 'wohnen', 'spielen'],
          rows: [
            ['ich', '-e', 'lerne', 'wohne', 'spiele'],
            ['du', '-st', 'lernst', 'wohnst', 'spielst'],
            ['er/sie/es', '-t', 'lernt', 'wohnt', 'spielt'],
            ['wir', '-en', 'lernen', 'wohnen', 'spielen'],
            ['ihr', '-t', 'lernt', 'wohnt', 'spielt'],
            ['sie/Sie', '-en', 'lernen', 'wohnen', 'spielen'],
          ],
          highlight_columns: [1],
        },
        {
          type: 'mnemonic',
          visual_emoji: '🎯',
          text_vi: 'e-ST-T-en-T-en → nhớ: "Essen Sie Tee? Tanzen einfach nett!"',
        },
        {
          type: 'examples',
          items: [
            { de: 'Ich lerne Deutsch.', vi: 'Tôi học tiếng Đức.', highlight: ['lerne'] },
            { de: 'Du wohnst in Berlin.', vi: 'Bạn sống ở Berlin.', highlight: ['wohnst'] },
            { de: 'Er spielt Fußball.', vi: 'Anh ấy chơi bóng đá.', highlight: ['spielt'] },
            { de: 'Wir kaufen Brot.', vi: 'Chúng tôi mua bánh mì.', highlight: ['kaufen'] },
          ],
        },
      ],
    },
    exercises: [
      {
        type: 'fill_blanks',
        instruction_vi: 'Chia động từ cho đúng.',
        sentence: 'Ich ___ Deutsch. (lernen)',
        blanks: [{ position: 0, answer: 'lerne', options: ['lerne', 'lernst', 'lernt'] }],
        explanation_vi: 'ich + lernen → ich lerne (đuôi -e)',
        tags: ['konjugation'],
      },
      {
        type: 'fill_blanks',
        instruction_vi: 'Chia động từ cho đúng.',
        sentence: 'Du ___ in Hamburg. (wohnen)',
        blanks: [{ position: 0, answer: 'wohnst', options: ['wohne', 'wohnst', 'wohnt'] }],
        explanation_vi: 'du + wohnen → du wohnst (đuôi -st)',
        tags: ['konjugation'],
      },
      {
        type: 'fill_blanks',
        instruction_vi: 'Chia động từ cho đúng.',
        sentence: 'Er ___ Gitarre. (spielen)',
        blanks: [{ position: 0, answer: 'spielt', options: ['spiele', 'spielst', 'spielt'] }],
        explanation_vi: 'er + spielen → er spielt (đuôi -t)',
        tags: ['konjugation'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Wir ___ Deutsch. (lernen)',
        question_vi: 'Chúng tôi ___ tiếng Đức.',
        options: ['lerne', 'lernst', 'lernen', 'lernt'],
        answer: ['lernen'],
        explanation_vi: 'wir + lernen → wir lernen (đuôi -en, giống nguyên mẫu)',
        tags: ['konjugation'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Ihr ___ Fußball. (spielen)',
        question_vi: 'Các bạn ___ bóng đá.',
        options: ['spiele', 'spielst', 'spielen', 'spielt'],
        answer: ['spielt'],
        explanation_vi: 'ihr + spielen → ihr spielt (đuôi -t)',
        tags: ['konjugation'],
      },
    ],
  },
  {
    lessonType: 'V',
    titleDe: 'Besonderheiten: -ten, -den',
    titleVi: 'Trường hợp đặc biệt: -ten, -den',
    estimatedMin: 8,
    tags: ['verben', 'konjugation', 'besonderheiten'],
    theory: {
      blocks: [
        {
          type: 'rule',
          text_vi: 'Khi gốc từ kết thúc bằng -t, -d (hoặc -n sau phụ âm): cần thêm -e- trước đuôi ở du, er/sie/es, và ihr để dễ phát âm hơn.',
          note_vi: 'Quy tắc này chỉ ảnh hưởng đến 3 ngôi: du, er/sie/es, ihr.',
        },
        {
          type: 'paradigm_table',
          headers: ['Pronomen', 'arbeiten', 'finden', 'öffnen'],
          rows: [
            ['ich', 'arbeite', 'finde', 'öffne'],
            ['du', 'arbeitest ⚠️', 'findest ⚠️', 'öffnest ⚠️'],
            ['er/sie/es', 'arbeitet ⚠️', 'findet ⚠️', 'öffnet ⚠️'],
            ['wir', 'arbeiten', 'finden', 'öffnen'],
            ['ihr', 'arbeitet ⚠️', 'findet ⚠️', 'öffnet ⚠️'],
            ['sie/Sie', 'arbeiten', 'finden', 'öffnen'],
          ],
          highlight_columns: [1, 2, 3],
        },
        {
          type: 'contrast',
          left_label: 'Normal (-st, -t)',
          right_label: 'Đặc biệt (-est, -et)',
          rows: [
            ['du lernst', 'du arbeitest'],
            ['er lernt', 'er arbeitet'],
            ['ihr lernt', 'ihr arbeitet'],
          ],
        },
      ],
    },
    exercises: [
      {
        type: 'fill_blanks',
        instruction_vi: 'Chia động từ cho đúng.',
        sentence: 'Du ___ zu viel. (arbeiten)',
        blanks: [{ position: 0, answer: 'arbeitest', options: ['arbeitst', 'arbeitest', 'arbeitet'] }],
        explanation_vi: 'arbeiten: gốc "arbeit-" kết thúc bằng -t → du arbeitest (thêm -e-)',
        tags: ['besonderheiten'],
      },
      {
        type: 'fill_blanks',
        instruction_vi: 'Chia động từ cho đúng.',
        sentence: 'Er ___ das Buch interessant. (finden)',
        blanks: [{ position: 0, answer: 'findet', options: ['findt', 'findest', 'findet'] }],
        explanation_vi: 'finden: gốc "find-" kết thúc bằng -d → er findet (thêm -e-)',
        tags: ['besonderheiten'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Er ___ die Tür. (öffnen)',
        question_vi: 'Anh ấy ___ cửa.',
        options: ['öffnt', 'öffnet', 'öffnest', 'öffne'],
        answer: ['öffnet'],
        explanation_vi: 'öffnen: gốc "öffn-" → thêm -e- → er öffnet',
        tags: ['besonderheiten'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Ihr ___ am Wochenende. (arbeiten)',
        question_vi: 'Các bạn ___ vào cuối tuần.',
        options: ['arbeitst', 'arbeitet', 'arbeiten', 'arbeitest'],
        answer: ['arbeitet'],
        explanation_vi: 'ihr + arbeiten → ihr arbeitet (thêm -e-)',
        tags: ['besonderheiten'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Wir ___ das gut. (finden)',
        question_vi: 'Chúng tôi ___ cái đó tốt.',
        options: ['finden', 'findet', 'findest', 'finde'],
        answer: ['finden'],
        explanation_vi: 'wir + finden → wir finden (ngôi "wir" không bị ảnh hưởng bởi quy tắc đặc biệt)',
        tags: ['konjugation'],
      },
    ],
  },
  {
    lessonType: 'A',
    titleDe: 'Verben im Alltag',
    titleVi: 'Động từ trong đời sống',
    estimatedMin: 8,
    tags: ['verben', 'alltag', 'anwendung'],
    theory: null,
    exercises: [
      {
        type: 'fill_blanks',
        instruction_vi: 'Chia động từ trong ngoặc.',
        sentence: 'Maria ___ gern Musik. (hören)',
        blanks: [{ position: 0, answer: 'hört', options: ['höre', 'hörst', 'hört'] }],
        explanation_vi: 'Maria = er/sie → hört (đuôi -t)',
        tags: ['anwendung'],
      },
      {
        type: 'fill_blanks',
        instruction_vi: 'Chia động từ trong ngoặc.',
        sentence: 'Wir ___ jeden Tag Deutsch. (lernen)',
        blanks: [{ position: 0, answer: 'lernen', options: ['lerne', 'lernen', 'lernt'] }],
        explanation_vi: 'wir lernen (đuôi -en)',
        tags: ['anwendung'],
      },
      {
        type: 'sort_words',
        instruction_vi: 'Sắp xếp đúng thứ tự:',
        words: ['lernst', 'Deutsch?', 'Du'],
        correct_order: ['Du', 'lernst', 'Deutsch?'],
        explanation_vi: 'Du lernst Deutsch? = Bạn học tiếng Đức à?',
        tags: ['anwendung'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Die Kinder ___ im Park. (spielen)',
        question_vi: 'Những đứa trẻ ___ trong công viên.',
        options: ['spielt', 'spielen', 'spielst', 'spiele'],
        answer: ['spielen'],
        explanation_vi: 'Die Kinder = sie (họ) → spielen',
        tags: ['anwendung'],
      },
      {
        type: 'fill_blanks',
        instruction_vi: 'Chia động từ trong ngoặc.',
        sentence: 'Ihr ___ sehr schnell. (arbeiten)',
        blanks: [{ position: 0, answer: 'arbeitet', options: ['arbeitest', 'arbeitet', 'arbeiten'] }],
        explanation_vi: 'arbeiten: gốc "arbeit-" → ihr arbeitet (thêm -e-)',
        tags: ['besonderheiten'],
      },
    ],
  },
]

// ─── Topic: Satzbau und Fragen ──────────────────────────────
const satzbauLessons: LessonData[] = [
  {
    lessonType: 'E',
    titleDe: 'Verb auf Position 2',
    titleVi: 'Động từ ở vị trí thứ 2',
    estimatedMin: 10,
    tags: ['satzbau', 'verbposition', 'v2'],
    theory: {
      blocks: [
        {
          type: 'rule',
          text_vi: 'Quy tắc VÀNG trong tiếng Đức: Động từ chia LUÔN ở vị trí thứ 2 trong câu trần thuật. Phần tử ở vị trí 1 có thể là chủ ngữ, trạng từ thời gian, hay tân ngữ.',
          formula: 'Position 1 — VERB (Pos. 2) — Rest',
          steps_vi: [
            'Vị trí 1: Chủ ngữ HOẶC trạng từ/tân ngữ (đổi để nhấn mạnh)',
            'Vị trí 2: LUÔN là động từ chia',
            'Phần còn lại: theo thứ tự bình thường',
          ],
        },
        {
          type: 'examples',
          items: [
            { de: 'Ich lerne Deutsch.', vi: 'Tôi học tiếng Đức.', highlight: ['lerne'], context_vi: 'Ich = Pos.1, lerne = Pos.2' },
            { de: 'Heute lerne ich Deutsch.', vi: 'Hôm nay tôi học tiếng Đức.', highlight: ['lerne'], context_vi: 'Heute = Pos.1, lerne = Pos.2 (đảo ngữ!)' },
            { de: 'Am Montag gehe ich ins Kino.', vi: 'Thứ Hai tôi đi xem phim.', highlight: ['gehe'], context_vi: 'Am Montag = Pos.1, gehe = Pos.2' },
          ],
        },
        {
          type: 'key_takeaway',
          text_vi: 'Dù bạn bắt đầu câu bằng gì, động từ chia LUÔN ở vị trí 2. Đây là quy tắc quan trọng nhất trong trật tự từ tiếng Đức!',
        },
      ],
    },
    exercises: [
      {
        type: 'sort_words',
        instruction_vi: 'Sắp xếp đúng thứ tự:',
        words: ['lerne', 'Ich', 'Deutsch.'],
        correct_order: ['Ich', 'lerne', 'Deutsch.'],
        explanation_vi: 'Ich (Pos.1) lerne (Pos.2) Deutsch.',
        tags: ['satzbau'],
      },
      {
        type: 'sort_words',
        instruction_vi: 'Sắp xếp đúng thứ tự (bắt đầu bằng "Heute"):',
        words: ['Deutsch.', 'lerne', 'Heute', 'ich'],
        correct_order: ['Heute', 'lerne', 'ich', 'Deutsch.'],
        explanation_vi: 'Heute (Pos.1) lerne (Pos.2) ich Deutsch. — Đảo ngữ!',
        tags: ['satzbau'],
      },
      {
        type: 'multiple_choice',
        question_de: '"___ wohnst du?" — Welches W-Wort passt?',
        question_vi: '"___ bạn ở?" — Từ hỏi nào phù hợp?',
        options: ['Was', 'Wo', 'Wer', 'Wann'],
        answer: ['Wo'],
        explanation_vi: 'Wo = ở đâu. Wo wohnst du? = Bạn ở đâu?',
        tags: ['w-fragen'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Wo ist das Verb? "Morgen gehe ich einkaufen."',
        question_vi: 'Động từ chia ở vị trí nào?',
        options: ['Position 1', 'Position 2', 'Position 3', 'Am Ende'],
        answer: ['Position 2'],
        explanation_vi: 'Morgen (1) gehe (2) ich einkaufen. V2 = luôn đúng!',
        tags: ['satzbau'],
      },
      {
        type: 'multiple_choice',
        question_de: '"___ heißen Sie?" (W-Frage)',
        question_vi: '"___ quý ông/bà tên gì?"',
        options: ['Wer', 'Was', 'Wie', 'Wo'],
        answer: ['Wie'],
        explanation_vi: 'Wie heißen Sie? = Quý ông/bà tên gì? (Wie = thế nào)',
        tags: ['w-fragen'],
      },
    ],
  },
  {
    lessonType: 'V',
    titleDe: 'W-Fragen und Ja/Nein-Fragen',
    titleVi: 'Câu hỏi W và câu hỏi Có/Không',
    estimatedMin: 10,
    tags: ['fragen', 'w-fragen', 'ja-nein'],
    theory: {
      blocks: [
        {
          type: 'rule',
          text_vi: 'Tiếng Đức có 2 loại câu hỏi: (1) W-Fragen: bắt đầu bằng từ hỏi W → Verb ở vị trí 2. (2) Ja/Nein-Fragen: Verb ở vị trí 1.',
          formula: 'W-Frage: W-Wort + Verb + Subjekt + ...\nJa/Nein: Verb + Subjekt + ...?',
        },
        {
          type: 'paradigm_table',
          headers: ['W-Wort', 'Nghĩa', 'Ví dụ'],
          rows: [
            ['Wer', 'Ai', 'Wer ist das?'],
            ['Was', 'Cái gì', 'Was machst du?'],
            ['Wo', 'Ở đâu', 'Wo wohnst du?'],
            ['Woher', 'Từ đâu', 'Woher kommst du?'],
            ['Wohin', 'Đi đâu', 'Wohin gehst du?'],
            ['Wann', 'Khi nào', 'Wann kommst du?'],
            ['Wie', 'Thế nào', 'Wie heißen Sie?'],
            ['Warum', 'Tại sao', 'Warum lernst du?'],
          ],
          highlight_columns: [0],
        },
        {
          type: 'contrast',
          left_label: 'W-Frage (V2)',
          right_label: 'Ja/Nein (V1)',
          rows: [
            ['Wo wohnst du?', 'Wohnst du in Berlin?'],
            ['Was machst du?', 'Lernst du Deutsch?'],
            ['Wer ist das?', 'Ist das Maria?'],
          ],
        },
      ],
    },
    exercises: [
      {
        type: 'multiple_choice',
        question_de: '"___ kommst du?" — Welches W-Wort?',
        question_vi: '"___ bạn đến?" — W-Wort nào?',
        options: ['Wo', 'Woher', 'Wohin', 'Wann'],
        answer: ['Woher'],
        explanation_vi: 'Woher = từ đâu (nguồn gốc). Woher kommst du? = Bạn đến từ đâu?',
        tags: ['w-fragen'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Ja/Nein-Frage: Verb steht auf Position...',
        question_vi: 'Câu hỏi Có/Không: Động từ ở vị trí...',
        options: ['1', '2', '3', 'Ende'],
        answer: ['1'],
        explanation_vi: 'Ja/Nein-Fragen: V1! Ví dụ: Lernst du Deutsch?',
        tags: ['ja-nein'],
      },
      {
        type: 'sort_words',
        instruction_vi: 'Tạo câu hỏi W-Frage:',
        words: ['du?', 'wohnst', 'Wo'],
        correct_order: ['Wo', 'wohnst', 'du?'],
        explanation_vi: 'Wo (W-Wort) wohnst (V2) du?',
        tags: ['w-fragen'],
      },
      {
        type: 'sort_words',
        instruction_vi: 'Tạo câu hỏi Ja/Nein:',
        words: ['Deutsch?', 'du', 'Lernst'],
        correct_order: ['Lernst', 'du', 'Deutsch?'],
        explanation_vi: 'Lernst (V1) du Deutsch? — Ja/Nein-Frage!',
        tags: ['ja-nein'],
      },
      {
        type: 'multiple_choice',
        question_de: '"___ machst du heute?" — W-Wort?',
        question_vi: '"___ bạn làm hôm nay?"',
        options: ['Wer', 'Wo', 'Was', 'Wie'],
        answer: ['Was'],
        explanation_vi: 'Was = cái gì. Was machst du? = Bạn làm gì?',
        tags: ['w-fragen'],
      },
    ],
  },
  {
    lessonType: 'A',
    titleDe: 'Satzbau in der Praxis',
    titleVi: 'Trật tự từ thực hành',
    estimatedMin: 8,
    tags: ['satzbau', 'anwendung'],
    theory: null,
    exercises: [
      {
        type: 'sort_words',
        instruction_vi: 'Sắp xếp câu đúng:',
        words: ['ins', 'Am', 'gehe', 'Kino.', 'ich', 'Samstag'],
        correct_order: ['Am', 'Samstag', 'gehe', 'ich', 'ins', 'Kino.'],
        explanation_vi: 'Am Samstag (1) gehe (2) ich ins Kino.',
        tags: ['satzbau'],
      },
      {
        type: 'sort_words',
        instruction_vi: 'Tạo câu hỏi:',
        words: ['Sie?', 'heißen', 'Wie'],
        correct_order: ['Wie', 'heißen', 'Sie?'],
        explanation_vi: 'Wie (W) heißen (V2) Sie? = Quý ông/bà tên gì?',
        tags: ['w-fragen'],
      },
      {
        type: 'multiple_choice',
        question_de: '"Heute ___ ich Deutsch." — Welches Verb?',
        question_vi: '"Hôm nay ___ tôi tiếng Đức."',
        options: ['lerne', 'lernst', 'lernen', 'lernt'],
        answer: ['lerne'],
        explanation_vi: 'Heute (1) lerne (2) ich Deutsch. ich → lerne',
        tags: ['satzbau'],
      },
      {
        type: 'multiple_choice',
        question_de: '"___ du einen Bruder?" (Ja/Nein-Frage)',
        question_vi: '"___ bạn có anh trai?"',
        options: ['Hast', 'Habe', 'Hat', 'Haben'],
        answer: ['Hast'],
        explanation_vi: 'du → hast. V1-Frage: Hast du einen Bruder?',
        tags: ['ja-nein'],
      },
      {
        type: 'sort_words',
        instruction_vi: 'Sắp xếp thành câu hỏi Ja/Nein:',
        words: ['du', 'in', 'Wohnst', 'Berlin?'],
        correct_order: ['Wohnst', 'du', 'in', 'Berlin?'],
        explanation_vi: 'Wohnst (V1) du in Berlin? = Bạn sống ở Berlin phải không?',
        tags: ['ja-nein'],
      },
    ],
  },
]

// ─── Topic: Personalpronomen, sein und haben ────────────────
// Note: This might have a different slug depending on which seed created it
const personalPronomenLessons: LessonData[] = [
  {
    lessonType: 'E',
    titleDe: 'Die Personalpronomen',
    titleVi: 'Đại từ nhân xưng',
    estimatedMin: 10,
    tags: ['pronomen', 'grundlagen'],
    theory: {
      blocks: [
        {
          type: 'rule',
          text_vi: 'Tiếng Đức có 9 đại từ nhân xưng. Đặc biệt: "sie" có 3 nghĩa (cô ấy/họ/quý ông bà), phân biệt qua viết hoa và chia động từ.',
        },
        {
          type: 'paradigm_table',
          headers: ['Deutsch', 'Tiếng Việt', 'English'],
          rows: [
            ['ich', 'tôi', 'I'],
            ['du', 'bạn (thân)', 'you (informal)'],
            ['er', 'anh ấy', 'he'],
            ['sie', 'cô ấy', 'she'],
            ['es', 'nó', 'it'],
            ['wir', 'chúng tôi', 'we'],
            ['ihr', 'các bạn', 'you (plural)'],
            ['sie', 'họ', 'they'],
            ['Sie', 'quý ông/bà', 'you (formal)'],
          ],
          highlight_columns: [0],
        },
        {
          type: 'key_takeaway',
          text_vi: 'du = thân mật (bạn bè, gia đình) | Sie = trang trọng (người lạ, cấp trên). LUÔN viết hoa Sie khi nghĩa là "quý ông/bà"!',
        },
      ],
    },
    exercises: [
      {
        type: 'multiple_choice',
        question_de: 'Welches Pronomen ist formal/höflich?',
        question_vi: 'Đại từ nào dùng khi nói lịch sự?',
        options: ['du', 'ihr', 'Sie', 'sie'],
        answer: ['Sie'],
        explanation_vi: 'Sie (viết hoa) = quý ông/bà — dùng khi nói lịch sự.',
        tags: ['pronomen'],
      },
      {
        type: 'multiple_choice',
        question_de: '"Wir" bedeutet auf Vietnamesisch:',
        question_vi: '"Wir" nghĩa là:',
        options: ['tôi', 'bạn', 'chúng tôi', 'họ'],
        answer: ['chúng tôi'],
        explanation_vi: 'wir = chúng tôi (we)',
        tags: ['pronomen'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Maria → welches Pronomen?',
        question_vi: 'Maria → đại từ nào?',
        options: ['er', 'sie', 'es', 'wir'],
        answer: ['sie'],
        explanation_vi: 'Maria là nữ → sie (cô ấy)',
        tags: ['pronomen'],
      },
      {
        type: 'multiple_choice',
        question_de: '"ihr" ist Plural von...',
        question_vi: '"ihr" là dạng số nhiều của...',
        options: ['ich', 'du', 'er', 'wir'],
        answer: ['du'],
        explanation_vi: 'ihr = các bạn (nhiều người "du")',
        tags: ['pronomen'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Das Kind → welches Pronomen?',
        question_vi: 'Das Kind (đứa trẻ) → đại từ nào?',
        options: ['er', 'sie', 'es', 'wir'],
        answer: ['es'],
        explanation_vi: 'das Kind = trung tính → es',
        tags: ['pronomen'],
      },
    ],
  },
  {
    lessonType: 'V',
    titleDe: 'sein und haben konjugieren',
    titleVi: 'Chia sein và haben',
    estimatedMin: 10,
    tags: ['sein', 'haben', 'konjugation'],
    theory: {
      blocks: [
        {
          type: 'paradigm_table',
          headers: ['Pronomen', 'sein (to be)', 'haben (to have)'],
          rows: [
            ['ich', 'bin', 'habe'],
            ['du', 'bist', 'hast'],
            ['er/sie/es', 'ist', 'hat'],
            ['wir', 'sind', 'haben'],
            ['ihr', 'seid', 'habt'],
            ['sie/Sie', 'sind', 'haben'],
          ],
          highlight_columns: [1, 2],
        },
        {
          type: 'contrast',
          left_label: 'sein (trạng thái)',
          right_label: 'haben (sở hữu)',
          rows: [
            ['Ich bin Student.', 'Ich habe ein Buch.'],
            ['Er ist müde.', 'Er hat Hunger.'],
            ['Wir sind Freunde.', 'Wir haben Zeit.'],
          ],
        },
        {
          type: 'mnemonic',
          visual_emoji: '🧠',
          text_vi: 'sein: Bist du es? Wir SIND! | haben: du HASt, er HAT — chữ "s" và "t" thay đổi!',
        },
      ],
    },
    exercises: [
      {
        type: 'fill_blanks',
        instruction_vi: 'Chia sein cho đúng.',
        sentence: 'Ich ___ Student. (sein)',
        blanks: [{ position: 0, answer: 'bin', options: ['bin', 'bist', 'ist'] }],
        explanation_vi: 'ich bin — bất quy tắc!',
        tags: ['sein'],
      },
      {
        type: 'fill_blanks',
        instruction_vi: 'Chia haben cho đúng.',
        sentence: 'Du ___ ein Auto. (haben)',
        blanks: [{ position: 0, answer: 'hast', options: ['habe', 'hast', 'hat'] }],
        explanation_vi: 'du hast — bất quy tắc (b → st)!',
        tags: ['haben'],
      },
      {
        type: 'fill_blanks',
        instruction_vi: 'Chia sein cho đúng.',
        sentence: 'Wir ___ Freunde. (sein)',
        blanks: [{ position: 0, answer: 'sind', options: ['sind', 'seid', 'ist'] }],
        explanation_vi: 'wir sind',
        tags: ['sein'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Er ___ Hunger. (haben)',
        question_vi: 'Anh ấy ___ đói.',
        options: ['habe', 'hast', 'hat', 'haben'],
        answer: ['hat'],
        explanation_vi: 'er hat (bất quy tắc)',
        tags: ['haben'],
      },
      {
        type: 'multiple_choice',
        question_de: '___ ihr Studenten? (sein)',
        question_vi: '___ các bạn là sinh viên?',
        options: ['Sind', 'Seid', 'Bist', 'Ist'],
        answer: ['Seid'],
        explanation_vi: 'ihr seid — dạng chia riêng cho ihr.',
        tags: ['sein'],
      },
    ],
  },
  {
    lessonType: 'A',
    titleDe: 'Pronomen, sein & haben anwenden',
    titleVi: 'Ứng dụng đại từ, sein & haben',
    estimatedMin: 8,
    tags: ['pronomen', 'sein', 'haben', 'anwendung'],
    theory: null,
    exercises: [
      {
        type: 'fill_blanks',
        instruction_vi: 'Điền sein hoặc haben.',
        sentence: 'Maria ___ 25 Jahre alt. (sein)',
        blanks: [{ position: 0, answer: 'ist', options: ['ist', 'hat', 'bist'] }],
        explanation_vi: 'Maria = sie → sie ist. (Tuổi dùng sein trong tiếng Đức!)',
        tags: ['sein'],
      },
      {
        type: 'fill_blanks',
        instruction_vi: 'Điền sein hoặc haben.',
        sentence: '___ Sie Kinder? (haben)',
        blanks: [{ position: 0, answer: 'Haben', options: ['Haben', 'Sind', 'Habt'] }],
        explanation_vi: 'Sie (formal) → Haben Sie Kinder?',
        tags: ['haben'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Die Kinder ___ müde.',
        question_vi: 'Những đứa trẻ ___ mệt.',
        options: ['ist', 'sind', 'seid', 'bin'],
        answer: ['sind'],
        explanation_vi: 'Die Kinder = sie (họ) → sie sind',
        tags: ['sein'],
      },
      {
        type: 'sort_words',
        instruction_vi: 'Sắp xếp câu đúng:',
        words: ['Studentin.', 'bin', 'Ich'],
        correct_order: ['Ich', 'bin', 'Studentin.'],
        explanation_vi: 'Ich bin Studentin. = Tôi là sinh viên (nữ).',
        tags: ['sein'],
      },
      {
        type: 'multiple_choice',
        question_de: 'Peter und ich ___ Freunde.',
        question_vi: 'Peter và tôi ___ bạn bè.',
        options: ['bin', 'bist', 'ist', 'sind'],
        answer: ['sind'],
        explanation_vi: 'Peter und ich = wir → wir sind',
        tags: ['sein'],
      },
    ],
  },
]

// ═══════════════════════════════════════════════════════════
// MAIN: Find topics with 0 lessons and seed them
// ═══════════════════════════════════════════════════════════
async function main() {
  console.log('🔧 Grammar Missing Content Seeder\n')

  // Find all A1 grammar topics with 0 lessons
  const topics = await prisma.grammarTopic.findMany({
    where: { cefrLevel: 'A1' },
    include: { _count: { select: { lessons: true } } },
    orderBy: { sortOrder: 'asc' },
  })

  const emptyTopics = topics.filter(t => t._count.lessons === 0)

  if (emptyTopics.length === 0) {
    console.log('✅ All A1 grammar topics already have lessons!')
    await prisma.$disconnect()
    return
  }

  console.log(`Found ${emptyTopics.length} topics with 0 lessons:\n`)
  emptyTopics.forEach(t => console.log(`  ⚠️  ${t.slug} — "${t.title}"`))
  console.log()

  // Map slug patterns to lesson content
  const contentMap: Record<string, LessonData[]> = {}

  for (const topic of emptyTopics) {
    const slugLower = topic.slug.toLowerCase()

    if (slugLower.includes('alphabet') || slugLower.includes('aussprache')) {
      contentMap[topic.id] = alphabetLessons
    } else if (slugLower.includes('regelmaessig') || slugLower.includes('regelmäßig') || (slugLower.includes('verben') && slugLower.includes('praesens'))) {
      contentMap[topic.id] = regelmaessigeLessons
    } else if (slugLower.includes('satzbau') || slugLower.includes('fragen')) {
      contentMap[topic.id] = satzbauLessons
    } else if (slugLower.includes('personalpronomen') || slugLower.includes('sein')) {
      contentMap[topic.id] = personalPronomenLessons
    } else {
      console.log(`  ⏭️  No content template for: ${topic.slug}`)
    }
  }

  let totalLessons = 0

  for (const topic of emptyTopics) {
    const lessons = contentMap[topic.id]
    if (!lessons) continue

    const lessonRecords = createLessons(topic.id, topic.slug, lessons)

    for (const record of lessonRecords) {
      await prisma.grammarLesson.upsert({
        where: { id: record.id },
        update: {
          topicId: record.topicId,
          level: record.level,
          lessonType: record.lessonType,
          lessonNumber: record.lessonNumber,
          titleDe: record.titleDe,
          titleVi: record.titleVi,
          estimatedMin: record.estimatedMin,
          tags: record.tags,
          theoryJson: record.theoryJson ?? undefined,
          exercisesJson: record.exercisesJson,
          sortOrder: record.sortOrder,
          status: record.status,
        },
        create: record,
      })
      totalLessons++
    }

    console.log(`  ✅ ${topic.slug}: 3 lessons seeded (E + V + A)`)
  }

  console.log(`\n🎉 Done! Seeded ${totalLessons} lessons for ${Object.keys(contentMap).length} topics.`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error('❌ Seed failed:', e)
  prisma.$disconnect()
  process.exit(1)
})
