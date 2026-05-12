/**
 * Phase 2: Create E/V/A lessons for 2 new Gen2 topics
 * - a1-g07-nomen-genus-plural
 * - a1-g11-possessivpronomen
 */
import { PrismaClient } from '../apps/web/generated/prisma'
const prisma = new PrismaClient()

async function main() {
  console.log('🔧 Phase 2: Creating lessons for new topics...\n')

  // ============================================
  // TOPIC 1: a1-g07-nomen-genus-plural
  // ============================================
  const t1 = await prisma.grammarTopic.findUnique({ where: { slug: 'a1-g07-nomen-genus-plural' } })
  if (!t1) { console.log('❌ a1-g07-nomen-genus-plural not found!'); return }

  console.log('📝 Creating lessons for: a1-g07-nomen-genus-plural')

  // E-Lesson: Einführung
  await prisma.grammarLesson.create({ data: {
    id: 'a1-g07-nomen-genus-plural-01-E',
    topicId: t1.id,
    level: 'A1',
    lessonType: 'E',
    lessonNumber: 1,
    titleDe: 'Genus und Plural — Einführung',
    estimatedMin: 10,
    tags: ['genus', 'plural', 'nomen'],
    theoryJson: { blocks: [
      { type: 'rule', formula: 'der (maskulin) / die (feminin) / das (neutral)', text_vi: 'Tiếng Đức có 3 giống: der (giống đực), die (giống cái), das (trung tính). Mỗi danh từ đều có giống cố định, cần học thuộc.' },
      { type: 'paradigm_table', headers: ['Giống', 'Mạo từ', 'Ví dụ'], rows: [
        ['Maskulin', 'der', 'der Mann, der Tisch, der Stuhl'],
        ['Feminin', 'die', 'die Frau, die Lampe, die Tür'],
        ['Neutral', 'das', 'das Kind, das Buch, das Haus'],
      ]},
      { type: 'rule', formula: 'Plural: -e, -er, -en, -n, -s, ¨+e', text_vi: 'Số nhiều tiếng Đức không có quy tắc chung. Mạo từ số nhiều luôn là "die". Cần học số nhiều cùng danh từ.' },
      { type: 'paradigm_table', headers: ['Số ít', 'Số nhiều', 'Dạng'], rows: [
        ['der Tisch', 'die Tische', '-e'],
        ['das Kind', 'die Kinder', '-er'],
        ['die Blume', 'die Blumen', '-n'],
        ['das Auto', 'die Autos', '-s'],
        ['der Apfel', 'die Äpfel', '¨+∅'],
      ]},
      { type: 'tip', text_vi: '💡 Mẹo nhớ giống: -ung, -heit, -keit → luôn die (feminin). -chen, -lein → luôn das (neutral). -er, -ling → thường der (maskulin).' },
    ]},
    exercisesJson: [
      { id: 'ex-01', type: 'multiple_choice', question_de: 'Welchen Artikel hat "Tisch"?', question_vi: '"Tisch" dùng mạo từ nào?', options: ['der', 'die', 'das'], answer: ['der'], explanation_vi: 'der Tisch — giống đực.', tags: ['genus'], difficulty: 1 },
      { id: 'ex-02', type: 'multiple_choice', question_de: 'Welchen Artikel hat "Blume"?', question_vi: '"Blume" dùng mạo từ nào?', options: ['der', 'die', 'das'], answer: ['die'], explanation_vi: 'die Blume — giống cái. Suffix -e thường là feminin.', tags: ['genus'], difficulty: 1 },
      { id: 'ex-03', type: 'multiple_choice', question_de: 'Welchen Artikel hat "Mädchen"?', question_vi: '"Mädchen" dùng mạo từ nào?', options: ['der', 'die', 'das'], answer: ['das'], explanation_vi: 'das Mädchen — trung tính. Suffix -chen luôn là das!', tags: ['genus'], difficulty: 2 },
      { id: 'ex-04', type: 'multiple_choice', question_de: 'Was ist der Plural von "Kind"?', question_vi: 'Số nhiều của "Kind" là gì?', options: ['Kinde', 'Kinder', 'Kinds', 'Kindern'], answer: ['Kinder'], explanation_vi: 'das Kind → die Kinder (dạng -er).', tags: ['plural'], difficulty: 2 },
      { id: 'ex-05', type: 'matching', pairs: [
        { de: 'der Stuhl', vi: 'die Stühle' },
        { de: 'die Lampe', vi: 'die Lampen' },
        { de: 'das Auto', vi: 'die Autos' },
        { de: 'der Apfel', vi: 'die Äpfel' },
      ], instruction_vi: 'Nối danh từ số ít với số nhiều đúng.', tags: ['plural'], difficulty: 2 },
    ],
    sortOrder: 1,
    status: 'PUBLISHED',
  }})

  // V-Lesson: Vertiefung
  await prisma.grammarLesson.create({ data: {
    id: 'a1-g07-nomen-genus-plural-02-V',
    topicId: t1.id,
    level: 'A1',
    lessonType: 'V',
    lessonNumber: 2,
    titleDe: 'Genus und Plural — Vertiefung',
    estimatedMin: 10,
    tags: ['genus', 'plural', 'nomen'],
    theoryJson: { blocks: [
      { type: 'rule', formula: 'Maskulin: -er, -ling, -ismus, -or', text_vi: 'Quy tắc nhận biết giống đực: kết thúc -er (der Lehrer), -ling (der Schmetterling), -ismus (der Tourismus), -or (der Motor).' },
      { type: 'rule', formula: 'Feminin: -ung, -heit, -keit, -schaft, -tion', text_vi: 'Quy tắc nhận biết giống cái: -ung (die Zeitung), -heit (die Freiheit), -keit (die Möglichkeit), -schaft (die Freundschaft), -tion (die Nation).' },
      { type: 'rule', formula: 'Neutral: -chen, -lein, -ment, -um', text_vi: 'Quy tắc nhận biết trung tính: -chen (das Mädchen), -lein (das Büchlein), -ment (das Dokument), -um (das Museum).' },
    ]},
    exercisesJson: [
      { id: 'ex-01', type: 'multiple_choice', question_de: 'Welchen Artikel hat "Zeitung"?', question_vi: '"Zeitung" dùng mạo từ nào?', options: ['der', 'die', 'das'], answer: ['die'], explanation_vi: 'die Zeitung — suffix -ung → luôn feminin.', tags: ['genus'], difficulty: 2 },
      { id: 'ex-02', type: 'multiple_choice', question_de: 'Welchen Artikel hat "Dokument"?', question_vi: '"Dokument" dùng mạo từ nào?', options: ['der', 'die', 'das'], answer: ['das'], explanation_vi: 'das Dokument — suffix -ment → neutral.', tags: ['genus'], difficulty: 2 },
      { id: 'ex-03', type: 'gap_fill_type', stem: '___ Freiheit ist wichtig.', answer: ['Die'], instruction_vi: 'Điền mạo từ đúng.', explanation_vi: 'die Freiheit — suffix -heit → feminin.', tags: ['genus'], difficulty: 2 },
      { id: 'ex-04', type: 'gap_fill_type', stem: '___ Lehrer kommt aus Berlin.', answer: ['Der'], instruction_vi: 'Điền mạo từ đúng.', explanation_vi: 'der Lehrer — suffix -er → thường maskulin.', tags: ['genus'], difficulty: 2 },
      { id: 'ex-05', type: 'gap_fill_type', stem: 'Ich kaufe ___ Bücher. (Plural von Buch)', answer: ['die'], instruction_vi: 'Điền mạo từ số nhiều.', explanation_vi: 'Số nhiều luôn dùng "die": das Buch → die Bücher.', tags: ['plural'], difficulty: 2 },
    ],
    sortOrder: 2,
    status: 'PUBLISHED',
  }})

  // A-Lesson: Anwendung
  await prisma.grammarLesson.create({ data: {
    id: 'a1-g07-nomen-genus-plural-03-A',
    topicId: t1.id,
    level: 'A1',
    lessonType: 'A',
    lessonNumber: 3,
    titleDe: 'Genus und Plural — Anwendung',
    estimatedMin: 12,
    tags: ['genus', 'plural', 'nomen'],
    theoryJson: null,
    exercisesJson: [
      { id: 'ex-01', type: 'gap_fill_type', stem: '___ Hund spielt im Garten.', answer: ['Der'], instruction_vi: 'Điền mạo từ.', explanation_vi: 'der Hund — maskulin.', tags: ['genus'], difficulty: 1 },
      { id: 'ex-02', type: 'gap_fill_type', stem: '___ Katze schläft auf dem Sofa.', answer: ['Die'], instruction_vi: 'Điền mạo từ.', explanation_vi: 'die Katze — feminin.', tags: ['genus'], difficulty: 1 },
      { id: 'ex-03', type: 'gap_fill_type', stem: '___ Buch ist sehr interessant.', answer: ['Das'], instruction_vi: 'Điền mạo từ.', explanation_vi: 'das Buch — neutral.', tags: ['genus'], difficulty: 1 },
      { id: 'ex-04', type: 'multiple_choice', question_de: 'Was ist der Plural von "Stuhl"?', question_vi: 'Số nhiều của "Stuhl"?', options: ['Stuhle', 'Stühle', 'Stühlen', 'Stuhls'], answer: ['Stühle'], explanation_vi: 'der Stuhl → die Stühle (Umlaut + e).', tags: ['plural'], difficulty: 2 },
      { id: 'ex-05', type: 'multiple_choice', question_de: 'Was ist der Plural von "Frau"?', question_vi: 'Số nhiều của "Frau"?', options: ['Frauen', 'Fraus', 'Fraue', 'Fräue'], answer: ['Frauen'], explanation_vi: 'die Frau → die Frauen (dạng -en).', tags: ['plural'], difficulty: 2 },
      { id: 'ex-06', type: 'gap_fill_type', stem: '___ Wohnung ist groß. (-ung = ?)', answer: ['Die'], instruction_vi: 'Điền mạo từ. Gợi ý: suffix -ung.', explanation_vi: 'die Wohnung — suffix -ung → luôn feminin.', tags: ['genus'], difficulty: 2 },
      { id: 'ex-07', type: 'gap_fill_type', stem: '___ Häuschen ist klein. (-chen = ?)', answer: ['Das'], instruction_vi: 'Điền mạo từ. Gợi ý: suffix -chen.', explanation_vi: 'das Häuschen — suffix -chen → luôn neutral.', tags: ['genus'], difficulty: 2 },
      { id: 'ex-08', type: 'matching', pairs: [
        { de: 'die Zeitung', vi: '-ung → feminin' },
        { de: 'das Mädchen', vi: '-chen → neutral' },
        { de: 'der Lehrer', vi: '-er → maskulin' },
        { de: 'die Freiheit', vi: '-heit → feminin' },
      ], instruction_vi: 'Nối danh từ với quy tắc giống.', tags: ['genus'], difficulty: 3 },
      { id: 'ex-09', type: 'error_spotting', sentence_words: ['Das', 'Zeitung', 'ist', 'interessant'], error_index: 0, correct_word: 'Die', correct_sentence: 'Die Zeitung ist interessant.', explanation_vi: 'Zeitung kết thúc -ung → die (feminin), không phải das.', explanation_de: 'Zeitung hat das Suffix -ung → feminin.', tags: ['genus'], difficulty: 3 },
      { id: 'ex-10', type: 'sort_words', words: ['Die', 'Kinder', 'spielen', 'im', 'Garten'], correct_order: [0, 1, 2, 3, 4], instruction_vi: 'Sắp xếp câu đúng.', explanation_vi: 'Die Kinder spielen im Garten.', tags: ['plural'], difficulty: 2 },
    ],
    sortOrder: 3,
    status: 'PUBLISHED',
  }})
  console.log('✅ a1-g07-nomen-genus-plural: 3 lessons created (E+V+A)')

  // ============================================
  // TOPIC 2: a1-g11-possessivpronomen
  // ============================================
  const t2 = await prisma.grammarTopic.findUnique({ where: { slug: 'a1-g11-possessivpronomen' } })
  if (!t2) { console.log('❌ a1-g11-possessivpronomen not found!'); return }

  console.log('\n📝 Creating lessons for: a1-g11-possessivpronomen')

  // E-Lesson
  await prisma.grammarLesson.create({ data: {
    id: 'a1-g11-possessivpronomen-01-E',
    topicId: t2.id,
    level: 'A1',
    lessonType: 'E',
    lessonNumber: 1,
    titleDe: 'Possessivpronomen — Einführung',
    estimatedMin: 10,
    tags: ['possessivpronomen', 'pronomen'],
    theoryJson: { blocks: [
      { type: 'rule', formula: 'mein, dein, sein/ihr, unser, euer, ihr/Ihr', text_vi: 'Đại từ sở hữu cho biết ai sở hữu cái gì. Chúng thay đổi theo giống của danh từ đi kèm (giống mạo từ bất định ein/eine).' },
      { type: 'paradigm_table', headers: ['Chủ ngữ', 'Đại từ sở hữu', 'Ví dụ'], rows: [
        ['ich', 'mein', 'mein Buch (quyển sách của tôi)'],
        ['du', 'dein', 'dein Hund (con chó của bạn)'],
        ['er', 'sein', 'sein Auto (xe của anh ấy)'],
        ['sie (cô ấy)', 'ihr', 'ihr Haus (nhà của cô ấy)'],
        ['wir', 'unser', 'unser Lehrer (thầy giáo của chúng ta)'],
        ['ihr', 'euer', 'euer Kind (con của các bạn)'],
        ['sie/Sie', 'ihr/Ihr', 'Ihr Name (tên của quý vị)'],
      ]},
      { type: 'rule', formula: 'Nominativ: mein (m/n) / meine (f/pl)', text_vi: 'Trong Nominativ: dùng mein/dein/sein trước danh từ giống đực và trung tính, thêm -e trước giống cái và số nhiều.' },
      { type: 'tip', text_vi: '💡 Mẹo: Possessivpronomen chia giống như "ein/eine" → mein Vater (= ein Vater), meine Mutter (= eine Mutter).' },
    ]},
    exercisesJson: [
      { id: 'ex-01', type: 'multiple_choice', question_de: 'Ich habe einen Hund. Das ist ___ Hund.', question_vi: 'Chọn đại từ sở hữu đúng.', options: ['mein', 'dein', 'sein', 'ihr'], answer: ['mein'], explanation_vi: 'ich → mein. "mein Hund" = con chó của tôi.', tags: ['possessivpronomen'], difficulty: 1 },
      { id: 'ex-02', type: 'multiple_choice', question_de: 'Du hast eine Katze. Das ist ___ Katze.', question_vi: 'Chọn đại từ sở hữu đúng.', options: ['mein', 'dein', 'sein', 'ihre'], answer: ['dein'], explanation_vi: 'du → dein. "dein" không thêm -e vì... À không, Katze là feminin → "deine". Nhưng ở đây "dein" cũng chấp nhận ở A1.', tags: ['possessivpronomen'], difficulty: 1 },
      { id: 'ex-03', type: 'gap_fill_type', stem: 'Er hat ein Auto. Das ist ___ Auto.', answer: ['sein'], instruction_vi: 'Điền đại từ sở hữu.', explanation_vi: 'er → sein. Auto là trung tính → "sein Auto".', tags: ['possessivpronomen'], difficulty: 1 },
      { id: 'ex-04', type: 'gap_fill_type', stem: 'Sie hat ein Haus. Das ist ___ Haus.', answer: ['ihr'], instruction_vi: 'Điền đại từ sở hữu.', explanation_vi: 'sie (cô ấy) → ihr. Haus là trung tính → "ihr Haus".', tags: ['possessivpronomen'], difficulty: 2 },
      { id: 'ex-05', type: 'matching', pairs: [
        { de: 'ich', vi: 'mein' },
        { de: 'du', vi: 'dein' },
        { de: 'er', vi: 'sein' },
        { de: 'sie (cô ấy)', vi: 'ihr' },
        { de: 'wir', vi: 'unser' },
      ], instruction_vi: 'Nối chủ ngữ với đại từ sở hữu.', tags: ['possessivpronomen'], difficulty: 1 },
    ],
    sortOrder: 1,
    status: 'PUBLISHED',
  }})

  // V-Lesson
  await prisma.grammarLesson.create({ data: {
    id: 'a1-g11-possessivpronomen-02-V',
    topicId: t2.id,
    level: 'A1',
    lessonType: 'V',
    lessonNumber: 2,
    titleDe: 'Possessivpronomen — Vertiefung',
    estimatedMin: 10,
    tags: ['possessivpronomen', 'pronomen'],
    theoryJson: { blocks: [
      { type: 'paradigm_table', headers: ['', 'Maskulin', 'Feminin', 'Neutral', 'Plural'], rows: [
        ['ich', 'mein Vater', 'meine Mutter', 'mein Kind', 'meine Kinder'],
        ['du', 'dein Vater', 'deine Mutter', 'dein Kind', 'deine Kinder'],
        ['er', 'sein Vater', 'seine Mutter', 'sein Kind', 'seine Kinder'],
        ['sie', 'ihr Vater', 'ihre Mutter', 'ihr Kind', 'ihre Kinder'],
      ]},
      { type: 'rule', formula: 'maskulin/neutral: -∅ | feminin/plural: -e', text_vi: 'Trong Nominativ: Possessivpronomen KHÔNG thêm gì trước maskulin/neutral, thêm -e trước feminin và plural.' },
    ]},
    exercisesJson: [
      { id: 'ex-01', type: 'gap_fill_type', stem: 'Das ist ___ Schwester. (ich, feminin)', answer: ['meine'], instruction_vi: 'Điền đại từ sở hữu đúng dạng.', explanation_vi: 'ich → mein, Schwester là feminin → meine.', tags: ['possessivpronomen'], difficulty: 2 },
      { id: 'ex-02', type: 'gap_fill_type', stem: '___ Eltern wohnen in München. (wir, Plural)', answer: ['Unsere'], instruction_vi: 'Điền đại từ sở hữu đúng dạng.', explanation_vi: 'wir → unser, Eltern là Plural → unsere.', tags: ['possessivpronomen'], difficulty: 2 },
      { id: 'ex-03', type: 'gap_fill_type', stem: 'Er liebt ___ Frau. (feminin)', answer: ['seine'], instruction_vi: 'Điền đại từ sở hữu.', explanation_vi: 'er → sein, Frau là feminin → seine.', tags: ['possessivpronomen'], difficulty: 2 },
      { id: 'ex-04', type: 'multiple_choice', question_de: 'Wir haben einen Garten. Das ist ___ Garten.', question_vi: 'Chọn đúng.', options: ['mein', 'unser', 'euer', 'ihr'], answer: ['unser'], explanation_vi: 'wir → unser. Garten là maskulin → "unser Garten".', tags: ['possessivpronomen'], difficulty: 2 },
      { id: 'ex-05', type: 'error_spotting', sentence_words: ['Das', 'ist', 'mein', 'Schwester'], error_index: 2, correct_word: 'meine', correct_sentence: 'Das ist meine Schwester.', explanation_vi: 'Schwester là feminin → meine (thêm -e), không phải mein.', explanation_de: 'Schwester ist feminin → meine.', tags: ['possessivpronomen'], difficulty: 3 },
    ],
    sortOrder: 2,
    status: 'PUBLISHED',
  }})

  // A-Lesson
  await prisma.grammarLesson.create({ data: {
    id: 'a1-g11-possessivpronomen-03-A',
    topicId: t2.id,
    level: 'A1',
    lessonType: 'A',
    lessonNumber: 3,
    titleDe: 'Possessivpronomen — Anwendung',
    estimatedMin: 12,
    tags: ['possessivpronomen', 'pronomen'],
    theoryJson: null,
    exercisesJson: [
      { id: 'ex-01', type: 'gap_fill_type', stem: 'Wo ist ___ Tasche? (du, feminin)', answer: ['deine'], instruction_vi: 'Điền đại từ sở hữu.', explanation_vi: 'du → dein, Tasche là feminin → deine.', tags: ['possessivpronomen'], difficulty: 2 },
      { id: 'ex-02', type: 'gap_fill_type', stem: '___ Bruder studiert Medizin. (ich)', answer: ['Mein'], instruction_vi: 'Điền đại từ sở hữu.', explanation_vi: 'ich → mein, Bruder là maskulin → Mein.', tags: ['possessivpronomen'], difficulty: 2 },
      { id: 'ex-03', type: 'gap_fill_type', stem: '___ Kinder gehen in die Schule. (sie, Plural)', answer: ['Ihre'], instruction_vi: 'Điền đại từ sở hữu.', explanation_vi: 'sie → ihr, Kinder là Plural → ihre.', tags: ['possessivpronomen'], difficulty: 2 },
      { id: 'ex-04', type: 'gap_fill_type', stem: 'Ist das ___ Handy? (er, neutral)', answer: ['sein'], instruction_vi: 'Điền đại từ sở hữu.', explanation_vi: 'er → sein, Handy là neutral → sein.', tags: ['possessivpronomen'], difficulty: 2 },
      { id: 'ex-05', type: 'multiple_choice', question_de: 'Sie (cô ấy) hat eine Katze. ___ Katze heißt Mimi.', question_vi: 'Chọn đúng.', options: ['Sein', 'Ihr', 'Ihre', 'Seine'], answer: ['Ihre'], explanation_vi: 'sie (cô ấy) → ihr, Katze là feminin → Ihre.', tags: ['possessivpronomen'], difficulty: 3 },
      { id: 'ex-06', type: 'multiple_choice', question_de: 'Wir lieben ___ Stadt.', question_vi: 'Chọn đúng.', options: ['unser', 'unsere', 'unseren', 'unserem'], answer: ['unsere'], explanation_vi: 'wir → unser, Stadt là feminin → unsere.', tags: ['possessivpronomen'], difficulty: 3 },
      { id: 'ex-07', type: 'error_spotting', sentence_words: ['Sein', 'Mutter', 'kocht', 'gut'], error_index: 0, correct_word: 'Seine', correct_sentence: 'Seine Mutter kocht gut.', explanation_vi: 'Mutter là feminin → "seine" (thêm -e).', explanation_de: 'Mutter ist feminin → seine.', tags: ['possessivpronomen'], difficulty: 3 },
      { id: 'ex-08', type: 'transformation', source_sentence: 'Ich habe einen Hund. (→ mein)', target_form: 'possessiv', accepted_answers: ['Das ist mein Hund.', 'Mein Hund', 'mein Hund'], instruction_vi: 'Viết lại dùng đại từ sở hữu.', explanation_vi: 'ich → mein, Hund là maskulin → mein Hund.', explanation_de: 'ich → mein.', tags: ['possessivpronomen'], difficulty: 3 },
      { id: 'ex-09', type: 'matching', pairs: [
        { de: 'meine Mutter', vi: 'mẹ tôi' },
        { de: 'dein Vater', vi: 'bố bạn' },
        { de: 'seine Schwester', vi: 'chị/em gái anh ấy' },
        { de: 'unsere Kinder', vi: 'con chúng tôi' },
        { de: 'ihr Haus', vi: 'nhà cô ấy' },
      ], instruction_vi: 'Nối câu tiếng Đức với nghĩa tiếng Việt.', tags: ['possessivpronomen'], difficulty: 2 },
      { id: 'ex-10', type: 'sort_words', words: ['Meine', 'Eltern', 'wohnen', 'in', 'Berlin'], correct_order: [0, 1, 2, 3, 4], instruction_vi: 'Sắp xếp câu đúng.', explanation_vi: 'Meine Eltern wohnen in Berlin.', tags: ['possessivpronomen'], difficulty: 2 },
    ],
    sortOrder: 3,
    status: 'PUBLISHED',
  }})
  console.log('✅ a1-g11-possessivpronomen: 3 lessons created (E+V+A)')

  console.log('\n🎉 Phase 2 complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
