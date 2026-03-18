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
    table: `${BASE}/a1/a1_praesens_table.png`,
    mnemonic: `${BASE}/a1/a1_praesens_mnemonic.png`,
  },
  'a1-sein-haben': {
    rule: `${BASE}/a1/a1_sein_haben_rule.png`,
    table: `${BASE}/a1/a1_sein_haben_table.png`,
    mnemonic: `${BASE}/a1/a1_sein_haben_mnemonic.png`,
  },
  'a1-artikel': {
    rule: `${BASE}/a1/a1_artikel_rule.png`,
    table: `${BASE}/a1/a1_artikel_table.png`,
  },
  'a1-personalpronomen': {
    rule: `${BASE}/a1/a1_pronomen_rule.png`,
  },
  'a1-negation': {
    rule: `${BASE}/a1/a1_negation_rule.png`,
  },
  'a1-w-fragen': {
    rule: `${BASE}/a1/a1_wfragen_rule.png`,
  },
  'a1-satzstellung': {
    rule: `${BASE}/a1/a1_satzstellung_rule.png`,
  },
  'a1-akkusativ': {
    rule: `${BASE}/a1/a1_akkusativ_rule.png`,
  },
  'a1-trennbare-verben': {
    rule: `${BASE}/a1/a1_trennbare_rule.png`,
  },
  'a1-modalverben': {
    rule: `${BASE}/a1/a1_modalverben_rule.png`,
    table: `${BASE}/a1/a1_modalverben_table.png`,
  },
}
