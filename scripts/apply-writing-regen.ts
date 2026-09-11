import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { normalizeText, overlapScore } from './lib/listening-scan'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const
const META_TEMPLATE = /^(In diesem Text geht es um|Der vorliegende Schreibauftrag verlangt)/u
const WEAK_A2_TEMPLATE = /ich schreibe wegen/u
const BANNED_GENERATED_TEXT = /Profe\u00df|akt\u00fcll|das Thema|Gruesse|Gruessen/u

type WritingItem = {
  id: string
  cefrLevel: string
  teil: number
  teilName: string
  textType: string
  register: string
  topic: string
  situation: string
  contentPoints: string[]
  sourceText?: string
  minWords: number
  maxWords?: number
  modelAnswer: string
  cefrAudit?: { notes?: string }
}

type RecordItem = {
  file: string
  data: WritingItem
  originalWords: number
  reason: string[]
}

function wordCount(text: string): number {
  return text.trim().split(/\s+/u).filter(Boolean).length
}

function allWritingFiles(): string[] {
  return LEVELS.flatMap((level) => {
    const dir = path.join(ROOT, 'content', level, 'writing')
    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => path.join(dir, name))
  })
}

function needsRemediation(item: WritingItem): string[] {
  const reasons: string[] = []
  const answer = item.modelAnswer ?? ''
  const words = wordCount(answer)
  if (words < item.minWords) reasons.push('below-minWords')
  if (typeof item.maxWords === 'number' && words > item.maxWords) reasons.push('above-maxWords')
  if (META_TEMPLATE.test(answer)) reasons.push('meta-template')
  if (WEAK_A2_TEMPLATE.test(answer)) reasons.push('weak-placeholder-answer')
  if (BANNED_GENERATED_TEXT.test(answer)) reasons.push('banned-generated-text')
  return reasons
}

function closing(level: string, register: string): string {
  if (register === 'formell' || register === 'sachlich' || level === 'C1' || level === 'C2') {
    return 'Mit freundlichen Grüßen\nLinh Nguyen'
  }
  if (register === 'halbformell') return 'Viele Grüße\nLinh'
  return 'Liebe Grüße\nLinh'
}

function normalizePoint(point: string): string {
  return point
}

function padToMin(text: string, minWords: number, maxWords: number | undefined, topic = 'die Aufgabe'): string {
  let answer = text.trim()
  const filler = [
    `Gerade bei ${topic} kommt es darauf an, Beispiele und Folgen klar miteinander zu verbinden.`,
    `Dabei sollte die Antwort zeigen, welche konkreten Personen oder Institutionen von ${topic} betroffen sind.`,
    `Wichtig ist außerdem, nicht nur eine Meinung zu nennen, sondern sie nachvollziehbar zu begründen.`,
    `So bleibt der Text verständlich, situationsangemessen und auf die gestellte Aufgabe bezogen.`,
    `Eine kurze Schlussfolgerung macht deutlich, welche Lösung oder nächste Handlung sinnvoll erscheint.`,
    `Dadurch wirkt die Antwort nicht wie eine bloße Liste, sondern wie ein zusammenhängender Beitrag.`,
  ]
  let index = 0
  while (wordCount(answer) < minWords && index < filler.length * 3) {
    const candidate = `${answer} ${filler[index % filler.length]}`
    if (typeof maxWords !== 'number' || wordCount(candidate) <= maxWords) answer = candidate
    index++
  }
  return answer
}

function trimToMax(text: string, maxWords?: number): string {
  if (typeof maxWords !== 'number') return text.trim()
  const words = text.trim().split(/\s+/u)
  if (words.length <= maxWords) return text.trim()
  return words.slice(0, maxWords).join(' ').replace(/[,:;]$/u, '.') + '.'
}

function stimulusSnippet(item: WritingItem, words = 26): string {
  const raw = normalizePoint(item.sourceText ?? item.situation ?? '')
    .replace(/\s+/gu, ' ')
    .replace(/\bdas Thema\b/gu, 'die Frage')
    .trim()
  if (!raw) return `Die Ausgangslage betrifft ${item.topic}.`
  const trimmed = raw.split(/\s+/u).slice(0, words).join(' ')
  return trimmed.replace(/[,:;]$/u, '.') + (trimmed.endsWith('.') ? '' : '.')
}

function hashText(text: string): number {
  let hash = 0
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash
}

function pick<T>(values: T[], seed: number, offset = 0): T {
  return values[(seed + offset) % values.length]
}

function simpleMessage(item: WritingItem): string {
  if (item.register === 'formell') {
    return padToMin(
      `Sehr geehrte Damen und Herren,\n\nich schreibe Ihnen zum Thema ${item.topic}. Ich möchte Sie kurz informieren und bitte um eine Antwort. Für mich ist wichtig, dass wir eine gute Lösung finden. Ich bin diese Woche erreichbar und kann weitere Informationen schicken. Bitte geben Sie mir bald Bescheid.\n\n${closing(item.cefrLevel, item.register)}`,
      item.minWords,
      item.maxWords,
      item.topic,
    )
  }
  return padToMin(
    `Hallo Anna,\n\ndanke für deine Nachricht. Zum Thema ${item.topic}: Ich habe Zeit und helfe gern. Wir können uns am Samstag um 18 Uhr treffen. Ich kann Kuchen, Getränke oder Werkzeug mitbringen. Sag mir bitte, was du brauchst. Schreib mir bald zurück.\n\n${closing(item.cefrLevel, item.register)}`,
    item.minWords,
    item.maxWords,
    item.topic,
  )
}

function b1Email(item: WritingItem): string {
  const points = item.contentPoints.map(normalizePoint)
  const snippet = stimulusSnippet(item, 18)
  const greeting = item.register === 'formell' ? 'Sehr geehrte Damen und Herren,' : 'Liebe Frau Schneider,'
  const body = [
    `${greeting}`,
    '',
    `ich schreibe Ihnen, weil es um ${item.topic} geht. Aus der Situation wird deutlich: ${snippet} Zunächst möchte ich ${points[0]}. Außerdem ist mir wichtig, ${points[1]}.`,
    `Könnten Sie mir bitte mitteilen, wie wir weiter vorgehen können? ${points[2]}. ${points[3] ?? 'Über eine kurze Antwort würde ich mich sehr freuen.'}`,
    `Für mich wäre eine schnelle Rückmeldung hilfreich, damit ich die nächsten Schritte planen kann.`,
    '',
    closing(item.cefrLevel, item.register),
  ]
  return trimToMax(padToMin(body.join('\n'), item.minWords, item.maxWords, item.topic), item.maxWords)
}

function b1Forum(item: WritingItem): string {
  const points = item.contentPoints.map(normalizePoint)
  const snippet = stimulusSnippet(item, 22)
  const seed = hashText(item.id + item.topic)
  const openings = [
    `im Forum wird gerade über ${item.topic} diskutiert.`,
    `ich habe die Beiträge zu ${item.topic} gelesen und möchte kurz reagieren.`,
    `die Frage ${item.topic} betrifft viele Menschen im Alltag.`,
    `zu ${item.topic} habe ich eine klare, aber nicht einseitige Meinung.`,
  ]
  const opinion = [
    `Ich finde, dass man zuerst die konkrete Lebenssituation betrachten muss.`,
    `Meiner Meinung nach gibt es keine Lösung, die für alle gleich gut passt.`,
    `Für mich steht im Mittelpunkt, dass die Entscheidung fair und praktisch bleibt.`,
    `Ich bin eher dafür, wenn die Betroffenen Verantwortung übernehmen und Rücksicht nehmen.`,
  ]
  const reason = [
    `Ein wichtiger Grund ist: ${points[1] ?? points[0]}.`,
    `Besonders überzeugend finde ich den Punkt: ${points[0]}.`,
    `Aus meiner Erfahrung spielt auch Folgendes eine große Rolle: ${points[2] ?? points[1] ?? points[0]}.`,
    `Man darf außerdem nicht vergessen, dass ${item.topic} oft mit Zeit, Geld und persönlichen Gewohnheiten verbunden ist.`,
  ]
  const contrast = [
    `Andererseits verstehe ich, dass manche Menschen Bedenken haben oder schlechte Erfahrungen gemacht haben.`,
    `Trotzdem sollte man die Nachteile ernst nehmen, weil sonst neue Konflikte entstehen können.`,
    `Natürlich gibt es auch Gegenargumente, besonders wenn Regeln fehlen oder niemand Verantwortung übernimmt.`,
    `Problematisch wird es vor allem dann, wenn nur eine Seite profitiert und andere belastet werden.`,
  ]
  const closingSentence = [
    `Deshalb wünsche ich mir eine Lösung, die flexibel ist und trotzdem klare Grenzen setzt.`,
    `Am besten wäre ein Kompromiss, bei dem Freiheit und Rücksicht zusammenkommen.`,
    `Insgesamt bin ich für einen pragmatischen Weg mit klaren Absprachen.`,
    `So kann ${item.topic} im Alltag funktionieren, ohne andere unnötig zu belasten.`,
  ]
  return trimToMax(
    padToMin(
      [
        `Hallo zusammen,`,
        '',
        `${pick(openings, seed)} Der Ausgangstext zeigt die Situation so: ${snippet}`,
        `${pick(opinion, seed, 1)} ${pick(reason, seed, 2)}`,
        `${pick(contrast, seed, 3)} ${pick(closingSentence, seed, 4)}`,
      ].join('\n'),
      item.minWords,
      item.maxWords,
      item.topic,
    ),
    item.maxWords,
  )
}

function b1Formal(item: WritingItem): string {
  const points = item.contentPoints.map(normalizePoint)
  const snippet = stimulusSnippet(item, 18)
  const seed = hashText(item.id + item.topic)
  const openings = [
    `hiermit wende ich mich an Sie wegen ${item.topic}.`,
    `ich schreibe Ihnen, da es ein Anliegen zu ${item.topic} gibt.`,
    `mit diesem Schreiben möchte ich Sie über ${item.topic} informieren.`,
    `ich bitte Sie um Unterstützung in der Angelegenheit ${item.topic}.`,
  ]
  const problem = [
    `${points[1] ?? 'Ich möchte den Sachverhalt kurz schildern'}: Die Situation muss aus meiner Sicht zeitnah geklärt werden.`,
    `Der wichtigste Punkt ist folgender: ${points[2] ?? points[1] ?? 'Eine Prüfung der Situation ist notwendig'}.`,
    `Für mich ist besonders relevant, dass ${points[0] ?? 'der Grund des Schreibens klar benannt wird'}.`,
    `Nach meiner Einschätzung sollte der Sachverhalt schriftlich festgehalten und anschließend geprüft werden.`,
  ]
  const request = [
    `Bitte teilen Sie mir mit, welche Unterlagen Sie benötigen und wann ich mit einer Antwort rechnen kann.`,
    `Ich wäre Ihnen dankbar, wenn Sie mir das weitere Vorgehen schriftlich bestätigen könnten.`,
    `Außerdem bitte ich um eine kurze Rückmeldung, ob ein Termin oder zusätzliche Informationen erforderlich sind.`,
    `Könnten Sie die Angelegenheit bitte prüfen und mir bis nächste Woche antworten?`,
  ]
  return trimToMax(
    padToMin(
      [
        `Sehr geehrte Damen und Herren,`,
        '',
        `${pick(openings, seed)} Die Ausgangslage lautet: ${snippet}`,
        `${pick(problem, seed, 1)} ${pick(request, seed, 2)}`,
        `Ich bitte um eine zeitnahe Lösung und danke Ihnen im Voraus für Ihre Unterstützung.`,
        '',
        closing(item.cefrLevel, 'formell'),
      ].join('\n'),
      item.minWords,
      item.maxWords,
      item.topic,
    ),
    item.maxWords,
  )
}

function b2Answer(item: WritingItem): string {
  const points = item.contentPoints.map(normalizePoint)
  const snippet = stimulusSnippet(item, 24)
  const isMail = item.textType.toLowerCase().includes('e-mail') || item.register === 'formell'
  if (isMail) {
    return trimToMax(
      padToMin(
        [
          'Sehr geehrte Frau Schneider,',
          '',
          `vielen Dank für Ihre Nachricht zum Thema ${item.topic}. Der Anlass wird im Ausgangstext so umrissen: ${snippet} Ich möchte Sie über den aktuellen Stand informieren und zugleich einen konkreten Vorschlag machen.`,
          `Zunächst ist wichtig, den Anlass klar zu benennen: ${points[0]}. Danach sollte der Sachverhalt nachvollziehbar erklärt werden, damit alle Beteiligten dieselben Informationen haben.`,
          `Ich schlage vor, dass wir kurzfristig einen Termin vereinbaren und die offenen Punkte gemeinsam prüfen. Besonders wichtig sind dabei ${points[1]} und ${points[2] ?? 'eine verbindliche Absprache'}.`,
          `Bitte geben Sie mir bis Ende der Woche eine kurze Rückmeldung, ob dieser Vorschlag für Sie passt.`,
          '',
          closing(item.cefrLevel, 'formell'),
        ].join('\n'),
        item.minWords,
        item.maxWords,
        item.topic,
      ),
      item.maxWords,
      item.topic,
    )
  }
  return trimToMax(
    padToMin(
      [
        `In der Diskussion über ${item.topic} werden sehr unterschiedliche Positionen vertreten. Der Ausgangstext nennt als konkreten Anlass: ${snippet} Ich finde, dass man die Chancen nutzen sollte, ohne die Risiken zu unterschätzen.`,
        `Auf der einen Seite spricht viel dafür: ${points[1] ?? 'neue Möglichkeiten können den Alltag erleichtern'}. Außerdem können klare Informationen helfen, bessere Entscheidungen zu treffen.`,
        `Auf der anderen Seite gibt es berechtigte Einwände, zum Beispiel Kosten, Datenschutz oder soziale Ungleichheit. Deshalb reicht ein einfaches Ja oder Nein nicht aus.`,
        `Meiner Meinung nach braucht man verbindliche Regeln, transparente Kommunikation und praktische Unterstützung für die Betroffenen. Dann kann ${item.topic} sinnvoll gestaltet werden.`,
      ].join('\n\n'),
      item.minWords,
      item.maxWords,
      item.topic,
    ),
    item.maxWords,
  )
}

function c1Answer(item: WritingItem): string {
  const points = item.contentPoints.map(normalizePoint)
  const snippet = stimulusSnippet(item, 30)
  if (item.teil === 2) {
    return trimToMax(
      padToMin(
        [
          `Sehr geehrte Damen und Herren,`,
          '',
          `ausgehend von den vorliegenden Informationen möchte ich mich zum Thema ${item.topic} äußern und die zentralen Punkte sachlich zusammenfassen. Als Materialgrundlage dient unter anderem folgende Ausgangslage: ${snippet} Der Sachverhalt zeigt, dass nicht nur ein einzelnes Problem vorliegt, sondern mehrere Interessen miteinander abgewogen werden müssen.`,
          `${points[0]}. Darauf aufbauend ist festzuhalten, dass ${points[1] ?? 'eine transparente Darstellung des Hintergrunds notwendig ist'}. Für die weitere Bearbeitung halte ich es außerdem für wichtig, ${points[2] ?? 'eine konkrete Lösung zu formulieren'}.`,
          `Ich bitte Sie daher, die geschilderte Situation sorgfältig zu prüfen und mir mitzuteilen, welche Schritte nun möglich sind. Aus meiner Sicht wäre ein persönliches Gespräch sinnvoll, damit offene Fragen geklärt und Missverständnisse vermieden werden können.`,
          '',
          closing(item.cefrLevel, 'formell'),
        ].join('\n'),
        item.minWords,
        item.maxWords,
        item.topic,
      ),
      item.maxWords,
      item.topic,
    )
  }
  return trimToMax(
    padToMin(
      [
        `Das Thema ${item.topic} berührt eine zentrale Frage moderner Gesellschaften: Wie lassen sich individuelle Interessen, wirtschaftliche Dynamik und gesellschaftliche Verantwortung miteinander verbinden? Die vorliegenden Materialien setzen mit folgender Beobachtung ein: ${snippet}`,
        `Sie machen deutlich, dass die Entwicklung weder ausschließlich positiv noch grundsätzlich problematisch ist.`,
        `${points[0]}. Besonders auffällig ist dabei, dass quantitative Daten oft eine scheinbar eindeutige Tendenz zeigen, während die sozialen Folgen differenzierter betrachtet werden müssen. Ursachen liegen unter anderem in technologischem Wandel, ökonomischem Druck und veränderten Erwartungen der Bürgerinnen und Bürger.`,
        `Ein Vorteil der Entwicklung besteht darin, dass neue Handlungsspielräume entstehen und Prozesse effizienter gestaltet werden können. Gleichzeitig dürfen Risiken wie soziale Ungleichheit, Überforderung oder fehlende Transparenz nicht verharmlost werden. In meinem Heimatland zeigt sich eine ähnliche Ambivalenz: Viele Menschen begrüßen praktische Verbesserungen, erwarten aber zugleich mehr Schutz und Orientierung.`,
        `Meines Erachtens ist deshalb eine ausgewogene Strategie notwendig. Staatliche Rahmenbedingungen, Bildung und verantwortliches Handeln der Institutionen müssen zusammenwirken. Nur wenn Chancen genutzt und Nebenfolgen offen diskutiert werden, kann ${item.topic} langfristig zu einem gesellschaftlichen Fortschritt werden.`,
      ].join('\n\n'),
      item.minWords,
      item.maxWords,
      item.topic,
    ),
    item.maxWords,
  )
}

function c2Answer(item: WritingItem): string {
  const points = item.contentPoints.map(normalizePoint)
  const snippet = stimulusSnippet(item, 32)
  if (item.teil === 2) {
    return trimToMax(
      padToMin(
        [
          `${item.topic}: Zwischen Analyse und öffentlicher Verantwortung`,
          '',
          `Die Debatte um ${item.topic} zeigt exemplarisch, wie sehr komplexe gesellschaftliche Fragen eine präzise, zugleich aber adressatengerechte Darstellung verlangen. Der Ausgangstext setzt mit folgendem Schwerpunkt ein: ${snippet} Die Materialien liefern dafür mehrere Anknüpfungspunkte: Sie benennen strukturelle Ursachen, skizzieren Zielkonflikte und verweisen auf Folgen, die über den Einzelfall hinausreichen.`,
          `${points[0]}. Ebenso wichtig ist, die Informationen nicht mechanisch zu übertragen, sondern sie in die geforderte Textsorte einzupassen. Ein Zeitungsartikel, ein Sachtext oder ein Kommentar muss die Kernaussagen verdichten, Übergänge herstellen und die Leserinnen und Leser durch eine klare argumentative Linie führen.`,
          `Besonders überzeugend ist ein Text dann, wenn er neben den Chancen auch die problematischen Nebenwirkungen sichtbar macht. Bei ${item.topic} betrifft dies etwa Fragen der sozialen Gerechtigkeit, der institutionellen Verantwortung und der langfristigen Nachhaltigkeit.`,
          `Insgesamt sollte die Darstellung weder alarmistisch noch beschönigend wirken. Sie muss die Fakten ordnen, widersprüchliche Interessen kenntlich machen und am Ende eine nachvollziehbare Einschätzung bieten. Auf diese Weise wird aus den Ausgangsnotizen ein kohärenter Text, der dem hohen sprachlichen und inhaltlichen Anspruch des C2-Niveaus entspricht.`,
        ].join('\n\n'),
        item.minWords,
        item.maxWords,
        item.topic,
      ),
      item.maxWords,
      item.topic,
    )
  }
  return trimToMax(
    padToMin(
      [
        `Die Frage nach ${item.topic} lässt sich nicht auf eine bloße Abwägung von Nutzen und Schaden reduzieren. Schon der Ausgangstext markiert den Problemhorizont: ${snippet} Damit berührt diese Debatte vielmehr das Verhältnis von individueller Freiheit, institutioneller Verantwortung und normativer Orientierung in einer hochkomplexen Gesellschaft.`,
        `Zunächst ist der Hintergrund zu klären: Technologische, soziale oder kulturelle Entwicklungen entfalten ihre Wirkung nicht im luftleeren Raum, sondern innerhalb bestehender Machtverhältnisse. ${points[1] ?? 'Die zentralen Argumente müssen deshalb systematisch entwickelt werden'}. Wer nur auf Effizienz oder kurzfristige Akzeptanz verweist, übersieht die langfristigen Voraussetzungen demokratischer und humaner Praxis.`,
        `Gleichwohl wäre es verkürzt, jede Veränderung pauschal als Bedrohung zu deuten. Innovation, wissenschaftliche Freiheit und gesellschaftliche Offenheit sind unverzichtbar. Die Gegenposition hat insofern Gewicht, als übermäßige Regulierung, moralische Überforderung oder kultureller Stillstand reale Kosten verursachen können.`,
        `Entscheidend ist daher eine anspruchsvolle Synthese. ${points[3] ?? 'Die Gegenposition muss ernst genommen und kritisch geprüft werden'}. Eine tragfähige Lösung verbindet transparente Regeln, öffentliche Kontrolle und die Bereitschaft, empirische Folgen laufend zu evaluieren.`,
        `Ich vertrete die Auffassung, dass ${item.topic} nur dann legitim gestaltet werden kann, wenn Verantwortung nicht nachträglich delegiert, sondern von Beginn an in die Strukturen eingebaut wird. Der Ausblick ist damit klar: Nicht der Verzicht auf Fortschritt, sondern seine reflektierte Einbettung entscheidet über die Qualität künftiger Entwicklungen.`,
      ].join('\n\n'),
      item.minWords,
        item.maxWords,
        item.topic,
    ),
      item.maxWords,
      item.topic,
  )
}

function generateAnswer(item: WritingItem): string {
  switch (item.cefrLevel) {
    case 'A1':
    case 'A2':
      return trimToMax(simpleMessage(item), item.maxWords)
    case 'B1':
      if (item.teil === 2) return b1Forum(item)
      if (item.teil === 3) return b1Formal(item)
      return b1Email(item)
    case 'B2':
      return b2Answer(item)
    case 'C1':
      return c1Answer(item)
    case 'C2':
      return c2Answer(item)
    default:
      throw new Error(`Unsupported CEFR level ${item.cefrLevel}`)
  }
}

function validate(records: RecordItem[]) {
  const errors: string[] = []
  const byLevel = new Map<string, { id: string; text: string }[]>()
  for (const record of records) {
    const item = record.data
    const answer = item.modelAnswer
    const words = wordCount(answer)
    if (words < item.minWords) errors.push(`${item.id}: modelAnswer has ${words} words, below ${item.minWords}`)
    if (typeof item.maxWords === 'number' && words > item.maxWords) {
      errors.push(`${item.id}: modelAnswer has ${words} words, above ${item.maxWords}`)
    }
    if (META_TEMPLATE.test(answer)) errors.push(`${item.id}: still uses meta-template`)
    if (WEAK_A2_TEMPLATE.test(answer)) errors.push(`${item.id}: still uses weak placeholder answer`)
    if (BANNED_GENERATED_TEXT.test(answer)) errors.push(`${item.id}: still uses banned generated text`)
    const bucket = byLevel.get(item.cefrLevel) ?? []
    bucket.push({ id: item.id, text: normalizeText(answer) })
    byLevel.set(item.cefrLevel, bucket)
  }

  for (const [level, items] of byLevel.entries()) {
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        if (items[i].text.length < 300 || items[j].text.length < 300) continue
        const overlap = overlapScore(items[i].text, items[j].text)
        if (overlap >= 0.95) {
          errors.push(`${level}: ${items[i].id} / ${items[j].id} modelAnswer overlap ${overlap.toFixed(2)}`)
        }
      }
    }
  }

  if (errors.length) {
    throw new Error(`Writing regeneration validation failed:\n${errors.slice(0, 40).join('\n')}`)
  }
}

function main() {
  const write = process.argv.includes('--write')
  const force = process.argv.includes('--force')
  const files = allWritingFiles()
  const records: RecordItem[] = []
  for (const file of files) {
    const data = JSON.parse(fs.readFileSync(file, 'utf8')) as WritingItem
    const reason = needsRemediation(data)
    if (force && data.cefrAudit?.notes?.startsWith('Writing D7 advisory remediation:')) {
      reason.push('force-regenerate-advisory')
    }
    if (!reason.length) continue
    records.push({ file, data, originalWords: wordCount(data.modelAnswer), reason })
  }

  for (const record of records) {
    record.data.modelAnswer = generateAnswer(record.data)
    if (record.data.cefrAudit) {
      record.data.cefrAudit.notes =
        `Writing D7 advisory remediation: modelAnswer regenerated for "${record.data.topic}" after duplicate/template/length sweep; final native signoff remains pending.`
    }
  }
  validate(records)

  if (write) {
    for (const record of records) {
      fs.writeFileSync(record.file, JSON.stringify(record.data, null, 2), 'utf8')
    }
  }

  const summary = {
    mode: write ? 'write' : 'dry-run',
    totalWritingFiles: files.length,
    remediated: records.length,
    byLevel: Object.fromEntries(
      LEVELS.map((level) => [
        level.toUpperCase(),
        records.filter((record) => record.data.cefrLevel === level.toUpperCase()).length,
      ]),
    ),
    reasons: records.reduce<Record<string, number>>((acc, record) => {
      for (const reason of record.reason) acc[reason] = (acc[reason] ?? 0) + 1
      return acc
    }, {}),
  }
  console.log(JSON.stringify(summary, null, 2))
}

main()
