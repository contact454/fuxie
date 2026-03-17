'use client'

// ─── Theory Block Types ──────────────────────────────
export interface RuleBlock {
  type: 'rule'
  text_vi: string
  formula?: string
  note_vi?: string
  steps_vi?: string[]
  comparison_vi?: string
}

export interface ParadigmTableBlock {
  type: 'paradigm_table'
  title: string
  headers: string[]
  rows: string[][]
  highlight_columns?: number[]
}

export interface ExamplesBlock {
  type: 'examples'
  items: { de: string; vi: string; highlight?: string[]; context_vi?: string }[]
}

export interface KeyTakeawayBlock {
  type: 'key_takeaway'
  text_vi: string
}

export interface MnemonicBlock {
  type: 'mnemonic'
  text_vi: string
  visual_emoji?: string
}

export interface ContrastBlock {
  type: 'contrast'
  left_label: string
  right_label: string
  rows: string[][]
}

export interface SituationBlock {
  type: 'situation'
  context_vi: string
  scene_emoji?: string
  dialogue: { speaker: string; text_de: string; text_vi: string }[]
  grammar_focus: string
}

export interface DiscoveryBlock {
  type: 'discovery'
  question_vi: string
  hints?: string[]
  reveal_text_vi: string
}

export interface CommonMistakesBlock {
  type: 'common_mistakes'
  title_vi?: string
  mistakes: { wrong: string; correct: string; explanation_vi: string }[]
}

export type TheoryBlock =
  | RuleBlock
  | ParadigmTableBlock
  | ExamplesBlock
  | KeyTakeawayBlock
  | MnemonicBlock
  | ContrastBlock
  | SituationBlock
  | DiscoveryBlock
  | CommonMistakesBlock

// ─── Exercise Types ──────────────────────────────────
export interface ExerciseHint {
  level: number
  text: string
  penalty: number
}

export interface MultipleChoiceExercise {
  id: string
  type: 'multiple_choice'
  scaffolding_level: number
  difficulty: number
  instruction_vi: string
  stem: string
  options: string[]
  correct: number
  explanation_vi?: string
  explanation_de?: string
  tags?: string[]
  hints?: ExerciseHint[]
}

export interface GapFillBankExercise {
  id: string
  type: 'gap_fill_bank'
  scaffolding_level: number
  difficulty: number
  instruction_vi: string
  stem: string
  blanks: { id: number; answer: string }[]
  bank: string[]
  explanation_vi?: string
  explanation_de?: string
  tags?: string[]
  hints?: ExerciseHint[]
}

export interface GapFillTypeExercise {
  id: string
  type: 'gap_fill_type'
  scaffolding_level: number
  difficulty: number
  instruction_vi: string
  stem: string
  answer: string[]
  accept_alt?: string[]
  hint_word?: string
  explanation_vi?: string
  explanation_de?: string
  tags?: string[]
  hints?: ExerciseHint[]
}

export interface MatchingExercise {
  id: string
  type: 'matching'
  scaffolding_level: number
  difficulty: number
  instruction_vi: string
  pairs: { left: string; right: string }[]
  explanation_vi?: string
  explanation_de?: string
  tags?: string[]
  hints?: ExerciseHint[]
}

export interface SentenceReorderExercise {
  id: string
  type: 'sentence_reorder'
  scaffolding_level: number
  difficulty: number
  instruction_vi: string
  words: string[]
  correct_order: string[]
  alt_orders?: string[][]
  explanation_vi?: string
  explanation_de?: string
  tags?: string[]
  hints?: ExerciseHint[]
}

export interface ErrorSpottingExercise {
  id: string
  type: 'error_spotting'
  scaffolding_level: number
  difficulty: number
  instruction_vi: string
  sentence_words: string[]
  error_index: number
  correct_word: string
  correct_sentence: string
  explanation_vi?: string
  explanation_de?: string
  tags?: string[]
  hints?: ExerciseHint[]
}

export interface TransformationExercise {
  id: string
  type: 'transformation'
  scaffolding_level: number
  difficulty: number
  instruction_vi: string
  source_sentence: string
  target_form: string
  accepted_answers: string[]
  explanation_vi?: string
  explanation_de?: string
  tags?: string[]
  hints?: ExerciseHint[]
}

export interface ClozeExercise {
  id: string
  type: 'cloze'
  scaffolding_level: number
  difficulty: number
  instruction_vi: string
  text: string
  gaps: { id: number; answer: string }[]
  explanation_vi?: string
  explanation_de?: string
  tags?: string[]
  hints?: ExerciseHint[]
}

export type GrammarExercise =
  | MultipleChoiceExercise
  | GapFillBankExercise
  | GapFillTypeExercise
  | MatchingExercise
  | SentenceReorderExercise
  | ErrorSpottingExercise
  | TransformationExercise
  | ClozeExercise
