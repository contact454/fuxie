/**
 * seed-exam-a1.ts — Goethe-Zertifikat A1 (Start Deutsch 1)
 *
 * Lesen: 3 Teile, 25 min, 75 pts
 * Hören: 3 Teile, 20 min, 75 pts
 * Total: 45 min, 150 pts, 60% pass
 *
 * Run: DATABASE_URL='...' npx tsx packages/database/prisma/seed-exam-a1.ts
 */
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('📝 Seeding Goethe A1 — Start Deutsch 1...')

    const exam = await prisma.examTemplate.upsert({
        where: { slug: 'goethe-a1-modellsatz-1' },
        update: {
            title: 'Goethe-Zertifikat A1 — Lesen + Hören',
            totalMinutes: 45,
            totalPoints: 150,
            passingScore: 60,
            description: 'Bài thi A1 theo chuẩn Goethe-Institut. Lesen: 3 phần, Hören: 3 phần.',
        },
        create: {
            slug: 'goethe-a1-modellsatz-1',
            title: 'Goethe-Zertifikat A1 — Lesen + Hören',
            examType: 'GOETHE',
            cefrLevel: 'A1',
            totalMinutes: 45,
            totalPoints: 150,
            passingScore: 60,
            description: 'Bài thi A1 theo chuẩn Goethe-Institut. Lesen: 3 phần, Hören: 3 phần.',
            status: 'PUBLISHED',
        },
    })

    // Cascade delete old data
    const oldSections = await prisma.examSection.findMany({ where: { examId: exam.id }, select: { id: true } })
    if (oldSections.length > 0) {
        const sectionIds = oldSections.map(s => s.id)
        const oldTasks = await prisma.examTask.findMany({ where: { sectionId: { in: sectionIds } }, select: { id: true } })
        if (oldTasks.length > 0) {
            await prisma.examAnswer.deleteMany({ where: { taskId: { in: oldTasks.map(t => t.id) } } })
        }
        await prisma.examAttempt.deleteMany({ where: { examId: exam.id } })
        await prisma.examTask.deleteMany({ where: { sectionId: { in: sectionIds } } })
        await prisma.examSection.deleteMany({ where: { examId: exam.id } })
    }

    // ══════════════════════════════════════════════
    // LESEN — 25 min, 75 pts
    // ══════════════════════════════════════════════
    const lesen = await prisma.examSection.create({
        data: {
            examId: exam.id,
            title: 'Lesen',
            skill: 'LESEN',
            totalMinutes: 25,
            totalPoints: 75,
            sortOrder: 1,
            instructions: 'Lesen Sie die Texte und lösen Sie die Aufgaben.',
        },
    })

    // TEIL 1: Schilder & Aushänge — TF (6 × 4 = 24 pts)
    await prisma.examTask.create({
        data: {
            sectionId: lesen.id,
            title: 'Teil 1 — Schilder und Aushänge',
            exerciseType: 'TRUE_FALSE',
            maxPoints: 24,
            sortOrder: 1,
            contentJson: {
                instructions: 'Lesen Sie die Schilder. Wählen Sie: Richtig oder Falsch.',
                passage: `Schild 1: „Bibliothek — Öffnungszeiten: Mo–Fr 9–18 Uhr, Sa 10–14 Uhr. Sonntag geschlossen."

Schild 2: „Schwimmbad: Kinder unter 6 Jahren nur mit Eltern! Eintritt: Erwachsene 5€, Kinder 3€."

Schild 3: „Supermarkt EDEKA — Heute Sonderangebot: Äpfel 1 kg nur 1,50€. Nur heute!"

Schild 4: „Arztpraxis Dr. Schmidt — Bitte klingeln und im Wartezimmer Platz nehmen. Sprechstunde: Mo, Mi, Fr 8–12 Uhr."

Schild 5: „Parkplatz nur für Kunden! Andere Autos werden abgeschleppt."

Schild 6: „Bäckerei Müller — Frisches Brot jeden Tag ab 6 Uhr. Wir haben auch Kuchen und Kaffee."`,
                items: [
                    { id: 'a1l1-1', statement: 'Die Bibliothek ist am Samstag geöffnet.', correctAnswer: 'RICHTIG', explanation: 'Sa 10–14 Uhr.' },
                    { id: 'a1l1-2', statement: 'Die Bibliothek ist am Sonntag geöffnet.', correctAnswer: 'FALSCH', explanation: 'Sonntag geschlossen.' },
                    { id: 'a1l1-3', statement: 'Kinder gehen allein ins Schwimmbad.', correctAnswer: 'FALSCH', explanation: 'Kinder unter 6 nur mit Eltern.' },
                    { id: 'a1l1-4', statement: '1 Kilo Äpfel kostet 1,50 Euro.', correctAnswer: 'RICHTIG', explanation: 'Äpfel 1 kg nur 1,50€.' },
                    { id: 'a1l1-5', statement: 'Die Arztpraxis ist am Dienstag geöffnet.', correctAnswer: 'FALSCH', explanation: 'Nur Mo, Mi, Fr.' },
                    { id: 'a1l1-6', statement: 'Die Bäckerei verkauft auch Kaffee.', correctAnswer: 'RICHTIG', explanation: 'Wir haben auch Kuchen und Kaffee.' },
                ],
            } satisfies Prisma.InputJsonValue,
        },
    })

    // TEIL 2: Kurze Nachrichten — MC (5 × 5 = 25 pts)
    await prisma.examTask.create({
        data: {
            sectionId: lesen.id,
            title: 'Teil 2 — Kurze Nachrichten',
            exerciseType: 'MULTIPLE_CHOICE',
            maxPoints: 25,
            sortOrder: 2,
            contentJson: {
                instructions: 'Lesen Sie die E-Mails. Wählen Sie die richtige Antwort.',
                passage: `Liebe Maria,

ich komme am Samstag nach München. Mein Zug kommt um 14 Uhr an. Können wir zusammen Kaffee trinken? Ich kenne ein schönes Café am Marienplatz.

Am Sonntag möchte ich ins Museum gehen. Kommst du mit? Das Museum ist von 10 bis 17 Uhr geöffnet. Der Eintritt kostet 8 Euro.

Am Abend koche ich für dich. Ich mache Pasta — das ist mein Lieblingsessen!

Liebe Grüße,
Anna`,
                items: [
                    {
                        id: 'a1l2-1',
                        question: 'Wann kommt Anna in München an?',
                        options: [
                            { key: 'A', text: 'Am Freitag um 14 Uhr' },
                            { key: 'B', text: 'Am Samstag um 14 Uhr' },
                            { key: 'C', text: 'Am Sonntag um 10 Uhr' },
                        ],
                        correctAnswer: 'B',
                        explanation: 'Am Samstag, Zug um 14 Uhr.'
                    },
                    {
                        id: 'a1l2-2',
                        question: 'Wo möchte Anna Kaffee trinken?',
                        options: [
                            { key: 'A', text: 'Am Marienplatz' },
                            { key: 'B', text: 'Im Museum' },
                            { key: 'C', text: 'Im Zug' },
                        ],
                        correctAnswer: 'A',
                        explanation: 'Café am Marienplatz.'
                    },
                    {
                        id: 'a1l2-3',
                        question: 'Was möchte Anna am Sonntag machen?',
                        options: [
                            { key: 'A', text: 'Kaffee trinken' },
                            { key: 'B', text: 'Kochen' },
                            { key: 'C', text: 'Ins Museum gehen' },
                        ],
                        correctAnswer: 'C',
                        explanation: 'Am Sonntag ins Museum gehen.'
                    },
                    {
                        id: 'a1l2-4',
                        question: 'Wie viel kostet das Museum?',
                        options: [
                            { key: 'A', text: '5 Euro' },
                            { key: 'B', text: '8 Euro' },
                            { key: 'C', text: '10 Euro' },
                        ],
                        correctAnswer: 'B',
                        explanation: 'Eintritt 8 Euro.'
                    },
                    {
                        id: 'a1l2-5',
                        question: 'Was kocht Anna?',
                        options: [
                            { key: 'A', text: 'Suppe' },
                            { key: 'B', text: 'Kuchen' },
                            { key: 'C', text: 'Pasta' },
                        ],
                        correctAnswer: 'C',
                        explanation: 'Ich mache Pasta.'
                    },
                ],
            } satisfies Prisma.InputJsonValue,
        },
    })

    // TEIL 3: Kleinanzeigen — Matching (7 × ~3.7 ≈ 26 pts → total 75)
    await prisma.examTask.create({
        data: {
            sectionId: lesen.id,
            title: 'Teil 3 — Kleinanzeigen',
            exerciseType: 'MATCHING',
            maxPoints: 26,
            sortOrder: 3,
            contentJson: {
                instructions: 'Lesen Sie die Situationen und die Anzeigen. Welche Anzeige passt?',
                situations: [
                    { id: 'a1s1', text: 'Sie suchen eine Wohnung.' },
                    { id: 'a1s2', text: 'Ihr Kind möchte Fußball spielen.' },
                    { id: 'a1s3', text: 'Sie brauchen ein Fahrrad.' },
                    { id: 'a1s4', text: 'Sie suchen einen Deutschkurs.' },
                    { id: 'a1s5', text: 'Sie möchten Pizza essen.' },
                    { id: 'a1s6', text: 'Ihr Freund sucht Arbeit.' },
                    { id: 'a1s7', text: 'Sie brauchen einen Arzt.' },
                ],
                options: [
                    { key: 'A', title: '2-Zimmer-Wohnung', snippet: 'Schöne Wohnung, 55 m², Küche und Bad, 500€ warm, ab 1. März frei.' },
                    { key: 'B', title: 'Fußballverein für Kinder', snippet: 'Training: Mittwoch 15–17 Uhr. Für Kinder 6–12 Jahre. Anmeldung: info@fcjugend.de' },
                    { key: 'C', title: 'Fahrrad zu verkaufen', snippet: 'Damenfahrrad, rot, guter Zustand. Preis: 80€. Tel: 0176-1234567' },
                    { key: 'D', title: 'Deutschkurs für Anfänger', snippet: 'VHS München, A1-Kurs, Mo + Do 18–20 Uhr, Start: 15. Januar, 90€' },
                    { key: 'E', title: 'Pizzeria da Luigi', snippet: 'Frische Pizza! Lieferung frei ab 15€. Öffnungszeiten: 11–22 Uhr. Tel: 089-555666' },
                    { key: 'F', title: 'Kellner/in gesucht', snippet: 'Restaurant sucht Kellner/in, Teilzeit, abends 17–22 Uhr, 12€/Stunde.' },
                    { key: 'G', title: 'Arztpraxis Dr. Yilmaz', snippet: 'Hausarzt, alle Kassen. Sprechstunde: Mo–Fr 8–12 und 14–17 Uhr.' },
                    { key: 'H', title: 'Gitarrenunterricht', snippet: 'Gitarre lernen! Für Anfänger und Fortgeschrittene. 25€/Stunde.' },
                    { key: 'I', title: 'Flohmarkt am Samstag', snippet: 'Im Olympiapark, 8–16 Uhr, Eintritt frei!' },
                ],
                correctMapping: {
                    'a1s1': 'A', 'a1s2': 'B', 'a1s3': 'C', 'a1s4': 'D',
                    'a1s5': 'E', 'a1s6': 'F', 'a1s7': 'G',
                },
            } satisfies Prisma.InputJsonValue,
        },
    })

    // ══════════════════════════════════════════════
    // HÖREN — 20 min, 75 pts
    // ══════════════════════════════════════════════
    const hoeren = await prisma.examSection.create({
        data: {
            examId: exam.id,
            title: 'Hören',
            skill: 'HOEREN',
            totalMinutes: 20,
            totalPoints: 75,
            sortOrder: 2,
            instructions: 'Sie hören kurze Texte. Lösen Sie die Aufgaben.',
        },
    })

    // TEIL 1: Kurze Ansagen — TF (6 × 4 = 24 pts)
    await prisma.examTask.create({
        data: {
            sectionId: hoeren.id,
            title: 'Teil 1 — Kurze Ansagen',
            exerciseType: 'TRUE_FALSE',
            maxPoints: 24,
            sortOrder: 1,
            contentJson: {
                instructions: 'Sie hören kurze Texte. Wählen Sie: Richtig oder Falsch.',
                audioTranscript: `Ansage 1:
Guten Tag. Hier ist der Anrufbeantworter von Familie Braun. Wir sind nicht zu Hause. Bitte sprechen Sie nach dem Ton.

Ansage 2:
Liebe Fahrgäste! Der Bus Linie 52 kommt heute 10 Minuten später. Wir entschuldigen uns.

Ansage 3:
Achtung! Der Supermarkt schließt in 15 Minuten. Bitte gehen Sie zur Kasse.

Ansage 4:
Hallo, hier ist die Tanzschule Meyer. Unser Salsa-Kurs am Donnerstag fällt heute aus. Nächste Woche tanzen wir wieder.

Ansage 5:
Guten Morgen. Heute scheint die Sonne und es wird warm: 25 Grad. Am Abend kommt Regen.

Ansage 6:
Willkommen im Kaufhaus. Heute: Sonderangebot in der Schuhabteilung! Alle Schuhe 30 Prozent billiger.`,
                passage: 'Hören Sie die Ansagen.',
                items: [
                    { id: 'a1h1-1', statement: 'Familie Braun ist zu Hause.', correctAnswer: 'FALSCH', explanation: 'Wir sind nicht zu Hause.' },
                    { id: 'a1h1-2', statement: 'Der Bus kommt pünktlich.', correctAnswer: 'FALSCH', explanation: '10 Minuten später.' },
                    { id: 'a1h1-3', statement: 'Der Supermarkt schließt bald.', correctAnswer: 'RICHTIG', explanation: 'In 15 Minuten.' },
                    { id: 'a1h1-4', statement: 'Der Tanzkurs ist heute Donnerstag.', correctAnswer: 'RICHTIG', explanation: 'Am Donnerstag... fällt heute aus.' },
                    { id: 'a1h1-5', statement: 'Es regnet heute Morgen.', correctAnswer: 'FALSCH', explanation: 'Die Sonne scheint. Regen erst am Abend.' },
                    { id: 'a1h1-6', statement: 'Schuhe sind heute billiger.', correctAnswer: 'RICHTIG', explanation: '30 Prozent billiger.' },
                ],
            } satisfies Prisma.InputJsonValue,
        },
    })

    // TEIL 2: Kurze Gespräche — MC (5 × 5 = 25 pts)
    await prisma.examTask.create({
        data: {
            sectionId: hoeren.id,
            title: 'Teil 2 — Kurze Gespräche',
            exerciseType: 'MULTIPLE_CHOICE',
            maxPoints: 25,
            sortOrder: 2,
            contentJson: {
                instructions: 'Sie hören kurze Gespräche. Wählen Sie die richtige Antwort.',
                audioTranscript: `Gespräch 1:
Frau: Entschuldigung, wo ist die Post?
Mann: Die Post? Gehen Sie geradeaus und dann links. Sie ist neben der Apotheke.
Frau: Danke schön!

Gespräch 2:
Mann: Was möchten Sie trinken?
Frau: Einen Kaffee, bitte. Mit Milch, aber ohne Zucker.
Mann: Und dazu etwas essen?
Frau: Ja, ein Stück Kuchen, bitte.

Gespräch 3:
Frau: Wie viel kostet das T-Shirt?
Verkäuferin: 19,90 Euro. Aber heute haben wir 20 Prozent Rabatt.
Frau: Gut, dann nehme ich es.

Gespräch 4:
Mann: Wann fährt der nächste Zug nach Hamburg?
Frau: Um 15:30 Uhr von Gleis 3.
Mann: Muss ich umsteigen?
Frau: Nein, der Zug fährt direkt.

Gespräch 5:
Frau: Hast du am Samstag Zeit? Wir machen eine Party.
Mann: Am Samstag? Ja, gerne! Um wie viel Uhr?
Frau: Ab 19 Uhr bei mir.`,
                passage: 'Hören Sie die Gespräche.',
                items: [
                    {
                        id: 'a1h2-1',
                        question: 'Wo ist die Post?',
                        options: [
                            { key: 'A', text: 'Rechts neben der Bank' },
                            { key: 'B', text: 'Links neben der Apotheke' },
                            { key: 'C', text: 'Geradeaus neben dem Supermarkt' },
                        ],
                        correctAnswer: 'B',
                        explanation: 'Geradeaus, dann links, neben der Apotheke.'
                    },
                    {
                        id: 'a1h2-2',
                        question: 'Was bestellt die Frau?',
                        options: [
                            { key: 'A', text: 'Kaffee mit Zucker und Kuchen' },
                            { key: 'B', text: 'Tee mit Milch' },
                            { key: 'C', text: 'Kaffee mit Milch und Kuchen' },
                        ],
                        correctAnswer: 'C',
                        explanation: 'Kaffee mit Milch, ohne Zucker + Kuchen.'
                    },
                    {
                        id: 'a1h2-3',
                        question: 'Wie viel bezahlt die Frau für das T-Shirt?',
                        options: [
                            { key: 'A', text: '19,90 Euro' },
                            { key: 'B', text: 'Weniger als 19,90 Euro' },
                            { key: 'C', text: 'Mehr als 19,90 Euro' },
                        ],
                        correctAnswer: 'B',
                        explanation: '20% Rabatt auf 19,90€.'
                    },
                    {
                        id: 'a1h2-4',
                        question: 'Muss der Mann nach Hamburg umsteigen?',
                        options: [
                            { key: 'A', text: 'Ja, in Frankfurt' },
                            { key: 'B', text: 'Ja, einmal' },
                            { key: 'C', text: 'Nein, der Zug fährt direkt' },
                        ],
                        correctAnswer: 'C',
                        explanation: 'Der Zug fährt direkt.'
                    },
                    {
                        id: 'a1h2-5',
                        question: 'Wann ist die Party?',
                        options: [
                            { key: 'A', text: 'Am Samstag ab 19 Uhr' },
                            { key: 'B', text: 'Am Sonntag ab 20 Uhr' },
                            { key: 'C', text: 'Am Freitag ab 18 Uhr' },
                        ],
                        correctAnswer: 'A',
                        explanation: 'Samstag ab 19 Uhr.'
                    },
                ],
            } satisfies Prisma.InputJsonValue,
        },
    })

    // TEIL 3: Zuordnung Gespräche — Matching (7+→26 pts → total 75)
    await prisma.examTask.create({
        data: {
            sectionId: hoeren.id,
            title: 'Teil 3 — Gespräche zuordnen',
            exerciseType: 'MATCHING',
            maxPoints: 26,
            sortOrder: 3,
            contentJson: {
                instructions: 'Sie hören Gespräche. Wo sind die Personen? Ordnen Sie zu.',
                audioTranscript: `Gespräch A:
Mann: Einen Kaffee und zwei Brötchen, bitte.
Frau: Zum Mitnehmen oder hier essen?
Mann: Zum Mitnehmen, bitte.

Gespräch B:
Frau: Ich brauche Tabletten gegen Kopfschmerzen.
Mann: Haben Sie ein Rezept?
Frau: Nein, ich möchte sie ohne Rezept kaufen.

Gespräch C:
Mann: Ich möchte diesen Brief nach Spanien schicken.
Frau: Per Luftpost? Das kostet 1,70 Euro.

Gespräch D:
Frau: Kann ich das Buch noch eine Woche länger behalten?
Mann: Ja, ich verlängere das für Sie.

Gespräch E:
Mann: Zweimal Erwachsene und einmal Kind, bitte.
Frau: Das macht 18 Euro insgesamt. Viel Spaß im Film!

Gespräch F:
Frau: Guten Tag, ich möchte ein Konto eröffnen.
Mann: Gerne. Haben Sie Ihren Ausweis dabei?

Gespräch G:
Mann: Die Jacke hier, gibt es die auch in Größe M?
Frau: Moment, ich schaue im Lager nach.`,
                passage: '',
                situations: [
                    { id: 'a1hs1', text: 'In der Bäckerei' },
                    { id: 'a1hs2', text: 'In der Apotheke' },
                    { id: 'a1hs3', text: 'Auf der Post' },
                    { id: 'a1hs4', text: 'In der Bibliothek' },
                    { id: 'a1hs5', text: 'Im Kino' },
                    { id: 'a1hs6', text: 'In der Bank' },
                    { id: 'a1hs7', text: 'Im Geschäft (Kleidung)' },
                ],
                options: [
                    { key: 'A', title: 'Gespräch A', snippet: 'Kaffee und Brötchen' },
                    { key: 'B', title: 'Gespräch B', snippet: 'Tabletten gegen Kopfschmerzen' },
                    { key: 'C', title: 'Gespräch C', snippet: 'Brief nach Spanien' },
                    { key: 'D', title: 'Gespräch D', snippet: 'Buch verlängern' },
                    { key: 'E', title: 'Gespräch E', snippet: 'Karten für den Film' },
                    { key: 'F', title: 'Gespräch F', snippet: 'Konto eröffnen' },
                    { key: 'G', title: 'Gespräch G', snippet: 'Jacke in Größe M' },
                    { key: 'H', title: 'Gespräch H (Distractor)', snippet: 'Kein passendes Gespräch' },
                ],
                correctMapping: {
                    'a1hs1': 'A', 'a1hs2': 'B', 'a1hs3': 'C', 'a1hs4': 'D',
                    'a1hs5': 'E', 'a1hs6': 'F', 'a1hs7': 'G',
                },
            } satisfies Prisma.InputJsonValue,
        },
    })

    console.log(`✅ A1 seeded: ${exam.id}`)
    console.log('   Lesen: TF(24) + MC(25) + Matching(26) = 75 pts')
    console.log('   Hören: TF(24) + MC(25) + Matching(26) = 75 pts')
    console.log('   Total: 150 pts, 45 min')
}

main().catch(console.error).finally(() => prisma.$disconnect())
