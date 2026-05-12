import { PrismaClient } from '../apps/web/generated/prisma'
const prisma = new PrismaClient()

const batch = [
  {
    exerciseId: 'C1-T1-009',
    texts: [{ id: 'TextA', type: 'sachtext', title: 'Ästhetische Wahrnehmung und kultureller Wandel',
      content: 'Die ___(1)___ ästhetischer Maßstäbe unterliegt einem steten kulturellen Wandel. Die von Kunsthistorikern ___(2)___ Forschungsergebnisse zeigen, dass Schönheitsideale stets gesellschaftlich konstruiert sind. Kulturtheoretiker betonen, die ___(3)___ zwischen Hochkultur und Populärkultur verliere zunehmend an Gültigkeit. Die ___(4)___ traditioneller Kunstbegriffe durch digitale Medien ist dabei nicht aufzuhalten.\n\nEine rein formale ___(5)___ künstlerischer Werke vernachlässigt deren politische und soziale Kontexte. Es ist notwendig, neue Interpretationsrahmen zu ___(6)___, die der Vielfalt zeitgenössischer Kunstproduktion gerecht werden. Die von Kunstschaffenden ___(7)___ Grenzen zwischen den Disziplinen werden dabei bewusst überschritten. Ob eine universelle ästhetische Theorie jemals ___(8)___ werden kann, erscheint angesichts kultureller Diversität fraglich.' }],
    questions: [
      { n:1, answer:'Veränderung', stmt:'Die ___(1)___ ästhetischer Maßstäbe', evidence:'Die Veränderung ästhetischer Maßstäbe unterliegt einem steten Wandel', vocab:[{word:'Veränderung',type:'Nomen',meaning:'change'}] },
      { n:2, answer:'gewonnenen', stmt:'Die von Kunsthistorikern ___(2)___ Forschungsergebnisse', evidence:'Die von Kunsthistorikern gewonnenen Forschungsergebnisse', vocab:[{word:'gewinnen',type:'Verb',meaning:'to obtain/gain'}] },
      { n:3, answer:'Unterscheidung', stmt:'die ___(3)___ zwischen Hochkultur und Populärkultur', evidence:'die Unterscheidung zwischen Hochkultur und Populärkultur', vocab:[{word:'Unterscheidung',type:'Nomen',meaning:'distinction'}] },
      { n:4, answer:'Veränderung', stmt:'Die ___(4)___ traditioneller Kunstbegriffe durch digitale Medien', evidence:'Die Veränderung traditioneller Kunstbegriffe', vocab:[{word:'Kunstbegriff',type:'Nomen',meaning:'concept of art'}] },
      { n:5, answer:'Analyse', stmt:'Eine rein formale ___(5)___ künstlerischer Werke', evidence:'formale Analyse künstlerischer Werke', vocab:[{word:'Analyse',type:'Nomen',meaning:'analysis'}] },
      { n:6, answer:'schaffen', stmt:'neue Interpretationsrahmen zu ___(6)___', evidence:'neue Interpretationsrahmen zu schaffen', vocab:[{word:'schaffen',type:'Verb',meaning:'to create'}] },
      { n:7, answer:'aufgelösten', stmt:'Die von Kunstschaffenden ___(7)___ Grenzen', evidence:'Die von Kunstschaffenden aufgelösten Grenzen', vocab:[{word:'auflösen',type:'Verb',meaning:'to dissolve'}] },
      { n:8, answer:'formuliert', stmt:'ob eine universelle ästhetische Theorie ___(8)___ werden kann', evidence:'ob eine universelle ästhetische Theorie formuliert werden kann', vocab:[{word:'formulieren',type:'Verb',meaning:'to formulate'}] },
    ]
  },
  {
    exerciseId: 'C1-T1-010',
    texts: [{ id: 'TextA', type: 'sachtext', title: 'Chancengleichheit in der Bildungsforschung',
      content: 'Die ___(1)___ von Bildungsungleichheiten gehört zu den drängendsten Aufgaben der Bildungsforschung. Die von Forschenden ___(2)___ Daten belegen einen engen Zusammenhang zwischen sozialer Herkunft und schulischem Erfolg. Bildungsexperten zufolge ___(3)___ eine grundlegende Strukturreform des Schulsystems überfällig. Die ___(4)___ frühkindlicher Förderung für den späteren Bildungsverlauf lässt sich empirisch eindeutig nachweisen.\n\nEine ausschließlich leistungsorientierte ___(5)___ des Bildungswesens blendet strukturelle Benachteiligungen aus. Es gilt, inklusive Konzepte zu ___(6)___, die allen Lernenden gleichwertige Teilhabechancen ermöglichen. Die von Lehrkräften ___(7)___ Überlastung erschwert dabei eine individuelle Förderung erheblich. Ob vollständige Chancengleichheit im Bildungssystem jemals ___(8)___ werden kann, bleibt eine kontroverse Frage.' }],
    questions: [
      { n:1, answer:'Überwindung', stmt:'Die ___(1)___ von Bildungsungleichheiten', evidence:'Die Überwindung von Bildungsungleichheiten', vocab:[{word:'Überwindung',type:'Nomen',meaning:'overcoming'}] },
      { n:2, answer:'erhobenen', stmt:'Die von Forschenden ___(2)___ Daten', evidence:'Die von Forschenden erhobenen Daten', vocab:[{word:'erheben',type:'Verb',meaning:'to collect/gather'}] },
      { n:3, answer:'sei', stmt:'Bildungsexperten zufolge ___(3)___ eine Strukturreform...überfällig', evidence:'sei eine grundlegende Strukturreform überfällig', vocab:[{word:'überfällig',type:'Adjektiv',meaning:'overdue'}] },
      { n:4, answer:'Bedeutung', stmt:'Die ___(4)___ frühkindlicher Förderung', evidence:'Die Bedeutung frühkindlicher Förderung für den späteren Bildungsverlauf', vocab:[{word:'Förderung',type:'Nomen',meaning:'support/promotion'}] },
      { n:5, answer:'Bewertung', stmt:'Eine ausschließlich leistungsorientierte ___(5)___ des Bildungswesens', evidence:'leistungsorientierte Bewertung des Bildungswesens', vocab:[{word:'Bewertung',type:'Nomen',meaning:'evaluation'}] },
      { n:6, answer:'entwickeln', stmt:'inklusive Konzepte zu ___(6)___', evidence:'inklusive Konzepte zu entwickeln', vocab:[{word:'entwickeln',type:'Verb',meaning:'to develop'}] },
      { n:7, answer:'beklagte', stmt:'Die von Lehrkräften ___(7)___ Überlastung', evidence:'Die von Lehrkräften beklagte Überlastung', vocab:[{word:'beklagen',type:'Verb',meaning:'to lament'}] },
      { n:8, answer:'hergestellt', stmt:'ob vollständige Chancengleichheit ___(8)___ werden kann', evidence:'ob vollständige Chancengleichheit hergestellt werden kann', vocab:[{word:'herstellen',type:'Verb',meaning:'to establish'}] },
    ]
  },
  {
    exerciseId: 'C1-T1-011',
    texts: [{ id: 'TextA', type: 'sachtext', title: 'Klimapolitik zwischen Anspruch und Wirklichkeit',
      content: 'Die ___(1)___ wirksamer Klimaschutzmaßnahmen scheitert häufig an ökonomischen Interessenkonflikten. Die von Klimaforschern ___(2)___ Prognosen zeichnen ein alarmierendes Bild der künftigen Erderwärmung. Wissenschaftler mahnen, die ___(3)___ des CO₂-Ausstoßes müsse deutlich schneller voranschreiten als bislang geplant. Die ___(4)___ zwischen wirtschaftlichem Wachstum und ökologischer Nachhaltigkeit erfordert dabei grundlegend neue Denkansätze.\n\nEine rein technologische ___(5)___ des Klimawandels ignoriert die Notwendigkeit gesellschaftlicher Verhaltensänderungen. Es bedarf vielmehr umfassender politischer Strategien, um den ökologischen Umbau ___(6)___. Die von der Zivilgesellschaft ___(7)___ Protestbewegungen erhöhen dabei den Handlungsdruck auf die Politik. Ob die im Pariser Abkommen vereinbarten Ziele tatsächlich ___(8)___ werden können, wird von Experten zunehmend bezweifelt.' }],
    questions: [
      { n:1, answer:'Umsetzung', stmt:'Die ___(1)___ wirksamer Klimaschutzmaßnahmen', evidence:'Die Umsetzung wirksamer Klimaschutzmaßnahmen', vocab:[{word:'Umsetzung',type:'Nomen',meaning:'implementation'}] },
      { n:2, answer:'vorgelegten', stmt:'Die von Klimaforschern ___(2)___ Prognosen', evidence:'Die von Klimaforschern vorgelegten Prognosen', vocab:[{word:'vorlegen',type:'Verb',meaning:'to present'}] },
      { n:3, answer:'Reduktion', stmt:'die ___(3)___ des CO₂-Ausstoßes müsse...voranschreiten', evidence:'die Reduktion des CO₂-Ausstoßes müsse deutlich schneller voranschreiten', vocab:[{word:'Reduktion',type:'Nomen',meaning:'reduction'}] },
      { n:4, answer:'Vereinbarkeit', stmt:'Die ___(4)___ zwischen wirtschaftlichem Wachstum und ökologischer Nachhaltigkeit', evidence:'Die Vereinbarkeit zwischen wirtschaftlichem Wachstum und ökologischer Nachhaltigkeit', vocab:[{word:'Vereinbarkeit',type:'Nomen',meaning:'compatibility'}] },
      { n:5, answer:'Lösung', stmt:'Eine rein technologische ___(5)___ des Klimawandels', evidence:'technologische Lösung des Klimawandels', vocab:[{word:'Lösung',type:'Nomen',meaning:'solution'}] },
      { n:6, answer:'voranzutreiben', stmt:'um den ökologischen Umbau ___(6)___', evidence:'um den ökologischen Umbau voranzutreiben', vocab:[{word:'vorantreiben',type:'Verb',meaning:'to advance/push forward'}] },
      { n:7, answer:'organisierten', stmt:'Die von der Zivilgesellschaft ___(7)___ Protestbewegungen', evidence:'Die von der Zivilgesellschaft organisierten Protestbewegungen', vocab:[{word:'organisieren',type:'Verb',meaning:'to organize'}] },
      { n:8, answer:'eingehalten', stmt:'ob die vereinbarten Ziele tatsächlich ___(8)___ werden können', evidence:'ob die im Pariser Abkommen vereinbarten Ziele eingehalten werden können', vocab:[{word:'einhalten',type:'Verb',meaning:'to comply with'}] },
    ]
  },
  {
    exerciseId: 'C1-T1-012',
    texts: [{ id: 'TextA', type: 'sachtext', title: 'Demografischer Wandel und gesellschaftliche Folgen',
      content: 'Die ___(1)___ der Bevölkerungsstruktur in westlichen Industriestaaten hat weitreichende Konsequenzen. Die von Demografen ___(2)___ Projektionen weisen auf eine drastische Alterung der Gesellschaft hin. Soziologen betonen, die ___(3)___ der Sozialsysteme müsse angesichts sinkender Geburtenraten dringend reformiert werden. Die ___(4)___ zwischen Generationengerechtigkeit und fiskalischer Tragfähigkeit wird dabei immer drängender.\n\nEine rein ökonomische ___(5)___ des demografischen Wandels vernachlässigt dessen kulturelle und psychologische Dimensionen. Es bedarf ganzheitlicher Ansätze, um die Folgen angemessen ___(6)___. Die von Migrationsforschern ___(7)___ Potenziale qualifizierter Zuwanderung werden in der öffentlichen Debatte häufig unterschätzt. Ob ein nachhaltiges Rentenmodell ohne grundlegende Strukturreformen ___(8)___ werden kann, ist unter Experten strittig.' }],
    questions: [
      { n:1, answer:'Veränderung', stmt:'Die ___(1)___ der Bevölkerungsstruktur', evidence:'Die Veränderung der Bevölkerungsstruktur in westlichen Industriestaaten', vocab:[{word:'Bevölkerungsstruktur',type:'Nomen',meaning:'population structure'}] },
      { n:2, answer:'erstellten', stmt:'Die von Demografen ___(2)___ Projektionen', evidence:'Die von Demografen erstellten Projektionen', vocab:[{word:'erstellen',type:'Verb',meaning:'to create/compile'}] },
      { n:3, answer:'Finanzierung', stmt:'die ___(3)___ der Sozialsysteme müsse...reformiert werden', evidence:'die Finanzierung der Sozialsysteme müsse reformiert werden', vocab:[{word:'Finanzierung',type:'Nomen',meaning:'financing'}] },
      { n:4, answer:'Spannung', stmt:'Die ___(4)___ zwischen Generationengerechtigkeit und fiskalischer Tragfähigkeit', evidence:'Die Spannung zwischen Generationengerechtigkeit und fiskalischer Tragfähigkeit', vocab:[{word:'Tragfähigkeit',type:'Nomen',meaning:'sustainability'}] },
      { n:5, answer:'Betrachtung', stmt:'Eine rein ökonomische ___(5)___ des demografischen Wandels', evidence:'ökonomische Betrachtung des demografischen Wandels', vocab:[{word:'Betrachtung',type:'Nomen',meaning:'view/consideration'}] },
      { n:6, answer:'abzufedern', stmt:'um die Folgen angemessen ___(6)___', evidence:'um die Folgen angemessen abzufedern', vocab:[{word:'abfedern',type:'Verb',meaning:'to cushion/mitigate'}] },
      { n:7, answer:'hervorgehobenen', stmt:'Die von Migrationsforschern ___(7)___ Potenziale', evidence:'Die von Migrationsforschern hervorgehobenen Potenziale', vocab:[{word:'hervorheben',type:'Verb',meaning:'to emphasize'}] },
      { n:8, answer:'gewährleistet', stmt:'ob ein nachhaltiges Rentenmodell ___(8)___ werden kann', evidence:'ob ein nachhaltiges Rentenmodell gewährleistet werden kann', vocab:[{word:'gewährleisten',type:'Verb',meaning:'to guarantee'}] },
    ]
  },
]

async function main() {
  console.log('🚀 Seeding Reading Content — Batch 3 (C1-T1-009 to 012)')
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
  console.log('🎉 Batch 3 complete!')
}
main().catch(console.error).finally(() => prisma.$disconnect())
