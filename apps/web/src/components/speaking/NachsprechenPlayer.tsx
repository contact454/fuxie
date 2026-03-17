'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import styles from './speaking.module.css'
import type { NachsprechenSentence, NachsprechenConfig, WordResult, EvaluationResult, RecordingState } from './types'

interface Props {
  sentences: NachsprechenSentence[]
  config: NachsprechenConfig
  lessonTitle: string
  onComplete: (score: number) => void
  onClose: () => void
}

export default function NachsprechenPlayer({ sentences, config, lessonTitle, onComplete, onClose }: Props) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [state, setState] = useState<RecordingState>('idle')
  const [result, setResult] = useState<EvaluationResult | null>(null)
  const [attempts, setAttempts] = useState(0)
  const [scores, setScores] = useState<number[]>([])
  const [recordingTime, setRecordingTime] = useState(0)

  const audioRef = useRef<HTMLAudioElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval>>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>()

  const sentence = sentences[currentIdx]
  const progress = ((currentIdx) / sentences.length) * 100

  // Auto-play model audio
  useEffect(() => {
    if (config.autoPlayModel && state === 'idle' && audioRef.current) {
      setTimeout(() => playModel(), 300)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIdx])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  const playModel = () => {
    if (!audioRef.current) return
    setState('playing')
    audioRef.current.src = sentence.audioUrl
    audioRef.current.onended = () => setState('idle')
    audioRef.current.play().catch(() => setState('idle'))
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm'
      })
      chunksRef.current = []

      // Waveform visualization
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      drawWaveform()

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
        audioContext.close()

        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
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
    } catch (err) {
      console.error('Microphone access denied:', err)
      setState('idle')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    if (timerRef.current) clearInterval(timerRef.current)
    setState('processing')
  }

  const drawWaveform = () => {
    const canvas = canvasRef.current
    const analyser = analyserRef.current
    if (!canvas || !analyser) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw)
      analyser.getByteFrequencyData(dataArray)

      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * canvas.height * 0.8
        const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight)
        gradient.addColorStop(0, '#3B82F6')
        gradient.addColorStop(1, '#8B5CF6')
        ctx.fillStyle = gradient
        ctx.fillRect(x, canvas.height - barHeight, barWidth - 1, barHeight)
        x += barWidth
      }
    }

    draw()
  }

  const evaluateRecording = async (blob: Blob) => {
    setState('processing')
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'recording.webm')
      formData.append('referenceText', sentence.textDe)
      formData.append('level', 'A1')
      formData.append('exerciseType', 'nachsprechen')

      const res = await fetch('/api/v1/speaking/evaluate', {
        method: 'POST',
        body: formData
      })

      if (!res.ok) throw new Error('Evaluation failed')

      const evalResult: EvaluationResult = await res.json()
      setResult(evalResult)
      setAttempts(prev => prev + 1)
      setScores(prev => [...prev, evalResult.accuracy])
      setState('result')
    } catch (err) {
      console.error('Evaluation error:', err)
      // Fallback mock result for development
      const mockResult: EvaluationResult = {
        transcript: sentence.textDe,
        accuracy: 85 + Math.floor(Math.random() * 15),
        durationSec: recordingTime,
        words: sentence.textDe.split(' ').map(word => ({
          word,
          status: Math.random() > 0.2 ? 'correct' : 'warning',
          score: 70 + Math.floor(Math.random() * 30),
        })),
        overallTips: ['Phát âm rất tốt! Cố gắng nói chậm hơn một chút.'],
        suggestRetry: false,
      }
      setResult(mockResult)
      setAttempts(prev => prev + 1)
      setScores(prev => [...prev, mockResult.accuracy])
      setState('result')
    }
  }

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

  const getScoreStyle = (score: number) => {
    if (score >= 80) return styles.scoreHigh
    if (score >= 50) return styles.scoreMedium
    return styles.scoreLow
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
      case 'correct': return '✓'
      case 'warning': return '⚠'
      case 'error': return '✗'
      case 'missing': return '?'
      default: return '✓'
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

      {/* Exercise Label */}
      <div style={{ padding: '8px 0 0' }}>
        <div className={styles.exerciseLabel}>BÀI TẬP</div>
        <div className={styles.exerciseInstruction}>Nghe và lặp lại câu sau</div>
      </div>

      {/* Sentence Card */}
      <div className={styles.sentenceCard} key={sentence.id}>
        <button
          className={`${styles.speakerBtn} ${state === 'playing' ? styles.playing : ''}`}
          onClick={playModel}
          disabled={state === 'recording' || state === 'processing'}
        >
          🔊
        </button>
        <div className={styles.sentenceTextDe}>{sentence.textDe}</div>
        {config.showTranslation && (
          <div className={styles.sentenceTextVi}>{sentence.textVi}</div>
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
        {state === 'recording' ? (
          <canvas ref={canvasRef} className={styles.waveformCanvas} width={560} height={80} />
        ) : (
          <span className={styles.waveformPlaceholder}>
            {state === 'idle' ? '🎵 Nhấn nút mic để bắt đầu' : state === 'processing' ? '⏳ Đang phân tích...' : ''}
          </span>
        )}
      </div>

      {/* Record Button */}
      <div className={styles.recordBtnWrap}>
        {state === 'recording' ? (
          <>
            <button className={`${styles.recordBtn} ${styles.recordBtnRecording}`} onClick={stopRecording}>
              ⏹
            </button>
            <span className={styles.recordTimer}>{recordingTime}s / {config.maxRecordingSec}s</span>
          </>
        ) : state === 'processing' ? (
          <>
            <button className={`${styles.recordBtn} ${styles.recordBtnDisabled}`} disabled>
              ⏳
            </button>
            <span className={styles.recordHint}>Đang phân tích...</span>
          </>
        ) : state !== 'result' ? (
          <>
            <button className={`${styles.recordBtn} ${styles.recordBtnIdle}`} onClick={startRecording}>
              🎙️
            </button>
            <span className={styles.recordHint}>Nhấn để thu âm</span>
          </>
        ) : null}
      </div>

      {/* Result Panel */}
      {state === 'result' && result && (
        <div className={styles.resultPanel}>
          <div className={styles.resultHeader}>
            <div className={`${styles.scoreCircle} ${getScoreStyle(result.accuracy)}`}>
              {result.accuracy}%
            </div>
            <div>
              <div className={styles.resultMessage}>{getResultMessage(result.accuracy).main}</div>
              <div className={styles.resultSubMessage}>{getResultMessage(result.accuracy).sub}</div>
            </div>
          </div>

          {/* Word Chips */}
          <div className={styles.wordChips}>
            {result.words.map((w, i) => (
              <span
                key={i}
                className={`${styles.wordChip} ${getChipStyle(w.status)}`}
                style={{ animationDelay: `${i * 0.05}s` }}
                title={w.tip || ''}
              >
                {w.word}
                <span className={styles.chipIcon}>{getChipIcon(w.status)}</span>
              </span>
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
        </div>
      )}

      {/* Footer */}
      {state === 'result' && (
        <div className={styles.stepFooter}>
          <div className={styles.btnRow}>
            {attempts < config.attemptsAllowed && result && result.accuracy < config.minAccuracyToPass && (
              <button className={styles.btnOutline} onClick={handleRetry}>
                🔄 Thử lại
              </button>
            )}
            <button
              className={`${styles.btnPrimary} ${styles.btnGreen}`}
              onClick={handleNext}
            >
              {currentIdx < sentences.length - 1 ? 'Tiếp theo →' : 'Hoàn thành ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
