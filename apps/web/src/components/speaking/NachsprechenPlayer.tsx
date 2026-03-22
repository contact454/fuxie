import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Loader2, Check, AlertCircle, X, HelpCircle, Volume2, ArrowRight, RotateCcw } from 'lucide-react'
import { MascotImage } from '../shared/mascot-image'
import styles from './speaking.module.css'
import type { NachsprechenSentence, NachsprechenConfig, WordResult, EvaluationResult, RecordingState } from './types'

interface Props {
  sentences: NachsprechenSentence[]
  config: NachsprechenConfig
  lessonTitle: string
  lessonId: string
  onComplete: (score: number) => void
  onClose: () => void
}

export default function NachsprechenPlayer({ sentences, config, lessonTitle, lessonId, onComplete, onClose }: Props) {
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

  const sentence = sentences[currentIdx]
  if (!sentence) return null
  const progress = ((currentIdx) / sentences.length) * 100

  sentenceRef.current = sentence
  recordingTimeRef.current = recordingTime

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

  const playModel = useCallback(() => {
    setState('playing')

    // Try browser TTS if no audioUrl or audioUrl is empty
    const hasAudio = sentence.audioUrl && sentence.audioUrl.trim() !== ''

    if (hasAudio && audioRef.current) {
      audioRef.current.src = sentence.audioUrl
      audioRef.current.onerror = () => {
        // Fallback to browser TTS if audio file not found
        playWithBrowserTTS(sentence.textDe)
      }
      audioRef.current.onended = () => setState('idle')
      audioRef.current.play().catch(() => {
        playWithBrowserTTS(sentence.textDe)
      })
    } else {
      playWithBrowserTTS(sentence.textDe)
    }
  }, [sentence.audioUrl, sentence.textDe])

  const playWithBrowserTTS = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      setState('idle')
      return
    }
    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'de-DE'
    utterance.rate = 0.85 // Slightly slow for learners, but natural
    utterance.pitch = 1.0

    // Prioritize high-quality Google Neural/Premium voices
    const voices = window.speechSynthesis.getVoices()
    const deVoices = voices.filter(v => v.lang.startsWith('de'))
    
    // Prefer: Google Deutsch > any Google voice > any de-DE voice > any de voice
    const preferred = deVoices.find(v => v.name.includes('Google Deutsch'))
      || deVoices.find(v => v.name.includes('Google'))
      || deVoices.find(v => v.lang === 'de-DE')
      || deVoices[0]
    if (preferred) utterance.voice = preferred

    utterance.onend = () => setState('idle')
    utterance.onerror = () => setState('idle')

    window.speechSynthesis.speak(utterance)
  }, [])

  // Convert WebM blob to WAV (Gemini doesn't support WebM audio)
  const convertToWav = useCallback(async (webmBlob: Blob): Promise<Blob> => {
    try {
      const arrayBuffer = await webmBlob.arrayBuffer()
      const audioCtx = new AudioContext({ sampleRate: 16000 })
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
      
      // Convert to mono 16-bit PCM WAV
      const numChannels = 1
      const sampleRate = audioBuffer.sampleRate
      const channelData = audioBuffer.getChannelData(0)
      const numSamples = channelData.length
      const wavBuffer = new ArrayBuffer(44 + numSamples * 2)
      const view = new DataView(wavBuffer)
      
      // WAV header
      const writeString = (offset: number, str: string) => {
        for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
      }
      writeString(0, 'RIFF')
      view.setUint32(4, 36 + numSamples * 2, true)
      writeString(8, 'WAVE')
      writeString(12, 'fmt ')
      view.setUint32(16, 16, true)
      view.setUint16(20, 1, true) // PCM
      view.setUint16(22, numChannels, true)
      view.setUint32(24, sampleRate, true)
      view.setUint32(28, sampleRate * numChannels * 2, true)
      view.setUint16(32, numChannels * 2, true)
      view.setUint16(34, 16, true)
      writeString(36, 'data')
      view.setUint32(40, numSamples * 2, true)
      
      // PCM samples
      for (let i = 0; i < numSamples; i++) {
        const s = Math.max(-1, Math.min(1, channelData[i]!))
        view.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true)
      }
      
      audioCtx.close()
      return new Blob([wavBuffer], { type: 'audio/wav' })
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
      console.log(`Audio: ${blob.size}b webm → ${wavBlob.size}b wav`)

      const formData = new FormData()
      formData.append('audio', wavBlob, 'recording.wav')
      formData.append('referenceText', currentSentence.textDe)
      formData.append('level', 'A1')
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
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext // Store ref for cleanup
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

      // Clear with slight opacity for a tracing effect (optional) or fully clear
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      const barWidth = (canvas.width / bufferLength) * 2.5
      let x = 0
      
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
      gradient.addColorStop(0, '#3B82F6')
      gradient.addColorStop(0.5, '#6366f1')
      gradient.addColorStop(1, '#8B5CF6')
      
      ctx.strokeStyle = gradient
      ctx.lineCap = 'round'
      ctx.lineWidth = Math.max(2, barWidth - 2)

      for (let i = 0; i < bufferLength; i++) {
        // Boost low signals slightly for visual flair
        const v = dataArray[i]! / 255.0
        const barHeight = Math.max(4, v * v * canvas.height * 0.9)
        const y = (canvas.height - barHeight) / 2
        
        ctx.beginPath()
        ctx.moveTo(x + barWidth / 2, y)
        ctx.lineTo(x + barWidth / 2, y + barHeight)
        ctx.stroke()
        x += barWidth
      }
    }

    draw()
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

  const getMascotPose = (score: number) => {
    if (score >= 90) return 'core-celebrate'
    if (score >= 70) return 'learn-encouragement'
    if (score >= 50) return 'learn-studying'
    return 'learn-wrong'
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
          <Volume2 size={24} />
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
                AI đang phân tích giọng đọc của bạn...
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
              <Mic size={18} style={{ marginRight: 8 }} /> Nhấn nút mic để bắt đầu
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
            <span className={styles.recordHint}>Đang phân tích...</span>
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
                  color: '#991B1B',
                  width: '100%',
                  maxWidth: '400px',
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span style={{ flex: 1 }}>{micError}</span>
                <button 
                  onClick={() => setMicError(null)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#991B1B', padding: '2px' }}
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
            <span className={styles.recordHint}>Nhấn để thu âm</span>
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
              <MascotImage pose={getMascotPose(result.accuracy)} size="sm" />
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
          <div className={styles.wordChips}>
            {result.words.map((w, i) => (
              <button
                key={i}
                type="button"
                className={`${styles.wordChip} ${getChipStyle(w.status)}`}
                style={{ animationDelay: `${i * 0.05}s` }}
                title={w.tip || 'Nhấn để nghe phát âm'}
                onClick={() => playWithBrowserTTS(w.word)}
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
                <RotateCcw size={16} /> Thử lại
              </button>
            )}
            <button
              className={`${styles.btnPrimary} ${styles.btnGreen}`}
              onClick={handleNext}
            >
              {currentIdx < sentences.length - 1 ? (
                <>Tiếp theo <ArrowRight size={16} /></>
              ) : (
                <>Hoàn thành <Check size={16} /></>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
