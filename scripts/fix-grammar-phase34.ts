/**
 * Phase 3: Add descriptions for topics missing them
 * Phase 4: Fix DEV topic
 */
import { PrismaClient } from '../apps/web/generated/prisma'
const prisma = new PrismaClient()

// Descriptions for each topic based on their grammar concept
const DESCRIPTIONS: Record<string, string> = {
  // A1 Gen1 topics (missing descriptions)
  'dev-praesens': 'Entwickler-Testthema für Präsens-Konjugation.',
  'a1-praesens': 'Konjugation der regelmäßigen Verben im Präsens: ich mache, du machst, er/sie/es macht, etc.',
  'a1-sein-haben': 'Die wichtigsten Verben "sein" (ich bin) und "haben" (ich habe) — unregelmäßige Konjugation im Präsens.',
  'a1-personalpronomen': 'Personalpronomen: ich, du, er, sie, es, wir, ihr, sie/Sie — und ihre Verwendung.',
  'a1-w-fragen': 'W-Fragen: Wer? Was? Wo? Woher? Wie? Warum? Wann? — Fragepronomen und Satzstellung.',
  'a1-satzstellung': 'Das Verb steht immer an Position 2 (V2-Regel). Beispiel: Ich gehe heute ins Kino.',

  // A2 topics
  'a2-perfekt-haben': 'Perfekt mit "haben": ich habe gemacht, du hast geschrieben — für die meisten Verben.',
  'a2-perfekt-sein': 'Perfekt mit "sein": ich bin gegangen, du bist gefahren — für Bewegungs- und Zustandsverben.',
  'a2-dativ': 'Der Dativ (3. Fall): dem Mann, der Frau, dem Kind — mit Verben wie geben, helfen, gehören.',
  'a2-nebensatz-weil': 'Kausale Nebensätze mit "weil": Das Verb steht am Ende. Ich bleibe zu Hause, weil ich krank bin.',
  'a2-nebensatz-dass': 'Dass-Sätze: Das Verb steht am Ende. Ich glaube, dass er kommt.',
  'a2-imperativ': 'Aufforderungen und Bitten: Komm! Kommen Sie! Kommt! — Bildung des Imperativs.',
  'a2-komparativ': 'Vergleiche und Steigerung: schön → schöner → am schönsten. Sonderformen: gut → besser → am besten.',
  'a2-praeteritum': 'Einfache Vergangenheit mit "war" und "hatte": Ich war müde. Ich hatte Hunger.',
  'a2-reflexivverben': 'Verben mit Reflexivpronomen: sich waschen, sich freuen, sich ärgern — Akkusativ und Dativ.',

  // B1 topics
  'b1-konjunktiv2': 'Konjunktiv II für irreale Wünsche und höfliche Bitten: Ich würde gern..., Wenn ich reich wäre...',
  'b1-passiv': 'Vorgangspassiv: Das Haus wird gebaut. — Bildung mit werden + Partizip II.',
  'b1-relativsaetze': 'Relativsätze: Der Mann, der dort steht, ist mein Lehrer. — Relativpronomen der/die/das.',
  'b1-nebensatz-wenn-als': '"wenn" für Wiederholtes/Zukünftiges, "als" für einmaliges Vergangenes.',
  'b1-adjektivdeklination': 'Adjektivdeklination nach bestimmtem, unbestimmtem und Null-Artikel: der große Mann, ein großer Mann.',
  'b1-genitiv': 'Der Genitiv (2. Fall): des Mannes, der Frau — Besitz und Zugehörigkeit.',
  'b1-plusquamperfekt': 'Plusquamperfekt: Vorvergangenheit. Nachdem ich gegessen hatte, ging ich spazieren.',
  'b1-futur1': 'Futur I: werden + Infinitiv. Ich werde morgen kommen. Auch für Vermutungen.',
  'b1-indirekte-fragen': 'Indirekte Fragen: Können Sie mir sagen, wo der Bahnhof ist? — Verb am Ende.',

  // B2 topics
  'b2-konjunktiv2-vergangenheit': 'Konjunktiv II der Vergangenheit: Wenn ich das gewusst hätte, wäre ich gekommen.',
  'b2-passiv-modal': 'Passiv mit Modalverben: Das muss gemacht werden. Der Brief kann geschickt werden.',
  'b2-partizip-adjektiv': 'Partizip I/II als Adjektiv: das fahrende Auto (P.I), die geschlossene Tür (P.II).',
  'b2-konnektoren': 'Erweiterte Konnektoren: obwohl, trotzdem, deshalb, infolgedessen, allerdings, dennoch.',
  'b2-doppelkonjunktionen': 'Doppelkonjunktionen: sowohl...als auch, weder...noch, nicht nur...sondern auch, je...desto.',
  'b2-nominalisierung': 'Nominalisierung: Verben und Adjektive werden zu Nomen. das Lesen, die Schönheit, das Arbeiten.',
  'b2-n-deklination': 'Schwache Nomen (n-Deklination): der Mensch → den Menschen, dem Menschen, des Menschen.',
  'b2-futur2': 'Futur II: werden + Partizip II + haben/sein. Er wird schon angekommen sein.',
  'b2-praeteritum-stark': 'Präteritum starker Verben: gehen→ging, fahren→fuhr, sprechen→sprach — Stammvokaländerung.',

  // C1 topics
  'c1-konjunktiv1': 'Konjunktiv I für indirekte Rede: Er sagt, er sei krank. Sie meint, er habe recht.',
  'c1-passiv-alternativen': 'Alternativen zum Passiv: sich lassen + Inf., sein + zu + Inf., -bar/-lich Adjektive.',
  'c1-subjektive-modalverben': 'Subjektive Bedeutung der Modalverben: Er muss krank sein (Vermutung). Er will es gesehen haben.',
  'c1-nomen-verb-verbindungen': 'Feste Nomen-Verb-Verbindungen: in Betracht ziehen, zur Verfügung stellen, Bescheid sagen.',
  'c1-erweiterte-konnektoren': 'Erweiterte Konnektoren: zumal, insofern, nichtsdestotrotz, dessen ungeachtet.',
  'c1-modalpartikeln': 'Modalpartikeln: doch, mal, ja, eben, halt, wohl, eigentlich — Nuancen im Gespräch.',
  'c1-praep-genitiv-erweitert': 'Erweiterte Genitivpräpositionen: angesichts, anlässlich, infolge, kraft, aufgrund.',
  'c1-verbvalenz': 'Verbvalenz: Welche Ergänzungen verlangt ein Verb? Akkusativ, Dativ, Präpositional, Genitiv.',

  // C2 topics
  'c2-erw-partizipialkonstruktionen': 'Erweiterte Partizipialkonstruktionen: Das seit Jahren diskutierte Problem → Partizipialattribut statt Relativsatz.',
  'c2-nominalstil-verbalstil': 'Nominalstil vs. Verbalstil: Die Durchführung der Maßnahme ↔ Die Maßnahme wird durchgeführt.',
  'c2-irreale-vergleichssaetze': 'Irreale Vergleichssätze: als ob, als wenn, als + Konjunktiv II. Er tut, als ob er nichts wüsste.',
  'c2-subjektloses-passiv': 'Subjektlose Passivkonstruktionen: Es wurde getanzt. Hier wird nicht geraucht.',
  'c2-erweiterte-wortbildung': 'Erweiterte Wortbildung: Komposition, Derivation, Konversion — Produktive Muster im Deutschen.',
  'c2-textkohaerenz': 'Textkohärenz und Kohäsion: Thema-Rhema-Gliederung, Konnektoren, Pro-Formen, Wiederaufnahme.',
  'c2-stilistik-register': 'Stilistik und Register: wissenschaftlich, journalistisch, umgangssprachlich — Stilebenen erkennen und anwenden.',
  'c2-konjunktiv1-erweitert': 'Erweiterter Konjunktiv I: Sonderformen, Ersatzformen, Verwendung in Fachliteratur und Presse.',
}

async function main() {
  console.log('🔧 Phase 3: Adding descriptions...\n')

  const topics = await prisma.grammarTopic.findMany()
  let updated = 0

  for (const t of topics) {
    if (!t.description && DESCRIPTIONS[t.slug]) {
      await prisma.grammarTopic.update({
        where: { id: t.id },
        data: { description: DESCRIPTIONS[t.slug] }
      })
      updated++
    }
  }
  console.log(`✅ Added descriptions to ${updated} topics`)

  // ==========================================
  // Phase 4: Fix DEV topic
  // ==========================================
  console.log('\n🔧 Phase 4: Fixing DEV topic...\n')

  // Set dev-praesens to DRAFT
  const devTopic = await prisma.grammarTopic.findUnique({ where: { slug: 'dev-praesens' } })
  if (devTopic) {
    await prisma.grammarTopic.update({
      where: { id: devTopic.id },
      data: { status: 'DRAFT' }
    })
    console.log('✅ dev-praesens → DRAFT')
  }

  // Fix dev lesson exercise
  const devLesson = await prisma.grammarLesson.findUnique({ where: { id: 'dev-a1-praesens-01' } })
  if (devLesson) {
    await prisma.grammarLesson.update({
      where: { id: devLesson.id },
      data: {
        status: 'DRAFT',
        exercisesJson: [{
          id: 'dev-ex-01',
          type: 'multiple_choice',
          question_de: 'Ich ___ Deutsch.',
          question_vi: 'Tôi ___ tiếng Đức.',
          options: ['lerne', 'lernst', 'lernt', 'lernen'],
          answer: ['lerne'],
          explanation_vi: 'ich → lerne (ngôi 1 số ít).',
          tags: ['praesens'],
          difficulty: 1,
        }],
        theoryJson: { blocks: [
          { type: 'rule', formula: 'ich -e | du -st | er/sie/es -t | wir -en | ihr -t | sie -en', text_vi: 'Chia động từ quy tắc ở thì hiện tại (Präsens).' },
        ]},
      }
    })
    console.log('✅ dev-a1-praesens-01: Fixed exercise type + added theory')
  }

  console.log('\n🎉 Phase 3 + 4 complete!')
}

main().catch(console.error).finally(() => prisma.$disconnect())
