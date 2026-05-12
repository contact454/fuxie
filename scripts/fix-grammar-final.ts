/**
 * Fix remaining grammar warnings:
 * 1. Add exercises to 5 A-lessons (need 8 minimum)
 * 2. Fix sortOrder duplicates in A1
 */
import { PrismaClient } from '../apps/web/generated/prisma'
const prisma = new PrismaClient()

const EXTRA_EXERCISES: Record<string, any[]> = {
  'a1-g01-alphabet-aussprache-03-A': [
    { id: 'ex-06', type: 'gap_fill_type', stem: 'Stra_e (ß oder ss?)', answer: ['ß'], instruction_vi: 'Điền ß hay ss?', explanation_vi: 'Straße — dùng ß sau nguyên âm dài.', explanation_de: 'Nach langem Vokal steht ß.', tags: ['alphabet'], difficulty: 2 },
    { id: 'ex-07', type: 'matching', pairs: [
      { de: 'sch', vi: '/ʃ/ (sh)' },
      { de: 'ch (ich)', vi: '/ç/ (nhẹ)' },
      { de: 'ch (ach)', vi: '/x/ (nặng)' },
      { de: 'ß', vi: '/s/ (ss)' },
    ], instruction_vi: 'Nối tổ hợp chữ với cách phát âm.', tags: ['aussprache'], difficulty: 2 },
    { id: 'ex-08', type: 'error_spotting', sentence_words: ['Ich', 'heise', 'Anna'], error_index: 1, correct_word: 'heiße', correct_sentence: 'Ich heiße Anna.', explanation_vi: 'heißen — viết với ß, không phải "se".', explanation_de: 'heißen schreibt man mit ß.', tags: ['alphabet'], difficulty: 2 },
  ],
  'a1-g02-personalpronomen-sein-haben-03-A': [
    { id: 'ex-06', type: 'gap_fill_type', stem: 'Wir ___ Studenten. (sein)', answer: ['sind'], instruction_vi: 'Chia sein.', explanation_vi: 'wir → sind.', explanation_de: 'wir sind', tags: ['sein-haben'], difficulty: 2 },
    { id: 'ex-07', type: 'gap_fill_type', stem: 'Ihr ___ ein Auto. (haben)', answer: ['habt'], instruction_vi: 'Chia haben.', explanation_vi: 'ihr → habt.', explanation_de: 'ihr habt', tags: ['sein-haben'], difficulty: 2 },
    { id: 'ex-08', type: 'error_spotting', sentence_words: ['Du', 'bist', 'ein', 'Buch'], error_index: 1, correct_word: 'hast', correct_sentence: 'Du hast ein Buch.', explanation_vi: '"có" dùng haben: Du hast ein Buch.', explanation_de: 'haben, nicht sein!', tags: ['sein-haben'], difficulty: 3 },
  ],
  'a1-g03-regelmaessige-verben-03-A': [
    { id: 'ex-06', type: 'gap_fill_type', stem: 'Sie (formal) ___ Deutsch. (lernen)', answer: ['lernen'], instruction_vi: 'Chia lernen.', explanation_vi: 'Sie (formal) → lernen.', explanation_de: 'Sie lernen', tags: ['praesens'], difficulty: 2 },
    { id: 'ex-07', type: 'gap_fill_type', stem: 'Er ___ in Berlin. (wohnen)', answer: ['wohnt'], instruction_vi: 'Chia wohnen.', explanation_vi: 'er → wohnt.', explanation_de: 'er wohnt', tags: ['praesens'], difficulty: 2 },
    { id: 'ex-08', type: 'error_spotting', sentence_words: ['Ich', 'spielen', 'Fußball'], error_index: 1, correct_word: 'spiele', correct_sentence: 'Ich spiele Fußball.', explanation_vi: 'ich → spiel+e = spiele.', explanation_de: 'ich spiele (nicht spielen)', tags: ['praesens'], difficulty: 2 },
  ],
  'a1-g04-satzbau-fragen-03-A': [
    { id: 'ex-06', type: 'sentence_reorder', words: ['Morgen', 'gehe', 'ich', 'ins', 'Kino'], correct_order: [0, 1, 2, 3, 4], alt_orders: [[2, 1, 0, 3, 4]], instruction_vi: 'Sắp xếp câu đúng. (V2-Regel)', explanation_vi: 'Morgen gehe ich ins Kino. — Verb ở vị trí 2.', explanation_de: 'V2: Morgen gehe ich...', tags: ['satzbau'], difficulty: 2 },
    { id: 'ex-07', type: 'gap_fill_type', stem: '___ wohnst du? (Fragewort)', answer: ['Wo'], instruction_vi: 'Điền từ hỏi phù hợp.', explanation_vi: 'Wo = ở đâu. Wo wohnst du?', explanation_de: 'Wo = Where', tags: ['w-fragen'], difficulty: 1 },
    { id: 'ex-08', type: 'matching', pairs: [
      { de: 'Wo?', vi: 'ở đâu' },
      { de: 'Wer?', vi: 'ai' },
      { de: 'Was?', vi: 'cái gì' },
      { de: 'Wann?', vi: 'khi nào' },
      { de: 'Wie?', vi: 'như thế nào' },
    ], instruction_vi: 'Nối từ hỏi với nghĩa.', tags: ['w-fragen'], difficulty: 1 },
  ],
  'a1-g08-unregelmaessige-verben-03-A': [
    { id: 'ex-06', type: 'gap_fill_type', stem: 'Er ___ gern Pizza. (essen)', answer: ['isst'], instruction_vi: 'Chia essen.', explanation_vi: 'er → isst (e→i).', explanation_de: 'essen: er isst', tags: ['unregelmaessig'], difficulty: 2 },
    { id: 'ex-07', type: 'gap_fill_type', stem: 'Sie ___ schnell. (laufen)', answer: ['läuft'], instruction_vi: 'Chia laufen.', explanation_vi: 'sie → läuft (au→äu).', explanation_de: 'laufen: sie läuft', tags: ['unregelmaessig'], difficulty: 2 },
    { id: 'ex-08', type: 'error_spotting', sentence_words: ['Er', 'nehmt', 'den', 'Bus'], error_index: 1, correct_word: 'nimmt', correct_sentence: 'Er nimmt den Bus.', explanation_vi: 'nehmen: er nimmt (e→i), không phải "nehmt".', explanation_de: 'nehmen: er nimmt (nicht nehmt)', tags: ['unregelmaessig'], difficulty: 3 },
  ],
}

async function main() {
  console.log('🔧 Fixing remaining grammar warnings...\n')

  // 1. Add exercises to 5 A-lessons
  console.log('1️⃣ Adding exercises to A-lessons...')
  for (const [lessonId, newExs] of Object.entries(EXTRA_EXERCISES)) {
    const lesson = await prisma.grammarLesson.findUnique({ where: { id: lessonId } })
    if (!lesson) { console.log(`  ⏭️ ${lessonId} not found`); continue }

    const existing = lesson.exercisesJson as any[]
    const merged = [...existing, ...newExs]

    await prisma.grammarLesson.update({
      where: { id: lessonId },
      data: { exercisesJson: merged }
    })
    console.log(`  ✅ ${lessonId}: ${existing.length} → ${merged.length} exercises`)
  }

  // 2. Fix A1 sortOrder duplicates
  console.log('\n2️⃣ Fixing A1 topic sortOrders...')
  const a1Topics = await prisma.grammarTopic.findMany({
    where: { cefrLevel: 'A1' },
    orderBy: { sortOrder: 'asc' }
  })

  let order = 1
  for (const t of a1Topics) {
    if (t.slug.startsWith('dev-')) continue
    await prisma.grammarTopic.update({
      where: { id: t.id },
      data: { sortOrder: order++ }
    })
  }
  for (const t of a1Topics) {
    if (!t.slug.startsWith('dev-')) continue
    await prisma.grammarTopic.update({
      where: { id: t.id },
      data: { sortOrder: order++ }
    })
  }
  console.log(`  ✅ Reassigned sortOrders for ${a1Topics.length} A1 topics`)

  console.log('\n🎉 All fixes applied!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
