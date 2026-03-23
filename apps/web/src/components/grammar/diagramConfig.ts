/**
 * Grammar Diagram Configuration
 * Maps topicSlug → diagram image URLs for each theory block type.
 * Diagrams are Excalidraw-style hand-drawn images generated with Nano Banana.
 *
 * Topic slugs follow the pattern: {level}-{topic_id}
 * e.g. "a1-praesens", "a2-dativ", "b1-konjunktiv2"
 */

export interface TopicDiagrams {
  /** Diagram for the 'rule' block — flowchart/formula visual */
  rule?: string
  /** Diagram for the 'paradigm_table' block — conjugation/declension grid */
  table?: string
  /** Diagram for the 'mnemonic' block — mind-map/memory aid */
  mnemonic?: string
}

const BASE = '/images/grammar'

export const grammarDiagrams: Record<string, TopicDiagrams> = {
  // ═══ A1 — From Grammatik-Factory ═══
  'a1-praesens': {
    table: `${BASE}/a1/a1_praesens_table_v4.png`,
    mnemonic: `${BASE}/a1/a1_praesens_mnemonic_v4.png`,
  },
  'a1-sein-haben': {
    rule: `${BASE}/a1/a1_sein_haben_v4.png`,
    table: `${BASE}/a1/a1_sein_haben_table_v4.png`,
    mnemonic: `${BASE}/a1/a1_sein_haben_mnemonic_v4.png`,
  },
  'a1-artikel': {
    rule: `${BASE}/a1/a1_artikel_rule_v4.png`,
    table: `${BASE}/a1/a1_artikel_table_v4.png`,
  },
  'a1-personalpronomen': {
    rule: `${BASE}/a1/a1_pronomen_v4.png`,
  },
  'a1-negation': {
    rule: `${BASE}/a1/a1_negation_v4.png`,
  },
  'a1-w-fragen': {
    rule: `${BASE}/a1/a1_wfragen_v4.png`,
  },
  'a1-satzstellung': {
    rule: `${BASE}/a1/a1_satzstellung_v4.png`,
  },
  'a1-akkusativ': {
    rule: `${BASE}/a1/a1_akkusativ_v4.png`,
  },
  'a1-trennbare-verben': {
    rule: `${BASE}/a1/a1_trennbare_v4.png`,
  },
  'a1-modalverben': {
    rule: `${BASE}/a1/a1_modalverben_rule_v4.png`,
    table: `${BASE}/a1/a1_modalverben_table_v4.png`,
  },

  // ─── A1 — From grammar-topics.json seed (alternate slugs) ───
  'a1-g01-alphabet-aussprache': {
    rule: `${BASE}/a1/a1_alphabet_rule_v4.png`,
    mnemonic: `${BASE}/a1/a1_alphabet_mnemonic_v4.png`,
  },
  'a1-g02-personalpronomen-sein-haben': {
    table: `${BASE}/a1/a1_pronomen_table_v4.png`,
    mnemonic: `${BASE}/a1/a1_pronomen_mnemonic_v4.png`,
  },
  'a1-g03-regelmaessige-verben': {
    rule: `${BASE}/a1/a1_regelmaessig_rule_v4.png`,
  },
  'a1-g04-satzbau-fragen': {
    rule: `${BASE}/a1/a1_satzbau_fragen_v4.png`,
  },

  // ═══ A2 ═══
  'a2-perfekt-haben': {
    rule: `${BASE}/a2/a2_perfekt_rule.png`,
  },
  'a2-perfekt-sein': {
    rule: `${BASE}/a2/a2_perfekt_rule.png`,
  },
  'a2-dativ': {
    rule: `${BASE}/a2/a2_dativ_rule.png`,
  },
  'a2-nebensatz-weil': {
    rule: `${BASE}/a2/a2_nebensaetze.png`,
  },
  'a2-nebensatz-dass': {
    rule: `${BASE}/a2/a2_konjunktionen.png`,
  },
  'a2-imperativ': {
    rule: `${BASE}/a2/a2_imperativ.png`,
  },
  'a2-komparativ': {
    rule: `${BASE}/a2/a2_komparativ.png`,
  },
  'a2-praeteritum': {
    rule: `${BASE}/a2/a2_praeteritum.png`,
  },
  'a2-reflexivverben': {
    rule: `${BASE}/a2/a2_reflexive.png`,
  },

  // ═══ B1 ═══
  'b1-konjunktiv2': {
    rule: `${BASE}/b1/b1_konjunktiv2.png`,
  },
  'b1-passiv': {
    rule: `${BASE}/b1/b1_passiv.png`,
  },
  'b1-relativsaetze': {
    rule: `${BASE}/b1/b1_relativsaetze.png`,
  },
  'b1-nebensatz-wenn-als': {
    rule: `${BASE}/b1/b1_praeteritum_regular.png`,
  },
  'b1-adjektivdeklination': {
    rule: `${BASE}/b1/b1_adjektivdeklination.png`,
  },
  'b1-genitiv': {
    rule: `${BASE}/b1/b1_genitiv.png`,
  },
  'b1-plusquamperfekt': {
    rule: `${BASE}/b1/b1_plusquamperfekt.png`,
  },
  'b1-futur1': {
    rule: `${BASE}/b1/b1_futur1.png`,
  },
  'b1-indirekte-fragen': {
    rule: `${BASE}/b1/b1_infinitiv_zu.png`,
  },

  // ═══ B2 ═══
  'b2-konjunktiv2-vergangenheit': {
    rule: `${BASE}/b2/b2_konjunktiv1.png`,
  },
  'b2-passiv-modal': {
    rule: `${BASE}/b2/b2_passiv_modal.png`,
  },
  'b2-partizip-adjektiv': {
    rule: `${BASE}/b2/b2_partizip_adj.png`,
  },
  'b2-konnektoren': {
    rule: `${BASE}/b2/b2_konnektoren.png`,
  },
  'b2-doppelkonjunktionen': {
    rule: `${BASE}/b2/b2_doppelkonj.png`,
  },
  'b2-nominalisierung': {
    rule: `${BASE}/b2/b2_nominalisierung.png`,
  },
  'b2-n-deklination': {
    rule: `${BASE}/b2/b2_n_deklination.png`,
  },
  'b2-futur2': {
    rule: `${BASE}/b2/b2_futur2.png`,
  },
  'b2-praeteritum-stark': {
    rule: `${BASE}/b2/b2_verbvalenz.png`,
  },

  // ═══ C1 ═══
  'c1-konjunktiv1': {
    rule: `${BASE}/c1/c1_konjunktiv1_adv.png`,
  },
  'c1-passiv-alternativen': {
    rule: `${BASE}/c1/c1_umformungen.png`,
  },
  'c1-subjektive-modalverben': {
    rule: `${BASE}/c1/c1_subjektive_modal.png`,
  },
  'c1-nomen-verb-verbindungen': {
    rule: `${BASE}/c1/c1_funktionsverb.png`,
  },
  'c1-erweiterte-konnektoren': {
    rule: `${BASE}/c1/c1_textgrammatik.png`,
  },
  'c1-modalpartikeln': {
    rule: `${BASE}/c1/c1_negation_adv.png`,
  },
  'c1-praep-genitiv-erweitert': {
    rule: `${BASE}/c1/c1_praeposition_adv.png`,
  },
  'c1-verbvalenz': {
    rule: `${BASE}/c1/c1_erweiterte_partizip.png`,
  },

  // ═══ C2 ═══
  'c2-erw-partizipialkonstruktionen': {
    rule: `${BASE}/c2/c2_syntax_komplex.png`,
  },
  'c2-nominalstil-verbalstil': {
    rule: `${BASE}/c2/c2_register.png`,
  },
  'c2-irreale-vergleichssaetze': {
    rule: `${BASE}/c2/c2_idiomatik.png`,
  },
  'c2-subjektloses-passiv': {
    rule: `${BASE}/c2/c2_stilistik.png`,
  },
  'c2-erweiterte-wortbildung': {
    rule: `${BASE}/c2/c2_wortbildung.png`,
  },
  'c2-textkohaerenz': {
    rule: `${BASE}/c2/c2_sprachvariation.png`,
  },
  'c2-stilistik-register': {
    rule: `${BASE}/c2/c2_modalpartikeln.png`,
  },
  'c2-konjunktiv1-erweitert': {
    rule: `${BASE}/c2/c2_syntax_komplex.png`,
  },
}
