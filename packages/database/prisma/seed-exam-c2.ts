/**
 * seed-exam-c2.ts — Goethe-Zertifikat C2 (Großes Deutsches Sprachdiplom)
 *
 * Lesen: 4 Teile, 80 min, 100 pts
 * Hören: 2 Teile, 35 min, 100 pts
 * Total: 115 min, 200 pts, 60% pass
 *
 * Run: DATABASE_URL='...' npx tsx packages/database/prisma/seed-exam-c2.ts
 */
import { PrismaClient, Prisma } from '@prisma/client'
const prisma = new PrismaClient()

async function main() {
    console.log('📝 Seeding Goethe C2 — Großes Deutsches Sprachdiplom...')

    const exam = await prisma.examTemplate.upsert({
        where: { slug: 'goethe-c2-modellsatz-1' },
        update: { title: 'Goethe-Zertifikat C2 (GDS) — Lesen + Hören', totalMinutes: 115, totalPoints: 200, passingScore: 60,
            description: 'Bài thi C2 — Großes Deutsches Sprachdiplom. Trình độ cao nhất. Lesen: 4 phần, Hören: 2 phần.' },
        create: { slug: 'goethe-c2-modellsatz-1', title: 'Goethe-Zertifikat C2 (GDS) — Lesen + Hören',
            examType: 'GOETHE', cefrLevel: 'C2', totalMinutes: 115, totalPoints: 200, passingScore: 60,
            description: 'Bài thi C2 — Großes Deutsches Sprachdiplom. Trình độ cao nhất. Lesen: 4 phần, Hören: 2 phần.', status: 'PUBLISHED' },
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

    // ══════════ LESEN 80 min, 100 pts ══════════
    const lesen = await prisma.examSection.create({
        data: { examId: exam.id, title: 'Lesen', skill: 'LESEN', totalMinutes: 80, totalPoints: 100, sortOrder: 1,
            instructions: 'Lesen Sie die Texte und lösen Sie die Aufgaben. Sie haben 80 Minuten Zeit.' },
    })

    // L1: Literarisch-philosophischer Text — MC (5×5=25)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 1 — Philosophischer Text', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 25, sortOrder: 1,
        contentJson: {
            instructions: 'Lesen Sie den Text und die Aufgaben. Wählen Sie die richtige Antwort.',
            passage: `Die Tyrannei der Authentizität — Eine philosophische Intervention

In kaum einem anderen Diskurs der Gegenwart wird so viel Emphase auf das Authentische gelegt wie in der Selbstoptimierungsindustrie, die uns unermüdlich dazu auffordert, unser „wahres Selbst" zu entdecken und zu leben. Doch bei näherer Betrachtung erweist sich der inflationäre Gebrauch des Authentizitätsbegriffs als zutiefst paradox: Die Aufforderung, authentisch zu sein, impliziert bereits, dass Authentizität etwas ist, das hergestellt werden muss — und widerspricht damit der Idee der Unmittelbarkeit, die dem Begriff innewohnt.

Der Existenzialist Jean-Paul Sartre hätte in dieser Obsession mit dem „wahren Selbst" zweifellos einen Akt der mauvaise foi — der Selbsttäuschung — erkannt. Für Sartre gibt es kein vorgefertigtes Wesen, das es zu entdecken gälte; der Mensch ist vielmehr dazu verurteilt, sich in jedem Augenblick neu zu entwerfen. Die Vorstellung eines essentiellen, authentischen Kerns, der nur freigelegt werden müsse, sei nichts anderes als der Versuch, sich vor der existenziellen Angst der radikalen Freiheit zu schützen.

Der Soziologe Andreas Reckwitz nimmt diese Kritik in seiner Analyse der „Gesellschaft der Singularitäten" auf und verleiht ihr eine kultursoziologische Wendung. Er argumentiert, dass das Streben nach Einzigartigkeit und Authentizität keineswegs ein genuiner Ausdruck individueller Freiheit sei, sondern vielmehr eine kulturelle Norm — ein performativer Widerspruch par excellence. Die spätmoderne Gesellschaft, so Reckwitz, habe die Einzigartigkeit zum Imperativ erhoben: Wer nicht authentisch ist, scheitert nach den Maßstäben einer Kultur, die gerade das Nicht-Normative zur Norm erklärt hat.

Hannah Arendt bietet hier einen produktiveren Ansatz. In ihrer Konzeption der Pluralität betont sie, dass sich das Wer-Sein eines Menschen gerade nicht in der Introspektion offenbart, sondern erst im Handeln und Sprechen vor anderen — in der Öffentlichkeit, im politischen Raum. Authentizität wäre demnach keine Eigenschaft, die man besitzt, sondern ein Geschehen, das sich in der Begegnung mit dem Anderen ereignet.

Die Konsequenz dieser Überlegungen ist keineswegs nihilistisch. Sie befreit vielmehr von dem erschöpfenden Imperativ, ein „wahres Selbst" finden zu müssen, und eröffnet den Blick auf das, was Arendt als „Natalität" bezeichnet hat: die Fähigkeit, Neues anzufangen — nicht aus einem vorgegebenen Wesen heraus, sondern aus der radikalen Offenheit der menschlichen Existenz.`,
            items: [
                { id: 'c2l1-1', question: 'Was ist der zentrale Widerspruch des Authentizitätsbegriffs laut Text?', options: [
                    { key: 'A', text: 'Authentizität ist zu teuer, um sie zu erreichen' },
                    { key: 'B', text: 'Die Aufforderung, authentisch zu sein, setzt voraus, dass Authentizität hergestellt werden muss' },
                    { key: 'C', text: 'Authentische Menschen sind in der Regel unglücklich' },
                ], correctAnswer: 'B', explanation: 'Herstellung widerspricht der Idee der Unmittelbarkeit.' },
                { id: 'c2l1-2', question: 'Was hätte Sartre in der Obsession mit dem „wahren Selbst" gesehen?', options: [
                    { key: 'A', text: 'Einen Akt der Selbsttäuschung (mauvaise foi)' },
                    { key: 'B', text: 'Einen lobenswerten Akt der Selbsterkenntnis' },
                    { key: 'C', text: 'Eine religiöse Praxis' },
                ], correctAnswer: 'A', explanation: 'Mauvaise foi — Schutz vor der Angst radikaler Freiheit.' },
                { id: 'c2l1-3', question: 'Was meint Reckwitz mit „performativem Widerspruch"?', options: [
                    { key: 'A', text: 'Authentizität ist unmöglich' },
                    { key: 'B', text: 'Das Streben nach Einzigartigkeit ist selbst zur kulturellen Norm geworden' },
                    { key: 'C', text: 'Performance-Kunst widerspricht sich selbst' },
                ], correctAnswer: 'B', explanation: 'Einzigartigkeit zum Imperativ erhoben — Nicht-Normatives wird zur Norm.' },
                { id: 'c2l1-4', question: 'Wie versteht Arendt Authentizität?', options: [
                    { key: 'A', text: 'Als innere Eigenschaft, die man introspektiv entdeckt' },
                    { key: 'B', text: 'Als politisches Programm' },
                    { key: 'C', text: 'Als Geschehen, das sich in der Begegnung mit Anderen ereignet' },
                ], correctAnswer: 'C', explanation: 'Nicht Introspektion, sondern Handeln vor Anderen.' },
                { id: 'c2l1-5', question: 'Was ist „Natalität" im Sinne Arendts?', options: [
                    { key: 'A', text: 'Die biologische Geburt eines Menschen' },
                    { key: 'B', text: 'Die Fähigkeit, aus radikaler Offenheit Neues anzufangen' },
                    { key: 'C', text: 'Die Rückkehr zur Natur' },
                ], correctAnswer: 'B', explanation: 'Fähigkeit, Neues anzufangen — aus Offenheit, nicht aus vorgegebenem Wesen.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // L2: Wissenschaftlicher Artikel — TF (5×5=25)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 2 — Wissenschaftlicher Artikel', exerciseType: 'TRUE_FALSE', maxPoints: 25, sortOrder: 2,
        contentJson: {
            instructions: 'Lesen Sie den Text. Wählen Sie: Richtig oder Falsch.',
            passage: `Die Epistemologie des Nichtwissens — Agnotologie als Forschungsfeld

In einer Welt, die sich gerne als „Wissensgesellschaft" versteht, erscheint die systematische Erforschung des Nichtwissens auf den ersten Blick als ein marginales, wenn nicht gar absurdes Unterfangen. Und doch hat sich die Agnotologie — ein von dem Wissenschaftshistoriker Robert Proctor in den 1990er-Jahren geprägter Terminus — als eines der intellektuell aufregendsten Forschungsfelder der letzten Jahrzehnte etabliert. Die zentrale These der Agnotologie lautet: Nichtwissen ist nicht lediglich die Abwesenheit von Wissen, sondern wird in vielen Fällen aktiv produziert und strategisch eingesetzt.

Das paradigmatische Beispiel hierfür liefert die Tabakindustrie. Interne Dokumente, die im Zuge von Gerichtsverfahren öffentlich wurden, belegen, dass die großen Tabakkonzerne bereits in den 1950er-Jahren über die krebserregende Wirkung des Rauchens informiert waren. Anstatt diese Erkenntnisse zu veröffentlichen, investierten sie Milliarden in die gezielte Erzeugung wissenschaftlicher Zweifel — eine Strategie, die Frank Luntz später als „Manufactured Doubt" bezeichnete und die seither in zahlreichen Kontexten kopiert wurde, nicht zuletzt in der Klimaleugner-Bewegung.

Die epistemologischen Implikationen dieser Befunde sind erheblich. Sie nötigen uns zu der Einsicht, dass die naive Vorstellung einer linearen Wissensprogression — wonach die Menschheit stetig mehr weiß und weniger nicht weiß — unhaltbar geworden ist. Vielmehr stehen wir vor der irritierenden Erkenntnis, dass Wissen und Nichtwissen in einem dialektischen Verhältnis zueinander stehen: Jeder Wissenszuwachs generiert neue Formen des Nichtwissens, und umgekehrt kann die strategische Produktion von Nichtwissen durchaus als eine — wenn auch pervertierte — Form der Wissensproduktion verstanden werden.

Für die demokratische Öffentlichkeit hat dies gravierende Konsequenzen. Wenn Nichtwissen nicht nur ein kognitives Defizit, sondern ein Machtinstrument sein kann, dann reicht wissenschaftliche Aufklärung allein nicht aus, um dem Problem zu begegnen. Es bedarf vielmehr einer kritischen Epistemologie, die nicht nur fragt, was wir wissen, sondern auch: Wer hat ein Interesse daran, dass wir bestimmte Dinge nicht wissen?`,
            items: [
                { id: 'c2l2-1', statement: 'Der Begriff „Agnotologie" wurde von dem Philosophen Karl Popper geprägt.', correctAnswer: 'FALSCH', explanation: 'Von Robert Proctor in den 1990er-Jahren.' },
                { id: 'c2l2-2', statement: 'Die Tabakindustrie wusste bereits in den 1950ern um die krebserregende Wirkung des Rauchens.', correctAnswer: 'RICHTIG', explanation: 'Interne Dokumente belegen dies.' },
                { id: 'c2l2-3', statement: 'Die Strategie der „Manufactured Doubt" wurde nur in der Tabakindustrie angewandt.', correctAnswer: 'FALSCH', explanation: 'In zahlreichen Kontexten kopiert, auch Klimaleugner.' },
                { id: 'c2l2-4', statement: 'Der Text besagt, dass jeder Wissenszuwachs neue Formen des Nichtwissens generiert.', correctAnswer: 'RICHTIG', explanation: 'Dialektisches Verhältnis: Wissen generiert neues Nichtwissen.' },
                { id: 'c2l2-5', statement: 'Der Autor hält wissenschaftliche Aufklärung allein für ausreichend, um dem Problem zu begegnen.', correctAnswer: 'FALSCH', explanation: 'Reicht NICHT aus — es bedarf kritischer Epistemologie.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // L3: Abstracts / Konferenzprogramm — Matching (7×3=21)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 3 — Konferenzabstracts', exerciseType: 'MATCHING', maxPoints: 21, sortOrder: 3,
        contentJson: {
            instructions: 'Lesen Sie die Forschungsinteressen und die Konferenz-Abstracts. Welcher Vortrag passt?',
            situations: [
                { id: 'c2s1', text: 'Forschung zur Sprachverarbeitung im Gehirn bei Mehrsprachigkeit.' },
                { id: 'c2s2', text: 'Klimafolgenforschung mit Schwerpunkt auf Permafrost-Dynamik.' },
                { id: 'c2s3', text: 'Ethische Fragen der Keimbahntherapie beim Menschen.' },
                { id: 'c2s4', text: 'Algorithmenbasierte Diskriminierung im Justizsystem.' },
                { id: 'c2s5', text: 'Phänomenologische Ansätze in der Architekturtheorie.' },
                { id: 'c2s6', text: 'Migrationssoziologie mit Fokus auf transnationale Identitäten.' },
                { id: 'c2s7', text: 'Quantitative Methoden in der historischen Linguistik.' },
            ],
            options: [
                { key: 'A', title: 'Neurolinguistik der Polyglotten', snippet: 'fMRT-Studie zur neuronalen Reorganisation bei simultaner Dreisprachigkeit. Evidenz für kognitive Reserveeffekte bei L3-Erwerb.' },
                { key: 'B', title: 'Kryosphärische Kipppunkte', snippet: 'Modellierung der Methan-Emissionen aus arktischem Permafrost unter RCP-8.5-Szenarien. Implikationen für das globale Kohlenstoffbudget.' },
                { key: 'C', title: 'CRISPR und die Menschenwürde', snippet: 'Zur Vereinbarkeit von Keimbahninterventionen mit Art. 1 GG. Rechtsphilosophische Analyse unter Berücksichtigung des Vorsorgeprinzips.' },
                { key: 'D', title: 'Algorithmische Gerechtigkeit', snippet: 'Empirische Analyse von Racial Bias in Predictive-Policing-Systemen und Risk-Assessment-Tools. Fallstudien aus US-amerikanischen Gerichten.' },
                { key: 'E', title: 'Leiblichkeit und Raum', snippet: 'Merleau-Pontys Phänomenologie des Leibes als Grundlage einer verkörperten Architekturästhetik. Implikationen für barrierefreies Entwerfen.' },
                { key: 'F', title: 'Diasporische Subjektivitäten', snippet: 'Narrative Identitätskonstruktionen in transnationalen Migrationsbiographien. Qualitative Längsschnittstudie mit deutsch-türkischen Akademikern.' },
                { key: 'G', title: 'Phylogenetische Sprachmodelle', snippet: 'Bayesianische Rekonstruktion indogermanischer Lautwandelprozesse. Vergleichende Analyse mit Maximum-Likelihood- und parsimonie-basierten Ansätzen.' },
                { key: 'H', title: 'Digitale Hermeneutik', snippet: 'Zur Anwendbarkeit gadamerscher Hermeneutik auf die Interpretation algorithmisch kuratierter Textkorpora.' },
            ],
            correctMapping: { 'c2s1': 'A', 'c2s2': 'B', 'c2s3': 'C', 'c2s4': 'D', 'c2s5': 'E', 'c2s6': 'F', 'c2s7': 'G' },
        } satisfies Prisma.InputJsonValue,
    } })

    // L4: Feuilleton / Kulturessay — MC (6×~5=29 → total 100)
    await prisma.examTask.create({ data: { sectionId: lesen.id, title: 'Teil 4 — Feuilleton', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 29, sortOrder: 4,
        contentJson: {
            instructions: 'Lesen Sie den Kulturessay. Wählen Sie die richtige Antwort.',
            passage: `Die Musealisierung der Gegenwart — Über die Konservierung des Vergänglichen

Es gehört zu den Eigentümlichkeiten unserer Epoche, dass sie sich selbst bereits im Moment ihres Geschehens historisiert. Kaum ist ein Ereignis eingetreten, wird es archiviert, kommentiert, in eine Erzählung eingebettet und für die Nachwelt konserviert — nicht selten, bevor es überhaupt angemessen verstanden worden ist. Der französische Ethnologe Marc Augé hat für diesen Zustand den Begriff der „Übermoderne" geprägt: eine Zeit des Exzesses — des Übermaßes an Ereignissen, an Räumen und an Individualitätsansprüchen.

Die Musealisierung, die Augé beschreibt, betrifft längst nicht mehr nur die Institution des Museums selbst, die sich im Übrigen in einer bemerkenswerten Expansion befindet — allein in Deutschland wurden zwischen 2000 und 2023 über 600 neue Museen gegründet. Vielmehr durchdringt das museale Prinzip der Konservierung und Rahmung sämtliche Lebensbereiche: Erlebnisse werden nicht mehr gelebt, sondern für Instagram dokumentiert; Städte verwandeln sich in begehbare Freilichtmuseen für den Kulturtourismus; selbst persönliche Erinnerungen werden auf Cloud-Servern „für immer" gespeichert.

Walter Benjamin hat in seinem berühmten Aufsatz über das Kunstwerk im Zeitalter seiner technischen Reproduzierbarkeit den Verlust der „Aura" — jener einmaligen Präsenz des Originals in Raum und Zeit — als Konsequenz der massenhaften Vervielfältigung beschrieben. Man könnte argumentieren, dass die digitale Ära diesen Prozess auf eine neue Stufe gehoben hat: Was verloren geht, ist nicht mehr nur die Aura des Kunstwerks, sondern die Aura des Erlebnisses selbst. Die permanente Dokumentation entwertet paradoxerweise das Dokumentierte, indem sie das Einmalige zum Reproduzierbaren degradiert.

Gegen diese Tendenz formiert sich inzwischen Widerstand — freilich in einer Form, die selbst nicht frei von Ironie ist. Bewegungen wie „Digital Detox" oder die Slow-Media-Initiative propagieren eine bewusste Hinwendung zum Unmittelbaren, zum Nicht-Archivierten, zum Vergänglichen. Doch auch dieser Gestus der Verweigerung wird, kaum dass er artikuliert ist, seinerseits musealisiert: als Trend, als Lifestyle, als konsumierbares Gegenmodell zur Konsumgesellschaft.`,
            items: [
                { id: 'c2l4-1', question: 'Was meint Augé mit „Übermoderne"?', options: [
                    { key: 'A', text: 'Eine Epoche mit Mangel an Ereignissen' },
                    { key: 'B', text: 'Eine Zeit des Exzesses an Ereignissen, Räumen und Individualitätsansprüchen' },
                    { key: 'C', text: 'Eine Rückkehr zu traditionellen Werten' },
                ], correctAnswer: 'B', explanation: 'Exzess an Ereignissen, Räumen, Individualitätsansprüchen.' },
                { id: 'c2l4-2', question: 'Wie äußert sich die Musealisierung im Alltagsleben laut Text?', options: [
                    { key: 'A', text: 'Menschen besuchen mehr Museen' },
                    { key: 'B', text: 'Erlebnisse werden für Social Media dokumentiert statt gelebt' },
                    { key: 'C', text: 'Museen werden geschlossen' },
                ], correctAnswer: 'B', explanation: 'Erlebnisse werden für Instagram dokumentiert.' },
                { id: 'c2l4-3', question: 'Was verstand Benjamin unter dem Verlust der „Aura"?', options: [
                    { key: 'A', text: 'Den Verlust der einmaligen Präsenz des Originals durch Vervielfältigung' },
                    { key: 'B', text: 'Den Verlust der Farben in Reproduktionen' },
                    { key: 'C', text: 'Den Verlust des Künstlernamens' },
                ], correctAnswer: 'A', explanation: 'Einmalige Präsenz des Originals in Raum und Zeit.' },
                { id: 'c2l4-4', question: 'Was ist das Paradox der permanenten Dokumentation?', options: [
                    { key: 'A', text: 'Sie macht alles wertvoller' },
                    { key: 'B', text: 'Sie entwertet das Dokumentierte, indem sie das Einmalige reproduzierbar macht' },
                    { key: 'C', text: 'Sie kostet zu viel Speicherplatz' },
                ], correctAnswer: 'B', explanation: 'Permanente Dokumentation degradiert das Einmalige zum Reproduzierbaren.' },
                { id: 'c2l4-5', question: 'Was passiert laut Text mit dem Widerstand gegen die Musealisierung?', options: [
                    { key: 'A', text: 'Er ist sehr erfolgreich' },
                    { key: 'B', text: 'Er wird selbst musealisiert — als Trend und konsumierbares Gegenmodell' },
                    { key: 'C', text: 'Er wird von Regierungen verboten' },
                ], correctAnswer: 'B', explanation: 'Der Gestus der Verweigerung wird selbst als Trend musealisiert.' },
                { id: 'c2l4-6', question: 'Wie viele Museen wurden in Deutschland zwischen 2000 und 2023 gegründet?', options: [
                    { key: 'A', text: 'Über 200' }, { key: 'B', text: 'Über 400' }, { key: 'C', text: 'Über 600' },
                ], correctAnswer: 'C', explanation: 'Über 600 neue Museen.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // ══════════ HÖREN 35 min, 100 pts ══════════
    const hoeren = await prisma.examSection.create({
        data: { examId: exam.id, title: 'Hören', skill: 'HOEREN', totalMinutes: 35, totalPoints: 100, sortOrder: 2,
            instructions: 'Sie hören zwei Texte. Lösen Sie die Aufgaben.' },
    })

    // H1: Komplexer Vortrag / Talk Show — MC (8×~6=50)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 1 — Akademischer Vortrag', exerciseType: 'MULTIPLE_CHOICE', maxPoints: 50, sortOrder: 1,
        contentJson: {
            instructions: 'Sie hören einen akademischen Vortrag. Wählen Sie die richtige Antwort.',
            audioTranscript: `Meine sehr verehrten Damen und Herren, ich möchte heute Abend mit Ihnen über ein Thema sprechen, das in der öffentlichen Diskussion häufig vereinfacht dargestellt wird: die Beziehung zwischen Sprache, Macht und gesellschaftlicher Realität.

Der Linguist George Lakoff hat in seinen einflussreichen Arbeiten zum sogenannten „Framing" gezeigt, dass die Wahl metaphorischer Rahmen — also die Art und Weise, wie wir über ein Thema sprechen — maßgeblich bestimmt, wie wir über dieses Thema denken. Wenn wir beispielsweise über Immigration mit der Metaphorik einer Naturkatastrophe sprechen — „Flüchtlingswelle", „Flüchtlingsstrom", „Asylantenflut" — dann koppeln wir Einwanderung im kollektiven Bewusstsein an Bedrohung und Kontrollverlust, noch bevor ein einziges sachliches Argument vorgebracht worden ist.

Das Entscheidende dabei ist, so Lakoff, dass Frames nicht nur die Diskussion strukturieren, sondern auch die Wahrnehmung der zugrunde liegenden Fakten verändern. In einem berühmt gewordenen Experiment konnte er nachweisen, dass die Formulierung „Steuererleichterung" — die den Frame einer Last impliziert — zu signifikant anderen politischen Präferenzen führt als die sachlich äquivalente Formulierung „Steuersenkung".

Nun könnte man einwenden, dass dieses Phänomen trivial sei — dass jeder mündige Bürger in der Lage sein sollte, sprachliche Manipulationen zu durchschauen. Doch die kognitionswissenschaftliche Forschung zeigt, dass Frames größtenteils unbewusst wirken. Selbst wenn man einen Frame intellektuell als solchen erkennt, entfaltet er dennoch seine kognitive Wirkung — ein Phänomen, das der Psychologe Daniel Kahneman als „cognitive fluency" beschrieben hat.

Die politischen Konsequenzen dieser Erkenntnisse können kaum überschätzt werden. Parteien und Interessengruppen investieren erhebliche Ressourcen in die strategische Rahmung von Themen. Wer es schafft, seinen Frame in der öffentlichen Debatte durchzusetzen, hat einen entscheidenden Diskurshoheits-Vorteil — und zwar unabhängig von der argumentativen Qualität seiner Position.

Meine These lautet daher: Eine demokratische Gesellschaft braucht nicht nur Medienkompetenz im Sinne der Quellenkritik, sondern auch eine sprachkritische Kompetenz, die ich als „Framing-Literacy" bezeichnen möchte — die Fähigkeit, die sprachlichen Rahmen zu erkennen und zu hinterfragen, durch die uns die Welt präsentiert wird.`,
            passage: 'Ein akademischer Vortrag über Sprache und Macht.',
            items: [
                { id: 'c2h1-1', question: 'Was versteht Lakoff unter „Framing"?', options: [
                    { key: 'A', text: 'Die Herstellung physischer Bilderrahmen' },
                    { key: 'B', text: 'Die Wahl metaphorischer Rahmen, die bestimmen, wie wir über ein Thema denken' },
                    { key: 'C', text: 'Die Zensur unerwünschter Meinungen' },
                ], correctAnswer: 'B', explanation: 'Metaphorische Rahmen bestimmen das Denken über ein Thema.' },
                { id: 'c2h1-2', question: 'Was bewirkt die Naturkatastrophen-Metaphorik bei Immigration?', options: [
                    { key: 'A', text: 'Sie macht Immigration attraktiver' },
                    { key: 'B', text: 'Sie erzeugt Assoziationen mit Bedrohung und Kontrollverlust' },
                    { key: 'C', text: 'Sie hat keinen Einfluss auf die Wahrnehmung' },
                ], correctAnswer: 'B', explanation: 'Kopplung an Bedrohung und Kontrollverlust.' },
                { id: 'c2h1-3', question: 'Was zeigte Lakoffs Experiment mit „Steuererleichterung"?', options: [
                    { key: 'A', text: 'Dass alle Bürger gegen Steuern sind' },
                    { key: 'B', text: 'Dass die Formulierung zu anderen politischen Präferenzen führt als „Steuersenkung"' },
                    { key: 'C', text: 'Dass Steuern zu hoch sind' },
                ], correctAnswer: 'B', explanation: 'Signifikant andere politische Präferenzen.' },
                { id: 'c2h1-4', question: 'Warum können mündige Bürger Frames nicht einfach durchschauen?', options: [
                    { key: 'A', text: 'Weil sie zu wenig gebildet sind' },
                    { key: 'B', text: 'Weil Frames größtenteils unbewusst wirken — selbst bei intellektuellem Erkennen' },
                    { key: 'C', text: 'Weil Frames geheim gehalten werden' },
                ], correctAnswer: 'B', explanation: 'Frames wirken unbewusst, auch bei intellektuellem Erkennen (cognitive fluency).' },
                { id: 'c2h1-5', question: 'Was bedeutet „Diskurshoheits-Vorteil"?', options: [
                    { key: 'A', text: 'Wer den Frame durchsetzt, dominiert die Debatte — unabhängig von der Argumentqualität' },
                    { key: 'B', text: 'Wer lauter spricht, gewinnt die Diskussion' },
                    { key: 'C', text: 'Wer mehr Geld hat, kontrolliert die Medien' },
                ], correctAnswer: 'A', explanation: 'Den Frame durchsetzen = Diskurshoheits-Vorteil, unabhängig von Argumentqualität.' },
                { id: 'c2h1-6', question: 'Was bezeichnete Kahneman als „cognitive fluency"?', options: [
                    { key: 'A', text: 'Die Fähigkeit, schnell zu lesen' },
                    { key: 'B', text: 'Das Phänomen, dass Frames kognitive Wirkung entfalten, auch wenn man sie erkennt' },
                    { key: 'C', text: 'Die Fähigkeit, mehrere Sprachen zu sprechen' },
                ], correctAnswer: 'B', explanation: 'Kognitive Wirkung trotz intellektuellem Erkennen.' },
                { id: 'c2h1-7', question: 'Was fordert der Sprecher als Konsequenz?', options: [
                    { key: 'A', text: 'Verbot von Metaphern in der Politik' },
                    { key: 'B', text: '„Framing-Literacy" — die Fähigkeit, sprachliche Rahmen zu erkennen und zu hinterfragen' },
                    { key: 'C', text: 'Mehr Redezeit für Oppositionsparteien' },
                ], correctAnswer: 'B', explanation: 'Framing-Literacy als sprachkritische Kompetenz.' },
                { id: 'c2h1-8', question: 'Was zeigt die Forschung über die Wirkung von Frames?', options: [
                    { key: 'A', text: 'Frames verändern nur die Diskussion, nicht die Wahrnehmung der Fakten' },
                    { key: 'B', text: 'Frames verändern sowohl die Diskussion als auch die Wahrnehmung der Fakten' },
                    { key: 'C', text: 'Frames haben keine messbare Wirkung' },
                ], correctAnswer: 'B', explanation: 'Nicht nur Diskussion, sondern auch Wahrnehmung der Fakten.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    // H2: Debatte / Podiumsdiskussion — TF (10×5=50 → total 100)
    await prisma.examTask.create({ data: { sectionId: hoeren.id, title: 'Teil 2 — Podiumsdiskussion', exerciseType: 'TRUE_FALSE', maxPoints: 50, sortOrder: 2,
        contentJson: {
            instructions: 'Sie hören eine Podiumsdiskussion. Wählen Sie: Richtig oder Falsch.',
            audioTranscript: `Moderator: Willkommen zur heutigen Podiumsdiskussion zum Thema „Die Zukunft des geistigen Eigentums im Zeitalter generativer KI". Bei mir sind die Urheberrechtsexpertin Prof. Dr. Reimer und der KI-Unternehmer Dr. Tang.

Prof. Reimer: Generative KI-Systeme wie große Sprachmodelle wurden mit urheberrechtlich geschützten Werken trainiert — ohne Zustimmung und ohne Vergütung der Urheber. Das ist aus meiner Sicht ein massiver Eingriff in die geistigen Eigentumsrechte. Die derzeitige Rechtslage, die sich auf die Schrankenregelungen des Text-and-Data-Mining beruft, ist unzureichend, weil sie für einen völlig anderen Kontext geschaffen wurde.

Dr. Tang: Ich verstehe die Bedenken, argumentiere aber, dass die Forderung nach individueller Lizenzierung für jedes im Training verwendete Werk technisch undurchführbar und ökonomisch prohibitiv wäre. Wir sprechen von Billionen von Textfragmenten. Außerdem transformieren unsere Modelle die Originale in einer Weise, die weit über das hinausgeht, was man als Kopie bezeichnen könnte. Es entsteht etwas qualitativ Neues.

Prof. Reimer: Die Transformationsargumentation greift zu kurz. Natürlich generiert das Modell keine identischen Kopien. Aber die kreative Substanz — Stil, Struktur, sprachliche Innovationen — stammt zweifelsfrei von den Urhebern. Wenn ein Modell einen Text „im Stil von Thomas Mann" produziert, dann hat es etwas von Thomas Mann gelernt und reproduziert Aspekte seines Werkes. Die Urheber haben ein berechtigtes Interesse an einer angemessenen Vergütung — nicht für einzelne Trainingsdaten, sondern für den kollektiven Beitrag ihrer Werke zur Leistungsfähigkeit des Modells.

Dr. Tang: Einen kollektiven Vergütungsanspruch könnte ich mir durchaus vorstellen — etwa über einen Fonds, der von den KI-Unternehmen gespeist wird und Urheber pauschal entschädigt. Das wäre ein pragmatischer Kompromiss.

Prof. Reimer: Ein Fonds wäre ein Anfang, aber die Verwaltung wäre äußerst komplex. Wer entscheidet über die Verteilung? Wie berücksichtigt man den unterschiedlichen Beitrag verschiedener Werke? Und was ist mit Urhebern, die sich dem Training ihrer Werke grundsätzlich verweigern möchten — haben sie nicht ein Opt-out-Recht?

Dr. Tang: Ein generelles Opt-out-Recht würde die technologische Entwicklung massiv bremsen. Aber ich stimme Ihnen zu, dass wir neue rechtliche Rahmenbedingungen brauchen. Das derzeitige Urheberrecht wurde für eine analoge Welt geschaffen und ist den Herausforderungen der generativen KI schlicht nicht gewachsen.

Prof. Reimer: Darin sind wir uns ausnahmsweise einig. Die EU arbeitet bereits an der KI-Verordnung, aber die urheberrechtlichen Fragen wurden dort bislang nur unzureichend behandelt.`,
            passage: 'Eine Podiumsdiskussion über KI und Urheberrecht.',
            items: [
                { id: 'c2h2-1', statement: 'Prof. Reimer meint, dass die Urheber der Trainingsdaten angemessen entschädigt wurden.', correctAnswer: 'FALSCH', explanation: 'Ohne Zustimmung und ohne Vergütung.' },
                { id: 'c2h2-2', statement: 'Dr. Tang hält individuelle Lizenzierung pro Werk für technisch durchführbar.', correctAnswer: 'FALSCH', explanation: 'Technisch undurchführbar und ökonomisch prohibitiv.' },
                { id: 'c2h2-3', statement: 'Dr. Tang argumentiert, dass KI-Modelle etwas qualitativ Neues erschaffen.', correctAnswer: 'RICHTIG', explanation: 'Es entsteht etwas qualitativ Neues.' },
                { id: 'c2h2-4', statement: 'Prof. Reimer akzeptiert die Transformationsargumentation von Dr. Tang.', correctAnswer: 'FALSCH', explanation: 'Die Transformationsargumentation greift zu kurz.' },
                { id: 'c2h2-5', statement: 'Dr. Tang kann sich einen kollektiven Vergütungsfonds vorstellen.', correctAnswer: 'RICHTIG', explanation: 'Einen kollektiven Vergütungsanspruch könnte er sich durchaus vorstellen.' },
                { id: 'c2h2-6', statement: 'Prof. Reimer hält einen Fonds für völlig unproblematisch.', correctAnswer: 'FALSCH', explanation: 'Ein Anfang, aber äußerst komplexe Verwaltung.' },
                { id: 'c2h2-7', statement: 'Dr. Tang befürwortet ein generelles Opt-out-Recht für Urheber.', correctAnswer: 'FALSCH', explanation: 'Würde die technologische Entwicklung massiv bremsen.' },
                { id: 'c2h2-8', statement: 'Beide Diskutanten sind sich einig, dass das derzeitige Urheberrecht unzureichend ist.', correctAnswer: 'RICHTIG', explanation: 'Darin sind wir uns ausnahmsweise einig.' },
                { id: 'c2h2-9', statement: 'Die EU-KI-Verordnung hat die urheberrechtlichen Fragen bereits umfassend geregelt.', correctAnswer: 'FALSCH', explanation: 'Nur unzureichend behandelt.' },
                { id: 'c2h2-10', statement: 'Prof. Reimer fordert ein Recht für Urheber, ihr Werk vom KI-Training ausschließen zu können.', correctAnswer: 'RICHTIG', explanation: 'Opt-out-Recht für Urheber.' },
            ],
        } satisfies Prisma.InputJsonValue,
    } })

    console.log(`✅ C2 seeded: ${exam.id}`)
    console.log('   Lesen: MC(25) + TF(25) + Matching(21) + MC(29) = 100 pts')
    console.log('   Hören: MC(50) + TF(50) = 100 pts')
    console.log('   Total: 200 pts, 115 min')
}

main().catch(console.error).finally(() => prisma.$disconnect())
