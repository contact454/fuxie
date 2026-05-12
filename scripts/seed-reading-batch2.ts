import { PrismaClient } from '../apps/web/generated/prisma'
const prisma = new PrismaClient()

const batch = [
  {
    exerciseId: 'C1-T1-005',
    texts: [{ id: 'TextA', type: 'sachtext', title: 'Sozialpsychologische Dynamiken in modernen Gesellschaften',
      content: 'Die ___(1)___ sozialer Normen auf individuelles Verhalten ist Gegenstand intensiver Forschung. Die von Psychologen ___(2)___ Studien belegen, dass Konformitätsdruck auch in demokratischen Gesellschaften wirkmächtig bleibt. Soziologen betonen, die ___(3)___ kollektiver Identitäten müsse im Kontext zunehmender Individualisierung neu gedacht werden. Die ___(4)___ zwischen Gruppenzugehörigkeit und persönlicher Autonomie erzeugt dabei vielfältige Spannungen.\n\nEine rein behavioristische ___(5)___ menschlichen Verhaltens vernachlässigt die Rolle kognitiver Prozesse. Es ist erforderlich, integrative Theorien zu ___(6)___, die sowohl unbewusste als auch bewusste Handlungsmotivationen erfassen. Die von Betroffenen ___(7)___ Erfahrungen sozialer Ausgrenzung verdienen dabei besondere Aufmerksamkeit. Ob eine Gesellschaft ohne jegliche Form von Vorurteilen ___(8)___ werden kann, bleibt eine utopische Vorstellung.' }],
    questions: [
      { n:1, answer:'Auswirkung', stmt:'Die ___(1)___ sozialer Normen auf individuelles Verhalten', evidence:'Die Auswirkung sozialer Normen auf individuelles Verhalten', vocab:[{word:'Auswirkung',type:'Nomen',meaning:'effect/impact'}] },
      { n:2, answer:'durchgeführten', stmt:'Die von Psychologen ___(2)___ Studien', evidence:'Die von Psychologen durchgeführten Studien', vocab:[{word:'durchführen',type:'Verb',meaning:'to conduct'}] },
      { n:3, answer:'Entstehung', stmt:'die ___(3)___ kollektiver Identitäten müsse...neu gedacht werden', evidence:'die Entstehung kollektiver Identitäten', vocab:[{word:'Entstehung',type:'Nomen',meaning:'emergence'}] },
      { n:4, answer:'Spannung', stmt:'Die ___(4)___ zwischen Gruppenzugehörigkeit und persönlicher Autonomie', evidence:'Die Spannung zwischen Gruppenzugehörigkeit und persönlicher Autonomie', vocab:[{word:'Spannung',type:'Nomen',meaning:'tension'}] },
      { n:5, answer:'Erklärung', stmt:'Eine rein behavioristische ___(5)___ menschlichen Verhaltens', evidence:'behavioristische Erklärung menschlichen Verhaltens', vocab:[{word:'Erklärung',type:'Nomen',meaning:'explanation'}] },
      { n:6, answer:'formulieren', stmt:'integrative Theorien zu ___(6)___', evidence:'integrative Theorien zu formulieren', vocab:[{word:'formulieren',type:'Verb',meaning:'to formulate'}] },
      { n:7, answer:'geschilderten', stmt:'Die von Betroffenen ___(7)___ Erfahrungen', evidence:'Die von Betroffenen geschilderten Erfahrungen sozialer Ausgrenzung', vocab:[{word:'schildern',type:'Verb',meaning:'to describe'}] },
      { n:8, answer:'verwirklicht', stmt:'ohne jegliche Form von Vorurteilen ___(8)___ werden kann', evidence:'ob eine Gesellschaft verwirklicht werden kann', vocab:[{word:'verwirklichen',type:'Verb',meaning:'to realize'}] },
    ]
  },
  {
    exerciseId: 'C1-T1-006',
    texts: [{ id: 'TextA', type: 'sachtext', title: 'Paradigmenwechsel in der Wissenschaftstheorie',
      content: 'Die ___(1)___ wissenschaftlicher Erkenntnisse ist nach Thomas Kuhn kein linearer Prozess. Die von Forschern ___(2)___ Anomalien innerhalb bestehender Paradigmen führen letztlich zu revolutionären Umbrüchen. Kuhn argumentierte, die ___(3)___ eines Paradigmenwechsels hänge weniger von empirischen Daten als von sozialen Faktoren ab. Die ___(4)___ zwischen konkurrierenden Theorien lässt sich daher nicht allein durch Experimente klären.\n\nEine ausschließlich positivistische ___(5)___ des Erkenntnisprozesses blendet die historische Bedingtheit wissenschaftlicher Wahrheiten aus. Es bedarf epistemologischer Reflexion, um die Grenzen des Wissens angemessen zu ___(6)___. Die von Kritikern ___(7)___ Einwände gegen den Relativismus Kuhns sind dabei durchaus berechtigt. Ob absolute wissenschaftliche Objektivität jemals ___(8)___ werden kann, ist bis heute umstritten.' }],
    questions: [
      { n:1, answer:'Entwicklung', stmt:'Die ___(1)___ wissenschaftlicher Erkenntnisse', evidence:'Die Entwicklung wissenschaftlicher Erkenntnisse ist kein linearer Prozess', vocab:[{word:'Entwicklung',type:'Nomen',meaning:'development'}] },
      { n:2, answer:'entdeckten', stmt:'Die von Forschern ___(2)___ Anomalien', evidence:'Die von Forschern entdeckten Anomalien', vocab:[{word:'entdecken',type:'Verb',meaning:'to discover'}] },
      { n:3, answer:'Durchsetzung', stmt:'die ___(3)___ eines Paradigmenwechsels hänge...ab', evidence:'die Durchsetzung eines Paradigmenwechsels', vocab:[{word:'Durchsetzung',type:'Nomen',meaning:'enforcement/assertion'}] },
      { n:4, answer:'Entscheidung', stmt:'Die ___(4)___ zwischen konkurrierenden Theorien', evidence:'Die Entscheidung zwischen konkurrierenden Theorien', vocab:[{word:'Entscheidung',type:'Nomen',meaning:'decision'}] },
      { n:5, answer:'Darstellung', stmt:'Eine ausschließlich positivistische ___(5)___ des Erkenntnisprozesses', evidence:'positivistische Darstellung des Erkenntnisprozesses', vocab:[{word:'Darstellung',type:'Nomen',meaning:'representation'}] },
      { n:6, answer:'bestimmen', stmt:'die Grenzen des Wissens angemessen zu ___(6)___', evidence:'die Grenzen des Wissens angemessen zu bestimmen', vocab:[{word:'bestimmen',type:'Verb',meaning:'to determine'}] },
      { n:7, answer:'vorgebrachten', stmt:'Die von Kritikern ___(7)___ Einwände', evidence:'Die von Kritikern vorgebrachten Einwände gegen den Relativismus', vocab:[{word:'vorbringen',type:'Verb',meaning:'to put forward'}] },
      { n:8, answer:'erreicht', stmt:'ob absolute wissenschaftliche Objektivität ___(8)___ werden kann', evidence:'ob absolute wissenschaftliche Objektivität erreicht werden kann', vocab:[{word:'erreichen',type:'Verb',meaning:'to achieve'}] },
    ]
  },
  {
    exerciseId: 'C1-T1-007',
    texts: [{ id: 'TextA', type: 'sachtext', title: 'Medienethik und digitale Verantwortung',
      content: 'Die ___(1)___ journalistischer Standards im digitalen Zeitalter stellt Medienhäuser vor neue Herausforderungen. Die von Algorithmen ___(2)___ Nachrichtenauswahl beeinflusst das öffentliche Meinungsbild in erheblichem Maße. Medienforscher warnen, die ___(3)___ von Filterblasen gefährde die demokratische Meinungsbildung. Die ___(4)___ zwischen Pressefreiheit und Persönlichkeitsrecht ist dabei stets neu auszuhandeln.\n\nEine rein technologische ___(5)___ medialer Transformationsprozesse greift zu kurz, da sie ethische Dimensionen ausblendet. Es ist unerlässlich, medienethische Richtlinien zu ___(6)___, die auch auf soziale Netzwerke anwendbar sind. Die von Nutzern ___(7)___ Datenspuren werden zunehmend kommerziell verwertet. Ob informationelle Selbstbestimmung im Zeitalter der Datenökonomie noch garantiert ___(8)___ kann, wird kontrovers diskutiert.' }],
    questions: [
      { n:1, answer:'Einhaltung', stmt:'Die ___(1)___ journalistischer Standards', evidence:'Die Einhaltung journalistischer Standards im digitalen Zeitalter', vocab:[{word:'Einhaltung',type:'Nomen',meaning:'compliance'}] },
      { n:2, answer:'gesteuerte', stmt:'Die von Algorithmen ___(2)___ Nachrichtenauswahl', evidence:'Die von Algorithmen gesteuerte Nachrichtenauswahl', vocab:[{word:'steuern',type:'Verb',meaning:'to control/steer'}] },
      { n:3, answer:'Entstehung', stmt:'die ___(3)___ von Filterblasen gefährde die demokratische Meinungsbildung', evidence:'die Entstehung von Filterblasen gefährde die Meinungsbildung', vocab:[{word:'Entstehung',type:'Nomen',meaning:'emergence'}] },
      { n:4, answer:'Abgrenzung', stmt:'Die ___(4)___ zwischen Pressefreiheit und Persönlichkeitsrecht', evidence:'Die Abgrenzung zwischen Pressefreiheit und Persönlichkeitsrecht', vocab:[{word:'Abgrenzung',type:'Nomen',meaning:'delimitation'}] },
      { n:5, answer:'Betrachtung', stmt:'Eine rein technologische ___(5)___ medialer Transformationsprozesse', evidence:'technologische Betrachtung medialer Transformationsprozesse', vocab:[{word:'Betrachtung',type:'Nomen',meaning:'consideration'}] },
      { n:6, answer:'formulieren', stmt:'medienethische Richtlinien zu ___(6)___', evidence:'medienethische Richtlinien zu formulieren', vocab:[{word:'formulieren',type:'Verb',meaning:'to formulate'}] },
      { n:7, answer:'hinterlassenen', stmt:'Die von Nutzern ___(7)___ Datenspuren', evidence:'Die von Nutzern hinterlassenen Datenspuren', vocab:[{word:'hinterlassen',type:'Verb',meaning:'to leave behind'}] },
      { n:8, answer:'werden', stmt:'ob informationelle Selbstbestimmung noch garantiert ___(8)___ kann', evidence:'ob informationelle Selbstbestimmung garantiert werden kann', vocab:[{word:'werden',type:'Hilfsverb',meaning:'to be (passive)'}] },
    ]
  },
  {
    exerciseId: 'C1-T1-008',
    texts: [{ id: 'TextA', type: 'sachtext', title: 'Rechtsstaatlichkeit und digitale Herausforderungen',
      content: 'Die ___(1)___ rechtsstaatlicher Prinzipien auf den digitalen Raum erweist sich als äußerst komplex. Die von Juristen ___(2)___ Reformvorschläge zum Datenschutzrecht stoßen auf erheblichen politischen Widerstand. Rechtsexperten zufolge ___(3)___ die bestehende Gesetzgebung den technologischen Entwicklungen längst nicht mehr angemessen. Die ___(4)___ zwischen nationalem Recht und globaler Datenverarbeitung stellt eine grundsätzliche Herausforderung dar.\n\nEine rein nationale ___(5)___ grenzüberschreitender Rechtsfragen ist in einer vernetzten Welt zum Scheitern verurteilt. Es gilt, internationale Abkommen zu ___(6)___, die einen wirksamen Grundrechtsschutz gewährleisten. Die von Betroffenen ___(7)___ Klagen gegen Datenkonzerne häufen sich weltweit. Ob ein globales Datenschutzrecht jemals wirksam ___(8)___ werden kann, ist unter Experten höchst umstritten.' }],
    questions: [
      { n:1, answer:'Übertragung', stmt:'Die ___(1)___ rechtsstaatlicher Prinzipien auf den digitalen Raum', evidence:'Die Übertragung rechtsstaatlicher Prinzipien', vocab:[{word:'Übertragung',type:'Nomen',meaning:'transfer/application'}] },
      { n:2, answer:'eingebrachten', stmt:'Die von Juristen ___(2)___ Reformvorschläge', evidence:'Die von Juristen eingebrachten Reformvorschläge', vocab:[{word:'einbringen',type:'Verb',meaning:'to submit/introduce'}] },
      { n:3, answer:'sei', stmt:'Rechtsexperten zufolge ___(3)___ die bestehende Gesetzgebung...nicht mehr angemessen', evidence:'sei die bestehende Gesetzgebung nicht mehr angemessen', vocab:[{word:'angemessen',type:'Adjektiv',meaning:'appropriate'}] },
      { n:4, answer:'Diskrepanz', stmt:'Die ___(4)___ zwischen nationalem Recht und globaler Datenverarbeitung', evidence:'Die Diskrepanz zwischen nationalem Recht und globaler Datenverarbeitung', vocab:[{word:'Diskrepanz',type:'Nomen',meaning:'discrepancy'}] },
      { n:5, answer:'Regelung', stmt:'Eine rein nationale ___(5)___ grenzüberschreitender Rechtsfragen', evidence:'nationale Regelung grenzüberschreitender Rechtsfragen', vocab:[{word:'Regelung',type:'Nomen',meaning:'regulation'}] },
      { n:6, answer:'schaffen', stmt:'internationale Abkommen zu ___(6)___', evidence:'internationale Abkommen zu schaffen', vocab:[{word:'schaffen',type:'Verb',meaning:'to create'}] },
      { n:7, answer:'eingereichten', stmt:'Die von Betroffenen ___(7)___ Klagen', evidence:'Die von Betroffenen eingereichten Klagen gegen Datenkonzerne', vocab:[{word:'einreichen',type:'Verb',meaning:'to file/submit'}] },
      { n:8, answer:'durchgesetzt', stmt:'ob ein globales Datenschutzrecht ___(8)___ werden kann', evidence:'ob ein globales Datenschutzrecht durchgesetzt werden kann', vocab:[{word:'durchsetzen',type:'Verb',meaning:'to enforce'}] },
    ]
  },
]

async function main() {
  console.log('🚀 Seeding Reading Content — Batch 2 (C1-T1-005 to 008)')
  for (const entry of batch) {
    const ex = await prisma.readingExercise.findFirst({ where: { exerciseId: entry.exerciseId }, include: { questions: true } })
    if (!ex) { console.log(`⏭️ ${entry.exerciseId} not found`); continue }
    if (ex.questions.length > 0) { console.log(`⏭️ ${entry.exerciseId} already has questions`); continue }
    await prisma.readingExercise.update({ where: { id: ex.id }, data: { textsJson: entry.texts } })
    for (const q of entry.questions) {
      await prisma.readingQuestion.create({ data: {
        exerciseId: ex.id, questionNumber: q.n, questionType: 'lueckentext', linkedText: 'TextA',
        statement: q.stmt, options: null, correctAnswer: q.answer, points: 1, sortOrder: q.n,
        explanation: { reasoning: `Das fehlende Wort "${q.answer}" ergibt sich aus dem grammatischen und inhaltlichen Kontext.`, key_evidence: q.evidence, key_vocabulary: q.vocab }
      }})
    }
    console.log(`✅ ${entry.exerciseId} — ${entry.texts[0].title}`)
  }
  console.log('🎉 Batch 2 complete!')
}
main().catch(console.error).finally(() => prisma.$disconnect())
