'use client'
import { useState, useRef, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Mic, Square, Loader2, Send } from 'lucide-react'
import styles from './speaking.module.css'
import { MascotImage } from '../shared/mascot-image'
import { speakWithBrowserTTS, cancelBrowserTTS } from '@/lib/audio/browser-tts'
import { startWaveformAnimation } from '@/lib/audio/waveform'

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
  onComplete: (score: number, detail?: { scoredResponses: number; gradingResult?: any }) => void
}

export default function TurnBasedSpeakingPlayer({ level, scenario, onClose, onComplete }: Props) {
  const t = useTranslations('Speaking')
  const [messages, setMessages] = useState<Message[]>([])
  const [state, setState] = useState<'idle' | 'recording' | 'processing' | 'playing' | 'loading_grade'>('idle')
  const [micError, setMicError] = useState<string | null>(null)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animFrameRef = useRef<number>(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const aiAudioRef = useRef<HTMLAudioElement>(null)
  const isMountedRef = useRef(true)
  const stopWaveformRef = useRef<(() => void) | null>(null)
  const scoredResponseCount = messages.filter(m => m.role === 'user' && typeof m.score === 'number').length
  const hasScenarioPrompt = messages.some(m => m.role === 'model')

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
        aiAudioRef.current.onended = () => { if (isMountedRef.current) setState('idle') }
      }
    } else {
      // Browser fallback using shared utility
      setState('playing')
      speakWithBrowserTTS(text, {
        onEnd: () => { if (isMountedRef.current) setState('idle') },
      })
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

  // Comprehensive unmount cleanup — prevents mic leak, AudioContext leak, animation leak
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      cancelBrowserTTS()
      stopWaveformRef.current?.()
      if (mediaRecorderRef.current?.state === 'recording') {
        mediaRecorderRef.current.stop()
      }
      disposeRecordingResources()
    }
  }, [disposeRecordingResources])

  const startRecording = async () => {
    setMicError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      // Visuals — singleton AudioContext pattern
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

      // Use shared waveform animation
      stopWaveformRef.current?.()
      if (canvasRef.current) {
        stopWaveformRef.current = startWaveformAnimation(canvasRef.current, analyser, { style: 'bars' })
      }

      recorder.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => processAudio(new Blob(chunksRef.current, { type: 'audio/webm' }))
      
      mediaRecorderRef.current = recorder
      recorder.start()
      setState('recording')
    } catch (err) {
      setMicError(t('micError'))
      setState('idle')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    stopWaveformRef.current?.()
    stopWaveformRef.current = null
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
        setMicError(data.error || t('sttError'))
        setState('idle')
      }
    } catch (err) {
      console.error(err)
      setState('idle')
    }
  }

  // drawWaveform is now handled by startWaveformAnimation from @/lib/audio/waveform.ts

  const finishConversation = async () => {
    const userMessages = messages.filter(m => m.role === 'user');
    if (userMessages.length === 0) {
        onComplete(0, { scoredResponses: 0 });
        return;
    }
    
    // Generate transcript
    const transcript = messages.map(m => `${m.role === 'model' ? 'Fuxie' : 'Learner'}: ${m.text}`).join('\n');
    
    setState('loading_grade');
    
    try {
        const res = await fetch('/api/v1/grade', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'speaking',
                cefrLevel: level,
                scenario: scenario,
                transcript: transcript,
                uiLanguage: 'vi' // Could come from profile context, assuming vi for now
            })
        });
        const result = await res.json();
        
        if (result.success && result.data) {
            onComplete(result.data.percentScore, { 
                scoredResponses: userMessages.length,
                gradingResult: result.data
            });
            return;
        }
    } catch (e) {
        console.error('Failed to grade roleplay', e);
    }
    
    // Fallback to simple STT average if API fails
    const scoredMessages = userMessages.filter(m => typeof m.score === 'number');
    const avg = scoredMessages.length > 0 
        ? Math.round(scoredMessages.reduce((acc, m) => acc + (m.score || 0), 0) / scoredMessages.length)
        : 0;
    onComplete(avg, { scoredResponses: userMessages.length });
  };

  return (
    <div className={styles.lessonPlayer} style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '600px'}}>
      <audio ref={aiAudioRef} style={{display: 'none'}} />
      
      <div className={styles.progressBarWrap} style={{flexShrink: 0}}>
        <div className={styles.progressBarInner}>
          <button
            className={styles.progressBarClose}
            onClick={onClose}
            aria-label={t('closeRoleplay')}
            title={t('closeRoleplay')}
          >
            ✕
          </button>
          <div className={styles.progressBarTrack}>
            <div className={styles.progressBarFill} style={{ width: `100%` }} />
          </div>
          <span className={styles.progressBarStep}>Roleplay: {scenario}</span>
          <button 
            onClick={finishConversation}
            disabled={state === 'loading_grade' || state === 'processing' || state === 'recording'}
            aria-label={t('finishRoleplay')}
            title={t('finishRoleplay')}
            style={{marginLeft: 'auto', background: '#3b82f6', color: 'white', border: 'none', padding: '4px 12px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600, opacity: (state === 'loading_grade' || state === 'processing' || state === 'recording') ? 0.5 : 1}}
          >
            {state === 'loading_grade' ? t('gradingTitle') : t('finishBtn')}
          </button>
        </div>
      </div>

      <div
        aria-label={t('completionChecklist')}
        style={{
          flexShrink: 0,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
          gap: '8px',
          padding: '12px 16px',
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        {[
          { label: t('checklistListen'), done: hasScenarioPrompt, detail: t('scenarioPrompt') },
          { label: t('checklistRecord'), done: scoredResponseCount > 0, detail: scoredResponseCount > 0 ? `${scoredResponseCount} ${t('checklistRecord').toLowerCase()}` : t('scoredResponseRequired') },
          { label: t('checklistReceipt'), done: false, detail: t('endRoleplayDetail') },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              minWidth: 0,
              borderRadius: '12px',
              background: item.done ? '#ecfdf5' : '#ffffff',
              border: `1px solid ${item.done ? '#86efac' : '#cbd5e1'}`,
              padding: '8px',
            }}
          >
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: item.done ? '#166534' : '#1d4ed8', textTransform: 'uppercase' }}>
              {item.done ? t('doneStatus') : t('nextStatus')} - {item.label}
            </div>
            <div style={{ marginTop: '2px', fontSize: '0.78rem', fontWeight: 700, color: '#475569', overflowWrap: 'anywhere' }}>
              {item.detail}
            </div>
          </div>
        ))}
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
            {m.role === 'model' && <div style={{fontSize: '0.8rem', color: "var(--color-text-subtle)", marginBottom: '4px'}}>🦊 Fuxie</div>}
            
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
                 {t('pronunciationScore', { score: m.score })}
               </div>
            )}
          </motion.div>
        ))}
        {state === 'processing' && (
          <motion.div style={{ alignSelf: 'flex-start', color: "var(--color-text-subtle)", display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Loader2 className={styles.spinnerIcon} /> {t('fuxieTyping')}
          </motion.div>
        )}
      </div>

      <div className={styles.waveformContainer} style={{ background: '#0f172a', borderTop: '1px solid #1e293b', padding: '24px 0', flexShrink: 0 }}>
        {state === 'recording' && <canvas ref={canvasRef} width={400} height={60} style={{margin: '0 auto', display: 'block'}}/>}
        {micError && <div style={{color: 'var(--color-text-danger)', textAlign: 'center'}}>{micError}</div>}
        
        <div className={styles.recordBtnWrap} style={{ marginTop: state === 'recording' ? '12px' : 0 }}>
          {state === 'recording' ? (
            <motion.button
              whileTap={{ scale: 0.9 }}
              className={`${styles.recordBtn} ${styles.recordBtnRecording}`}
              onClick={stopRecording}
              aria-label={t('stopRecordingAria')}
              title={t('stopBtn')}
            >
               <Square fill="currentColor" size={24} />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`${styles.recordBtn} ${styles.recordBtnIdle}`}
              onClick={startRecording}
              disabled={state === 'processing' || state === 'playing'}
              aria-label={t('startRecordingAria')}
              title={t('startRecordingBtn')}
            >
               <Mic size={28} />
            </motion.button>
          )}
        </div>
      </div>
    </div>
  )
}
