import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Loader2, Check, AlertCircle, X, HelpCircle, Volume2, ArrowRight, RotateCcw } from 'lucide-react'
import {
  FUXIE_3D_ASSETS,
  FuxieRoleMascot,
  GameplayFeedbackMoment,
  QuestCheckpointRail,
} from '@/components/gamification/quest-visuals'
import styles from './speaking.module.css'
import type { NachsprechenSentence, NachsprechenConfig, WordResult, EvaluationResult, RecordingState } from './types'
import { speakWithBrowserTTS, cancelBrowserTTS } from '@/lib/audio/browser-tts'
import { startWaveformAnimation } from '@/lib/audio/waveform'
import { trackClientAnalyticsEvent } from '@/lib/analytics/client-events'
import {
  getSpeakingQuestCheckpoint,
  type SpeakingQuestEpisode,
} from '@/lib/gamification/speaking-quest-episode'

interface Props {
  sentences: NachsprechenSentence[]
  config: NachsprechenConfig
  lessonTitle: string
  lessonId: string
  cefrLevel?: string
  topicSlug?: string
  questEpisode?: SpeakingQuestEpisode
  onComplete: (score: number) => void
  onClose: () => void
}

export default function NachsprechenPlayer({ sentences, config, lessonTitle, lessonId, cefrLevel, topicSlug, questEpisode, onComplete, onClose }: Props) {
  const t = useTranslations('Speaking')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [state, setState] = useState<RecordingState>('idle')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [recordingTime, setRecordingTime] = useState(0)
  const [micError, setMicError] = useState<string | null>(null)

  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(undefined)
  const audioContextRef = useRef<AudioContext | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const isMountedRef = useRef(true)
  const skipEvaluationRef = useRef(false)
  const evaluateAbortRef = useRef<AbortController | null>(null)
  const sentenceRef = useRef<NachsprechenSentence | null>(null)
  const recordingTimeRef = useRef(0)
  const trackedQuestCheckpointsRef = useRef<Set<string>>(new Set())

  const sentence = sentences[currentIdx]
  if (!sentence) return null
  const progress = ((currentIdx) / sentences.length) * 100
  const activeQuestCheckpoint = questEpisode
    ? getSpeakingQuestCheckpoint({ episode: questEpisode, currentIndex: currentIdx })
    : null
  const activeQuestCheckpointIndex = questEpisode && activeQuestCheckpoint
    ? questEpisode.checkpoints.findIndex((checkpoint) => checkpoint.id === activeQuestCheckpoint.id)
    : -1
  const completedQuestCheckpointIds = questEpisode
    ? questEpisode.checkpoints
        .slice(0, Math.max(0, activeQuestCheckpointIndex))
        .map((checkpoint) => checkpoint.id)
    : []

  sentenceRef.current = sentence
  recordingTimeRef.current = recordingTime

  useEffect(() => {
    if (!questEpisode || !activeQuestCheckpoint) return
    if (trackedQuestCheckpointsRef.current.has(activeQuestCheckpoint.id)) return
    trackedQuestCheckpointsRef.current.add(activeQuestCheckpoint.id)
    trackClientAnalyticsEvent({
      eventName: 'quest_episode_checkpoint_reached',
      source: 'speaking.quest_episode.checkpoint',
      actionId: questEpisode.episodeId,
      actionType: 'speaking_submission',
      level: cefrLevel ?? questEpisode.cefrLevel,
      skill: 'speaking',
      metadata: {
        episodeId: questEpisode.episodeId,
        skill: 'speaking',
        lessonId,
        topicSlug: topicSlug ?? questEpisode.topicSlug,
        cefrLevel: cefrLevel ?? questEpisode.cefrLevel,
        checkpointId: activeQuestCheckpoint.id,
        checkpointCount: questEpisode.checkpoints.length,
        sentenceCount: sentences.length,
        exerciseType: 'nachsprechen',
      },
    })
  }, [activeQuestCheckpoint, cefrLevel, lessonId, questEpisode, sentences.length, topicSlug])

  const disposeRecordingResources = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = undefined
    }

    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = undefined
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }

    analyserRef.current = null

    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') {
        await audioContextRef.current.close().catch(() => {})
      }
      audioContextRef.current = null
    }

    mediaRecorderRef.current = null
  }, [])


  // Auto-play model audio (with cleanup to prevent setState on unmounted component)
  useEffect(() => {
    if (config.autoPlayModel && state === 'idle' && audioRef.current) {
      autoPlayTimerRef.current = setTimeout(() => playModel(), 300)
    }
    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx])

  // Comprehensive cleanup on unmount — prevents mic leak, AudioContext leak, animation leak
  useEffect(() => {
    isMountedRef.current = true
    skipEvaluationRef.current = false
    return () => {
      isMountedRef.current = false
      skipEvaluationRef.current = true
      evaluateAbortRef.current?.abort()
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current)
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      } else {
        void disposeRecordingResources()
      }
    }
  }, [disposeRecordingResources])

  const playWithBrowserTTSLocal = useCallback((text: string) => {
    speakWithBrowserTTS(text, {
      onEnd: () => { if (isMountedRef.current) setState('idle') },
    })
  }, [])

  const playModel = useCallback(() => {
    setState('playing')

    // Try browser TTS if no audioUrl or audioUrl is empty
    const hasAudio = sentence.audioUrl && sentence.audioUrl.trim() !== ''

    if (hasAudio && audioRef.current) {
      audioRef.current.src = sentence.audioUrl
      audioRef.current.onerror = () => {
        // Fallback to browser TTS if audio file not found
        playWithBrowserTTSLocal(sentence.textDe)
      }
      audioRef.current.onended = () => setState('idle')
      audioRef.current.play().catch(() => {
        playWithBrowserTTSLocal(sentence.textDe)
      })
    } else {
      playWithBrowserTTSLocal(sentence.textDe)
    }
  }, [sentence.audioUrl, sentence.textDe, playWithBrowserTTSLocal])

  // Convert WebM blob to WAV via Web Worker (off-thread PCM conversion)
  const wavWorkerRef = useRef<Worker | null>(null)

  const convertToWav = useCallback(async (webmBlob: Blob): Promise<Blob> => {
    try {
      const arrayBuffer = await webmBlob.arrayBuffer()
      // Decode audio on main thread (requires AudioContext), but keep it brief
      const audioCtx = new AudioContext({ sampleRate: 16000 })
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      const channelData = audioBuffer.getChannelData(0)
      const sampleRate = audioBuffer.sampleRate
      await audioCtx.close()

      // Heavy PCM conversion happens in the worker
      if (!wavWorkerRef.current) {
        wavWorkerRef.current = new Worker(
          new URL('../../workers/audio-convert.worker.ts', import.meta.url),
        )
      }

      return await new Promise<Blob>((resolve, reject) => {
        const worker = wavWorkerRef.current!
        const timeout = setTimeout(() => reject(new Error('Worker timeout')), 10000)

        worker.onmessage = (e) => {
          clearTimeout(timeout)
          if (e.data.type === 'RESULT') {
            resolve(new Blob([e.data.wavBuffer], { type: 'audio/wav' }))
          } else {
            reject(new Error(e.data.message || 'Worker conversion failed'))
          }
        }
        worker.onerror = (err) => {
          clearTimeout(timeout)
          reject(err)
        }

        // Transfer the Float32Array buffer to avoid copy
        const samplesCopy = new Float32Array(channelData)
        worker.postMessage(
          { type: 'CONVERT', samples: samplesCopy, sampleRate },
          [samplesCopy.buffer],
        )
      })
    } catch (err) {
      console.warn('WAV conversion failed, sending original:', err)
      return webmBlob // fallback to original
    }
  }, [])

  const evaluateRecording = useCallback(async (blob: Blob) => {
    evaluateAbortRef.current?.abort()
    const controller = new AbortController()
    evaluateAbortRef.current = controller

    if (!isMountedRef.current) return

    setState('processing')
    try {
      const currentSentence = sentenceRef.current
      if (!currentSentence) return

      // Convert WebM to WAV for Gemini compatibility
      const wavBlob = await convertToWav(blob)

      const formData = new FormData()
      formData.append('audio', wavBlob, 'recording.wav')
      formData.append('referenceText', currentSentence.textDe)
      formData.append('level', cefrLevel ?? questEpisode?.cefrLevel ?? 'A1')
      formData.append('exerciseType', 'nachsprechen')

      const res = await fetch('/api/v1/speaking/evaluate', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })

      if (!res.ok) throw new Error('Evaluation failed')

      const evalResult: EvaluationResult = await res.json()
      if (!isMountedRef.current || controller.signal.aborted) return

      setResult(evalResult)
      setAttempts(prev => prev + 1)
      setScores(prev => [...prev, evalResult.accuracy])
      setState('result')
    } catch (err) {
      if (controller.signal.aborted || !isMountedRef.current) return

      console.error('Evaluation error:', err)
      const currentSentence = sentenceRef.current
      if (!currentSentence) return

      // Show error result instead of fake mock
      const errorResult: EvaluationResult = {
        transcript: '',
        accuracy: 0,
        durationSec: recordingTimeRef.current,
        words: currentSentence.textDe.split(' ').map(word => ({
          word,
          status: 'error' as const,
          score: 0,
        })),
        overallTips: ['⚠️ Không thể kết nối hệ thống AI. Vui lòng thử lại.'],
        suggestRetry: true,
      }
      setResult(errorResult)
      setAttempts(prev => prev + 1)
      setScores(prev => [...prev, 0])
      setState('result')
    }
  }, [convertToWav])

  const startRecording = async () => {
    try {
      setMicError(null)
      skipEvaluationRef.current = false

      // Check if getUserMedia is available
      if (!navigator.mediaDevices?.getUserMedia) {
        setMicError('Trình duyệt không hỗ trợ ghi âm. Vui lòng dùng Chrome hoặc Safari.')
        return
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream // Store ref for cleanup
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      })
      chunksRef.current = []

      // Waveform visualization
      // Re-use or create AudioContext (singleton pattern avoids hitting browser limit of ~6)
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new AudioContext()
      } else if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume()
      }
      const audioContext = audioContextRef.current
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      // Start waveform animation using shared utility
      if (canvasRef.current) {
        const stopAnimation = startWaveformAnimation(canvasRef.current, analyser, { style: 'gradient-stroke' })
        // Store cleanup in animFrameRef for disposeRecordingResources
        animFrameRef.current = requestAnimationFrame(() => {}) // placeholder — cleanup via stopAnimation
        // Override: we'll cancel via the returned cleanup
        const origDispose = disposeRecordingResources
        // Store stopAnimation for use during cleanup
        ;(analyserRef as any)._stopAnimation = stopAnimation
      }

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        await disposeRecordingResources()

        if (skipEvaluationRef.current || !isMountedRef.current) {
          skipEvaluationRef.current = false
          return
        }

        await evaluateRecording(blob)
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setState('recording')
      setRecordingTime(0)

      // Timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          if (prev >= config.maxRecordingSec) {
            stopRecording()
            return prev
          }
          return prev + 1
        })
      }, 1000)
    } catch (err: any) {
      console.error('Microphone access error:', err)
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setMicError('Bạn cần cho phép truy cập microphone. Nhấn vào biểu tượng 🔒 trên thanh địa chỉ để cấp quyền.')
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setMicError('Không tìm thấy microphone. Vui lòng kết nối microphone và thử lại.')
      } else if (err.name === 'NotReadableError') {
        setMicError('Microphone đang được sử dụng bởi ứng dụng khác. Vui lòng đóng ứng dụng đó và thử lại.')
      } else {
        setMicError('Không thể truy cập microphone. Vui lòng kiểm tra cài đặt trình duyệt.')
      }
      setState('idle')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = undefined
    }
    setState('processing')
  }

  // drawWaveform is now handled by startWaveformAnimation from @/lib/audio/waveform.ts

  const handleNext = () => {
    if (currentIdx < sentences.length - 1) {
      setCurrentIdx(prev => prev + 1)
      setState('idle')
      setResult(null)
      setAttempts(0)
    } else {
      // Lesson complete
      const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      onComplete(avgScore)
    }
  }

  const handleRetry = () => {
    setState('idle')
    setResult(null)
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return '#10B981'; // Emerald 500
    if (score >= 70) return '#F59E0B'; // Amber 500
    if (score >= 50) return '#F97316'; // Orange 500
    return '#EF4444'; // Red 500
  }

  const getChipStyle = (status: string) => {
    switch (status) {
      case 'correct': return styles.chipCorrect
      case 'warning': return styles.chipWarning
      case 'error': return styles.chipError
      case 'missing': return styles.chipMissing
      default: return styles.chipCorrect
    }
  }

  const getChipIcon = (status: string) => {
    switch (status) {
      case 'correct': return <Check size={14} />
      case 'warning': return <AlertCircle size={14} />
      case 'error': return <X size={14} />
      case 'missing': return <HelpCircle size={14} />
      default: return <Check size={14} />
    }
  }

  const getResultMessage = (score: number) => {
    if (score >= 90) return { main: 'Xuất sắc! 🎉', sub: 'Phát âm gần như hoàn hảo!' }
    if (score >= 70) return { main: 'Tốt lắm! 👍', sub: 'Chỉ cần cải thiện một chút nữa.' }
    if (score >= 50) return { main: 'Khá ổn 💪', sub: 'Hãy nghe lại và thử lại nhé.' }
    return { main: 'Cố gắng thêm 🦊', sub: 'Nghe kỹ mẫu và nói chậm hơn.' }
  }

  return (
    <div className={styles.lessonPlayer}>
      {/* Hidden audio element */}
      <audio ref={audioRef} preload="none" />

      {/* Progress Bar */}
      <div className={styles.progressBarWrap}>
        <div className={styles.progressBarInner}>
          <button className={styles.progressBarClose} onClick={onClose}>✕</button>
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill} style={{ width: `${progress}%` }} />
          </div>
          <span className={styles.progressBarStep}>{currentIdx + 1}/{sentences.length}</span>
        </div>
      </div>

      {questEpisode && activeQuestCheckpoint && (
        <QuestCheckpointRail
          checkpoints={questEpisode.checkpoints}
          activeId={activeQuestCheckpoint.id}
          completedIds={completedQuestCheckpointIds}
          label={t('challenge')}
          compact
          className="mt-3"
        />
      )}

      {/* Exercise Label */}
      <div style={{ padding: '8px 0 0' }}>
        <div className={styles.exerciseLabel}>{t('challenge')}</div>
        <div className={styles.exerciseInstruction}>{t('listenAndRepeat')}</div>
      </div>

      {/* Sentence Card */}
      <div className={styles.sentenceCard} key={sentence.id}>
        <button
          className={`${styles.speakerBtn} ${state === 'playing' ? styles.playing : ''}`}
          onClick={playModel}
          disabled={state === 'recording' || state === 'processing'}
        >
          <Volume2 size={24} />
        </button>
        <div className={styles.sentenceTextDe}>{sentence.textDe}</div>
        {config.showTranslation && (
          <div className={styles.sentenceTextVi}>{sentence.textNative}</div>
        )}
        {config.showIPA && (
          <div className={styles.sentenceIpa}>{sentence.ipa}</div>
        )}
      </div>

      {/* Pronunciation Note */}
      {sentence.pronunciationNotes && (
        <div className={styles.pronunciationTip}>{sentence.pronunciationNotes}</div>
      )}

      {/* Waveform */}
      <div className={styles.waveformContainer}>
        <AnimatePresence mode="wait">
          {state === 'recording' ? (
            <motion.div
              key="recording"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <canvas ref={canvasRef} className={styles.waveformCanvas} width={560} height={80} />
            </motion.div>
          ) : state === 'processing' ? (
            <motion.div
              key="processing"
              className={styles.waveformProcessing}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className={styles.spinnerIcon} />
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              >
                {t('analyzingDetail')}
              </motion.span>
            </motion.div>
          ) : (
            <motion.span
              key="idle"
              className={styles.waveformPlaceholder}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Mic size={18} style={{ marginRight: 8 }} /> {t('pressMicToStart')}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Record Button */}
      <div className={styles.recordBtnWrap}>
        {state === 'recording' ? (
          <>
            <motion.button 
              whileTap={{ scale: 0.9 }}
              className={`${styles.recordBtn} ${styles.recordBtnRecording}`} 
              onClick={stopRecording}
            >
              <Square fill="currentColor" size={24} />
            </motion.button>
            <span className={styles.recordTimer}>{recordingTime}s / {config.maxRecordingSec}s</span>
          </>
        ) : state === 'processing' ? (
          <>
            <button className={`${styles.recordBtn} ${styles.recordBtnDisabled}`} disabled>
              <Loader2 className={styles.spinnerIcon} size={28} />
            </button>
            <span className={styles.recordHint}>{t('analyzing')}</span>
          </>
        ) : state !== 'result' ? (
          <>
            {micError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: '#FEE2E2',
                  border: '1px solid #FECACA',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.9rem',
                  color: "var(--color-text-danger)",
                  width: '100%',
                  maxWidth: '400px',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{micError}</span>
                <button 
                  onClick={() => setMicError(null)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: "var(--color-text-danger)", padding: '2px' }}
                >
                  <X size={16} />
                </button>
              </motion.div>
            )}
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${styles.recordBtn} ${styles.recordBtnIdle}`} 
              onClick={startRecording}
            >
              <Mic size={28} />
            </motion.button>
            <span className={styles.recordHint}>{t('clickToRecordShort')}</span>
          </>
        ) : null}
      </div>

      {/* Result Panel */}
      {state === 'result' && result && (
        <motion.div 
          className={styles.resultPanel}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        >
          <div className={styles.resultHeader}>
            <div className={styles.mascotAndScore}>
              <FuxieRoleMascot
                src={result.accuracy >= 90 ? FUXIE_3D_ASSETS.celebration : FUXIE_3D_ASSETS.speakingCoach}
                alt={t('altSpeakingCoach')}
                size={56}
                motion={result.accuracy >= 70 ? 'reward' : 'speak'}
              />
              <div className={styles.scoreCircleContainer}>
                <svg width="72" height="72" viewBox="0 0 72 72" className={styles.scoreSvg}>
                  <circle cx="36" cy="36" r="32" fill="none" strokeWidth="6" className={styles.scoreTrack} />
                  <motion.circle 
                    cx="36" cy="36" r="32" fill="none" strokeWidth="6" 
                    strokeLinecap="round"
                    stroke={getScoreColor(result.accuracy)}
                    strokeDasharray={2 * Math.PI * 32}
                    strokeDashoffset={2 * Math.PI * 32}
                    animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - result.accuracy / 100) }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                  />
                </svg>
                <div className={styles.scoreValue} style={{ color: getScoreColor(result.accuracy) }}>
                  {result.accuracy}%
                </div>
              </div>
            </div>
            <div className={styles.resultTextCol}>
              <div className={styles.resultMessage}>{getResultMessage(result.accuracy).main}</div>
              <div className={styles.resultSubMessage}>{getResultMessage(result.accuracy).sub}</div>
            </div>
          </div>

          {/* Word Chips */}
          <GameplayFeedbackMoment
            tone={result.accuracy >= config.minAccuracyToPass ? 'success' : 'retry'}
            title={result.accuracy >= config.minAccuracyToPass ? 'Refine signal: cau nay da qua' : 'Refine signal: nghe lai roi thu them'}
            message={result.accuracy >= config.minAccuracyToPass
              ? 'Diem phat am du tot de di tiep. Em van co the nghe tung tu de lam min hon.'
              : 'Fuxie da chi ra tu can sua. Thu cham hon mot nhip truoc khi sang cau tiep.'}
            meta={`${activeQuestCheckpoint?.title ?? 'Refine'} - ${result.accuracy}%`}
            className="mb-4"
          />

          {/* Word Chips */}
          <div className={styles.wordChips}>
            {result.words.map((w, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.wordChip} ${getChipStyle(w.status)}`}
                style={{ animationDelay: `${i * 0.05}s` }}
                title={w.tip || t('clickToHearPronunciation')}
                onClick={() => playWithBrowserTTSLocal(w.word)}
              >
                {w.word}
                <span className={styles.chipIcon}>{getChipIcon(w.status)}</span>
              </button>
            ))}
          </div>

          {/* Tips */}
          {result.overallTips.length > 0 && (
            <div className={styles.tipsSection}>
              {result.overallTips.map((tip, i) => (
                <div key={i} className={styles.tipItem}>{tip}</div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Footer */}
      {state === 'result' && (
        <div className={styles.stepFooter}>
          <div className={styles.btnRow}>
            {attempts < config.attemptsAllowed && result && result.accuracy < config.minAccuracyToPass && (
              <button className={styles.btnOutline} onClick={handleRetry}>
                <RotateCcw size={16} /> {t('retryBtn')}
              </button>
            )}
            <button
              className={`${styles.btnPrimary} ${styles.btnGreen}`}
              onClick={handleNext}
            >
              {currentIdx < sentences.length - 1 ? (
                <>{t('nextBtn')} <ArrowRight size={16} /></>
              ) : (
                <>{t('completeBtn')} <Check size={16} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
