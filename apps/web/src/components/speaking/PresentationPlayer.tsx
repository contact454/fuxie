'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import AudioRecorder from './AudioRecorder'
import styles from './speaking.module.css'
import { GameplayFeedbackMoment } from '@/components/gamification/quest-visuals'

interface Props {
  lessonId: string
  lessonTitle: string
  scenario: string | null
  cefrLevel: string
  onComplete: (score: number) => void
  onClose: () => void
}

export default function PresentationPlayer({ lessonId, lessonTitle, scenario, cefrLevel, onComplete, onClose }: Props) {
  const t = useTranslations('Speaking')
  const [transcript, setTranscript] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [isGrading, setIsGrading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleTranscript = async (text: string) => {
    setTranscript(text)
    setIsGrading(true)
    setError('')

    try {
      const res = await fetch('/api/v1/grade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'speaking',
          cefrLevel,
          uiLanguage: 'vi',
          transcript: text,
          scenario: scenario || lessonTitle,
        })
      })
      const data = await res.json()
      if (data.success) {
        setResult(data.data)
      } else {
        setError(data.error || 'Lỗi chấm điểm')
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi hệ thống')
    } finally {
      setIsGrading(false)
    }
  }

  return (
    <div className={styles.lessonPlayer}>
      <div className={styles.progressBarWrap}>
        <div className={styles.progressBarInner}>
          <button className={styles.progressBarClose} onClick={onClose}>✕</button>
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill} style={{ width: result ? '100%' : '50%' }} />
          </div>
          <span className={styles.progressBarStep}>{t('presentationStep')}</span>
        </div>
      </div>

      <div style={{ padding: '24px 20px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>{lessonTitle}</h2>
        <div className={styles.pronunciationTip} style={{ marginBottom: 24, fontSize: 16 }}>
          {scenario || t('presentationDefaultScenario')}
        </div>

        {!result ? (
          <>
            <AudioRecorder 
              onTranscript={handleTranscript}
              onError={setError}
              language="de"
              buttonText={t('startRecordingBtn')}
            />

            {error && (
              <div style={{ color: 'red', marginTop: 16, textAlign: 'center' }}>
                {error}
              </div>
            )}

            {isGrading && (
              <div style={{ marginTop: 24, textAlign: 'center' }}>
                <GameplayFeedbackMoment
                  tone="focus"
                  title={t('gradingTitle')}
                  message={t('gradingMessage')}
                  meta={t('gradingMeta')}
                />
              </div>
            )}
            
            {transcript && !isGrading && (
              <div style={{ marginTop: 24, padding: 16, background: '#F3F4F6', borderRadius: 12 }}>
                <h4 style={{ fontWeight: 700, marginBottom: 8 }}>{t('transcriptHeader')}</h4>
                <p style={{ color: '#4B5563' }}>{transcript}</p>
              </div>
            )}
          </>
        ) : (
          <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 48, fontWeight: 900, color: result.percentScore >= 60 ? '#10B981' : '#F59E0B' }}>
                {result.percentScore}%
              </div>
              <div style={{ fontSize: 16, color: '#6B7280' }}>
                {t('scoreLabel', { score: result.totalScore, max: result.maxScore })}
              </div>
            </div>

            <GameplayFeedbackMoment
              tone={result.percentScore >= 60 ? 'success' : 'retry'}
              title={result.percentScore >= 60 ? t('excellent') : t('tryHarder')}
              message={result.overallFeedbackNative || result.overallFeedback}
              meta={`${t('evaluationLevel')}: ${result.estimatedLevel}`}
              className="mb-6"
            />

            <h3 style={{ fontWeight: 800, marginBottom: 12 }}>{t('criteriaDetail')}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
              {result.criteria.map((c: any) => (
                <div key={c.id} style={{ padding: 16, border: '1px solid #E5E7EB', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontWeight: 700 }}>{c.nameNative || c.name}</span>
                    <span style={{ fontWeight: 800, color: '#3B82F6' }}>{c.score}/{c.maxScore}</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#4B5563' }}>{c.reasoningNative || c.reasoning}</p>
                </div>
              ))}
            </div>

            <button
              className={`${styles.btnPrimary} ${styles.btnGreen}`}
              style={{ width: '100%' }}
              onClick={() => onComplete(result.percentScore)}
            >
              {t('completeBtn')} <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
