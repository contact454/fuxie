import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function main() {
  const lesson = await p.grammarLesson.findUnique({ where: { id: 'a1-g07-nomen-genus-plural-02-V' } })
  if (!lesson) return

  const exercises = lesson.exercisesJson as any[]

  for (let i = 0; i < exercises.length; i++) {
    const ex = exercises[i]
    if (ex.type === 'gap_fill_bank' && !ex.bank) {
      // Check if data is in gap_fill_bank_config
      if (ex.gap_fill_bank_config) {
        const cfg = ex.gap_fill_bank_config
        ex.stem = cfg.stem || ex.stem
        ex.blanks = cfg.blanks || ex.blanks
        ex.bank = cfg.bank || []
        delete ex.gap_fill_bank_config

        // If still no bank, create from blanks
        if ((!ex.bank || ex.bank.length === 0) && ex.blanks) {
          ex.bank = ex.blanks.map((b: any) => b.answer).filter(Boolean)
          ex.bank.push('der', 'die', 'das')
        }

        console.log(`Fixed ex-${i+1}: bank=${JSON.stringify(ex.bank)}`)
      }
    }
  }

  await p.grammarLesson.update({
    where: { id: 'a1-g07-nomen-genus-plural-02-V' },
    data: { exercisesJson: exercises }
  })
  console.log('Updated lesson')

  // Re-check all criticals
  const all = await p.grammarLesson.findMany({})
  let criticals = 0
  for (const l of all) {
    const ex = l.exercisesJson as any[]
    if (!Array.isArray(ex)) continue
    for (const e of ex) {
      if (e.type === 'gap_fill_bank' && (!e.bank || (Array.isArray(e.bank) && e.bank.length === 0))) criticals++
      if (e.type === 'multiple_choice') {
        if (!e.options || e.options.length < 3) criticals++
        if (e.correct === undefined || e.correct < 0 || e.correct >= (e.options?.length || 0)) criticals++
      }
    }
  }
  console.log(`\nRemaining criticals: ${criticals}`)
  console.log(criticals === 0 ? 'ALL CLEAR' : 'STILL HAS ISSUES')

  await p.$disconnect()
}

main().catch(console.error)
