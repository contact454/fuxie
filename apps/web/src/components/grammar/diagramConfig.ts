/**
 * Grammar Diagram Configuration
 * Maps topicSlug → diagram image URLs for each theory block type.
 * Diagrams are Excalidraw-style hand-drawn images generated with Nano Banana.
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
  // ═══ A1 ═══
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

  // ═══ A1 — Topics from grammar-topics.json seed ═══
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
}
