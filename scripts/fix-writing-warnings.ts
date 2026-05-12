/**
 * Fix all Writing module warnings:
 * 1. DEV-001 rubric, maxScore, teilName
 * 2. Umlaut encoding (ae→ä, oe→ö, ue→ü) in instruction, situation, teilName
 */
import { PrismaClient } from '../apps/web/generated/prisma'
const prisma = new PrismaClient()

function fixUmlauts(text: string): string {
  // Only replace ae/oe/ue that are clearly Umlaut substitutions
  return text
    .replace(/(?<![a-zA-Z])ae(?![a-zA-Z])/g, 'ä') // standalone "ae" → ä
    .replace(/Ae(?=[a-zäöü])/g, 'Ä')
    .replace(/(?<![a-zA-Z])oe(?![a-zA-Z])/g, 'ö')
    .replace(/Oe(?=[a-zäöü])/g, 'Ö')
    .replace(/(?<![a-zA-Z])ue(?![a-zA-Z])/g, 'ü')
    .replace(/Ue(?=[a-zäöü])/g, 'Ü')
    // Common German words with Umlaut substitutions
    .replace(/uellen/g, 'üllen')        // ausfuellen → ausfüllen, Fuellen → Füllen
    .replace(/uerter/g, 'örter')         // Woerter → Wörter
    .replace(/oechten/g, 'öchten')       // moechten → möchten
    .replace(/ueber/g, 'über')           // ueber → über
    .replace(/Ueber/g, 'Über')
    .replace(/fuer/g, 'für')
    .replace(/Fuer/g, 'Für')
    .replace(/Schreib en/g, 'Schreiben') // fix stray spaces
    .replace(/Persoenliche/g, 'Persönliche')
    .replace(/persoenliche/g, 'persönliche')
    .replace(/Meinungsaeusserung/g, 'Meinungsäußerung')
    .replace(/meinungsaeusserung/g, 'meinungsäußerung')
    .replace(/Formular ausfuellen/g, 'Formular ausfüllen')
    .replace(/Persoenliche Mitteilung/g, 'Persönliche Mitteilung')
    .replace(/persoenliche Mitteilung/g, 'persönliche Mitteilung')
    .replace(/Forumsbeitrag/g, 'Forumsbeitrag') // already correct, no change needed
    .replace(/Woerter/g, 'Wörter')
    .replace(/woerter/g, 'wörter')
    .replace(/Erlaeuterung/g, 'Erläuterung')
    .replace(/Eroerterung/g, 'Erörterung')
    .replace(/auesserung/g, 'äußerung')
    .replace(/Meinungsaeusserung/g, 'Meinungsäußerung')
    .replace(/E-Mail-Antwort/g, 'E-Mail-Antwort') // already correct
    .replace(/Loesungsvorschlag/g, 'Lösungsvorschlag')
    .replace(/Moeglichkeiten/g, 'Möglichkeiten')
    .replace(/zurueckschreiben/g, 'zurückschreiben')
    .replace(/Gruende/g, 'Gründe')
    .replace(/Gruesse/g, 'Grüße')
    .replace(/gruesse/g, 'grüße')
    .replace(/aendern/g, 'ändern')
    .replace(/Aenderung/g, 'Änderung')
    .replace(/beschaeftigt/g, 'beschäftigt')
    .replace(/gehoert/g, 'gehört')
    .replace(/moechte/g, 'möchte')
    .replace(/Moechten/g, 'Möchten')
    .replace(/koennen/g, 'können')
    .replace(/Koennen/g, 'Können')
    .replace(/muessen/g, 'müssen')
    .replace(/Muessen/g, 'Müssen')
    .replace(/wuenschen/g, 'wünschen')
    .replace(/Wuenschen/g, 'Wünschen')
    .replace(/aehnlich/g, 'ähnlich')
    .replace(/Aehnlich/g, 'Ähnlich')
    .replace(/naechste/g, 'nächste')
    .replace(/Naechste/g, 'Nächste')
    .replace(/Ernaehrung/g, 'Ernährung')
    .replace(/ernaehrung/g, 'ernährung')
    .replace(/regelmaessig/g, 'regelmäßig')
    .replace(/Ausfuellen/g, 'Ausfüllen')
    .replace(/ausfuellen/g, 'ausfüllen')
    .replace(/Fuellen/g, 'Füllen')
    .replace(/fuellen/g, 'füllen')
}

async function main() {
  console.log('🔧 Fixing Writing module warnings...\n')

  // 1. Fix DEV-001
  console.log('1️⃣ Fixing W-A1-DEV-001...')
  const dev = await prisma.writingExercise.findFirst({ where: { exerciseId: 'W-A1-DEV-001' } })
  if (dev) {
    await prisma.writingExercise.update({
      where: { id: dev.id },
      data: {
        teilName: 'Formular ausfüllen',
        maxScore: 15,
        rubricJson: {
          criteria: [
            { id: 'inhalt', name: 'Inhalt', nameVi: 'Nội dung', weight: 30, maxScore: 5 },
            { id: 'korrektheit', name: 'Korrektheit', nameVi: 'Chính xác', weight: 40, maxScore: 5 },
            { id: 'angemessenheit', name: 'Angemessenheit', nameVi: 'Phù hợp', weight: 30, maxScore: 5 },
          ],
          maxScore: 15,
        },
        sortOrder: 0, // Make it not conflict with others
      }
    })
    console.log('  ✅ Rubric, maxScore, teilName, sortOrder fixed')
  }

  // 2. Fix Umlaut encoding in all exercises
  console.log('\n2️⃣ Fixing Umlaut encoding...')
  const all = await prisma.writingExercise.findMany()
  let fixedCount = 0

  for (const ex of all) {
    const updates: any = {}
    let changed = false

    const newInstruction = fixUmlauts(ex.instruction)
    if (newInstruction !== ex.instruction) { updates.instruction = newInstruction; changed = true }

    const newSituation = fixUmlauts(ex.situation)
    if (newSituation !== ex.situation) { updates.situation = newSituation; changed = true }

    const newTeilName = fixUmlauts(ex.teilName)
    if (newTeilName !== ex.teilName) { updates.teilName = newTeilName; changed = true }

    const newTopic = fixUmlauts(ex.topic)
    if (newTopic !== ex.topic) { updates.topic = newTopic; changed = true }

    if (ex.sourceText) {
      const newSource = fixUmlauts(ex.sourceText)
      if (newSource !== ex.sourceText) { updates.sourceText = newSource; changed = true }
    }

    if (changed) {
      await prisma.writingExercise.update({ where: { id: ex.id }, data: updates })
      fixedCount++
    }
  }
  console.log(`  ✅ Fixed Umlauts in ${fixedCount} exercises`)

  console.log('\n🎉 All writing warnings fixed!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
