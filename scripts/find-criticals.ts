import { PrismaClient } from '@prisma/client'

const p = new PrismaClient()

async function main() {
  const all = await p.grammarLesson.findMany({})

  for (const l of all) {
    const ex = l.exercisesJson as any[]
    if (!Array.isArray(ex)) continue
    for (let i = 0; i < ex.length; i++) {
      const e = ex[i]
      if (e.type === 'multiple_choice') {
        const optLen = Array.isArray(e.options) ? e.options.length : -1
        const correct = e.correct
        if (optLen < 3 || correct === undefined || correct < 0 || correct >= optLen) {
          console.log(`CRIT MC: ${l.id} | ex[${i}] id=${e.id} | options(${optLen}):${JSON.stringify(e.options)?.slice(0,100)} | correct:${correct}`)
        }
      }
      if (e.type === 'gap_fill_bank') {
        const bankLen = Array.isArray(e.bank) ? e.bank.length : -1
        if (bankLen === 0 || bankLen === -1) {
          console.log(`CRIT BANK: ${l.id} | ex[${i}] id=${e.id} | bank:${JSON.stringify(e.bank)} | keys:${Object.keys(e).join(',')}`)
        }
      }
    }
  }

  await p.$disconnect()
}

main().catch(console.error)
