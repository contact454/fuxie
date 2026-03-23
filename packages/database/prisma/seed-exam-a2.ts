/**
 * seed-exam-a2.ts — Goethe-Zertifikat A2
 *
 * Lesen: 4 Teile, 30 min, 75 pts
 * Hören: 4 Teile, 30 min, 75 pts
 * Total: 60 min, 150 pts, 60% pass
 *
 * Run: DATABASE_URL='...' npx tsx packages/database/prisma/seed-exam-a2.ts
 */
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('📝 Seeding Goethe A2...')

    const exam = await prisma.examTemplate.upsert({
        where: { slug: 'goethe-a2-modellsatz-1' },
        update: {
            title: 'Goethe-Zertifikat A2 — Lesen + Hören',
            totalMinutes: 60, totalPoints: 150, passingScore: 60,
            description: 'Bài thi A2 theo chuẩn Goethe-Institut. Lesen: 4 phần, Hören: 4 phần.',
        },
        create: {
            slug: 'goethe-a2-modellsatz-1',
            title: 'Goethe-Zertifikat A2 — Lesen + Hören',
            examType: 'GOETHE', cefrLevel: 'A2',
            totalMinutes: 60, totalPoints: 150, passingScore: 60,
            description: 'Bài thi A2 theo chuẩn Goethe-Institut. Lesen: 4 phần, Hören: 4 phần.',
            status: 'PUBLISHED',
        },
    })

    // Cascade delete
    const oldSections = await prisma.examSection.findMany({ where: { examId: exam.id }, select: { id: true } })
    if (oldSections.length > 0) {
        const sids = oldSections.map(s => s.id)
        const oldTasks = await prisma.examTask.findMany({ where: { sectionId: { in: sids } }, select: { id: true } })
        if (oldTasks.length > 0) await prisma.examAnswer.deleteMany({ where: { taskId: { in: oldTasks.map(t => t.id) } } })
        await prisma.examAttempt.deleteMany({ where: { examId: exam.id } })
        await prisma.examTask.deleteMany({ where: { sectionId: { in: sids } } })
        await prisma.examSection.deleteMany({ where: { examId: exam.id } })
    }

    // ══════════ LESEN 30 min, 75 pts ══════════
    const lesen = await prisma.examSection.create({
        data: { examId: exam.id, title: 'Lesen', skill: 'LESEN', totalMinutes: 30, totalPoints: 75, sortOrder: 1,
            instructions: 'Lesen Sie die Texte und lösen Sie die Aufgaben. Sie haben 30 Minuten Zeit.' },
    })

    // L1: Zeitungsartikel — TF (5×3=15)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 1 — Zeitungsmeldung', exerciseType: 'TRUE_FALSE', maxPoints: 15, sortOrder: 1,
        contentJson: {
            instructions: 'Lesen Sie den Text. Wählen Sie: Richtig oder Falsch.',
            passage: `Neue Fahrradwege in der Stadt

Die Stadtverwaltung hat letzte Woche neue Fahrradwege eröffnet. Die Wege sind insgesamt 12 Kilometer lang und verbinden die Innenstadt mit den Vororten im Norden und Süden.

„Wir haben zwei Jahre an diesem Projekt gearbeitet", sagte Bürgermeisterin Frau Hoffmann. „Jetzt können die Bürger sicher mit dem Fahrrad zur Arbeit und zum Einkaufen fahren."

Besonders Familien freuen sich: Die Wege sind breit genug für Fahrräder mit Kindersitzern. Am Wochenende haben schon über 500 Menschen die neuen Wege benutzt.

Die Stadt plant außerdem, im nächsten Jahr 200 neue Fahrradparkplätze am Bahnhof und an Schulen zu bauen.`,
            items: [
                { id: 'a2l1-1', statement: 'Die neuen Fahrradwege sind 12 Kilometer lang.', correctAnswer: 'RICHTIG', explanation: '12 Kilometer lang.' },
                { id: 'a2l1-2', statement: 'Das Projekt hat ein Jahr gedauert.', correctAnswer: 'FALSCH', explanation: 'Zwei Jahre.' },
                { id: 'a2l1-3', statement: 'Die Wege sind nur für Erwachsene.', correctAnswer: 'FALSCH', explanation: 'Auch für Familien mit Kindersitzern.' },
                { id: 'a2l1-4', statement: 'Am Wochenende haben viele Leute die Wege benutzt.', correctAnswer: 'RICHTIG', explanation: 'Über 500 Menschen.' },
                { id: 'a2l1-5', statement: 'Die Stadt baut neue Parkplätze für Autos.', correctAnswer: 'FALSCH', explanation: 'Fahrradparkplätze, nicht Autoparkplätze.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // L2: Magazinartikel — MC (5×4=20)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 2 — Magazinartikel', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 20, sortOrder: 2,
        contentJson: {
            instructions: 'Lesen Sie den Text. Wählen Sie die richtige Antwort.',
            passage: `Kochen lernen im Internet

Immer mehr Deutsche lernen kochen im Internet. Besonders beliebt sind Koch-Videos auf YouTube. Die Köchin Lisa Wagner hat über 2 Millionen Follower. Sie zeigt einfache Rezepte, die man in 30 Minuten kochen kann.

„Am Anfang habe ich nur für meine Freunde gekocht", erzählt Lisa. „Dann hat meine Schwester gesagt: Du musst Videos machen!" Das erste Video hat sie im Mai 2020 hochgeladen. Heute veröffentlicht sie jede Woche drei neue Rezepte.

Das Besondere: Lisa kocht nur mit Zutaten, die man im normalen Supermarkt kaufen kann. „Ich möchte zeigen, dass gutes Essen nicht teuer sein muss", sagt sie.

Viele Zuschauer schreiben ihr Kommentare. Ein Fan hat geschrieben: „Dank Lisas Videos habe ich zum ersten Mal Brot gebacken. Meine Familie war begeistert!"`,
            items: [
                { id: 'a2l2-1', question: 'Wie viele Follower hat Lisa Wagner?', options: [
                    { key: 'A', text: 'Über 2 Millionen' }, { key: 'B', text: 'Über 1 Million' }, { key: 'C', text: 'Über 500.000' },
                ], correctAnswer: 'A', explanation: 'Über 2 Millionen Follower.' },
                { id: 'a2l2-2', question: 'Wer hat Lisa empfohlen, Videos zu machen?', options: [
                    { key: 'A', text: 'Ihre Mutter' }, { key: 'B', text: 'Ihre Freunde' }, { key: 'C', text: 'Ihre Schwester' },
                ], correctAnswer: 'C', explanation: 'Ihre Schwester hat gesagt: Du musst Videos machen!' },
                { id: 'a2l2-3', question: 'Wie oft macht Lisa neue Videos?', options: [
                    { key: 'A', text: 'Jeden Tag' }, { key: 'B', text: 'Dreimal pro Woche' }, { key: 'C', text: 'Einmal pro Monat' },
                ], correctAnswer: 'B', explanation: 'Jede Woche drei neue Rezepte.' },
                { id: 'a2l2-4', question: 'Was ist besonders an Lisas Rezepten?', options: [
                    { key: 'A', text: 'Sie benutzt teure Zutaten' }, { key: 'B', text: 'Sie kocht nur Desserts' }, { key: 'C', text: 'Die Zutaten gibt es im normalen Supermarkt' },
                ], correctAnswer: 'C', explanation: 'Nur Zutaten aus dem normalen Supermarkt.' },
                { id: 'a2l2-5', question: 'Was hat ein Fan zum ersten Mal gemacht?', options: [
                    { key: 'A', text: 'Brot gebacken' }, { key: 'B', text: 'Ein Video gemacht' }, { key: 'C', text: 'Im Restaurant gegessen' },
                ], correctAnswer: 'A', explanation: 'Zum ersten Mal Brot gebacken.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // L3: Anzeigen — Matching (7×3=21)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 3 — Anzeigen', exerciseType: 'MATCHING', maxPoints: 21, sortOrder: 3,
        contentJson: {
            instructions: 'Lesen Sie die Situationen und die Anzeigen. Welche Anzeige passt?',
            situations: [
                { id: 'a2s1', text: 'Sie möchten am Wochenende wandern gehen.' },
                { id: 'a2s2', text: 'Ihr Kind braucht Nachhilfe in Englisch.' },
                { id: 'a2s3', text: 'Sie möchten gebrauchte Möbel kaufen.' },
                { id: 'a2s4', text: 'Sie suchen einen Tanzkurs.' },
                { id: 'a2s5', text: 'Ihr Hund braucht einen Tierarzt.' },
                { id: 'a2s6', text: 'Sie möchten Deutsch lernen.' },
                { id: 'a2s7', text: 'Sie suchen eine Putzfrau.' },
            ],
            options: [
                { key: 'A', title: 'Wanderverein Alpenfreunde', snippet: 'Jeden Samstag Wanderung, 10–16 Uhr. Alle sind willkommen! Treffpunkt: Hauptbahnhof.' },
                { key: 'B', title: 'Nachhilfe Englisch', snippet: 'Erfahrene Lehrerin, Klasse 5–10. 15€/Stunde. Auch online! Tel: 0171-9876543' },
                { key: 'C', title: 'Second-Hand-Möbel', snippet: 'Sofas, Tische, Schränke — gut erhalten und günstig. Lieferung möglich.' },
                { key: 'D', title: 'Tanzschule Rhythmus', snippet: 'Salsa, Walzer, HipHop. Anfängerkurse ab Januar. Paare und Singles willkommen.' },
                { key: 'E', title: 'Tierarztpraxis Dr. Fuchs', snippet: 'Für Hunde, Katzen und Kleintiere. Mo–Sa 8–18 Uhr. Notdienst am Wochenende.' },
                { key: 'F', title: 'Sprachschule International', snippet: 'Deutschkurse A1–C1, morgens, nachmittags oder abends. Kleine Gruppen, max. 12 Teilnehmer.' },
                { key: 'G', title: 'Reinigungsservice Sauber', snippet: 'Wohnungsreinigung, Büroreinigung. Einmal oder regelmäßig. Faire Preise.' },
                { key: 'H', title: 'Fotokurs für Anfänger', snippet: 'Lernen Sie fotografieren! 6 Abende, ab 5. Februar. Kamera nicht nötig.' },
            ],
            correctMapping: { 'a2s1': 'A', 'a2s2': 'B', 'a2s3': 'C', 'a2s4': 'D', 'a2s5': 'E', 'a2s6': 'F', 'a2s7': 'G' },
        } satisfies Prisma.InputJsonValue,
    } })

    // L4: Anleitung — TF (5→19 pts → total 75)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 4 — Hausregeln', exerciseType: 'TRUE_FALSE', maxPoints: 19, sortOrder: 4,
        contentJson: {
            instructions: 'Lesen Sie die Regeln. Wählen Sie: Richtig oder Falsch.',
            passage: `Regeln für das Fitnessstudio „FitPlus"

1. Mitglieder müssen ihren Ausweis an der Rezeption zeigen. Ohne Ausweis ist der Eintritt leider nicht möglich.

2. Bitte bringen Sie ein Handtuch mit und legen Sie es auf die Geräte. Das ist aus hygienischen Gründen sehr wichtig.

3. Die Umkleidekabinen schließen um 22 Uhr. Bitte verlassen Sie das Studio bis 22:30 Uhr.

4. Das Training mit einem Trainer ist in den ersten drei Wochen kostenlos. Danach kostet es 20 Euro pro Stunde.

5. Getränke können Sie an der Bar kaufen. Eigene Glasflaschen sind im Trainingsraum nicht erlaubt. Bitte benutzen Sie Plastikflaschen.

6. Kinder unter 16 Jahren dürfen nur mit einem Erwachsenen trainieren.`,
            items: [
                { id: 'a2l4-1', statement: 'Man braucht keinen Ausweis für das Fitnessstudio.', correctAnswer: 'FALSCH', explanation: 'Ausweis an der Rezeption zeigen.' },
                { id: 'a2l4-2', statement: 'Man muss ein Handtuch mitbringen.', correctAnswer: 'RICHTIG', explanation: 'Bitte bringen Sie ein Handtuch mit.' },
                { id: 'a2l4-3', statement: 'Das Training mit einem Trainer ist immer kostenlos.', correctAnswer: 'FALSCH', explanation: 'Nur in den ersten drei Wochen kostenlos.' },
                { id: 'a2l4-4', statement: 'Man darf Glasflaschen in den Trainingsraum bringen.', correctAnswer: 'FALSCH', explanation: 'Glasflaschen sind nicht erlaubt.' },
                { id: 'a2l4-5', statement: 'Kinder unter 16 brauchen einen Erwachsenen.', correctAnswer: 'RICHTIG', explanation: 'Kinder unter 16 nur mit einem Erwachsenen.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // ══════════ HÖREN 30 min, 75 pts ══════════
    const hoeren = await prisma.examSection.create({
        data: { examId: exam.id, title: 'Hören', skill: 'HOEREN', totalMinutes: 30, totalPoints: 75, sortOrder: 2,
            instructions: 'Sie hören mehrere Texte. Lösen Sie die Aufgaben.' },
    })

    // H1: Radionachrichten — TF (5×3=15)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 1 — Radiomeldungen', exerciseType: 'TRUE_FALSE', maxPoints: 15, sortOrder: 1,
        contentJson: {
            instructions: 'Sie hören fünf kurze Texte aus dem Radio. Wählen Sie: Richtig oder Falsch.',
            audioTranscript: `Meldung 1:
Der Wetterbericht für morgen: Am Vormittag ist es noch sonnig, aber am Nachmittag kommen Wolken. Am Abend hat es dann angefangen zu regnen. Die Temperaturen liegen bei 15 Grad.

Meldung 2:
Die Stadtbibliothek hat ihre Öffnungszeiten geändert. Ab nächster Woche ist die Bibliothek auch am Samstag von 10 bis 16 Uhr geöffnet. Bisher war sie am Samstag geschlossen.

Meldung 3:
Am Wochenende findet der große Flohmarkt im Stadtpark statt. Er beginnt am Samstag um 8 Uhr und dauert bis Sonntag 18 Uhr. Der Eintritt ist wie immer frei.

Meldung 4:
Die Polizei sucht einen Hund. Der braune Labrador ist gestern Abend in der Schillerstraße weggelaufen. Wenn Sie den Hund gesehen haben, rufen Sie bitte die Nummer 110 an.

Meldung 5:
Das Restaurant „Zum Goldenen Löwen" hat nach der Renovierung wieder geöffnet. Zur Feier gibt es diese Woche alle Hauptgerichte zum halben Preis.`,
            passage: 'Hören Sie die Radionachrichten.',
            items: [
                { id: 'a2h1-1', statement: 'Morgen regnet es den ganzen Tag.', correctAnswer: 'FALSCH', explanation: 'Nur am Abend Regen.' },
                { id: 'a2h1-2', statement: 'Die Bibliothek ist bald auch am Samstag geöffnet.', correctAnswer: 'RICHTIG', explanation: 'Ab nächster Woche am Samstag.' },
                { id: 'a2h1-3', statement: 'Der Flohmarkt kostet Eintritt.', correctAnswer: 'FALSCH', explanation: 'Eintritt ist frei.' },
                { id: 'a2h1-4', statement: 'Die Polizei sucht eine Katze.', correctAnswer: 'FALSCH', explanation: 'Einen Hund (Labrador).' },
                { id: 'a2h1-5', statement: 'Das Restaurant hat diese Woche günstigere Preise.', correctAnswer: 'RICHTIG', explanation: 'Alle Hauptgerichte zum halben Preis.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // H2: Interview — MC (5×4=20)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 2 — Interview', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 20, sortOrder: 2,
        contentJson: {
            instructions: 'Sie hören ein Interview. Wählen Sie die richtige Antwort.',
            audioTranscript: `Moderatorin: Guten Tag, Frau Klein. Sie haben gerade ein Café eröffnet. Erzählen Sie uns davon!

Frau Klein: Ja, ich habe vor drei Wochen mein Café „Sonnenschein" eröffnet. Es liegt in der Berliner Straße, direkt neben dem Blumenladen.

Moderatorin: Was ist besonders an Ihrem Café?

Frau Klein: Bei uns gibt es nur selbstgemachten Kuchen. Ich backe jeden Morgen frisch — Apfelkuchen, Käsekuchen, Schokoladenkuchen. Außerdem haben wir eine Spielecke für Kinder.

Moderatorin: Wann haben Sie geöffnet?

Frau Klein: Dienstag bis Samstag, von 9 bis 18 Uhr. Montag und Sonntag sind Ruhetage. Am Mittwochnachmittag ist unser „Kindertag" — dann bekommen alle Kinder ein Getränk gratis.

Moderatorin: Das klingt toll! Wie haben die Kunden reagiert?

Frau Klein: Sehr positiv! Am Eröffnungstag hatte ich über 80 Gäste. Viele kommen jetzt regelmäßig und bringen ihre Freunde mit.`,
            passage: 'Ein Interview im Radio.',
            items: [
                { id: 'a2h2-1', question: 'Wo liegt das Café?', options: [
                    { key: 'A', text: 'Neben dem Blumenladen' }, { key: 'B', text: 'Am Marktplatz' }, { key: 'C', text: 'Im Einkaufszentrum' },
                ], correctAnswer: 'A', explanation: 'Neben dem Blumenladen.' },
                { id: 'a2h2-2', question: 'Wann backt Frau Klein den Kuchen?', options: [
                    { key: 'A', text: 'Am Abend vorher' }, { key: 'B', text: 'Jeden Morgen' }, { key: 'C', text: 'Nur am Wochenende' },
                ], correctAnswer: 'B', explanation: 'Jeden Morgen frisch.' },
                { id: 'a2h2-3', question: 'Wann ist das Café geschlossen?', options: [
                    { key: 'A', text: 'Am Dienstag' }, { key: 'B', text: 'Am Samstag' }, { key: 'C', text: 'Am Montag und Sonntag' },
                ], correctAnswer: 'C', explanation: 'Montag und Sonntag sind Ruhetage.' },
                { id: 'a2h2-4', question: 'Was bekommen Kinder am Mittwoch?', options: [
                    { key: 'A', text: 'Ein Stück Kuchen gratis' }, { key: 'B', text: 'Ein Getränk gratis' }, { key: 'C', text: 'Einen Rabatt' },
                ], correctAnswer: 'B', explanation: 'Ein Getränk gratis am Kindertag.' },
                { id: 'a2h2-5', question: 'Wie viele Gäste hatte Frau Klein am Eröffnungstag?', options: [
                    { key: 'A', text: 'Über 50' }, { key: 'B', text: 'Über 80' }, { key: 'C', text: 'Über 100' },
                ], correctAnswer: 'B', explanation: 'Über 80 Gäste.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // H3: Alltagsgespräche — TF (5×3=15)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 3 — Alltagsgespräche', exerciseType: 'TRUE_FALSE', maxPoints: 15, sortOrder: 3,
        contentJson: {
            instructions: 'Sie hören ein Gespräch. Wählen Sie: Richtig oder Falsch.',
            audioTranscript: `Peter: Hallo Lisa, wie war dein Urlaub in Spanien?

Lisa: Sehr schön! Wir waren zwei Wochen in Barcelona. Das Wetter war toll — jeden Tag Sonne und 30 Grad.

Peter: Das klingt super. Was habt ihr gemacht?

Lisa: Wir sind viel am Strand gewesen und haben die Stadt besichtigt. Die Sagrada Família ist wirklich beeindruckend! Und das Essen war fantastisch — vor allem die Paella.

Peter: Seid ihr mit dem Flugzeug geflogen?

Lisa: Nein, wir sind mit dem Auto gefahren. Die Fahrt hat zwei Tage gedauert, aber wir haben unterwegs in Südfrankreich übernachtet. Das Hotel dort war auch sehr nett.

Peter: Warst du zum ersten Mal in Spanien?

Lisa: Nein, ich war schon einmal dort, vor fünf Jahren. Aber Barcelona habe ich zum ersten Mal besucht.`,
            passage: 'Ein Gespräch zwischen Peter und Lisa.',
            items: [
                { id: 'a2h3-1', statement: 'Lisa war eine Woche in Barcelona.', correctAnswer: 'FALSCH', explanation: 'Zwei Wochen.' },
                { id: 'a2h3-2', statement: 'Lisa hat die Sagrada Família besucht.', correctAnswer: 'RICHTIG', explanation: 'Die Sagrada Família ist beeindruckend!' },
                { id: 'a2h3-3', statement: 'Lisa ist mit dem Flugzeug gereist.', correctAnswer: 'FALSCH', explanation: 'Mit dem Auto gefahren.' },
                { id: 'a2h3-4', statement: 'Lisa hat in Frankreich übernachtet.', correctAnswer: 'RICHTIG', explanation: 'In Südfrankreich übernachtet.' },
                { id: 'a2h3-5', statement: 'Lisa war zum ersten Mal in Spanien.', correctAnswer: 'FALSCH', explanation: 'Schon einmal dort, vor fünf Jahren.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // H4: Vortrag — MC (5×5=25 → total 75)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 4 — Vortrag', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 25, sortOrder: 4,
        contentJson: {
            instructions: 'Sie hören einen Vortrag. Wählen Sie die richtige Antwort.',
            audioTranscript: `Guten Abend, liebe Eltern. Ich bin Frau Berger, die Leiterin der Volkshochschule. Heute möchte ich Ihnen unsere neuen Familienkurse vorstellen.

Ab Februar bieten wir drei neue Kurse an. Der erste Kurs heißt „Kochen mit Kindern". Er findet samstags von 10 bis 12 Uhr statt. Eltern und Kinder kochen zusammen gesunde Mahlzeiten. Der Kurs kostet 120 Euro für 8 Termine.

Der zweite Kurs ist „Erste Hilfe für Eltern". Hier lernen Sie, was Sie bei einem Unfall tun können. Der Kurs dauert nur einen Tag — am Sonntag, den 15. Februar, von 9 bis 16 Uhr. Er kostet 45 Euro.

Der dritte Kurs ist besonders beliebt: „Musik und Bewegung" für Kinder zwischen 3 und 6 Jahren. Die Kinder singen, tanzen und spielen mit Instrumenten. Der Kurs ist mittwochs von 15 bis 16 Uhr und kostet 60 Euro für 10 Termine.

Wenn Sie Fragen haben oder sich anmelden möchten, kommen Sie bitte zu uns ins Büro oder rufen Sie an.`,
            passage: 'Ein Vortrag an einer Volkshochschule.',
            items: [
                { id: 'a2h4-1', question: 'Wann beginnen die neuen Kurse?', options: [
                    { key: 'A', text: 'Im Januar' }, { key: 'B', text: 'Im Februar' }, { key: 'C', text: 'Im März' },
                ], correctAnswer: 'B', explanation: 'Ab Februar.' },
                { id: 'a2h4-2', question: 'Was macht man im Kochkurs?', options: [
                    { key: 'A', text: 'Nur die Eltern kochen' }, { key: 'B', text: 'Nur die Kinder kochen' }, { key: 'C', text: 'Eltern und Kinder kochen zusammen' },
                ], correctAnswer: 'C', explanation: 'Eltern und Kinder kochen zusammen.' },
                { id: 'a2h4-3', question: 'Wie lange dauert der Erste-Hilfe-Kurs?', options: [
                    { key: 'A', text: 'Einen Tag' }, { key: 'B', text: 'Zwei Tage' }, { key: 'C', text: 'Eine Woche' },
                ], correctAnswer: 'A', explanation: 'Nur einen Tag.' },
                { id: 'a2h4-4', question: 'Für welches Alter ist der Musikkurs?', options: [
                    { key: 'A', text: '1–3 Jahre' }, { key: 'B', text: '3–6 Jahre' }, { key: 'C', text: '6–10 Jahre' },
                ], correctAnswer: 'B', explanation: '3 und 6 Jahren.' },
                { id: 'a2h4-5', question: 'Wie kann man sich anmelden?', options: [
                    { key: 'A', text: 'Nur per E-Mail' }, { key: 'B', text: 'Im Büro oder per Telefon' }, { key: 'C', text: 'Nur online' },
                ], correctAnswer: 'B', explanation: 'Ins Büro kommen oder anrufen.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    console.log(`✅ A2 seeded: ${exam.id}`)
    console.log('   Lesen: TF(15) + MC(20) + Matching(21) + TF(19) = 75 pts')
    console.log('   Hören: TF(15) + MC(20) + TF(15) + MC(25) = 75 pts')
    console.log('   Total: 150 pts, 60 min')
}

main().catch(console.error).finally(() => prisma.$disconnect())
