/**
 * seed-exam-b1-lesen.ts — Goethe-Zertifikat B1 Lesen (Modellsatz)
 *
 * 5 Teile, 65 Minuten, 100 Punkte
 * Run: DATABASE_URL='...' npx tsx prisma/seed-exam-b1-lesen.ts
 */
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('📝 Seeding Goethe B1 Lesen Modellsatz...')

    // Upsert ExamTemplate
    const exam = await prisma.examTemplate.upsert({
        where: { slug: 'goethe-b1-lesen-modellsatz-1' },
        update: {},
        create: {
            slug: 'goethe-b1-lesen-modellsatz-1',
            title: 'Goethe-Zertifikat B1 — Lesen',
            examType: 'GOETHE',
            cefrLevel: 'B1',
            totalMinutes: 65,
            totalPoints: 100,
            passingScore: 60,
            description: 'Bài thi đọc hiểu B1 theo chuẩn Goethe-Institut. 5 phần, 30 câu hỏi.',
            status: 'PUBLISHED',
        },
    })

    // Delete old sections + tasks (cascade: answers → tasks → sections)
    const oldSections = await prisma.examSection.findMany({ where: { examId: exam.id }, select: { id: true } })
    if (oldSections.length > 0) {
        const sectionIds = oldSections.map(s => s.id)
        const oldTasks = await prisma.examTask.findMany({ where: { sectionId: { in: sectionIds } }, select: { id: true } })
        if (oldTasks.length > 0) {
            await prisma.examAnswer.deleteMany({ where: { taskId: { in: oldTasks.map(t => t.id) } } })
        }
        // Delete attempts for this exam too
        await prisma.examAttempt.deleteMany({ where: { examId: exam.id } })
        await prisma.examTask.deleteMany({ where: { sectionId: { in: sectionIds } } })
        await prisma.examSection.deleteMany({ where: { examId: exam.id } })
    }

    // Create section: Lesen
    const section = await prisma.examSection.create({
        data: {
            examId: exam.id,
            title: 'Lesen',
            skill: 'LESEN',
            totalMinutes: 65,
            totalPoints: 100,
            sortOrder: 1,
            instructions: 'Lesen Sie die Texte und lösen Sie die Aufgaben. Sie haben 65 Minuten Zeit.',
        },
    })

    // ===== TEIL 1: Blog — Richtig/Falsch (6 items × 3 pts = 18) =====
    await prisma.examTask.create({
        data: {
            sectionId: section.id,
            title: 'Teil 1 — Blog lesen',
            exerciseType: 'TRUE_FALSE',
            maxPoints: 18,
            sortOrder: 1,
            contentJson: {
                instructions: 'Lesen Sie den Text und die Aufgaben 1 bis 6. Wählen Sie: Richtig oder Falsch.',
                passage: `Mein erstes Jahr in Deutschland — Ein Blog von Maria

Liebe Leser,

vor einem Jahr bin ich aus Brasilien nach München gezogen. Ich wollte besser Deutsch lernen und hatte eine Stelle als Praktikantin bei einer kleinen Firma gefunden.

Am Anfang war alles sehr schwierig. Ich konnte zwar schon ein bisschen Deutsch, aber die Bayern sprechen ganz anders, als ich es in meinem Sprachkurs gelernt hatte. Meine Kollegen haben schnell gesprochen und ich habe oft nicht verstanden, was sie meinten. Aber sie waren alle sehr nett und haben mir geholfen.

Nach drei Monaten habe ich einen Deutschkurs an der Volkshochschule besucht. Der Kurs war abends, zweimal pro Woche. Dort habe ich auch andere Ausländer kennengelernt und wir haben zusammen geübt. Meine beste Freundin in Deutschland, Yuki aus Japan, habe ich dort getroffen.

Im Sommer bin ich viel mit dem Fahrrad gefahren. In München gibt es überall Radwege und man kann sogar bis zum See fahren. Das Wetter war wunderbar und ich habe die langen Abende genossen. In Brasilien wird es ja schon um 18 Uhr dunkel.

Jetzt fühle ich mich schon wie zu Hause. Ich verstehe fast alles und kann auch über komplizierte Themen sprechen. Nächsten Monat besuche ich meine Familie in São Paulo. Ich freue mich, aber ich weiß auch, dass München jetzt mein Zuhause ist.`,
                items: [
                    {
                        id: 't1-1',
                        statement: 'Maria ist vor einem Jahr nach Deutschland gekommen.',
                        correctAnswer: 'RICHTIG',
                        explanation: 'Text: "vor einem Jahr bin ich aus Brasilien nach München gezogen"'
                    },
                    {
                        id: 't1-2',
                        statement: 'Maria hat sofort alles auf Deutsch verstanden.',
                        correctAnswer: 'FALSCH',
                        explanation: 'Text: "Am Anfang war alles sehr schwierig" und "ich habe oft nicht verstanden"'
                    },
                    {
                        id: 't1-3',
                        statement: 'Marias Kollegen waren unfreundlich zu ihr.',
                        correctAnswer: 'FALSCH',
                        explanation: 'Text: "sie waren alle sehr nett und haben mir geholfen"'
                    },
                    {
                        id: 't1-4',
                        statement: 'Maria hat an der Volkshochschule einen Deutschkurs gemacht.',
                        correctAnswer: 'RICHTIG',
                        explanation: 'Text: "habe ich einen Deutschkurs an der Volkshochschule besucht"'
                    },
                    {
                        id: 't1-5',
                        statement: 'Yuki kommt aus China.',
                        correctAnswer: 'FALSCH',
                        explanation: 'Text: "Yuki aus Japan"'
                    },
                    {
                        id: 't1-6',
                        statement: 'Maria will nächsten Monat nach Brasilien fliegen.',
                        correctAnswer: 'RICHTIG',
                        explanation: 'Text: "Nächsten Monat besuche ich meine Familie in São Paulo"'
                    },
                ],
            },
        },
    })

    // ===== TEIL 2: Zeitungsartikel — MC (5 items × 4 pts = 20) =====
    await prisma.examTask.create({
        data: {
            sectionId: section.id,
            title: 'Teil 2 — Zeitungsartikel',
            exerciseType: 'MULTIPLE_CHOICE',
            maxPoints: 20,
            sortOrder: 2,
            contentJson: {
                instructions: 'Lesen Sie den Text und die Aufgaben 7 bis 12. Wählen Sie die richtige Antwort: A, B oder C.',
                passage: `Lernen mit dem Smartphone — Chance oder Problem?

Immer mehr Schulen in Deutschland erlauben das Smartphone im Unterricht. In Bayern dürfen Schüler seit diesem Schuljahr ihre Handys im Klassenzimmer benutzen — aber nur, wenn der Lehrer es erlaubt hat. Die Diskussion, ob digitale Geräte den Unterricht verbessern oder stören, ist in den letzten Jahren immer wichtiger geworden.

„Wir nutzen das Smartphone als Wörterbuch und als Rechner", erklärt Mathematiklehrerin Frau Berger aus Nürnberg. „Die Schüler können auch im Internet recherchieren und Lernvideos ansehen." In ihrer Klasse arbeiten die Schüler oft in kleinen Gruppen und erstellen gemeinsam Präsentationen auf ihren Geräten. Obwohl einige Eltern zunächst skeptisch waren, haben sie sich inzwischen davon überzeugt, dass die Methode funktioniert.

Aber nicht alle Lehrer sind begeistert. „Viele Schüler sind abgelenkt", sagt Herr Krause, ein Deutschlehrer in München. „Sie schauen heimlich auf Social Media oder schreiben Nachrichten." Weil die Ablenkung so groß sei, fordert er klare Regeln: Handys nur in bestimmten Stunden und nur für Schulaufgaben. Er hätte es am liebsten, wenn die Handys in den Pausen eingesammelt würden.

Eine aktuelle Studie der Universität Hamburg hat interessante Ergebnisse gezeigt: Schüler, die Lern-Apps nutzen, haben bessere Noten in Fremdsprachen. Aber gleichzeitig lesen diese Schüler weniger Bücher und können sich nicht so lange konzentrieren, weil sie ständig am Bildschirm sind.

Experten empfehlen deshalb einen Mittelweg: Smartphones im Unterricht ja, aber mit klaren Regeln und zeitlichen Grenzen. „Die Technik könnte den Unterricht besser machen, aber sie kann den Lehrer nicht ersetzen", sagt Bildungsforscher Professor Dr. Weber.`,
                items: [
                    {
                        id: 't2-1',
                        question: 'Seit wann dürfen Schüler in Bayern Handys im Unterricht nutzen?',
                        options: [
                            { key: 'A', text: 'Seit diesem Schuljahr' },
                            { key: 'B', text: 'Schon seit vielen Jahren' },
                            { key: 'C', text: 'Ab dem nächsten Schuljahr' },
                        ],
                        correctAnswer: 'A',
                        explanation: 'Text: "seit diesem Schuljahr ihre Handys im Klassenzimmer benutzen"'
                    },
                    {
                        id: 't2-2',
                        question: 'Wie nutzt Frau Berger das Smartphone im Unterricht?',
                        options: [
                            { key: 'A', text: 'Nur als Taschenrechner' },
                            { key: 'B', text: 'Für Wörterbuch, Recherche und Präsentationen' },
                            { key: 'C', text: 'Nur für Lernvideos' },
                        ],
                        correctAnswer: 'B',
                        explanation: 'Text: "als Wörterbuch und als Rechner... recherchieren... Lernvideos... Präsentationen"'
                    },
                    {
                        id: 't2-3',
                        question: 'Was kritisiert Herr Krause?',
                        options: [
                            { key: 'A', text: 'Die Smartphones sind zu teuer' },
                            { key: 'B', text: 'Die Lehrer können keine Apps nutzen' },
                            { key: 'C', text: 'Die Schüler lassen sich ablenken' },
                        ],
                        correctAnswer: 'C',
                        explanation: 'Text: "Viele Schüler sind abgelenkt... schauen heimlich auf Social Media"'
                    },
                    {
                        id: 't2-4',
                        question: 'Was zeigt die Studie der Universität Hamburg?',
                        options: [
                            { key: 'A', text: 'Lern-App-Nutzer haben bessere Noten in Fremdsprachen' },
                            { key: 'B', text: 'Alle Schüler brauchen ein Smartphone' },
                            { key: 'C', text: 'Smartphones sind schlecht für die Noten' },
                        ],
                        correctAnswer: 'A',
                        explanation: 'Text: "Schüler, die Lern-Apps nutzen, haben bessere Noten in Fremdsprachen"'
                    },
                    {
                        id: 't2-5',
                        question: 'Was empfehlen die Experten?',
                        options: [
                            { key: 'A', text: 'Smartphones komplett verbieten' },
                            { key: 'B', text: 'Smartphones ohne Einschränkung erlauben' },
                            { key: 'C', text: 'Smartphones mit klaren Regeln und Grenzen erlauben' },
                        ],
                        correctAnswer: 'C',
                        explanation: 'Text: "einen Mittelweg: Smartphones im Unterricht ja, aber mit klaren Regeln"'
                    },
                ],
            },
        },
    })

    // ===== TEIL 3: Anzeigen — Matching (7 items × 3 pts = 21) =====
    await prisma.examTask.create({
        data: {
            sectionId: section.id,
            title: 'Teil 3 — Anzeigensuche',
            exerciseType: 'MATCHING',
            maxPoints: 21,
            sortOrder: 3,
            contentJson: {
                instructions: 'Lesen Sie die Situationen 13 bis 19 und die Anzeigen A bis J. Finden Sie für jede Situation die passende Anzeige.',
                situations: [
                    { id: 's13', text: 'Ihr Freund sucht einen günstigen Sprachkurs am Abend.' },
                    { id: 's14', text: 'Sie möchten am Wochenende mit Ihren Kindern etwas unternehmen.' },
                    { id: 's15', text: 'Ihre Nachbarin sucht einen Teilzeitjob im Büro.' },
                    { id: 's16', text: 'Sie suchen ein möbliertes Zimmer in der Stadtmitte.' },
                    { id: 's17', text: 'Ihr Kollege möchte einen Kochkurs für Anfänger machen.' },
                    { id: 's18', text: 'Sie suchen ein gebrauchtes Fahrrad.' },
                    { id: 's19', text: 'Eine Freundin möchte ehrenamtlich Flüchtlingen helfen.' },
                ],
                options: [
                    { key: 'A', title: 'Sprachschule Luna', snippet: 'Deutsch-Abendkurse A1–B2, Mo+Mi 18–20 Uhr, ab 89€/Monat. Zentrale Lage, U-Bahn Marienplatz.' },
                    { key: 'B', title: 'Familienpark Süd', snippet: 'Jeden Samstag Kinderprogramm: Basteln, Spielplatz, Puppentheater. Eintritt frei für Kinder unter 12.' },
                    { key: 'C', title: 'Büro-Allrounder gesucht', snippet: 'Teilzeit 20h/Woche, Aufgaben: Telefon, E-Mails, Terminplanung. Gute Deutschkenntnisse nötig.' },
                    { key: 'D', title: 'WG-Zimmer frei', snippet: 'Möbliertes Zimmer (14 m²) in 3er-WG, Innenstadt, 450€ warm, ab sofort.' },
                    { key: 'E', title: 'Koch-Workshop: Italienisch', snippet: 'Für Anfänger! Pasta & Risotto selbst machen. Sa 10–14 Uhr, 35€ inkl. Zutaten.' },
                    { key: 'F', title: 'Fahrradflohmarkt', snippet: 'Gebrauchte Räder ab 30€. Jeden 1. Sonntag im Monat, Olympiapark, 9–15 Uhr.' },
                    { key: 'G', title: 'Ehrenamtliche Helfer gesucht', snippet: 'Deutschunterricht für Geflüchtete. 2 Stunden pro Woche, flexible Zeiten. Anmeldung: hilfe@caritas.de' },
                    { key: 'H', title: 'Fitnessstudio Power Gym', snippet: 'Neueröffnung! 1 Monat gratis testen. Kurse: Yoga, Spinning, Boxen. 7 Tage/Woche geöffnet.' },
                    { key: 'I', title: 'Nachhilfe Mathematik', snippet: 'Erfahrener Lehrer gibt Nachhilfe für Schüler (Klasse 5–10). 20€/Stunde.' },
                    { key: 'J', title: 'Hundeschule Bayernhof', snippet: 'Welpentraining und Erziehungskurse. Einzeln oder in Gruppen. Termine nach Vereinbarung.' },
                ],
                correctMapping: {
                    's13': 'A',
                    's14': 'B',
                    's15': 'C',
                    's16': 'D',
                    's17': 'E',
                    's18': 'F',
                    's19': 'G',
                },
            },
        },
    })

    // ===== TEIL 4: Leserbriefe — MC Meinungen (7 items × 3 pts = 21) =====
    await prisma.examTask.create({
        data: {
            sectionId: section.id,
            title: 'Teil 4 — Leserbriefe',
            exerciseType: 'MULTIPLE_CHOICE',
            maxPoints: 21,
            sortOrder: 4,
            contentJson: {
                instructions: 'Lesen Sie die Texte 20 bis 26. Zu welchem Thema schreibt die Person? Wählen Sie die richtige Antwort: A, B oder C.',
                passage: `Thema: Sollte man im Homeoffice arbeiten?

**Text A — Sabine, 34, Berlin:**
Ich arbeite seit zwei Jahren von zu Hause, weil meine Firma während der Pandemie das Homeoffice eingeführt hat. Am Anfang fand ich es toll — kein Pendeln, kein Stress in der U-Bahn. Aber jetzt fehlen mir die Kollegen. Man sitzt den ganzen Tag allein vor dem Computer. Manchmal rede ich stundenlang mit niemandem, obwohl ich eigentlich ein geselliger Mensch bin. Ich gehe jetzt wieder zwei Tage pro Woche ins Büro und bin viel zufriedener. Wenn ich die Wahl hätte, würde ich ein Mischmodell bevorzugen.

**Text B — Thomas, 41, Hamburg:**
Für mich ist Homeoffice perfekt, weil ich meine Arbeitszeit frei einteilen kann und viel produktiver bin. Morgens bringe ich die Kinder zur Schule, dann arbeite ich konzentriert von 9 bis 15 Uhr und hole sie nachmittags wieder ab. Im Büro wurde ich ständig gestört — durch Meetings, Telefonate und Kollegen. Bevor ich ins Homeoffice gewechselt bin, hatte ich oft das Gefühl, dass ich meine Zeit verschwendet habe.

**Text C — Petra, 28, München:**
Ich finde, es kommt auf den Job an. Als Grafikdesignerin kann ich gut von zu Hause arbeiten, wenn ich kreative Projekte habe. Aber mein Mann ist Krankenpfleger — er muss natürlich im Krankenhaus sein. Außerdem braucht man Disziplin: Wer zu Hause arbeitet, muss auch mal den Fernseher auslassen und sich konzentrieren. Es wäre besser, wenn die Arbeitgeber flexible Modelle anbieten würden, die zu jedem Beruf passen.`,
                items: [
                    {
                        id: 't4-1',
                        question: 'Sabine findet Homeoffice...',
                        options: [
                            { key: 'A', text: 'manchmal einsam' },
                            { key: 'B', text: 'immer noch sehr gut' },
                            { key: 'C', text: 'besser als im Büro' },
                        ],
                        correctAnswer: 'A',
                        explanation: 'Text A: "fehlen mir die Kollegen" + "sitzt den ganzen Tag allein"'
                    },
                    {
                        id: 't4-2',
                        question: 'Was macht Sabine jetzt?',
                        options: [
                            { key: 'A', text: 'Sie arbeitet nur noch im Büro' },
                            { key: 'B', text: 'Sie arbeitet teils im Büro, teils zu Hause' },
                            { key: 'C', text: 'Sie hat aufgehört zu arbeiten' },
                        ],
                        correctAnswer: 'B',
                        explanation: 'Text A: "gehe jetzt wieder zwei Tage pro Woche ins Büro"'
                    },
                    {
                        id: 't4-3',
                        question: 'Warum findet Thomas Homeoffice gut?',
                        options: [
                            { key: 'A', text: 'Er verdient mehr Geld' },
                            { key: 'B', text: 'Er trifft mehr Kollegen' },
                            { key: 'C', text: 'Er kann seine Zeit flexibel einteilen' },
                        ],
                        correctAnswer: 'C',
                        explanation: 'Text B: "Arbeitszeit frei einteilen" + "viel produktiver"'
                    },
                    {
                        id: 't4-4',
                        question: 'Was hat Thomas im Büro gestört?',
                        options: [
                            { key: 'A', text: 'Der Weg zur Arbeit' },
                            { key: 'B', text: 'Meetings, Anrufe und Kollegen' },
                            { key: 'C', text: 'Die schlechte Technik' },
                        ],
                        correctAnswer: 'B',
                        explanation: 'Text B: "ständig gestört — durch Meetings, Telefonate und Kollegen"'
                    },
                    {
                        id: 't4-5',
                        question: 'Petra meint, Homeoffice ist...',
                        options: [
                            { key: 'A', text: 'für alle Jobs geeignet' },
                            { key: 'B', text: 'für keinen Job geeignet' },
                            { key: 'C', text: 'nicht für jeden Job möglich' },
                        ],
                        correctAnswer: 'C',
                        explanation: 'Text C: "es kommt auf den Job an" + Beispiel Krankenpfleger'
                    },
                    {
                        id: 't4-6',
                        question: 'Was braucht man laut Petra für Homeoffice?',
                        options: [
                            { key: 'A', text: 'Selbstdisziplin' },
                            { key: 'B', text: 'Einen großen Schreibtisch' },
                            { key: 'C', text: 'Einen guten Computer' },
                        ],
                        correctAnswer: 'A',
                        explanation: 'Text C: "man braucht Disziplin"'
                    },
                    {
                        id: 't4-7',
                        question: 'Was wäre laut Petra die beste Lösung?',
                        options: [
                            { key: 'A', text: 'Alle sollten ins Büro gehen' },
                            { key: 'B', text: 'Flexible Modelle für jeden Beruf' },
                            { key: 'C', text: 'Nur Krankenpfleger sollten ins Büro' },
                        ],
                        correctAnswer: 'B',
                        explanation: 'Text C: "Es wäre besser, wenn die Arbeitgeber flexible Modelle anbieten würden"'
                    },
                ],
            },
        },
    })

    // ===== TEIL 5: Anleitung — Richtig/Falsch (5 items × 4 pts = 20) =====
    await prisma.examTask.create({
        data: {
            sectionId: section.id,
            title: 'Teil 5 — Hausordnung',
            exerciseType: 'TRUE_FALSE',
            maxPoints: 20,
            sortOrder: 5,
            contentJson: {
                instructions: 'Lesen Sie die Hausordnung und die Aufgaben 27 bis 31. Wählen Sie: Richtig oder Falsch.',
                passage: `Hausordnung — Wohngemeinschaft Lindenstraße 42

1. Ruhezeiten: Bitte halten Sie die Ruhezeiten ein: werktags von 22.00 bis 7.00 Uhr, an Sonn- und Feiertagen ganztags. Laute Musik und Partys sind während dieser Zeiten nicht erlaubt. Wenn Sie eine Party planen möchten, müssten Sie das mindestens eine Woche vorher mit allen Bewohnern absprechen.

2. Küche: Die Küche ist ein Gemeinschaftsraum, der von allen sauber gehalten werden muss. Bitte räumen Sie Ihr Geschirr sofort nach dem Essen ab und stellen Sie es in die Spülmaschine. Der Kühlschrank wird jeden Sonntagabend überprüft — nicht beschriftete Lebensmittel werden entsorgt, weil es in der Vergangenheit häufig Probleme mit verdorbenen Lebensmitteln gegeben hat.

3. Bad: Jeder Bewohner hat einen festen Badezimmer-Zeitslot am Morgen (siehe Aushang). Am Abend kann das Bad frei genutzt werden. Bitte putzen Sie die Dusche nach jeder Benutzung, damit der nächste Bewohner sie sauber vorfindet.

4. Müll: Der Müll wird getrennt (Papier, Plastik, Bio, Restmüll). Die Tonnen stehen im Hof. Der Müllplan hängt in der Küche aus — bitte halten Sie sich daran. Wenn jemand seinen Mülldienst nicht machen kann, sollte er rechtzeitig einen Tauschpartner finden.

5. Gäste: Gäste dürfen gerne zu Besuch kommen, aber bitte informieren Sie Ihre Mitbewohner vorher. Übernachtungsgäste sind maximal 3 Nächte pro Monat erlaubt.

6. Haustiere: Haustiere sind nur nach Absprache mit allen Bewohnern erlaubt. Wenn ein Mitbewohner allergisch wäre, hätte das Tier leider keinen Platz in der WG.`,
                items: [
                    {
                        id: 't5-1',
                        statement: 'Man darf am Samstagabend um 23 Uhr laute Musik hören.',
                        correctAnswer: 'FALSCH',
                        explanation: 'Ruhezeit werktags ab 22:00 Uhr. Samstag ist ein Werktag — also ab 22 Uhr Ruhe.'
                    },
                    {
                        id: 't5-2',
                        statement: 'Lebensmittel ohne Namen werden am Sonntag weggeworfen.',
                        correctAnswer: 'RICHTIG',
                        explanation: 'Text: "jeden Sonntagabend überprüft — nicht beschriftete Lebensmittel werden entsorgt"'
                    },
                    {
                        id: 't5-3',
                        statement: 'Am Abend kann man das Bad jederzeit benutzen.',
                        correctAnswer: 'RICHTIG',
                        explanation: 'Text: "Am Abend kann das Bad frei genutzt werden"'
                    },
                    {
                        id: 't5-4',
                        statement: 'Freunde dürfen so lange bleiben, wie sie möchten.',
                        correctAnswer: 'FALSCH',
                        explanation: 'Text: "Übernachtungsgäste sind maximal 3 Nächte pro Monat erlaubt"'
                    },
                    {
                        id: 't5-5',
                        statement: 'Man kann eine Party machen, wenn man es vorher mit den Mitbewohnern bespricht.',
                        correctAnswer: 'RICHTIG',
                        explanation: 'Text: "Wenn Sie eine Party planen möchten, müssten Sie das mindestens eine Woche vorher mit allen Bewohnern absprechen."'
                    },
                ],
            },
        },
    })

    console.log(`✅ Goethe B1 Lesen seeded: ${exam.id}`)
    console.log('   5 Teile: TF(18) + MC(20) + Matching(21) + MC(21) + TF(20) = 100 pts')
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect())
