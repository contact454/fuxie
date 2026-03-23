/**
 * seed-exam-c1.ts — Goethe-Zertifikat C1
 *
 * Lesen: 4 Teile, 70 min, 100 pts
 * Hören: 4 Teile, 40 min, 100 pts
 * Total: 110 min, 200 pts, 60% pass
 *
 * Run: DATABASE_URL='...' npx tsx packages/database/prisma/seed-exam-c1.ts
 */
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('📝 Seeding Goethe C1...')

    const exam = await prisma.examTemplate.upsert({
        where: { slug: 'goethe-c1-modellsatz-1' },
        update: { title: 'Goethe-Zertifikat C1 — Lesen + Hören', totalMinutes: 110, totalPoints: 200, passingScore: 60,
            description: 'Bài thi C1 theo chuẩn Goethe-Institut. Lesen: 4 phần, Hören: 4 phần.' },
        create: { slug: 'goethe-c1-modellsatz-1', title: 'Goethe-Zertifikat C1 — Lesen + Hören',
            examType: 'GOETHE', cefrLevel: 'C1', totalMinutes: 110, totalPoints: 200, passingScore: 60,
            description: 'Bài thi C1 theo chuẩn Goethe-Institut. Lesen: 4 phần, Hören: 4 phần.', status: 'PUBLISHED' },
    })

    const oldSections = await prisma.examSection.findMany({ where: { examId: exam.id }, select: { id: true } })
    if (oldSections.length > 0) {
        const sids = oldSections.map(s => s.id)
        const oldTasks = await prisma.examTask.findMany({ where: { sectionId: { in: sids } }, select: { id: true } })
        if (oldTasks.length > 0) await prisma.examAnswer.deleteMany({ where: { taskId: { in: oldTasks.map(t => t.id) } } })
        await prisma.examAttempt.deleteMany({ where: { examId: exam.id } })
        await prisma.examTask.deleteMany({ where: { sectionId: { in: sids } } })
        await prisma.examSection.deleteMany({ where: { examId: exam.id } })
    }

    // ══════════ LESEN 70 min, 100 pts ══════════
    const lesen = await prisma.examSection.create({
        data: { examId: exam.id, title: 'Lesen', skill: 'LESEN', totalMinutes: 70, totalPoints: 100, sortOrder: 1,
            instructions: 'Lesen Sie die Texte und lösen Sie die Aufgaben. Sie haben 70 Minuten Zeit.' },
    })

    // L1: Komplexer Zeitungsartikel — MC (5×5=25)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 1 — Wissenschaftsartikel', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 25, sortOrder: 1,
        contentJson: {
            instructions: 'Lesen Sie den Text und die Aufgaben. Wählen Sie die richtige Antwort.',
            passage: `Die Neurobiologie der Entscheidungsfindung — Warum wir nicht so rational sind, wie wir glauben

Die klassische Wirtschaftstheorie basiert auf der Annahme, dass Menschen rational handelnde Wesen sind, die ihre Entscheidungen auf der Grundlage vollständiger Informationen treffen. Diese als „Homo oeconomicus" bekannte Modellvorstellung ist jedoch durch die neurobiologische Forschung der letzten zwei Jahrzehnte grundlegend in Frage gestellt worden. Der Neurowissenschaftler Antonio Damasio hat mit seiner „Somatischen-Marker-Hypothese" nachgewiesen, dass Emotionen bei nahezu jeder Entscheidung eine zentrale Rolle spielen — auch bei solchen, die wir als rein rational empfinden.

In einem bahnbrechenden Experiment untersuchte Damasio Patienten mit Schädigungen des präfrontalen Kortex, einer Hirnregion, die maßgeblich an der Verarbeitung von Emotionen beteiligt ist. Obwohl die kognitiven Fähigkeiten dieser Patienten vollständig intakt waren, erwiesen sie sich als unfähig, selbst einfachste Alltagsentscheidungen zu treffen — etwa die Wahl eines Restaurants oder die Terminplanung. Damasios Schlussfolgerung: Ohne emotionale Bewertung ist keine Entscheidung möglich.

Diese Erkenntnisse haben weitreichende Implikationen, die weit über die Grundlagenforschung hinausgehen. Im Bereich des Marketings nutzen Unternehmen längst die Einsicht, dass Kaufentscheidungen überwiegend emotional gesteuert werden. Die sogenannte Neuroökonomie, ein noch junges interdisziplinäres Forschungsfeld, untersucht systematisch die neuronalen Grundlagen wirtschaftlichen Verhaltens und hat dabei erstaunliche Parallelen zwischen Suchtverhalten und bestimmten Formen des Konsumverhaltens aufgedeckt.

Besonders kontrovers wird die Frage diskutiert, inwieweit die Neurowissenschaft zur Manipulation eingesetzt werden kann. Kritiker warnen vor einem „Neurokapitalismus", in dem Unternehmen die unbewussten Mechanismen des Gehirns gezielt ausnutzen, um Konsumenten zu Käufen zu verleiten, die ihren eigentlichen Interessen zuwiderlaufen. Die ethischen Grenzen dieser Entwicklung sind bis heute ungeklärt.`,
            items: [
                { id: 'c1l1-1', question: 'Was hat Damasios Forschung über die Rolle von Emotionen gezeigt?', options: [
                    { key: 'A', text: 'Emotionen spielen nur bei persönlichen Entscheidungen eine Rolle' },
                    { key: 'B', text: 'Emotionen sind bei praktisch allen Entscheidungen zentral — auch bei scheinbar rationalen' },
                    { key: 'C', text: 'Emotionen behindern die Entscheidungsfindung' },
                ], correctAnswer: 'B', explanation: 'Emotionen spielen bei nahezu jeder Entscheidung eine zentrale Rolle.' },
                { id: 'c1l1-2', question: 'Was passierte mit Patienten mit geschädigtem präfrontalem Kortex?', options: [
                    { key: 'A', text: 'Sie konnten keine Alltagsentscheidungen treffen, obwohl sie kognitiv intakt waren' },
                    { key: 'B', text: 'Sie verloren ihre Intelligenz' },
                    { key: 'C', text: 'Sie wurden aggressiver' },
                ], correctAnswer: 'A', explanation: 'Kognitiv intakt, aber unfähig zu einfachsten Entscheidungen.' },
                { id: 'c1l1-3', question: 'Was untersucht die Neuroökonomie?', options: [
                    { key: 'A', text: 'Die Wirtschaftlichkeit neurochirurgischer Eingriffe' },
                    { key: 'B', text: 'Die neuronalen Grundlagen wirtschaftlichen Verhaltens' },
                    { key: 'C', text: 'Die Kosten der Hirnforschung' },
                ], correctAnswer: 'B', explanation: 'Neuronale Grundlagen wirtschaftlichen Verhaltens.' },
                { id: 'c1l1-4', question: 'Welche Parallele hat die Neuroökonomie aufgedeckt?', options: [
                    { key: 'A', text: 'Zwischen Schlafmangel und Kaufverhalten' },
                    { key: 'B', text: 'Zwischen Sport und Wirtschaftswachstum' },
                    { key: 'C', text: 'Zwischen Suchtverhalten und bestimmten Formen des Konsumverhaltens' },
                ], correctAnswer: 'C', explanation: 'Parallelen zwischen Sucht- und Konsumverhalten.' },
                { id: 'c1l1-5', question: 'Was bedeutet „Neurokapitalismus" im Text?', options: [
                    { key: 'A', text: 'Investitionen in die Hirnforschung' },
                    { key: 'B', text: 'Gezielte Ausnutzung unbewusster Gehirnmechanismen für kommerzielle Zwecke' },
                    { key: 'C', text: 'Kapitalismus, der nur für intelligente Menschen funktioniert' },
                ], correctAnswer: 'B', explanation: 'Unbewusste Mechanismen des Gehirns für Konsumzwecke ausnutzen.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // L2: Wissenschaftlicher Text — TF (5×5=25)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 2 — Fachliteratur', exerciseType: 'TRUE_FALSE', maxPoints: 25, sortOrder: 2,
        contentJson: {
            instructions: 'Lesen Sie den Text. Wählen Sie: Richtig oder Falsch.',
            passage: `Die Fragmentierung urbaner Räume — Soziologische Perspektiven auf die geteilte Stadt

Die moderne Stadtforschung beschäftigt sich zunehmend mit dem Phänomen der sozialräumlichen Segregation, das heißt der räumlichen Trennung verschiedener Bevölkerungsgruppen innerhalb einer Stadt. Dieses Phänomen, das keineswegs neu ist, hat in den letzten beiden Jahrzehnten durch steigende Einkommensungleichheit und verschärfte Wohnungsknappheit eine neue Dimension erreicht.

Der Soziologe Hartmut Rosa hat in diesem Zusammenhang den Begriff der „Resonanzverarmung" geprägt: In sozial homogenen Vierteln fehlt den Bewohnern die Möglichkeit, mit Menschen anderer sozialer Schichten, Lebensweisen und Weltanschauungen in Kontakt zu treten. Die daraus resultierende Abschottung, so Rosa, führe zu einer Erosion des gesellschaftlichen Zusammenhalts und einem wachsenden Misstrauen gegenüber dem „Anderen".

Empirische Studien belegen, dass die sozialräumliche Segregation in deutschen Großstädten messbar zugenommen hat. Der sogenannte Segregationsindex, der das Ausmaß der ungleichen Verteilung verschiedener Bevölkerungsgruppen quantifiziert, ist in Berlin, München und Frankfurt zwischen 2010 und 2023 um durchschnittlich 23 Prozent gestiegen. Besonders betroffen sind Familien mit Migrationshintergrund, die sich zunehmend in bestimmten Stadtteilen konzentrieren.

Als Gegenmaßnahme fordern Stadtplaner eine konsequente Durchmischungspolitik: Sozialer Wohnungsbau sollte nicht in Randgebieten konzentriert, sondern in allen Stadtteilen integriert werden. Darüber hinaus könnten gemeinschaftliche Nutzungskonzepte — etwa Stadtteilzentren, interkulturelle Gärten oder generationenübergreifende Wohnprojekte — dazu beitragen, die Fragmentierung zu überwinden.`,
            items: [
                { id: 'c1l2-1', statement: 'Sozialräumliche Segregation ist ein völlig neues Phänomen.', correctAnswer: 'FALSCH', explanation: 'Keineswegs neu, hat aber neue Dimension erreicht.' },
                { id: 'c1l2-2', statement: 'Hartmut Rosa beschreibt den Verlust von Kontaktmöglichkeiten zwischen verschiedenen Bevölkerungsschichten als „Resonanzverarmung".', correctAnswer: 'RICHTIG', explanation: 'Fehlende Möglichkeit, mit anderen Schichten in Kontakt zu treten.' },
                { id: 'c1l2-3', statement: 'Der Segregationsindex ist zwischen 2010 und 2023 gesunken.', correctAnswer: 'FALSCH', explanation: 'Um 23% gestiegen.' },
                { id: 'c1l2-4', statement: 'Familien mit Migrationshintergrund sind von der Segregation besonders betroffen.', correctAnswer: 'RICHTIG', explanation: 'Besonders betroffen, konzentrieren sich in bestimmten Stadtteilen.' },
                { id: 'c1l2-5', statement: 'Stadtplaner fordern, sozialen Wohnungsbau am Stadtrand zu konzentrieren.', correctAnswer: 'FALSCH', explanation: 'Gegenteil: in ALLEN Stadtteilen integrieren.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // L3: Kursbeschreibungen — Matching (7×3=21)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 3 — Fortbildungsangebote', exerciseType: 'MATCHING', maxPoints: 21, sortOrder: 3,
        contentJson: {
            instructions: 'Lesen Sie die Situationen und die Kursangebote. Welcher Kurs passt?',
            situations: [
                { id: 'c1s1', text: 'Eine Führungskraft möchte ihre Verhandlungskompetenz im internationalen Kontext verbessern.' },
                { id: 'c1s2', text: 'Ein Wissenschaftler braucht eine Fortbildung in statistischer Datenanalyse.' },
                { id: 'c1s3', text: 'Eine Journalistin möchte investigativen Journalismus lernen.' },
                { id: 'c1s4', text: 'Ein Arzt sucht eine Weiterbildung in medizinischer Ethik.' },
                { id: 'c1s5', text: 'Eine Lehrerin möchte sich in interkultureller Pädagogik fortbilden.' },
                { id: 'c1s6', text: 'Ein Jurist interessiert sich für Datenschutzrecht im digitalen Zeitalter.' },
                { id: 'c1s7', text: 'Ein Therapeut sucht eine Ausbildung in Traumatherapie.' },
            ],
            options: [
                { key: 'A', title: 'Interkulturelle Verhandlungsführung', snippet: 'Seminar für Führungskräfte: Verhandlungsstrategien in internationalen Kontexten, Konfliktmanagement über Kulturgrenzen hinweg. 3 Tage, 1.200€.' },
                { key: 'B', title: 'Statistische Methoden in der Forschung', snippet: 'SPSS, R-Studio und Python für Wissenschaftler. Regression, Varianzanalyse, multivariate Verfahren. Block-Seminar 5 Tage, Universität Göttingen.' },
                { key: 'C', title: 'Investigative Recherchetechniken', snippet: 'Für erfahrene Journalisten: Datenrecherche, OSINT, Quellenverifizierung, Recht auf Auskunft. Dozent: preisgekrönte Investigativ-Journalistin. 4 Tage, Hamburg.' },
                { key: 'D', title: 'Klinische Ethik im Krankenhaus', snippet: 'Für Ärzte und Pflegekräfte: Ethische Entscheidungsfindung am Lebensende, Patientenverfügungen, Forschungsethik. Zertifiziert von der Ärztekammer.' },
                { key: 'E', title: 'Diversitätssensible Pädagogik', snippet: 'Umgang mit kultureller Vielfalt im Klassenzimmer, inklusive Unterrichtsgestaltung, Sprachförderung für neu zugewanderte Kinder. Für Lehrkräfte aller Schulformen.' },
                { key: 'F', title: 'EU-Datenschutz-Grundverordnung', snippet: 'Intensivseminar: DSGVO in der Praxis, Datenverarbeitungsvereinbarungen, Beschäftigtendatenschutz. Für Juristen und Datenschutzbeauftragte.' },
                { key: 'G', title: 'EMDR-Traumatherapie', snippet: 'Zertifizierte Ausbildung in Eye Movement Desensitization and Reprocessing. Für Psychotherapeuten mit abgeschlossener Approbation. 120 Stunden.' },
                { key: 'H', title: 'Führungskräfte-Coaching', snippet: 'Individuelles Coaching für C-Level-Manager. Themen: Resilienz, Teamführung, Work-Life-Balance. 10 Sitzungen à 90 Minuten.' },
            ],
            correctMapping: { 'c1s1': 'A', 'c1s2': 'B', 'c1s3': 'C', 'c1s4': 'D', 'c1s5': 'E', 'c1s6': 'F', 'c1s7': 'G' },
        } satisfies Prisma.InputJsonValue,
    } })

    // L4: Essay — MC (6×~5=29 → total 100)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 4 — Essay', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 29, sortOrder: 4,
        contentJson: {
            instructions: 'Lesen Sie den Essay. Wählen Sie die richtige Antwort.',
            passage: `Über die Vermessung des Glücks — Kann man Wohlbefinden quantifizieren?

In einer zunehmend datengetriebenen Gesellschaft liegt es nahe, auch das subjektive Wohlbefinden der Menschen in Zahlen zu fassen. Der „World Happiness Report" der Vereinten Nationen unternimmt genau diesen Versuch und erstellt jährlich ein Ranking der glücklichsten Länder der Welt. Skandinavische Länder dominieren dabei regelmäßig die Spitzenplätze, während Deutschland typischerweise im oberen Mittelfeld rangiert.

Doch die Methodik solcher Glücksmessungen ist äußerst umstritten. Der Philosoph und Soziologe Hartmut Rosa kritisiert, dass das Konzept des „subjektiven Wohlbefindens", wie es in den gängigen Umfragen operationalisiert wird, den Menschen auf ein bewertungsfreudiges Individuum reduziere, das sein Leben anhand einer simplen Zufriedenheitsskala einordnet. Was dabei verloren gehe, sei gerade jene Dimension menschlicher Erfahrung, die Rosa als „Resonanz" bezeichnet — das Gefühl, von der Welt angesprochen und berührt zu werden.

Hinzu kommt ein fundamentales methodisches Problem: Glück ist kulturell kodiert. Was in einer individualistisch geprägten westlichen Gesellschaft als Glück verstanden wird — persönliche Selbstverwirklichung, materielle Sicherheit, romantische Liebe — deckt sich nur bedingt mit den Glücksvorstellungen kollektivistischer Kulturen, in denen Zugehörigkeit, Pflichterfüllung und Harmonie im Vordergrund stehen. Ein transkulturell valider Glücksbegriff, so die berechtigte Kritik, ist eine Illusion.

Gleichwohl wäre es verkürzt, die Glücksforschung pauschal abzulehnen. Die Erkenntnisse über grundlegende Determinanten des Wohlbefindens — soziale Beziehungen, gesellschaftliche Teilhabe, Vertrauen in Institutionen und das Maß an individueller Autonomie — haben durchaus praktischen Wert für die politische Gestaltung.`,
            items: [
                { id: 'c1l4-1', question: 'Welche Länder stehen im World Happiness Report typischerweise an der Spitze?', options: [
                    { key: 'A', text: 'Asiatische Länder' }, { key: 'B', text: 'Skandinavische Länder' }, { key: 'C', text: 'Lateinamerikanische Länder' },
                ], correctAnswer: 'B', explanation: 'Skandinavische Länder dominieren die Spitzenplätze.' },
                { id: 'c1l4-2', question: 'Was kritisiert Hartmut Rosa an den Glücksmessungen?', options: [
                    { key: 'A', text: 'Sie sind zu teuer' },
                    { key: 'B', text: 'Sie reduzieren den Menschen auf eine Zufriedenheitsskala und verlieren die Dimension der „Resonanz"' },
                    { key: 'C', text: 'Sie werden nicht oft genug durchgeführt' },
                ], correctAnswer: 'B', explanation: 'Reduktion auf Zufriedenheitsskala, Resonanz geht verloren.' },
                { id: 'c1l4-3', question: 'Was stellen kollektivistische Kulturen laut Text in den Vordergrund?', options: [
                    { key: 'A', text: 'Individuelle Freiheit und Reichtum' },
                    { key: 'B', text: 'Zugehörigkeit, Pflichterfüllung und Harmonie' },
                    { key: 'C', text: 'Technologischen Fortschritt' },
                ], correctAnswer: 'B', explanation: 'Zugehörigkeit, Pflichterfüllung und Harmonie.' },
                { id: 'c1l4-4', question: 'Was bezeichnet der Autor als „Illusion"?', options: [
                    { key: 'A', text: 'Die Existenz von Glück' },
                    { key: 'B', text: 'Einen transkulturell validen Glücksbegriff' },
                    { key: 'C', text: 'Den World Happiness Report insgesamt' },
                ], correctAnswer: 'B', explanation: 'Ein transkulturell valider Glücksbegriff ist laut Kritikern eine Illusion.' },
                { id: 'c1l4-5', question: 'Welche Erkenntnis der Glücksforschung hat laut Autor praktischen Wert?', options: [
                    { key: 'A', text: 'Dass Geld glücklich macht' },
                    { key: 'B', text: 'Dass individuelle Autonomie und Vertrauen wichtig sind' },
                    { key: 'C', text: 'Dass jeder Mensch gleich glücklich ist' },
                ], correctAnswer: 'B', explanation: 'Soziale Beziehungen, Teilhabe, Vertrauen, Autonomie.' },
                { id: 'c1l4-6', question: 'Das Wort „gleichwohl" (letzter Absatz) bedeutet...', options: [
                    { key: 'A', text: 'deshalb' }, { key: 'B', text: 'trotzdem / dennoch' }, { key: 'C', text: 'außerdem' },
                ], correctAnswer: 'B', explanation: 'Gleichwohl = trotzdem, dennoch.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // ══════════ HÖREN 40 min, 100 pts ══════════
    const hoeren = await prisma.examSection.create({
        data: { examId: exam.id, title: 'Hören', skill: 'HOEREN', totalMinutes: 40, totalPoints: 100, sortOrder: 2,
            instructions: 'Sie hören mehrere Texte. Lösen Sie die Aufgaben.' },
    })

    // H1: Nachrichtenbericht — MC (5×5=25)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 1 — Nachrichtenbericht', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 25, sortOrder: 1,
        contentJson: {
            instructions: 'Sie hören einen Nachrichtenbericht. Wählen Sie die richtige Antwort.',
            audioTranscript: `Als nächstes berichten wir über einen bemerkenswerten Durchbruch in der Quantencomputerforschung, der weitreichende Konsequenzen haben dürfte. Forschern am Max-Planck-Institut in Garching bei München ist es gelungen, einen Quantenprozessor zu entwickeln, der erstmals in der Lage ist, bestimmte kryptographische Berechnungen schneller durchzuführen als jeder existierende Supercomputer.

Der Projektleiter, Professor Dr. Schmidt, erläuterte auf einer Pressekonferenz, dass der sogenannte „QPro-7"-Prozessor mit 127 Qubits arbeite und eine Fehlerrate von weniger als 0,1 Prozent aufweise — ein Wert, der bisher als unerreichbar gegolten hatte. Diese niedrige Fehlerrate sei der entscheidende Fortschritt, da Quantencomputer bislang vor allem an der Instabilität ihrer Berechnungen gescheitert seien.

Die Implikationen, so Professor Schmidt, seien sowohl vielversprechend als auch beunruhigend. Einerseits könnten Quantencomputer bahnbrechende Fortschritte in der Medikamentenentwicklung, der Materialwissenschaft und der Klimamodellierung ermöglichen. Andererseits bestehe die reale Gefahr, dass aktuelle Verschlüsselungstechnologien, auf denen die gesamte digitale Sicherheitsinfrastruktur basiert, innerhalb der nächsten zehn Jahre durch Quantencomputer gebrochen werden könnten.

Das Bundesamt für Sicherheit in der Informationstechnik hat bereits eine Task Force eingerichtet, die sich mit der Entwicklung quantensicherer Verschlüsselungsmethoden befasst. Die Bundesregierung hat angekündigt, in den nächsten fünf Jahren 2,3 Milliarden Euro in die Quantentechnologie zu investieren.`,
            passage: 'Ein Nachrichtenbericht über Quantencomputer.',
            items: [
                { id: 'c1h1-1', question: 'Was ist der entscheidende Durchbruch des QPro-7?', options: [
                    { key: 'A', text: 'Seine niedrige Fehlerrate von unter 0,1%' },
                    { key: 'B', text: 'Seine geringe Größe' },
                    { key: 'C', text: 'Sein niedriger Energieverbrauch' },
                ], correctAnswer: 'A', explanation: 'Fehlerrate von weniger als 0,1% — bisher als unerreichbar gegolten.' },
                { id: 'c1h1-2', question: 'Wo wurde der Prozessor entwickelt?', options: [
                    { key: 'A', text: 'An der TU Berlin' },
                    { key: 'B', text: 'Am Max-Planck-Institut in Garching' },
                    { key: 'C', text: 'An der ETH Zürich' },
                ], correctAnswer: 'B', explanation: 'Max-Planck-Institut in Garching bei München.' },
                { id: 'c1h1-3', question: 'Was ist die beunruhigende Seite der Entwicklung?', options: [
                    { key: 'A', text: 'Quantencomputer verbrauchen zu viel Energie' },
                    { key: 'B', text: 'Aktuelle Verschlüsselungstechnologien könnten gebrochen werden' },
                    { key: 'C', text: 'Die Forschung ist zu teuer' },
                ], correctAnswer: 'B', explanation: 'Verschlüsselungstechnologien könnten gebrochen werden.' },
                { id: 'c1h1-4', question: 'Wie viel investiert die Bundesregierung in Quantentechnologie?', options: [
                    { key: 'A', text: '1,5 Milliarden Euro' },
                    { key: 'B', text: '2,3 Milliarden Euro' },
                    { key: 'C', text: '3,7 Milliarden Euro' },
                ], correctAnswer: 'B', explanation: '2,3 Milliarden Euro in fünf Jahren.' },
                { id: 'c1h1-5', question: 'In welchen Bereichen könnten Quantencomputer Fortschritte ermöglichen?', options: [
                    { key: 'A', text: 'Unterhaltung und Tourismus' },
                    { key: 'B', text: 'Landwirtschaft und Fischerei' },
                    { key: 'C', text: 'Medikamentenentwicklung, Materialwissenschaft und Klimamodellierung' },
                ], correctAnswer: 'C', explanation: 'Medikamentenentwicklung, Materialwissenschaft, Klimamodellierung.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // H2: Expertendiskussion — TF (7×5=35)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 2 — Expertendiskussion', exerciseType: 'TRUE_FALSE', maxPoints: 35, sortOrder: 2,
        contentJson: {
            instructions: 'Sie hören eine Expertendiskussion. Wählen Sie: Richtig oder Falsch.',
            audioTranscript: `Moderatorin: Willkommen bei „Zukunft denken". Heute diskutieren wir die Frage: Brauchen wir ein Recht auf digitale Selbstbestimmung? Bei mir sind die Verfassungsrechtlerin Prof. Dr. Lehmann und der Technikunternehmer Herr Baumann.

Prof. Lehmann: Das Grundgesetz, wie es 1949 formuliert wurde, konnte die Herausforderungen der Digitalisierung naturgemäß nicht antizipieren. Dennoch hat das Bundesverfassungsgericht mit seinem wegweisenden Urteil zur informationellen Selbstbestimmung von 1983 einen Grundstein gelegt. Ich plädiere dafür, dieses Recht zu einem umfassenden digitalen Grundrecht weiterzuentwickeln, das nicht nur den Datenschutz, sondern auch den Algorithmus-Einsatz, die KI-gestützte Entscheidungsfindung und das Recht auf ein analoges Leben umfasst.

Herr Baumann: Ich verstehe die Bedenken, Frau Professorin, aber ein solches Grundrecht würde die Innovationsfähigkeit Deutschlands massiv einschränken. Wir hinken bei der Digitalisierung ohnehin schon hinter anderen Ländern her. Statt neue Regulierungen einzuführen, sollten wir die bestehenden Gesetze konsequenter durchsetzen und vor allem die Medienkompetenz der Bürger stärken.

Prof. Lehmann: Da muss ich entschieden widersprechen. Medienkompetenz allein reicht nicht aus, wenn die Machtasymmetrie zwischen Einzelpersonen und globalen Technologiekonzernen so gewaltig ist. Die DSGVO war ein wichtiger Schritt, aber sie greift in vielen Bereichen zu kurz — insbesondere beim algorithmischen Profiling und bei der automatisierten Entscheidungsfindung.

Herr Baumann: Zugegeben, einige Regulierungen sind notwendig. Aber die Umsetzung muss branchenspezifisch und verhältnismäßig sein. Ein Start-up mit fünf Mitarbeitern kann nicht denselben Compliance-Aufwand betreiben wie ein DAX-Konzern.

Prof. Lehmann: Da stimme ich Ihnen ausnahmsweise zu. Verhältnismäßigkeit ist auch ein verfassungsrechtliches Prinzip. Aber der Grundrechtsschutz darf nicht von der Größe eines Unternehmens abhängen.`,
            passage: 'Eine Expertendiskussion über digitale Grundrechte.',
            items: [
                { id: 'c1h2-1', statement: 'Das Grundgesetz von 1949 enthält bereits Regelungen zur Digitalisierung.', correctAnswer: 'FALSCH', explanation: 'Konnte die Herausforderungen der Digitalisierung nicht antizipieren.' },
                { id: 'c1h2-2', statement: 'Prof. Lehmann möchte das Recht auf informationelle Selbstbestimmung erweitern.', correctAnswer: 'RICHTIG', explanation: 'Zu einem umfassenden digitalen Grundrecht weiterentwickeln.' },
                { id: 'c1h2-3', statement: 'Herr Baumann befürwortet ein neues digitales Grundrecht.', correctAnswer: 'FALSCH', explanation: 'Er meint, es würde die Innovationsfähigkeit einschränken.' },
                { id: 'c1h2-4', statement: 'Prof. Lehmann hält Medienkompetenz allein für ausreichend.', correctAnswer: 'FALSCH', explanation: 'Medienkompetenz allein reicht NICHT aus.' },
                { id: 'c1h2-5', statement: 'Die DSGVO greift laut Prof. Lehmann in vielen Bereichen zu kurz.', correctAnswer: 'RICHTIG', explanation: 'Zu kurz, besonders bei algorithmischem Profiling.' },
                { id: 'c1h2-6', statement: 'Herr Baumann hält Regulierungen grundsätzlich für unnötig.', correctAnswer: 'FALSCH', explanation: 'Zugegeben, EINIGE Regulierungen sind notwendig.' },
                { id: 'c1h2-7', statement: 'Beide sind sich einig, dass Verhältnismäßigkeit wichtig ist.', correctAnswer: 'RICHTIG', explanation: 'Prof. Lehmann stimmt Baumann bei Verhältnismäßigkeit zu.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // H3: Interview — MC (5×5=25)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 3 — Kulturinterview', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 25, sortOrder: 3,
        contentJson: {
            instructions: 'Sie hören ein Interview. Wählen Sie die richtige Antwort.',
            audioTranscript: `Moderator: Heute spreche ich mit der Schriftstellerin Nora Bauer, deren neuer Roman „Die Stille zwischen den Worten" wochenlang auf der Bestsellerliste stand. Frau Bauer, Ihr Buch handelt von einer Übersetzerin, die durch eine Sprache eine ganze Kultur entdeckt. Wie autobiografisch ist der Roman?

Nora Bauer: Er ist nicht direkt autobiografisch, aber er speist sich aus meinen Erfahrungen als Übersetzerin. Ich habe zehn Jahre lang japanische Literatur ins Deutsche übertragen und dabei festgestellt, dass es Konzepte gibt, die sich nicht übersetzen lassen — nicht, weil uns die Wörter fehlen, sondern weil uns die dahinterliegenden Erfahrungen fehlen. Das japanische „mono no aware" etwa — das Bewusstsein für die Vergänglichkeit aller Dinge — ist kein Gefühl, das man mit einem Wort einfangen kann. Es erfordert eine andere Art, die Welt zu betrachten.

Moderator: Welche Rolle spielt Sprache Ihrer Meinung nach für das Denken?

Nora Bauer: Eine fundamentale. Die Sapir-Whorf-Hypothese, wonach die Sprache das Denken formt, ist in ihrer starken Variante zwar widerlegt, aber es gibt durchaus empirische Belege dafür, dass Sprache die Wahrnehmung beeinflusst. Russische Muttersprachler können zum Beispiel zwölf verschiedene Blautöne unterscheiden, für die sie jeweils eigene Wörter haben — Englischsprachige hingegen nicht. Sprache erweitert oder begrenzt unser Wahrnehmungsfeld.`,
            passage: 'Ein Kulturinterview im Radio.',
            items: [
                { id: 'c1h3-1', question: 'Worum geht es in Nora Bauers neuem Roman?', options: [
                    { key: 'A', text: 'Um eine Übersetzerin, die durch Sprache eine Kultur entdeckt' },
                    { key: 'B', text: 'Um eine Reise nach Japan' },
                    { key: 'C', text: 'Um eine Journalistin' },
                ], correctAnswer: 'A', explanation: 'Eine Übersetzerin entdeckt durch Sprache eine Kultur.' },
                { id: 'c1h3-2', question: 'Warum lassen sich manche Konzepte laut Bauer nicht übersetzen?', options: [
                    { key: 'A', text: 'Weil die Wörter zu kompliziert sind' },
                    { key: 'B', text: 'Weil uns die dahinterliegenden Erfahrungen fehlen' },
                    { key: 'C', text: 'Weil japanische Grammatik zu schwer ist' },
                ], correctAnswer: 'B', explanation: 'Die dahinterliegenden Erfahrungen fehlen.' },
                { id: 'c1h3-3', question: 'Was ist „mono no aware"?', options: [
                    { key: 'A', text: 'Ein japanisches Gericht' },
                    { key: 'B', text: 'Das Bewusstsein für die Vergänglichkeit aller Dinge' },
                    { key: 'C', text: 'Eine Meditationstechnik' },
                ], correctAnswer: 'B', explanation: 'Bewusstsein für die Vergänglichkeit aller Dinge.' },
                { id: 'c1h3-4', question: 'Was besagt die Sapir-Whorf-Hypothese in ihrer starken Form?', options: [
                    { key: 'A', text: 'Sprache formt das Denken' },
                    { key: 'B', text: 'Denken formt die Sprache' },
                    { key: 'C', text: 'Sprache ist angeboren' },
                ], correctAnswer: 'A', explanation: 'Sprache formt das Denken.' },
                { id: 'c1h3-5', question: 'Was zeigt das Beispiel der russischen Blautöne?', options: [
                    { key: 'A', text: 'Russen sehen keine Farben' },
                    { key: 'B', text: 'Sprache kann die Wahrnehmung beeinflussen' },
                    { key: 'C', text: 'Englisch hat mehr Farbwörter als Russisch' },
                ], correctAnswer: 'B', explanation: 'Sprache beeinflusst die Wahrnehmung.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // H4: Vortrag — TF (3×5=15 → total 100)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 4 — Akademischer Vortrag', exerciseType: 'TRUE_FALSE', maxPoints: 15, sortOrder: 4,
        contentJson: {
            instructions: 'Sie hören einen akademischen Vortrag. Wählen Sie: Richtig oder Falsch.',
            audioTranscript: `Verehrte Kolleginnen und Kollegen, in meinem heutigen Beitrag möchte ich die Ergebnisse unserer dreijährigen Langzeitstudie zum Zusammenhang zwischen Stadtbegrünung und psychischer Gesundheit vorstellen.

Wir haben über 12.000 Probanden in sechs deutschen Großstädten untersucht und dabei sowohl objektive Gesundheitsdaten als auch subjektive Wohlbefindens-Indikatoren erhoben. Das zentrale Ergebnis ist eindeutig: Bewohner von Stadtteilen mit mehr als 40 Prozent Grünflächenanteil weisen eine um 23 Prozent niedrigere Rate an Depressionsdiagnosen auf als Bewohner von Stadtteilen mit weniger als 10 Prozent Grünfläche.

Bemerkenswerterweise konnten wir nachweisen, dass bereits ein täglicher Aufenthalt von 20 Minuten in einer Grünanlage messbare Auswirkungen auf die Cortisolwerte — und damit auf das Stressniveau — hat. Dieser Effekt ist bei Kindern und älteren Menschen besonders stark ausgeprägt.`,
            passage: 'Ein akademischer Vortrag über Stadtbegrünung.',
            items: [
                { id: 'c1h4-1', statement: 'Die Studie wurde über einen Zeitraum von fünf Jahren durchgeführt.', correctAnswer: 'FALSCH', explanation: 'Dreijährige Langzeitstudie.' },
                { id: 'c1h4-2', statement: 'Bewohner grünerer Stadtteile haben eine niedrigere Depressionsrate.', correctAnswer: 'RICHTIG', explanation: '23 Prozent niedrigere Rate.' },
                { id: 'c1h4-3', statement: 'Der positive Effekt von Grünflächen ist bei Kindern und Senioren besonders stark.', correctAnswer: 'RICHTIG', explanation: 'Bei Kindern und älteren Menschen besonders stark.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    console.log(`✅ C1 seeded: ${exam.id}`)
    console.log('   Lesen: MC(25) + TF(25) + Matching(21) + MC(29) = 100 pts')
    console.log('   Hören: MC(25) + TF(35) + MC(25) + TF(15) = 100 pts')
    console.log('   Total: 200 pts, 110 min')
}

main().catch(console.error).finally(() => prisma.$disconnect())
