import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(fileURLToPath(import.meta.url), '..', '..')
const LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'] as const
const AUTO_REVIEW = 'auto_generated_needs_spot_check'
const LEXICON_REVIEW = 'lexicon_aligned_needs_native_signoff'
const CORPUS_REVIEW = 'corpus_canonicalized_needs_native_signoff'
const REGULAR_RULE_REVIEW = 'regular_rule_needs_native_signoff'
const DUDEN_ALIGNED_REVIEW = 'duden_aligned_needs_native_signoff'
const DUDEN_PLURALWORD_REVIEW = 'duden_pluralword_needs_native_signoff'
const DUDEN_COMPOUND_PLURALWORD_REVIEW = 'duden_compound_pluralword_needs_native_signoff'
const DUDEN_COMPOUND_HEADWORD_REVIEW = 'duden_compound_headword_needs_native_signoff'
const DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW = 'duden_compound_headword_singular_only_needs_native_signoff'
const DUDEN_SINGULAR_ONLY_REVIEW = 'duden_singular_only_needs_native_signoff'
const DUDEN_SENSE_SINGULAR_ONLY_REVIEW = 'duden_sense_singular_only_needs_native_signoff'
const UNSAFE_REGULAR_BASES = new Set(['entbergen'])
const SEPARABLE_PREFIXES = [
  'auseinander',
  'zusammen',
  'herunter',
  'hinunter',
  'heraus',
  'hinein',
  'hinauf',
  'weiter',
  'zurueck',
  'zurück',
  'voran',
  'wieder',
  'hoch',
  'nach',
  'ein',
  'aus',
  'auf',
  'vor',
  'zu',
]

type PresentForms = {
  ich: string
  du: string
  er_sie_es: string
  wir: string
  ihr: string
  sie_Sie: string
}

type Conjugation = {
  praesens?: PresentForms | string
  isIrregular?: boolean
  isSeparable?: boolean
  reviewStatus?: string
  [key: string]: unknown
}

type VocabularyWord = {
  word: string
  article?: string | null
  plural?: string | null
  wordType: string
  meaningVi: string
  meaningDe: string
  conjugation?: Conjugation
  [key: string]: unknown
}

type VocabularyFile = {
  words: VocabularyWord[]
  cefrAudit?: { notes?: string }
  [key: string]: unknown
}

const KNOWN_CONJUGATION_FIXES: Record<string, Partial<Conjugation> & { praesens: PresentForms }> = {
  'content/c2/vocabulary/114-technikphilosophie.json::entbergen': {
    praesens: {
      ich: 'entberge',
      du: 'entbirgst',
      er_sie_es: 'entbirgt',
      wir: 'entbergen',
      ihr: 'entbergt',
      sie_Sie: 'entbergen',
    },
    isIrregular: true,
    isSeparable: false,
    reviewStatus: LEXICON_REVIEW,
  },
}

type LexiconRow = {
  infinitive: string
  ich: string
  du: string
  erSieEs: string
  praeteritumIch: string
  partizip2: string
  konjunktiv2Ich: string
  imperativSingular: string
  imperativPlural: string
  auxiliary: string
}

type RecordItem = {
  file: string
  level: string
  data: VocabularyFile
}

const KNOWN_CONTENT_FIXES: Record<string, Partial<VocabularyWord>> = {
  'content/a1/vocabulary/15-zahlen.json::zählen': {
    meaningDe: 'Zahlen der Reihe nach nennen.',
  },
  'content/a2/vocabulary/06-essen-restaurant.json::scharf': {
    meaningVi: 'cay, sắc',
  },
  'content/b1/vocabulary/32-handwerk-reparatur.json::Säge': {
    meaningDe: 'Ein Werkzeug mit gezahntem Blatt zum Schneiden von Holz oder Metall.',
  },
  'content/c1/vocabulary/01-gesellschaftskritik-diskurs.json::Meinungsbildung': {
    plural: 'die Meinungsbildungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/01-gesellschaftskritik-diskurs.json::Legitimität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/03-bioethik-gentechnik.json::Dignität': {
    plural: '-',
    pluralStatus: DUDEN_SENSE_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/03-bioethik-gentechnik.json::Eugenik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/03-bioethik-gentechnik.json::Autonomie': {
    plural: 'die Autonomien',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/03-bioethik-gentechnik.json::Reproduktionsmedizin': {
    plural: 'die Reproduktionsmedizinen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/03-bioethik-gentechnik.json::Vererbung': {
    plural: 'die Vererbungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/03-bioethik-gentechnik.json::Ethos': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/04-urbanisierung-raumplanung.json::Daseinsvorsorge': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/04-urbanisierung-raumplanung.json::Ressourcenschonung': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/04-urbanisierung-raumplanung.json::Landflucht': {
    plural: 'die Landfluchten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/04-urbanisierung-raumplanung.json::Partizipation': {
    plural: 'die Partizipationen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/04-urbanisierung-raumplanung.json::urbane Resilienz': {
    plural: 'die urbanen Resilienzen',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_REVIEW,
  },
  'content/c1/vocabulary/04-urbanisierung-raumplanung.json::demografischer Wandel': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/05-klimapolitik-nachhaltigkeit.json::Eindämmung': {
    plural: 'die Eindämmungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/05-klimapolitik-nachhaltigkeit.json::Klimaneutralität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/05-klimapolitik-nachhaltigkeit.json::Biodiversität': {
    plural: 'die Biodiversitäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/05-klimapolitik-nachhaltigkeit.json::Ressourcenknappheit': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/06-sprachwissenschaft-linguistik.json::Sprachwandel': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/06-sprachwissenschaft-linguistik.json::Sprachgebrauch': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/06-sprachwissenschaft-linguistik.json::Mehrsprachigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/10-arbeitsrecht-sozialpartnerschaft.json::Fürsorgepflicht': {
    plural: 'die Fürsorgepflichten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/10-arbeitsrecht-sozialpartnerschaft.json::Tarifautonomie': {
    plural: 'die Tarifautonomien',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/10-arbeitsrecht-sozialpartnerschaft.json::Mitbestimmung': {
    plural: 'die Mitbestimmungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/10-arbeitsrecht-sozialpartnerschaft.json::Entgeltfortzahlung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/10-arbeitsrecht-sozialpartnerschaft.json::Direktionsrecht': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/12-medientheorie-propaganda.json::Glaubwürdigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/12-medientheorie-propaganda.json::Deutungshoheit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/18-finanzmaerkte-regulierung.json::Systemrelevanz': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/18-finanzmaerkte-regulierung.json::Rechnungslegung': {
    plural: 'die Rechnungslegungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/18-finanzmaerkte-regulierung.json::Kapitalflucht': {
    plural: 'die Kapitalfluchten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/18-finanzmaerkte-regulierung.json::Compliance': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/19-verkehrswende-infrastruktur.json::Klimaneutralität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/19-verkehrswende-infrastruktur.json::Akzeptanz': {
    plural: 'die Akzeptanzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/20-energiepolitik-ressourcen.json::Nachhaltigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/20-energiepolitik-ressourcen.json::Emissionshandel': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/20-energiepolitik-ressourcen.json::Klimaneutralität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/20-energiepolitik-ressourcen.json::Netzausbau': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/20-energiepolitik-ressourcen.json::Infrastrukturausbau': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/20-energiepolitik-ressourcen.json::Prim\u00e4renergieverbrauch': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/20-energiepolitik-ressourcen.json::Energieautarkie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/21-voelkerrecht-souveraenitaet.json::Völkerrecht': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/21-voelkerrecht-souveraenitaet.json::Rechenschaftspflicht': {
    plural: 'die Rechenschaftspflichten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/21-voelkerrecht-souveraenitaet.json::Exterritorialität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/21-voelkerrecht-souveraenitaet.json::Selbstbestimmung': {
    plural: '-',
    pluralStatus: DUDEN_SENSE_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/21-voelkerrecht-souveraenitaet.json::Präzedenzfallwirkung': {
    plural: 'die Präzedenzfallwirkungen',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_REVIEW,
  },
  'content/c1/vocabulary/22-verwaltungsrecht-behörden.json::Subsidiarität': {
    plural: 'die Subsidiaritäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/22-verwaltungsrecht-behörden.json::Amtshilfe': {
    plural: 'die Amtshilfen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/22-verwaltungsrecht-behörden.json::Verhältnismäßigkeit': {
    plural: 'die Verhältnismäßigkeiten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/22-verwaltungsrecht-behörden.json::Exekutive': {
    plural: 'die Exekutiven',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/22-verwaltungsrecht-behörden.json::Sachverhaltsaufklärung': {
    plural: 'die Sachverhaltsaufklärungen',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_REVIEW,
  },
  'content/c1/vocabulary/22-verwaltungsrecht-behörden.json::Aktenführung': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/23-grundrechte-verfassung.json::Rechtsstaatlichkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/23-grundrechte-verfassung.json::Gewaltenteilung': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/23-grundrechte-verfassung.json::Souveränität': {
    plural: 'die Souveränitäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/23-grundrechte-verfassung.json::Inkrafttreten': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/23-grundrechte-verfassung.json::Würde': {
    plural: '-',
    pluralStatus: DUDEN_SENSE_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/24-justizwesen-strafvollzug.json::Strafverfolgung': {
    plural: 'die Strafverfolgungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/24-justizwesen-strafvollzug.json::Jurisprudenz': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/24-justizwesen-strafvollzug.json::Kriminalität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/24-justizwesen-strafvollzug.json::Resozialisierung': {
    plural: 'die Resozialisierungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/24-justizwesen-strafvollzug.json::Strafvollzug': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/24-justizwesen-strafvollzug.json::Strafmündigkeit': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/25-geldpolitik-zentralbank.json::Fiskalpolitik': {
    plural: 'die Fiskalpolitiken',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/25-geldpolitik-zentralbank.json::Kapitalflucht': {
    plural: 'die Kapitalfluchten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/25-geldpolitik-zentralbank.json::Kaufkraft': {
    plural: 'die Kaufkräfte',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/26-handelsabkommen-zoll.json::Inkrafttreten': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/26-handelsabkommen-zoll.json::Protektionismus': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/27-konjunktur-wirtschaftskrise.json::Protektionismus': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/28-steuerpolitik-haushalt.json::Fiskalpolitik': {
    plural: 'die Fiskalpolitiken',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/28-steuerpolitik-haushalt.json::Fiskus': {
    plural: 'die Fisken',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/28-steuerpolitik-haushalt.json::Steueraufkommen': {
    plural: 'die Steueraufkommen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/28-steuerpolitik-haushalt.json::Staatsverschuldung': {
    plural: 'die Staatsverschuldungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/28-steuerpolitik-haushalt.json::Neuverschuldung': {
    plural: 'die Neuverschuldungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/28-steuerpolitik-haushalt.json::Steuerhinterziehung': {
    plural: 'die Steuerhinterziehungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/28-steuerpolitik-haushalt.json::Abgabenlast': {
    plural: 'die Abgabenlasten',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_REVIEW,
  },
  'content/c1/vocabulary/29-quantenphysik-grundlagen.json::Kausalität': {
    plural: 'die Kausalitäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/29-quantenphysik-grundlagen.json::Welle-Teilchen-Dualismus': {
    plural: 'die Welle-Teilchen-Dualismen',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_REVIEW,
  },
  'content/c1/vocabulary/30-genetik-evolution.json::Epigenetik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/30-genetik-evolution.json::Phylogenese': {
    plural: 'die Phylogenesen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/30-genetik-evolution.json::Koevolution': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/30-genetik-evolution.json::Klonen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/32-klimaforschung-modellierung.json::Sensitivität': {
    plural: 'die Sensitivitäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/32-klimaforschung-modellierung.json::Interdependenz': {
    plural: 'die Interdependenzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/32-klimaforschung-modellierung.json::Resilienz': {
    plural: 'die Resilienzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/32-klimaforschung-modellierung.json::Evidenz': {
    plural: 'die Evidenzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/34-geschlechtergerechtigkeit.json::Vereinbarkeit': {
    plural: 'die Vereinbarkeiten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/34-geschlechtergerechtigkeit.json::Selbstbestimmung': {
    plural: '-',
    pluralStatus: DUDEN_SENSE_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/34-geschlechtergerechtigkeit.json::Patriarchat': {
    plural: 'die Patriarchate',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/34-geschlechtergerechtigkeit.json::Intersektionalität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/34-geschlechtergerechtigkeit.json::Chancengleichheit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/35-urbanisierung-smart-city.json::Nachhaltigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/35-urbanisierung-smart-city.json::Resilienz': {
    plural: 'die Resilienzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/35-urbanisierung-smart-city.json::Daseinsvorsorge': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/35-urbanisierung-smart-city.json::Intermodalität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/35-urbanisierung-smart-city.json::Konnektivität': {
    plural: 'die Konnektivitäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/36-generationenkonflikt.json::Resilienz': {
    plural: 'die Resilienzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/36-generationenkonflikt.json::Agilität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/36-generationenkonflikt.json::Demografie': {
    plural: 'die Demografien',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/38-pressefreiheit-zensur.json::Transparenz': {
    plural: 'die Transparenzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/38-pressefreiheit-zensur.json::Postfaktische': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/38-pressefreiheit-zensur.json::Meinungs\u00e4u\u00dferungsfreiheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/39-algorithmen-filterblasen.json::Transparenz': {
    plural: 'die Transparenzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/39-algorithmen-filterblasen.json::Mündigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/39-algorithmen-filterblasen.json::Nachvollziehbarkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/41-entwicklungspsychologie.json::Resilienz': {
    plural: 'die Resilienzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/41-entwicklungspsychologie.json::Urvertrauen': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/41-entwicklungspsychologie.json::Objektpermanenz': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/41-entwicklungspsychologie.json::Metakognition': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/41-entwicklungspsychologie.json::soziale Kognition': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/41-entwicklungspsychologie.json::Identitätsdiffusion': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/41-entwicklungspsychologie.json::interindividuelle Variabilität': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/41-entwicklungspsychologie.json::psychosexuelle Entwicklung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/11-literaturkritik-textanalyse.json::Hermeneutik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/44-biotechnologie-pharma.json::Bioethik': {
    plural: 'die Bioethiken',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/44-biotechnologie-pharma.json::Biokompatibilität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/45-nanotechnologie.json::Haptik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/45-nanotechnologie.json::Adhäsion': {
    plural: 'die Adhäsionen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/45-nanotechnologie.json::Amorphität': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/45-nanotechnologie.json::Bioverträglichkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/45-nanotechnologie.json::Supraleitung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/46-wirtschaftsethik.json::Rechenschaftspflicht': {
    plural: 'die Rechenschaftspflichten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/46-wirtschaftsethik.json::Gemeinwohl': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/46-wirtschaftsethik.json::Corporate Governance': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/46-wirtschaftsethik.json::Corporate Citizenship': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/46-wirtschaftsethik.json::Integrität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/46-wirtschaftsethik.json::Glaubwürdigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/46-wirtschaftsethik.json::Verhältnismäßigkeit': {
    plural: 'die Verhältnismäßigkeiten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/47-medizinethik-patientenrecht.json::Fürsorgepflicht': {
    plural: 'die Fürsorgepflichten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/47-medizinethik-patientenrecht.json::Verhältnismäßigkeit': {
    plural: 'die Verhältnismäßigkeiten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/47-medizinethik-patientenrecht.json::Menschenwürde': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/47-medizinethik-patientenrecht.json::Selbstbestimmung': {
    plural: '-',
    pluralStatus: DUDEN_SENSE_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/47-medizinethik-patientenrecht.json::Transparenz': {
    plural: 'die Transparenzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/47-medizinethik-patientenrecht.json::Interdisziplinarität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/47-medizinethik-patientenrecht.json::Ressourcenallokation': {
    plural: 'die Ressourcenallokationen',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_REVIEW,
  },
  'content/c1/vocabulary/47-medizinethik-patientenrecht.json::Schutzbedarf': {
    plural: 'die Schutzbedarfe',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_REVIEW,
  },
  'content/c1/vocabulary/47-medizinethik-patientenrecht.json::Patientenwohl': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/49-theaterwissenschaft.json::Hermeneutik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/49-theaterwissenschaft.json::Semiotik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/49-theaterwissenschaft.json::Mimesis': {
    plural: 'die Mimesen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/50-kunstgeschichte-epochen.json::Hermeneutik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/50-kunstgeschichte-epochen.json::Semiotik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/51-filmtheorie-analyse.json::Hermeneutik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/51-filmtheorie-analyse.json::Semiotik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/51-filmtheorie-analyse.json::Mimesis': {
    plural: 'die Mimesen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/51-filmtheorie-analyse.json::Ästhetik': {
    plural: 'die Ästhetiken',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/51-filmtheorie-analyse.json::Kausalität': {
    plural: 'die Kausalitäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/52-sicherheitspolitik-nato.json::Koexistenz': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/52-sicherheitspolitik-nato.json::Resilienz': {
    plural: 'die Resilienzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/52-sicherheitspolitik-nato.json::Rüstungskontrolle': {
    plural: 'die Rüstungskontrollen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/52-sicherheitspolitik-nato.json::Entspannungspolitik': {
    plural: 'die Entspannungspolitiken',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/53-entwicklungshilfe-ngos.json::Nachhaltigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/53-entwicklungshilfe-ngos.json::Resilienz': {
    plural: 'die Resilienzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/53-entwicklungshilfe-ngos.json::Rechenschaftspflicht': {
    plural: 'die Rechenschaftspflichten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/53-entwicklungshilfe-ngos.json::Partizipation': {
    plural: 'die Partizipationen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/53-entwicklungshilfe-ngos.json::Expertise': {
    plural: 'die Expertisen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/53-entwicklungshilfe-ngos.json::Dezentralisierung': {
    plural: 'die Dezentralisierungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/53-entwicklungshilfe-ngos.json::Marginalisierung': {
    plural: 'die Marginalisierungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/53-entwicklungshilfe-ngos.json::Ressourcenallokation': {
    plural: 'die Ressourcenallokationen',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_REVIEW,
  },
  'content/c1/vocabulary/53-entwicklungshilfe-ngos.json::Kapazitätsstärkung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/53-entwicklungshilfe-ngos.json::Selbstermächtigung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/53-entwicklungshilfe-ngos.json::Good Governance': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/54-flucht-asylrecht.json::Schleuserkriminalität': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/54-flucht-asylrecht.json::Schutzbedürftigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/54-flucht-asylrecht.json::subsidiärer Schutz': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/56-psychosomatik.json::Compliance': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/56-psychosomatik.json::Wohlbefinden': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/56-psychosomatik.json::Achtsamkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json::Resilienz': {
    plural: 'die Resilienzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json::Integrität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json::Vertraulichkeit': {
    plural: '-',
    pluralStatus: DUDEN_SENSE_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json::Verfügbarkeit': {
    plural: 'die Verfügbarkeiten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json::Zuschreibung': {
    plural: 'die Zuschreibungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json::Entschlüsselung': {
    plural: 'die Entschlüsselungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/58-cybersicherheit-cyberkrieg.json::Detektion': {
    plural: 'die Detektionen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/59-soziale-netzwerke-analyse.json::Nutzerverhalten': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/59-soziale-netzwerke-analyse.json::Datenhoheit': {
    plural: 'die Datenhoheiten',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c1/vocabulary/59-soziale-netzwerke-analyse.json::Meinungspluralismus': {
    plural: 'die Meinungspluralismen',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c1/vocabulary/59-soziale-netzwerke-analyse.json::Medienkompetenz': {
    plural: 'die Medienkompetenzen',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c1/vocabulary/61-forensik-kriminalistik.json::Ballistik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/61-forensik-kriminalistik.json::Toxikologie': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/61-forensik-kriminalistik.json::Forensik': {
    plural: '-',
    pluralStatus: DUDEN_SENSE_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/61-forensik-kriminalistik.json::Modus Operandi': {
    plural: 'die Modi Operandi',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/61-forensik-kriminalistik.json::Viktimologie': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/61-forensik-kriminalistik.json::Kriminaltechnik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/62-logistik-lieferkette.json::Resilienz': {
    plural: 'die Resilienzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/62-logistik-lieferkette.json::Intralogistik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/62-logistik-lieferkette.json::Rückverfolgbarkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/62-logistik-lieferkette.json::Transportlogistik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/63-musiktherapie.json::Partizipation': {
    plural: 'die Partizipationen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/63-musiktherapie.json::Achtsamkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/63-musiktherapie.json::Inklusion': {
    plural: 'die Inklusionen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/63-musiktherapie.json::Empathie': {
    plural: 'die Empathien',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/63-musiktherapie.json::Sensorik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/63-musiktherapie.json::Selbstwirksamkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/63-musiktherapie.json::Heilpädagogik': {
    plural: 'die Heilpädagogiken',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/65-lebensmittelrecht.json::Beweislast': {
    plural: 'die Beweislasten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/65-lebensmittelrecht.json::Verbraucherschutz': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/65-lebensmittelrecht.json::Rückverfolgbarkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/65-lebensmittelrecht.json::Produkthaftung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/65-lebensmittelrecht.json::Lebensmittelüberwachung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/68-krisenmanagement.json::Daseinsvorsorge': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/68-krisenmanagement.json::Wiederaufbau': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/68-krisenmanagement.json::Katastrophenschutz': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/70-energiespeicherung.json::Dekarbonisierung': {
    plural: '-',
    pluralStatus: DUDEN_SENSE_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/70-energiespeicherung.json::Power-to-X': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/70-energiespeicherung.json::Kreislaufwirtschaft': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/70-energiespeicherung.json::Kohlenstoffabscheidung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/70-energiespeicherung.json::Energiewende': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/70-energiespeicherung.json::Rohstoffeffizienz': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/70-energiespeicherung.json::Wasserstoffwirtschaft': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/70-energiespeicherung.json::Netzstabilität': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/70-energiespeicherung.json::Flüssigwasserstoff': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/71-neuroplastizitaet.json::Konnektivität': {
    plural: 'die Konnektivitäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/71-neuroplastizitaet.json::graue Substanz': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/71-neuroplastizitaet.json::weiße Substanz': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/71-neuroplastizitaet.json::Neurogenese': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/71-neuroplastizitaet.json::Kognitive Reserve': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/73-bibliothekswesen.json::Bestandserhaltung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/73-bibliothekswesen.json::Provenienzforschung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/73-bibliothekswesen.json::Informationskompetenz': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/66-stadtmarketing-tourismus.json::Imagepflege': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/66-stadtmarketing-tourismus.json::Bürgerbeteiligung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/66-stadtmarketing-tourismus.json::Destinationsmanagement': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/66-stadtmarketing-tourismus.json::Wettbewerbsfähigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/66-stadtmarketing-tourismus.json::Erlebnisökonomie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/66-stadtmarketing-tourismus.json::Standortattraktivität': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/66-stadtmarketing-tourismus.json::Nachhaltigkeitstourismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c1/vocabulary/71-neuroplastizitaet.json::Resilienz': {
    plural: 'die Resilienzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/72-verhaltensforschung.json::Empathie': {
    plural: 'die Empathien',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/72-verhaltensforschung.json::Domestikation': {
    plural: 'die Domestikationen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/72-verhaltensforschung.json::Altruismus': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/75-steuerberatung.json::Compliance': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json::Hermeneutik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json::Plausibilität': {
    plural: 'die Plausibilitäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json::Rekursivität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json::Inhärenz': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json::Falsifizierbarkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/01-epistemologie-wissenschaftstheorie.json::Kohärenz': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/02-rechtsphilosophie-justiz.json::Jurisprudenz': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/02-rechtsphilosophie-justiz.json::Rechtspositivismus': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/02-rechtsphilosophie-justiz.json::Normativität': {
    plural: '-',
    pluralStatus: DUDEN_SENSE_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/04-literaturwissenschaft-hermeneutik.json::Mimesis': {
    plural: 'die Mimesen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/04-literaturwissenschaft-hermeneutik.json::Semiotik': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/04-literaturwissenschaft-hermeneutik.json::Epistemologie': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/04-literaturwissenschaft-hermeneutik.json::Narratologie': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/05-aesthetik-kunstkritik.json::Immanenz': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/06-anthropologie-ethnografie.json::Deutungshoheit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/06-anthropologie-ethnografie.json::Interkulturalität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/06-anthropologie-ethnografie.json::Heterogenität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/06-anthropologie-ethnografie.json::Intersubjektivität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/06-anthropologie-ethnografie.json::Subalternität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/14-biopolitik-transhumanismus.json::Souveränität': {
    plural: 'die Souveränitäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/28-rechtshermeneutik.json::Jurisprudenz': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/29-staatsphilosophie-vertieft.json::Gemeinwohl': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/70-europaeisches-recht.json::Rechtsstaatlichkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/70-europaeisches-recht.json::Subsidiarität': {
    plural: 'die Subsidiaritäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/70-europaeisches-recht.json::Verhältnismäßigkeit': {
    plural: 'die Verhältnismäßigkeiten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/85-spieltheorie-nash.json::Glaubwürdigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/70-europaeisches-recht.json::Gerichtshof der Europäischen Union': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/70-europaeisches-recht.json::Charta der Grundrechte der Europäischen Union': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/70-europaeisches-recht.json::Kohäsionspolitik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/70-europaeisches-recht.json::acquis communautaire': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/70-europaeisches-recht.json::intergouvernementale Zusammenarbeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/70-europaeisches-recht.json::supranationale Integration': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/57-denkmalschutz-kulturerbe.json::Denkmalwürdigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/57-denkmalschutz-kulturerbe.json::Materialität': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/57-denkmalschutz-kulturerbe.json::Wissenstransfer': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/57-denkmalschutz-kulturerbe.json::Tradierung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/57-denkmalschutz-kulturerbe.json::Objekthaftigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/57-denkmalschutz-kulturerbe.json::Perennität': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/65-anarchismus-libertarismus.json::Herrschaftsfreiheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/65-anarchismus-libertarismus.json::Staatsferne': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/65-anarchismus-libertarismus.json::Konkurrenzdruck': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/65-anarchismus-libertarismus.json::Präfigurationspolitik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/65-anarchismus-libertarismus.json::Entstaatlichung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/73-falsifikationismus-popper.json::Induktionsproblematik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/73-falsifikationismus-popper.json::Erkenntnisfortschritt': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/73-falsifikationismus-popper.json::Widerlegbarkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/73-falsifikationismus-popper.json::Theoriebeladenheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/73-falsifikationismus-popper.json::kritischer Rationalismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/98-diskursethik-habermas.json::Konsensfähigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/98-diskursethik-habermas.json::Verständigungsorientierung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/98-diskursethik-habermas.json::Herrschaftsfreiheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/98-diskursethik-habermas.json::Handlungsrationalität': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/98-diskursethik-habermas.json::Universalisierbarkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/89-positive-psychologie.json::Wohlbefinden': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/89-positive-psychologie.json::Positivität': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/89-positive-psychologie.json::Optimismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/89-positive-psychologie.json::Flourishing': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/101-aufklaerung-kant.json::Mündigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/101-aufklaerung-kant.json::Rechtsstaatlichkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/101-aufklaerung-kant.json::Urteilsvermögen': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/101-aufklaerung-kant.json::Erkenntnisvermögen': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/102-kalter-krieg-bipolaritaet.json::Hochrüstung': {
    plural: 'die Hochrüstungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/103-kolonialgeschichte.json::Neokolonialismus': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/103-kolonialgeschichte.json::Subalternität': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/103-kolonialgeschichte.json::Hybridität': {
    plural: 'die Hybriditäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/103-kolonialgeschichte.json::Entwicklungshilfe': {
    plural: 'die Entwicklungshilfen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/103-kolonialgeschichte.json::Vergangenheitsbewältigung': {
    plural: 'die Vergangenheitsbewältigungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/104-interreligioeser-dialog.json::Kohärenz': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/111-neuroethik.json::Chancengleichheit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/112-palliativmedizin.json::Empathie': {
    plural: 'die Empathien',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/117-tiefenökologie.json::Koexistenz': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Mündigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::Atonalität': {
    plural: 'die Atonalitäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::Entfremdung': {
    plural: 'die Entfremdungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/105-religionskritik-feuerbach.json::Diesseitigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/105-religionskritik-feuerbach.json::Jenseitigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/110-strukturalismus-levi-strauss.json::Strukturalismus': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/111-neuroethik.json::Willensfreiheit': {
    plural: 'die Willensfreiheiten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/112-palliativmedizin.json::Spiritualit\u00e4t': {
    plural: 'die Spiritualit\u00e4ten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/112-palliativmedizin.json::Lebensqualit\u00e4t': {
    plural: 'die Lebensqualit\u00e4ten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/114-technikphilosophie.json::Weltlichkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/117-tiefen\u00f6kologie.json::Anthropoz\u00e4n': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/118-anthropozaen.json::Ressourcenverbrauch': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/119-klimagerechtigkeit.json::Klimagerechtigkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/12-religionswissenschaft-saekularisierung.json::Synkretismus': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/121-populismus-forschung.json::Apologetik': {
    plural: 'die Apologetiken',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/136-utopieforschung.json::Transhumanismus': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Wissenschaftsfreiheit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Pers\u00f6nlichkeitsentfaltung': {
    plural: 'die Pers\u00f6nlichkeitsentfaltungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/120-republikanismus.json::Machtf\u00fclle': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Bildungsb\u00fcrgertum': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Verinnerlichung': {
    plural: 'die Verinnerlichungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/134-ethnomethodologie.json::Hintergrundwissen': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/135-geschichtsphilosophie.json::Geschichtlichkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/04-literaturwissenschaft-hermeneutik.json::Sinnkonstitution': {
    plural: 'die Sinnkonstitutionen',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::Klangfarbenmelodie': {
    plural: 'die Klangfarbenmelodien',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::Dodekaphonie': {
    plural: 'die Dodekaphonien',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/33-wissenschaftssoziologie.json::Wissenssoziologie': {
    plural: 'die Wissenssoziologien',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/48-deontologie-konsequentialismus.json::Verbindlichkeit': {
    plural: 'die Verbindlichkeiten',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/54-religionsphilosophie.json::Eschatologie': {
    plural: 'die Eschatologien',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/54-religionsphilosophie.json::Pantheismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/54-religionsphilosophie.json::Deismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/54-religionsphilosophie.json::Heilsgeschichte': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/55-mystik-kontemplation.json::Gnosis': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/55-mystik-kontemplation.json::Unio Mystica': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/55-mystik-kontemplation.json::Esoterik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/79-literarische-gattungen.json::Narratologie': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/84-netzwerkgesellschaft-castells.json::Mediatisierung': {
    plural: 'die Mediatisierungen',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/23-poststrukturalismus.json::Textualit\u00e4t': {
    plural: 'die Textualit\u00e4ten',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/41-verhaltens\u00f6konomie.json::Anreizkompatibilit\u00e4t': {
    plural: 'die Anreizkompatibilit\u00e4ten',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/42-oekologische-oekonomie.json::Kreislaufwirtschaft': {
    plural: 'die Kreislaufwirtschaften',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/116-digitaler-humanismus.json::Datenhoheit': {
    plural: 'die Datenhoheiten',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/27-uebersetzungswissenschaft.json::Pragmatik': {
    plural: 'die Pragmatiken',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/27-uebersetzungswissenschaft.json::Intertextualit\u00e4t': {
    plural: 'die Intertextualit\u00e4ten',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/61-phenomenologie.json::Intentionalit\u00e4t': {
    plural: 'die Intentionalit\u00e4ten',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/27-uebersetzungswissenschaft.json::Rezeptions\u00e4sthetik': {
    plural: 'die Rezeptions\u00e4sthetiken',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/96-ueberwachungsstaat.json::\u00dcberwachungskapitalismus': {
    plural: 'die \u00dcberwachungskapitalismen',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/41-verhaltens\u00f6konomie.json::Verhaltens\u00f6konomie': {
    plural: 'die Verhaltens\u00f6konomien',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/48-deontologie-konsequentialismus.json::Pr\u00e4ferenzutilitarismus': {
    plural: 'die Pr\u00e4ferenzutilitarismen',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/14-biopolitik-transhumanismus.json::Autopoiesis': {
    plural: 'die Autopoiesen',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/65-anarchismus-libertarismus.json::F\u00f6deralismus': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c1/vocabulary/17-verfassungsrecht-staatstheorie.json::F\u00f6deralismus': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/40-ordoliberalismus.json::Verteilungsgerechtigkeit': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/63-utilitarismus.json::Verteilungsgerechtigkeit': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c1/vocabulary/16-datenschutz-digitalethik.json::informationelle Selbstbestimmung': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/116-digitaler-humanismus.json::informationelle Selbstbestimmung': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/16-datenschutz-digitalethik.json::digitale M\u00fcndigkeit': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/116-digitaler-humanismus.json::digitale M\u00fcndigkeit': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/99-avantgarde-dadaismus.json::Intermediale': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c1/vocabulary/49-theaterwissenschaft.json::Intermediale': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/86-entwicklungsoekonomie.json::Humankapital': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c1/vocabulary/60-arbeitssoziologie-prekaritaet.json::Humankapital': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/143-lacan-lacanian.json::Unbewusste': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/07-psychoanalyse-tiefenpsychologie.json::Unbewusste': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/14-biopolitik-transhumanismus.json::Kybernetik': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/94-kybernetik-informationstheorie.json::Kybernetik': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/143-lacan-lacanian.json::Imagin\u00e4re': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/92-orientalismus-said.json::Imagin\u00e4re': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/40-ordoliberalismus.json::Sozialstaatlichkeit': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/63-utilitarismus.json::Sozialstaatlichkeit': {
    plural: '-',
    pluralStatus: CORPUS_REVIEW,
  },
  'content/c2/vocabulary/116-digitaler-humanismus.json::Zivilgesellschaftliche Partizipation': {
    word: 'zivilgesellschaftliche Partizipation',
    plural: 'die zivilgesellschaftlichen Partizipationen',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_REVIEW,
    exampleSentence1:
      'Die zivilgesellschaftliche Partizipation ist entscheidend f\u00fcr eine demokratische und gerechte Gestaltung der Digitalisierung.',
    exampleSentence2:
      'Durch zivilgesellschaftliche Partizipation k\u00f6nnen B\u00fcrger ihre Interessen und Bedenken in den Technologieentwicklungsprozess einbringen.',
  },
  'content/c2/vocabulary/116-digitaler-humanismus.json::digitale Resilienz': {
    plural: 'die digitalen Resilienzen',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_REVIEW,
  },
  'content/c2/vocabulary/116-digitaler-humanismus.json::digitale Inklusion': {
    plural: 'die digitalen Inklusionen',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_REVIEW,
  },
  'content/c2/vocabulary/136-utopieforschung.json::Systemimmanenz': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/28-rechtshermeneutik.json::Rechtshermeneutik': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/74-wissenschaftliche-revolution.json::intersubjektive Nachvollziehbarkeit': {
    plural: '-',
    pluralStatus: DUDEN_COMPOUND_HEADWORD_SINGULAR_ONLY_REVIEW,
  },
  'content/c2/vocabulary/107-dekonstruktivismus-architektur.json::Ineinandergreifen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::Schaffen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/109-elektronische-musik.json::Oszillieren': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/112-palliativmedizin.json::Sterbefasten': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/114-technikphilosophie.json::Entbergen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/135-geschichtsphilosophie.json::Verstehen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/137-musiksemiotik.json::Verorten': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/41-verhaltens\u00f6konomie.json::Prokrastinieren': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/49-tugendethik-aristoteles.json::Streben': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/49-tugendethik-aristoteles.json::Sittlichkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/49-tugendethik-aristoteles.json::Tugendhaftigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/49-tugendethik-aristoteles.json::Selbstverwirklichung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/93-gender-studies-butler.json::Begehren': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/104-interreligioeser-dialog.json::Konvergenzstreben': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/104-interreligioeser-dialog.json::Ringen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/114-technikphilosophie.json::Wahrheitsgeschehen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/117-tiefen\u00f6kologie.json::Artensterben': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Erkenntnisstreben': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/134-ethnomethodologie.json::Alltagswissen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/25-diskursanalyse.json::Weltwissen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/32-empirismus-rationalismus.json::Erfahrungswissen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/88-bindungstheorie-bowlby.json::Internalisierungsgeschehen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/88-bindungstheorie-bowlby.json::Bindungsverhalten': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/88-bindungstheorie-bowlby.json::Feinfühligkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/88-bindungstheorie-bowlby.json::Explorationsbereitschaft': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/88-bindungstheorie-bowlby.json::psychische Widerstandsfähigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/88-bindungstheorie-bowlby.json::Bindungsunsicherheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/91-kulturgedaechtnis.json::Transgenerationalität': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/91-kulturgedaechtnis.json::Gedächtnissemantik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/91-kulturgedaechtnis.json::Archivgut': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/91-kulturgedaechtnis.json::Zeugenschaft': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/114-technikphilosophie.json::Dasein': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/117-tiefen\u00f6kologie.json::In-der-Welt-Sein': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/118-anthropozaen.json::Biodiversit\u00e4tssterben': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/131-dialektik-der-aufklaerung.json::Identit\u00e4tsdenken': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/135-geschichtsphilosophie.json::Geschichtsbewusstsein': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/136-utopieforschung.json::Epochenbewusstsein': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/38-klassentheorie-ungleichheit.json::Klassenbewusstsein': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/52-historiographie-methodik.json::Geschichtsbewusstsein': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/52-historiographie-methodik.json::Metahistorie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/62-dialektik-hegel.json::Werden': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/66-generative-grammatik.json::angeborenes Wissen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/100-konzeptkunst-minimalismus.json::Immaterielle': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/104-interreligioeser-dialog.json::Immanente': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/107-dekonstruktivismus-architektur.json::Ersch\u00fcttern': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/110-strukturalismus-levi-strauss.json::Entschl\u00fcsseln': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Epistemische': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Ganzheitliche': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/130-erhabene-sublime.json::Erhabene': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/130-erhabene-sublime.json::Scheitern': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/130-erhabene-sublime.json::Unfassbare': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/143-lacan-lacanian.json::Symbolische': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/143-lacan-lacanian.json::Reale': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/144-trauma-forschung.json::Verdr\u00e4ngen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/17-musikwissenschaft-kulturindustrie.json::Epigonentum': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/22-existenzphilosophie.json::Nichts': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/45-analytische-psychologie.json::Kollektive Unbewusste': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/47-existenzielle-psychotherapie.json::Vergegenw\u00e4rtigen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/47-existenzielle-psychotherapie.json::Autotelische': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/50-kulturkritik-postmoderne.json::Postfaktische': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/77-postkoloniale-literatur.json::Postkoloniale': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/99-avantgarde-dadaismus.json::Absurde': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/02-rechtsphilosophie-justiz.json::Apodiktizit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/06-anthropologie-ethnografie.json::Transkulturalit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/103-kolonialgeschichte.json::Transkulturalit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/105-religionskritik-feuerbach.json::Heilsgewissheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/106-bauhaus-modernismus.json::Materialgerechtigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/106-bauhaus-modernismus.json::Raum\u00f6konomie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::Klanglichkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/114-technikphilosophie.json::Seinsvergessenheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/114-technikphilosophie.json::Zuhandenheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/114-technikphilosophie.json::Vorhandenheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/61-phenomenologie.json::Apodiktizit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/116-digitaler-humanismus.json::Digitale Humanismus': {
    word: 'Digitaler Humanismus',
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/06-anthropologie-ethnografie.json::Postkolonialismusforschung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/101-aufklaerung-kant.json::Metaphysik der Sitten': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/106-bauhaus-modernismus.json::\u00c4sthetik der Sachlichkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/107-dekonstruktivismus-architektur.json::\u00c4sthetik des Unvollendeten': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/107-dekonstruktivismus-architektur.json::Atektonik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/109-elektronische-musik.json::Akusmatik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/111-neuroethik.json::Neuroethik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/111-neuroethik.json::Konnektomik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/114-technikphilosophie.json::Technikphilosophie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/117-tiefen\u00f6kologie.json::Tiefen\u00f6kologie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/117-tiefen\u00f6kologie.json::intrinsische Werthaftigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/119-klimagerechtigkeit.json::Zirkularit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/119-klimagerechtigkeit.json::Indigenit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/12-religionswissenschaft-saekularisierung.json::Entzauberung der Welt': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/121-populismus-forschung.json::Postfaktizit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/121-populismus-forschung.json::Elitenverachtung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/123-eigentumstheorie.json::Gemeinwohlorientierung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/123-eigentumstheorie.json::Inklusivit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/123-eigentumstheorie.json::Ressourcengovernance': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Autodidaktik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/106-bauhaus-modernismus.json::Reduktion auf das Wesentliche': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::Formaufl\u00f6sung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::Reihenkomposition': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::Emanzipation der Dissonanz': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::Zw\u00f6lftontechnik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::musikalische Avantgarde': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/108-atonalitaet-schoenberg.json::musikalische Syntax': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/97-gerechtigkeitstheorie-rawls.json::Verfahrensgerechtigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/97-gerechtigkeitstheorie-rawls.json::\u00f6ffentliche Vernunft': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/97-gerechtigkeitstheorie-rawls.json::Kontraktualismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/99-avantgarde-dadaismus.json::\u00c4sthetik des H\u00e4sslichen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/99-avantgarde-dadaismus.json::Zerrissenheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/99-avantgarde-dadaismus.json::Dadaismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/112-palliativmedizin.json::Letztentscheidungskompetenz': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/114-technikphilosophie.json::Widerst\u00e4ndigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/121-populismus-forschung.json::Populismusforschung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Humanismusrezeption': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Wissensgenerierung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/125-bildungsbegriff-humboldt.json::Geistesbildung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/02-rechtsphilosophie-justiz.json::Konsensualismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/103-kolonialgeschichte.json::Kolonialrevisionismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/111-neuroethik.json::Pr\u00e4diktive Genetik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/116-digitaler-humanismus.json::Datenkapitalismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/116-digitaler-humanismus.json::Recht auf Vergessenwerden': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/117-tiefen\u00f6kologie.json::Biozentrismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/117-tiefen\u00f6kologie.json::Regenerationsf\u00e4higkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/117-tiefen\u00f6kologie.json::Biokapazit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/119-klimagerechtigkeit.json::Umweltrassismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/12-religionswissenschaft-saekularisierung.json::Glaubenspluralismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/08-politische-rhetorik-demagogie.json::Appellcharakter': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/121-populismus-forschung.json::Demokratieverfall': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/123-eigentumstheorie.json::Kollektiveigentum': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/123-eigentumstheorie.json::Ressourcenbewirtschaftung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/123-eigentumstheorie.json::Tragik der Allmende': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/131-dialektik-der-aufklaerung.json::Instrumentelle Vernunft': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/131-dialektik-der-aufklaerung.json::Fetischcharakter': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/131-dialektik-der-aufklaerung.json::Unvers\u00f6hntheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/131-dialektik-der-aufklaerung.json::\u00c4sthetische Theorie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/131-dialektik-der-aufklaerung.json::Identit\u00e4tszwang': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/131-dialektik-der-aufklaerung.json::Immanente Kritik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/134-ethnomethodologie.json::Ethnomethodologie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/134-ethnomethodologie.json::Unhintergehbarkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/134-ethnomethodologie.json::Indexikalit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/134-ethnomethodologie.json::Lebensweltbezug': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/136-utopieforschung.json::Utopieforschung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/21-metaphysik-ontologie.json::Welthaftigkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/23-poststrukturalismus.json::Logozentrismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/23-poststrukturalismus.json::Hyperrealit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/23-poststrukturalismus.json::Unentscheidbarkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/23-poststrukturalismus.json::Diff\u00e9rance': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/24-kritische-theorie.json::Dialektik der Aufkl\u00e4rung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/24-kritische-theorie.json::Totalitarismusforschung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/24-kritische-theorie.json::mimetische Angleichung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/24-kritische-theorie.json::Kommunikationsrationalit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/24-kritische-theorie.json::normativ-kritische Ausrichtung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/27-uebersetzungswissenschaft.json::Idiomatizit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/27-uebersetzungswissenschaft.json::Interlingualit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/28-rechtshermeneutik.json::Verfassungskonformit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/29-staatsphilosophie-vertieft.json::Diskursethik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/27-uebersetzungswissenschaft.json::Deixis': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/27-uebersetzungswissenschaft.json::Polysemie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/28-rechtshermeneutik.json::Systematik': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/29-staatsphilosophie-vertieft.json::Konstitutionalismus': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/29-staatsphilosophie-vertieft.json::Verfasstheit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/30-menschenrechte-voelkerrecht.json::Schutzverantwortung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/30-menschenrechte-voelkerrecht.json::V\u00f6lkerstrafrecht': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/33-wissenschaftssoziologie.json::Wissensproduktion': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/33-wissenschaftssoziologie.json::Akteur-Netzwerk-Theorie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/33-wissenschaftssoziologie.json::Positivismusstreit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/33-wissenschaftssoziologie.json::Wissenschaftlichkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/37-machttheorie-herrschaft.json::Strukturgewalt': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/38-klassentheorie-ungleichheit.json::Sozialkapital': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/39-zivilisationstheorie.json::Akzeleration': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/39-zivilisationstheorie.json::Ambiguit\u00e4tstoleranz': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/39-zivilisationstheorie.json::Beharrungsverm\u00f6gen': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/40-ordoliberalismus.json::Pareto-Effizienz': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/41-verhaltens\u00f6konomie.json::Nudging': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/41-verhaltens\u00f6konomie.json::Selbstkontrolle': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/41-verhaltens\u00f6konomie.json::Ambiguit\u00e4tsaversion': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/41-verhaltens\u00f6konomie.json::Verlustaversion': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/42-oekologische-oekonomie.json::Konvivialit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/42-oekologische-oekonomie.json::Postwachstums\u00f6konomie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/42-oekologische-oekonomie.json::Ressourcenproduktivit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/44-filmtheorie-auteur.json::Filmhistorizit\u00e4t': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/46-gestaltpsychologie.json::Reizverarbeitung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/46-gestaltpsychologie.json::Ganzheitlichkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/48-deontologie-konsequentialismus.json::Wohlfahrtsmaximierung': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/48-deontologie-konsequentialismus.json::Heteronomie': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/c2/vocabulary/48-deontologie-konsequentialismus.json::Zurechenbarkeit': {
    plural: '-',
    pluralStatus: REGULAR_RULE_REVIEW,
  },
  'content/a1/vocabulary/14-zeitangaben.json::Januar': {
    article: 'MASKULIN',
    plural: 'die Januare',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/a1/vocabulary/14-zeitangaben.json::Februar': {
    article: 'MASKULIN',
    plural: 'die Februare',
    articleStatus: 'duden_aligned_needs_native_signoff',
    pluralStatus: 'duden_aligned_needs_native_signoff',
  },
  'content/a1/vocabulary/14-zeitangaben.json::März': {
    article: 'MASKULIN',
    plural: 'die Märze',
    articleStatus: 'duden_aligned_needs_native_signoff',
    pluralStatus: 'duden_aligned_needs_native_signoff',
  },
  'content/a1/vocabulary/14-zeitangaben.json::April': {
    article: 'MASKULIN',
    plural: 'die Aprile',
    articleStatus: 'duden_aligned_needs_native_signoff',
    pluralStatus: 'duden_aligned_needs_native_signoff',
  },
  'content/a1/vocabulary/14-zeitangaben.json::Mai': {
    article: 'MASKULIN',
    plural: 'die Maie',
    articleStatus: 'duden_aligned_needs_native_signoff',
    pluralStatus: 'duden_aligned_needs_native_signoff',
  },
  'content/a1/vocabulary/14-zeitangaben.json::Juni': {
    article: 'MASKULIN',
    plural: 'die Junis',
    articleStatus: 'duden_aligned_needs_native_signoff',
    pluralStatus: 'duden_aligned_needs_native_signoff',
  },
  'content/a1/vocabulary/14-zeitangaben.json::Juli': {
    article: 'MASKULIN',
    plural: 'die Julis',
    articleStatus: 'duden_aligned_needs_native_signoff',
    pluralStatus: 'duden_aligned_needs_native_signoff',
  },
  'content/a1/vocabulary/14-zeitangaben.json::August': {
    article: 'MASKULIN',
    plural: 'die Auguste',
    articleStatus: 'duden_aligned_needs_native_signoff',
    pluralStatus: 'duden_aligned_needs_native_signoff',
  },
  'content/a1/vocabulary/14-zeitangaben.json::September': {
    article: 'MASKULIN',
    plural: 'die September',
    articleStatus: 'duden_aligned_needs_native_signoff',
    pluralStatus: 'duden_aligned_needs_native_signoff',
  },
  'content/a1/vocabulary/14-zeitangaben.json::Oktober': {
    article: 'MASKULIN',
    plural: 'die Oktober',
    articleStatus: 'duden_aligned_needs_native_signoff',
    pluralStatus: 'duden_aligned_needs_native_signoff',
  },
  'content/a1/vocabulary/14-zeitangaben.json::November': {
    article: 'MASKULIN',
    plural: 'die November',
    articleStatus: 'duden_aligned_needs_native_signoff',
    pluralStatus: 'duden_aligned_needs_native_signoff',
  },
  'content/a1/vocabulary/14-zeitangaben.json::Dezember': {
    article: 'MASKULIN',
    plural: 'die Dezember',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/a1/vocabulary/01-person.json::Leute': {
    article: null,
    plural: 'die Leute',
    articleStatus: DUDEN_PLURALWORD_REVIEW,
    pluralStatus: DUDEN_PLURALWORD_REVIEW,
  },
  'content/a1/vocabulary/02-familie-freunde.json::Geschwister': {
    article: 'NEUTRUM',
    plural: 'die Geschwister',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/a1/vocabulary/02-familie-freunde.json::Leute': {
    article: null,
    plural: 'die Leute',
    articleStatus: DUDEN_PLURALWORD_REVIEW,
    pluralStatus: DUDEN_PLURALWORD_REVIEW,
  },
  'content/a1/vocabulary/02-familie-freunde.json::Eltern': {
    article: null,
    plural: 'die Eltern',
    articleStatus: DUDEN_PLURALWORD_REVIEW,
    pluralStatus: DUDEN_PLURALWORD_REVIEW,
  },
  'content/a1/vocabulary/03-koerper-gesundheit.json::Schmerzen': {
    article: 'MASKULIN',
    plural: 'die Schmerzen',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/a1/vocabulary/04-wohnen.json::Möbel': {
    article: 'NEUTRUM',
    plural: 'die Möbel',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/a1/vocabulary/11-freizeit.json::Ferien': {
    article: null,
    plural: 'die Ferien',
    articleStatus: DUDEN_PLURALWORD_REVIEW,
    pluralStatus: DUDEN_PLURALWORD_REVIEW,
  },
  'content/a1/vocabulary/17-laender-nationalitaeten.json::USA': {
    article: null,
    plural: 'die USA',
    articleStatus: DUDEN_PLURALWORD_REVIEW,
    pluralStatus: DUDEN_PLURALWORD_REVIEW,
  },
  'content/a2/vocabulary/04-wohnen-haushalt.json::Möbel': {
    article: 'NEUTRUM',
    plural: 'die Möbel',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/a2/vocabulary/04-wohnen-haushalt.json::Nebenkosten': {
    article: null,
    plural: 'die Nebenkosten',
    articleStatus: DUDEN_PLURALWORD_REVIEW,
    pluralStatus: DUDEN_PLURALWORD_REVIEW,
  },
  'content/a2/vocabulary/08-dienstleistungen-amt.json::Steuern': {
    article: 'FEMININ',
    plural: 'die Steuern',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/a2/vocabulary/09-bildung-berufsleben.json::Kenntnisse': {
    article: 'FEMININ',
    plural: 'die Kenntnisse',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/a2/vocabulary/10-arbeit-wirtschaft.json::Überstunden': {
    article: 'FEMININ',
    plural: 'die Überstunden',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/a2/vocabulary/12-kommunikation-medien.json::Daten': {
    article: 'NEUTRUM',
    plural: 'die Daten',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/a2/vocabulary/18-geld-finanzen.json::Schulden': {
    article: 'FEMININ',
    plural: 'die Schulden',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/09-forschungsmethodik-akademie.json::Evidenz': {
    plural: 'die Evidenzen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/16-datenschutz-digitalethik.json::Nachvollziehbarkeit': {
    plural: '-',
    pluralStatus: DUDEN_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/22-verwaltungsrecht-behörden.json::Entbürokratisierung': {
    plural: 'die Entbürokratisierungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/25-geldpolitik-zentralbank.json::Überschuldung': {
    plural: 'die Überschuldungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/25-geldpolitik-zentralbank.json::quantitative Lockerung': {
    plural: 'die quantitativen Lockerungen',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/26-handelsabkommen-zoll.json::Reziprozität': {
    plural: 'die Reziprozitäten',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/28-steuerpolitik-haushalt.json::Bruttoinlandsprodukt (BIP)': {
    plural: 'die Bruttoinlandsprodukte',
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c1/vocabulary/31-kuenstliche-intelligenz-ml.json::Künstliche Intelligenz': {
    plural: '-',
    pluralStatus: DUDEN_SENSE_SINGULAR_ONLY_REVIEW,
  },
  'content/c1/vocabulary/33-migrationsdebatte.json::Ressentiments': {
    article: 'NEUTRUM',
    plural: 'die Ressentiments',
    articleStatus: DUDEN_ALIGNED_REVIEW,
    pluralStatus: DUDEN_ALIGNED_REVIEW,
  },
  'content/c2/vocabulary/87-institutionelle-oekonomie.json::Informationskosten': {
    article: null,
    plural: 'die Informationskosten',
    articleStatus: DUDEN_COMPOUND_PLURALWORD_REVIEW,
    pluralStatus: DUDEN_COMPOUND_PLURALWORD_REVIEW,
  },
}

function vocabularyFiles(): string[] {
  return LEVELS.flatMap((level) => {
    const dir = path.join(ROOT, 'content', level, 'vocabulary')
    return fs
      .readdirSync(dir)
      .filter((name) => name.endsWith('.json'))
      .sort()
      .map((name) => path.join(dir, name))
  })
}

function relativeFile(file: string): string {
  return path.relative(ROOT, file).replaceAll('\\', '/')
}

function normalizeVerbLabel(label: string): string {
  const stripped = label
    .toLocaleLowerCase('de-DE')
    .replace(/\([^)]*\)/gu, ' ')
    .replace(/[;,]/gu, ' ')
    .replace(
      /\b(sich|etw\.?|etwas|jdn\.?|jdm\.?|jemanden|jemandem|auf|an|mit|von|für|gegen|als)\b/gu,
      ' ',
    )
    .replace(/\s+/gu, ' ')
    .trim()
  const tokens = stripped.split(' ').filter(Boolean)
  const verbCandidates = tokens.filter((token) => /(en|eln|ern)$/u.test(token))
  return verbCandidates.at(-1) ?? tokens.at(-1) ?? stripped
}

function isPresentForms(value: unknown): value is PresentForms {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const forms = value as Record<string, unknown>
  return ['ich', 'du', 'er_sie_es', 'wir', 'ihr', 'sie_Sie'].every(
    (key) => typeof forms[key] === 'string' && forms[key].trim(),
  )
}

function parseLexicon(file: string | undefined): Map<string, LexiconRow> {
  const rows = new Map<string, LexiconRow>()
  if (!file) return rows
  const absolute = path.resolve(ROOT, file)
  if (!fs.existsSync(absolute)) throw new Error(`Vocabulary lexicon not found: ${absolute}`)

  const lines = fs.readFileSync(absolute, 'utf8').split(/\r?\n/u).slice(1)
  for (const line of lines) {
    if (!line.trim()) continue
    const fields = line.split(',')
    if (fields.length !== 10) continue
    const [
      infinitive,
      ich,
      du,
      erSieEs,
      praeteritumIch,
      partizip2,
      konjunktiv2Ich,
      imperativSingular,
      imperativPlural,
      auxiliary,
    ] = fields.map((field) => field.trim())
    rows.set(infinitive.toLocaleLowerCase('de-DE'), {
      infinitive,
      ich,
      du,
      erSieEs,
      praeteritumIch,
      partizip2,
      konjunktiv2Ich,
      imperativSingular,
      imperativPlural,
      auxiliary,
    })
  }
  return rows
}

function addReflexive(form: string, pronoun: string): string {
  const [finite, ...remainder] = form.trim().split(/\s+/u)
  return [finite, pronoun, ...remainder].filter(Boolean).join(' ')
}

function presentForms(row: LexiconRow, reflexive: boolean): PresentForms {
  const forms: PresentForms = {
    ich: row.ich,
    du: row.du,
    er_sie_es: row.erSieEs,
    wir: row.infinitive,
    ihr: row.imperativPlural,
    sie_Sie: row.infinitive,
  }
  if (!reflexive) return forms
  return {
    ich: addReflexive(forms.ich, 'mich'),
    du: addReflexive(forms.du, 'dich'),
    er_sie_es: addReflexive(forms.er_sie_es, 'sich'),
    wir: addReflexive(forms.wir, 'uns'),
    ihr: addReflexive(forms.ihr, 'euch'),
    sie_Sie: addReflexive(forms.sie_Sie, 'sich'),
  }
}

function splitSeparableVerb(infinitive: string): { particle: string; base: string } | null {
  for (const particle of SEPARABLE_PREFIXES) {
    if (infinitive.startsWith(particle) && infinitive.length > particle.length + 2) {
      const base = infinitive.slice(particle.length)
      if (/(en|eln|ern)$/u.test(base)) return { particle, base }
    }
  }
  return null
}

function weakPresentForms(infinitive: string): PresentForms | null {
  if (UNSAFE_REGULAR_BASES.has(infinitive)) return null
  if (infinitive.endsWith('ieren')) {
    const stem = infinitive.slice(0, -2)
    return {
      ich: `${stem}e`,
      du: `${stem}st`,
      er_sie_es: `${stem}t`,
      wir: infinitive,
      ihr: `${stem}t`,
      sie_Sie: infinitive,
    }
  }
  if (infinitive.endsWith('eln')) {
    const root = infinitive.slice(0, -3)
    return {
      ich: `${root}le`,
      du: `${root}elst`,
      er_sie_es: `${root}elt`,
      wir: infinitive,
      ihr: `${root}elt`,
      sie_Sie: infinitive,
    }
  }
  if (infinitive.endsWith('ern')) {
    const stem = infinitive.slice(0, -1)
    return {
      ich: `${stem}e`,
      du: `${stem}st`,
      er_sie_es: `${stem}t`,
      wir: infinitive,
      ihr: `${stem}t`,
      sie_Sie: infinitive,
    }
  }
  if (!infinitive.endsWith('en')) return null

  const stem = infinitive.slice(0, -2)
  const needsLinkingE =
    /[dt]$/u.test(stem) ||
    (!/(mm|nn)$/iu.test(stem) && (/[^aeiouäöüßlr]m$/iu.test(stem) || /[^aeiouäöüßlr]n$/iu.test(stem)))
  const sibilantStem = /[sßxz]$/iu.test(stem)
  const du = needsLinkingE ? `${stem}est` : sibilantStem ? `${stem}t` : `${stem}st`
  const third = needsLinkingE ? `${stem}et` : `${stem}t`
  return {
    ich: `${stem}e`,
    du,
    er_sie_es: third,
    wir: infinitive,
    ihr: third,
    sie_Sie: infinitive,
  }
}

function appendParticle(form: string, particle: string): string {
  return `${form} ${particle}`.trim()
}

function addReflexiveAndParticle(form: string, pronoun: string | null, particle: string | null): string {
  const parts = [form, pronoun, particle].filter(Boolean)
  return parts.join(' ')
}

function regularRulePresentForms(
  infinitive: string,
  separable: boolean,
  reflexive: boolean,
): PresentForms | null {
  const split = separable ? splitSeparableVerb(infinitive) : null
  const base = split?.base ?? infinitive
  const baseForms = weakPresentForms(base)
  if (!baseForms) return null
  const particle = split?.particle ?? null
  const forms: PresentForms = particle
    ? {
        ich: appendParticle(baseForms.ich, particle),
        du: appendParticle(baseForms.du, particle),
        er_sie_es: appendParticle(baseForms.er_sie_es, particle),
        wir: appendParticle(baseForms.wir, particle),
        ihr: appendParticle(baseForms.ihr, particle),
        sie_Sie: appendParticle(baseForms.sie_Sie, particle),
      }
    : baseForms

  if (!reflexive) return forms
  return {
    ich: addReflexiveAndParticle(particle ? baseForms.ich : forms.ich, 'mich', particle),
    du: addReflexiveAndParticle(particle ? baseForms.du : forms.du, 'dich', particle),
    er_sie_es: addReflexiveAndParticle(particle ? baseForms.er_sie_es : forms.er_sie_es, 'sich', particle),
    wir: addReflexiveAndParticle(particle ? baseForms.wir : forms.wir, 'uns', particle),
    ihr: addReflexiveAndParticle(particle ? baseForms.ihr : forms.ihr, 'euch', particle),
    sie_Sie: addReflexiveAndParticle(particle ? baseForms.sie_Sie : forms.sie_Sie, 'sich', particle),
  }
}

function buildCanonicalMap(records: RecordItem[]): Map<string, Conjugation> {
  const canonical = new Map<string, Conjugation>()
  for (const record of records) {
    for (const word of record.data.words) {
      if (
        word.wordType === 'VERB' &&
        word.conjugation &&
        !word.conjugation.reviewStatus &&
        isPresentForms(word.conjugation.praesens)
      ) {
        const key = word.word.toLocaleLowerCase('de-DE')
        if (!canonical.has(key)) canonical.set(key, structuredClone(word.conjugation))
      }
    }
  }
  return canonical
}

function lowerInitial(value: string): string {
  return value.charAt(0).toLocaleLowerCase('de-DE') + value.slice(1)
}

function applyKnownFixes(
  file: string,
  word: VocabularyWord,
  reasons: Record<string, number>,
): boolean {
  let changed = false
  const key = `${relativeFile(file)}::${word.word}`
  const fix = KNOWN_CONTENT_FIXES[key]
  if (fix) {
    for (const [field, value] of Object.entries(fix)) {
      if (word[field] !== value) {
        word[field] = value
        changed = true
      }
    }
    if (changed) reasons['known-content-fix'] = (reasons['known-content-fix'] ?? 0) + 1
  }
  return changed
}

function applyKnownConjugationFix(
  file: string,
  word: VocabularyWord,
  reasons: Record<string, number>,
): boolean {
  if (word.wordType !== 'VERB') return false
  const key = `${relativeFile(file)}::${word.word}`
  const fix = KNOWN_CONJUGATION_FIXES[key]
  if (!fix) return false

  const next = {
    ...word.conjugation,
    ...fix,
  }
  if (JSON.stringify(word.conjugation ?? {}) === JSON.stringify(next)) return false

  word.conjugation = next
  reasons['known-conjugation-fix'] = (reasons['known-conjugation-fix'] ?? 0) + 1
  return true
}

function validate(records: RecordItem[]) {
  const errors: string[] = []
  let files = 0
  let entries = 0
  for (const record of records) {
    files++
    for (const [index, word] of record.data.words.entries()) {
      entries++
      const label = `${relativeFile(record.file)}#${index}/${word.word}`
      if (word.article === 'null') errors.push(`${label}: article is the string "null"`)
      if (word.plural === 'null') errors.push(`${label}: plural is the string "null"`)
      if (
        ['VERB', 'ADJEKTIV', 'ADVERB'].includes(word.wordType) &&
        !word.word.includes(' ') &&
        /^[A-ZÄÖÜ]/u.test(word.word)
      ) {
        errors.push(`${label}: single-token ${word.wordType} starts uppercase`)
      }
    }
  }
  if (files !== 369) errors.push(`Vocabulary inventory has ${files} files, expected 369`)
  if (entries !== 10_461) errors.push(`Vocabulary inventory has ${entries} entries, expected 10461`)
  if (errors.length) throw new Error(`Vocabulary D7 validation failed:\n${errors.slice(0, 50).join('\n')}`)
}

function main() {
  const write = process.argv.includes('--write')
  const lexiconArgIndex = process.argv.indexOf('--lexicon')
  const lexiconPath = lexiconArgIndex >= 0 ? process.argv[lexiconArgIndex + 1] : undefined
  const lexicon = parseLexicon(lexiconPath)
  const records: RecordItem[] = vocabularyFiles().map((file) => ({
    file,
    level: relativeFile(file).split('/')[1].toUpperCase(),
    data: JSON.parse(fs.readFileSync(file, 'utf8')) as VocabularyFile,
  }))
  const canonical = buildCanonicalMap(records)
  const reasons: Record<string, number> = {}
  const touchedFiles = new Set<string>()
  const byLevel: Record<string, number> = Object.fromEntries(LEVELS.map((level) => [level.toUpperCase(), 0]))

  for (const record of records) {
    let fileChanged = false
    for (const word of record.data.words) {
      let changed = false

      if (word.article === 'null') {
        word.article = null
        reasons['string-null-article'] = (reasons['string-null-article'] ?? 0) + 1
        changed = true
      }
      if (word.plural === 'null') {
        word.plural = word.wordType === 'NOMEN' ? '-' : null
        reasons['string-null-plural'] = (reasons['string-null-plural'] ?? 0) + 1
        changed = true
      }
      if (
        word.wordType === 'NOMEN' &&
        word.plural == null &&
        typeof word.pluralStatus !== 'string'
      ) {
        word.plural = '-'
        reasons['no-plural-marker'] = (reasons['no-plural-marker'] ?? 0) + 1
        changed = true
      }
      if (
        ['VERB', 'ADJEKTIV', 'ADVERB'].includes(word.wordType) &&
        !word.word.includes(' ') &&
        /^[A-ZÄÖÜ]/u.test(word.word)
      ) {
        word.word = lowerInitial(word.word)
        reasons['lowercase-lexeme'] = (reasons['lowercase-lexeme'] ?? 0) + 1
        changed = true
      }
      if (
        relativeFile(record.file) === 'content/a1/vocabulary/15-zahlen.json' &&
        word.wordType === 'NOMEN' &&
        !word.article &&
        /^[a-zäöüß]/u.test(word.word)
      ) {
        word.wordType = 'NUMERALE'
        reasons['number-word-type'] = (reasons['number-word-type'] ?? 0) + 1
        changed = true
      }
      if (applyKnownFixes(record.file, word, reasons)) changed = true
      if (applyKnownConjugationFix(record.file, word, reasons)) changed = true

      if (
        word.wordType === 'VERB' &&
        (word.conjugation?.reviewStatus === AUTO_REVIEW ||
          word.conjugation?.reviewStatus === REGULAR_RULE_REVIEW)
      ) {
        const isAutoReview = word.conjugation.reviewStatus === AUTO_REVIEW
        const base = normalizeVerbLabel(word.word)
        const row = lexicon.get(base)
        const canonicalConjugation = canonical.get(word.word.toLocaleLowerCase('de-DE'))
        if (row && isAutoReview) {
          const reflexive = /(^|\s)sich(\s|$)|\(sich\)/iu.test(word.word)
          word.conjugation = {
            ...word.conjugation,
            praesens: presentForms(row, reflexive),
            isSeparable: row.ich.includes(' '),
            reviewStatus: LEXICON_REVIEW,
          }
          reasons['lexicon-conjugation'] = (reasons['lexicon-conjugation'] ?? 0) + 1
          changed = true
        } else if (canonicalConjugation && isAutoReview) {
          word.conjugation = {
            ...structuredClone(canonicalConjugation),
            reviewStatus: CORPUS_REVIEW,
          }
          reasons['corpus-conjugation'] = (reasons['corpus-conjugation'] ?? 0) + 1
          changed = true
        } else {
          const reflexive = /(^|\s)sich(\s|$)|\(sich\)/iu.test(word.word)
          const regularForms = regularRulePresentForms(base, word.conjugation.isSeparable === true, reflexive)
          if (regularForms) {
            const needsRegularUpdate =
              word.conjugation.reviewStatus !== REGULAR_RULE_REVIEW ||
              JSON.stringify(word.conjugation.praesens) !== JSON.stringify(regularForms)
            if (needsRegularUpdate) {
              word.conjugation = {
                ...word.conjugation,
                praesens: regularForms,
                reviewStatus: REGULAR_RULE_REVIEW,
              }
              reasons['regular-rule-conjugation'] = (reasons['regular-rule-conjugation'] ?? 0) + 1
              changed = true
            }
          }
        }
      }

      if (changed) fileChanged = true
    }

    if (fileChanged) {
      touchedFiles.add(record.file)
      byLevel[record.level]++
      const note =
        'Vocabulary D7 advisory remediation: objective schema, lexeme, semantic, or conjugation blockers were corrected; final native signoff remains pending.'
      if (record.data.cefrAudit && !record.data.cefrAudit.notes?.includes(note)) {
        record.data.cefrAudit.notes = [record.data.cefrAudit.notes?.trim(), note].filter(Boolean).join(' ')
      }
    }
  }

  validate(records)
  if (write) {
    for (const record of records) {
      if (touchedFiles.has(record.file)) {
        fs.writeFileSync(record.file, `${JSON.stringify(record.data, null, 2)}\n`, 'utf8')
      }
    }
  }

  const remainingAutoReview = records.reduce(
    (total, record) =>
      total +
      record.data.words.filter(
        (word) => word.wordType === 'VERB' && word.conjugation?.reviewStatus === AUTO_REVIEW,
      ).length,
    0,
  )
  console.log(
    JSON.stringify(
      {
        mode: write ? 'write' : 'dry-run',
        totalVocabularyFiles: records.length,
        totalEntries: records.reduce((sum, record) => sum + record.data.words.length, 0),
        lexiconEntries: lexicon.size,
        touchedFiles: touchedFiles.size,
        byLevel,
        reasons,
        remainingAutoReview,
      },
      null,
      2,
    ),
  )
}

main()
