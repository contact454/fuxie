'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MascotImage } from '../shared/mascot-image'
import { motion } from 'framer-motion'
import { ArrowLeft, RotateCcw, ArrowRight } from 'lucide-react'
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

const getScoreColor = (score: number) => {
  if (score >= 90) return '#10B981'; // Emerald 500
  if (score >= 70) return '#F59E0B'; // Amber 500
  if (score >= 50) return '#F97316'; // Orange 500
  return '#EF4444'; // Red 500
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
            <ArrowLeft size={18} />
          </button>

          {/* Mascot/Icon */}
          <div style={{
            width: 80, height: 80, margin: '32px auto 20px',
            background: 'linear-gradient(135deg, #FF6B35, #FF8F5E)',
            borderRadius: 24, display: 'flex', alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(255, 107, 53, 0.3)',
          }}>
            <MascotImage pose="skill-sprechen" width={56} height={56} />
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
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`${styles.btnPrimary} ${styles.btnGreen}`}
            style={{ width: '100%', fontSize: 18, padding: '18px 24px' }}
            onClick={() => setPhase('practice')}
          >
            🎤 Bắt đầu luyện tập
          </motion.button>
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
          <ArrowLeft size={16} /> Quay lại
        </button>
      </div>
    )
  }

  // ═══ SUMMARY PHASE ═══
  const getResultMascot = (score: number) => {
    if (score >= 90) return 'core-happy-wave'
    if (score >= 70) return 'state-welcome'
    if (score >= 50) return 'learn-studying'
    return 'learn-wrong'
  }
  
  const getResultMessage = (score: number) => {
    if (score >= 90) return { main: 'Xuất sắc!', sub: 'Phát âm gần như hoàn hảo!' }
    if (score >= 70) return { main: 'Tốt lắm!', sub: 'Chỉ cần cải thiện một chút nữa.' }
    if (score >= 50) return { main: 'Khá ổn!', sub: 'Hãy luyện thêm để tiến bộ hơn.' }
    return { main: 'Cố gắng thêm!', sub: 'Nghe kỹ mẫu và nói chậm hơn nhé.' }
  }

  const resultInfo = getResultMessage(finalScore)

  return (
    <div className={styles.lessonPlayer}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ padding: '40px 0 0', textAlign: 'center' }}
      >
        {/* Mascot animation */}
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
          <MascotImage pose={getResultMascot(finalScore) as any} size="md" className="drop-shadow-md" />
        </div>
        <h2 style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '0 0 4px' }}>
          {resultInfo.main}
        </h2>
        <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 24px' }}>
          {resultInfo.sub}
        </p>

        {/* Score circle */}
        <div className={styles.scoreCircleContainer} style={{ width: 120, height: 120, margin: '0 auto 24px' }}>
          <svg width="120" height="120" viewBox="0 0 120 120" className={styles.scoreSvg}>
            <circle cx="60" cy="60" r="54" fill="none" strokeWidth="8" className={styles.scoreTrack} />
            <motion.circle 
              cx="60" cy="60" r="54" fill="none" strokeWidth="8" 
              strokeLinecap="round"
              stroke={getScoreColor(finalScore)}
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54}
              animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - finalScore / 100) }}
              transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
            />
          </svg>
          <div className={styles.scoreValue} style={{ color: getScoreColor(finalScore), fontSize: 32 }}>
            {finalScore}%
          </div>
        </div>

        {/* Stars */}
        <div style={{ fontSize: 32, letterSpacing: 8, marginBottom: 24 }}>
          {'⭐'.repeat(stars)}{'☆'.repeat(3 - stars)}
        </div>

        {/* XP earned */}
        <motion.div 
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '8px 16px', background: '#FFFBEB', borderRadius: 12,
            border: '1px solid #FDE68A', marginBottom: 32,
          }}
        >
          <span style={{ fontSize: 16 }}>✨</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>
            +{stars * 10} XP {isSaving ? '(đang lưu...)' : ''}
          </span>
        </motion.div>

        {/* Action buttons */}
        <div className={styles.btnRow}>
          <button
            className={styles.btnOutline}
            onClick={() => router.push('/speaking')}
          >
            <ArrowLeft size={16} /> Quay lại
          </button>
          <button
            className={`${styles.btnPrimary} ${styles.btnGreen}`}
            onClick={() => {
              setPhase('intro')
              setFinalScore(0)
              setStars(0)
            }}
          >
            <RotateCcw size={16} /> Luyện lại
          </button>
        </div>
      </motion.div>
    </div>
  )
}
