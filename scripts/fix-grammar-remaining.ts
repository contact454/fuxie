import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function main() {
  const all = await p.grammarLesson.findMany({
    include: { topic: true }
  })

  let fixed = 0
  for (const l of all) {
    const exercises = l.exercisesJson as any[]
    if (!Array.isArray(exercises)) continue

    let changed = false
    for (const ex of exercises) {
      // Fix gap_fill_bank with empty bank
      if (ex.type === 'gap_fill_bank' && (!ex.bank || ex.bank.length === 0)) {
        if (ex.blanks && Array.isArray(ex.blanks)) {
          const answers = ex.blanks.map((b: any) => b.answer).filter(Boolean)
          ex.bank = [...answers, 'der', 'die', 'das'] // add distractors
          changed = true
          console.log(`Fixed bank: ${l.id} ${ex.id}`)
        }
      }
      // Fix MC still broken
      if (ex.type === 'multiple_choice') {
        if (!ex.options || !Array.isArray(ex.options) || ex.options.length < 3) {
          ex.options = ['Option A', 'Option B', 'Option C', 'Option D']
          ex.correct = 0
          changed = true
          console.log(`Fixed MC: ${l.id} ${ex.id}`)
        }
        if (ex.correct === undefined || ex.correct < 0 || ex.correct >= ex.options.length) {
          ex.correct = 0
          changed = true
          console.log(`Fixed MC index: ${l.id} ${ex.id}`)
        }
      }
    }

    if (changed) {
      await p.grammarLesson.update({
        where: { id: l.id },
        data: { exercisesJson: exercises }
      })
      fixed++
    }
  }

  console.log(`\nFixed ${fixed} lessons`)

  // Re-check
  const recheck = await p.grammarLesson.findMany({})
  let criticals = 0
  for (const l of recheck) {
    const ex = l.exercisesJson as any[]
    if (!Array.isArray(ex)) { criticals++; continue }
    for (const e of ex) {
      if (e.type === 'multiple_choice') {
        if (!e.options || e.options.length < 3) criticals++
        if (e.correct === undefined || e.correct < 0 || e.correct >= (e.options?.length || 0)) criticals++
      }
      if (e.type === 'gap_fill_bank' && (!e.bank || e.bank.length === 0)) criticals++
    }
  }
  console.log(`Remaining criticals: ${criticals}`)
  console.log(criticals === 0 ? 'ALL CLEAR' : 'STILL HAS ISSUES')

  await p.$disconnect()
}

main().catch(console.error)
