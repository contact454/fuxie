// ===== SPEAKING MODULE TYPES =====

export interface NachsprechenSentence {
  id: string
  textDe: string
  textVi: string
  ipa: string
  audioUrl: string
  expectedDurationSec: number
  pronunciationNotes?: string
  keywords?: string[]
}

export interface NachsprechenExercise {
  id: string
  type: 'nachsprechen'
  level: string
  topic: string
  sentences: NachsprechenSentence[]
  config: NachsprechenConfig
}

export interface NachsprechenConfig {
  maxRecordingSec: number
  minAccuracyToPass: number
  attemptsAllowed: number
  showIPA: boolean
  showTranslation: boolean
  autoPlayModel: boolean
}

export interface WordResult {
  word: string
  status: 'correct' | 'warning' | 'error' | 'missing'
  score: number
  tip?: string
}

export interface EvaluationResult {
  transcript: string
  accuracy: number
  durationSec: number
  words: WordResult[]
  overallTips: string[]
  suggestRetry: boolean
}

export interface SpeakingLessonData {
  id: string
  topicId: string
  level: string
  lessonType: string
  lessonNumber: number
  titleDe: string
  titleVi: string
  exerciseType: string
  exercisesJson: NachsprechenExercise
  configJson: NachsprechenConfig | null
  estimatedMin?: number
}

export interface SpeakingTopicData {
  id: string
  slug: string
  titleDe: string
  titleVi: string
  description: string | null
  cefrLevel: string
  sortOrder: number
  lessons: SpeakingLessonData[]
}

export type RecordingState = 'idle' | 'playing' | 'recording' | 'processing' | 'result'
