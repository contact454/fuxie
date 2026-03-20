'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NachsprechenPlayer from './NachsprechenPlayer'
import styles from './speaking.module.css'
import type { NachsprechenSentence, NachsprechenConfig } from './types'

interface Props {
  lessonId: string
  titleDe: string
  titleVi: string
  topicTitleVi: string
  topicSlug: string
  cefrLevel: string
  exerciseType: string
  exercisesJson: { sentences: NachsprechenSentence[] }
  configJson: NachsprechenConfig | null
  estimatedMin: number
}

type Phase = 'intro' | 'practice' | 'summary'

const DEFAULT_CONFIG: NachsprechenConfig = {
  maxRecordingSec: 10,
  minAccuracyToPass: 60,
  attemptsAllowed: 3,
  showIPA: true,
  showTranslation: true,
  autoPlayModel: true,
}

function getStarsFromScore(score: number): number {
  if (score >= 90) return 3
  if (score >= 70) return 2
  if (score >= 50) return 1
  return 0
}

export default function SpeakingLessonPlayer({
  lessonId,
  titleDe,
  titleVi,
  topicTitleVi,
  topicSlug,
  cefrLevel,
  exerciseType,
  exercisesJson,
  configJson,
  estimatedMin,
}: Props) {
  const router = useRouter()
  const [phase, setPhase] = useState<Phase>('intro')
  const [finalScore, setFinalScore] = useState(0)
  const [stars, setStars] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const config = configJson || DEFAULT_CONFIG
  const sentences = exercisesJson?.sentences || []

  const handleComplete = useCallback(async (score: number) => {
    const earned = getStarsFromScore(score)
    setFinalScore(score)
    setStars(earned)
    setPhase('summary')

    // Save progress
    setIsSaving(true)
    try {
      await fetch('/api/v1/speaking/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lessonId,
          score,
          maxScore: 100,
          stars: earned,
        }),
      })
    } catch (err) {
      console.warn('Failed to save progress:', err)
    } finally {
      setIsSaving(false)
    }
  }, [lessonId])

  // ═══ INTRO PHASE ═══
  if (phase === 'intro') {
    return (
      <div className={styles.lessonPlayer}>
        <div style={{ padding: '24px 0 0', textAlign: 'center' }}>
          {/* Back button */}
          <button
            onClick={() => router.push('/speaking')}
            className={styles.progressBarClose}
            style={{ position: 'absolute', left: 20, top: 20 }}
          >
            ←
          </button>

          {/* Mascot/Icon */}
          <div style={{
            width: 80, height: 80, margin: '32px auto 20px',
            background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
            borderRadius: 24, display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: 36,
            boxShadow: '0 8px 24px rgba(255, 107, 53, 0.3)',
          }}>
            🎤
          </div>

          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#111827', margin: '0 0 6px' }}>
            {titleVi}
          </h1>
          <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 4px' }}>
            {titleDe}
          </p>
          <p style={{ fontSize: 13, color: '#9CA3AF', margin: '0 0 24px' }}>
            {topicTitleVi} · {cefrLevel}
          </p>

          {/* Info cards */}
          <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
            <div className={styles.statItem} style={{ flex: 1 }}>
              <span className={styles.statValue}>{sentences.length}</span>
              <span className={styles.statLabel}>Câu</span>
            </div>
            <div className={styles.statItem} style={{ flex: 1 }}>
              <span className={styles.statValue}>~{estimatedMin}</span>
              <span className={styles.statLabel}>Phút</span>
            </div>
            <div className={styles.statItem} style={{ flex: 1 }}>
              <span className={styles.statValue}>3⭐</span>
              <span className={styles.statLabel}>Mục tiêu</span>
            </div>
          </div>

          {/* Exercise type info */}
          <div className={styles.pronunciationTip} style={{ textAlign: 'left' }}>
            {exerciseType === 'nachsprechen' && (
              <>
                <strong>Nachsprechen:</strong> Nghe mẫu → nhấn mic → lặp lại câu. Cố gắng phát âm giống mẫu nhất có thể!
              </>
            )}
          </div>

          {/* Start button */}
          <button
            className={`${styles.btnPrimary} ${styles.btnGreen}`}
            style={{ width: '100%', fontSize: 18, padding: '18px 24px' }}
            onClick={() => setPhase('practice')}
          >
            🎤 Bắt đầu luyện tập
          </button>
        </div>
      </div>
    )
  }

  // ═══ PRACTICE PHASE ═══
  if (phase === 'practice') {
    if (exerciseType === 'nachsprechen' && sentences.length > 0) {
      return (
        <NachsprechenPlayer
          sentences={sentences}
          config={config}
          lessonTitle={titleVi}
          lessonId={lessonId}
          onComplete={handleComplete}
          onClose={() => router.push('/speaking')}
        />
      )
    }

    // Fallback for unknown exercise type
    return (
      <div className={styles.lessonPlayer} style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🚧</div>
        <p style={{ color: '#6B7280' }}>Dạng bài <strong>{exerciseType}</strong> đang được phát triển...</p>
        <button className={styles.btnOutline} onClick={() => router.push('/speaking')} style={{ marginTop: 20 }}>
          ← Quay lại
        </button>
      </div>
    )
  }

  // ═══ SUMMARY PHASE ═══
  const resultMessage = finalScore >= 90
    ? { emoji: '🎉', main: 'Xuất sắc!', sub: 'Phát âm gần như hoàn hảo!' }
    : finalScore >= 70
    ? { emoji: '👍', main: 'Tốt lắm!', sub: 'Chỉ cần cải thiện một chút nữa.' }
    : finalScore >= 50
    ? { emoji: '💪', main: 'Khá ổn!', sub: 'Hãy luyện thêm để tiến bộ hơn.' }
    : { emoji: '🦊', main: 'Cố gắng thêm!', sub: 'Nghe kỹ mẫu và nói chậm hơn nhé.' }

  return (
    <div className={styles.lessonPlayer}>
      <div style={{ padding: '40px 0 0', textAlign: 'center' }}>
        {/* Stars animation */}
        <div style={{ fontSize: 48, marginBottom: 8 }}>{resultMessage.emoji}</div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
          {resultMessage.main}
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
          {resultMessage.sub}
        </p>

        {/* Score circle */}
        <div className={`${styles.scoreCircle} ${
          finalScore >= 80 ? styles.scoreHigh : finalScore >= 50 ? styles.scoreMedium : styles.scoreLow
        }`} style={{
          width: 96, height: 96, fontSize: 28, margin: '0 auto 20px',
        }}>
          {finalScore}%
        </div>

        {/* Stars */}
        <div style={{ fontSize: 32, letterSpacing: 8, marginBottom: 24 }}>
          {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
        </div>

        {/* XP earned */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', background: '#FFFBEB', borderRadius: 12,
          border: '1px solid #FDE68A', marginBottom: 32,
        }}>
          <span style={{ fontSize: 16 }}>✨</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>
            +{stars * 10} XP {isSaving ? '(đang lưu...)' : ''}
          </span>
        </div>

        {/* Action buttons */}
        <div className={styles.btnRow}>
          <button
            className={styles.btnOutline}
            onClick={() => router.push('/speaking')}
          >
            ← Quay lại
          </button>
          <button
            className={`${styles.btnPrimary} ${styles.btnGreen}`}
            onClick={() => {
              setPhase('intro')
              setFinalScore(0)
              setStars(0)
            }}
          >
            🔄 Luyện lại
          </button>
        </div>
      </div>
    </div>
  )
}
