/**
 * Content read-normalize shim — spec `content-read-normalize-shim` (Option C of
 * `content-schema-naming-unify`, RB-P2-01).
 *
 * Normalizes a content record's known snake_case fields to a consistent
 * camelCase shape AT READ TIME. Content JSON on disk is NOT changed; seeders,
 * DB, and the audio pipeline are untouched. This lets consuming code read one
 * spelling without the blast-radius of renaming ~5,600 fields.
 *
 * Pure + non-mutating + idempotent + spelling-agnostic.
 */

/** Known snake_case content field -> canonical camelCase name. */
export const CONTENT_FIELD_MAP: Readonly<Record<string, string>> = Object.freeze({
  teil_name: 'teilName',
  task_type: 'taskType',
  target_grammar: 'targetGrammar',
  target_vocabulary: 'targetVocabulary',
  word_count: 'wordCount',
  audio_file: 'audioFile',
  topic_id: 'topicId',
  linked_text: 'linkedText',
  total_points: 'totalPoints',
  pass_threshold: 'passThreshold',
  key_evidence: 'keyEvidence',
  key_vocabulary: 'keyVocabulary',
  generated_at: 'generatedAt',
  regenerated_at: 'regeneratedAt',
  source_script: 'sourceScript',
})

/** Nested object fields that get a shallow (one-level) normalize pass. */
const NESTED_KEYS = ['metadata', 'scoring', 'explanation'] as const

export type NormalizedContentRecord = Record<string, unknown>

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

/**
 * Normalize one level of an object: rename known snake_case keys to camelCase.
 * camelCase wins when both spellings are present (camel assumed canonical).
 */
function normalizeLevel(raw: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(raw)) {
    const camel = CONTENT_FIELD_MAP[key]
    if (camel === undefined) {
      // Already-camel or unknown field: pass through unchanged.
      out[key] = value
    } else if (!(camel in raw)) {
      // Snake field, and the camel equivalent is NOT also present in raw.
      // Rename snake -> camel.
      out[camel] = value
    }
    // else: snake field but camel also present in raw -> drop snake, the camel
    // entry is copied through by its own iteration (camel wins).
  }
  return out
}

/**
 * Normalize a content record to camelCase for known fields. Non-mutating.
 * Applies a shallow normalize to nested metadata/scoring/explanation objects.
 */
export function normalizeContentRecord(raw: unknown): NormalizedContentRecord {
  if (!isPlainObject(raw)) return raw as NormalizedContentRecord
  const top = normalizeLevel(raw)
  for (const nk of NESTED_KEYS) {
    if (isPlainObject(top[nk])) {
      top[nk] = normalizeLevel(top[nk] as Record<string, unknown>)
    }
  }
  return top
}
