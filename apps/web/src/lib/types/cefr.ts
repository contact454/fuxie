/**
 * Shared CEFR Level type — single source of truth for the entire app.
 * Used consistently across all skill modules (vocabulary, grammar, listening, reading, writing, speaking).
 */
export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'

export const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
