/**
 * seed-exam-b1-hoeren.ts — Goethe-Zertifikat B1 Hören (Modellsatz)
 *
 * 4 Teile, 40 Minuten, 100 Punkte
 * Adds Hören section to existing B1 exam template.
 * Audio: uses passage text for on-demand TTS via /api/v1/tts
 *
 * Run: DATABASE_URL='...' npx tsx prisma/seed-exam-b1-hoeren.ts
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('🎧 Seeding Goethe B1 Hören Modellsatz...')

    // Find existing B1 exam template
    const exam = await prisma.examTemplate.findUnique({
        where: { slug: 'goethe-b1-lesen-modellsatz-1' },
    })
    if (!exam) {
        console.error('❌ Exam template not found. Run seed-exam-b1-lesen.ts first.')
        process.exit(1)
    }

    // Delete old Hören section if exists
    const oldSections = await prisma.examSection.findMany({
        where: { examId: exam.id, skill: 'HOEREN' },
        select: { id: true },
    })
    if (oldSections.length > 0) {
        const sectionIds = oldSections.map(s => s.id)
        const oldTasks = await prisma.examTask.findMany({ where: { sectionId: { in: sectionIds } }, select: { id: true } })
        if (oldTasks.length > 0) {
            await prisma.examAnswer.deleteMany({ where: { taskId: { in: oldTasks.map(t => t.id) } } })
        }
        await prisma.examTask.deleteMany({ where: { sectionId: { in: sectionIds } } })
        await prisma.examSection.deleteMany({ where: { id: { in: sectionIds } } })
    }

    // Update exam template for Lesen + Hören
    await prisma.examTemplate.update({
        where: { id: exam.id },
        data: {
            title: 'Goethe-Zertifikat B1 — Lesen + Hören',
            totalMinutes: 105, // 65 + 40
            totalPoints: 200,  // 100 + 100
            description: 'Bài thi đọc hiểu + nghe hiểu B1 theo chuẩn Goethe-Institut. Lesen: 5 phần, Hören: 4 phần.',
        },
    })

    // Create Hören section
    const section = await prisma.examSection.create({
        data: {
            examId: exam.id,
            title: 'Hören',
            skill: 'HOEREN',
            totalMinutes: 40,
            totalPoints: 100,
            sortOrder: 2,
            instructions: 'Sie hören mehrere Texte. Lesen Sie zuerst die Aufgaben, hören Sie dann den Text dazu. Sie haben 40 Minuten Zeit.',
        },
    })

    // ===== TEIL 1: Kurze Ansagen — Richtig/Falsch (10 items × 2 pts = 20) =====
    await prisma.examTask.create({
        data: {
            sectionId: section.id,
            title: 'Teil 1 — Kurze Ansagen',
            exerciseType: 'TRUE_FALSE',
            maxPoints: 20,
            sortOrder: 1,
            contentJson: {
                instructions: 'Sie hören fünf kurze Texte. Sie hören jeden Text zweimal. Wählen Sie für die Aufgaben 1 bis 10: Richtig oder Falsch.',
                audioTranscript: `Ansage 1:
Achtung, eine Durchsage am Bahnhof München Hauptbahnhof. Weil es Probleme mit der Weiche gibt, fährt der ICE 587 nach Berlin heute nicht von Gleis 14, sondern von Gleis 8 ab. Wir bitten um Ihr Verständnis und hoffen, dass die Reparatur bald abgeschlossen sein wird.

Ansage 2:
Liebe Kundinnen und Kunden! Da wir letzte Woche unsere Inventur abgeschlossen haben, veranstalten wir heute einen Sonderverkauf. Alle Winterjacken sind 50 Prozent reduziert. Das Angebot gilt nur heute bis 20 Uhr. Sie finden die Jacken in der zweiten Etage, wenn Sie die Rolltreppe nach oben nehmen.

Ansage 3:
Hallo, hier ist die Arztpraxis Dr. Müller. Leider können wir Ihren Anruf gerade nicht entgegennehmen, weil alle Mitarbeiter mit Patienten beschäftigt sind. Unsere Sprechzeiten sind Montag bis Freitag von 8 bis 12 Uhr und Dienstag und Donnerstag auch nachmittags von 14 bis 17 Uhr. Es wäre nett, wenn Sie uns eine Nachricht hinterlassen würden.

Ansage 4:
Willkommen im Stadtmuseum. Die aktuelle Ausstellung „Leben in München 1900" ist noch bis Ende März zu sehen. Die Museumsleitung hat beschlossen, dass Führungen täglich um 11 und um 15 Uhr stattfinden werden. Der Eintritt kostet 8 Euro für Erwachsene, Kinder unter 12 Jahren sind frei, weil wir Bildung für Kinder fördern möchten.

Ansage 5:
Liebe Fahrgäste, aufgrund von Bauarbeiten, die gestern begonnen haben, ist die U-Bahn-Linie U3 zwischen Marienplatz und Münchner Freiheit heute ab 21 Uhr gesperrt. Obwohl die Arbeiten eigentlich erst nächste Woche geplant waren, mussten sie vorgezogen werden. Bitte nutzen Sie den Ersatzbus, der an allen Haltestellen hält.`,
                passage: 'Hören Sie die Ansagen und beantworten Sie die Fragen.',
                items: [
                    { id: 'h1-1', statement: 'Der Zug nach Berlin fährt von Gleis 14.', correctAnswer: 'FALSCH', explanation: 'Er fährt von Gleis 8, nicht Gleis 14.' },
                    { id: 'h1-2', statement: 'Der Zug fährt nach Berlin.', correctAnswer: 'RICHTIG', explanation: 'ICE 587 nach Berlin.' },
                    { id: 'h1-3', statement: 'Die Winterjacken kosten die Hälfte.', correctAnswer: 'RICHTIG', explanation: '50 Prozent reduziert = die Hälfte.' },
                    { id: 'h1-4', statement: 'Der Sonderverkauf dauert die ganze Woche.', correctAnswer: 'FALSCH', explanation: 'Nur heute bis 20 Uhr.' },
                    { id: 'h1-5', statement: 'Die Arztpraxis ist am Mittwochnachmittag geöffnet.', correctAnswer: 'FALSCH', explanation: 'Nachmittags nur Di + Do.' },
                    { id: 'h1-6', statement: 'Man kann eine Nachricht hinterlassen.', correctAnswer: 'RICHTIG', explanation: 'Bitte hinterlassen Sie eine Nachricht.' },
                    { id: 'h1-7', statement: 'Die Ausstellung im Museum endet im April.', correctAnswer: 'FALSCH', explanation: 'Bis Ende März, nicht April.' },
                    { id: 'h1-8', statement: 'Kinder unter 12 müssen keinen Eintritt zahlen.', correctAnswer: 'RICHTIG', explanation: 'Kinder unter 12 Jahren sind frei.' },
                    { id: 'h1-9', statement: 'Die U3 ist den ganzen Tag gesperrt.', correctAnswer: 'FALSCH', explanation: 'Nur ab 21 Uhr gesperrt.' },
                    { id: 'h1-10', statement: 'Es gibt einen Ersatzbus.', correctAnswer: 'RICHTIG', explanation: 'Bitte nutzen Sie den Ersatzbus.' },
                ],
            },
        },
    })

    // ===== TEIL 2: Längeres Gespräch — MC (5 items × 5 pts = 25) =====
    await prisma.examTask.create({
        data: {
            sectionId: section.id,
            title: 'Teil 2 — Gespräch',
            exerciseType: 'MULTIPLE_CHOICE',
            maxPoints: 25,
            sortOrder: 2,
            contentJson: {
                instructions: 'Sie hören ein Gespräch. Sie hören das Gespräch einmal. Wählen Sie für die Aufgaben 11 bis 15 die richtige Antwort.',
                audioTranscript: `Moderator: Guten Tag, liebe Hörerinnen und Hörer! Heute spreche ich mit Herrn Schneider, der seit 20 Jahren als Bäcker arbeitet. Herr Schneider, wann beginnt Ihr Arbeitstag?

Herr Schneider: Ich stehe jeden Tag um halb drei auf. Um drei Uhr bin ich in der Backstube. Zuerst machen wir die Brötchen, dann das Brot. Die müssen ja frisch sein, wenn der Laden um sechs aufmacht.

Moderator: Das ist sehr früh! Ist das nicht schwierig?

Herr Schneider: Am Anfang war es furchtbar. Aber nach ein paar Jahren gewöhnt man sich daran. Ich gehe dafür abends schon um acht ins Bett. Am Wochenende schlafe ich manchmal bis sieben — das fühlt sich dann an wie Urlaub! Was mich stört, ist eher, dass ich an Wochenenden und Feiertagen arbeiten muss. Da haben andere frei und ich stehe in der Backstube.

Moderator: Warum sind Sie Bäcker geworden?

Herr Schneider: Mein Vater war Bäcker, mein Großvater auch. Ich bin damit aufgewachsen. Als Kind habe ich schon in der Backstube gespielt. Aber ich habe den Beruf nicht nur wegen der Familie gewählt. Mir macht das Handwerk wirklich Spaß. Wenn ich morgens sehe, wie die Leute mein frisches Brot kaufen und sich freuen — das ist ein tolles Gefühl.

Moderator: Hat sich der Beruf verändert?

Herr Schneider: Ja, sehr sogar. Heute kaufen viele Leute beim Discounter oder im Supermarkt. Dort kostet ein Brot manchmal nur einen Euro. Bei mir kostet es drei Euro, aber dafür ist es handgemacht, ohne Zusatzstoffe. Glücklicherweise gibt es immer mehr Kunden, die Qualität schätzen. Gerade junge Leute achten heute mehr auf gesunde Ernährung.`,
                passage: 'Ein Interview mit einem Bäcker im Radio.',
                items: [
                    {
                        id: 'h2-1',
                        question: 'Wann steht Herr Schneider auf?',
                        options: [
                            { key: 'A', text: 'Um drei Uhr' },
                            { key: 'B', text: 'Um halb drei' },
                            { key: 'C', text: 'Um sechs Uhr' },
                        ],
                        correctAnswer: 'B',
                        explanation: '"Ich stehe jeden Tag um halb drei auf."'
                    },
                    {
                        id: 'h2-2',
                        question: 'Was stört Herrn Schneider am meisten?',
                        options: [
                            { key: 'A', text: 'Das frühe Aufstehen' },
                            { key: 'B', text: 'Die Arbeit am Wochenende' },
                            { key: 'C', text: 'Die niedrigen Löhne' },
                        ],
                        correctAnswer: 'B',
                        explanation: '"Was mich stört, ist eher, dass ich an Wochenenden und Feiertagen arbeiten muss."'
                    },
                    {
                        id: 'h2-3',
                        question: 'Warum ist Herr Schneider Bäcker geworden?',
                        options: [
                            { key: 'A', text: 'Nur wegen der Familientradition' },
                            { key: 'B', text: 'Weil er viel Geld verdienen wollte' },
                            { key: 'C', text: 'Wegen der Familie und weil ihm das Handwerk Spaß macht' },
                        ],
                        correctAnswer: 'C',
                        explanation: '"nicht nur wegen der Familie... Mir macht das Handwerk wirklich Spaß."'
                    },
                    {
                        id: 'h2-4',
                        question: 'Was kostet ein Brot bei Herrn Schneider?',
                        options: [
                            { key: 'A', text: 'Einen Euro' },
                            { key: 'B', text: 'Zwei Euro' },
                            { key: 'C', text: 'Drei Euro' },
                        ],
                        correctAnswer: 'C',
                        explanation: '"Bei mir kostet es drei Euro."'
                    },
                    {
                        id: 'h2-5',
                        question: 'Wie hat sich der Beruf verändert?',
                        options: [
                            { key: 'A', text: 'Es gibt weniger Bäckereien, aber junge Leute achten auf Qualität' },
                            { key: 'B', text: 'Alle kaufen nur noch beim Bäcker' },
                            { key: 'C', text: 'Das Handwerk ist einfacher geworden' },
                        ],
                        correctAnswer: 'A',
                        explanation: '"Viele kaufen beim Discounter... aber junge Leute achten auf gesunde Ernährung."'
                    },
                ],
            },
        },
    })

    // ===== TEIL 3: Interview — Richtig/Falsch (7 items × 5 pts = 35) =====
    await prisma.examTask.create({
        data: {
            sectionId: section.id,
            title: 'Teil 3 — Interview',
            exerciseType: 'TRUE_FALSE',
            maxPoints: 35,
            sortOrder: 3,
            contentJson: {
                instructions: 'Sie hören ein Gespräch zwischen zwei Personen. Sie hören das Gespräch einmal. Wählen Sie: Richtig oder Falsch.',
                audioTranscript: `Anna: Hallo, Markus! Schön, dich hier im Café zu treffen. Wie geht's dir?

Markus: Hi Anna! Mir geht's super. Ich habe gerade meine letzte Prüfung geschrieben und jetzt habe ich endlich Semesterferien.

Anna: Herzlichen Glückwunsch! Was hast du in den Ferien vor?

Markus: Erstmal will ich mich ein bisschen ausruhen. Die letzten Wochen waren wirklich stressig. Dann fahre ich mit meiner Freundin nach Kroatien. Wir haben ein kleines Apartment direkt am Meer gemietet.

Anna: Wie schön! Wie lange bleibt ihr dort?

Markus: Zwei Wochen. Vom 15. Juli bis zum 29. Juli. Danach muss ich leider arbeiten. Ich habe einen Ferienjob in einem Buchladen gefunden.

Anna: Ein Buchladen? Das passt ja gut zu dir, du liest ja immer so viel!

Markus: Ja, genau. Es ist ein kleiner, unabhängiger Laden in der Altstadt. Der Besitzer, Herr Weber, ist total nett. Er zahlt zwar nicht so viel — 12 Euro die Stunde — aber dafür kann ich so viele Bücher lesen, wie ich möchte, und bekomme 20 Prozent Mitarbeiterrabatt.

Anna: Das klingt doch toll! Und was machst du nach den Ferien?

Markus: Dann geht das Studium weiter. Ich bin jetzt im vierten Semester Germanistik. Nächstes Semester habe ich ein Praktikum bei einer Zeitung. Ich überlege tatsächlich, ob ich Journalist werden möchte. Aber das entscheide ich später.

Anna: Das würde bestimmt gut zu dir passen. Du schreibst ja auch für die Uni-Zeitung.

Markus: Stimmt, seit zwei Semestern schon. Das macht mir wirklich Spaß.`,
                passage: 'Ein Gespräch zwischen Anna und Markus im Café.',
                items: [
                    { id: 'h3-1', statement: 'Markus hat seine Prüfungen schon beendet.', correctAnswer: 'RICHTIG', explanation: '"Ich habe gerade meine letzte Prüfung geschrieben."' },
                    { id: 'h3-2', statement: 'Markus fährt allein nach Kroatien.', correctAnswer: 'FALSCH', explanation: '"Ich fahre mit meiner Freundin nach Kroatien."' },
                    { id: 'h3-3', statement: 'Der Urlaub in Kroatien dauert drei Wochen.', correctAnswer: 'FALSCH', explanation: 'Zwei Wochen: 15. bis 29. Juli.' },
                    { id: 'h3-4', statement: 'Markus arbeitet in einem großen Buchgeschäft.', correctAnswer: 'FALSCH', explanation: '"Ein kleiner, unabhängiger Laden in der Altstadt."' },
                    { id: 'h3-5', statement: 'Markus bekommt Rabatt auf Bücher.', correctAnswer: 'RICHTIG', explanation: '"20 Prozent Mitarbeiterrabatt."' },
                    { id: 'h3-6', statement: 'Markus studiert im vierten Semester.', correctAnswer: 'RICHTIG', explanation: '"Ich bin jetzt im vierten Semester Germanistik."' },
                    { id: 'h3-7', statement: 'Markus hat sich schon entschieden, Journalist zu werden.', correctAnswer: 'FALSCH', explanation: '"Ich überlege tatsächlich... das entscheide ich später."' },
                ],
            },
        },
    })

    // ===== TEIL 4: Vortrag — MC (4 items × 5 pts = 20) =====
    await prisma.examTask.create({
        data: {
            sectionId: section.id,
            title: 'Teil 4 — Vortrag',
            exerciseType: 'MULTIPLE_CHOICE',
            maxPoints: 20,
            sortOrder: 4,
            contentJson: {
                instructions: 'Sie hören einen kurzen Vortrag. Sie hören den Vortrag einmal. Wählen Sie für die Aufgaben die richtige Antwort.',
                audioTranscript: `Guten Abend, meine Damen und Herren. Vielen Dank, dass Sie heute Abend zu meinem Vortrag zum Thema „Nachhaltig leben in der Stadt" gekommen sind.

Wir alle wissen: Der Klimawandel ist real und wir müssen etwas tun. Aber was kann man als einzelne Person im Alltag machen? Ich möchte Ihnen heute drei einfache Bereiche vorstellen.

Erstens: Mobilität. In deutschen Städten werden 45 Prozent aller Fahrten mit dem Auto gemacht, obwohl die Hälfte davon kürzer als fünf Kilometer ist. Mein Vorschlag: Steigen Sie für kurze Strecken auf das Fahrrad um oder gehen Sie zu Fuß. Seit München sein Radwegenetz ausgebaut hat, fahren 30 Prozent mehr Menschen mit dem Rad.

Zweitens: Ernährung. Die Lebensmittelproduktion verursacht etwa ein Viertel aller Treibhausgase weltweit. Regional und saisonal einzukaufen hilft enorm. Ein Apfel aus dem Alten Land bei Hamburg hat eine viel bessere CO2-Bilanz als einer aus Neuseeland. Außerdem: Weniger Fleisch essen macht einen großen Unterschied. Man muss nicht Vegetarier werden, aber ein oder zwei fleischfreie Tage pro Woche helfen schon.

Drittens: Energie zu Hause. Heizen ist der größte Energieverbraucher im Haushalt. Schon wenn Sie die Raumtemperatur um nur ein Grad senken, sparen Sie sechs Prozent Energie. LED-Lampen verbrauchen 80 Prozent weniger Strom als normale Glühbirnen.

Zusammenfassend: Man muss nicht perfekt sein. Jeder kleine Schritt zählt. Wenn Sie morgen anfangen, das Fahrrad zu nehmen, regional einzukaufen und die Heizung etwas runterzudrehen, haben Sie schon viel erreicht. Vielen Dank.`,
                passage: 'Ein Vortrag zum Thema „Nachhaltig leben in der Stadt".',
                items: [
                    {
                        id: 'h4-1',
                        question: 'Was ist das Hauptthema des Vortrags?',
                        options: [
                            { key: 'A', text: 'Wie man als Einzelperson nachhaltiger leben kann' },
                            { key: 'B', text: 'Wie man in der Stadt günstig leben kann' },
                            { key: 'C', text: 'Warum man aufs Land ziehen sollte' },
                        ],
                        correctAnswer: 'A',
                        explanation: 'Thema: "Nachhaltig leben in der Stadt" — was kann man als einzelne Person tun.'
                    },
                    {
                        id: 'h4-2',
                        question: 'Was sagt der Sprecher über Autofahrten in deutschen Städten?',
                        options: [
                            { key: 'A', text: 'Die meisten sind länger als 10 Kilometer' },
                            { key: 'B', text: 'Fast die Hälfte ist kürzer als 5 Kilometer' },
                            { key: 'C', text: 'Nur 20 Prozent fahren mit dem Auto' },
                        ],
                        correctAnswer: 'B',
                        explanation: '"Die Hälfte davon kürzer als fünf Kilometer."'
                    },
                    {
                        id: 'h4-3',
                        question: 'Was empfiehlt der Sprecher bei der Ernährung?',
                        options: [
                            { key: 'A', text: 'Sofort Vegetarier werden' },
                            { key: 'B', text: 'Nur Bio-Produkte kaufen' },
                            { key: 'C', text: 'Regional einkaufen und weniger Fleisch essen' },
                        ],
                        correctAnswer: 'C',
                        explanation: '"Regional und saisonal einkaufen... weniger Fleisch essen."'
                    },
                    {
                        id: 'h4-4',
                        question: 'Wie viel Energie spart man, wenn man die Temperatur um ein Grad senkt?',
                        options: [
                            { key: 'A', text: '3 Prozent' },
                            { key: 'B', text: '6 Prozent' },
                            { key: 'C', text: '10 Prozent' },
                        ],
                        correctAnswer: 'B',
                        explanation: '"Die Raumtemperatur um nur ein Grad senken — sechs Prozent Energie sparen."'
                    },
                ],
            },
        },
    })

    console.log(`✅ Goethe B1 Hören seeded under exam: ${exam.id}`)
    console.log('   4 Teile: TF(20) + MC(25) + TF(35) + MC(20) = 100 pts')
    console.log('   Exam updated: Lesen + Hören, 105 min, 200 pts')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
