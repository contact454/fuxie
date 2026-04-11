'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Loader2, Send } from 'lucide-react'
import styles from './speaking.module.css'
import { MascotImage } from '../shared/mascot-image'

interface Message {
  role: 'user' | 'model'
  text: string
  audioUrl?: string
  score?: number
  words?: Array<{ word: string; accuracyScore: number; errorType: string }>
}

interface Props {
  level: string
  scenario: string
  onClose: () => void
  onComplete: (score: number) => void
}

export default function TurnBasedSpeakingPlayer({ level, scenario, onClose, onComplete }: Props) {
  const [messages, setMessages] = useState<Message[]>([])
  const [state, setState] = useState<'idle' | 'recording' | 'processing' | 'playing'>('idle')
  const [micError, setMicError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const aiAudioRef = useRef<HTMLAudioElement>(null)

  // Auto-start scenario
  useEffect(() => {
    initConversation()
  }, [])

  const initConversation = async () => {
    setState('processing')
    try {
      const formData = new FormData()
      formData.append('level', level)
      formData.append('scenario', scenario)
      formData.append('text', 'Hallo, lass uns anfangen!') // Trigger phrase
      formData.append('history', '[]')
      
      const res = await fetch('/api/v1/speaking/conversation', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      
      addAiMessage(data.aiResponseText, data.aiResponseAudioBase64)
    } catch (e) {
      console.error(e)
    } finally {
      setState('idle')
    }
  }

  const addAiMessage = (text: string, audioBase64: string) => {
    setMessages(prev => [...prev, { role: 'model', text }])
    
    if (audioBase64) {
      const audioUrl = `data:audio/wav;base64,${audioBase64}`
      if (aiAudioRef.current) {
        aiAudioRef.current.src = audioUrl
        aiAudioRef.current.play()
        setState('playing')
        aiAudioRef.current.onended = () => setState('idle')
      }
    } else {
      // Browser fallback
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'de-DE'
        setState('playing')
        utterance.onend = () => setState('idle')
        window.speechSynthesis.speak(utterance)
      }
    }
  }

  const disposeRecordingResources = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    analyserRef.current = null
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {})
    }
    audioContextRef.current = null
  }, [])

  const startRecording = async () => {
    setMicError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      // Visuals
      const audioContext = new AudioContext()
      audioContextRef.current = audioContext
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      drawWaveform()

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => processAudio(new Blob(chunksRef.current, { type: 'audio/webm' }))
      
      mediaRecorderRef.current = recorder
      recorder.start()
      setState('recording')
    } catch (err) {
      setMicError('Không thể truy cập Microphone.')
      setState('idle')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setState('processing')
  }

  const processAudio = async (blob: Blob) => {
    disposeRecordingResources()
    try {
      const formData = new FormData()
      formData.append('audio', blob, 'user_voice.webm')
      formData.append('level', level)
      formData.append('scenario', scenario)
      formData.append('history', JSON.stringify(messages))

      const res = await fetch('/api/v1/speaking/conversation', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (data.transcript) {
        setMessages(prev => [...prev, { role: 'user', text: data.transcript, score: data.accuracy, words: data.words }])
        addAiMessage(data.aiResponseText, data.aiResponseAudioBase64)
      } else {
        setMicError(data.error || 'Lỗi nhận diện giọng nói')
        setState('idle')
      }
    } catch (err) {
      console.error(err)
      setState('idle')
    }
  }

  const drawWaveform = () => {
      const canvas = canvasRef.current;
      const analyser = analyserRef.current;
      if (!canvas || !analyser) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      const draw = () => {
          animFrameRef.current = requestAnimationFrame(draw);
          analyser.getByteFrequencyData(dataArray);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const barWidth = (canvas.width / dataArray.length) * 2.5;
          let x = 0;
          ctx.fillStyle = '#10B981';
          for (let i = 0; i < dataArray.length; i++) {
              const barHeight = Math.max(2, ((dataArray[i] || 0) / 255.0) * canvas.height * 0.8);
              ctx.fillRect(x, (canvas.height - barHeight) / 2, barWidth - 1, barHeight);
              x += barWidth;
          }
      };
      draw();
  };

  const finishConversation = () => {
    // Calculate average score
    const userMessages = messages.filter(m => m.role === 'user' && typeof m.score === 'number');
    if (userMessages.length === 0) {
        onComplete(0);
        return;
    }
    const sum = userMessages.reduce((acc, m) => acc + (m.score || 0), 0);
    const avg = Math.round(sum / userMessages.length);
    onComplete(avg);
  };

  return (
    <div className={styles.lessonPlayer} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px'}}>
      <audio ref={aiAudioRef} style={{display: 'none'}} />
      
      <div className={styles.progressBarWrap} style={{flexShrink: 0}}>
        <div className={styles.progressBarInner}>
          <button className={styles.progressBarClose} onClick={onClose}>✕</button>
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill} style={{ width: `100%` }} />
          </div>
          <span className={styles.progressBarStep}>Roleplay: {scenario}</span>
          <button 
            onClick={finishConversation}
            style={{marginLeft: 'auto', background: '#3b82f6', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600}}
          >
            Kết thúc
          </button>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map((m, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            style={{ 
              alignSelf: m.role === 'model' ? 'flex-start' : 'flex-end',
              background: m.role === 'model' ? '#1e293b' : '#3b82f6',
              color: 'white',
              padding: '12px 16px',
              borderRadius: '16px',
              maxWidth: '80%',
              borderBottomLeftRadius: m.role === 'model' ? 0 : '16px',
              borderBottomRightRadius: m.role === 'user' ? 0 : '16px',
            }}
          >
            {m.role === 'model' && <div style={{fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px'}}>🦊 Fuxie</div>}
            
            <div style={{ lineHeight: '1.5' }}>
               {m.role === 'user' && m.words && m.words.length > 0 ? (
                 m.words.map((w, wIdx) => {
                     let color = "white";
                     if (w.errorType !== 'None') color = "#fca5a5"; // Red for omissions etc.
                     else if (w.accuracyScore < 50) color = "#fca5a5";
                     else if (w.accuracyScore < 80) color = "#fef08a"; // Yellow for medium
                     else color = "#86efac"; // Green for good

                     return (
                         <span key={wIdx} style={{ color, marginRight: '4px', display: 'inline-block' }}>
                             {w.word}
                         </span>
                     )
                 })
               ) : (
                 m.text
               )}
            </div>

            {m.score !== undefined && (
               <div style={{fontSize: '0.9rem', marginTop: '8px', color: m.score >= 80 ? '#86efac' : '#fca5a5', fontWeight: 600}}>
                 Phát âm: {m.score}%
               </div>
            )}
          </motion.div>
        ))}
        {state === 'processing' && (
          <motion.div style={{ alignSelf: 'flex-start', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader2 className={styles.spinnerIcon} /> Fuxie đang gõ...
          </motion.div>
        )}
      </div>

      <div className={styles.waveformContainer} style={{ background: '#0f172a', borderTop: '1px solid #1e293b', padding: '24px 0', flexShrink: 0 }}>
        {state === 'recording' && <canvas ref={canvasRef} width={400} height={60} style={{margin: '0 auto', display: 'block'}}/>}
        {micError && <div style={{color: '#f87171', textAlign: 'center'}}>{micError}</div>}
        
        <div className={styles.recordBtnWrap} style={{ marginTop: state === 'recording' ? '12px' : 0 }}>
          {state === 'recording' ? (
            <motion.button whileTap={{ scale: 0.9 }} className={`${styles.recordBtn} ${styles.recordBtnRecording}`} onClick={stopRecording}>
               <Square fill="currentColor" size={24} />
            </motion.button>
          ) : (
            <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className={`${styles.recordBtn} ${styles.recordBtnIdle}`} onClick={startRecording} disabled={state === 'processing' || state === 'playing'}>
               <Mic size={28} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
