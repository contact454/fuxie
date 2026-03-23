/**
 * seed-exam-b2.ts — Goethe-Zertifikat B2
 *
 * Lesen: 4 Teile, 65 min, 100 pts
 * Hören: 4 Teile, 40 min, 100 pts
 * Total: 105 min, 200 pts, 60% pass
 *
 * Run: DATABASE_URL='...' npx tsx packages/database/prisma/seed-exam-b2.ts
 */
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('📝 Seeding Goethe B2...')

    const exam = await prisma.examTemplate.upsert({
        where: { slug: 'goethe-b2-modellsatz-1' },
        update: { title: 'Goethe-Zertifikat B2 — Lesen + Hören', totalMinutes: 105, totalPoints: 200, passingScore: 60,
            description: 'Bài thi B2 theo chuẩn Goethe-Institut. Lesen: 4 phần, Hören: 4 phần.' },
        create: { slug: 'goethe-b2-modellsatz-1', title: 'Goethe-Zertifikat B2 — Lesen + Hören',
            examType: 'GOETHE', cefrLevel: 'B2', totalMinutes: 105, totalPoints: 200, passingScore: 60,
            description: 'Bài thi B2 theo chuẩn Goethe-Institut. Lesen: 4 phần, Hören: 4 phần.', status: 'PUBLISHED' },
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

    // ══════════ LESEN 65 min, 100 pts ══════════
    const lesen = await prisma.examSection.create({
        data: { examId: exam.id, title: 'Lesen', skill: 'LESEN', totalMinutes: 65, totalPoints: 100, sortOrder: 1,
            instructions: 'Lesen Sie die Texte und lösen Sie die Aufgaben. Sie haben 65 Minuten Zeit.' },
    })

    // L1: Zeitungs-/Zeitschriftenartikel — MC (5×5=25)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 1 — Zeitungsartikel', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 25, sortOrder: 1,
        contentJson: {
            instructions: 'Lesen Sie den Text und die Aufgaben. Wählen Sie die richtige Antwort.',
            passage: `Künstliche Intelligenz in der Medizin — Fortschritt oder Risiko?

Die Diskussion über den Einsatz künstlicher Intelligenz in der Medizin wird zunehmend kontrovers geführt. Während Befürworter darauf verweisen, dass KI-gestützte Diagnosesysteme bereits heute Hautkrebs zuverlässiger erkennen können als erfahrene Dermatologen, warnen Kritiker vor einer zunehmenden Entmenschlichung der ärztlichen Versorgung.

Am Universitätsklinikum Heidelberg wird seit zwei Jahren ein KI-System getestet, das Röntgenbilder auswertet. Die bisherigen Ergebnisse sind beeindruckend: Das System erkennt Lungenerkrankungen mit einer Genauigkeit von 94 Prozent, während die durchschnittliche Rate bei menschlichen Radiologen bei 87 Prozent liegt. „Die Technologie ersetzt nicht den Arzt, sondern unterstützt ihn bei der Entscheidungsfindung", betont Professorin Dr. Martina Weber, die das Projekt leitet.

Allerdings werden auch die Grenzen deutlich. KI-Systeme können zwar Muster in Daten erkennen, die dem menschlichen Auge verborgen bleiben, doch sie sind nicht in der Lage, den Patienten als Ganzes zu betrachten. Aspekte wie die psychische Verfassung, die Lebensumstände oder die persönliche Krankengeschichte fließen in die algorithmische Analyse nicht ein. Hinzu kommt das Problem der Datensicherheit: Medizinische Daten gehören zu den sensibelsten Informationen überhaupt und müssen entsprechend geschützt werden.

Ein weiterer kritischer Punkt betrifft die sogenannte Bias-Problematik. Da KI-Systeme mit historischen Daten trainiert werden, können bestehende Ungleichheiten in der medizinischen Versorgung reproduziert oder sogar verstärkt werden. Studien aus den USA haben gezeigt, dass bestimmte Bevölkerungsgruppen in den Trainingsdaten unterrepräsentiert sind, was zu weniger präzisen Diagnosen für diese Gruppen führen kann.

Experten plädieren deshalb für einen verantwortungsvollen Umgang mit der neuen Technologie. Der Einsatz von KI sollte transparant dokumentiert und regelmäßig überprüft werden. Außerdem müsse sichergestellt werden, dass Patienten immer das Recht haben, eine rein menschliche Beurteilung zu verlangen.`,
            items: [
                { id: 'b2l1-1', question: 'Was können KI-Diagnosesysteme laut Befürwortern bereits heute?', options: [
                    { key: 'A', text: 'Alle Krankheiten heilen' },
                    { key: 'B', text: 'Bestimmte Krebsarten besser erkennen als Ärzte' },
                    { key: 'C', text: 'Chirurgische Eingriffe durchführen' },
                ], correctAnswer: 'B', explanation: 'Hautkrebs zuverlässiger erkennen als Dermatologen.' },
                { id: 'b2l1-2', question: 'Wie genau erkennt das KI-System in Heidelberg Lungenerkrankungen?', options: [
                    { key: 'A', text: '87 Prozent' },
                    { key: 'B', text: '94 Prozent' },
                    { key: 'C', text: '100 Prozent' },
                ], correctAnswer: 'B', explanation: '94 Prozent Genauigkeit.' },
                { id: 'b2l1-3', question: 'Welchen Aspekt können KI-Systeme NICHT berücksichtigen?', options: [
                    { key: 'A', text: 'Muster in Röntgenbildern' },
                    { key: 'B', text: 'Die psychische Verfassung des Patienten' },
                    { key: 'C', text: 'Große Datenmengen' },
                ], correctAnswer: 'B', explanation: 'Psychische Verfassung, Lebensumstände fließen nicht ein.' },
                { id: 'b2l1-4', question: 'Was versteht man unter der „Bias-Problematik"?', options: [
                    { key: 'A', text: 'KI-Systeme sind zu teuer' },
                    { key: 'B', text: 'KI-Systeme können Datenverluste verursachen' },
                    { key: 'C', text: 'Bestehende Ungleichheiten werden durch die Trainingsdaten reproduziert' },
                ], correctAnswer: 'C', explanation: 'Ungleichheiten in der Versorgung können reproduziert werden.' },
                { id: 'b2l1-5', question: 'Was fordern Experten?', options: [
                    { key: 'A', text: 'KI in der Medizin komplett verbieten' },
                    { key: 'B', text: 'Transparenz und das Recht auf menschliche Beurteilung' },
                    { key: 'C', text: 'Nur KI-gesteuerte Diagnosen zulassen' },
                ], correctAnswer: 'B', explanation: 'Transparenz + Recht auf menschliche Beurteilung.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // L2: Meinungstext — TF (5×5=25)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 2 — Meinungstext', exerciseType: 'TRUE_FALSE', maxPoints: 25, sortOrder: 2,
        contentJson: {
            instructions: 'Lesen Sie den Text. Wählen Sie: Richtig oder Falsch.',
            passage: `Sollte das Wahlrecht ab 16 Jahren eingeführt werden?

Die Debatte über eine Absenkung des Wahlalters auf 16 Jahre hat in Deutschland wieder an Fahrt gewonnen. Befürworter argumentieren, dass junge Menschen von politischen Entscheidungen besonders betroffen seien — schließlich müssten sie mit den Konsequenzen am längsten leben. Kritiker hingegen bezweifeln, ob 16-Jährige über die nötige politische Reife verfügen.

In einigen Bundesländern dürfen Jugendliche bereits ab 16 an Kommunalwahlen teilnehmen. Die Erfahrungen damit werden überwiegend positiv bewertet. Die Wahlbeteiligung unter den 16- und 17-Jährigen lag bei der letzten Kommunalwahl in Brandenburg bei beachtlichen 38 Prozent — höher als bei den 21- bis 25-Jährigen.

Politikwissenschaftlerin Professorin Dr. Schneider von der Universität München argumentiert differenziert: „Jugendliche haben durchaus die Fähigkeit, sich eine politische Meinung zu bilden. Entscheidend ist jedoch, dass sie in der Schule ausreichend auf ihre Rolle als Wähler vorbereitet werden." Sie plädiert daher für eine Kombination aus Wahlrechtsabsenkung und verstärkter politischer Bildung an Schulen.

Die Sorge, dass junge Wähler anfälliger für populistische Parteien seien, konnte durch empirische Studien bislang nicht bestätigt werden. Im Gegenteil: Untersuchungen zeigen, dass sich 16-Jährige, die in der Nähe ihrer Eltern leben und zur Schule gehen, intensiver mit den Wahlprogrammen auseinandersetzen als viele ältere Erstwähler, die ihr Elternhaus bereits verlassen haben.`,
            items: [
                { id: 'b2l2-1', statement: 'Das Wahlalter liegt in ganz Deutschland bereits bei 16 Jahren.', correctAnswer: 'FALSCH', explanation: 'Nur in einigen Bundesländern bei Kommunalwahlen.' },
                { id: 'b2l2-2', statement: 'Die Wahlbeteiligung der 16–17-Jährigen in Brandenburg war höher als die der 21–25-Jährigen.', correctAnswer: 'RICHTIG', explanation: '38% — höher als 21–25-Jährige.' },
                { id: 'b2l2-3', statement: 'Professorin Schneider ist gegen die Absenkung des Wahlalters.', correctAnswer: 'FALSCH', explanation: 'Sie plädiert für Kombination aus Absenkung + politischer Bildung.' },
                { id: 'b2l2-4', statement: 'Studien bestätigen, dass Jugendliche häufiger populistische Parteien wählen.', correctAnswer: 'FALSCH', explanation: 'Konnte NICHT bestätigt werden.' },
                { id: 'b2l2-5', statement: '16-Jährige setzen sich laut Studien intensiver mit Wahlprogrammen auseinander als ältere Erstwähler.', correctAnswer: 'RICHTIG', explanation: 'Intensiver als ältere Erstwähler, die das Elternhaus verlassen haben.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // L3: Anzeigen — Matching (7×3=21)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 3 — Stellenanzeigen', exerciseType: 'MATCHING', maxPoints: 21, sortOrder: 3,
        contentJson: {
            instructions: 'Lesen Sie die Situationen und die Anzeigen. Welche Anzeige passt?',
            situations: [
                { id: 'b2s1', text: 'Eine IT-Fachkraft sucht eine Stelle mit Homeoffice-Option.' },
                { id: 'b2s2', text: 'Eine Studentin sucht ein Praktikum im Bereich Journalismus.' },
                { id: 'b2s3', text: 'Ein Ingenieur möchte im Bereich erneuerbare Energien arbeiten.' },
                { id: 'b2s4', text: 'Eine Lehrerin sucht eine Weiterbildung in digitaler Didaktik.' },
                { id: 'b2s5', text: 'Ein Koch sucht eine Stelle in einem vegetarischen Restaurant.' },
                { id: 'b2s6', text: 'Eine Psychologin möchte in einer Beratungsstelle arbeiten.' },
                { id: 'b2s7', text: 'Ein Architekt sucht ein Projekt im Bereich nachhaltiges Bauen.' },
            ],
            options: [
                { key: 'A', title: 'Software-Entwickler (m/w/d)', snippet: 'TechCorp GmbH sucht Java-Entwickler. 100% remote möglich. Flexible Arbeitszeiten, 30 Urlaubstage. Gehalt: 65.000–80.000€.' },
                { key: 'B', title: 'Redaktionspraktikum', snippet: 'Süddeutsche Zeitung — 6-monatiges Praktikum in der Online-Redaktion. Recherche, Textarbeit, Social-Media-Betreuung. Vergütung: 500€/Monat.' },
                { key: 'C', title: 'Projektingenieur Windenergie', snippet: 'WindPower AG sucht Ingenieur (m/w/d) für Planung und Bau von Windparks. Erfahrung mit CAD-Software erwünscht. Standort: Hamburg.' },
                { key: 'D', title: 'Zertifikatskurs Digitale Schule', snippet: 'Online-Fortbildung für Lehrkräfte: Tablets im Unterricht, Lern-Apps, digitale Prüfungsformate. 6 Monate, berufsbegleitend. Start: Oktober.' },
                { key: 'E', title: 'Küchenchef/in pflanzliche Küche', snippet: 'Veganes Restaurant „Grünherz" sucht erfahrene/n Koch/Köchin. Kreativität und Leidenschaft für pflanzliche Küche. Vollzeit, München.' },
                { key: 'F', title: 'Familienberatung — Psychologe/in', snippet: 'Caritas-Beratungsstelle sucht Diplom-Psychologen/in für Familien- und Erziehungsberatung. Teilzeit 25h/Woche. Supervision wird angeboten.' },
                { key: 'G', title: 'Architekt/in Passivhausbau', snippet: 'ÖkoBau GmbH sucht Architekten für energieeffiziente Wohnprojekte. Erfahrung mit Passivhaus-Standard. Standort: Freiburg.' },
                { key: 'H', title: 'Marketing-Manager/in', snippet: 'Start-up im E-Commerce sucht Marketing-Manager. Social Media, Content, SEO. Erfahrung mit Google Analytics erwünscht.' },
            ],
            correctMapping: { 'b2s1': 'A', 'b2s2': 'B', 'b2s3': 'C', 'b2s4': 'D', 'b2s5': 'E', 'b2s6': 'F', 'b2s7': 'G' },
        } satisfies Prisma.InputJsonValue,
    } })

    // L4: Kommentar — MC (6×~5=29 → total 100)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 4 — Kommentar', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 29, sortOrder: 4,
        contentJson: {
            instructions: 'Lesen Sie den Kommentar. Wählen Sie die richtige Antwort.',
            passage: `Generation Burnout? — Ein Kommentar

Man könnte meinen, die junge Generation hätte es leichter als ihre Eltern: bessere Bildungschancen, mehr Freiheiten, uneingeschränkter Zugang zu Informationen. Doch die Realität sieht anders aus. Psychische Erkrankungen unter jungen Erwachsenen haben in den letzten zehn Jahren dramatisch zugenommen. Laut einer aktuellen Studie der Techniker Krankenkasse ist die Zahl der Krankschreibungen wegen Burnout bei den 18- bis 30-Jährigen um 147 Prozent gestiegen.

Die Ursachen sind vielfältig. Der Arbeitsmarkt verlangt heute eine ständige Verfügbarkeit und Flexibilität, die in früheren Generationen unbekannt war. Gleichzeitig werden junge Menschen über soziale Medien permanent mit idealisierten Lebensmodellen konfrontiert, was den Druck, „erfolgreich" zu sein, zusätzlich erhöht. Die Grenzen zwischen Arbeit und Freizeit verschwimmen zunehmend, wenn berufliche E-Mails auch am Wochenende beantwortet werden müssen.

Besonders betroffen sind Berufseinsteiger, die sich in einer Phase befinden, in der sie gleichzeitig Karriere machen, eine Familie gründen und finanzielle Unabhängigkeit erreichen sollen — Anforderungen, die sich häufig widersprechen. Die Mieten in Großstädten verschlingen bis zu 50 Prozent des Einkommens, sodass der Traum vom Eigenheim für viele unerreichbar geworden ist.

Was muss sich ändern? Unternehmen sollten ihre Fürsorgepflicht ernst nehmen und präventive Maßnahmen ergreifen: flexible Arbeitszeitmodelle, Recht auf Nichterreichbarkeit nach Feierabend und niedrigschwellige psychologische Beratungsangebote. Darüber hinaus brauchen wir eine gesellschaftliche Debatte darüber, was „Erfolg" eigentlich bedeutet — jenseits von Karriere und materiellem Wohlstand.`,
            items: [
                { id: 'b2l4-1', question: 'Wie hat sich die Burnout-Rate bei jungen Erwachsenen entwickelt?', options: [
                    { key: 'A', text: 'Sie ist um 147% gestiegen' }, { key: 'B', text: 'Sie ist leicht gesunken' }, { key: 'C', text: 'Sie ist gleich geblieben' },
                ], correctAnswer: 'A', explanation: '147 Prozent gestiegen.' },
                { id: 'b2l4-2', question: 'Was verursacht laut Text zusätzlichen Druck?', options: [
                    { key: 'A', text: 'Fehlende Bildungschancen' },
                    { key: 'B', text: 'Idealisierte Lebensmodelle in sozialen Medien' },
                    { key: 'C', text: 'Zu wenig Arbeitsplätze' },
                ], correctAnswer: 'B', explanation: 'Idealisierte Lebensmodelle über soziale Medien.' },
                { id: 'b2l4-3', question: 'Wie viel vom Einkommen geben manche junge Leute für Miete aus?', options: [
                    { key: 'A', text: 'Bis zu 30 Prozent' }, { key: 'B', text: 'Bis zu 40 Prozent' }, { key: 'C', text: 'Bis zu 50 Prozent' },
                ], correctAnswer: 'C', explanation: 'Bis zu 50 Prozent des Einkommens.' },
                { id: 'b2l4-4', question: 'Was bedeutet „Nichterreichbarkeit nach Feierabend"?', options: [
                    { key: 'A', text: 'Man kann das Büro nicht verlassen' },
                    { key: 'B', text: 'Man muss nach der Arbeit keine E-Mails beantworten' },
                    { key: 'C', text: 'Man hat keinen Internetzugang' },
                ], correctAnswer: 'B', explanation: 'Recht, nach Feierabend nicht erreichbar sein zu müssen.' },
                { id: 'b2l4-5', question: 'Was fordert der Autor insgesamt?', options: [
                    { key: 'A', text: 'Weniger Arbeit für junge Menschen' },
                    { key: 'B', text: 'Höhere Gehälter' },
                    { key: 'C', text: 'Prävention durch Unternehmen und neue Definition von Erfolg' },
                ], correctAnswer: 'C', explanation: 'Präventive Maßnahmen + gesellschaftliche Debatte über Erfolg.' },
                { id: 'b2l4-6', question: 'Was versteht der Autor unter den „widersprüchlichen Anforderungen"?', options: [
                    { key: 'A', text: 'Karriere, Familie und finanzielle Unabhängigkeit gleichzeitig' },
                    { key: 'B', text: 'Studium und Arbeit' },
                    { key: 'C', text: 'Sport und Ernährung' },
                ], correctAnswer: 'A', explanation: 'Karriere, Familie und finanzielle Unabhängigkeit gleichzeitig.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // ══════════ HÖREN 40 min, 100 pts ══════════
    const hoeren = await prisma.examSection.create({
        data: { examId: exam.id, title: 'Hören', skill: 'HOEREN', totalMinutes: 40, totalPoints: 100, sortOrder: 2,
            instructions: 'Sie hören mehrere Texte. Lösen Sie die Aufgaben.' },
    })

    // H1: Radiobericht — MC (5×5=25)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 1 — Radiobericht', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 25, sortOrder: 1,
        contentJson: {
            instructions: 'Sie hören einen Radiobericht. Wählen Sie die richtige Antwort.',
            audioTranscript: `Und nun zu einem Thema, das viele Städte betrifft: die zunehmende Gentrifizierung in deutschen Großstädten.

Reporter Jan Fischer berichtet aus dem Berliner Stadtteil Kreuzberg, der sich in den letzten Jahren stark verändert hat. Wo früher kleine türkische Geschäfte und alternative Kulturprojekte das Straßenbild prägten, eröffnen heute teure Boutiquen und Szene-Restaurants.

Die Folgen sind dramatisch: Die Mieten sind in Kreuzberg seit 2015 um durchschnittlich 65 Prozent gestiegen. Viele langjährige Bewohner können sich ihre Wohnungen nicht mehr leisten und werden an den Stadtrand verdrängt.

Die Stadtregierung hat reagiert und den sogenannten „Mietendeckel" eingeführt, der die Mieterhöhungen auf maximal 2 Prozent pro Jahr begrenzt. Allerdings sind Neubauten von dieser Regelung ausgenommen, was Kritiker als eine entscheidende Schwäche betrachten.

Soziologe Professor Dr. Hartmann erklärt: „Gentrifizierung ist nicht grundsätzlich negativ. Sie bringt auch Investitionen und eine bessere Infrastruktur mit sich. Das Problem entsteht jedoch, wenn die ursprüngliche Bevölkerung systematisch verdrängt wird und die soziale Mischung eines Viertels verloren geht."`,
            passage: 'Ein Radiobericht über Gentrifizierung.',
            items: [
                { id: 'b2h1-1', question: 'Wie haben sich die Geschäfte in Kreuzberg verändert?', options: [
                    { key: 'A', text: 'Es gibt mehr kleine türkische Geschäfte' },
                    { key: 'B', text: 'Teure Boutiquen ersetzen die kleinen Geschäfte' },
                    { key: 'C', text: 'Alle Geschäfte haben geschlossen' },
                ], correctAnswer: 'B', explanation: 'Teure Boutiquen und Szene-Restaurants.' },
                { id: 'b2h1-2', question: 'Um wie viel Prozent sind die Mieten gestiegen?', options: [
                    { key: 'A', text: '45 Prozent' }, { key: 'B', text: '55 Prozent' }, { key: 'C', text: '65 Prozent' },
                ], correctAnswer: 'C', explanation: '65 Prozent seit 2015.' },
                { id: 'b2h1-3', question: 'Was ist der „Mietendeckel"?', options: [
                    { key: 'A', text: 'Mieten dürfen maximal 2% pro Jahr steigen' },
                    { key: 'B', text: 'Mieten werden komplett eingefroren' },
                    { key: 'C', text: 'Mieten werden um 10% gesenkt' },
                ], correctAnswer: 'A', explanation: 'Maximal 2 Prozent pro Jahr.' },
                { id: 'b2h1-4', question: 'Was sagt Professor Hartmann über Gentrifizierung?', options: [
                    { key: 'A', text: 'Sie ist immer negativ' },
                    { key: 'B', text: 'Sie hat positive Seiten, aber die Verdrängung ist problematisch' },
                    { key: 'C', text: 'Sie ist ausschließlich positiv' },
                ], correctAnswer: 'B', explanation: 'Nicht grundsätzlich negativ, aber Verdrängung ist das Problem.' },
                { id: 'b2h1-5', question: 'Was wird als Schwäche des Mietendeckels betrachtet?', options: [
                    { key: 'A', text: 'Er gilt nicht für Neubauten' },
                    { key: 'B', text: 'Er ist zu streng' },
                    { key: 'C', text: 'Er wird nicht kontrolliert' },
                ], correctAnswer: 'A', explanation: 'Neubauten sind ausgenommen.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // H2: Diskussion — TF (5×5=25)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 2 — Diskussion', exerciseType: 'TRUE_FALSE', maxPoints: 25, sortOrder: 2,
        contentJson: {
            instructions: 'Sie hören eine Diskussion. Wählen Sie: Richtig oder Falsch.',
            audioTranscript: `Moderator: Willkommen bei „Pro & Contra"! Heute diskutieren wir über das bedingungslose Grundeinkommen. Bei mir sind Wirtschaftsprofessor Dr. Bachmann und die Unternehmerin Frau Keller.

Dr. Bachmann: Vielen Dank. Ich bin ein entschiedener Befürworter des Grundeinkommens. Jeder Bürger sollte monatlich 1.200 Euro erhalten — ohne Bedingungen, ohne Bürokratie. Das würde nicht nur die Armut reduzieren, sondern auch die Menschen dazu befähigen, sinnvollere Arbeit zu suchen. In Finnland wurde bereits ein Pilotprojekt durchgeführt, und die Ergebnisse waren ermutigend: Die Teilnehmer waren zufriedener und gesünder, obwohl sie nicht weniger gearbeitet haben.

Frau Keller: Mit Verlaub, Herr Professor, aber wer soll das bezahlen? Wenn wir jedem Erwachsenen in Deutschland 1.200 Euro zahlen würden, bräuchten wir jährlich über 900 Milliarden Euro. Das ist mehr als der gesamte Bundeshaushalt! Außerdem befürchte ich, dass ein Grundeinkommen den Arbeitsanreiz erheblich verringern würde. In meinem Unternehmen habe ich schon jetzt Schwierigkeiten, motivierte Mitarbeiter zu finden.

Dr. Bachmann: Die Finanzierung ist durchaus machbar. Man könnte das bestehende Sozialsystem — mit seinen zahlreichen Einzelleistungen und dem enormen Verwaltungsapparat — durch ein einheitliches Grundeinkommen ersetzen. Allein die eingesparten Bürokratiekosten wären beträchtlich. Und was den Arbeitsanreiz betrifft: Die finnische Studie hat genau das Gegenteil gezeigt.

Frau Keller: Eine Studie mit nur 2.000 Teilnehmern kann man doch nicht auf 80 Millionen Menschen übertragen! Ich plädiere stattdessen für gezielte Unterstützung derjenigen, die sie wirklich brauchen.`,
            passage: 'Eine Fernsehdiskussion über das bedingungslose Grundeinkommen.',
            items: [
                { id: 'b2h2-1', statement: 'Dr. Bachmann schlägt vor, jedem Bürger 1.200 Euro monatlich zu zahlen.', correctAnswer: 'RICHTIG', explanation: '1.200 Euro ohne Bedingungen.' },
                { id: 'b2h2-2', statement: 'Die Teilnehmer des finnischen Projekts haben weniger gearbeitet.', correctAnswer: 'FALSCH', explanation: 'Sie haben NICHT weniger gearbeitet.' },
                { id: 'b2h2-3', statement: 'Frau Keller hält die Finanzierung für machbar.', correctAnswer: 'FALSCH', explanation: 'Sie fragt: Wer soll das bezahlen? 900 Mrd. Euro.' },
                { id: 'b2h2-4', statement: 'Dr. Bachmann möchte das bestehende Sozialsystem durch ein Grundeinkommen ersetzen.', correctAnswer: 'RICHTIG', explanation: 'Bestehende Einzelleistungen ersetzen.' },
                { id: 'b2h2-5', statement: 'Frau Keller ist für eine gezielte Unterstützung statt eines Grundeinkommens.', correctAnswer: 'RICHTIG', explanation: 'Gezielte Unterstützung für Bedürftige.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // H3: Interview — MC (5×5=25)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 3 — Experteninterview', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 25, sortOrder: 3,
        contentJson: {
            instructions: 'Sie hören ein Interview. Wählen Sie die richtige Antwort.',
            audioTranscript: `Moderatorin: Heute ist die Verhaltensforscherin Dr. Claudia Sommer bei uns, die seit 15 Jahren das Schlafverhalten von Deutschen untersucht. Frau Dr. Sommer, stimmt es, dass wir immer weniger schlafen?

Dr. Sommer: Leider ja. In den letzten 30 Jahren hat sich die durchschnittliche Schlafdauer in Deutschland um fast eine Stunde verkürzt — von 8,2 auf 7,3 Stunden pro Nacht. Besonders besorgniserregend ist die Situation bei jungen Erwachsenen zwischen 18 und 30, die im Durchschnitt nur noch 6,5 Stunden schlafen.

Moderatorin: Was sind die Hauptursachen dafür?

Dr. Sommer: Der größte Faktor ist die Bildschirmnutzung vor dem Einschlafen. Das blaue Licht von Smartphones und Tablets unterdrückt die Produktion des Schlafhormons Melatonin. Aber auch Schichtarbeit, psychischer Stress und die zunehmende Lärmbelastung in Städten spielen eine Rolle. Interessanterweise hat die Pandemie bei vielen Menschen zunächst zu mehr Schlaf geführt, weil der Arbeitsweg weggefallen ist. Dieser positive Effekt hat sich allerdings schnell wieder umgekehrt.

Moderatorin: Was raten Sie konkret?

Dr. Sommer: Erstens: mindestens eine Stunde vor dem Schlafengehen kein Bildschirm mehr. Zweitens: feste Schlafenszeiten, auch am Wochenende. Drittens: ein kühles, dunkles Schlafzimmer — idealerweise zwischen 16 und 18 Grad. Und viertens: regelmäßige Bewegung, aber nicht direkt vor dem Einschlafen.`,
            passage: 'Ein Radiointerview zum Thema Schlaf.',
            items: [
                { id: 'b2h3-1', question: 'Um wie viel hat sich die durchschnittliche Schlafdauer verringert?', options: [
                    { key: 'A', text: 'Um etwa 30 Minuten' }, { key: 'B', text: 'Um fast eine Stunde' }, { key: 'C', text: 'Um zwei Stunden' },
                ], correctAnswer: 'B', explanation: 'Fast eine Stunde: von 8,2 auf 7,3.' },
                { id: 'b2h3-2', question: 'Was ist der wichtigste Grund für weniger Schlaf?', options: [
                    { key: 'A', text: 'Bildschirmnutzung vor dem Einschlafen' },
                    { key: 'B', text: 'Zu viel Kaffee' },
                    { key: 'C', text: 'Zu warme Schlafzimmer' },
                ], correctAnswer: 'A', explanation: 'Bildschirmnutzung — blaues Licht unterdrückt Melatonin.' },
                { id: 'b2h3-3', question: 'Wie hat die Pandemie den Schlaf zunächst beeinflusst?', options: [
                    { key: 'A', text: 'Negativ — weniger Schlaf' },
                    { key: 'B', text: 'Positiv — mehr Schlaf' },
                    { key: 'C', text: 'Gar nicht' },
                ], correctAnswer: 'B', explanation: 'Zunächst mehr Schlaf, weil Arbeitsweg weggefallen ist.' },
                { id: 'b2h3-4', question: 'Welche Temperatur empfiehlt Dr. Sommer für das Schlafzimmer?', options: [
                    { key: 'A', text: '14–16 Grad' }, { key: 'B', text: '16–18 Grad' }, { key: 'C', text: '20–22 Grad' },
                ], correctAnswer: 'B', explanation: '16 bis 18 Grad.' },
                { id: 'b2h3-5', question: 'Was soll man vor dem Schlafengehen vermeiden?', options: [
                    { key: 'A', text: 'Wasser trinken' },
                    { key: 'B', text: 'Lesen im Bett' },
                    { key: 'C', text: 'Sport direkt vor dem Einschlafen' },
                ], correctAnswer: 'C', explanation: 'Bewegung ja, aber NICHT direkt vor dem Einschlafen.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // H4: Vortrag — TF (5×5=25 → total 100)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 4 — Fachvortrag', exerciseType: 'TRUE_FALSE', maxPoints: 25, sortOrder: 4,
        contentJson: {
            instructions: 'Sie hören einen Vortrag. Wählen Sie: Richtig oder Falsch.',
            audioTranscript: `Meine Damen und Herren, herzlich willkommen zu meinem Vortrag über die Zukunft der Mobilität in deutschen Städten.

Die Verkehrswende, von der in der Politik so viel gesprochen wird, hat tatsächlich bereits begonnen — wenn auch langsam. Im letzten Jahr wurden in Deutschland erstmals mehr E-Autos zugelassen als Dieselfahrzeuge. Gleichzeitig verzeichnen die öffentlichen Verkehrsmittel einen Rekordanstieg: Seit der Einführung des 49-Euro-Tickets sind die Fahrgastzahlen im Nahverkehr um 18 Prozent gestiegen.

Besonders innovativ ist das Konzept der „Superblocks", das aus Barcelona stammt und nun in mehreren deutschen Städten erprobt wird. Dabei werden ganze Wohnblöcke für den Durchgangsverkehr gesperrt. Anwohner können ihre Straßen für Spielplätze, Grünanlagen und Außengastronomie nutzen. In Hamburg-Ottensen wurde das Konzept bereits erfolgreich getestet: Die Luftqualität hat sich messbar verbessert, und die Zufriedenheit der Anwohner ist von 45 auf 78 Prozent gestiegen.

Kritiker bemängeln allerdings, dass die Verkehrswende soziale Ungleichheiten verschärfen könnte. E-Autos sind weiterhin deutlich teurer als Verbrenner, und der öffentliche Nahverkehr auf dem Land bleibt unzureichend. Wer in ländlichen Regionen lebt, ist nach wie vor auf das Auto angewiesen.

Zusammenfassend lässt sich sagen: Die Verkehrswende wird nur dann erfolgreich sein, wenn sie sozial gerecht gestaltet wird und nicht nur ein Privileg der Städter bleibt.`,
            passage: 'Ein Fachvortrag über Mobilität.',
            items: [
                { id: 'b2h4-1', statement: 'Es wurden mehr E-Autos als Dieselfahrzeuge zugelassen.', correctAnswer: 'RICHTIG', explanation: 'Erstmals mehr E-Autos als Diesel.' },
                { id: 'b2h4-2', statement: 'Das 49-Euro-Ticket hat zu weniger Fahrgästen geführt.', correctAnswer: 'FALSCH', explanation: '18% MEHR Fahrgäste.' },
                { id: 'b2h4-3', statement: 'Das „Superblocks"-Konzept kommt ursprünglich aus Berlin.', correctAnswer: 'FALSCH', explanation: 'Aus Barcelona.' },
                { id: 'b2h4-4', statement: 'In Hamburg-Ottensen ist die Zufriedenheit der Anwohner gestiegen.', correctAnswer: 'RICHTIG', explanation: 'Von 45 auf 78 Prozent.' },
                { id: 'b2h4-5', statement: 'Kritiker sagen, die Verkehrswende könnte soziale Ungleichheiten verschärfen.', correctAnswer: 'RICHTIG', explanation: 'E-Autos teuer + ÖPNV auf dem Land unzureichend.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    console.log(`✅ B2 seeded: ${exam.id}`)
    console.log('   Lesen: MC(25) + TF(25) + Matching(21) + MC(29) = 100 pts')
    console.log('   Hören: MC(25) + TF(25) + MC(25) + TF(25) = 100 pts')
    console.log('   Total: 200 pts, 105 min')
}

main().catch(console.error).finally(() => prisma.$disconnect())
