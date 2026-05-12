/**
 * Seed Reading Content — Batch 1: C1 Teil 1 (Lückentext Wörter) exercises 001-004
 */
import { PrismaClient } from '../apps/web/generated/prisma'
const prisma = new PrismaClient()

interface ExData {
  exerciseId: string
  texts: any[]
  questions: any[]
}

const batch: ExData[] = [
  {
    exerciseId: 'C1-T1-001',
    texts: [{
      id: 'TextA', type: 'sachtext', title: 'Ethik im Zeitalter der Künstlichen Intelligenz',
      content: 'Die ___(1)___ ethischer Grundsätze auf technologische Innovationen stellt die moderne Philosophie vor erhebliche Herausforderungen. Insbesondere die von Wissenschaftlern ___(2)___ Fortschritte im Bereich der Künstlichen Intelligenz werfen Fragen auf, die weit über traditionelle moralische Kategorien hinausgehen. Experten zufolge ___(3)___ eine grundlegende Neubewertung des Verhältnisses zwischen Mensch und Maschine unausweichlich. Die ___(4)___ dieser Debatte lässt sich kaum überschätzen, da sie sämtliche Lebensbereiche betrifft.\n\nKritiker argumentieren, dass die rein utilitaristische ___(5)___ moralischer Dilemmata der Komplexität menschlicher Wertvorstellungen nicht gerecht werde. Es sei vielmehr notwendig, einen differenzierten Ansatz zu ___(6)___, der sowohl deontologische als auch tugendethische Perspektiven berücksichtige. Die von der Gesellschaft ___(7)___ Verantwortung für technologische Entwicklungen ist dabei nicht zu unterschätzen. Letztlich bleibt die Frage, ob moralisches Handeln durch Algorithmen ___(8)___ werden kann, eine der drängendsten unserer Zeit.'
    }],
    questions: [
      { n: 1, answer: 'Anwendung', stmt: 'Die ___(1)___ ethischer Grundsätze auf technologische Innovationen...', evidence: 'Anwendung ethischer Grundsätze auf technologische Innovationen', vocab: [{word:'Anwendung',type:'Nomen',meaning:'application'}] },
      { n: 2, answer: 'erzielten', stmt: 'die von Wissenschaftlern ___(2)___ Fortschritte', evidence: 'die von Wissenschaftlern erzielten Fortschritte im Bereich der KI', vocab: [{word:'erzielen',type:'Verb',meaning:'to achieve'}] },
      { n: 3, answer: 'sei', stmt: 'Experten zufolge ___(3)___ eine grundlegende Neubewertung...unausweichlich', evidence: 'sei eine grundlegende Neubewertung des Verhältnisses...unausweichlich', vocab: [{word:'unausweichlich',type:'Adjektiv',meaning:'inevitable'}] },
      { n: 4, answer: 'Tragweite', stmt: 'Die ___(4)___ dieser Debatte lässt sich kaum überschätzen', evidence: 'Die Tragweite dieser Debatte lässt sich kaum überschätzen', vocab: [{word:'Tragweite',type:'Nomen',meaning:'significance/scope'}] },
      { n: 5, answer: 'Betrachtung', stmt: 'die rein utilitaristische ___(5)___ moralischer Dilemmata', evidence: 'utilitaristische Betrachtung moralischer Dilemmata', vocab: [{word:'Betrachtung',type:'Nomen',meaning:'consideration'}] },
      { n: 6, answer: 'verfolgen', stmt: 'einen differenzierten Ansatz zu ___(6)___', evidence: 'einen differenzierten Ansatz zu verfolgen', vocab: [{word:'verfolgen',type:'Verb',meaning:'to pursue'}] },
      { n: 7, answer: 'getragene', stmt: 'Die von der Gesellschaft ___(7)___ Verantwortung', evidence: 'Die von der Gesellschaft getragene Verantwortung', vocab: [{word:'getragen',type:'Partizip II',meaning:'borne/carried'}] },
      { n: 8, answer: 'ersetzt', stmt: 'ob moralisches Handeln durch Algorithmen ___(8)___ werden kann', evidence: 'ob moralisches Handeln durch Algorithmen ersetzt werden kann', vocab: [{word:'ersetzen',type:'Verb',meaning:'to replace'}] },
    ]
  },
  {
    exerciseId: 'C1-T1-002',
    texts: [{
      id: 'TextA', type: 'sachtext', title: 'Globale Finanzmärkte im Wandel',
      content: 'Die ___(1)___ der internationalen Finanzmärkte hat in den vergangenen Jahrzehnten dramatisch zugenommen. Die von Zentralbanken ___(2)___ Maßnahmen zur Stabilisierung der Wirtschaft stoßen zunehmend an ihre Grenzen. Analysten zufolge ___(3)___ eine grundlegende Reform des bestehenden Systems dringend erforderlich. Die ___(4)___ zwischen Geldpolitik und realwirtschaftlicher Entwicklung wird dabei häufig unterschätzt.\n\nDie rein marktwirtschaftliche ___(5)___ ökonomischer Prozesse berücksichtigt nach Ansicht vieler Experten die sozialen Folgen unzureichend. Es gilt daher, alternative Modelle zu ___(6)___, die ökologische und soziale Nachhaltigkeit einbeziehen. Die von den Regierungen ___(7)___ Regulierungsversuche sind bislang jedoch nur teilweise wirksam. Ob ein gerechtes Wirtschaftssystem ohne tiefgreifende strukturelle Veränderungen ___(8)___ werden kann, bleibt offen.'
    }],
    questions: [
      { n: 1, answer: 'Verflechtung', stmt: 'Die ___(1)___ der internationalen Finanzmärkte', evidence: 'Die Verflechtung der internationalen Finanzmärkte hat dramatisch zugenommen', vocab: [{word:'Verflechtung',type:'Nomen',meaning:'interconnection'}] },
      { n: 2, answer: 'ergriffenen', stmt: 'Die von Zentralbanken ___(2)___ Maßnahmen', evidence: 'Die von Zentralbanken ergriffenen Maßnahmen', vocab: [{word:'ergreifen',type:'Verb',meaning:'to take/seize'}] },
      { n: 3, answer: 'sei', stmt: 'Analysten zufolge ___(3)___ eine grundlegende Reform...erforderlich', evidence: 'sei eine grundlegende Reform dringend erforderlich', vocab: [{word:'erforderlich',type:'Adjektiv',meaning:'necessary'}] },
      { n: 4, answer: 'Wechselwirkung', stmt: 'Die ___(4)___ zwischen Geldpolitik und realwirtschaftlicher Entwicklung', evidence: 'Die Wechselwirkung zwischen Geldpolitik und realwirtschaftlicher Entwicklung', vocab: [{word:'Wechselwirkung',type:'Nomen',meaning:'interaction'}] },
      { n: 5, answer: 'Betrachtung', stmt: 'Die rein marktwirtschaftliche ___(5)___ ökonomischer Prozesse', evidence: 'marktwirtschaftliche Betrachtung ökonomischer Prozesse', vocab: [{word:'Betrachtung',type:'Nomen',meaning:'consideration'}] },
      { n: 6, answer: 'entwickeln', stmt: 'alternative Modelle zu ___(6)___', evidence: 'alternative Modelle zu entwickeln', vocab: [{word:'entwickeln',type:'Verb',meaning:'to develop'}] },
      { n: 7, answer: 'unternommenen', stmt: 'Die von den Regierungen ___(7)___ Regulierungsversuche', evidence: 'Die von den Regierungen unternommenen Regulierungsversuche', vocab: [{word:'unternommen',type:'Partizip II',meaning:'undertaken'}] },
      { n: 8, answer: 'erreicht', stmt: 'ohne tiefgreifende strukturelle Veränderungen ___(8)___ werden kann', evidence: 'ob ein gerechtes Wirtschaftssystem erreicht werden kann', vocab: [{word:'erreichen',type:'Verb',meaning:'to achieve'}] },
    ]
  },
  {
    exerciseId: 'C1-T1-003',
    texts: [{
      id: 'TextA', type: 'sachtext', title: 'Die Bedeutung literarischer Mehrsprachigkeit',
      content: 'Die ___(1)___ sprachlicher Vielfalt in der modernen Literatur spiegelt gesellschaftliche Veränderungen wider. Die von mehrsprachigen Autoren ___(2)___ Werke eröffnen neue Perspektiven auf kulturelle Identität und Zugehörigkeit. Literaturwissenschaftler betonen, die sprachliche Hybridität ___(3)___ als Bereicherung und nicht als Abweichung zu verstehen. Die ___(4)___ dieser Entwicklung für den literarischen Kanon lässt sich nicht ignorieren.\n\nDie ausschließlich einsprachige ___(5)___ literarischer Texte greift nach heutigem Verständnis zu kurz. Es ist notwendig, neue analytische Werkzeuge zu ___(6)___, die der Komplexität mehrsprachiger Erzählstrukturen Rechnung tragen. Die von Übersetzern ___(7)___ Herausforderungen verdeutlichen dabei die Grenzen sprachlicher Übertragbarkeit. Ob die volle Ausdruckskraft eines mehrsprachigen Textes jemals vollständig ___(8)___ werden kann, bleibt eine offene Frage.'
    }],
    questions: [
      { n: 1, answer: 'Anerkennung', stmt: 'Die ___(1)___ sprachlicher Vielfalt in der modernen Literatur', evidence: 'Die Anerkennung sprachlicher Vielfalt', vocab: [{word:'Anerkennung',type:'Nomen',meaning:'recognition'}] },
      { n: 2, answer: 'verfassten', stmt: 'Die von mehrsprachigen Autoren ___(2)___ Werke', evidence: 'Die von mehrsprachigen Autoren verfassten Werke', vocab: [{word:'verfassen',type:'Verb',meaning:'to compose/write'}] },
      { n: 3, answer: 'sei', stmt: 'die sprachliche Hybridität ___(3)___ als Bereicherung...zu verstehen', evidence: 'sei als Bereicherung und nicht als Abweichung zu verstehen', vocab: [{word:'Bereicherung',type:'Nomen',meaning:'enrichment'}] },
      { n: 4, answer: 'Bedeutung', stmt: 'Die ___(4)___ dieser Entwicklung für den literarischen Kanon', evidence: 'Die Bedeutung dieser Entwicklung lässt sich nicht ignorieren', vocab: [{word:'Bedeutung',type:'Nomen',meaning:'significance'}] },
      { n: 5, answer: 'Analyse', stmt: 'Die ausschließlich einsprachige ___(5)___ literarischer Texte', evidence: 'einsprachige Analyse literarischer Texte greift zu kurz', vocab: [{word:'Analyse',type:'Nomen',meaning:'analysis'}] },
      { n: 6, answer: 'schaffen', stmt: 'neue analytische Werkzeuge zu ___(6)___', evidence: 'neue analytische Werkzeuge zu schaffen', vocab: [{word:'schaffen',type:'Verb',meaning:'to create'}] },
      { n: 7, answer: 'bewältigten', stmt: 'Die von Übersetzern ___(7)___ Herausforderungen', evidence: 'Die von Übersetzern bewältigten Herausforderungen', vocab: [{word:'bewältigen',type:'Verb',meaning:'to cope with'}] },
      { n: 8, answer: 'übertragen', stmt: 'ob die volle Ausdruckskraft ___(8)___ werden kann', evidence: 'vollständig übertragen werden kann', vocab: [{word:'übertragen',type:'Verb',meaning:'to transfer/translate'}] },
    ]
  },
  {
    exerciseId: 'C1-T1-004',
    texts: [{
      id: 'TextA', type: 'sachtext', title: 'Nachhaltige Architektur und urbane Transformation',
      content: 'Die ___(1)___ nachhaltiger Bauprinzipien in die moderne Stadtplanung erfordert ein grundlegendes Umdenken. Die von Architekten ___(2)___ innovativen Konzepte zielen darauf ab, ökologische und soziale Bedürfnisse in Einklang zu bringen. Städteplaner betonen, die ___(3)___ urbaner Räume müsse künftig stärker an klimatischen Erfordernissen ausgerichtet sein. Die ___(4)___ zwischen Verdichtung und Lebensqualität stellt dabei die zentrale Herausforderung dar.\n\nEine rein funktionalistische ___(5)___ städtebaulicher Probleme vernachlässigt die kulturelle Dimension des gebauten Raums. Es bedarf vielmehr interdisziplinärer Ansätze, um zukunftsfähige Lösungen zu ___(6)___. Die von Bewohnern ___(7)___ Bedürfnisse sollten stärker in Planungsprozesse einfließen. Ob eine vollständig klimaneutrale Bauweise in absehbarer Zeit ___(8)___ werden kann, ist derzeit noch ungewiss.'
    }],
    questions: [
      { n: 1, answer: 'Integration', stmt: 'Die ___(1)___ nachhaltiger Bauprinzipien', evidence: 'Die Integration nachhaltiger Bauprinzipien in die moderne Stadtplanung', vocab: [{word:'Integration',type:'Nomen',meaning:'integration'}] },
      { n: 2, answer: 'entwickelten', stmt: 'Die von Architekten ___(2)___ innovativen Konzepte', evidence: 'Die von Architekten entwickelten innovativen Konzepte', vocab: [{word:'entwickeln',type:'Verb',meaning:'to develop'}] },
      { n: 3, answer: 'Gestaltung', stmt: 'die ___(3)___ urbaner Räume müsse künftig...ausgerichtet sein', evidence: 'die Gestaltung urbaner Räume müsse künftig stärker ausgerichtet sein', vocab: [{word:'Gestaltung',type:'Nomen',meaning:'design/shaping'}] },
      { n: 4, answer: 'Abwägung', stmt: 'Die ___(4)___ zwischen Verdichtung und Lebensqualität', evidence: 'Die Abwägung zwischen Verdichtung und Lebensqualität', vocab: [{word:'Abwägung',type:'Nomen',meaning:'weighing/balancing'}] },
      { n: 5, answer: 'Betrachtung', stmt: 'Eine rein funktionalistische ___(5)___ städtebaulicher Probleme', evidence: 'funktionalistische Betrachtung städtebaulicher Probleme', vocab: [{word:'Betrachtung',type:'Nomen',meaning:'view/consideration'}] },
      { n: 6, answer: 'erarbeiten', stmt: 'um zukunftsfähige Lösungen zu ___(6)___', evidence: 'um zukunftsfähige Lösungen zu erarbeiten', vocab: [{word:'erarbeiten',type:'Verb',meaning:'to work out'}] },
      { n: 7, answer: 'geäußerten', stmt: 'Die von Bewohnern ___(7)___ Bedürfnisse', evidence: 'Die von Bewohnern geäußerten Bedürfnisse', vocab: [{word:'äußern',type:'Verb',meaning:'to express'}] },
      { n: 8, answer: 'umgesetzt', stmt: 'ob eine klimaneutrale Bauweise ___(8)___ werden kann', evidence: 'ob eine vollständig klimaneutrale Bauweise umgesetzt werden kann', vocab: [{word:'umsetzen',type:'Verb',meaning:'to implement'}] },
    ]
  },
]

async function main() {
  console.log('🚀 Seeding Reading Content — Batch 1 (C1-T1-001 to 004)')
  for (const entry of batch) {
    const ex = await prisma.readingExercise.findFirst({ where: { exerciseId: entry.exerciseId }, include: { questions: true } })
    if (!ex) { console.log(`⏭️ ${entry.exerciseId} not found, skipping`); continue }
    if (ex.questions.length > 0) { console.log(`⏭️ ${entry.exerciseId} already has questions, skipping`); continue }

    await prisma.readingExercise.update({ where: { id: ex.id }, data: { textsJson: entry.texts } })
    for (const q of entry.questions) {
      await prisma.readingQuestion.create({
        data: {
          exerciseId: ex.id, questionNumber: q.n, questionType: 'lueckentext',
          linkedText: 'TextA', statement: q.stmt, options: null,
          correctAnswer: q.answer, points: 1, sortOrder: q.n,
          explanation: { reasoning: `Das fehlende Wort "${q.answer}" ergibt sich aus dem grammatischen und inhaltlichen Kontext.`, key_evidence: q.evidence, key_vocabulary: q.vocab }
        }
      })
    }
    console.log(`✅ ${entry.exerciseId} — ${entry.texts[0].title}`)
  }
  console.log('🎉 Batch 1 complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
